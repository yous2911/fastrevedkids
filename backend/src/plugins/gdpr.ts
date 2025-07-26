import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { gdprConfig, emailConfig } from '../config/config';
import { AuditTrailService } from '../services/audit-trail.service';
import { EncryptionService } from '../services/encryption.service';
import { EmailService } from '../services/email.service';
import { GDPRRightsService } from '../services/gdpr-rights.service';
import { ParentalConsentService } from '../services/parental-consent.service';
import { DataRetentionService } from '../services/data-retention.service';
import { DataAnonymizationService } from '../services/data-anonymization.service';

// Déclarations TypeScript pour les services RGPD
declare module 'fastify' {
  interface FastifyInstance {
    auditService: AuditTrailService;
    encryptionService: EncryptionService;
    emailService: EmailService;
    gdprService: GDPRRightsService;
    consentService: ParentalConsentService;
    retentionService: DataRetentionService;
    anonymizationService: DataAnonymizationService;
    gdprAuditMiddleware: (request: any, reply: any) => Promise<void>;
    gdprDataEncryption: (data: any, usage?: string) => Promise<any>;
    gdprDataDecryption: (encryptedData: any) => Promise<any>;
  }
}

interface GDPRPluginOptions {
  enabled?: boolean;
  autoInitialize?: boolean;
  auditMiddleware?: boolean;
}

