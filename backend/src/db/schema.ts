import { mysqlTable, varchar, int, decimal, timestamp, text, boolean, json, date, longtext } from 'drizzle-orm/mysql-core';
import { InferInsertModel, InferSelectModel, relations, sql } from 'drizzle-orm';

// =============================================================================
// CORE TABLES
// =============================================================================

// Students table
export const students = mysqlTable('students', {
  id: int('id').primaryKey().autoincrement(),
  prenom: varchar('prenom', { length: 100 }).notNull(),
  nom: varchar('nom', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  dateNaissance: date('date_naissance').notNull(),
  niveauActuel: varchar('niveau_actuel', { length: 20 }).notNull(),
  totalPoints: int('total_points').default(0),
  serieJours: int('serie_jours').default(0),
  mascotteType: varchar('mascotte_type', { length: 50 }).default('dragon'),
  dernierAcces: timestamp('dernier_acces'),
  estConnecte: boolean('est_connecte').default(false),
  failedLoginAttempts: int('failed_login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires'),
  niveauScolaire: varchar('niveau_scolaire', { length: 20 }).notNull(),
  mascotteColor: varchar('mascotte_color', { length: 20 }).default('#ff6b35'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow()
});

// Exercises table
export const exercises = mysqlTable('exercises', {
  id: int('id').primaryKey().autoincrement(),
  titre: varchar('titre', { length: 200 }).notNull(),
  description: text('description'),
  matiere: varchar('matiere', { length: 50 }).notNull(),
  niveau: varchar('niveau', { length: 20 }).notNull(),
  difficulte: varchar('difficulte', { length: 30 }).notNull(),
  competenceCode: varchar('competence_code', { length: 20 }).notNull(),
  prerequis: json('prerequis'),
  contenu: json('contenu').notNull(),
  solution: json('solution').notNull(),
  pointsRecompense: int('points_recompense').default(10),
  tempsEstime: int('temps_estime').default(300),
  typeExercice: varchar('type_exercice', { length: 30 }).notNull(),
  xp: int('xp').default(10),
  configuration: text('configuration'),
  type: varchar('type', { length: 50 }).notNull(), // Legacy field for compatibility
  ordre: int('ordre').default(0),
  estActif: boolean('est_actif').default(true),
  metadonnees: json('metadonnees'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow()
});

// Student Progress table
export const studentProgress = mysqlTable('student_progress', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  exerciseId: int('exercise_id').notNull().references(() => exercises.id),
  competenceCode: varchar('competence_code', { length: 20 }).notNull(),
  progressPercent: decimal('progress_percent', { precision: 5, scale: 2 }).default('0.00'),
  masteryLevel: varchar('mastery_level', { length: 20 }).notNull().default('not_started'),
  totalAttempts: int('total_attempts').default(0),
  successfulAttempts: int('successful_attempts').default(0),
  averageScore: decimal('average_score', { precision: 5, scale: 2 }).default('0.00'),
  bestScore: decimal('best_score', { precision: 5, scale: 2 }).default('0.00'),
  totalTimeSpent: int('total_time_spent').default(0),
  lastAttemptAt: timestamp('last_attempt_at'),
  masteredAt: timestamp('mastered_at'),
  needsReview: boolean('needs_review').default(false),
  reviewScheduledAt: timestamp('review_scheduled_at'),
  streakCount: int('streak_count').default(0),
  difficultyPreference: varchar('difficulty_preference', { length: 30 }),
  // Legacy fields for compatibility
  completed: boolean('completed').default(false),
  score: decimal('score', { precision: 5, scale: 2 }).default('0.00'),
  timeSpent: int('time_spent').default(0),
  attempts: int('attempts').default(0),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow()
});

// Student Learning Path table
export const studentLearningPath = mysqlTable('student_learning_path', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  competenceCode: varchar('competence_code', { length: 20 }).notNull(),
  currentLevel: varchar('current_level', { length: 20 }).notNull().default('decouverte'),
  targetLevel: varchar('target_level', { length: 20 }).notNull().default('maitrise'),
  status: varchar('status', { length: 20 }).notNull().default('available'),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'),
  recommendedDifficulty: varchar('recommended_difficulty', { length: 30 }).notNull().default('decouverte'),
  estimatedCompletionTime: int('estimated_completion_time'),
  personalizedOrder: int('personalized_order').default(0),
  isBlocked: boolean('is_blocked').default(false),
  blockingReasons: json('blocking_reasons'),
  unlockedAt: timestamp('unlocked_at'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow()
});

// Sessions table
export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  studentId: int('student_id').references(() => students.id),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Revisions table
export const revisions = mysqlTable('revisions', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').references(() => students.id),
  exerciseId: int('exercise_id').references(() => exercises.id),
  revisionDate: date('revision_date').notNull(),
  score: int('score').default(0),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Modules table
export const modules = mysqlTable('modules', {
  id: int('id').primaryKey().autoincrement(),
  titre: varchar('titre', { length: 200 }).notNull(),
  matiere: varchar('matiere', { length: 50 }).notNull(),
  niveau: varchar('niveau', { length: 20 }).notNull(),
  ordre: int('ordre').default(0),
  estActif: boolean('est_actif').default(true),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow()
});

// GDPR tables (minimal for compatibility)
export const gdprFiles = mysqlTable('gdpr_files', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').references(() => students.id),
  filename: varchar('filename', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }),
  fileSize: int('file_size'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const gdprConsentRequests = mysqlTable('gdpr_consent_requests', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').references(() => students.id),
  consentType: varchar('consent_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  requestToken: varchar('request_token', { length: 255 }),
  requestType: varchar('request_type', { length: 50 }),
  expiresAt: timestamp('expires_at'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const gdprDataProcessingLog = mysqlTable('gdpr_data_processing_log', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').references(() => students.id),
  action: varchar('action', { length: 100 }).notNull(),
  dataType: varchar('data_type', { length: 50 }),
  details: text('details'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Files tables (full for storage service compatibility)
export const files = mysqlTable('files', {
  id: int('id').primaryKey().autoincrement(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }),
  mimeType: varchar('mime_type', { length: 100 }),
  size: int('size'),
  status: varchar('status', { length: 20 }).default('ready'),
  category: varchar('category', { length: 50 }),
  isPublic: boolean('is_public').default(false),
  uploadedBy: int('uploaded_by'),
  uploadedAt: timestamp('uploaded_at').default(sql`CURRENT_TIMESTAMP`),
  checksum: varchar('checksum', { length: 64 }),
  path: varchar('path', { length: 500 }),
  url: varchar('url', { length: 500 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const fileVariants = mysqlTable('file_variants', {
  id: int('id').primaryKey().autoincrement(),
  fileId: int('file_id').references(() => files.id),
  variant: varchar('variant', { length: 50 }).notNull(),
  url: varchar('url', { length: 500 }),
  type: varchar('type', { length: 50 }),
  filename: varchar('filename', { length: 255 }),
  path: varchar('path', { length: 500 }),
  size: int('size'),
  mimetype: varchar('mimetype', { length: 100 }),
  metadata: text('metadata'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Legacy alias for compatibility
export const progress = studentProgress;

// =============================================================================
// AUDIT TRAIL TABLES  
// =============================================================================

// Audit logs table for compliance tracking
export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  userId: varchar('user_id', { length: 36 }),
  parentId: varchar('parent_id', { length: 36 }),
  studentId: varchar('student_id', { length: 36 }),
  details: json('details').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').notNull().default(sql`CURRENT_TIMESTAMP`),
  severity: varchar('severity', { length: 20 }).notNull().default('medium'),
  category: varchar('category', { length: 50 }),
  sessionId: varchar('session_id', { length: 100 }),
  correlationId: varchar('correlation_id', { length: 36 }),
  checksum: varchar('checksum', { length: 64 }).notNull(),
  encrypted: boolean('encrypted').default(false),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Security alerts table
export const securityAlerts = mysqlTable('security_alerts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }).notNull(),
  description: text('description').notNull(),
  detectedAt: timestamp('detected_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  auditEntries: json('audit_entries').notNull(),
  resolved: boolean('resolved').default(false),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: varchar('resolved_by', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow()
});

// Compliance reports table
export const complianceReports = mysqlTable('compliance_reports', {
  id: varchar('id', { length: 36 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  generatedBy: varchar('generated_by', { length: 36 }).notNull(),
  generatedAt: timestamp('generated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  filters: json('filters'),
  totalEntries: int('total_entries').notNull().default(0),
  categories: json('categories'),
  topActions: json('top_actions'),
  securityAlerts: int('security_alerts').default(0),
  complianceIssues: json('compliance_issues'),
  exportFormat: varchar('export_format', { length: 20 }).notNull(),
  filePath: varchar('file_path', { length: 500 }),
  status: varchar('status', { length: 20 }).default('completed'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Data retention policy table
export const retentionPolicies = mysqlTable('retention_policies', {
  id: varchar('id', { length: 36 }).primaryKey(),
  policyName: varchar('policy_name', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  retentionPeriodDays: int('retention_period_days').notNull(),
  triggerCondition: varchar('trigger_condition', { length: 50 }).notNull(),
  action: varchar('action', { length: 20 }).notNull(),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  active: boolean('active').default(true),
  legalBasis: text('legal_basis'),
  exceptions: json('exceptions'),
  notificationDays: int('notification_days').default(30),
  lastExecuted: timestamp('last_executed'),
  recordsProcessed: int('records_processed').default(0),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow()
});

// Retention schedule table  
export const retentionSchedules = mysqlTable('retention_schedules', {
  id: varchar('id', { length: 36 }).primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }).notNull(),
  policyId: varchar('policy_id', { length: 36 }).notNull(),
  scheduledDate: timestamp('scheduled_date').notNull(),
  action: varchar('action', { length: 20 }).notNull(),
  priority: varchar('priority', { length: 20 }).notNull(),
  notificationSent: boolean('notification_sent').default(false),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
  errors: json('errors'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Student = InferSelectModel<typeof students>;
export type NewStudent = InferInsertModel<typeof students>;
export type Exercise = InferSelectModel<typeof exercises>;
export type NewExercise = InferInsertModel<typeof exercises>;
export type StudentProgress = InferSelectModel<typeof studentProgress>;
export type NewStudentProgress = InferInsertModel<typeof studentProgress>;
export type Progress = StudentProgress;
export type NewProgress = NewStudentProgress;
export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;
export type Revision = InferSelectModel<typeof revisions>;
export type NewRevision = InferInsertModel<typeof revisions>;
export type Module = InferSelectModel<typeof modules>;
export type NewModule = InferInsertModel<typeof modules>;
export type StudentLearningPath = InferSelectModel<typeof studentLearningPath>;
export type NewStudentLearningPath = InferInsertModel<typeof studentLearningPath>;

// GDPR types
export type GdprConsentRequest = InferSelectModel<typeof gdprConsentRequests>;
export type NewGdprConsentRequest = InferInsertModel<typeof gdprConsentRequests>;
export type GdprDataProcessingLog = InferSelectModel<typeof gdprDataProcessingLog>;
export type NewGdprDataProcessingLog = InferInsertModel<typeof gdprDataProcessingLog>;

// Audit types
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;
export type SecurityAlert = InferSelectModel<typeof securityAlerts>;
export type NewSecurityAlert = InferInsertModel<typeof securityAlerts>;
export type ComplianceReport = InferSelectModel<typeof complianceReports>;
export type NewComplianceReport = InferInsertModel<typeof complianceReports>;
export type RetentionPolicy = InferSelectModel<typeof retentionPolicies>;
export type NewRetentionPolicy = InferInsertModel<typeof retentionPolicies>;
export type RetentionSchedule = InferSelectModel<typeof retentionSchedules>;
export type NewRetentionSchedule = InferInsertModel<typeof retentionSchedules>;

// =============================================================================
// RELATIONS
// =============================================================================

export const studentsRelations = relations(students, ({ many }) => ({
  progress: many(studentProgress),
  sessions: many(sessions),
  revisions: many(revisions),
  learningPath: many(studentLearningPath)
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  progress: many(studentProgress),
  revisions: many(revisions)
}));

export const studentProgressRelations = relations(studentProgress, ({ one }) => ({
  student: one(students, {
    fields: [studentProgress.studentId],
    references: [students.id]
  }),
  exercise: one(exercises, {
    fields: [studentProgress.exerciseId],
    references: [exercises.id]
  })
}));
