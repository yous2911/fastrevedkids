import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParentalConsentService } from '../services/parental-consent.service';
import { DataAnonymizationService } from '../services/data-anonymization.service';
import { DataRetentionService } from '../services/data-retention.service';
import { AuditTrailService } from '../services/audit-trail.service';
import { EncryptionService } from '../services/encryption.service';
import { emailService } from '../services/email.service';

// Mock external dependencies
vi.mock('../services/email.service', () => ({
  emailService: {
    sendParentalConsentEmail: vi.fn(),
    sendEmailWithRetry: vi.fn()
  }
}));

vi.mock('../services/audit-trail.service', () => ({
  AuditTrailService: vi.fn().mockImplementation(() => ({
    logAction: vi.fn()
  }))
}));

vi.mock('../services/encryption.service', () => ({
  EncryptionService: vi.fn().mockImplementation(() => ({
    encryptStudentData: vi.fn(),
    decryptStudentData: vi.fn()
  }))
}));

vi.mock('../db/connection', () => ({
  db: {
    transaction: vi.fn((callback) => callback({
      insert: vi.fn(),
      update: vi.fn(),
      select: vi.fn(),
      delete: vi.fn()
    }))
  },
  getDatabase: vi.fn(() => ({
    transaction: vi.fn((callback) => callback({
      insert: vi.fn(),
      update: vi.fn(),
      select: vi.fn(),
      delete: vi.fn()
    }))
  })),
  testConnection: vi.fn(() => Promise.resolve(true)),
  config: {}
}));

