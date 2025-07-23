import { db } from '../db/connection';
import * as schema from '../db/schema';
import { eq, and, sql, not, desc } from 'drizzle-orm';
import type { Exercise, Student, NewProgress } from '../db/schema';

export class RecommendationService {
  async getRecommendedExercises(studentId: number, limit: number = 5): Promise<Exercise[]> {
    try {
      const student = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, studentId))
        .limit(1);

      if (!student[0]) {
        return [];
      }

      // Get exercises the student has already completed
      const completedExercises = await db
        .select({ exerciseId: schema.progress.exerciseId })
        .from(schema.progress)
        .where(and(
          eq(schema.progress.studentId, studentId),
          eq(schema.progress.statut, 'TERMINE')
        ));

      const completedIds = completedExercises.map(p => p.exerciseId);

      // Get recommended exercises based on student's niveau
      const whereConditions = [
        eq(schema.exercises.niveau, student[0].niveauActuel),
        eq(schema.exercises.estActif, true)
      ];

      // Exclude completed exercises if any exist
      if (completedIds.length > 0) {
        whereConditions.push(not(sql`${schema.exercises.id} IN (${completedIds.map(() => '?').join(',')})`));
      }

      const recommendedExercises = await db
        .select()
        .from(schema.exercises)
        .where(and(...whereConditions))
        .orderBy(sql`RAND()`)
        .limit(limit);

