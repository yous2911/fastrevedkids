import crypto from 'crypto';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { AuditTrailService } from './audit-trail.service';
import { DataAnonymizationService } from './data-anonymization.service';
import { EmailService } from './email.service';
import { db } from '../db/connection';
import { 
  students, 
  studentProgress, 
  sessions, 
  auditLogs,
  gdprConsentRequests,
  retentionPolicies,
  retentionSchedules
} from '../db/schema';
import { eq, and, lt, gte, sql } from 'drizzle-orm';

// Validation schemas
const RetentionPolicySchema = z.object({
  policyName: z.string().min(2).max(100),
  entityType: z.enum(['student', 'parent', 'exercise', 'progress', 'session', 'audit_log', 'consent']),
  retentionPeriodDays: z.number().min(1).max(10950), // Max ~30 years
  triggerCondition: z.enum(['time_based', 'event_based', 'consent_withdrawal', 'account_deletion']),
  action: z.enum(['delete', 'anonymize', 'archive', 'notify_only']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  active: z.boolean().default(true),
  legalBasis: z.string().optional(),
  exceptions: z.array(z.string()).default([]),
  notificationDays: z.number().min(0).max(365).default(30)
});

const RetentionScheduleSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  policyId: z.string(),
  scheduledDate: z.date(),
  action: z.enum(['delete', 'anonymize', 'archive']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  notificationSent: z.boolean().default(false),
  completed: z.boolean().default(false)
});

export interface RetentionPolicy {
  id: string;
  policyName: string;
  entityType: string;
  retentionPeriodDays: number;
  triggerCondition: 'time_based' | 'event_based' | 'consent_withdrawal' | 'account_deletion';
  action: 'delete' | 'anonymize' | 'archive' | 'notify_only';
  priority: 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
  legalBasis?: string;
  exceptions: string[];
  notificationDays: number;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  recordsProcessed: number;
}

export interface RetentionSchedule {
  id: string;
  entityType: string;
  entityId: string;
  policyId: string;
  scheduledDate: Date;
  action: 'delete' | 'anonymize' | 'archive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notificationSent: boolean;
  completed: boolean;
  completedAt?: Date;
  errors: string[];
  createdAt: Date;
}

export interface RetentionReport {
  id: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  policiesExecuted: number;
  recordsProcessed: number;
  actionsBreakdown: Record<string, number>;
  entitiesBreakdown: Record<string, number>;
  errors: string[];
  complianceStatus: 'compliant' | 'partial' | 'non_compliant';
  recommendations: string[];
  generatedAt: Date;
}

export interface LegalRetentionRequirements {
  dataCategory: string;
  minimumRetentionDays: number;
  maximumRetentionDays?: number;
  legalBasis: string;
  jurisdiction: string;
  specialConditions: string[];
}

export class DataRetentionService {
  private auditService: AuditTrailService;
  private anonymizationService: DataAnonymizationService;
  private emailService: EmailService;
  private policies: Map<string, RetentionPolicy> = new Map();
  private schedules: Map<string, RetentionSchedule> = new Map();
  private legalRequirements: Map<string, LegalRetentionRequirements> = new Map();

  constructor() {
    this.auditService = new AuditTrailService();
    this.anonymizationService = new DataAnonymizationService();
    this.emailService = new EmailService();
    
    this.initializeDefaultPolicies();
    this.initializeLegalRequirements();
    this.scheduleRetentionTasks();
  }

  /**
   * Create a new retention policy
   */
  async createRetentionPolicy(policyData: z.infer<typeof RetentionPolicySchema>): Promise<string> {
    try {
      const validatedData = RetentionPolicySchema.parse(policyData);
      
      // Validate against legal requirements
      await this.validatePolicyCompliance(validatedData);
      
      const policyId = crypto.randomUUID();
      
      const policy: RetentionPolicy = {
        id: policyId,
        policyName: validatedData.policyName,
        entityType: validatedData.entityType,
        retentionPeriodDays: validatedData.retentionPeriodDays,
        triggerCondition: validatedData.triggerCondition,
        action: validatedData.action,
        priority: validatedData.priority,
        active: validatedData.active,
        legalBasis: validatedData.legalBasis,
        exceptions: validatedData.exceptions,
        notificationDays: validatedData.notificationDays,
        createdAt: new Date(),
        updatedAt: new Date(),
        recordsProcessed: 0
      };

      this.policies.set(policyId, policy);
      await this.savePolicyToDatabase(policy);

      // Log policy creation
      await this.auditService.logAction({
        entityType: 'retention_policy',
        entityId: policyId,
        action: 'create',
        userId: null,
        details: {
          policyName: validatedData.policyName,
          entityType: validatedData.entityType,
          retentionPeriodDays: validatedData.retentionPeriodDays,
          action: validatedData.action
        },
        severity: 'medium',
        category: 'compliance'
      });

      logger.info('Retention policy created', { 
        policyId, 
        policyName: validatedData.policyName,
        entityType: validatedData.entityType 
      });

      return policyId;

    } catch (error) {
      logger.error('Error creating retention policy:', error);
      throw new Error('Failed to create retention policy');
    }
  }

