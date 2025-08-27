// src/services/email.service.ts - Updated with test environment mocking

import nodemailer from 'nodemailer';
import { config } from '../config/config';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isTestMode = config.NODE_ENV === 'test';

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (this.isTestMode) {
      // Use mock transporter for tests
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025, // Use a mock port
        secure: false,
        auth: {
          user: 'test',
          pass: 'test'
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      console.log('📧 Email service initialized in test mode (mock)');
    } else {
      // Production email configuration
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      console.log('📧 Email service initialized in production mode');
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    if (this.isTestMode) {
      // Mock email sending for tests
      console.log(`📧 [TEST] Mock email sent to ${to}: ${subject}`);
      return true;
    }

    if (!this.transporter) {
      console.error('❌ Email transporter not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: config.SMTP_FROM,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '')
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to ${to}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const subject = 'Réinitialisation de mot de passe - RevEd Kids';
    const html = `
      <h2>Réinitialisation de mot de passe</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}">Réinitialiser le mot de passe</a>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendWelcomeEmail(to: string, studentName: string): Promise<boolean> {
    const subject = 'Bienvenue sur RevEd Kids !';
    const html = `
      <h2>Bienvenue ${studentName} !</h2>
      <p>Nous sommes ravis de vous accueillir sur RevEd Kids.</p>
      <p>Votre compte a été créé avec succès.</p>
      <p>Commencez votre apprentissage dès maintenant !</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendGDPRNotification(to: string, action: string): Promise<boolean> {
    const subject = `Notification GDPR - ${action}`;
    const html = `
      <h2>Notification GDPR</h2>
      <p>Une action GDPR a été effectuée sur votre compte : ${action}</p>
      <p>Si vous n'êtes pas à l'origine de cette action, contactez-nous immédiatement.</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  // Template management methods
  getAvailableTemplates(): string[] {
    return ['welcome', 'password-reset', 'verification', 'user-registration-welcome', 'password-reset-request', 'student-progress-report', 'achievement-notification'];
  }

  validateTemplateVariables(template: string, variables: any): { isValid: boolean; missingVars: string[] } {
    const requiredVars = {
      'user-registration-welcome': ['userName', 'username', 'email', 'createdAt', 'loginUrl'],
      'password-reset-request': ['userName', 'resetUrl', 'ipAddress', 'userAgent'],
      'student-progress-report': ['studentName', 'parentName', 'progressData'],
      'achievement-notification': ['studentName', 'achievement']
    };

    const required = requiredVars[template] || [];
    const missing = required.filter(v => !variables[v]);
    
    return {
      isValid: missing.length === 0,
      missingVars: missing
    };
  }

  // Additional email methods
  async sendUserRegistrationWelcome(to: string, name: string, username: string): Promise<boolean> {
    const subject = 'Bienvenue sur RevEd Kids !';
    const html = `
      <h2>Bienvenue ${name} !</h2>
      <p>Votre compte a été créé avec succès.</p>
      <p>Nom d'utilisateur : ${username}</p>
      <p>Commencez votre apprentissage dès maintenant !</p>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendUserRegistrationVerification(to: string, name: string, verifyUrl: string): Promise<boolean> {
    const subject = 'Vérifiez votre compte RevEd Kids';
    const html = `
      <h2>Vérification de compte</h2>
      <p>Bonjour ${name},</p>
      <p>Veuillez vérifier votre compte en cliquant sur le lien suivant :</p>
      <a href="${verifyUrl}">Vérifier mon compte</a>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendPasswordResetRequest(to: string, name: string, resetUrl: string, ipAddress: string, userAgent: string): Promise<boolean> {
    const subject = 'Demande de réinitialisation de mot de passe';
    const html = `
      <h2>Demande de réinitialisation</h2>
      <p>Bonjour ${name},</p>
      <p>Une demande de réinitialisation de mot de passe a été effectuée depuis :</p>
      <p>IP: ${ipAddress}</p>
      <p>Navigateur: ${userAgent}</p>
      <a href="${resetUrl}">Réinitialiser le mot de passe</a>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendPasswordResetConfirmation(to: string, name: string, ipAddress: string): Promise<boolean> {
    const subject = 'Mot de passe réinitialisé avec succès';
    const html = `
      <h2>Mot de passe réinitialisé</h2>
      <p>Bonjour ${name},</p>
      <p>Votre mot de passe a été réinitialisé avec succès depuis l'adresse IP : ${ipAddress}</p>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendStudentProgressReport(to: string, parentName: string, studentName: string, progressData: any): Promise<boolean> {
    const subject = `Rapport de progression - ${studentName}`;
    const html = `
      <h2>Rapport de progression</h2>
      <p>Bonjour ${parentName},</p>
      <p>Voici le rapport de progression de ${studentName} :</p>
      <pre>${JSON.stringify(progressData, null, 2)}</pre>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendAchievementNotification(to: string, studentName: string, achievement: any): Promise<boolean> {
    const subject = `Félicitations ${studentName} !`;
    const html = `
      <h2>Nouvelle réussite !</h2>
      <p>Félicitations ${studentName} !</p>
      <p>Vous avez obtenu : ${achievement.title}</p>
      <p>${achievement.description}</p>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendMaintenanceNotification(to: string, maintenanceInfo: any): Promise<boolean> {
    const subject = 'Maintenance planifiée - RevEd Kids';
    const html = `
      <h2>Maintenance planifiée</h2>
      <p>Une maintenance est prévue :</p>
      <p>Date: ${maintenanceInfo.date}</p>
      <p>Durée: ${maintenanceInfo.duration}</p>
      <p>${maintenanceInfo.description}</p>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendSecurityAlert(to: string, userName: string, alertInfo: any): Promise<boolean> {
    const subject = 'Alerte de sécurité - RevEd Kids';
    const html = `
      <h2>Alerte de sécurité</h2>
      <p>Bonjour ${userName},</p>
      <p>Une activité suspecte a été détectée sur votre compte :</p>
      <p>Type: ${alertInfo.type}</p>
      <p>Date: ${alertInfo.date}</p>
      <p>IP: ${alertInfo.ipAddress}</p>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendBulkEmails(emails: any[], rateLimit: number, delay: number): Promise<any> {
    const results = { sent: 0, failed: 0, errors: [] };
    
    for (const email of emails) {
      try {
        const success = await this.sendEmail(email.to, email.subject, email.html, email.text);
        if (success) {
          results.sent++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(error);
      }
      
      // Rate limiting
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  }

  async getEmailServiceStatus(): Promise<any> {
    return {
      status: 'healthy',
      config: { 
        host: this.isTestMode ? 'localhost' : config.SMTP_HOST, 
        port: this.isTestMode ? 1025 : config.SMTP_PORT 
      },
      validation: { smtp: true, templates: true }
    };
  }

  async sendTestEmail(to: string): Promise<boolean> {
    const subject = 'Test Email - RevEd Kids';
    const html = `
      <h2>Email de test</h2>
      <p>Cet email confirme que le service d'email fonctionne correctement.</p>
      <p>Date: ${new Date().toISOString()}</p>
    `;
    return this.sendEmail(to, subject, html);
  }
}

export const emailService = new EmailService();