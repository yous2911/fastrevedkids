import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { db } from '../db/connection';
import { 
  students, 
  parentalConsent, 
  gdprRequests, 
  auditLogs, 
  encryptionKeys, 
  retentionPolicies, 
  consentPreferences 
} from '../db/schema';
import { eq, and, or, desc, asc, count, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

describe('GDPR Database Operations', () => {
  beforeAll(async () => {
    console.log('✅ Using existing MySQL database connection');
  });

  beforeEach(async () => {
    // Clean all tables before each test
    await cleanTables();
  });

  async function cleanTables() {
    // Clean tables in reverse dependency order
    await db.execute(sql`DELETE FROM ${sql.identifier('consent_preferences')}`);
    await db.execute(sql`DELETE FROM ${sql.identifier('retention_policies')}`);
    await db.execute(sql`DELETE FROM ${sql.identifier('encryption_keys')}`);
    await db.execute(sql`DELETE FROM ${sql.identifier('audit_logs')}`);
    await db.execute(sql`DELETE FROM ${sql.identifier('gdpr_requests')}`);
    await db.execute(sql`DELETE FROM ${sql.identifier('parental_consent')}`);
    await db.execute(sql`DELETE FROM ${sql.identifier('students')}`);
  }

  describe('Students Table Operations', () => {
    it('should insert and retrieve student records', async () => {
      const now = new Date();
      const studentData = {
        prenom: 'Alice',
        nom: 'Johnson',
        email: 'alice@example.com',
        dateNaissance: new Date('2015-03-10'),
        niveauActuel: 'CP',
        niveauScolaire: 'CP',
        createdAt: now,
        updatedAt: now
      };

      await db.insert(students).values(studentData);
      
      const [insertedStudent] = await db.select().from(students).where(eq(students.prenom, 'Alice'));
      expect(insertedStudent.prenom).toBe('Alice');
      expect(insertedStudent.nom).toBe('Johnson');
      expect(insertedStudent.niveauActuel).toBe('CP');
    });

    it('should update student records', async () => {
      const now = new Date();
      await db.insert(students).values({
        prenom: 'Bob',
        nom: 'Martin',
        email: 'bob@example.com',
        dateNaissance: new Date('2014-06-15'),
        niveauActuel: 'CE1',
        niveauScolaire: 'CE1',
        createdAt: now,
        updatedAt: now
      });
      
      const [student] = await db.select().from(students).where(eq(students.prenom, 'Bob'));

      await db.update(students)
        .set({ 
          totalPoints: 200, 
          serieJours: 10,
          updatedAt: new Date()
        })
        .where(eq(students.id, student.id));

      const [updatedStudent] = await db.select().from(students).where(eq(students.id, student.id));
      expect(updatedStudent.totalPoints).toBe(200);
      expect(updatedStudent.serieJours).toBe(10);
    });

    it('should delete student records', async () => {
      const now = new Date();
      await db.insert(students).values({
        prenom: 'Charlie',
        nom: 'Brown',
        email: 'charlie@example.com',
        dateNaissance: new Date('2016-03-20'),
        niveauActuel: 'CP',
        niveauScolaire: 'CP',
        createdAt: now,
        updatedAt: now
      });
      
      const [student] = await db.select().from(students).where(eq(students.prenom, 'Charlie'));

      await db.delete(students).where(eq(students.id, student.id));

      const deletedStudent = await db.select().from(students).where(eq(students.id, student.id));
      expect(deletedStudent).toHaveLength(0);
    });
  });

  describe('Parental Consent Operations', () => {
    it('should create parental consent record', async () => {
      const now = new Date();
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const consentData = {
        id: uuidv4(),
        parentEmail: 'parent@example.com',
        parentName: 'John Parent',
        childName: 'Alice Child',
        childAge: 8,
        consentTypes: JSON.stringify(['data_processing', 'educational_tracking']),
        status: 'pending',
        firstConsentToken: uuidv4(),
        expiryDate,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: now,
        updatedAt: now
      };

      await db.insert(parentalConsent).values(consentData);
      const [inserted] = await db.select().from(parentalConsent).where(eq(parentalConsent.id, consentData.id));
      expect(inserted.id).toBe(consentData.id);
      expect(inserted.parentEmail).toBe('parent@example.com');
      expect(inserted.status).toBe('pending');
    });

    it('should update consent status through verification flow', async () => {
      const now = new Date();
      const consentId = uuidv4();
      await db.insert(parentalConsent).values({
        id: consentId,
        parentEmail: 'parent@example.com',
        parentName: 'John Parent',
        childName: 'Alice Child',
        childAge: 8,
        consentTypes: JSON.stringify(['data_processing']),
        status: 'pending',
        firstConsentToken: uuidv4(),
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: now,
        updatedAt: now
      });

      const [consent] = await db.select().from(parentalConsent).where(eq(parentalConsent.id, consentId));

      // First consent verification
      const firstConsentDate = new Date();
      await db.update(parentalConsent)
        .set({
          firstConsentDate,
          secondConsentToken: uuidv4(),
          status: 'first_verified',
          updatedAt: new Date()
        })
        .where(eq(parentalConsent.id, consent.id));

      // Second consent verification
      const secondConsentDate = new Date();
      await db.update(parentalConsent)
        .set({
          secondConsentDate,
          verificationDate: secondConsentDate,
          status: 'verified',
          updatedAt: new Date()
        })
        .where(eq(parentalConsent.id, consent.id));

      const [verifiedConsent] = await db.select().from(parentalConsent).where(eq(parentalConsent.id, consent.id));
      expect(verifiedConsent.status).toBe('verified');
      expect(verifiedConsent.firstConsentDate).toBeTruthy();
      expect(verifiedConsent.secondConsentDate).toBeTruthy();
    });

    it('should find consent records by email', async () => {
      const now = new Date();
      const email = 'multi@example.com';
      
      // Create multiple consent records for same email
      const consents = [
        {
          id: uuidv4(),
          parentEmail: email,
          parentName: 'Parent One',
          childName: 'Child One',
          childAge: 7,
          consentTypes: JSON.stringify(['data_processing']),
          status: 'verified',
          firstConsentToken: uuidv4(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          parentEmail: email,
          parentName: 'Parent Two',
          childName: 'Child Two',
          childAge: 9,
          consentTypes: JSON.stringify(['marketing']),
          status: 'pending',
          firstConsentToken: uuidv4(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ipAddress: '192.168.1.2',
          userAgent: 'Chrome/90.0',
          createdAt: now,
          updatedAt: now
        }
      ];

      await db.insert(parentalConsent).values(consents);

      const foundConsents = await db.select()
        .from(parentalConsent)
        .where(eq(parentalConsent.parentEmail, email));

      expect(foundConsents).toHaveLength(2);
      expect(foundConsents[0].parentEmail).toBe(email);
      expect(foundConsents[1].parentEmail).toBe(email);
    });

    it('should handle consent expiry', async () => {
      const now = new Date();
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      
      await db.insert(parentalConsent).values({
        id: uuidv4(),
        parentEmail: 'expired@example.com',
        parentName: 'Expired Parent',
        childName: 'Expired Child',
        childAge: 10,
        consentTypes: JSON.stringify(['data_processing']),
        status: 'verified',
        firstConsentToken: uuidv4(),
        expiryDate: expiredDate,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: now,
        updatedAt: now
      });

      const expiredConsents = await db.select()
        .from(parentalConsent)
        .where(sql`${parentalConsent.expiryDate} < ${new Date()}`);

      expect(expiredConsents.length).toBeGreaterThan(0);
      expect(expiredConsents[0].parentEmail).toBe('expired@example.com');
    });
  });

  describe('GDPR Requests Operations', () => {
    it('should create GDPR access request', async () => {
      const now = new Date();
      
      // First create a student
      await db.insert(students).values({
        prenom: 'Test',
        nom: 'Student',
        email: 'test@example.com',
        dateNaissance: new Date('2015-01-01'),
        niveauActuel: 'CP',
        niveauScolaire: 'CP',
        createdAt: now,
        updatedAt: now
      });
      
      const [student] = await db.select().from(students).where(eq(students.prenom, 'Test'));

      const requestData = {
        id: uuidv4(),
        requestType: 'access',
        requesterType: 'parent',
        requesterEmail: 'parent@example.com',
        requesterName: 'Parent Name',
        studentId: student.id,
        requestDetails: JSON.stringify({ reason: 'Access request' }),
        urgentRequest: false,
        status: 'submitted',
        priority: 'normal',
        submittedAt: now,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        verificationToken: uuidv4(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        verificationMethod: 'email',
        legalBasis: 'GDPR Article 15'
      };

      await db.insert(gdprRequests).values(requestData);
      const [inserted] = await db.select().from(gdprRequests).where(eq(gdprRequests.id, requestData.id));
      expect(inserted.requestType).toBe('access');
      expect(inserted.status).toBe('submitted');
      expect(inserted.studentId).toBe(student.id);
    });

    it('should update request status workflow', async () => {
      const now = new Date();
      const requestId = uuidv4();
      await db.insert(gdprRequests).values({
        id: requestId,
        requestType: 'erasure',
        requesterType: 'student',
        requesterEmail: 'student@example.com',
        requesterName: 'Student Name',
        requestDetails: JSON.stringify({ reason: 'Right to be forgotten' }),
        urgentRequest: false,
        status: 'submitted',
        priority: 'normal',
        submittedAt: now,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        verificationToken: uuidv4(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        verificationMethod: 'email',
        legalBasis: 'GDPR Article 17'
      });

      const [request] = await db.select().from(gdprRequests).where(eq(gdprRequests.id, requestId));

      // Update to verified
      await db.update(gdprRequests)
        .set({ 
          status: 'verified',
          verifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(gdprRequests.id, request.id));

      // Update to processing
      await db.update(gdprRequests)
        .set({ 
          status: 'processing',
          assignedTo: 'gdpr-team',
          updatedAt: new Date()
        })
        .where(eq(gdprRequests.id, request.id));

      // Update to completed
      await db.update(gdprRequests)
        .set({ 
          status: 'completed',
          processedAt: new Date(),
          completedAt: new Date(),
          responseDetails: JSON.stringify({ actions: ['data_deleted'] }),
          updatedAt: new Date()
        })
        .where(eq(gdprRequests.id, request.id));

      const [completedRequest] = await db.select()
        .from(gdprRequests)
        .where(eq(gdprRequests.id, request.id));

      expect(completedRequest.status).toBe('completed');
      expect(completedRequest.processedAt).toBeTruthy();
      expect(completedRequest.completedAt).toBeTruthy();
    });

    it('should handle urgent requests with higher priority', async () => {
      const now = new Date();
      const urgentDueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
      const urgentRequestId = uuidv4();
      
      await db.insert(gdprRequests).values({
        id: urgentRequestId,
        requestType: 'portability',
        requesterType: 'parent',
        requesterEmail: 'urgent@example.com',
        requesterName: 'Urgent Parent',
        requestDetails: JSON.stringify({ reason: 'School transfer deadline' }),
        urgentRequest: true,
        status: 'submitted',
        priority: 'high',
        submittedAt: now,
        dueDate: urgentDueDate,
        verificationToken: uuidv4(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        verificationMethod: 'email',
        legalBasis: 'GDPR Article 20'
      });

      const [urgentRequest] = await db.select().from(gdprRequests).where(eq(gdprRequests.id, urgentRequestId));

      const urgentRequests = await db.select()
        .from(gdprRequests)
        .where(and(
          eq(gdprRequests.urgentRequest, true),
          eq(gdprRequests.priority, 'high')
        ));

      expect(urgentRequests.length).toBeGreaterThan(0);
      expect(urgentRequest.urgentRequest).toBe(true);
      expect(urgentRequest.priority).toBe('high');
      expect(urgentRequest.dueDate.getTime()).toBeLessThan(Date.now() + 7 * 24 * 60 * 60 * 1000); // Less than 7 days
    });

    it('should query requests by various criteria', async () => {
      const now = new Date();
      
      // Create multiple requests
      const requests = [
        {
          id: uuidv4(),
          requestType: 'access',
          requesterType: 'parent',
          requesterEmail: 'parent1@example.com',
          requesterName: 'Parent 1',
          requestDetails: JSON.stringify({ reason: 'Access request' }),
          urgentRequest: false,
          status: 'submitted',
          priority: 'normal',
          submittedAt: now,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          verificationToken: uuidv4(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          verificationMethod: 'email',
          legalBasis: 'GDPR Article 15'
        },
        {
          id: uuidv4(),
          requestType: 'erasure',
          requesterType: 'student',
          requesterEmail: 'student1@example.com',
          requesterName: 'Student 1',
          requestDetails: JSON.stringify({ reason: 'Erasure request' }),
          urgentRequest: true,
          status: 'processing',
          priority: 'high',
          submittedAt: now,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          verificationToken: uuidv4(),
          ipAddress: '192.168.1.2',
          userAgent: 'Chrome/90.0',
          verificationMethod: 'email',
          legalBasis: 'GDPR Article 17'
        }
      ];

      await db.insert(gdprRequests).values(requests);

      // Query by status
      const submittedRequests = await db.select()
        .from(gdprRequests)
        .where(eq(gdprRequests.status, 'submitted'));
      expect(submittedRequests.length).toBeGreaterThan(0);

      // Query by request type
      const accessRequests = await db.select()
        .from(gdprRequests)
        .where(eq(gdprRequests.requestType, 'access'));
      expect(accessRequests.length).toBeGreaterThan(0);

      // Query by requester type
      const parentRequests = await db.select()
        .from(gdprRequests)
        .where(eq(gdprRequests.requesterType, 'parent'));
      expect(parentRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Audit Logs Operations', () => {
    it('should create audit log entries', async () => {
      const now = new Date();
      const logId = uuidv4();
      
      const logData = {
        id: logId,
        entityType: 'student',
        entityId: '123',
        action: 'data_access',
        userId: 'user123',
        details: JSON.stringify({ accessedFields: ['name', 'email'] }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: now,
        severity: 'info',
        category: 'data_access',
        sessionId: 'session123',
        correlationId: 'corr123',
        checksum: 'abc123',
        encrypted: false
      };

      await db.insert(auditLogs).values(logData);
      const [inserted] = await db.select().from(auditLogs).where(eq(auditLogs.id, logId));
      expect(inserted.entityType).toBe('student');
      expect(inserted.action).toBe('data_access');
      expect(inserted.severity).toBe('info');
    });

    it('should query audit logs by entity', async () => {
      const now = new Date();
      
      // Create multiple audit logs
      const logs = [
        {
          id: uuidv4(),
          entityType: 'student',
          entityId: '123',
          action: 'data_access',
          userId: 'user123',
          details: JSON.stringify({ action: 'view_profile' }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: now,
          severity: 'info',
          category: 'data_access',
          sessionId: 'session123',
          correlationId: 'corr123',
          checksum: 'abc123',
          encrypted: false
        },
        {
          id: uuidv4(),
          entityType: 'student',
          entityId: '123',
          action: 'data_update',
          userId: 'user123',
          details: JSON.stringify({ action: 'update_profile' }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: now,
          severity: 'info',
          category: 'data_modification',
          sessionId: 'session123',
          correlationId: 'corr123',
          checksum: 'def456',
          encrypted: false
        }
      ];

      await db.insert(auditLogs).values(logs);

      const studentLogs = await db.select()
        .from(auditLogs)
        .where(eq(auditLogs.entityType, 'student'));

      expect(studentLogs.length).toBeGreaterThan(1);
      expect(studentLogs[0].entityType).toBe('student');
      expect(studentLogs[1].entityType).toBe('student');
    });

    it('should query audit logs by severity and time range', async () => {
      const baseTime = new Date();
      
      // Create logs with different severities
      const logs = [
        {
          id: uuidv4(),
          entityType: 'system',
          entityId: 'auth',
          action: 'login_failed',
          userId: 'user123',
          details: JSON.stringify({ reason: 'invalid_password' }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(baseTime.getTime() - 1000),
          severity: 'warning',
          category: 'authentication',
          sessionId: 'session123',
          correlationId: 'corr123',
          checksum: 'abc123',
          encrypted: false
        },
        {
          id: uuidv4(),
          entityType: 'system',
          entityId: 'auth',
          action: 'login_success',
          userId: 'user123',
          details: JSON.stringify({ method: 'password' }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(baseTime.getTime() - 500),
          severity: 'info',
          category: 'authentication',
          sessionId: 'session123',
          correlationId: 'corr123',
          checksum: 'def456',
          encrypted: false
        }
      ];

      await db.insert(auditLogs).values(logs);

      const warningLogs = await db.select()
        .from(auditLogs)
        .where(and(
          eq(auditLogs.severity, 'warning'),
          sql`${auditLogs.timestamp} >= ${new Date(baseTime.getTime() - 2000)}`
        ));

      expect(warningLogs.length).toBeGreaterThan(0);
      expect(warningLogs[0].severity).toBe('warning');

      const recentLogs = await db.select()
        .from(auditLogs)
        .where(sql`${auditLogs.timestamp} >= ${new Date(baseTime.getTime() - 1000)}`);
      expect(recentLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Encryption Keys Operations', () => {
    it('should manage encryption key lifecycle', async () => {
      const now = new Date();
      const keyId = uuidv4();
      
      const keyData = {
        id: keyId,
        keyData: 'encrypted_key_data_here',
        usage: 'student_data',
        status: 'active',
        createdAt: now,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      };

      await db.insert(encryptionKeys).values(keyData);
      const [inserted] = await db.select().from(encryptionKeys).where(eq(encryptionKeys.id, keyId));
      expect(inserted.usage).toBe('student_data');
      expect(inserted.status).toBe('active');
    });

    it('should find expired keys for cleanup', async () => {
      const now = new Date();
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const expiredKeyId = uuidv4();
      
      await db.insert(encryptionKeys).values({
        id: expiredKeyId,
        keyData: 'expired_key_data',
        usage: 'temporary_data',
        status: 'active',
        createdAt: now,
        expiresAt: expiredDate
      });

      const [expiredKey] = await db.select().from(encryptionKeys).where(eq(encryptionKeys.id, expiredKeyId));

      const expiredKeys = await db.select()
        .from(encryptionKeys)
        .where(sql`${encryptionKeys.expiresAt} < ${new Date()}`);

      expect(expiredKeys.length).toBeGreaterThan(0);
      expect(expiredKey.expiresAt?.getTime()).toBeLessThan(Date.now());
    });
  });

  describe('Retention Policies Operations', () => {
    it('should create and manage retention policies', async () => {
      const now = new Date();
      const policyId = uuidv4();
      
      const policyData = {
        id: policyId,
        policyName: 'Student Data Retention',
        entityType: 'student',
        retentionPeriodDays: 1095, // 3 years
        triggerCondition: 'account_inactive',
        action: 'anonymize',
        priority: 'high',
        active: true,
        legalBasis: 'GDPR Article 5(1)(e)',
        exceptions: JSON.stringify({ legal_hold: true }),
        notificationDays: 30,
        createdAt: now,
        updatedAt: now
      };

      await db.insert(retentionPolicies).values(policyData);
      const [inserted] = await db.select().from(retentionPolicies).where(eq(retentionPolicies.id, policyId));
      expect(inserted.policyName).toBe('Student Data Retention');
      expect(inserted.retentionPeriodDays).toBe(1095);
      expect(inserted.active).toBe(true);
    });

    it('should update policy execution statistics', async () => {
      const now = new Date();
      const policyId = uuidv4();
      
      await db.insert(retentionPolicies).values({
        id: policyId,
        policyName: 'Test Policy',
        entityType: 'student',
        retentionPeriodDays: 365,
        triggerCondition: 'account_deleted',
        action: 'delete',
        priority: 'normal',
        active: true,
        legalBasis: 'GDPR Article 17',
        createdAt: now,
        updatedAt: now,
        recordsProcessed: 0
      });

      const [policy] = await db.select().from(retentionPolicies).where(eq(retentionPolicies.id, policyId));

      // Simulate policy execution
      await db.update(retentionPolicies)
        .set({
          lastExecuted: new Date(),
          recordsProcessed: 150,
          updatedAt: new Date()
        })
        .where(eq(retentionPolicies.id, policy.id));

      const [updatedPolicy] = await db.select()
        .from(retentionPolicies)
        .where(eq(retentionPolicies.id, policy.id));

      expect(updatedPolicy.lastExecuted).toBeTruthy();
      expect(updatedPolicy.recordsProcessed).toBe(150);
    });

    it('should query active policies by entity type', async () => {
      const now = new Date();
      
      // Create multiple policies
      const policies = [
        {
          id: uuidv4(),
          policyName: 'Student Data Policy',
          entityType: 'student',
          retentionPeriodDays: 1095,
          triggerCondition: 'account_inactive',
          action: 'anonymize',
          priority: 'high',
          active: true,
          legalBasis: 'GDPR Article 5(1)(e)',
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          policyName: 'Parent Data Policy',
          entityType: 'parent',
          retentionPeriodDays: 730,
          triggerCondition: 'account_inactive',
          action: 'delete',
          priority: 'normal',
          active: true,
          legalBasis: 'GDPR Article 17',
          createdAt: now,
          updatedAt: now
        }
      ];

      await db.insert(retentionPolicies).values(policies);

      const studentPolicies = await db.select()
        .from(retentionPolicies)
        .where(and(
          eq(retentionPolicies.entityType, 'student'),
          eq(retentionPolicies.active, true)
        ));

      expect(studentPolicies.length).toBeGreaterThan(0);
      expect(studentPolicies[0].entityType).toBe('student');
      expect(studentPolicies[0].active).toBe(true);
    });
  });

  describe('Consent Preferences Operations', () => {
    it('should create and update consent preferences', async () => {
      const now = new Date();
      
      // First create a student
      await db.insert(students).values({
        prenom: 'Test',
        nom: 'Student',
        email: 'test@example.com',
        dateNaissance: new Date('2015-01-01'),
        niveauActuel: 'CP',
        niveauScolaire: 'CP',
        createdAt: now,
        updatedAt: now
      });
      
      const [student] = await db.select().from(students).where(eq(students.prenom, 'Test'));

      const preferencesData = {
        id: uuidv4(),
        studentId: student.id,
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
        personalization: false,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: now,
        updatedAt: now
      };

      await db.insert(consentPreferences).values(preferencesData);
      const [inserted] = await db.select().from(consentPreferences).where(eq(consentPreferences.studentId, student.id));
      expect(inserted.essential).toBe(true);
      expect(inserted.functional).toBe(false);
      expect(inserted.studentId).toBe(student.id);
    });

    it('should query consent preferences history', async () => {
      const now = new Date();
      
      // Create a student first
      await db.insert(students).values({
        prenom: 'History',
        nom: 'Student',
        email: 'history@example.com',
        dateNaissance: new Date('2015-01-01'),
        niveauActuel: 'CP',
        niveauScolaire: 'CP',
        createdAt: now,
        updatedAt: now
      });
      
      const [student] = await db.select().from(students).where(eq(students.prenom, 'History'));

      // Create multiple preference records for the same student
      const preferences = [
        {
          id: uuidv4(),
          studentId: student.id,
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
          personalization: false,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          studentId: student.id,
          essential: true,
          functional: true,
          analytics: true,
          marketing: false,
          personalization: true,
          ipAddress: '192.168.1.2',
          userAgent: 'Chrome/90.0',
          createdAt: new Date(now.getTime() + 1000),
          updatedAt: new Date(now.getTime() + 1000)
        }
      ];

      await db.insert(consentPreferences).values(preferences);

      const studentPreferences = await db.select()
        .from(consentPreferences)
        .where(eq(consentPreferences.studentId, student.id))
        .orderBy(desc(consentPreferences.createdAt));

      expect(studentPreferences.length).toBeGreaterThan(1);
      expect(studentPreferences[0].studentId).toBe(student.id);
      expect(studentPreferences[1].studentId).toBe(student.id);
    });
  });

  describe('Complex Queries and Relationships', () => {
    it('should query GDPR requests with student information', async () => {
      const now = new Date();
      
      // Create a student
      await db.insert(students).values({
        prenom: 'Complex',
        nom: 'Student',
        email: 'complex@example.com',
        dateNaissance: new Date('2015-01-01'),
        niveauActuel: 'CP',
        niveauScolaire: 'CP',
        createdAt: now,
        updatedAt: now
      });
      
      const [student] = await db.select().from(students).where(eq(students.prenom, 'Complex'));

      // Create GDPR request for student
      const requestId = uuidv4();
      await db.insert(gdprRequests).values({
        id: requestId,
        requestType: 'access',
        requesterType: 'parent',
        requesterEmail: 'parent@example.com',
        requesterName: 'Parent Name',
        studentId: student.id,
        requestDetails: JSON.stringify({ reason: 'Access request' }),
        urgentRequest: false,
        status: 'submitted',
        priority: 'normal',
        submittedAt: now,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        verificationToken: uuidv4(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        verificationMethod: 'email',
        legalBasis: 'GDPR Article 15'
      });

      const [request] = await db.select().from(gdprRequests).where(eq(gdprRequests.id, requestId));

      // Query with join-like logic
      const requestsWithStudents = await db.select({
        requestId: gdprRequests.id,
        requestType: gdprRequests.requestType,
        studentName: students.prenom,
        studentEmail: students.email
      })
      .from(gdprRequests)
      .innerJoin(students, eq(gdprRequests.studentId, students.id))
      .where(eq(gdprRequests.id, request.id));

      expect(requestsWithStudents.length).toBeGreaterThan(0);
      expect(requestsWithStudents[0].requestId).toBe(request.id);
      expect(requestsWithStudents[0].studentName).toBe('Complex');
    });

    it('should aggregate statistics across GDPR tables', async () => {
      const now = new Date();
      
      // Create test data
      await db.insert(students).values({
        prenom: 'Stats',
        nom: 'Student',
        email: 'stats@example.com',
        dateNaissance: new Date('2015-01-01'),
        niveauActuel: 'CP',
        niveauScolaire: 'CP',
        createdAt: now,
        updatedAt: now
      });
      
      const [student] = await db.select().from(students).where(eq(students.prenom, 'Stats'));

      // Create various GDPR records
      await db.insert(parentalConsent).values({
        id: uuidv4(),
        parentEmail: 'stats@example.com',
        parentName: 'Stats Parent',
        childName: 'Stats Child',
        childAge: 8,
        consentTypes: JSON.stringify(['data_processing']),
        status: 'verified',
        firstConsentToken: uuidv4(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: now,
        updatedAt: now
      });

      await db.insert(gdprRequests).values({
        id: uuidv4(),
        requestType: 'access',
        requesterType: 'parent',
        requesterEmail: 'stats@example.com',
        requesterName: 'Stats Parent',
        studentId: student.id,
        requestDetails: JSON.stringify({ reason: 'Access request' }),
        urgentRequest: false,
        status: 'completed',
        priority: 'normal',
        submittedAt: now,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        verificationToken: uuidv4(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        verificationMethod: 'email',
        legalBasis: 'GDPR Article 15'
      });

      // Get statistics
      const consentCount = await db.select({ count: count() }).from(parentalConsent);
      const requestCount = await db.select({ count: count() }).from(gdprRequests);
      const studentCount = await db.select({ count: count() }).from(students);

      expect(consentCount[0].count).toBeGreaterThan(0);
      expect(requestCount[0].count).toBeGreaterThan(0);
      expect(studentCount[0].count).toBeGreaterThan(0);
    });
  });
});