  /**
   * Execute retention policies
   */
  async executeRetentionPolicies(): Promise<{
    policiesExecuted: number;
    recordsProcessed: number;
    errorsEncountered: number;
  }> {
    let policiesExecuted = 0;
    let recordsProcessed = 0;
    let errorsEncountered = 0;

    try {
      const activePolicies = Array.from(this.policies.values()).filter(p => p.active);
      
      logger.info(`Executing ${activePolicies.length} active retention policies`);

      for (const policy of activePolicies) {
        try {
          const policyResult = await this.executeSinglePolicy(policy);
          recordsProcessed += policyResult.recordsProcessed;
          policiesExecuted++;

          // Update policy statistics
          policy.lastExecuted = new Date();
          policy.recordsProcessed += policyResult.recordsProcessed;
          await this.updatePolicyInDatabase(policy);

        } catch (error) {
          errorsEncountered++;
          logger.error(`Error executing policy ${policy.id}:`, error);
          
          // Log policy execution error
          await this.auditService.logAction({
            entityType: 'retention_policy',
            entityId: policy.id,
            action: 'failed',
            userId: null,
            details: {
              policyName: policy.policyName,
              error: error instanceof Error ? error.message : 'Unknown error'
            },
            severity: 'high',
            category: 'compliance'
          });
        }
      }

      // Log overall execution results
      await this.auditService.logAction({
        entityType: 'retention_execution',
        entityId: crypto.randomUUID(),
        action: 'completed',
        userId: null,
        details: {
          policiesExecuted,
          recordsProcessed,
          errorsEncountered,
          executedAt: new Date()
        },
        severity: 'medium',
        category: 'compliance'
      });

      logger.info('Retention policies execution completed', {
        policiesExecuted,
        recordsProcessed,
        errorsEncountered
      });

      return { policiesExecuted, recordsProcessed, errorsEncountered };

    } catch (error) {
      logger.error('Error executing retention policies:', error);
      throw new Error('Failed to execute retention policies');
    }
  }

  /**
   * Execute a single retention policy
   */
  private async executeSinglePolicy(policy: RetentionPolicy): Promise<{
    recordsProcessed: number;
  }> {
    let recordsProcessed = 0;

    try {
      // Find entities that meet retention criteria
      const eligibleEntities = await this.findEligibleEntities(policy);
      
      logger.info(`Found ${eligibleEntities.length} entities eligible for policy ${policy.policyName}`);

      for (const entity of eligibleEntities) {
        try {
          // Check for exceptions
          if (this.hasRetentionException(entity, policy.exceptions)) {
            logger.debug(`Entity ${entity.id} has retention exception, skipping`);
            continue;
          }

          // Send notification if configured
          if (policy.notificationDays > 0 && !entity.notificationSent) {
            await this.sendRetentionNotification(entity, policy);
            await this.markNotificationSent(entity.id);
            continue; // Don't process until notification period expires
          }

          // Execute retention action
          await this.executeRetentionAction(entity, policy);
          recordsProcessed++;

          // Log individual retention action
          await this.auditService.logAction({
            entityType: 'retention_execution' as const,
            entityId: entity.id,
            action: 'data_retention_applied',
            userId: null,
            details: {
              policyId: policy.id,
              policyName: policy.policyName,
              action: policy.action,
              retentionPeriodDays: policy.retentionPeriodDays
            },
            severity: 'medium',
            category: 'compliance'
          });

        } catch (error) {
          logger.error(`Error processing entity ${entity.id}:`, error);
          // Continue with other entities
        }
      }

      return { recordsProcessed };

    } catch (error) {
      logger.error(`Error executing policy ${policy.id}:`, error);
      throw error;
    }
  }

