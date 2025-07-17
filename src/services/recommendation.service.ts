import { eq, and, not, asc, inArray } from 'drizzle-orm';
import { students, exercises, modules, progress } from '../db/schema';

interface RecommendationOptions {
  limit?: number;
  niveau?: string;
  matiere?: string;
}

export class RecommendationService {
  constructor(
    private db: any,
    private cache: any
  ) {}

  async getRecommendations(
    studentId: number,
    options: RecommendationOptions = {}
  ): Promise<any[]> {
    const { limit = 10, niveau, matiere } = options;

    try {
      // Get student info
      const student = await this.db
        .select()
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);

      if (student.length === 0) {
        throw new Error('Student not found');
      }

      const studentData = student[0];

      // Get completed exercises
      const completedExercises = await this.db
        .select({ exerciseId: progress.exerciseId })
        .from(progress)
        .where(and(
          eq(progress.studentId, studentId),
          inArray(progress.statut, ['TERMINE', 'MAITRISE'])
        ));

      const completedIds = completedExercises.map(p => p.exerciseId);

      // Build recommendation query
      let query = this.db
        .select({
          id: exercises.id,
          titre: exercises.titre,
          consigne: exercises.consigne,
          type: exercises.type,
          difficulte: exercises.difficulte,
          pointsReussite: exercises.pointsReussite,
          dureeEstimee: exercises.dureeEstimee,
          ordre: exercises.ordre,
          moduleId: exercises.moduleId,
          moduleTitle: modules.titre,
          moduleMatiere: modules.matiere,
          moduleNiveau: modules.niveau,
        })
        .from(exercises)
        .innerJoin(modules, eq(exercises.moduleId, modules.id))
        .where(and(
          eq(exercises.actif, true),
          eq(modules.actif, true)
        ))
        .orderBy(asc(exercises.ordre));

      // Filter by student level if not specified
      if (!niveau) {
        query = query.where(and(
          eq(exercises.actif, true),
          eq(modules.actif, true),
          eq(modules.niveau, studentData.niveauActuel)
        ));
      } else {
        query = query.where(and(
          eq(exercises.actif, true),
          eq(modules.actif, true),
          eq(modules.niveau, niveau as any)
        ));
      }

      // Filter by subject if specified
      if (matiere) {
        query = query.where(and(
          eq(exercises.actif, true),
          eq(modules.actif, true),
          eq(modules.matiere, matiere as any)
        ));
      }

      // Exclude completed exercises
      if (completedIds.length > 0) {
        query = query.where(and(
          eq(exercises.actif, true),
          eq(modules.actif, true),
          not(inArray(exercises.id, completedIds))
        ));
      }

      const availableExercises = await query.limit(limit * 2); // Get more for better filtering

      // Apply intelligent recommendations
      const recommended = await this.applyRecommendationAlgorithm(
        availableExercises,
        studentData,
        limit
      );

      return recommended;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  private async applyRecommendationAlgorithm(
    exercises: any[],
    student: any,
    limit: number
  ): Promise<any[]> {
    // Get student performance data
    const studentProgress = await this.db
      .select()
      .from(progress)
      .where(eq(progress.studentId, student.id));

    // Calculate recommendation scores
    const scoredExercises = exercises.map(exercise => {
      let score = 0;

      // Base score by difficulty progression
      switch (exercise.difficulte) {
        case 'decouverte':
          score += 3;
          break;
        case 'consolidation':
          score += 2;
          break;
        case 'maitrise':
          score += 1;
          break;
      }

      // Boost score for student's weak subjects
      const subjectProgress = studentProgress.filter(p => 
        // This would need a join to get the subject, simplified for now
        true
      );

      const averageSuccess = subjectProgress.length > 0 
        ? subjectProgress.reduce((sum, p) => sum + parseFloat(p.tauxReussite), 0) / subjectProgress.length
        : 0;

      if (averageSuccess < 70) {
        score += 2; // Boost exercises in weak subjects
      }

      // Consider exercise order (prefer earlier exercises)
      score += Math.max(0, 10 - exercise.ordre);

      // Add some randomness for variety
      score += Math.random() * 2;

      return { ...exercise, recommendationScore: score };
    });

    // Sort by score and return top recommendations
    return scoredExercises
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit)
      .map(({ recommendationScore, ...exercise }) => exercise);
  }
} 