      return recommendedExercises;
    } catch (error) {
      console.error('Error getting recommended exercises:', error);
      return [];
    }
  }

  async getNextExercise(studentId: number, moduleId?: number): Promise<Exercise | null> {
    try {
      const student = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, studentId))
        .limit(1);

      if (!student[0]) {
        return null;
      }

      // Get exercises the student has already completed
      const completedExercises = await db
        .select({ exerciseId: schema.progress.exerciseId })
        .from(schema.progress)
        .where(and(
          eq(schema.progress.studentId, studentId),
          eq(schema.progress.statut, 'TERMINE')
        ));

      const completedIds = completedExercises.map(p => p.exerciseId);

      // Build where conditions
      const whereConditions = [
        eq(schema.exercises.niveau, student[0].niveauActuel),
        eq(schema.exercises.estActif, true)
      ];

      // Add module filter if specified
      if (moduleId) {
        whereConditions.push(eq(schema.exercises.moduleId, moduleId));
      }

      // Exclude completed exercises if any exist
      if (completedIds.length > 0) {
        whereConditions.push(not(sql`${schema.exercises.id} IN (${completedIds.map(() => '?').join(',')})`));
      }

      const nextExercise = await db
        .select()
        .from(schema.exercises)
        .where(and(...whereConditions))
        .orderBy(schema.exercises.ordre)
        .limit(1);

      return nextExercise[0] || null;
    } catch (error) {
      console.error('Error getting next exercise:', error);
      return null;
    }
  }

  async recordExerciseAttempt(data: {
    studentId: number;
    exerciseId: number;
    score: number;
    completed: boolean;
    timeSpent?: number;
  }): Promise<boolean> {
    try {
      // Check if progress record exists
      const existingProgress = await db
        .select()
        .from(schema.progress)
        .where(and(
          eq(schema.progress.studentId, data.studentId),
          eq(schema.progress.exerciseId, data.exerciseId)
        ))
        .limit(1);

      const statut = data.completed ? 'TERMINE' : 'ECHEC';
      const pointsGagnes = data.completed ? Math.round(data.score) : 0;

      if (existingProgress[0]) {
        // Update existing progress
        await db
          .update(schema.progress)
          .set({
            statut,
            nombreTentatives: sql`nombre_tentatives + 1`,
            nombreReussites: data.completed ? sql`nombre_reussites + 1` : sql`nombre_reussites`,
            tauxReussite: sql`(nombre_reussites + ${data.completed ? 1 : 0}) * 100.0 / (nombre_tentatives + 1)`,
            pointsGagnes: sql`points_gagnes + ${pointsGagnes}`,
            derniereTentative: new Date(),
            premiereReussite: data.completed && !existingProgress[0].premiereReussite ? new Date() : existingProgress[0].premiereReussite,
            updatedAt: new Date(),
          })
          .where(and(
            eq(schema.progress.studentId, data.studentId),
            eq(schema.progress.exerciseId, data.exerciseId)
          ));
      } else {
        // Create new progress record
        const newProgress: NewProgress = {
          studentId: data.studentId,
          exerciseId: data.exerciseId,
          statut,
          nombreTentatives: 1,
          nombreReussites: data.completed ? 1 : 0,
          tauxReussite: data.completed ? '100.00' : '0.00',
          pointsGagnes,
          derniereTentative: new Date(),
          premiereReussite: data.completed ? new Date() : null,
          historique: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(schema.progress).values(newProgress);
      }

      // Update student's total points if completed
      if (data.completed) {
        await db
          .update(schema.students)
          .set({
            totalPoints: sql`total_points + ${pointsGagnes}`,
            updatedAt: new Date(),
          })
          .where(eq(schema.students.id, data.studentId));
      }

      return true;
    } catch (error) {
      console.error('Error recording exercise attempt:', error);
      return false;
    }
  }

  async getExercisesByDifficulty(studentId: number, difficulte: 'FACILE' | 'MOYEN' | 'DIFFICILE'): Promise<Exercise[]> {
    try {
      const student = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, studentId))
        .limit(1);

      if (!student[0]) {
        return [];
      }

      const exercises = await db
        .select()
        .from(schema.exercises)
        .where(and(
          eq(schema.exercises.niveau, student[0].niveauActuel),
          eq(schema.exercises.difficulte, difficulte),
          eq(schema.exercises.estActif, true)
        ))
        .orderBy(schema.exercises.ordre);

      return exercises;
    } catch (error) {
      console.error('Error getting exercises by difficulty:', error);
      return [];
    }
  }

  async getExercisesBySubject(studentId: number, matiere: string): Promise<Exercise[]> {
    try {
      const student = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, studentId))
        .limit(1);

      if (!student[0]) {
        return [];
      }

      const exercises = await db
        .select()
        .from(schema.exercises)
        .where(and(
          eq(schema.exercises.niveau, student[0].niveauActuel),
          eq(schema.exercises.matiere, matiere),
          eq(schema.exercises.estActif, true)
        ))
        .orderBy(schema.exercises.ordre);

      return exercises;
    } catch (error) {
      console.error('Error getting exercises by subject:', error);
      return [];
    }
  }

  async getStudentWeaknesses(studentId: number): Promise<{
    matiere: string;
    difficulte: string;
    count: number;
  }[]> {
    try {
      // Get exercises where student failed or struggled
      const weakAreas = await db
        .select({
          matiere: schema.exercises.matiere,
          difficulte: schema.exercises.difficulte,
          count: sql<number>`count(*)`,
        })
        .from(schema.progress)
        .innerJoin(schema.exercises, eq(schema.progress.exerciseId, schema.exercises.id))
        .where(and(
          eq(schema.progress.studentId, studentId),
          eq(schema.progress.statut, 'ECHEC')
        ))
        .groupBy(schema.exercises.matiere, schema.exercises.difficulte)
        .orderBy(desc(sql`count(*)`));

      return weakAreas.map(area => ({
        matiere: area.matiere,
        difficulte: area.difficulte,
        count: Number(area.count),
      }));
    } catch (error) {
      console.error('Error getting student weaknesses:', error);
      return [];
    }
  }

  async getPersonalizedRecommendations(studentId: number, limit: number = 10): Promise<Exercise[]> {
    try {
      const weaknesses = await this.getStudentWeaknesses(studentId);
      
      if (weaknesses.length === 0) {
        // If no weaknesses, recommend based on current level
        return await this.getRecommendedExercises(studentId, limit);
      }

      // Focus on weakest areas
      const recommendations: Exercise[] = [];
      
      for (const weakness of weaknesses.slice(0, 3)) { // Top 3 weak areas
        const exercises = await db
          .select()
          .from(schema.exercises)
          .where(and(
            eq(schema.exercises.matiere, weakness.matiere),
            eq(schema.exercises.difficulte, weakness.difficulte as 'FACILE' | 'MOYEN' | 'DIFFICILE'),
            eq(schema.exercises.estActif, true)
          ))
          .orderBy(sql`RAND()`)
          .limit(Math.ceil(limit / 3));

        recommendations.push(...exercises);
      }

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }
}