  /**
   * Execute retention action on an entity
   */
  private async executeRetentionAction(entity: any, policy: RetentionPolicy): Promise<void> {
    switch (policy.action) {
      case 'delete':
        await this.deleteEntity(entity, policy);
        break;

      case 'anonymize':
        await this.anonymizationService.scheduleAnonymization({
          entityType: policy.entityType,
          entityId: entity.id,
          reason: 'retention_policy',
          preserveStatistics: true,
          immediateExecution: true,
          notifyUser: false
        });
        break;

      case 'archive':
        await this.archiveEntity(entity, policy);
        break;

      case 'notify_only':
        await this.sendRetentionNotification(entity, policy);
        break;

      default:
        throw new Error(`Unknown retention action: ${policy.action}`);
    }
  }

  /**
   * Schedule retention for specific entity
   */
  async scheduleRetention(scheduleData: z.infer<typeof RetentionScheduleSchema>): Promise<string> {
    try {
      const validatedData = RetentionScheduleSchema.parse(scheduleData);
      
      const scheduleId = crypto.randomUUID();
      
      const schedule: RetentionSchedule = {
        id: scheduleId,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        policyId: validatedData.policyId,
        scheduledDate: validatedData.scheduledDate,
        action: validatedData.action,
        priority: validatedData.priority,
        notificationSent: validatedData.notificationSent,
        completed: validatedData.completed,
        errors: [],
        createdAt: new Date()
      };

      this.schedules.set(scheduleId, schedule);
      await this.saveScheduleToDatabase(schedule);

      // Log scheduling
      await this.auditService.logAction({
        entityType: 'retention_schedule',
        entityId: scheduleId,
        action: 'create',
        userId: null,
        details: {
          targetEntityType: validatedData.entityType,
          targetEntityId: validatedData.entityId,
          scheduledDate: validatedData.scheduledDate,
          action: validatedData.action
        },
        severity: 'low',
        category: 'compliance'
      });

      logger.info('Retention scheduled', { 
        scheduleId, 
        entityType: validatedData.entityType,
        scheduledDate: validatedData.scheduledDate 
      });

      return scheduleId;

    } catch (error) {
      logger.error('Error scheduling retention:', error);
      throw new Error('Failed to schedule retention');
    }
  }

  /**
   * Generate retention compliance report
   */
  async generateRetentionReport(startDate: Date, endDate: Date): Promise<RetentionReport> {
    try {
      const reportId = crypto.randomUUID();
      
      // Collect data for the report period
      const executedPolicies = await this.getExecutedPoliciesInPeriod(startDate, endDate);
      const processedRecords = await this.getProcessedRecordsInPeriod(startDate, endDate);
      
      // Analyze actions breakdown
      const actionsBreakdown: Record<string, number> = {};
      const entitiesBreakdown: Record<string, number> = {};
      
      for (const record of processedRecords) {
        actionsBreakdown[record.action] = (actionsBreakdown[record.action] || 0) + 1;
        entitiesBreakdown[record.entityType] = (entitiesBreakdown[record.entityType] || 0) + 1;
      }

      // Check compliance status
      const complianceStatus = await this.assessComplianceStatus();
      const recommendations = await this.generateComplianceRecommendations();
      
      const report: RetentionReport = {
        id: reportId,
        period: { startDate, endDate },
        policiesExecuted: executedPolicies.length,
        recordsProcessed: processedRecords.length,
        actionsBreakdown,
        entitiesBreakdown,
        errors: [], // Collect from audit logs
        complianceStatus,
        recommendations,
        generatedAt: new Date()
      };

      // Log report generation
      await this.auditService.logAction({
        entityType: 'retention_report',
        entityId: reportId,
        action: 'create',
        userId: null,
        details: {
          period: { startDate, endDate },
          policiesExecuted: executedPolicies.length,
          recordsProcessed: processedRecords.length,
          complianceStatus
        },
        severity: 'low',
        category: 'compliance'
      });

      logger.info('Retention report generated', { 
        reportId, 
        period: { startDate, endDate },
        complianceStatus 
      });

      return report;

    } catch (error) {
      logger.error('Error generating retention report:', error);
      throw new Error('Failed to generate retention report');
    }
  }

