import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';

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

// GDPR Tables

// Parental consent table
export const parentalConsent = sqliteTable('parental_consent', {
  id: text('id').primaryKey(),
  parentEmail: text('parent_email').notNull(),
  parentName: text('parent_name').notNull(),
  childName: text('child_name').notNull(),
  childAge: integer('child_age').notNull(),
  consentTypes: text('consent_types').notNull(), // JSON array
  status: text('status').notNull(), // pending, verified, expired, revoked
  firstConsentToken: text('first_consent_token').notNull(),
  secondConsentToken: text('second_consent_token'),
  firstConsentDate: text('first_consent_date'),
  secondConsentDate: text('second_consent_date'),
  verificationDate: text('verification_date'),
  expiryDate: text('expiry_date').notNull(),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// GDPR requests table
export const gdprRequests = sqliteTable('gdpr_requests', {
  id: text('id').primaryKey(),
  requestType: text('request_type').notNull(), // access, rectification, erasure, etc.
  requesterType: text('requester_type').notNull(), // parent, student, etc.
  requesterEmail: text('requester_email').notNull(),
  requesterName: text('requester_name').notNull(),
  studentId: integer('student_id').references(() => students.id),
  studentName: text('student_name'),
  parentEmail: text('parent_email'),
  requestDetails: text('request_details').notNull(),
  urgentRequest: integer('urgent_request', { mode: 'boolean' }).default(false),
  status: text('status').notNull(), // pending, under_review, approved, etc.
  priority: text('priority').notNull(), // low, medium, high, urgent
  submittedAt: text('submitted_at').notNull(),
  dueDate: text('due_date').notNull(),
  verificationToken: text('verification_token'),
  verifiedAt: text('verified_at'),
  assignedTo: text('assigned_to'),
  processedAt: text('processed_at'),
  completedAt: text('completed_at'),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent').notNull(),
  verificationMethod: text('verification_method').notNull(),
  legalBasis: text('legal_basis'),
  responseDetails: text('response_details'),
  actionsTaken: text('actions_taken'), // JSON array
  exportedData: text('exported_data'), // JSON
});

// Audit trail table
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(),
  userId: text('user_id'),
  parentId: text('parent_id'),
  studentId: integer('student_id').references(() => students.id),
  details: text('details').notNull(), // JSON
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: text('timestamp').notNull(),
  severity: text('severity').notNull(), // low, medium, high, critical
  category: text('category'), // data_access, data_modification, etc.
  sessionId: text('session_id'),
  correlationId: text('correlation_id'),
  checksum: text('checksum').notNull(),
  encrypted: integer('encrypted', { mode: 'boolean' }).default(false),
});

// Encryption keys table
export const encryptionKeys = sqliteTable('encryption_keys', {
  id: text('id').primaryKey(),
  keyData: text('key_data').notNull(), // Encrypted key
  algorithm: text('algorithm').notNull(),
  version: integer('version').notNull(),
  usage: text('usage').notNull(), // student_data, sensitive_fields, etc.
  status: text('status').notNull(), // active, deprecated, revoked
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
});

// Data retention policies table
export const retentionPolicies = sqliteTable('retention_policies', {
  id: text('id').primaryKey(),
  policyName: text('policy_name').notNull(),
  entityType: text('entity_type').notNull(),
  retentionPeriodDays: integer('retention_period_days').notNull(),
  triggerCondition: text('trigger_condition').notNull(),
  action: text('action').notNull(), // delete, anonymize, archive
  priority: text('priority').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true),
  legalBasis: text('legal_basis'),
  exceptions: text('exceptions'), // JSON array
  notificationDays: integer('notification_days').default(30),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  lastExecuted: text('last_executed'),
  recordsProcessed: integer('records_processed').default(0),
});

// Consent preferences table  
export const consentPreferences = sqliteTable('consent_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  studentId: integer('student_id').references(() => students.id),
  essential: integer('essential', { mode: 'boolean' }).default(true),
  functional: integer('functional', { mode: 'boolean' }).default(false),
  analytics: integer('analytics', { mode: 'boolean' }).default(false),
  marketing: integer('marketing', { mode: 'boolean' }).default(false),
  personalization: integer('personalization', { mode: 'boolean' }).default(false),
  version: text('version').notNull(),
  timestamp: text('timestamp').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
});

