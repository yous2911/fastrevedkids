import {
  mysqlTable,
  serial,
  varchar,
  int,
  text,
  timestamp,
  boolean,
  decimal,
  json,
  mysqlEnum,
  index,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import type { StudentMetadata, ExerciseContent, ProgressHistory, SessionActions } from '../types';

// Enums
export const statutProgressionEnum = ['NON_COMMENCE', 'EN_COURS', 'TERMINE', 'ECHEC'] as const;
export const difficulteEnum = ['FACILE', 'MOYEN', 'DIFFICILE'] as const;

// Students table
export const students = mysqlTable('students', {
  id: serial('id').primaryKey(),
  prenom: varchar('prenom', { length: 100 }).notNull(),
  nom: varchar('nom', { length: 100 }).notNull(),
  age: int('age').notNull(),
  niveauActuel: varchar('niveau_actuel', { length: 50 }).notNull(),
  totalPoints: int('total_points').default(0).notNull(),
  serieJours: int('serie_jours').default(0).notNull(),
  // FIXED: Line 54:59 & 55:59 - Replace any with proper types
  preferences: json('preferences').$type<Record<string, unknown>>().default({}),
  metadata: json('metadata').$type<StudentMetadata>().default({}),
  dernierAcces: timestamp('dernier_acces'),
  estConnecte: boolean('est_connecte').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  prenomNomIdx: index('prenom_nom_idx').on(table.prenom, table.nom),
  niveauIdx: index('niveau_idx').on(table.niveauActuel),
  dernierAccesIdx: index('dernier_acces_idx').on(table.dernierAcces),
}));

// Modules table
export const modules = mysqlTable('modules', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull(),
  description: text('description'),
  niveau: varchar('niveau', { length: 50 }).notNull(),
  matiere: varchar('matiere', { length: 100 }).notNull(),
  ordre: int('ordre').notNull(),
  estActif: boolean('est_actif').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  niveauMatiereIdx: index('niveau_matiere_idx').on(table.niveau, table.matiere),
  ordreIdx: index('ordre_idx').on(table.ordre),
}));

// Exercises table
export const exercises = mysqlTable('exercises', {
  id: serial('id').primaryKey(),
  moduleId: int('module_id').notNull(),
  titre: varchar('titre', { length: 300 }).notNull(),
  // FIXED: Line 81:53 - Replace any with proper type
  contenu: json('contenu').$type<ExerciseContent>().notNull(),
  difficulte: mysqlEnum('difficulte', difficulteEnum).notNull(),
  matiere: varchar('matiere', { length: 100 }).notNull(),
  niveau: varchar('niveau', { length: 50 }).notNull(),
  ordre: int('ordre').notNull(),
  tempsEstime: int('temps_estime').default(300).notNull(), // seconds
  pointsMax: int('points_max').default(100).notNull(),
  estActif: boolean('est_actif').default(true).notNull(),
  // FIXED: Line 105:63 & 107:53 - Replace any with proper types
  metadata: json('metadata').$type<Record<string, unknown>>().default({}),
  donneesSupplementaires: json('donnees_supplementaires').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  moduleIdx: index('module_idx').on(table.moduleId),
  niveauMatiereIdx: index('niveau_matiere_idx').on(table.niveau, table.matiere),
  difficulteIdx: index('difficulte_idx').on(table.difficulte),
  ordreIdx: index('ordre_idx').on(table.ordre),
  moduleFk: foreignKey({
    columns: [table.moduleId],
    foreignColumns: [modules.id],
    name: 'exercises_module_fk'
  }).onDelete('cascade'),
}));

