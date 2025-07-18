import { students, progress, exercises } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { RecommendationScore, ExerciseRecommendation } from '../types/index.js';

export class RecommendationService {
  // FIXED: Lines 12:17 & 13:20 - Replace any with proper types
  private scores: RecommendationScore[] = [];
  private cache: Map<string, ExerciseRecommendation[]> = new Map();

  // FIXED: Line 16:93 - Replace any with proper parameter types
  async getRecommendations(studentId: number, options: {
    limit?: number;
    niveau?: string;
    matiere?: string;
  } = {}): Promise<ExerciseRecommendation[]> {
    // FIXED: Line 17 - Remove unused variables, use options directly
    const { limit = 10, niveau, matiere } = options;

    const cacheKey = `recommendations_${studentId}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // FIXED: Line 40:60 - Replace any with proper query result
    const studentProgress = await progress.findMany({
      where: eq(progress.studentId, studentId)
    });

    // FIXED: Line 68:65 - Replace any with proper exercise query
    const availableExercises = await exercises.findMany({
      where: and(
        niveau ? eq(exercises.niveau, niveau) : undefined,
        matiere ? eq(exercises.matiere, matiere) : undefined
      )
    });

    // FIXED: Line 84:63 - Replace any with recommendation calculation
    const recommendations: ExerciseRecommendation[] = availableExercises
      .map(exercise => {
        const score = this.calculateRecommendationScore(exercise, studentProgress);
        return {
          exercise,
          score: score.score,
          reasons: score.reasons,
          metadata: {
            difficulty: exercise.difficulte,
            estimatedTime: exercise.tempsEstime,
          },
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    this.cache.set(cacheKey, recommendations);
    return recommendations;
  }

  // FIXED: Lines 94:19, 94:27, 96:25 - Replace any with proper types
  private calculateRecommendationScore(
    exercise: typeof exercises.$inferSelect,
    studentProgress: (typeof progress.$inferSelect)[]
  ): RecommendationScore {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Check if student has attempted this exercise
    const attemptedExercise = studentProgress.find(p => p.exerciseId === exercise.id);
    
    if (!attemptedExercise) {
      score += 20;
      reasons.push('Nouvel exercice à découvrir');
    } else if (attemptedExercise.statut === 'ECHEC') {
      score += 30;
      reasons.push('Exercice à réviser après échec');
    } else if (parseFloat(attemptedExercise.tauxReussite) < 70) {
      score += 25;
      reasons.push('Exercice à améliorer');
    }

    // FIXED: Lines 114:16, 115:14, 117:14 - Replace any with proper difficulty scoring
    const difficultyScore = this.getDifficultyScore(exercise.difficulte);
    const subjectScore = this.getSubjectScore(exercise.matiere, studentProgress);
    const levelScore = this.getLevelScore(exercise.niveau, studentProgress);

    score += difficultyScore + subjectScore + levelScore;

    return {
      score: Math.min(score, 100),
      reasons,
    };
  }

  private getDifficultyScore(difficulty: string): number {
    switch (difficulty) {
      case 'FACILE': return 10;
      case 'MOYEN': return 20;
      case 'DIFFICILE': return 30;
      default: return 15;
    }
  }

  private getSubjectScore(subject: string, studentProgress: (typeof progress.$inferSelect)[]): number {
    const subjectProgress = studentProgress.filter(p => p.exercise?.matiere === subject);
    if (subjectProgress.length === 0) return 15; // New subject bonus
    
    const averageScore = subjectProgress.reduce((sum, p) => sum + parseFloat(p.tauxReussite), 0) / subjectProgress.length;
    return averageScore < 50 ? 25 : 5; // Help with weak subjects
  }

  private getLevelScore(level: string, studentProgress: (typeof progress.$inferSelect)[]): number {
    const levelProgress = studentProgress.filter(p => p.exercise?.niveau === level);
    if (levelProgress.length === 0) return 10; // New level bonus
    
    const averageScore = levelProgress.reduce((sum, p) => sum + parseFloat(p.tauxReussite), 0) / levelProgress.length;
    return averageScore < 60 ? 20 : 0; // Help with weak levels
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  async getCacheStats(): Promise<{ size: number; keys: string[] }> {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
