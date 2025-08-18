import crypto from 'crypto';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { EncryptionService } from './encryption.service';
import { db } from '../db/connection';
import { auditLogs, securityAlerts, complianceReports } from '../db/schema';
import { eq, and, gte, lte, desc, asc, inArray, sql, count } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

// Validation schemas
const AuditActionSchema = z.object({
  entityType: z.enum([
    'student',
    'parent',
    'exercise',
    'progress',
    'parental_consent',
    'gdpr_request',
    'data_export',
    'encryption',
    'key_rotation',
    'key_revocation',
    'user_session',
    'admin_action',
    'anonymization_job',
    'retention_policy',
    'retention_execution',
    'retention_schedule',
    'retention_report'
  ]),
  entityId: z.string(),
  action: z.enum([
    'create',
    'read',
    'update',
    'delete',
    'export',
    'anonymize',
    'consent_given',
    'consent_revoked',
    'login',
    'logout',
    'access_denied',
    'encrypt',
    'decrypt',
    'key_generated',
    'key_rotated',
    'emergency_revoked',
    'data_retention_applied',
    'first_consent',
    'second_consent',
    'verified',
    'completed',
    'failed',
    'created',
    'revoked'
  ]),
  userId: z.string().nullable(),
  parentId: z.string().optional(),
  studentId: z.string().optional(),
  details: z.record(z.any()),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  category: z.enum([
    'data_access',
    'data_modification',
    'consent_management',
    'security',
    'compliance',
    'system',
    'user_behavior'
  ]).optional()
});

const AuditQuerySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  studentId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  severity: z.array(z.string()).optional(),
  category: z.string().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  includeDetails: z.boolean().default(false)
});

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string | null;
  parentId?: string;
  studentId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  sessionId?: string;
  correlationId?: string;
  checksum: string;
  encrypted: boolean;
}

export interface AuditReport {
  id: string;
  title: string;
  description: string;
  generatedBy: string;
  generatedAt: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  filters: Record<string, any>;
  totalEntries: number;
  categories: Record<string, number>;
  topActions: Array<{ action: string; count: number }>;
  securityAlerts: number;
  complianceIssues: string[];
  exportFormat: 'json' | 'csv' | 'pdf';
  filePath?: string;
}

