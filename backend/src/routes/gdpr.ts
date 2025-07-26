import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  SubmitConsentRequest,
  SubmitGDPRRequest,
  ConsentPreferencesRequest,
  GDPRRequestType,
  RequesterType,
  VerificationMethod,
  ConsentType
} from '../types/gdpr.types';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config';

// Request type definitions
interface ConsentRequestBody extends SubmitConsentRequest {}
interface GDPRRequestBody extends SubmitGDPRRequest {}
interface ConsentPreferencesBody extends ConsentPreferencesRequest {}

interface VerifyConsentParams {
  token: string;
}

interface VerifyGDPRParams {
  requestId: string;
  token: string;
}

export default async function gdprRoutes(fastify: FastifyInstance) {
  
  // Submit parental consent (first step of double opt-in)
  fastify.post('/consent/submit', {
    schema: {
      description: 'Submit parental consent request',
      tags: ['GDPR'],
      body: {
        type: 'object',
        required: ['parentEmail', 'parentName', 'childName', 'childAge', 'consentTypes', 'ipAddress', 'userAgent'],
        properties: {
          parentEmail: { type: 'string', format: 'email' },
          parentName: { type: 'string', minLength: 1 },
          childName: { type: 'string', minLength: 1 },
          childAge: { type: 'number', minimum: 1, maximum: 18 },
          consentTypes: { type: 'array', items: { type: 'string' } },
          ipAddress: { type: 'string' },
          userAgent: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                consentId: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{ Body: ConsentRequestBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { parentEmail, parentName, childName, childAge, consentTypes, ipAddress, userAgent } = request.body;

        // Generate consent record
        const consentId = uuidv4();
        const firstConsentToken = uuidv4();
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + config.CONSENT_TOKEN_EXPIRY_HOURS);

        // In a real implementation, save to database here
        // For now, mock the response
        
        fastify.log.info('Parental consent submitted', {
          consentId,
          parentEmail,
          childName,
          childAge,
          consentTypes: consentTypes.length
        });

        return reply.send({
          success: true,
          data: {
            consentId,
            message: 'Demande de consentement envoyée. Vérifiez votre email pour la première confirmation.'
          }
        });

      } catch (error) {
        fastify.log.error('Consent submission error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la soumission du consentement',
            code: 'CONSENT_SUBMISSION_ERROR'
          }
        });
      }
    }
  });

  // Verify parental consent (first confirmation)
  fastify.get('/consent/verify/:token', {
    schema: {
      description: 'Verify parental consent (first step)',
      tags: ['GDPR'],
      params: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{ Params: VerifyConsentParams }>,
      reply: FastifyReply
    ) => {
      try {
        const { token } = request.params;

        // In real implementation, verify token and update consent record
        fastify.log.info('Consent verification attempted', { token });

        return reply.send({
          success: true,
          data: {
            message: 'Première confirmation réussie. Un second email de confirmation a été envoyé.'
          }
        });

      } catch (error) {
        fastify.log.error('Consent verification error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la vérification du consentement',
            code: 'CONSENT_VERIFICATION_ERROR'
          }
        });
      }
    }
  });

  // Submit GDPR request
  fastify.post('/request/submit', {
    schema: {
      description: 'Submit GDPR data request',
      tags: ['GDPR'],
      body: {
        type: 'object',
        required: ['requestType', 'requesterType', 'requesterEmail', 'requesterName', 'requestDetails', 'verificationMethod', 'ipAddress', 'userAgent'],
        properties: {
          requestType: { type: 'string', enum: ['access', 'rectification', 'erasure', 'restriction', 'portability', 'objection', 'withdraw_consent'] },
          requesterType: { type: 'string', enum: ['parent', 'student', 'legal_guardian', 'data_protection_officer'] },
          requesterEmail: { type: 'string', format: 'email' },
          requesterName: { type: 'string', minLength: 1 },
          studentId: { type: 'number' },
          studentName: { type: 'string' },
          parentEmail: { type: 'string', format: 'email' },
          requestDetails: { type: 'string', minLength: 10 },
          urgentRequest: { type: 'boolean' },
          verificationMethod: { type: 'string', enum: ['email', 'identity_document', 'parental_verification'] },
          legalBasis: { type: 'string' },
          ipAddress: { type: 'string' },
          userAgent: { type: 'string' }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{ Body: GDPRRequestBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { 
          requestType, 
          requesterType, 
          requesterEmail, 
          requesterName, 
          urgentRequest = false,
          requestDetails 
        } = request.body;

        const requestId = uuidv4();
        const verificationToken = uuidv4();
        
        // Calculate due date based on urgency and type
        const dueDate = new Date();
        const daysToAdd = urgentRequest ? 3 : config.GDPR_REQUEST_DEADLINE_DAYS;
        dueDate.setDate(dueDate.getDate() + daysToAdd);

        fastify.log.info('GDPR request submitted', {
          requestId,
          requestType,
          requesterType,
          requesterEmail,
          urgentRequest
        });

        return reply.send({
          success: true,
          data: {
            requestId,
            verificationRequired: true,
            estimatedCompletionDate: dueDate
          }
        });

      } catch (error) {
        fastify.log.error('GDPR request submission error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la soumission de la demande RGPD',
            code: 'GDPR_REQUEST_ERROR'
          }
        });
      }
    }
  });

  // Verify GDPR request
  fastify.get('/request/:requestId/verify/:token', {
    schema: {
      description: 'Verify GDPR request identity',
      tags: ['GDPR'],
      params: {
        type: 'object',
        required: ['requestId', 'token'],
        properties: {
          requestId: { type: 'string' },
          token: { type: 'string' }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{ Params: VerifyGDPRParams }>,
      reply: FastifyReply
    ) => {
      try {
        const { requestId, token } = request.params;

        fastify.log.info('GDPR request verification', { requestId, token });

        return reply.send({
          success: true,
          data: {
            message: 'Identité vérifiée. Votre demande RGPD est en cours de traitement.'
          }
        });

      } catch (error) {
        fastify.log.error('GDPR verification error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la vérification de la demande RGPD',
            code: 'GDPR_VERIFICATION_ERROR'
          }
        });
      }
    }
  });

  // Get GDPR request status
  fastify.get('/request/:requestId/status', {
    schema: {
      description: 'Get GDPR request status',
      tags: ['GDPR'],
      params: {
        type: 'object',
        required: ['requestId'],
        properties: {
          requestId: { type: 'string' }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{ Params: { requestId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { requestId } = request.params;

        // Mock response - in real implementation, query database
        const mockStatus = {
          requestId,
          status: 'under_review',
          priority: 'medium',
          submittedAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedCompletion: '85%',
          lastUpdate: new Date().toISOString()
        };

        return reply.send({
          success: true,
          data: mockStatus
        });

      } catch (error) {
        fastify.log.error('GDPR status check error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la vérification du statut',
            code: 'STATUS_CHECK_ERROR'
          }
        });
      }
    }
  });

  // Update consent preferences
  fastify.post('/consent/preferences', {
    schema: {
      description: 'Update consent preferences',
      tags: ['GDPR'],
      body: {
        type: 'object',
        required: ['essential', 'functional', 'analytics', 'marketing', 'personalization', 'ipAddress', 'userAgent'],
        properties: {
          essential: { type: 'boolean' },
          functional: { type: 'boolean' },
          analytics: { type: 'boolean' },
          marketing: { type: 'boolean' },
          personalization: { type: 'boolean' },
          ipAddress: { type: 'string' },
          userAgent: { type: 'string' }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{ Body: ConsentPreferencesBody }>,
      reply: FastifyReply
    ) => {
      try {
        const preferences = request.body;
        const preferencesId = uuidv4();

        fastify.log.info('Consent preferences updated', {
          preferencesId,
          analytics: preferences.analytics,
          marketing: preferences.marketing,
          personalization: preferences.personalization
        });

        return reply.send({
          success: true,
          data: {
            preferencesId,
            message: 'Préférences de consentement mises à jour'
          }
        });

      } catch (error) {
        fastify.log.error('Consent preferences error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la mise à jour des préférences',
            code: 'PREFERENCES_UPDATE_ERROR'
          }
        });
      }
    }
  });

  // Export student data (GDPR Article 20)
  fastify.get('/export/:studentId', {
    schema: {
      description: 'Export student data in portable format',
      tags: ['GDPR'],
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['json', 'csv', 'xml'], default: 'json' },
          includeProgress: { type: 'boolean', default: true },
          includeAuditLogs: { type: 'boolean', default: false }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{ 
        Params: { studentId: string },
        Querystring: { format?: string, includeProgress?: boolean, includeAuditLogs?: boolean }
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { studentId } = request.params;
        const { format = 'json', includeProgress = true, includeAuditLogs = false } = request.query;

        // Mock export data
        const exportData = {
          student: {
            id: studentId,
            prenom: 'Alice',
            nom: 'Dupont',
            dateNaissance: '2015-01-01',
            niveauActuel: 'CP',
            totalPoints: 150,
            serieJours: 5,
            mascotteType: 'dragon'
          },
          progress: includeProgress ? [
            { exerciseId: 1, completed: true, score: 85, completedAt: '2024-01-15' },
            { exerciseId: 2, completed: true, score: 92, completedAt: '2024-01-16' }
          ] : [],
          exportedAt: new Date().toISOString(),
          format,
          requestedBy: 'parent'
        };

        const filename = `student-${studentId}-export-${new Date().toISOString().split('T')[0]}.${format}`;
        
        reply.header('Content-Disposition', `attachment; filename="${filename}"`);

        if (format === 'json') {
          reply.type('application/json');
          return reply.send(exportData);
        } else if (format === 'csv') {
          reply.type('text/csv');
          // Mock CSV response
          return reply.send('id,prenom,nom,niveau,points\n1,Alice,Dupont,CP,150');
        } else if (format === 'xml') {
          reply.type('application/xml');
          // Mock XML response
          return reply.send('<?xml version="1.0"?><student><id>1</id><prenom>Alice</prenom></student>');
        }

        return reply.send(exportData);

      } catch (error) {
        fastify.log.error('Data export error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de l\'export des données',
            code: 'DATA_EXPORT_ERROR'
          }
        });
      }
    }
  });

  // GDPR compliance health check
  fastify.get('/health', {
    schema: {
      description: 'GDPR compliance health check',
      tags: ['GDPR']
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const health = {
          gdprEnabled: config.GDPR_ENABLED,
          parentalConsentRequired: config.PARENTAL_CONSENT_REQUIRED,
          dataRetentionDays: config.DATA_RETENTION_DAYS,
          auditLogRetentionDays: config.AUDIT_LOG_RETENTION_DAYS,
          encryptionEnabled: true,
          lastKeyRotation: '2024-01-01',
          totalConsentRecords: 0,
          totalGdprRequests: 0,
          pendingRequests: 0,
          timestamp: new Date().toISOString()
        };

        return reply.send({
          success: true,
          data: health,
          message: 'Service RGPD opérationnel'
        });

      } catch (error) {
        fastify.log.error('GDPR health check error:', error);
        return reply.status(503).send({
          success: false,
          error: {
            message: 'Service RGPD indisponible',
            code: 'GDPR_SERVICE_UNAVAILABLE'
          }
        });
      }
    }
  });
}