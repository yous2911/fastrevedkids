import { eq, and, gte } from 'drizzle-orm';
import { students, progress, sessions, exercises } from '../db/schema';

export class AnalyticsService {
  constructor(
    private db: any,
    private cache: any
  ) {}

  // Get student analytics
  async getStudentAnalytics(studentId: number, days: number = 30): Promise<any> {
    const cacheKey = `analytics:student:${studentId}:${days}`;
    
    try {
      // Try to get from cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get progress data
      const progressData = await this.db
        .select({
          totalAttempts: progress.nombreTentatives,
          successfulAttempts: progress.nombreReussites,
          pointsEarned: progress.pointsGagnes,
          lastAttempt: progress.derniereTentative,
        })
        .from(progress)
        .where(
          and(
            eq(progress.studentId, studentId),
            gte(progress.derniereTentative, startDate)
          )
        );

      // Get session data
      const sessionData = await this.db
        .select({
          totalSessions: sessions.id,
          totalDuration: sessions.dureeSecondes,
          exercisesCompleted: sessions.exercicesCompletes,
          pointsEarned: sessions.pointsGagnes,
        })
        .from(sessions)
        .where(
          and(
            eq(sessions.studentId, studentId),
            gte(sessions.dateDebut, startDate)
          )
        );

      // Calculate analytics
      const analytics = {
        period: `${days} days`,
        progress: {
          totalAttempts: progressData.reduce((sum: number, p: any) => sum + (p.totalAttempts || 0), 0),
          successfulAttempts: progressData.reduce((sum: number, p: any) => sum + (p.successfulAttempts || 0), 0),
          successRate: progressData.length > 0 
            ? (progressData.reduce((sum: number, p: any) => sum + (p.successfulAttempts || 0), 0) / 
               progressData.reduce((sum: number, p: any) => sum + (p.totalAttempts || 0), 0)) * 100
            : 0,
          totalPoints: progressData.reduce((sum: number, p: any) => sum + (p.pointsEarned || 0), 0),
        },
        sessions: {
          totalSessions: sessionData.length,
          totalDuration: sessionData.reduce((sum: number, s: any) => sum + (s.totalDuration || 0), 0),
          exercisesCompleted: sessionData.reduce((sum: number, s: any) => sum + (s.exercisesCompleted || 0), 0),
          pointsEarned: sessionData.reduce((sum: number, s: any) => sum + (s.pointsEarned || 0), 0),
          averageSessionDuration: sessionData.length > 0 
            ? sessionData.reduce((sum: number, s: any) => sum + (s.totalDuration || 0), 0) / sessionData.length
            : 0,
        },
        trends: {
          dailyActivity: await this.getDailyActivity(studentId, days),
          subjectPerformance: await this.getSubjectPerformance(studentId, days),
        },
      };

      // Cache the result
      await this.cache.set(cacheKey, JSON.stringify(analytics), 3600); // 1 hour

      return analytics;
    } catch (error) {
      console.error('Error getting student analytics:', error);
      return null;
    }
  }

  // Get daily activity for the specified period
  private async getDailyActivity(studentId: number, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const dailySessions = await this.db
        .select({
          date: sessions.dateDebut,
          duration: sessions.dureeSecondes,
          exercises: sessions.exercicesCompletes,
          points: sessions.pointsGagnes,
        })
        .from(sessions)
        .where(
          and(
            eq(sessions.studentId, studentId),
            gte(sessions.dateDebut, startDate)
          )
        )
        .orderBy(sessions.dateDebut);

      // Group by date
      const dailyActivity = new Map();
      dailySessions.forEach((session: any) => {
        const date = session.date.toISOString().split('T')[0];
        if (!dailyActivity.has(date)) {
          dailyActivity.set(date, {
            date,
            duration: 0,
            exercises: 0,
            points: 0,
            sessions: 0,
          });
        }
        const day = dailyActivity.get(date);
        day.duration += session.duration || 0;
        day.exercises += session.exercises || 0;
        day.points += session.points || 0;
        day.sessions += 1;
      });

      return Array.from(dailyActivity.values());
    } catch (error) {
      console.error('Error getting daily activity:', error);
      return [];
    }
  }

  // Get subject performance
  private async getSubjectPerformance(studentId: number, days: number): Promise<any[]> {
    // This would require joining with exercises and modules tables
    // For now, return empty array
    return [];
  }

  // Get system-wide analytics
  async getSystemAnalytics(): Promise<any> {
    const cacheKey = 'analytics:system';
    
    try {
      // Try to get from cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get basic system stats
      const stats = {
        totalStudents: await this.getTotalStudents(),
        totalExercises: await this.getTotalExercises(),
        totalSessions: await this.getTotalSessions(),
        averageSessionDuration: await this.getAverageSessionDuration(),
        mostPopularExercises: await this.getMostPopularExercises(),
      };

      // Cache the result
      await this.cache.set(cacheKey, JSON.stringify(stats), 1800); // 30 minutes

      return stats;
    } catch (error) {
      console.error('Error getting system analytics:', error);
      return null;
    }
  }

  // Helper methods for system analytics
  private async getTotalStudents(): Promise<number> {
    try {
      const result = await this.db.select({ count: students.id }).from(students);
      return result.length;
    } catch (error) {
      return 0;
    }
  }

  private async getTotalExercises(): Promise<number> {
    try {
      const result = await this.db.select({ count: exercises.id }).from(exercises);
      return result.length;
    } catch (error) {
      return 0;
    }
  }

  private async getTotalSessions(): Promise<number> {
    try {
      const result = await this.db.select({ count: sessions.id }).from(sessions);
      return result.length;
    } catch (error) {
      return 0;
    }
  }

  private async getAverageSessionDuration(): Promise<number> {
    try {
      const result = await this.db
        .select({ duration: sessions.dureeSecondes })
        .from(sessions);
      
      if (result.length === 0) return 0;
      
      const totalDuration = result.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
      return totalDuration / result.length;
    } catch (error) {
      return 0;
    }
  }

  private async getMostPopularExercises(): Promise<any[]> {
    // This would require aggregating progress data
    // For now, return empty array
    return [];
  }
} 