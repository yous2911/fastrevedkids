import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { build } from '../../src/app';
import { createTestDatabase, cleanupTestDatabase } from '../helpers/database';

describe('GDPR Compliance API Endpoints', () => {
  let app: FastifyInstance;
  let testDb: any;
  let authToken: string;
  let studentId: string;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    app = await build();
    await app.ready();

    // Create test user and get auth token
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        prenom: 'GDPR',
        nom: 'Test',
        email: 'gdpr@example.com',
        password: 'SecurePass123!',
        dateNaissance: '2015-06-15',
        niveauScolaire: 'CP'
      }
    });

    const data = JSON.parse(registerResponse.payload).data;
    authToken = data.token;
    studentId = data.student.id;
  });

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
    await app.close();
  });

  describe('POST /gdpr/consent', () => {
    it('should record consent for data processing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/gdpr/consent',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          consentType: 'data_processing',
          consentGiven: true,
          purpose: 'educational_services',
          legalBasis: 'legitimate_interest',
          dataCategories: ['personal_info', 'learning_progress', 'performance_data'],
          retentionPeriod: 'until_graduation',
          thirdPartySharing: false,
          automatedDecisionMaking: false,
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser/1.0'
        }
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.consent).toHaveProperty('id');
      expect(data.data.consent.consentType).toBe('data_processing');
      expect(data.data.consent.consentGiven).toBe(true);
    });

    it('should record consent withdrawal', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/gdpr/consent',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          consentType: 'marketing_communications',
          consentGiven: false,
          purpose: 'marketing',
          legalBasis: 'consent',
          dataCategories: ['email_address'],
          retentionPeriod: 'until_withdrawal',
          thirdPartySharing: false,
          automatedDecisionMaking: false,
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser/1.0'
        }
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.consent.consentGiven).toBe(false);
    });

    it('should validate required consent fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/gdpr/consent',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          consentType: 'data_processing'
          // Missing required fields
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });
  });

  describe('GET /gdpr/consent/history', () => {
    it('should retrieve consent history for user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/gdpr/consent/history',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.consents).toBeInstanceOf(Array);
      expect(data.data.consents.length).toBeGreaterThan(0);
    });

    it('should filter consent history by type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/gdpr/consent/history?type=data_processing',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.consents.every((consent: any) => consent.consentType === 'data_processing')).toBe(true);
    });
  });

  describe('POST /gdpr/data-export', () => {
    it('should export user data in JSON format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/gdpr/data-export',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          format: 'json',
          dataCategories: ['personal_info', 'learning_progress', 'performance_data'],
          includeMetadata: true
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.export).toHaveProperty('personalInfo');
      expect(data.data.export).toHaveProperty('learningProgress');
      expect(data.data.export).toHaveProperty('performanceData');
      expect(data.data.export).toHaveProperty('metadata');
    });

    it('should export user data in CSV format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/gdpr/data-export',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          format: 'csv',
          dataCategories: ['personal_info'],
          includeMetadata: false
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.export).toHaveProperty('downloadUrl');
      expect(data.data.export).toHaveProperty('expiresAt');
    });

    it('should validate export format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/gdpr/data-export',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          format: 'invalid_format',
          dataCategories: ['personal_info']
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_EXPORT_FORMAT');
    });
  });

  describe('POST /gdpr/data-deletion', () => {
    it('should initiate data deletion request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/gdpr/data-deletion',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          reason: 'user_request',
          dataCategories: ['personal_info', 'learning_progress'],
          immediateDeletion: false,
          confirmationEmail: 'gdpr@example.com'
        }
      });

      expect(response.statusCode).toBe(202);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.deletionRequest).toHaveProperty('id');
      expect(data.data.deletionRequest.status).toBe('pending');
      expect(data.data.deletionRequest.scheduledDate).toBeDefined();
    });

    it('should handle immediate deletion request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/gdpr/data-deletion',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          reason: 'user_request',
          dataCategories: ['marketing_preferences'],
          immediateDeletion: true,
          confirmationEmail: 'gdpr@example.com'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.deletionRequest.status).toBe('completed');
    });

    it('should require confirmation for sensitive data deletion', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/gdpr/data-deletion',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          reason: 'user_request',
          dataCategories: ['all_data'],
          immediateDeletion: true,
          confirmationEmail: 'gdpr@example.com'
        }
      });

      expect(response.statusCode).toBe(202);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.deletionRequest.status).toBe('pending_confirmation');
      expect(data.data.deletionRequest.requiresConfirmation).toBe(true);
    });
  });

  describe('POST /gdpr/data-deletion/confirm', () => {
    it('should confirm data deletion request', async () => {
      // First create a deletion request
      const deletionResponse = await app.inject({
        method: 'POST',
        url: '/gdpr/data-deletion',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          reason: 'user_request',
          dataCategories: ['personal_info'],
          immediateDeletion: false,
          confirmationEmail: 'gdpr@example.com'
        }
      });

      const { id: deletionId } = JSON.parse(deletionResponse.payload).data.deletionRequest;

      const response = await app.inject({
        method: 'POST',
        url: `/gdpr/data-deletion/${deletionId}/confirm`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          confirmationToken: 'valid-confirmation-token',
          finalConfirmation: true
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.deletionRequest.status).toBe('confirmed');
    });
  });

  describe('GET /gdpr/data-deletion/status', () => {
    it('should retrieve deletion request status', async () => {
      // First create a deletion request
      const deletionResponse = await app.inject({
        method: 'POST',
        url: '/gdpr/data-deletion',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          reason: 'user_request',
          dataCategories: ['personal_info'],
          immediateDeletion: false,
          confirmationEmail: 'gdpr@example.com'
        }
      });

      const { id: deletionId } = JSON.parse(deletionResponse.payload).data.deletionRequest;

      const response = await app.inject({
        method: 'GET',
        url: `/gdpr/data-deletion/${deletionId}/status`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.deletionRequest).toHaveProperty('status');
      expect(data.data.deletionRequest).toHaveProperty('scheduledDate');
      expect(data.data.deletionRequest).toHaveProperty('progress');
    });
  });

  describe('POST /gdpr/data-rectification', () => {
    it('should submit data rectification request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/gdpr/data-rectification',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          dataType: 'personal_info',
          currentValue: 'old@example.com',
          requestedValue: 'new@example.com',
          reason: 'email_correction',
          supportingDocuments: ['email_proof.pdf'],
          urgency: 'normal'
        }
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.rectificationRequest).toHaveProperty('id');
      expect(data.data.rectificationRequest.status).toBe('submitted');
    });

    it('should validate rectification request data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/gdpr/data-rectification',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          dataType: 'personal_info',
          currentValue: 'old@example.com',
          requestedValue: 'invalid-email',
          reason: 'email_correction'
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_REQUESTED_VALUE');
    });
  });

  describe('GET /gdpr/data-rectification/history', () => {
    it('should retrieve rectification request history', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/gdpr/data-rectification/history',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.rectificationRequests).toBeInstanceOf(Array);
    });
  });

  describe('POST /gdpr/data-portability', () => {
    it('should request data portability', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/gdpr/data-portability',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          format: 'json',
          dataCategories: ['personal_info', 'learning_progress'],
          destination: 'another_platform',
          deliveryMethod: 'download_link',
          includeMetadata: true
        }
      });

      expect(response.statusCode).toBe(202);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.portabilityRequest).toHaveProperty('id');
      expect(data.data.portabilityRequest.status).toBe('processing');
    });
  });

  describe('GET /gdpr/privacy-policy', () => {
    it('should retrieve current privacy policy', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/gdpr/privacy-policy',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.privacyPolicy).toHaveProperty('version');
      expect(data.data.privacyPolicy).toHaveProperty('effectiveDate');
      expect(data.data.privacyPolicy).toHaveProperty('content');
    });

    it('should retrieve privacy policy by version', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/gdpr/privacy-policy?version=1.0',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.privacyPolicy.version).toBe('1.0');
    });
  });

  describe('GET /gdpr/data-processing-activities', () => {
    it('should retrieve data processing activities', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/gdpr/data-processing-activities',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.processingActivities).toBeInstanceOf(Array);
      expect(data.data.processingActivities.length).toBeGreaterThan(0);
    });

    it('should filter processing activities by purpose', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/gdpr/data-processing-activities?purpose=educational_services',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.processingActivities.every((activity: any) => activity.purpose === 'educational_services')).toBe(true);
    });
  });

  describe('POST /gdpr/objection', () => {
    it('should submit data processing objection', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/gdpr/objection',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          processingActivity: 'marketing_communications',
          reason: 'personal_preference',
          specificData: ['email_address'],
          alternativeProcessing: 'essential_only',
          supportingInformation: 'User prefers essential communications only'
        }
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.objection).toHaveProperty('id');
      expect(data.data.objection.status).toBe('submitted');
    });
  });

  describe('GET /gdpr/objection/history', () => {
    it('should retrieve objection history', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/gdpr/objection/history',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.objections).toBeInstanceOf(Array);
    });
  });

  describe('GET /gdpr/rights-summary', () => {
    it('should retrieve GDPR rights summary', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/gdpr/rights-summary',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.rights).toHaveProperty('access');
      expect(data.data.rights).toHaveProperty('rectification');
      expect(data.data.rights).toHaveProperty('erasure');
      expect(data.data.rights).toHaveProperty('portability');
      expect(data.data.rights).toHaveProperty('objection');
    });
  });
});