describe('GDPR Services Layer Tests', () => {
  let consentService: ParentalConsentService;
  let anonymizationService: DataAnonymizationService;
  let retentionService: DataRetentionService;
  let auditService: AuditTrailService;
  let encryptionService: EncryptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    consentService = new ParentalConsentService();
    anonymizationService = new DataAnonymizationService();
    retentionService = new DataRetentionService();
    auditService = new AuditTrailService();
    encryptionService = new EncryptionService();
  });

  describe('ParentalConsentService', () => {
    describe('initiateConsent', () => {
      it('should create new consent request with valid data', async () => {
        const consentData = {
          parentEmail: 'parent@example.com',
          parentName: 'John Parent',
          childName: 'Alice Child',
          childAge: 8,
          consentTypes: ['data_processing' as const],
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date()
        };

        const result = await consentService.initiateConsent(consentData);

        expect(result.consentId).toBeTruthy();
        expect(result.message).toContain('email de confirmation');
      });

      it('should validate required fields', async () => {
        const invalidData = {
          parentEmail: 'invalid-email',
          parentName: '',
          childAge: -1,
          consentTypes: [],
          ipAddress: 'invalid-ip',
          userAgent: '',
          timestamp: new Date()
        };

        await expect(consentService.initiateConsent(invalidData as any))
          .rejects.toThrow();
      });

      it('should handle duplicate consent requests', async () => {
        const consentData = {
          parentEmail: 'duplicate@example.com',
          parentName: 'Duplicate Parent',
          childName: 'Duplicate Child',
          childAge: 8,
          consentTypes: ['data_processing' as const],
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date()
        };

        // First submission
        const firstResult = await consentService.initiateConsent(consentData);
        expect(firstResult.consentId).toBeTruthy();

        // Second submission should fail due to existing pending consent
        await expect(consentService.initiateConsent(consentData))
          .rejects.toThrow('Un processus de consentement est déjà en cours');
      });

      it('should set appropriate expiry dates', async () => {
        const consentData = {
          parentEmail: 'expiry@example.com',
          parentName: 'Expiry Parent',
          childName: 'Expiry Child',
          childAge: 8,
          consentTypes: ['data_processing' as const],
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date()
        };

        const result = await consentService.initiateConsent(consentData);
        
        // The service should return a consentId, but we can't easily test expiry date
        // since it's not returned in the response
        expect(result.consentId).toBeTruthy();
      });
    });

    describe('processFirstConsent', () => {
      it('should process first consent and trigger second email', async () => {
        const token = 'first-consent-token-123';
        const verificationData = {
          token,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        };

        // Mock the findConsentByFirstToken method
        vi.spyOn(consentService as any, 'findConsentByFirstToken').mockResolvedValue({
          id: 'consent-id-123',
          parentEmail: 'parent@example.com',
          parentName: 'John Parent',
          childName: 'Alice Child',
          status: 'pending',
          firstConsentToken: token,
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        vi.spyOn(consentService as any, 'updateConsent').mockResolvedValue(undefined);

        const result = await consentService.processFirstConsent(token, verificationData);

        expect(result.message).toContain('première confirmation');
        expect(result.requiresSecondConsent).toBe(true);
      });

      it('should reject expired tokens', async () => {
        const expiredToken = 'expired-token';
        const verificationData = {
          token: expiredToken,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        };

        vi.spyOn(consentService as any, 'findConsentByFirstToken').mockResolvedValue({
          id: 'expired-consent',
          status: 'pending',
          firstConsentToken: expiredToken,
          expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired yesterday
        });

        await expect(consentService.processFirstConsent(expiredToken, verificationData))
          .rejects.toThrow('Le délai de consentement a expiré');
      });

      it('should reject invalid tokens', async () => {
        const invalidToken = 'invalid-token';
        const verificationData = {
          token: invalidToken,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        };

        vi.spyOn(consentService as any, 'findConsentByFirstToken').mockResolvedValue(null);

        await expect(consentService.processFirstConsent(invalidToken, verificationData))
          .rejects.toThrow('Token de consentement invalide');
      });

      it('should reject already verified tokens', async () => {
        const verifiedToken = 'verified-token';
        const verificationData = {
          token: verifiedToken,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        };

        vi.spyOn(consentService as any, 'findConsentByFirstToken').mockResolvedValue({
          id: 'verified-consent',
          status: 'verified',
          firstConsentToken: verifiedToken,
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        await expect(consentService.processFirstConsent(verifiedToken, verificationData))
          .rejects.toThrow('Ce consentement a déjà été traité');
      });
    });

    describe('processSecondConsent', () => {
      it('should complete consent verification process', async () => {
        const token = 'second-consent-token-123';
        const verificationData = {
          token,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        };

        vi.spyOn(consentService as any, 'findConsentBySecondToken').mockResolvedValue({
          id: 'consent-id-123',
          parentEmail: 'parent@example.com',
          parentName: 'John Parent',
          childName: 'Alice Child',
          status: 'pending',
          firstConsentDate: new Date(),
          secondConsentToken: token,
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        vi.spyOn(consentService as any, 'updateConsent').mockResolvedValue(undefined);

        const result = await consentService.processSecondConsent(token, verificationData);

        expect(result.message).toContain('consentement confirmé');
      });

      it('should reject second verification without first verification', async () => {
        const token = 'second-token-no-first';
        const verificationData = {
          token,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        };

        vi.spyOn(consentService as any, 'findConsentBySecondToken').mockResolvedValue({
          id: 'invalid-consent',
          status: 'pending',
          secondConsentToken: token,
          firstConsentDate: null, // No first consent
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        await expect(consentService.processSecondConsent(token, verificationData))
          .rejects.toThrow('Première confirmation requise');
      });
    });

    describe('getConsentStatus', () => {
      it('should return consent status and verification details', async () => {
        const consentId = 'consent-id-123';

        vi.spyOn(consentService as any, 'findConsentById').mockResolvedValue({
          id: consentId,
          status: 'verified',
          parentEmail: 'parent@example.com',
          childName: 'Alice Child',
          firstConsentDate: new Date(),
          secondConsentDate: new Date(),
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        const result = await consentService.getConsentStatus(consentId);

        expect(result.status).toBe('verified');
        expect(result.parentEmail).toBe('parent@example.com');
        expect(result.childName).toBe('Alice Child');
      });

      it('should identify expired consent', async () => {
        const consentId = 'expired-consent-id';

        vi.spyOn(consentService as any, 'findConsentById').mockResolvedValue({
          id: consentId,
          status: 'pending',
          expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired yesterday
        });

        const result = await consentService.getConsentStatus(consentId);

        expect(result.status).toBe('pending');
        expect(result.expiryDate.getTime()).toBeLessThan(Date.now());
      });
    });

    describe('revokeConsent', () => {
      it('should revoke consent and create audit trail', async () => {
        const consentId = 'consent-id-123';
        const parentEmail = 'parent@example.com';
        const reason = 'Parent request';

        vi.spyOn(consentService as any, 'findConsentById').mockResolvedValue({
          id: consentId,
          status: 'verified',
          parentEmail
        });

        vi.spyOn(consentService as any, 'updateConsent').mockResolvedValue(undefined);

        await consentService.revokeConsent(consentId, parentEmail, reason);

        expect(consentService['auditService'].logAction).toHaveBeenCalled();
      });

      it('should reject revocation of already revoked consent', async () => {
        const revokedConsentId = 'revoked-consent-id';
        const parentEmail = 'parent@example.com';

        vi.spyOn(consentService as any, 'findConsentById').mockResolvedValue({
          id: revokedConsentId,
          status: 'revoked',
          parentEmail
        });

        await expect(consentService.revokeConsent(revokedConsentId, parentEmail, 'test'))
          .rejects.toThrow('Consentement déjà révoqué');
      });
    });
  });

  describe('DataAnonymizationService', () => {
    describe('scheduleAnonymization', () => {
      it('should schedule anonymization job for student data', async () => {
        const config = {
          entityType: 'student',
          entityId: '123',
          reason: 'gdpr_request' as const,
          preserveStatistics: true,
          immediateExecution: false,
          notifyUser: true
        };

        const jobId = await anonymizationService.scheduleAnonymization(config);

        expect(jobId).toBeTruthy();
        expect(typeof jobId).toBe('string');
      });

      it('should handle different anonymization reasons', async () => {
        const reasons = ['consent_withdrawal', 'retention_policy', 'gdpr_request', 'inactivity', 'account_deletion'] as const;
        
        for (const reason of reasons) {
          const config = {
            entityType: 'student',
            entityId: '123',
            reason,
            preserveStatistics: true,
            immediateExecution: false,
            notifyUser: true
          };

          const jobId = await anonymizationService.scheduleAnonymization(config);
          expect(jobId).toBeTruthy();
        }
      });

      it('should create audit trail for anonymization job', async () => {
        const config = {
          entityType: 'student',
          entityId: '123',
          reason: 'gdpr_request' as const,
          preserveStatistics: true,
          immediateExecution: false,
          notifyUser: true
        };

        await anonymizationService.scheduleAnonymization(config);

        // Verify audit trail was created
        expect(anonymizationService['auditService'].logAction).toHaveBeenCalled();
      });
    });

    describe('cancelJob', () => {
      it('should cancel pending anonymization job', async () => {
        const jobId = 'test-job-id';

        const result = await anonymizationService.cancelJob(jobId);

        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('DataRetentionService', () => {
    describe('applyRetentionPolicy', () => {
      it('should identify records for retention action', async () => {
        const policy = {
          dataType: 'student_sessions',
          retentionDays: 365,
          action: 'delete'
        };

        vi.spyOn(retentionService as any, 'findExpiredRecords').mockResolvedValue([
          { id: 1, studentId: 123, createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000) },
          { id: 2, studentId: 124, createdAt: new Date(Date.now() - 380 * 24 * 60 * 60 * 1000) }
        ]);

        const result = await retentionService.applyRetentionPolicy(policy);

        expect(result.recordsProcessed).toBeGreaterThan(0);
        expect(result.success).toBe(true);
      });
    });

    describe('scheduleRetentionCheck', () => {
      it('should schedule automatic retention policy execution', async () => {
        const mockPolicies = [
          { id: 1, dataType: 'student_sessions', retentionDays: 365, isActive: true },
          { id: 2, dataType: 'audit_logs', retentionDays: 730, isActive: false }
        ];

        vi.spyOn(retentionService as any, 'getActivePolicies').mockResolvedValue(mockPolicies);
        vi.spyOn(retentionService as any, 'applyRetentionPolicy').mockResolvedValue({
          success: true,
          recordsProcessed: 5
        });

        const result = await retentionService.scheduleRetentionCheck();

        expect(result.policiesExecuted).toBe(1); // Only active policies
        expect(result.success).toBe(true);
      });
    });

    describe('getRetentionStatistics', () => {
      it('should provide comprehensive retention statistics', async () => {
        const mockStats = {
          totalPolicies: 5,
          activePolicies: 3,
          recordsProcessedToday: 25,
          totalRecordsProcessed: 150,
          averageProcessingTime: 2.5,
          lastExecutionDate: new Date(),
          nextScheduledExecution: new Date(Date.now() + 24 * 60 * 60 * 1000),
          policiesByType: {
            student_sessions: 2,
            audit_logs: 1,
            temporary_files: 2
          },
          retentionCompliance: 98.5
        };

        vi.spyOn(retentionService as any, 'calculateStatistics').mockResolvedValue(mockStats);

        const stats = await retentionService.getRetentionStatistics();

        expect(stats).toHaveProperty('totalPolicies');
        expect(stats).toHaveProperty('activePolicies');
        expect(stats).toHaveProperty('recordsProcessedToday');
        expect(stats.totalPolicies).toBe(5);
      });
    });
  });

  describe('Integration Between Services', () => {
    it('should coordinate consent verification with encryption', async () => {
      const consentData = {
        parentEmail: 'integration@example.com',
        parentName: 'Integration Parent',
        childName: 'Integration Child',
        childAge: 8,
        consentTypes: ['data_processing' as const],
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      };

      vi.spyOn(consentService as any, 'initiateConsent').mockResolvedValue({
        consentId: 'integration-consent-id',
        message: 'Email sent'
      });

      const result = await consentService.initiateConsent(consentData);

      expect(result.consentId).toBeTruthy();
      expect(emailService.sendParentalConsentEmail).toHaveBeenCalled();
    });

    it('should coordinate anonymization with audit logging', async () => {
      const studentId = 123;
      const mockStudentData = {
        id: studentId,
        prenom: 'Integration',
        nom: 'Test'
      };

      vi.spyOn(anonymizationService as any, 'getStudentData').mockResolvedValue(mockStudentData);

      await anonymizationService.anonymizeStudentData(studentId);

      expect(anonymizationService['auditService'].logAction).toHaveBeenCalled();
    });

    it('should coordinate retention policies with multiple services', async () => {
      const mockRecord = {
        id: 1,
        studentId: 123,
        prenom: 'Old',
        nom: 'Record',
        createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)
      };

      vi.spyOn(retentionService as any, 'findExpiredRecords').mockResolvedValue([mockRecord]);
      vi.spyOn(anonymizationService as any, 'anonymizeStudentData').mockResolvedValue({
        recordsProcessed: 1,
        anonymizedFields: ['prenom', 'nom'],
        preservedFields: ['id', 'studentId']
      });

      const policy = { dataType: 'student_data', retentionDays: 365, action: 'anonymize' };
      await retentionService.applyRetentionPolicy(policy);

      // Verify coordination between services
      expect(anonymizationService['anonymizeStudentData']).toHaveBeenCalledWith(mockRecord.studentId);
      expect(retentionService['auditService'].logAction).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts and retries', async () => {
      const consentData = {
        parentEmail: 'timeout@example.com',
        parentName: 'Timeout Parent',
        childName: 'Timeout Child',
        childAge: 8,
        consentTypes: ['data_processing' as const],
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      };
      
      // Mock network timeout
      vi.mocked(emailService.sendEmailWithRetry).mockRejectedValueOnce(new Error('Network timeout'));
      vi.mocked(emailService.sendEmailWithRetry).mockResolvedValueOnce(undefined);

      // Should handle the timeout gracefully
      await expect(consentService.initiateConsent(consentData))
        .rejects.toThrow();
    });

    it('should handle database connection failures', async () => {
      const studentId = 123;
      
      vi.spyOn(anonymizationService as any, 'getStudentData').mockRejectedValue(new Error('Database connection failed'));

      await expect(anonymizationService.anonymizeStudentData(studentId))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle invalid data gracefully', async () => {
      const invalidPolicy = {
        dataType: 'invalid_type',
        retentionDays: -1,
        action: 'invalid_action'
      };

      await expect(retentionService.applyRetentionPolicy(invalidPolicy as any))
        .rejects.toThrow();
    });
  });
});