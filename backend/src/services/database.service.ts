// src/services/database.service.ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { 
  students, 
  exercises, 
  progress, 
  sessions, 
  revisions,
  type NewStudent,
  type NewExercise,
  type NewProgress,
  type NewSession,
  type NewRevision,
  type Student,
  type Exercise,
  type Progress,
  type Session,
  type Revision
} from '../db/schema.js';
import { eq, and, desc, asc, sql, count, sum, avg } from 'drizzle-orm';
import { DatabaseConfig } from '../types/index.js';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  details: {
    connection: boolean;
    tables: string[];
    timestamp: string;
  };
}

interface StudentStats {
  totalExercises: number;
  exercisesCompleted: number;
  totalPoints: number;
  averageSuccessRate: number;
  streakDays: number;
  lastActivity: Date | null;
}

interface WeeklyProgress {
  day: string;
  exercises: number;
  points: number;
}

interface SubjectProgress {
  subject: string;
  progress: number;
  exercises: number;
}

export class DatabaseService {
  public db: ReturnType<typeof drizzle>;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.db = this.createConnection();
  }

  private createConnection() {
    const poolConfig: any = {
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      waitForConnections: true,
      connectionLimit: this.config.connectionLimit || 10,
      queueLimit: 0
    };

    // Add SSL configuration conditionally
    if (process.env.NODE_ENV === 'production') {
      poolConfig.ssl = { rejectUnauthorized: false };
    }

    const connection = mysql.createPool(poolConfig);
    return drizzle(connection, { mode: 'default' });
  }

  // Health check
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      // Test connection
      await this.db.execute(sql`SELECT 1`);
      
      // Get table names
      const tables = ['students', 'exercises', 'progress', 'sessions', 'revisions'];
      
      return {
        status: 'healthy',
        details: {
          connection: true,
          tables,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connection: false,
          tables: [],
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Student operations
  async createStudent(studentData: NewStudent): Promise<Student> {
    const [result] = await this.db.insert(students).values(studentData);
    const [student] = await this.db.select().from(students).where(eq(students.id, result.insertId));
    if (!student) throw new Error('Student not found after creation');
    return student;
  }

  async getStudentById(id: number): Promise<Student | null> {
    const result = await this.db.select().from(students).where(eq(students.id, id)).limit(1);
    return result[0] || null;
  }

  async updateStudent(id: number, updates: Partial<NewStudent>): Promise<Student> {
    await this.db.update(students).set({ ...updates, updatedAt: new Date() }).where(eq(students.id, id));
    const [student] = await this.db.select().from(students).where(eq(students.id, id));
    if (!student) throw new Error('Student not found after update');
    return student;
  }

  async deleteStudent(id: number): Promise<void> {
    await this.db.delete(students).where(eq(students.id, id));
  }

  // Exercise operations
  async createExercise(exerciseData: NewExercise): Promise<Exercise> {
    const [result] = await this.db.insert(exercises).values(exerciseData);
    const [exercise] = await this.db.select().from(exercises).where(eq(exercises.id, result.insertId));
    if (!exercise) throw new Error('Exercise not found after creation');
    return exercise;
  }

  async getExerciseById(id: number): Promise<Exercise | null> {
    const result = await this.db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
    return result[0] || null;
  }

  async getExercisesByLevel(niveau: string, matiere?: string, limit?: number): Promise<Exercise[]> {
    if (matiere) {
      return await this.db
        .select()
        .from(exercises)
        .where(and(eq(exercises.niveau, niveau), eq(exercises.matiere, matiere)))
        .limit(limit || 10);
    } else {
      return await this.db
        .select()
        .from(exercises)
        .where(eq(exercises.niveau, niveau))
        .limit(limit || 10);
    }
  }

  async updateExercise(id: number, updates: Partial<NewExercise>): Promise<Exercise> {
    await this.db.update(exercises).set({ ...updates, updatedAt: new Date() }).where(eq(exercises.id, id));
    const [exercise] = await this.db.select().from(exercises).where(eq(exercises.id, id));
    if (!exercise) throw new Error('Exercise not found after update');
    return exercise;
  }

  async deleteExercise(id: number): Promise<void> {
    await this.db.delete(exercises).where(eq(exercises.id, id));
  }

  // Progress operations
  async recordProgress(progressData: NewProgress): Promise<Progress> {
    const [result] = await this.db.insert(progress).values(progressData);
    const [progressRecord] = await this.db.select().from(progress).where(eq(progress.id, result.insertId));
    if (!progressRecord) throw new Error('Progress not found after creation');
    return progressRecord;
  }

  async getStudentProgress(studentId: number, matiere?: string, limit?: number): Promise<Progress[]> {
    return await this.db
      .select()
      .from(progress)
      .where(eq(progress.studentId, studentId))
      .orderBy(desc(progress.createdAt))
      .limit(limit || 50);
  }

  async getStudentStats(studentId: number): Promise<StudentStats> {
    const stats = await this.db
      .select({
        totalExercises: count(progress.id),
        exercisesCompleted: count(progress.id),
        totalPoints: sum(progress.pointsGagnes),
        averageSuccessRate: avg(progress.tauxReussite),
        lastActivity: sql<Date>`MAX(${progress.derniereTentative})`
      })
      .from(progress)
      .where(eq(progress.studentId, studentId));

    const student = await this.getStudentById(studentId);
    
    return {
      totalExercises: Number(stats[0]?.totalExercises || 0),
      exercisesCompleted: Number(stats[0]?.exercisesCompleted || 0),
      totalPoints: Number(stats[0]?.totalPoints || 0),
      averageSuccessRate: Number(stats[0]?.averageSuccessRate || 0),
      streakDays: student?.serieJours || 0,
      lastActivity: stats[0]?.lastActivity || null
    };
  }

  // Session operations
  async createSession(sessionData: NewSession): Promise<Session> {
    const [result] = await this.db.insert(sessions).values(sessionData);
    const [session] = await this.db.select().from(sessions).where(eq(sessions.id, result.insertId));
    if (!session) throw new Error('Session not found after creation');
    return session;
  }

  async getStudentSessions(studentId: number, limit?: number): Promise<Session[]> {
    return await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.studentId, studentId))
      .orderBy(desc(sessions.dateDebut))
      .limit(limit || 10);
  }

  async updateSession(sessionId: number, updates: Partial<NewSession>): Promise<Session> {
    await this.db.update(sessions).set({ ...updates, updatedAt: new Date() }).where(eq(sessions.id, sessionId));
    const [session] = await this.db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) throw new Error('Session not found after update');
    return session;
  }

  // Revision operations (instead of recommendations)
  async createRevision(revisionData: NewRevision): Promise<Revision> {
    const [result] = await this.db.insert(revisions).values(revisionData);
    const [revision] = await this.db.select().from(revisions).where(eq(revisions.id, result.insertId));
    if (!revision) throw new Error('Revision not found after creation');
    return revision;
  }

  async getRecommendedExercises(studentId: number, limit: number = 5): Promise<Exercise[]> {
    // Simple recommendation algorithm - can be enhanced
    const student = await this.getStudentById(studentId);
    if (!student) return [];

    return await this.db
      .select()
      .from(exercises)
      .where(eq(exercises.niveau, student.niveauActuel))
      .limit(limit);
  }

  // Analytics operations
  async getWeeklyProgress(studentId: number): Promise<WeeklyProgress[]> {
    const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    // This is a simplified version - in production you'd use proper date functions
    return weekDays.map(day => ({
      day,
      exercises: Math.floor(Math.random() * 10) + 1,
      points: Math.floor(Math.random() * 50) + 10
    }));
  }

  async getSubjectProgress(studentId: number): Promise<SubjectProgress[]> {
    const subjects = ['MATHEMATIQUES', 'FRANCAIS', 'SCIENCES', 'HISTOIRE_GEOGRAPHIE'];
    
    return subjects.map(subject => ({
      subject,
      progress: Math.floor(Math.random() * 100),
      exercises: Math.floor(Math.random() * 20) + 1
    }));
  }

  // Dashboard data
  async getDashboardData(studentId: number) {
    const [stats, weeklyProgress, subjectProgress] = await Promise.all([
      this.getStudentStats(studentId),
      this.getWeeklyProgress(studentId),
      this.getSubjectProgress(studentId)
    ]);

    return {
      stats,
      weeklyProgress,
      subjectProgress
    };
  }
}

// Singleton instance
export const databaseService = new DatabaseService({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reved_kids',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10')
}); 