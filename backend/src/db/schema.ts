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