// File Upload Tables

// Files table
export const files = sqliteTable('files', {
  id: text('id').primaryKey(),
  originalName: text('original_name').notNull(),
  filename: text('filename').notNull(),
  mimetype: text('mimetype').notNull(),
  size: integer('size').notNull(),
  path: text('path').notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  metadata: text('metadata'), // JSON
  uploadedBy: text('uploaded_by').notNull(),
  uploadedAt: text('uploaded_at').notNull(),
  category: text('category').notNull(), // image, video, audio, document, etc.
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  status: text('status').notNull(), // uploading, processing, ready, failed, deleted, quarantined
  checksum: text('checksum').notNull(),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// File variants table (thumbnails, compressed versions, etc.)
export const fileVariants = sqliteTable('file_variants', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id),
  type: text('type').notNull(), // thumbnail, small, medium, large, compressed, watermarked
  filename: text('filename').notNull(),
  path: text('path').notNull(),
  url: text('url').notNull(),
  size: integer('size').notNull(),
  mimetype: text('mimetype').notNull(),
  metadata: text('metadata'), // JSON
  createdAt: text('created_at').notNull(),
  deletedAt: text('deleted_at'),
});

// File access logs table
export const fileAccessLogs = sqliteTable('file_access_logs', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id),
  userId: text('user_id'),
  studentId: integer('student_id').references(() => students.id),
  action: text('action').notNull(), // view, download, share, delete
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: text('timestamp').notNull(),
  details: text('details'), // JSON
});

// Security scan results table
export const securityScans = sqliteTable('security_scans', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id),
  scanEngine: text('scan_engine').notNull(),
  scanDate: text('scan_date').notNull(),
  isClean: integer('is_clean', { mode: 'boolean' }).notNull(),
  threats: text('threats'), // JSON array
  quarantined: integer('quarantined', { mode: 'boolean' }).default(false),
  details: text('details'), // JSON
});

// =============================================================================
// TYPE EXPORTS - Add all the missing type definitions
// =============================================================================

// Student types
export type Student = InferSelectModel<typeof students>;
export type NewStudent = InferInsertModel<typeof students>;

// Exercise types
export type Exercise = InferSelectModel<typeof exercises>;
export type NewExercise = InferInsertModel<typeof exercises>;

// Progress types
export type Progress = InferSelectModel<typeof studentProgress>;
export type NewProgress = InferInsertModel<typeof studentProgress>;

// GDPR types
export type ParentalConsent = InferSelectModel<typeof parentalConsent>;
export type NewParentalConsent = InferInsertModel<typeof parentalConsent>;

export type GDPRRequest = InferSelectModel<typeof gdprRequests>;
export type NewGDPRRequest = InferInsertModel<typeof gdprRequests>;

// Audit types
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;

// Encryption types
export type EncryptionKey = InferSelectModel<typeof encryptionKeys>;
export type NewEncryptionKey = InferInsertModel<typeof encryptionKeys>;

// Retention types
export type RetentionPolicy = InferSelectModel<typeof retentionPolicies>;
export type NewRetentionPolicy = InferInsertModel<typeof retentionPolicies>;

// Consent preferences types
export type ConsentPreference = InferSelectModel<typeof consentPreferences>;
export type NewConsentPreference = InferInsertModel<typeof consentPreferences>;

// File types
export type File = InferSelectModel<typeof files>;
export type NewFile = InferInsertModel<typeof files>;

export type FileVariant = InferSelectModel<typeof fileVariants>;
export type NewFileVariant = InferInsertModel<typeof fileVariants>;

export type FileAccessLog = InferSelectModel<typeof fileAccessLogs>;
export type NewFileAccessLog = InferInsertModel<typeof fileAccessLogs>;

export type SecurityScan = InferSelectModel<typeof securityScans>;
export type NewSecurityScan = InferInsertModel<typeof securityScans>;

// Legacy compatibility exports (for services that expect these names)
export const progress = studentProgress;
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id),
  data: text('data').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

