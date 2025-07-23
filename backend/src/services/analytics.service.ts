import { db } from '../db/connection';
import * as schema from '../db/schema';
import { eq, and, sql, gte, lte, desc, count } from 'drizzle-orm';

export class AnalyticsService {
  async getStudentProgress(studentId: number): Promise<{
    totalExercises: number;
    completedExercises: number;
    averageScore: number;
    progressByModule: Array<{
      moduleId: number;
      moduleName: string;
      completed: number;
      total: number;
      averageScore: number;
    }>;
  }> {
    try {
      // Get total exercises completed by student
      const progressData = await db
        .select({
          exerciseId: schema.progress.exerciseId,
          score: schema.progress.pointsGagnes,
          completed: schema.progress.statut,
        })
        .from(schema.progress)
        .where(eq(schema.progress.studentId, studentId));

      const completedExercises = progressData.filter(p => p.completed === 'TERMINE');
      const totalExercises = progressData.length;
      const averageScore = completedExercises.length > 0 
        ? completedExercises.reduce((sum, p) => sum + (p.score || 0), 0) / completedExercises.length 
        : 0;

      // Get progress by module
      const progressByModule = await db
        .select({
          moduleId: schema.exercises.moduleId,
          moduleName: schema.modules.nom,
          completed: count(schema.progress.id),
          total: count(schema.exercises.id),
        })
        .from(schema.progress)
        .innerJoin(schema.exercises, eq(schema.progress.exerciseId, schema.exercises.id))
        .innerJoin(schema.modules, eq(schema.exercises.moduleId, schema.modules.id))
        .where(and(
          eq(schema.progress.studentId, studentId),
          eq(schema.progress.statut, 'TERMINE')
        ))
        .groupBy(schema.exercises.moduleId, schema.modules.nom);

      return {
        totalExercises,
        completedExercises: completedExercises.length,
        averageScore,
        progressByModule: progressByModule.map(p => ({
          moduleId: p.moduleId,
          moduleName: p.moduleName,
          completed: Number(p.completed),
          total: Number(p.total),
          averageScore: 0, // Would need additional query to calculate
        })),
      };
    } catch (error) {
      console.error('Error getting student progress:', error);
      return {
        totalExercises: 0,
        completedExercises: 0,
        averageScore: 0,
        progressByModule: [],
      };
    }
  }

  async getStudentSessionStats(studentId: number, days: number = 30): Promise<{
    totalSessions: number;
    averageSessionDuration: number;
    totalPoints: number;
    exercisesCompleted: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sessions = await db
        .select({
          dureeSecondes: schema.sessions.dureeSecondes,
          pointsGagnes: schema.sessions.pointsGagnes,
          exercicesCompletes: schema.sessions.exercicesCompletes,
        })
        .from(schema.sessions)
        .where(and(
          eq(schema.sessions.studentId, studentId),
          gte(schema.sessions.dateDebut, startDate)
        ));

      const totalSessions = sessions.length;
      const averageSessionDuration = totalSessions > 0 
        ? sessions.reduce((sum, s) => sum + s.dureeSecondes, 0) / totalSessions 
        : 0;
      const totalPoints = sessions.reduce((sum, s) => sum + s.pointsGagnes, 0);
      const exercisesCompleted = sessions.reduce((sum, s) => sum + s.exercicesCompletes, 0);

      return {
        totalSessions,
        averageSessionDuration,
        totalPoints,
        exercisesCompleted,
      };
    } catch (error) {
      console.error('Error getting student session stats:', error);
      return {
        totalSessions: 0,
        averageSessionDuration: 0,
        totalPoints: 0,
        exercisesCompleted: 0,
      };
    }
  }

  async getExerciseCompletionRate(exerciseId: number): Promise<{
    totalAttempts: number;
    successfulAttempts: number;
    completionRate: number;
    averageScore: number;
  }> {
    try {
      const progress = await db
        .select({
          statut: schema.progress.statut,
          pointsGagnes: schema.progress.pointsGagnes,
        })
        .from(schema.progress)
        .where(eq(schema.progress.exerciseId, exerciseId));

      const totalAttempts = progress.length;
      const successfulAttempts = progress.filter(p => p.statut === 'TERMINE').length;
      const completionRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;
      const averageScore = successfulAttempts > 0 
        ? progress
            .filter(p => p.statut === 'TERMINE')
            .reduce((sum, p) => sum + (p.pointsGagnes || 0), 0) / successfulAttempts 
        : 0;

      return {
        totalAttempts,
        successfulAttempts,
        completionRate,
        averageScore,
      };
    } catch (error) {
      console.error('Error getting exercise completion rate:', error);
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        completionRate: 0,
        averageScore: 0,
      };
    }
  }
}