const gdprPlugin = async (fastify: FastifyInstance, options: GDPRPluginOptions = {}) => {
  const opts = {
    enabled: gdprConfig.enabled,
    autoInitialize: true,
    auditMiddleware: true,
    ...options
  };

  if (!opts.enabled) {
    fastify.log.info('⚠️ GDPR plugin disabled via configuration');
    return;
  }

  fastify.log.info('🔄 Initializing GDPR plugin...');

  try {
    // Initialisation des services RGPD
    const auditService = new AuditTrailService();
    const encryptionService = new EncryptionService({
      rotationIntervalDays: gdprConfig.encryptionKeyRotationDays,
      keyRetentionDays: gdprConfig.dataRetentionDays,
      autoRotation: true
    });
    const emailService = new EmailService();
    const gdprService = new GDPRRightsService();
    const consentService = new ParentalConsentService();
    const retentionService = new DataRetentionService();
    const anonymizationService = new DataAnonymizationService();

    // Décoration des services sur l'instance Fastify
    fastify.decorate('auditService', auditService);
    fastify.decorate('encryptionService', encryptionService);
    fastify.decorate('emailService', emailService);
    fastify.decorate('gdprService', gdprService);
    fastify.decorate('consentService', consentService);
    fastify.decorate('retentionService', retentionService);
    fastify.decorate('anonymizationService', anonymizationService);

    // Middleware d'audit automatique
    if (opts.auditMiddleware) {
      fastify.decorate('gdprAuditMiddleware', async (request: any, reply: any) => {
        try {
          // Capturer les informations de la requête
          const auditData = {
            entityType: request.routerPath?.includes('/students') ? 'student' as const : 'user_session' as const,
            entityId: request.params?.id || request.user?.studentId?.toString() || 'anonymous',
            action: request.method.toLowerCase() === 'get' ? 'read' as const : 
                   request.method.toLowerCase() === 'post' ? 'create' as const :
                   request.method.toLowerCase() === 'put' ? 'update' as const :
                   request.method.toLowerCase() === 'delete' ? 'delete' as const : 'read' as const,
            userId: request.user?.studentId?.toString() || null,
            studentId: request.params?.id ? parseInt(request.params.id) : request.user?.studentId,
            details: {
              method: request.method,
              url: request.url,
              route: request.routerPath,
              userAgent: request.headers['user-agent'] || '',
              timestamp: new Date().toISOString()
            },
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'] || '',
            severity: 'low' as const,
            category: request.routerPath?.includes('/auth') ? 'user_behavior' as const : 'data_access' as const
          };

          // Log de l'audit de manière asynchrone pour ne pas bloquer la requête
          setImmediate(async () => {
            try {
              await auditService.logAction(auditData);
            } catch (auditError) {
              fastify.log.warn('Audit logging failed:', auditError);
            }
          });

        } catch (error) {
          fastify.log.warn('GDPR audit middleware error:', error);
          // Ne pas faire échouer la requête si l'audit échoue
        }
      });

      // Hook pour l'audit automatique sur toutes les routes
      fastify.addHook('preHandler', async (request, reply) => {
        // Appliquer l'audit uniquement sur les routes API sensibles
        if (request.url.startsWith('/api/') && !request.url.includes('/health')) {
          await fastify.gdprAuditMiddleware(request, reply);
        }
      });
    }

    // Helpers pour chiffrement/déchiffrement
    fastify.decorate('gdprDataEncryption', async (data: any, usage: string = 'student_data') => {
      return await encryptionService.encryptStudentData(data, usage as any);
    });

    fastify.decorate('gdprDataDecryption', async (encryptedData: any) => {
      return await encryptionService.decryptStudentData(encryptedData);
    });

    // Hook pour la vérification du consentement parental sur les routes étudiants
    if (gdprConfig.parentalConsentRequired) {
      fastify.addHook('preHandler', async (request, reply) => {
        // Vérifier le consentement uniquement pour les routes d'étudiants
        if (request.url.startsWith('/api/students') && request.method !== 'GET') {
          const studentId = request.params?.id || request.user?.studentId;
          
          if (studentId) {
            try {
              const hasConsent = await consentService.verifyActiveConsent(studentId.toString());
              
              if (!hasConsent) {
                return reply.status(403).send({
                  success: false,
                  error: {
                    message: 'Consentement parental requis pour cette action',
                    code: 'PARENTAL_CONSENT_REQUIRED'
                  }
                });
              }
            } catch (error) {
              fastify.log.warn('Consent verification failed:', error);
              // En cas d'erreur, permettre l'accès mais logger l'incident
              await auditService.logAction({
                entityType: 'parental_consent',
                entityId: studentId.toString(),
                action: 'read',
                userId: request.user?.studentId?.toString() || null,
                details: {
                  error: 'consent_verification_failed',
                  route: request.url
                },
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'] || '',
                severity: 'medium',
                category: 'consent_management'
              });
            }
          }
        }
      });
    }

    // Tâches de maintenance RGPD en arrière-plan
    if (opts.autoInitialize) {
      // Nettoyage automatique des clés expirées (toutes les 24h)
      setInterval(async () => {
        try {
          const cleanedKeys = await encryptionService.cleanupExpiredKeys();
          if (cleanedKeys > 0) {
            fastify.log.info(`🧹 Cleaned up ${cleanedKeys} expired encryption keys`);
          }
        } catch (error) {
          fastify.log.error('Error cleaning up expired keys:', error);
        }
      }, 24 * 60 * 60 * 1000); // 24 heures

      // Application des politiques de rétention (toutes les 6h)
      setInterval(async () => {
        try {
          await retentionService.applyRetentionPolicies();
          fastify.log.debug('✅ Retention policies applied');
        } catch (error) {
          fastify.log.error('Error applying retention policies:', error);
        }
      }, 6 * 60 * 60 * 1000); // 6 heures

      fastify.log.info('⏰ GDPR maintenance tasks scheduled');
    }

    // Hook de fermeture pour nettoyage propre
    fastify.addHook('onClose', async () => {
      fastify.log.info('🔄 Shutting down GDPR services...');
      // Ici on pourrait ajouter du nettoyage si nécessaire
    });

    fastify.log.info('✅ GDPR plugin initialized successfully');
    fastify.log.info(`📊 GDPR Configuration: 
      - Parental consent required: ${gdprConfig.parentalConsentRequired}
      - Data retention: ${gdprConfig.dataRetentionDays} days
      - Key rotation: ${gdprConfig.encryptionKeyRotationDays} days
      - Audit retention: ${gdprConfig.auditLogRetentionDays} days`);

  } catch (error) {
    fastify.log.error('❌ Failed to initialize GDPR plugin:', error);
    throw error;
  }
};

export default fp(gdprPlugin, {
  name: 'gdpr',
  dependencies: ['database'] // S'assurer que la DB est prête
});