export const revisions = sqliteTable('revisions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').references(() => students.id),
  exerciseId: integer('exercise_id').references(() => exercises.id),
  revisionDate: text('revision_date').notNull(),
  score: integer('score').default(0),
  createdAt: text('created_at').notNull(),
});

export const modules = sqliteTable('modules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  titre: text('titre').notNull(),
  description: text('description'),
  matiere: text('matiere').notNull(),
  niveau: text('niveau').notNull(),
  ordre: integer('ordre').default(0),
  estActif: integer('est_actif', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Additional type exports for legacy compatibility
export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

export type Revision = InferSelectModel<typeof revisions>;
export type NewRevision = InferInsertModel<typeof revisions>;

export type Module = InferSelectModel<typeof modules>;
export type NewModule = InferInsertModel<typeof modules>;

// =============================================================================
// GDPR COMPLIANCE TABLES - Additional tables for full GDPR compliance
// =============================================================================

// Files table for GDPR compliance and file uploads
export const gdprFiles = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimetype: text('mimetype').notNull(),
  size: integer('size').notNull(),
  studentId: integer('student_id').references(() => students.id),
  path: text('path').notNull(),
  uploadedAt: text('uploaded_at').notNull(),
  isGdprProtected: integer('is_gdpr_protected', { mode: 'boolean' }).default(true).notNull(),
  retentionDate: text('retention_date'), // Date limite de conservation
  metadata: text('metadata').notNull().default('{}'), // JSON string
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// GDPR Consent Requests table
export const gdprConsentRequests = sqliteTable('gdpr_consent_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').notNull().references(() => students.id),
  requestType: text('request_type').notNull(), // DATA_ACCESS, DATA_DELETION, DATA_PORTABILITY, CONSENT_WITHDRAWAL
  status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED, COMPLETED
  requestToken: text('request_token').notNull().unique(),
  parentEmail: text('parent_email').notNull(),
  requestDetails: text('request_details').notNull().default('{}'), // JSON string
  processedAt: text('processed_at'),
  processedBy: text('processed_by'),
  expiresAt: text('expires_at').notNull(),
  metadata: text('metadata').notNull().default('{}'), // JSON string
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Data Processing Log table for GDPR audit trail
export const gdprDataProcessingLog = sqliteTable('gdpr_data_processing_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').references(() => students.id),
  action: text('action').notNull(), // CREATE, READ, UPDATE, DELETE, EXPORT, ANONYMIZE
  dataType: text('data_type').notNull(),
  description: text('description').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  requestId: text('request_id'),
  metadata: text('metadata').notNull().default('{}'), // JSON string
  createdAt: text('created_at').notNull(),
});

// Relations pour les nouvelles tables
export const gdprFilesRelations = relations(gdprFiles, ({ one }) => ({
  student: one(students, {
    fields: [gdprFiles.studentId],
    references: [students.id],
  }),
}));

export const gdprConsentRequestsRelations = relations(gdprConsentRequests, ({ one }) => ({
  student: one(students, {
    fields: [gdprConsentRequests.studentId],
    references: [students.id],
  }),
}));

export const gdprDataProcessingLogRelations = relations(gdprDataProcessingLog, ({ one }) => ({
  student: one(students, {
    fields: [gdprDataProcessingLog.studentId],
    references: [students.id],
  }),
}));

// Mise à jour des relations students
export const studentsRelations = relations(students, ({ many }) => ({
  progress: many(studentProgress),
  sessions: many(sessions),
  revisions: many(revisions),
  files: many(gdprFiles),
  gdprConsentRequests: many(gdprConsentRequests),
  gdprDataProcessingLog: many(gdprDataProcessingLog),
}));

// Export des nouveaux types
export type GdprFile = typeof gdprFiles.$inferSelect;
export type NewGdprFile = typeof gdprFiles.$inferInsert;
export type GdprConsentRequest = typeof gdprConsentRequests.$inferSelect;
export type NewGdprConsentRequest = typeof gdprConsentRequests.$inferInsert;
export type GdprDataProcessingLog = typeof gdprDataProcessingLog.$inferSelect;
export type NewGdprDataProcessingLog = typeof gdprDataProcessingLog.$inferInsert;
