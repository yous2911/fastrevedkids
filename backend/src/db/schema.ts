import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Students table
export const students = sqliteTable('students', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  prenom: text('prenom').notNull(),
  nom: text('nom').notNull(),
  dateNaissance: text('date_naissance').notNull(),
  niveauActuel: text('niveau_actuel').notNull(),
  totalPoints: integer('total_points').default(0),
  serieJours: integer('serie_jours').default(0),
  mascotteType: text('mascotte_type').default('dragon'),
  dernierAcces: text('dernier_acces'),
  estConnecte: integer('est_connecte', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Exercises table
export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  titre: text('titre').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  difficulte: text('difficulte').notNull(),
  xp: integer('xp').default(10),
  configuration: text('configuration'), // JSON string
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Student progress table
export const studentProgress = sqliteTable('student_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').notNull().references(() => students.id),
  exerciseId: integer('exercise_id').notNull().references(() => exercises.id),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  score: integer('score').default(0),
  timeSpent: integer('time_spent').default(0), // in seconds
  attempts: integer('attempts').default(0),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