export interface SecurityAlert {
  id: string;
  type: 'suspicious_access' | 'multiple_failed_logins' | 'unusual_data_access' | 'consent_anomaly';
  severity: 'medium' | 'high' | 'critical';
  entityType: string;
  entityId: string;
  description: string;
  detectedAt: Date;
  auditEntries: string[];
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export class AuditTrailService {
  private encryptionService: EncryptionService;
  private sessionCorrelations: Map<string, string> = new Map();

  constructor() {
    this.encryptionService = new EncryptionService();
    this.initializeAuditSystem();
  }

  /**
   * Log an audit action
   */
  async logAction(actionData: z.infer<typeof AuditActionSchema>): Promise<string> {
    try {
      const validatedData = AuditActionSchema.parse(actionData);
      
      // Generate unique audit ID
      const auditId = crypto.randomUUID();
      
      // Generate correlation ID for session tracking
      const correlationId = this.getOrCreateCorrelationId(validatedData.userId);
      
      // Determine if details should be encrypted
      const shouldEncrypt = this.shouldEncryptDetails(validatedData.action, validatedData.entityType);
      let encryptedDetails = validatedData.details;
      let encrypted = false;

      if (shouldEncrypt) {
        encryptedDetails = await this.encryptionService.encryptStudentData(
          validatedData.details
        );
        encrypted = true;
      }

      // Create audit entry
      const auditEntry: AuditLogEntry = {
        id: auditId,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        action: validatedData.action,
        userId: validatedData.userId,
        parentId: validatedData.parentId,
        studentId: validatedData.studentId,
        details: encryptedDetails,
        ipAddress: validatedData.ipAddress,
        userAgent: validatedData.userAgent,
        timestamp: validatedData.timestamp,
        severity: validatedData.severity,
        category: validatedData.category || this.categorizeAction(validatedData.action),
        correlationId,
        checksum: '', // Will be calculated
        encrypted
      };

      // Calculate integrity checksum
      auditEntry.checksum = this.calculateChecksum(auditEntry);

      // Store audit entry
      await this.storeAuditEntry(auditEntry);

      // Check for security anomalies
      await this.detectSecurityAnomalies(auditEntry);

      // Log to system logger for immediate monitoring
      this.logToSystemLogger(auditEntry);

      logger.debug('Audit action logged', { 
        auditId, 
        action: validatedData.action,
        entityType: validatedData.entityType 
      });

      return auditId;

    } catch (error) {
      logger.error('Error logging audit action:', error);
      // Don't throw - audit failures shouldn't break main functionality
      return '';
    }
  }

  /**
   * Query audit logs with filters
   */
  async queryAuditLogs(queryParams: z.infer<typeof AuditQuerySchema>): Promise<{
    entries: AuditLogEntry[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const validatedQuery = AuditQuerySchema.parse(queryParams);
      
      // Build query filters
      const filters = this.buildQueryFilters(validatedQuery);
      
      // Execute query
      const { entries, total } = await this.executeAuditQuery(filters, validatedQuery);
      
      // Decrypt details if requested and user has permission
      if (validatedQuery.includeDetails) {
        for (const entry of entries) {
          if (entry.encrypted) {
            try {
              entry.details = await this.encryptionService.decryptStudentData(entry.details as any);
              entry.encrypted = false;
            } catch (error) {
              logger.warn(`Failed to decrypt audit details for entry ${entry.id}:`, error);
            }
          }
        }
      }

      const hasMore = validatedQuery.offset + entries.length < total;

      return { entries, total, hasMore };

    } catch (error) {
      logger.error('Error querying audit logs:', error);
      throw new Error('Failed to query audit logs');
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    entityType?: string,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<AuditReport> {
    try {
      const reportId = crypto.randomUUID();
      
      // Query audit entries for the period
      const entries = await this.getAuditEntriesForPeriod(startDate, endDate, entityType);
      
      // Analyze entries
      const analysis = this.analyzeAuditEntries(entries);
      
      // Generate report
      const report: AuditReport = {
        id: reportId,
        title: `Compliance Report ${entityType ? `- ${entityType}` : ''}`,
        description: `Audit trail report for period ${startDate.toISOString()} to ${endDate.toISOString()}`,
        generatedBy: 'system', // TODO: Get from context
        generatedAt: new Date(),
        period: { startDate, endDate },
        filters: { entityType },
        totalEntries: entries.length,
        categories: analysis.categories,
        topActions: analysis.topActions,
        securityAlerts: analysis.securityAlerts,
        complianceIssues: analysis.complianceIssues,
        exportFormat: format
      };

      // Export report in requested format
      if (format !== 'json') {
        report.filePath = await this.exportReport(report, entries, format);
      }

      // Log report generation
      await this.logAction({
        entityType: 'admin_action',
        entityId: reportId,
        action: 'create',
        userId: null, // TODO: Get from context
        details: {
          reportType: 'compliance',
          period: { startDate, endDate },
          totalEntries: entries.length,
          format
        },
        severity: 'low',
        category: 'compliance'
      });

      logger.info('Compliance report generated', { 
        reportId, 
        period: { startDate, endDate },
        totalEntries: entries.length 
      });

      return report;

    } catch (error) {
      logger.error('Error generating compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  /**
   * Get audit trail for specific student (GDPR compliance)
   */
  async getStudentAuditTrail(studentId: string): Promise<AuditLogEntry[]> {
    try {
      const entries = await this.queryAuditLogs({
        studentId,
        includeDetails: true,
        limit: 1000
      });

      // Log access to student audit trail
      await this.logAction({
        entityType: 'student',
        entityId: studentId,
        action: 'read',
        userId: null, // TODO: Get from context
        details: {
          action: 'audit_trail_access',
          entriesReturned: entries.entries.length
        },
        severity: 'medium',
        category: 'data_access'
      });

      return entries.entries;

    } catch (error) {
      logger.error('Error getting student audit trail:', error);
      throw new Error('Failed to retrieve student audit trail');
    }
  }

  /**
   * Anonymize audit logs for a student
   */
  async anonymizeStudentAuditLogs(studentId: string, reason: string): Promise<number> {
    try {
      const entries = await this.queryAuditLogs({
        studentId,
        limit: 1000
      });

      let anonymizedCount = 0;

      for (const entry of entries.entries) {
        // Anonymize the entry
        const anonymizedEntry = await this.anonymizeAuditEntry(entry);
        await this.updateAuditEntry(anonymizedEntry);
        anonymizedCount++;
      }

      // Log anonymization action
      await this.logAction({
        entityType: 'student',
        entityId: studentId,
        action: 'anonymize',
        userId: null, // TODO: Get from context
        details: {
          action: 'audit_anonymization',
          entriesAnonymized: anonymizedCount,
          reason
        },
        severity: 'high',
        category: 'compliance'
      });

      logger.info('Student audit logs anonymized', { 
        studentId, 
        anonymizedCount, 
        reason 
      });

      return anonymizedCount;

    } catch (error) {
      logger.error('Error anonymizing student audit logs:', error);
      throw new Error('Failed to anonymize audit logs');
    }
  }

  /**
   * Verify audit log integrity
   */
  async verifyAuditIntegrity(auditId: string): Promise<{
    valid: boolean;
    originalChecksum: string;
    calculatedChecksum: string;
    tampering?: boolean;
  }> {
    try {
      const entry = await this.getAuditEntry(auditId);
      if (!entry) {
        throw new Error(`Audit entry not found: ${auditId}`);
      }

      const originalChecksum = entry.checksum;
      const calculatedChecksum = this.calculateChecksum({
        ...entry
      } as any);

      const valid = originalChecksum === calculatedChecksum;
      
      if (!valid) {
        logger.warn('Audit integrity check failed', { 
          auditId, 
          originalChecksum, 
          calculatedChecksum 
        });
      }

      return {
        valid,
        originalChecksum,
        calculatedChecksum,
        tampering: !valid
      };

    } catch (error) {
      logger.error('Error verifying audit integrity:', error);
      throw new Error('Failed to verify audit integrity');
    }
  }

  /**
   * Detect and alert on security anomalies
   */
  private async detectSecurityAnomalies(entry: AuditLogEntry): Promise<void> {
    try {
      const alerts: SecurityAlert[] = [];

      // Check for suspicious access patterns
      if (entry.action === 'read' && entry.entityType === 'student') {
        const recentAccesses = await this.getRecentStudentAccesses(entry.entityId, 24); // Last 24 hours
        if (recentAccesses.length > 10) {
          alerts.push({
            id: crypto.randomUUID(),
            type: 'suspicious_access',
            severity: 'medium',
            entityType: entry.entityType,
            entityId: entry.entityId,
            description: `Unusual number of accesses to student data (${recentAccesses.length} in 24h)`,
            detectedAt: new Date(),
            auditEntries: recentAccesses.map(a => a.id),
            resolved: false
          });
        }
      }

      // Check for failed login attempts
      if (entry.action === 'access_denied' && entry.entityType === 'user_session') {
        const failedLogins = await this.getFailedLoginAttempts(entry.ipAddress || '', 1); // Last hour
        if (failedLogins.length > 5) {
          alerts.push({
            id: crypto.randomUUID(),
            type: 'multiple_failed_logins',
            severity: 'high',
            entityType: 'user_session',
            entityId: entry.ipAddress || 'unknown',
            description: `Multiple failed login attempts from IP ${entry.ipAddress} (${failedLogins.length} attempts)`,
            detectedAt: new Date(),
            auditEntries: failedLogins.map(a => a.id),
            resolved: false
          });
        }
      }

      // Store and notify about alerts
      for (const alert of alerts) {
        await this.storeSecurityAlert(alert);
        await this.notifySecurityTeam(alert);
      }

    } catch (error) {
      logger.error('Error detecting security anomalies:', error);
    }
  }

  // Private helper methods
  private shouldEncryptDetails(action: string, entityType: string): boolean {
    // Encrypt details for sensitive actions or entities
    const sensitiveActions = ['create', 'update', 'export', 'read'];
    const sensitiveEntities = ['student', 'parent', 'parental_consent'];
    
    return sensitiveActions.includes(action) && sensitiveEntities.includes(entityType);
  }

  private categorizeAction(action: string): string {
    const categories: Record<string, string> = {
      'create': 'data_modification',
      'update': 'data_modification', 
      'delete': 'data_modification',
      'read': 'data_access',
      'export': 'data_access',
      'consent_given': 'consent_management',
      'consent_revoked': 'consent_management',
      'login': 'user_behavior',
      'logout': 'user_behavior',
      'access_denied': 'security',
      'encrypt': 'security',
      'decrypt': 'security',
      'key_generated': 'security',
      'anonymize': 'compliance'
    };
    
    return categories[action] || 'system';
  }

  private calculateChecksum(entry: Omit<AuditLogEntry, 'checksum'>): string {
    const dataString = JSON.stringify({
      id: entry.id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      userId: entry.userId,
      timestamp: entry.timestamp.toISOString(),
      details: entry.details
    });
    
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  private getOrCreateCorrelationId(userId: string | null): string {
    if (!userId) return crypto.randomUUID();
    
    let correlationId = this.sessionCorrelations.get(userId);
    if (!correlationId) {
      correlationId = crypto.randomUUID();
      this.sessionCorrelations.set(userId, correlationId);
    }
    
    return correlationId;
  }

  private logToSystemLogger(entry: AuditLogEntry): void {
    const logLevel = entry.severity === 'critical' ? 'error' : 
                    entry.severity === 'high' ? 'warn' : 'info';
    
    logger[logLevel](`AUDIT: ${entry.action} on ${entry.entityType}`, {
      auditId: entry.id,
      entityId: entry.entityId,
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      timestamp: entry.timestamp
    });
  }

  private buildQueryFilters(query: z.infer<typeof AuditQuerySchema>): Record<string, any> {
    const filters: Record<string, any> = {};
    
    if (query.entityType) filters.entityType = query.entityType;
    if (query.entityId) filters.entityId = query.entityId;
    if (query.action) filters.action = query.action;
    if (query.userId) filters.userId = query.userId;
    if (query.studentId) filters.studentId = query.studentId;
    if (query.category) filters.category = query.category;
    if (query.severity) filters.severity = { $in: query.severity };
    if (query.startDate || query.endDate) {
      filters.timestamp = {};
      if (query.startDate) filters.timestamp.$gte = query.startDate;
      if (query.endDate) filters.timestamp.$lte = query.endDate;
    }
    
    return filters;
  }

  private analyzeAuditEntries(entries: AuditLogEntry[]): {
    categories: Record<string, number>;
    topActions: Array<{ action: string; count: number }>;
    securityAlerts: number;
    complianceIssues: string[];
  } {
    const categories: Record<string, number> = {};
    const actions: Record<string, number> = {};
    let securityAlerts = 0;
    const complianceIssues: string[] = [];

    for (const entry of entries) {
      // Count categories
      if (entry.category) {
        categories[entry.category] = (categories[entry.category] || 0) + 1;
      }

      // Count actions
      actions[entry.action] = (actions[entry.action] || 0) + 1;

      // Count security alerts
      if (entry.severity === 'high' || entry.severity === 'critical') {
        securityAlerts++;
      }

      // Check for compliance issues
      if (entry.action === 'access_denied') {
        complianceIssues.push(`Unauthorized access attempt on ${entry.entityType} ${entry.entityId}`);
      }
    }

    // Sort top actions
    const topActions = Object.entries(actions)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { categories, topActions, securityAlerts, complianceIssues };
  }

  private async anonymizeAuditEntry(entry: AuditLogEntry): Promise<AuditLogEntry> {
    // Replace sensitive information with anonymized values
    const anonymized = { ...entry };
    
    if (anonymized.details) {
      // Anonymize personal information in details
      anonymized.details = this.anonymizeDetails(anonymized.details);
    }
    
    // Remove IP address and user agent for anonymization
    delete anonymized.ipAddress;
    delete anonymized.userAgent;
    
    // Recalculate checksum
    anonymized.checksum = this.calculateChecksum(anonymized);
    
    return anonymized;
  }

  private anonymizeDetails(details: any): any {
    if (typeof details !== 'object' || details === null) {
      return details;
    }

    const anonymized = { ...details };
    const sensitiveFields = ['name', 'email', 'parentEmail', 'childName', 'parentName'];
    
    for (const field of sensitiveFields) {
      if (anonymized[field]) {
        anonymized[field] = '[ANONYMIZED]';
      }
    }
    
    return anonymized;
  }

  private async initializeAuditSystem(): Promise<void> {
    // Initialize audit database tables, indexes, etc.
    logger.info('Audit trail system initialized');
  }

  /**
   * Store audit entry in database with transaction safety
   */
  private async storeAuditEntry(entry: AuditLogEntry): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(auditLogs).values({
          id: entry.id,
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          userId: entry.userId,
          parentId: entry.parentId,
          studentId: entry.studentId,
          details: entry.details,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          timestamp: entry.timestamp,
          severity: entry.severity,
          category: entry.category,
          sessionId: entry.sessionId,
          correlationId: entry.correlationId,
          checksum: entry.checksum,
          encrypted: entry.encrypted
        });
      });

      logger.debug('Audit entry stored successfully', { auditId: entry.id });
    } catch (error) {
      logger.error('Failed to store audit entry:', error);
      throw new Error(`Failed to store audit entry: ${error.message}`);
    }
  }

  /**
   * Execute audit query with optimized database access
   */
  private async executeAuditQuery(filters: Record<string, any>, query: z.infer<typeof AuditQuerySchema>): Promise<{
    entries: AuditLogEntry[];
    total: number;
  }> {
    try {
      // Build WHERE conditions dynamically
      const conditions = [];
      
      if (filters.entityType) {
        conditions.push(eq(auditLogs.entityType, filters.entityType));
      }
      if (filters.entityId) {
        conditions.push(eq(auditLogs.entityId, filters.entityId));
      }
      if (filters.action) {
        conditions.push(eq(auditLogs.action, filters.action));
      }
      if (filters.userId) {
        conditions.push(eq(auditLogs.userId, filters.userId));
      }
      if (filters.studentId) {
        conditions.push(eq(auditLogs.studentId, filters.studentId));
      }
      if (filters.category) {
        conditions.push(eq(auditLogs.category, filters.category));
      }
      if (filters.severity?.$in) {
        conditions.push(inArray(auditLogs.severity, filters.severity.$in));
      }
      if (filters.timestamp) {
        if (filters.timestamp.$gte) {
          conditions.push(gte(auditLogs.timestamp, filters.timestamp.$gte));
        }
        if (filters.timestamp.$lte) {
          conditions.push(lte(auditLogs.timestamp, filters.timestamp.$lte));
        }
      }

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      const total = totalResult?.count || 0;

      // Get entries with pagination
      const dbResults = await db
        .select()
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLogs.timestamp))
        .limit(query.limit)
        .offset(query.offset);

      // Convert to AuditLogEntry format
      const entries: AuditLogEntry[] = dbResults.map(row => ({
        id: row.id,
        entityType: row.entityType,
        entityId: row.entityId,
        action: row.action,
        userId: row.userId,
        parentId: row.parentId || undefined,
        studentId: row.studentId || undefined,
        details: row.details as Record<string, any>,
        ipAddress: row.ipAddress || undefined,
        userAgent: row.userAgent || undefined,
        timestamp: row.timestamp,
        severity: row.severity as any,
        category: row.category || undefined,
        sessionId: row.sessionId || undefined,
        correlationId: row.correlationId || undefined,
        checksum: row.checksum,
        encrypted: row.encrypted || false
      }));

      logger.debug('Audit query executed', { 
        filtersCount: Object.keys(filters).length,
        total,
        returned: entries.length 
      });

      return { entries, total };

    } catch (error) {
      logger.error('Error executing audit query:', error);
      throw new Error(`Failed to execute audit query: ${error.message}`);
    }
  }

  /**
   * Get single audit entry by ID
   */
  private async getAuditEntry(auditId: string): Promise<AuditLogEntry | null> {
    try {
      const [result] = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.id, auditId))
        .limit(1);

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        entityType: result.entityType,
        entityId: result.entityId,
        action: result.action,
        userId: result.userId,
        parentId: result.parentId || undefined,
        studentId: result.studentId || undefined,
        details: result.details as Record<string, any>,
        ipAddress: result.ipAddress || undefined,
        userAgent: result.userAgent || undefined,
        timestamp: result.timestamp,
        severity: result.severity as any,
        category: result.category || undefined,
        sessionId: result.sessionId || undefined,
        correlationId: result.correlationId || undefined,
        checksum: result.checksum,
        encrypted: result.encrypted || false
      };

    } catch (error) {
      logger.error('Error getting audit entry:', error);
      throw new Error(`Failed to get audit entry: ${error.message}`);
    }
  }

  /**
   * Update audit entry (mainly for anonymization)
   */
  private async updateAuditEntry(entry: AuditLogEntry): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(auditLogs)
          .set({
            details: entry.details,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            checksum: entry.checksum,
            encrypted: entry.encrypted
          })
          .where(eq(auditLogs.id, entry.id));
      });

      logger.debug('Audit entry updated successfully', { auditId: entry.id });
    } catch (error) {
      logger.error('Error updating audit entry:', error);
      throw new Error(`Failed to update audit entry: ${error.message}`);
    }
  }

  /**
   * Get audit entries for a specific time period
   */
  private async getAuditEntriesForPeriod(startDate: Date, endDate: Date, entityType?: string): Promise<AuditLogEntry[]> {
    try {
      const conditions = [
        gte(auditLogs.timestamp, startDate),
        lte(auditLogs.timestamp, endDate)
      ];

      if (entityType) {
        conditions.push(eq(auditLogs.entityType, entityType));
      }

      const results = await db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.timestamp))
        .limit(10000); // Reasonable limit for reports

      return results.map(row => ({
        id: row.id,
        entityType: row.entityType,
        entityId: row.entityId,
        action: row.action,
        userId: row.userId,
        parentId: row.parentId || undefined,
        studentId: row.studentId || undefined,
        details: row.details as Record<string, any>,
        ipAddress: row.ipAddress || undefined,
        userAgent: row.userAgent || undefined,
        timestamp: row.timestamp,
        severity: row.severity as any,
        category: row.category || undefined,
        sessionId: row.sessionId || undefined,
        correlationId: row.correlationId || undefined,
        checksum: row.checksum,
        encrypted: row.encrypted || false
      }));

    } catch (error) {
      logger.error('Error getting audit entries for period:', error);
      throw new Error(`Failed to get audit entries for period: ${error.message}`);
    }
  }

  /**
   * Get recent student access attempts for anomaly detection
   */
  private async getRecentStudentAccesses(studentId: string, hours: number): Promise<AuditLogEntry[]> {
    try {
      const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

      const results = await db
        .select()
        .from(auditLogs)
        .where(and(
          eq(auditLogs.entityId, studentId),
          eq(auditLogs.entityType, 'student'),
          eq(auditLogs.action, 'read'),
          gte(auditLogs.timestamp, cutoffTime)
        ))
        .orderBy(desc(auditLogs.timestamp));

      return results.map(row => ({
        id: row.id,
        entityType: row.entityType,
        entityId: row.entityId,
        action: row.action,
        userId: row.userId,
        parentId: row.parentId || undefined,
        studentId: row.studentId || undefined,
        details: row.details as Record<string, any>,
        ipAddress: row.ipAddress || undefined,
        userAgent: row.userAgent || undefined,
        timestamp: row.timestamp,
        severity: row.severity as any,
        category: row.category || undefined,
        sessionId: row.sessionId || undefined,
        correlationId: row.correlationId || undefined,
        checksum: row.checksum,
        encrypted: row.encrypted || false
      }));

    } catch (error) {
      logger.error('Error getting recent student accesses:', error);
      return []; // Don't throw - this is for security detection
    }
  }

  /**
   * Get failed login attempts for security monitoring
   */
  private async getFailedLoginAttempts(ipAddress: string, hours: number): Promise<AuditLogEntry[]> {
    try {
      const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

      const results = await db
        .select()
        .from(auditLogs)
        .where(and(
          eq(auditLogs.ipAddress, ipAddress),
          eq(auditLogs.action, 'access_denied'),
          eq(auditLogs.entityType, 'user_session'),
          gte(auditLogs.timestamp, cutoffTime)
        ))
        .orderBy(desc(auditLogs.timestamp));

      return results.map(row => ({
        id: row.id,
        entityType: row.entityType,
        entityId: row.entityId,
        action: row.action,
        userId: row.userId,
        parentId: row.parentId || undefined,
        studentId: row.studentId || undefined,
        details: row.details as Record<string, any>,
        ipAddress: row.ipAddress || undefined,
        userAgent: row.userAgent || undefined,
        timestamp: row.timestamp,
        severity: row.severity as any,
        category: row.category || undefined,
        sessionId: row.sessionId || undefined,
        correlationId: row.correlationId || undefined,
        checksum: row.checksum,
        encrypted: row.encrypted || false
      }));

    } catch (error) {
      logger.error('Error getting failed login attempts:', error);
      return []; // Don't throw - this is for security detection
    }
  }

  /**
   * Store security alert in database
   */
  private async storeSecurityAlert(alert: SecurityAlert): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(securityAlerts).values({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          entityType: alert.entityType,
          entityId: alert.entityId,
          description: alert.description,
          detectedAt: alert.detectedAt,
          auditEntries: alert.auditEntries,
          resolved: alert.resolved,
          resolvedAt: alert.resolvedAt,
          resolvedBy: alert.resolvedBy,
          metadata: {}
        });
      });

      logger.info('Security alert stored', { alertId: alert.id, type: alert.type });
    } catch (error) {
      logger.error('Error storing security alert:', error);
      // Don't throw - alert storage failure shouldn't break main flow
    }
  }

  /**
   * Notify security team about alert (email, slack, etc.)
   */
  private async notifySecurityTeam(alert: SecurityAlert): Promise<void> {
    try {
      // Log alert for immediate monitoring
      logger.warn(`SECURITY ALERT: ${alert.type}`, {
        alertId: alert.id,
        severity: alert.severity,
        entityType: alert.entityType,
        entityId: alert.entityId,
        description: alert.description,
        detectedAt: alert.detectedAt
      });

      // TODO: Implement actual notification (email, Slack webhook, etc.)
      // For now, ensure it's logged at warn level for monitoring systems
      
    } catch (error) {
      logger.error('Error notifying security team:', error);
      // Don't throw - notification failure shouldn't break main flow
    }
  }

  /**
   * Export compliance report to file
   */
  private async exportReport(report: AuditReport, entries: AuditLogEntry[], format: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `compliance-report-${report.id}-${timestamp}`;
      const reportsDir = path.join(process.cwd(), 'reports');
      
      // Ensure reports directory exists
      await fs.mkdir(reportsDir, { recursive: true });

      if (format === 'csv') {
        const filePath = path.join(reportsDir, `${fileName}.csv`);
        
        const csvWriter = createObjectCsvWriter({
          path: filePath,
          header: [
            { id: 'id', title: 'ID' },
            { id: 'timestamp', title: 'Timestamp' },
            { id: 'entityType', title: 'Entity Type' },
            { id: 'entityId', title: 'Entity ID' },
            { id: 'action', title: 'Action' },
            { id: 'userId', title: 'User ID' },
            { id: 'severity', title: 'Severity' },
            { id: 'category', title: 'Category' },
            { id: 'ipAddress', title: 'IP Address' }
          ]
        });

        const csvData = entries.map(entry => ({
          id: entry.id,
          timestamp: entry.timestamp.toISOString(),
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          userId: entry.userId || '',
          severity: entry.severity,
          category: entry.category || '',
          ipAddress: entry.ipAddress || ''
        }));

        await csvWriter.writeRecords(csvData);
        
        logger.info('CSV report exported', { filePath, entriesCount: csvData.length });
        return filePath;

      } else if (format === 'json') {
        const filePath = path.join(reportsDir, `${fileName}.json`);
        
        const reportData = {
          report,
          entries: entries.map(entry => ({
            ...entry,
            details: entry.encrypted ? '[ENCRYPTED]' : entry.details
          }))
        };

        await fs.writeFile(filePath, JSON.stringify(reportData, null, 2));
        
        logger.info('JSON report exported', { filePath, entriesCount: entries.length });
        return filePath;

      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }

    } catch (error) {
      logger.error('Error exporting report:', error);
      throw new Error(`Failed to export report: ${error.message}`);
    }
  }
}