// Student progress table
export const progress = mysqlTable('progress', {
  id: serial('id').primaryKey(),
  studentId: int('student_id').notNull(),
  exerciseId: int('exercise_id').notNull(),
  statut: mysqlEnum('statut', statutProgressionEnum).default('NON_COMMENCE').notNull(),
  nombreTentatives: int('nombre_tentatives').default(0).notNull(),
  nombreReussites: int('nombre_reussites').default(0).notNull(),
  tauxReussite: decimal('taux_reussite', { precision: 5, scale: 2 }).default('0.00').notNull(),
  pointsGagnes: int('points_gagnes').default(0).notNull(),
  derniereTentative: timestamp('derniere_tentative'),
  premiereReussite: timestamp('premiere_reussite'),
  // FIXED: Line 138:48 - Replace any with proper type
  historique: json('historique').$type<ProgressHistory[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  studentExerciseIdx: index('student_exercise_idx').on(table.studentId, table.exerciseId),
  studentIdx: index('student_idx').on(table.studentId),
  exerciseIdx: index('exercise_idx').on(table.exerciseId),
  statutIdx: index('statut_idx').on(table.statut),
  studentFk: foreignKey({
    columns: [table.studentId],
    foreignColumns: [students.id],
    name: 'progress_student_fk'
  }).onDelete('cascade'),
  exerciseFk: foreignKey({
    columns: [table.exerciseId],
    foreignColumns: [exercises.id],
    name: 'progress_exercise_fk'
  }).onDelete('cascade'),
}));

// Student sessions table
export const sessions = mysqlTable('sessions', {
  id: serial('id').primaryKey(),
  studentId: int('student_id').notNull(),
  dateDebut: timestamp('date_debut').defaultNow().notNull(),
  dateFin: timestamp('date_fin'),
  dureeSecondes: int('duree_secondes').default(0).notNull(),
  exercicesCompletes: int('exercices_completes').default(0).notNull(),
  pointsGagnes: int('points_gagnes').default(0).notNull(),
  // FIXED: Line 171:65 & 172:53 - Replace any with proper types
  actionsUtilisateur: json('actions_utilisateur').$type<SessionActions[]>().default([]),
  metadata: json('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  studentIdx: index('student_idx').on(table.studentId),
  dateIdx: index('date_idx').on(table.dateDebut),
  studentFk: foreignKey({
    columns: [table.studentId],
    foreignColumns: [students.id],
    name: 'sessions_student_fk'
  }).onDelete('cascade'),
}));

// Scheduled revisions table (spaced repetition)
export const revisions = mysqlTable('revisions', {
  id: serial('id').primaryKey(),
  studentId: int('student_id').notNull(),
  exerciseId: int('exercise_id').notNull(),
  prochaineRevision: timestamp('prochaine_revision').notNull(),
  intervalleJours: int('intervalle_jours').default(1).notNull(),
  nombreRevisions: int('nombre_revisions').default(0).notNull(),
  facteurDifficulte: decimal('facteur_difficulte', { precision: 3, scale: 2 }).default('1.00').notNull(),
  revisionEffectuee: boolean('revision_effectuee').default(false).notNull(),
  // FIXED: Line 201:53 - Replace any with proper type
  metadata: json('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  studentExerciseIdx: index('student_exercise_idx').on(table.studentId, table.exerciseId),
  prochaineRevisionIdx: index('prochaine_revision_idx').on(table.prochaineRevision),
  studentFk: foreignKey({
    columns: [table.studentId],
    foreignColumns: [students.id],
    name: 'revisions_student_fk'
  }).onDelete('cascade'),
  exerciseFk: foreignKey({
    columns: [table.exerciseId],
    foreignColumns: [exercises.id],
    name: 'revisions_exercise_fk'
  }).onDelete('cascade'),
}));

// Relations
export const studentsRelations = relations(students, ({ many }) => ({
  progress: many(progress),
  sessions: many(sessions),
  revisions: many(revisions),
}));

export const modulesRelations = relations(modules, ({ many }) => ({
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  module: one(modules, {
    fields: [exercises.moduleId],
    references: [modules.id],
  }),
  progress: many(progress),
  revisions: many(revisions),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  student: one(students, {
    fields: [progress.studentId],
    references: [students.id],
  }),
  exercise: one(exercises, {
    fields: [progress.exerciseId],
    references: [exercises.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  student: one(students, {
    fields: [sessions.studentId],
    references: [students.id],
  }),
}));

export const revisionsRelations = relations(revisions, ({ one }) => ({
  student: one(students, {
    fields: [revisions.studentId],
    references: [students.id],
  }),
  exercise: one(exercises, {
    fields: [revisions.exerciseId],
    references: [exercises.id],
  }),
}));

// Export types
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Progress = typeof progress.$inferSelect;
export type NewProgress = typeof progress.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Revision = typeof revisions.$inferSelect;
export type NewRevision = typeof revisions.$inferInsert;