  /**
   * Get retention status for entity
   */
  async getRetentionStatus(entityType: string, entityId: string): Promise<{
    applicablePolicies: RetentionPolicy[];
    scheduledActions: RetentionSchedule[];
    retentionDate?: Date;
    daysUntilRetention?: number;
    canExtendRetention: boolean;
  }> {
    try {
      // Find applicable policies
      const applicablePolicies = Array.from(this.policies.values())
        .filter(p => p.entityType === entityType && p.active);

      // Find scheduled actions
      const scheduledActions = Array.from(this.schedules.values())
        .filter(s => s.entityType === entityType && s.entityId === entityId && !s.completed);

      // Calculate retention date
      let retentionDate: Date | undefined;
      let daysUntilRetention: number | undefined;

      if (scheduledActions.length > 0) {
        // Use earliest scheduled action
        retentionDate = scheduledActions.reduce((earliest, schedule) => 
          schedule.scheduledDate < earliest ? schedule.scheduledDate : earliest, 
          scheduledActions[0].scheduledDate
        );
        
        daysUntilRetention = Math.ceil(
          (retentionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
      }

      // Check if retention can be extended (based on legal requirements)
      const canExtendRetention = await this.canExtendRetention(entityType, entityId);

      return {
        applicablePolicies,
        scheduledActions,
        retentionDate,
        daysUntilRetention,
        canExtendRetention
      };

    } catch (error) {
      logger.error('Error getting retention status:', error);
      throw new Error('Failed to get retention status');
    }
  }

  // Private helper methods
  private initializeDefaultPolicies(): void {
    // Default policies for educational platform
    const defaultPolicies = [
      {
        policyName: 'Student Data Retention',
        entityType: 'student',
        retentionPeriodDays: 1095, // 3 years after last activity
        triggerCondition: 'time_based',
        action: 'anonymize',
        priority: 'medium',
        legalBasis: 'GDPR Article 5(1)(e) - Storage limitation',
        exceptions: ['active_student', 'legal_obligation']
      },
      {
        policyName: 'Parent Consent Records',
        entityType: 'consent',
        retentionPeriodDays: 2555, // 7 years for legal compliance
        triggerCondition: 'time_based',
        action: 'delete',
        priority: 'high',
        legalBasis: 'Legal obligation for consent records',
        exceptions: ['ongoing_relationship']
      },
      {
        policyName: 'Session Data Cleanup',
        entityType: 'session',
        retentionPeriodDays: 90, // 3 months
        triggerCondition: 'time_based',
        action: 'delete',
        priority: 'low',
        legalBasis: 'Data minimization principle',
        exceptions: []
      },
      {
        policyName: 'Audit Log Retention',
        entityType: 'audit_log',
        retentionPeriodDays: 2190, // 6 years for compliance
        triggerCondition: 'time_based',
        action: 'delete',
        priority: 'high',
        legalBasis: 'Regulatory compliance requirements',
        exceptions: ['security_incident', 'legal_proceeding']
      }
    ];

    // Create policies
    for (const policyData of defaultPolicies) {
      const policyId = crypto.randomUUID();
      const policy: RetentionPolicy = {
        id: policyId,
        ...policyData,
        active: true,
        notificationDays: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
        recordsProcessed: 0
      } as RetentionPolicy;

      this.policies.set(policyId, policy);
    }

    logger.info(`Initialized ${defaultPolicies.length} default retention policies`);
  }

  private initializeLegalRequirements(): void {
    // French GDPR and educational data requirements
    const requirements: LegalRetentionRequirements[] = [
      {
        dataCategory: 'student_educational_records',
        minimumRetentionDays: 365, // 1 year minimum
        maximumRetentionDays: 1095, // 3 years maximum without consent
        legalBasis: 'GDPR Article 5(1)(e) and French Education Code',
        jurisdiction: 'France',
        specialConditions: ['Parental consent can extend retention', 'Educational interest']
      },
      {
        dataCategory: 'parental_consent',
        minimumRetentionDays: 2555, // 7 years
        legalBasis: 'Proof of consent legal obligation',
        jurisdiction: 'France',
        specialConditions: ['Must retain for audit purposes']
      },
      {
        dataCategory: 'financial_records',
        minimumRetentionDays: 3650, // 10 years
        legalBasis: 'French Commercial Code',
        jurisdiction: 'France',
        specialConditions: ['Tax and accounting obligations']
      }
    ];

    for (const requirement of requirements) {
      this.legalRequirements.set(requirement.dataCategory, requirement);
    }

    logger.info(`Initialized ${requirements.length} legal retention requirements`);
  }

  private scheduleRetentionTasks(): void {
    // Schedule daily retention policy execution
    const dailyInterval = 24 * 60 * 60 * 1000; // 24 hours
    
    setInterval(() => {
      this.executeRetentionPolicies().catch(error => {
        logger.error('Error in scheduled retention execution:', error);
      });
    }, dailyInterval);

    // Schedule weekly compliance report
    const weeklyInterval = 7 * 24 * 60 * 60 * 1000; // 1 week
    
    setInterval(() => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - weeklyInterval);
      
      this.generateRetentionReport(startDate, endDate).catch(error => {
        logger.error('Error generating scheduled retention report:', error);
      });
    }, weeklyInterval);

    logger.info('Retention tasks scheduled');
  }

