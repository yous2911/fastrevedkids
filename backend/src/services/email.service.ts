import nodemailer from 'nodemailer';
import { config, emailConfig, gdprConfig } from '../config/config';
import { logger } from '../utils/logger';
import { AuditTrailService } from './audit-trail.service';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private auditService: AuditTrailService;

  constructor() {
    // Utiliser la configuration email centralisée
    this.transporter = nodemailer.createTransporter({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.port === 465,
      auth: emailConfig.user ? {
        user: emailConfig.user,
        pass: emailConfig.pass
      } : undefined,
      // Configuration de sécurité renforcée
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      logger: config.NODE_ENV === 'development',
      debug: config.NODE_ENV === 'development'
    });

    this.auditService = new AuditTrailService();
    
    // Vérifier la connexion au démarrage
    this.verifyConnection();
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const html = this.renderTemplate(options.template, options.variables);
      
      const mailOptions = {
        from: emailConfig.from,
        to: options.to,
        subject: options.subject,
        html,
        attachments: options.attachments,
        // Headers de sécurité
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'X-Mailer': 'RevEd Kids Platform',
          'X-Auto-Response-Suppress': 'All'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      // Audit log pour l'envoi d'email
      await this.auditService.logAction({
        entityType: 'user_session',
        entityId: options.to,
        action: 'create',
        userId: null,
        details: {
          emailType: 'gdpr_notification',
          template: options.template,
          to: options.to,
          subject: options.subject,
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected
        },
        severity: 'low',
        category: 'compliance'
      });
      
      logger.info('Email sent successfully', { 
        to: options.to, 
        subject: options.subject,
        template: options.template,
        messageId: result.messageId
      });
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  private renderTemplate(template: string, variables: Record<string, any>): string {
    const templates: Record<string, string> = {
      'parental-consent-first': `
        <h2>Confirmation de consentement parental - RevEd Kids (1/2)</h2>
        <p>Bonjour ${variables.parentName},</p>
        <p>Nous avons reçu une demande de création de compte pour votre enfant <strong>${variables.childName}</strong>.</p>
        <p>Pour finaliser la création du compte, veuillez confirmer votre consentement en cliquant sur le lien ci-dessous :</p>
        <p><a href="${variables.verificationUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Confirmer le consentement (1/2)</a></p>
        <p><strong>Types de consentement :</strong></p>
        <pre>${variables.consentTypes}</pre>
        <p>Ce lien expire le ${variables.expiryDate}.</p>
        <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        <p>Cordialement,<br>L'équipe RevEd Kids</p>
      `,
      
      'parental-consent-second': `
        <h2>Confirmation finale - RevEd Kids (2/2)</h2>
        <p>Bonjour ${variables.parentName},</p>
        <p>Merci pour votre première confirmation. Pour finaliser complètement le processus, veuillez confirmer une seconde fois :</p>
        <p><a href="${variables.verificationUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Confirmation finale (2/2)</a></p>
        <p>Ce lien expire le ${variables.expiryDate}.</p>
        <p>Une fois confirmé, le compte de ${variables.childName} sera activé.</p>
        <p>Cordialement,<br>L'équipe RevEd Kids</p>
      `,
      
      'student-account-created': `
        <h2>Compte élève créé avec succès !</h2>
        <p>Bonjour ${variables.parentName},</p>
        <p>Le compte de votre enfant <strong>${variables.childName}</strong> a été créé avec succès !</p>
        <p><strong>Identifiant élève :</strong> ${variables.studentId}</p>
        <p>Vous pouvez maintenant accéder à la plateforme :</p>
        <p><a href="${variables.loginUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accéder à la plateforme</a></p>
        <p>Pour toute question : ${emailConfig.supportEmail}</p>
        <p>Cordialement,<br>L'équipe RevEd Kids</p>
      `,
      
      'gdpr-verification': `
        <h2>Vérification de votre demande RGPD</h2>
        <p>Bonjour ${variables.requesterName},</p>
        <p>Nous avons reçu votre demande de <strong>${variables.requestType}</strong>.</p>
        <p><strong>Numéro de demande :</strong> ${variables.requestId}</p>
        <p>Pour des raisons de sécurité, veuillez vérifier votre identité :</p>
        <p><a href="${variables.verificationUrl}" style="background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Vérifier mon identité</a></p>
        <p>Ce lien expire dans ${variables.expiryTime}.</p>
        <p>Cordialement,<br>L'équipe RevEd Kids</p>
      `,
      
      'gdpr-confirmation': `
        <h2>Confirmation de votre demande RGPD</h2>
        <p>Bonjour ${variables.requesterName},</p>
        <p>Votre demande de <strong>${variables.requestType}</strong> a été enregistrée avec succès.</p>
        <p><strong>Numéro de demande :</strong> ${variables.requestId}</p>
        <p><strong>Priorité :</strong> ${variables.priority}</p>
        <p><strong>Échéance de traitement :</strong> ${variables.dueDate}</p>
        <p>Nous vous tiendrons informé de l'avancement de votre demande.</p>
        <p>Cordialement,<br>L'équipe RevEd Kids</p>
      `,
      
      'test': `
        <h2>Test de Configuration Email - RevEd Kids</h2>
        <p>Ce message confirme que la configuration email fonctionne correctement.</p>
        <p><strong>Timestamp :</strong> ${variables.timestamp}</p>
        <p><strong>Environnement :</strong> ${variables.environment}</p>
        <p>Si vous recevez ce message, le service email est opérationnel.</p>
        <p>Cordialement,<br>L'équipe technique RevEd Kids</p>
      `
    };

    return templates[template] || `<p>Template ${template} not found</p>`;
  }

  /**
   * Vérifier la connexion SMTP au démarrage
   */
  private async verifyConnection(): Promise<void> {
    try {
      if (!emailConfig.user || !emailConfig.host) {
        logger.warn('⚠️ Email service: SMTP configuration incomplete, emails will be mocked');
        return;
      }

      await this.transporter.verify();
      logger.info('✅ Email service: SMTP connection verified');
    } catch (error) {
      logger.warn('⚠️ Email service: SMTP verification failed, emails will be logged only', error);
    }
  }

  /**
   * Envoi d'email avec retry et fallback
   */
  async sendEmailWithRetry(options: EmailOptions, maxRetries: number = 3): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.sendEmail(options);
        return; // Succès
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Email sending attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          // Attendre avant le retry (backoff exponentiel)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // Toutes les tentatives ont échoué
    logger.error(`Failed to send email after ${maxRetries} attempts:`, lastError);
    
    // Log de l'échec pour audit
    await this.auditService.logAction({
      entityType: 'user_session',
      entityId: options.to,
      action: 'create',
      userId: null,
      details: {
        emailType: 'failed_notification',
        template: options.template,
        to: options.to,
        subject: options.subject,
        error: lastError?.message,
        attempts: maxRetries
      },
      severity: 'medium',
      category: 'system'
    });

    throw lastError || new Error('Failed to send email after retries');
  }

  /**
   * Envoyer un email de consentement parental
   */
  async sendParentalConsentEmail(
    parentEmail: string,
    parentName: string,
    childName: string,
    verificationUrl: string,
    consentTypes: string[],
    step: 'first' | 'second' = 'first'
  ): Promise<void> {
    const template = step === 'first' ? 'parental-consent-first' : 'parental-consent-second';
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + gdprConfig.consentTokenExpiryHours);

    await this.sendEmailWithRetry({
      to: parentEmail,
      subject: `Consentement parental RevEd Kids - ${step === 'first' ? 'Étape 1/2' : 'Confirmation finale'}`,
      template,
      variables: {
        parentName,
        childName,
        verificationUrl,
        consentTypes: consentTypes.join(', '),
        expiryDate: expiryDate.toLocaleDateString('fr-FR')
      }
    });
  }

  /**
   * Envoyer un email de vérification RGPD
   */
  async sendGDPRVerificationEmail(
    requesterEmail: string,
    requesterName: string,
    requestType: string,
    requestId: string,
    verificationUrl: string
  ): Promise<void> {
    await this.sendEmailWithRetry({
      to: requesterEmail,
      subject: `Vérification demande RGPD - ${requestId}`,
      template: 'gdpr-verification',
      variables: {
        requesterName,
        requestType,
        requestId,
        verificationUrl,
        expiryTime: '24 heures'
      }
    });
  }

  /**
   * Envoyer un email de confirmation RGPD
   */
  async sendGDPRConfirmationEmail(
    requesterEmail: string,
    requesterName: string,
    requestType: string,
    requestId: string,
    priority: string,
    dueDate: Date
  ): Promise<void> {
    await this.sendEmailWithRetry({
      to: requesterEmail,
      subject: `Confirmation demande RGPD - ${requestId}`,
      template: 'gdpr-confirmation',
      variables: {
        requesterName,
        requestType,
        requestId,
        priority,
        dueDate: dueDate.toLocaleDateString('fr-FR')
      }
    });
  }

  /**
   * Test de l'envoi d'email (pour la configuration)
   */
  async sendTestEmail(toEmail: string): Promise<boolean> {
    try {
      await this.sendEmail({
        to: toEmail,
        subject: 'Test RevEd Kids - Configuration Email',
        template: 'test',
        variables: {
          timestamp: new Date().toISOString(),
          environment: config.NODE_ENV
        }
      });
      return true;
    } catch (error) {
      logger.error('Test email failed:', error);
      return false;
    }
  }
}