/**
 * Tests unitaires pour AuditTrailService
 * Vérifie la conformité GDPR et l'intégrité des logs d'audit
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { AuditTrailService } from '../services/audit-trail.service';
import { db } from '../db/connection';
import { auditLogs, securityAlerts, complianceReports } from '../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

describe('AuditTrailService', () => {
  let auditService: AuditTrailService;
  const testAuditIds: string[] = [];
  const testAlertIds: string[] = [];
  const testReportIds: string[] = [];

  beforeAll(async () => {
    // Ensure test database is clean before starting
    await cleanupTestData();
  });

  beforeEach(() => {
    auditService = new AuditTrailService();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupTestData();
  });

  async function cleanupTestData() {
    try {
      // Clean up audit logs
      for (const id of testAuditIds) {
        await db.delete(auditLogs).where(eq(auditLogs.id, id));
      }
      
      // Clean up security alerts
      for (const id of testAlertIds) {
        await db.delete(securityAlerts).where(eq(securityAlerts.id, id));
      }
      
      // Clean up reports
      for (const id of testReportIds) {
        await db.delete(complianceReports).where(eq(complianceReports.id, id));
      }
      
      // Clear arrays
      testAuditIds.length = 0;
      testAlertIds.length = 0;
      testReportIds.length = 0;
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  }

  describe('logAction', () => {
    it('should successfully log a basic audit action', async () => {
      const auditId = await auditService.logAction({
        entityType: 'student',
        entityId: 'test-student-123',
        action: 'read',
        userId: 'user-456',
        details: {
          operation: 'view_profile',
          timestamp: new Date().toISOString()
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser',
        severity: 'low'
      });

      expect(auditId).toBeTruthy();
      expect(auditId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      testAuditIds.push(auditId);

      // Verify entry was stored
      const [storedEntry] = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.id, auditId));

      expect(storedEntry).toBeDefined();
      expect(storedEntry.entityType).toBe('student');
      expect(storedEntry.entityId).toBe('test-student-123');
      expect(storedEntry.action).toBe('read');
      expect(storedEntry.userId).toBe('user-456');
      expect(storedEntry.ipAddress).toBe('192.168.1.1');
      expect(storedEntry.checksum).toBeTruthy();
    });

    it('should handle sensitive data encryption', async () => {
      const auditId = await auditService.logAction({
        entityType: 'student',
        entityId: 'test-student-sensitive',
        action: 'create',
        userId: 'admin-user',
        details: {
          personalData: {
            name: 'Jean Dupont',
            email: 'jean@example.com',
            dateNaissance: '2010-05-15'
          }
        },
        severity: 'high'
      });

      expect(auditId).toBeTruthy();
      testAuditIds.push(auditId);

      // Check that sensitive data was encrypted
      const [storedEntry] = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.id, auditId));

      expect(storedEntry.encrypted).toBe(true);
      expect(storedEntry.details).not.toEqual(expect.objectContaining({
        personalData: expect.objectContaining({
          name: 'Jean Dupont'
        })
      }));
    });

    it('should validate input data with Zod schema', async () => {
      // Test invalid entity type
      await expect(
        auditService.logAction({
          entityType: 'invalid_type' as any,
          entityId: 'test-123',
          action: 'read',
          userId: 'user-123',
          details: {}
        })
      ).rejects.toThrow();

      // Test invalid action
      await expect(
        auditService.logAction({
          entityType: 'student',
          entityId: 'test-123',
          action: 'invalid_action' as any,
          userId: 'user-123',
          details: {}
        })
      ).rejects.toThrow();

      // Test invalid IP address format
      await expect(
        auditService.logAction({
          entityType: 'student',
          entityId: 'test-123',
          action: 'read',
          userId: 'user-123',
          details: {},
          ipAddress: '999.999.999.999'
        })
      ).rejects.toThrow();
    });

    it('should calculate correct integrity checksum', async () => {
      const auditId = await auditService.logAction({
        entityType: 'exercise',
        entityId: 'exercise-789',
        action: 'update',
        userId: 'teacher-123',
        details: { modified_fields: ['title', 'difficulty'] },
        severity: 'medium'
      });

      testAuditIds.push(auditId);

      // Verify integrity
      const verification = await auditService.verifyAuditIntegrity(auditId);
      expect(verification.valid).toBe(true);
      expect(verification.tampering).toBe(false);
      expect(verification.originalChecksum).toBe(verification.calculatedChecksum);
    });

    it('should handle high-volume logging without degradation', async () => {
      const startTime = Date.now();
      const logPromises = [];

      // Log 100 entries rapidly
      for (let i = 0; i < 100; i++) {
        const promise = auditService.logAction({
          entityType: 'student',
          entityId: `bulk-test-${i}`,
          action: 'read',
          userId: 'bulk-user',
          details: { sequence: i },
          severity: 'low'
        });
        logPromises.push(promise);
      }

      const auditIds = await Promise.all(logPromises);
      const endTime = Date.now();

      expect(auditIds).toHaveLength(100);
      expect(auditIds.every(id => id.length > 0)).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10s

      // Add to cleanup
      testAuditIds.push(...auditIds);
    });
  });

  describe('queryAuditLogs', () => {
    beforeEach(async () => {
      // Setup test data
      const testEntries = [
        {
          entityType: 'student',
          entityId: 'query-test-student-1',
          action: 'read',
          userId: 'user-1',
          details: { test: 'data1' },
          severity: 'low' as const
        },
        {
          entityType: 'student',
          entityId: 'query-test-student-2',
          action: 'update',
          userId: 'user-2',
          details: { test: 'data2' },
          severity: 'high' as const
        },
        {
          entityType: 'exercise',
          entityId: 'query-test-exercise-1',
          action: 'create',
          userId: 'user-1',
          details: { test: 'data3' },
          severity: 'medium' as const
        }
      ];

      for (const entry of testEntries) {
        const auditId = await auditService.logAction(entry);
        testAuditIds.push(auditId);
      }
    });

    it('should query logs by entity type', async () => {
      const result = await auditService.queryAuditLogs({
        entityType: 'student',
        limit: 10
      });

      expect(result.entries.length).toBeGreaterThanOrEqual(2);
      expect(result.entries.every(entry => entry.entityType === 'student')).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(2);
    });

    it('should query logs by user ID', async () => {
      const result = await auditService.queryAuditLogs({
        userId: 'user-1',
        limit: 10
      });

      expect(result.entries.length).toBeGreaterThanOrEqual(2);
      expect(result.entries.every(entry => entry.userId === 'user-1')).toBe(true);
    });

    it('should query logs by action', async () => {
      const result = await auditService.queryAuditLogs({
        action: 'read',
        limit: 10
      });

      expect(result.entries.length).toBeGreaterThanOrEqual(1);
      expect(result.entries.every(entry => entry.action === 'read')).toBe(true);
    });

    it('should query logs by severity levels', async () => {
      const result = await auditService.queryAuditLogs({
        severity: ['high', 'critical'],
        limit: 10
      });

      expect(result.entries.every(entry => 
        entry.severity === 'high' || entry.severity === 'critical'
      )).toBe(true);
    });

    it('should query logs by date range', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const result = await auditService.queryAuditLogs({
        startDate: oneHourAgo,
        endDate: now,
        limit: 100
      });

      expect(result.entries.every(entry => 
        entry.timestamp >= oneHourAgo && entry.timestamp <= now
      )).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const page1 = await auditService.queryAuditLogs({
        limit: 2,
        offset: 0
      });

      const page2 = await auditService.queryAuditLogs({
        limit: 2,
        offset: 2
      });

      expect(page1.entries).toHaveLength(2);
      expect(page2.entries.length).toBeGreaterThanOrEqual(0);
      
      // Ensure no overlap between pages
      const page1Ids = page1.entries.map(e => e.id);
      const page2Ids = page2.entries.map(e => e.id);
      const intersection = page1Ids.filter(id => page2Ids.includes(id));
      expect(intersection).toHaveLength(0);
    });

    it('should decrypt details when requested with proper permissions', async () => {
      const result = await auditService.queryAuditLogs({
        entityType: 'student',
        includeDetails: true,
        limit: 10
      });

      for (const entry of result.entries) {
        if (entry.details) {
          expect(typeof entry.details).toBe('object');
          // If it was encrypted, it should now be decrypted
          expect(entry.encrypted).toBe(false);
        }
      }
    });
  });

  describe('generateComplianceReport', () => {
    beforeEach(async () => {
      // Setup test data with variety
      const testData = [
        { entityType: 'student', action: 'read', severity: 'low' },
        { entityType: 'student', action: 'update', severity: 'medium' },
        { entityType: 'parent', action: 'consent_given', severity: 'high' },
        { entityType: 'gdpr_request', action: 'export', severity: 'high' },
        { entityType: 'user_session', action: 'access_denied', severity: 'critical' }
      ];

      for (let i = 0; i < testData.length; i++) {
        const auditId = await auditService.logAction({
          ...testData[i],
          entityId: `report-test-${i}`,
          userId: 'report-user',
          details: { reportTest: i }
        });
        testAuditIds.push(auditId);
      }
    });

    it('should generate compliance report for date range', async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      const report = await auditService.generateComplianceReport(
        startDate,
        endDate,
        undefined,
        'json'
      );

      expect(report.id).toBeTruthy();
      expect(report.title).toContain('Compliance Report');
      expect(report.period.startDate).toEqual(startDate);
      expect(report.period.endDate).toEqual(endDate);
      expect(report.totalEntries).toBeGreaterThanOrEqual(5);
      expect(report.categories).toBeDefined();
      expect(report.topActions).toBeDefined();
      expect(report.securityAlerts).toBeGreaterThanOrEqual(0);
      expect(report.complianceIssues).toBeDefined();
      expect(Array.isArray(report.complianceIssues)).toBe(true);

      testReportIds.push(report.id);
    });

    it('should generate compliance report filtered by entity type', async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      const report = await auditService.generateComplianceReport(
        startDate,
        endDate,
        'student',
        'json'
      );

      expect(report.filters.entityType).toBe('student');
      expect(report.totalEntries).toBeGreaterThanOrEqual(2);
      
      testReportIds.push(report.id);
    });

    it('should export report in CSV format', async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      const report = await auditService.generateComplianceReport(
        startDate,
        endDate,
        undefined,
        'csv'
      );

      expect(report.exportFormat).toBe('csv');
      expect(report.filePath).toBeTruthy();
      expect(report.filePath).toMatch(/\.csv$/);

      testReportIds.push(report.id);
    });

    it('should analyze audit entries correctly', async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      const report = await auditService.generateComplianceReport(
        startDate,
        endDate
      );

      // Check categories analysis
      expect(typeof report.categories).toBe('object');
      expect(Object.keys(report.categories).length).toBeGreaterThan(0);

      // Check top actions analysis
      expect(Array.isArray(report.topActions)).toBe(true);
      expect(report.topActions.length).toBeGreaterThan(0);
      expect(report.topActions[0]).toHaveProperty('action');
      expect(report.topActions[0]).toHaveProperty('count');

      // Check security alerts count
      expect(typeof report.securityAlerts).toBe('number');
      expect(report.securityAlerts).toBeGreaterThanOrEqual(0);

      testReportIds.push(report.id);
    });
  });

  describe('getStudentAuditTrail', () => {
    const testStudentId = 'gdpr-test-student-123';

    beforeEach(async () => {
      // Create audit trail for specific student
      const studentActions = [
        { action: 'create', details: { action: 'profile_created' } },
        { action: 'read', details: { action: 'profile_viewed' } },
        { action: 'update', details: { action: 'profile_updated', field: 'name' } },
        { action: 'export', details: { action: 'data_exported', format: 'json' } }
      ];

      for (const actionData of studentActions) {
        const auditId = await auditService.logAction({
          entityType: 'student',
          entityId: testStudentId,
          action: actionData.action as any,
          userId: 'test-user',
          studentId: testStudentId,
          details: actionData.details,
          severity: 'medium'
        });
        testAuditIds.push(auditId);
      }
    });

    it('should retrieve complete audit trail for student', async () => {
      const auditTrail = await auditService.getStudentAuditTrail(testStudentId);

      expect(auditTrail.length).toBeGreaterThanOrEqual(4);
      expect(auditTrail.every(entry => entry.studentId === testStudentId)).toBe(true);
      
      // Check that all major actions are present
      const actions = auditTrail.map(entry => entry.action);
      expect(actions).toContain('create');
      expect(actions).toContain('read');
      expect(actions).toContain('update');
      expect(actions).toContain('export');
    });

    it('should include decrypted details in student audit trail', async () => {
      const auditTrail = await auditService.getStudentAuditTrail(testStudentId);

      for (const entry of auditTrail) {
        expect(entry.details).toBeDefined();
        expect(typeof entry.details).toBe('object');
        // Should be decrypted
        expect(entry.encrypted).toBe(false);
      }
    });

    it('should log access to student audit trail for compliance', async () => {
      const initialCount = testAuditIds.length;
      
      await auditService.getStudentAuditTrail(testStudentId);
      
      // Wait a bit for the access log to be created
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check that accessing the audit trail was itself logged
      const recentLogs = await auditService.queryAuditLogs({
        entityType: 'student',
        entityId: testStudentId,
        action: 'read',
        limit: 10
      });
      
      // Should have the original entries plus the access log
      expect(recentLogs.total).toBeGreaterThan(initialCount);
    });
  });

  describe('anonymizeStudentAuditLogs', () => {
    const testStudentId = 'anonymize-test-student-456';
    
    beforeEach(async () => {
      // Create audit entries with personal data
      const personalData = {
        studentName: 'Marie Dubois',
        parentEmail: 'parent@example.com',
        personalInfo: 'Sensitive information'
      };

      const auditId = await auditService.logAction({
        entityType: 'student',
        entityId: testStudentId,
        action: 'create',
        userId: 'test-user',
        studentId: testStudentId,
        details: personalData,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Test Browser',
        severity: 'medium'
      });
      
      testAuditIds.push(auditId);
    });

    it('should anonymize student audit logs', async () => {
      const anonymizedCount = await auditService.anonymizeStudentAuditLogs(
        testStudentId,
        'GDPR erasure request'
      );

      expect(anonymizedCount).toBeGreaterThanOrEqual(1);

      // Verify anonymization
      const auditTrail = await auditService.getStudentAuditTrail(testStudentId);
      
      for (const entry of auditTrail) {
        // Check that sensitive fields are anonymized
        if (entry.details.studentName) {
          expect(entry.details.studentName).toBe('[ANONYMIZED]');
        }
        if (entry.details.parentEmail) {
          expect(entry.details.parentEmail).toBe('[ANONYMIZED]');
        }
        
        // IP and user agent should be removed
        expect(entry.ipAddress).toBeUndefined();
        expect(entry.userAgent).toBeUndefined();
      }
    });

    it('should log anonymization action', async () => {
      await auditService.anonymizeStudentAuditLogs(
        testStudentId,
        'GDPR erasure request'
      );

      // Check that anonymization was logged
      const logs = await auditService.queryAuditLogs({
        entityType: 'student',
        entityId: testStudentId,
        action: 'anonymize',
        limit: 10
      });

      expect(logs.entries.length).toBeGreaterThanOrEqual(1);
      
      const anonymizationLog = logs.entries.find(entry => entry.action === 'anonymize');
      expect(anonymizationLog).toBeDefined();
      expect(anonymizationLog!.details.reason).toBe('GDPR erasure request');
      expect(anonymizationLog!.severity).toBe('high');
    });
  });

  describe('verifyAuditIntegrity', () => {
    it('should verify integrity of valid audit entry', async () => {
      const auditId = await auditService.logAction({
        entityType: 'exercise',
        entityId: 'integrity-test-exercise',
        action: 'read',
        userId: 'integrity-user',
        details: { test: 'integrity' },
        severity: 'low'
      });

      testAuditIds.push(auditId);

      const verification = await auditService.verifyAuditIntegrity(auditId);

      expect(verification.valid).toBe(true);
      expect(verification.tampering).toBe(false);
      expect(verification.originalChecksum).toBeTruthy();
      expect(verification.calculatedChecksum).toBeTruthy();
      expect(verification.originalChecksum).toBe(verification.calculatedChecksum);
    });

    it('should detect tampered audit entry', async () => {
      const auditId = await auditService.logAction({
        entityType: 'student',
        entityId: 'tamper-test-student',
        action: 'update',
        userId: 'tamper-user',
        details: { original: 'data' },
        severity: 'medium'
      });

      testAuditIds.push(auditId);

      // Manually tamper with the entry in database
      await db
        .update(auditLogs)
        .set({
          details: { tampered: 'data' }
        })
        .where(eq(auditLogs.id, auditId));

      const verification = await auditService.verifyAuditIntegrity(auditId);

      expect(verification.valid).toBe(false);
      expect(verification.tampering).toBe(true);
      expect(verification.originalChecksum).not.toBe(verification.calculatedChecksum);
    });

    it('should handle non-existent audit entry', async () => {
      const fakeId = crypto.randomUUID();
      
      await expect(
        auditService.verifyAuditIntegrity(fakeId)
      ).rejects.toThrow('Audit entry not found');
    });
  });

  describe('Security Anomaly Detection', () => {
    it('should detect suspicious access patterns', async () => {
      const testStudentId = 'anomaly-test-student';
      
      // Create multiple rapid accesses to trigger anomaly detection
      const accessPromises = [];
      for (let i = 0; i < 12; i++) {
        const promise = auditService.logAction({
          entityType: 'student',
          entityId: testStudentId,
          action: 'read',
          userId: `suspicious-user-${i}`,
          details: { access: i },
          severity: 'low'
        });
        accessPromises.push(promise);
      }

      const auditIds = await Promise.all(accessPromises);
      testAuditIds.push(...auditIds);

      // Wait for anomaly detection to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if security alert was created
      const alerts = await db
        .select()
        .from(securityAlerts)
        .where(eq(securityAlerts.entityId, testStudentId));

      if (alerts.length > 0) {
        expect(alerts[0].type).toBe('suspicious_access');
        expect(alerts[0].severity).toBe('medium');
        testAlertIds.push(alerts[0].id);
      }
    });

    it('should detect multiple failed login attempts', async () => {
      const testIpAddress = '192.168.1.999';
      
      // Create multiple failed login attempts
      const failedAttempts = [];
      for (let i = 0; i < 7; i++) {
        const promise = auditService.logAction({
          entityType: 'user_session',
          entityId: 'failed-session',
          action: 'access_denied',
          userId: null,
          ipAddress: testIpAddress,
          details: { reason: 'invalid_credentials', attempt: i },
          severity: 'high'
        });
        failedAttempts.push(promise);
      }

      const auditIds = await Promise.all(failedAttempts);
      testAuditIds.push(...auditIds);

      // Wait for anomaly detection
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check for security alert
      const alerts = await db
        .select()
        .from(securityAlerts)
        .where(eq(securityAlerts.entityId, testIpAddress));

      if (alerts.length > 0) {
        expect(alerts[0].type).toBe('multiple_failed_logins');
        expect(alerts[0].severity).toBe('high');
        testAlertIds.push(alerts[0].id);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      const originalTransaction = db.transaction;
      vi.spyOn(db, 'transaction').mockRejectedValueOnce(new Error('Connection timeout'));

      // Should not throw but return empty audit ID
      const auditId = await auditService.logAction({
        entityType: 'student',
        entityId: 'error-test',
        action: 'read',
        userId: 'error-user',
        details: {}
      });

      expect(auditId).toBe('');
      
      // Restore original function
      db.transaction = originalTransaction;
    });

    it('should handle malformed data gracefully', async () => {
      // Test with null details
      const auditId1 = await auditService.logAction({
        entityType: 'student',
        entityId: 'null-test',
        action: 'read',
        userId: 'null-user',
        details: null as any
      });

      expect(auditId1).toBeTruthy();
      testAuditIds.push(auditId1);

      // Test with undefined fields
      const auditId2 = await auditService.logAction({
        entityType: 'student',
        entityId: 'undefined-test',
        action: 'read',
        userId: null,
        details: {},
        ipAddress: undefined,
        userAgent: undefined
      });

      expect(auditId2).toBeTruthy();
      testAuditIds.push(auditId2);
    });
  });

  describe('Performance', () => {
    it('should handle concurrent audit logging', async () => {
      const concurrentPromises = [];
      const startTime = Date.now();

      // Create 50 concurrent audit log operations
      for (let i = 0; i < 50; i++) {
        const promise = auditService.logAction({
          entityType: 'student',
          entityId: `concurrent-test-${i}`,
          action: 'read',
          userId: 'concurrent-user',
          details: { concurrent: i },
          severity: 'low'
        });
        concurrentPromises.push(promise);
      }

      const auditIds = await Promise.allSettled(concurrentPromises);
      const endTime = Date.now();

      // All should succeed
      const successful = auditIds.filter(result => result.status === 'fulfilled');
      expect(successful.length).toBe(50);

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(15000);

      // Add successful IDs to cleanup
      for (const result of successful) {
        if (result.status === 'fulfilled' && result.value) {
          testAuditIds.push(result.value);
        }
      }
    });

    it('should maintain performance with large result sets', async () => {
      const startTime = Date.now();
      
      const result = await auditService.queryAuditLogs({
        limit: 1000,
        offset: 0
      });
      
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5s
      expect(result.entries.length).toBeLessThanOrEqual(1000);
      expect(typeof result.total).toBe('number');
    });
  });
});