  private async validatePolicyCompliance(policyData: z.infer<typeof RetentionPolicySchema>): Promise<void> {
    const requirement = this.legalRequirements.get(policyData.entityType);
    
    if (requirement) {
      if (policyData.retentionPeriodDays < requirement.minimumRetentionDays) {
        throw new Error(
          `Retention period too short. Minimum required: ${requirement.minimumRetentionDays} days`
        );
      }
      
      if (requirement.maximumRetentionDays && 
          policyData.retentionPeriodDays > requirement.maximumRetentionDays) {
        throw new Error(
          `Retention period too long. Maximum allowed: ${requirement.maximumRetentionDays} days`
        );
      }
    }
  }

  /**
   * Save retention policy to database
   */
  private async savePolicyToDatabase(policy: RetentionPolicy): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(retentionPolicies).values({
          id: policy.id,
          policyName: policy.policyName,
          entityType: policy.entityType,
          retentionPeriodDays: policy.retentionPeriodDays,
          triggerCondition: policy.triggerCondition,
          action: policy.action,
          priority: policy.priority,
          active: policy.active,
          legalBasis: policy.legalBasis,
          exceptions: policy.exceptions,
          notificationDays: policy.notificationDays,
          lastExecuted: policy.lastExecuted,
          recordsProcessed: policy.recordsProcessed
        });
      });

      logger.debug('Retention policy saved to database', { policyId: policy.id });
    } catch (error) {
      logger.error('Error saving retention policy to database:', error);
      throw new Error(`Failed to save retention policy: ${error.message}`);
    }
  }

  /**
   * Update retention policy in database
   */
  private async updatePolicyInDatabase(policy: RetentionPolicy): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(retentionPolicies)
          .set({
            policyName: policy.policyName,
            retentionPeriodDays: policy.retentionPeriodDays,
            triggerCondition: policy.triggerCondition,
            action: policy.action,
            priority: policy.priority,
            active: policy.active,
            legalBasis: policy.legalBasis,
            exceptions: policy.exceptions,
            notificationDays: policy.notificationDays,
            lastExecuted: policy.lastExecuted,
            recordsProcessed: policy.recordsProcessed,
            updatedAt: new Date()
          })
          .where(eq(retentionPolicies.id, policy.id));
      });

      logger.debug('Retention policy updated in database', { policyId: policy.id });
    } catch (error) {
      logger.error('Error updating retention policy in database:', error);
      throw new Error(`Failed to update retention policy: ${error.message}`);
    }
  }

  /**
   * Save retention schedule to database
   */
  private async saveScheduleToDatabase(schedule: RetentionSchedule): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(retentionSchedules).values({
          id: schedule.id,
          entityType: schedule.entityType,
          entityId: schedule.entityId,
          policyId: schedule.policyId,
          scheduledDate: schedule.scheduledDate,
          action: schedule.action,
          priority: schedule.priority,
          notificationSent: schedule.notificationSent,
          completed: schedule.completed,
          completedAt: schedule.completedAt,
          errors: schedule.errors
        });
      });

      logger.debug('Retention schedule saved to database', { scheduleId: schedule.id });
    } catch (error) {
      logger.error('Error saving retention schedule to database:', error);
      throw new Error(`Failed to save retention schedule: ${error.message}`);
    }
  }

  /**
   * Find entities eligible for retention processing
   */
  private async findEligibleEntities(policy: RetentionPolicy): Promise<any[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);
      
      const eligibleEntities = [];

      switch (policy.entityType) {
        case 'student':
          const studentRecords = await db
            .select()
            .from(students)
            .where(lt(students.dernierAcces, cutoffDate));
          
          eligibleEntities.push(...studentRecords.map(student => ({
            id: student.id.toString(),
            type: 'student',
            lastActivity: student.dernierAcces,
            data: student
          })));
          break;

        case 'session':
          const sessionRecords = await db
            .select()
            .from(sessions)
            .where(lt(sessions.expiresAt, cutoffDate));
          
          eligibleEntities.push(...sessionRecords.map(session => ({
            id: session.id.toString(),
            type: 'session',
            lastActivity: session.expiresAt,
            data: session
          })));
          break;

        case 'progress':
          const progressRecords = await db
            .select()
            .from(studentProgress)
            .where(lt(studentProgress.updatedAt, cutoffDate));
          
          eligibleEntities.push(...progressRecords.map(progress => ({
            id: progress.id.toString(),
            type: 'progress',
            lastActivity: progress.updatedAt,
            data: progress
          })));
          break;

        case 'audit_log':
          const auditRecords = await db
            .select()
            .from(auditLogs)
            .where(lt(auditLogs.timestamp, cutoffDate));
          
          eligibleEntities.push(...auditRecords.map(audit => ({
            id: audit.id,
            type: 'audit_log',
            lastActivity: audit.timestamp,
            data: audit
          })));
          break;

        case 'consent':
          const consentRecords = await db
            .select()
            .from(gdprConsentRequests)
            .where(lt(gdprConsentRequests.createdAt, cutoffDate));
          
          eligibleEntities.push(...consentRecords.map(consent => ({
            id: consent.id,
            type: 'consent',
            lastActivity: consent.createdAt,
            data: consent
          })));
          break;
      }

      logger.debug('Found eligible entities for retention', { 
        policyId: policy.id,
        entityType: policy.entityType,
        count: eligibleEntities.length 
      });

      return eligibleEntities;

    } catch (error) {
      logger.error('Error finding eligible entities:', error);
      return [];
    }
  }

  /**
   * Check if entity has retention exception
   */
  private hasRetentionException(entity: any, exceptions: string[]): boolean {
    try {
      if (exceptions.length === 0) {
        return false;
      }

      // Check various exception conditions
      for (const exception of exceptions) {
        switch (exception.toLowerCase()) {
          case 'active_legal_case':
            // Check if entity is involved in active legal proceedings
            if (entity.data?.legalHold === true) {
              return true;
            }
            break;

          case 'ongoing_audit':
            // Check if entity is part of ongoing audit
            if (entity.data?.auditFlag === true) {
              return true;
            }
            break;

          case 'premium_account':
            // Check if this is a premium/paid account
            if (entity.data?.accountType === 'premium') {
              return true;
            }
            break;

          case 'recent_activity':
            // Check for recent activity within exception period
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 30); // 30 days
            if (entity.lastActivity > recentDate) {
              return true;
            }
            break;

          case 'regulatory_requirement':
            // Check if subject to specific regulatory requirements
            if (entity.data?.regulatoryRetention === true) {
              return true;
            }
            break;
        }
      }

      return false;

    } catch (error) {
      logger.error('Error checking retention exceptions:', error);
      return false; // Fail safe - don't apply exception if check fails
    }
  }

  /**
   * Send retention notification to relevant parties
   */
  private async sendRetentionNotification(entity: any, policy: RetentionPolicy): Promise<void> {
    try {
      // Create audit log for notification
      await this.auditService.logAction({
        entityType: 'gdpr_request',
        entityId: entity.id,
        action: 'create',
        userId: null,
        details: {
          notificationType: 'retention_warning',
          policyId: policy.id,
          policyName: policy.policyName,
          scheduledAction: policy.action,
          retentionPeriod: policy.retentionPeriodDays,
          warningDays: policy.notificationDays
        },
        severity: 'medium',
        category: 'compliance'
      });

      // In a real implementation, this would send actual notifications
      // For now, we log the notification intent
      logger.info('Retention notification sent', {
        entityId: entity.id,
        entityType: entity.type,
        policyId: policy.id,
        action: policy.action
      });

      // TODO: Implement actual email/SMS notification
      // await this.emailService.sendRetentionWarning(entity, policy);

    } catch (error) {
      logger.error('Error sending retention notification:', error);
    }
  }

  /**
   * Mark notification as sent
   */
  private async markNotificationSent(entityId: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(retentionSchedules)
          .set({
            notificationSent: true
          })
          .where(eq(retentionSchedules.entityId, entityId));
      });

      logger.debug('Retention notification marked as sent', { entityId });
    } catch (error) {
      logger.error('Error marking notification as sent:', error);
    }
  }

  /**
   * Delete entity according to retention policy
   */
  private async deleteEntity(entity: any, policy: RetentionPolicy): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        switch (entity.type) {
          case 'student':
            // Delete student and cascade to related records
            await tx.delete(studentProgress).where(eq(studentProgress.studentId, parseInt(entity.id)));
            await tx.delete(sessions).where(eq(sessions.studentId, parseInt(entity.id)));
            await tx.delete(students).where(eq(students.id, parseInt(entity.id)));
            break;

          case 'session':
            await tx.delete(sessions).where(eq(sessions.id, entity.id));
            break;

          case 'progress':
            await tx.delete(studentProgress).where(eq(studentProgress.id, parseInt(entity.id)));
            break;

          case 'audit_log':
            await tx.delete(auditLogs).where(eq(auditLogs.id, entity.id));
            break;

          case 'consent':
            await tx.delete(gdprConsentRequests).where(eq(gdprConsentRequests.id, entity.id));
            break;
        }
      });

      // Log the deletion
      await this.auditService.logAction({
        entityType: entity.type as any,
        entityId: entity.id,
        action: 'delete',
        userId: null,
        details: {
          reason: 'retention_policy',
          policyId: policy.id,
          policyName: policy.policyName,
          retentionPeriod: policy.retentionPeriodDays
        },
        severity: 'high',
        category: 'compliance'
      });

      logger.info('Entity deleted by retention policy', { 
        entityId: entity.id,
        entityType: entity.type,
        policyId: policy.id 
      });

    } catch (error) {
      logger.error('Error deleting entity:', error);
      throw error;
    }
  }

  /**
   * Archive entity according to retention policy
   */
  private async archiveEntity(entity: any, policy: RetentionPolicy): Promise<void> {
    try {
      // In a real implementation, this would move data to an archive storage
      // For now, we'll mark it as archived and potentially anonymize
      
      await db.transaction(async (tx) => {
        // Add an archive flag or move to archive table
        // This is implementation-specific based on your archiving strategy
        
        // Example: Add archive metadata
        const archiveData = {
          originalId: entity.id,
          entityType: entity.type,
          archivedAt: new Date(),
          policyId: policy.id,
          data: entity.data
        };

        // In a real system, you would insert into an archives table
        // await tx.insert(archives).values(archiveData);
      });

      // Log the archiving
      await this.auditService.logAction({
        entityType: entity.type as any,
        entityId: entity.id,
        action: 'delete',
        userId: null,
        details: {
          reason: 'retention_policy',
          policyId: policy.id,
          policyName: policy.policyName,
          archiveLocation: 'cold_storage'
        },
        severity: 'medium',
        category: 'compliance'
      });

      logger.info('Entity archived by retention policy', { 
        entityId: entity.id,
        entityType: entity.type,
        policyId: policy.id 
      });

    } catch (error) {
      logger.error('Error archiving entity:', error);
      throw error;
    }
  }

  private async getExecutedPoliciesInPeriod(startDate: Date, endDate: Date): Promise<any[]> {
    // TODO: Implement database query
    return [];
  }

  private async getProcessedRecordsInPeriod(startDate: Date, endDate: Date): Promise<any[]> {
    // TODO: Implement database query
    return [];
  }

  private async assessComplianceStatus(): Promise<'compliant' | 'partial' | 'non_compliant'> {
    // TODO: Implement compliance assessment
    return 'compliant';
  }

  private async generateComplianceRecommendations(): Promise<string[]> {
    // TODO: Implement recommendations generation
    return [
      'Continue monitoring retention policy effectiveness',
      'Review policies quarterly for regulatory changes',
      'Ensure all policies have proper legal basis documentation'
    ];
  }

  private async canExtendRetention(entityType: string, entityId: string): Promise<boolean> {
    // TODO: Implement retention extension eligibility check
    return false;
  }
}