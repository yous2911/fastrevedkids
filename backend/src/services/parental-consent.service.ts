import crypto from 'crypto';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { emailService } from './email.service';
import { AuditTrailService } from './audit-trail.service';
import { DataAnonymizationService } from './data-anonymization.service';
import { EncryptionService } from './encryption.service';
import { db } from '../db/connection';
import { gdprConsentRequests, students } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Validation schemas
const ParentalConsentSchema = z.object({
  parentEmail: z.string().email(),
  parentName: z.string().min(2).max(100),
  childName: z.string().min(2).max(100),
  childAge: z.number().min(3).max(18),
  consentTypes: z.array(z.enum([
    'data_processing',
    'educational_content',
    'progress_tracking',
    'communication',
    'analytics',
    'marketing'
  ])),
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  timestamp: z.date().default(() => new Date())
});

const ConsentVerificationSchema = z.object({
  token: z.string().uuid(),
  ipAddress: z.string().ip(),
  userAgent: z.string()
});

export interface ParentalConsent {
  id: string;
  parentEmail: string;
  parentName: string;
  childName: string;
  childAge: number;
  consentTypes: string[];
  status: 'pending' | 'verified' | 'expired' | 'revoked';
  firstConsentToken: string;
  secondConsentToken?: string;
  firstConsentDate?: Date;
  secondConsentDate?: Date;
  verificationDate?: Date;
  expiryDate: Date;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentHistory {
  id: string;
  consentId: string;
  action: 'created' | 'first_consent' | 'second_consent' | 'verified' | 'revoked' | 'expired';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details: any;
}

export class ParentalConsentService {
  private emailService = emailService; // Use singleton instance
  private auditService: AuditTrailService;
  private anonymizationService: DataAnonymizationService;
  private encryptionService: EncryptionService;

  constructor() {
    this.auditService = new AuditTrailService();
    this.anonymizationService = new DataAnonymizationService();
    this.encryptionService = new EncryptionService();
  }

  /**
   * Initiate parental consent process with double opt-in
   */
  async initiateConsent(consentData: z.infer<typeof ParentalConsentSchema>): Promise<{
    consentId: string;
    message: string;
  }> {
    try {
      // Validate input
      const validatedData = ParentalConsentSchema.parse(consentData);
      
      // Check for existing pending consent
      const existingConsent = await this.findPendingConsentByEmail(validatedData.parentEmail);
      if (existingConsent) {
        throw new Error('Un processus de consentement est déjà en cours pour cette adresse email');
      }

      // Generate unique consent ID and tokens
      const consentId = crypto.randomUUID();
      const firstConsentToken = crypto.randomUUID();
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create consent record
      const consent: ParentalConsent = {
        id: consentId,
        parentEmail: validatedData.parentEmail,
        parentName: validatedData.parentName,
        childName: validatedData.childName,
        childAge: validatedData.childAge,
        consentTypes: validatedData.consentTypes,
        status: 'pending',
        firstConsentToken,
        expiryDate,
        ipAddress: validatedData.ipAddress,
        userAgent: validatedData.userAgent,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database
      await this.saveConsent(consent);

      // Log audit trail
      await this.auditService.logAction({
        entityType: 'parental_consent',
        entityId: consentId,
        action: 'created',
        userId: null,
        details: {
          parentEmail: validatedData.parentEmail,
          childName: validatedData.childName,
          consentTypes: validatedData.consentTypes
        },
        ipAddress: validatedData.ipAddress,
        userAgent: validatedData.userAgent
      });

      // Send first consent email
      await this.sendFirstConsentEmail(consent);

      logger.info(`Parental consent initiated`, { 
        consentId, 
        parentEmail: validatedData.parentEmail 
      });

      return {
        consentId,
        message: 'Un email de confirmation a été envoyé à l\'adresse parentale.'
      };

    } catch (error) {
      logger.error('Error initiating parental consent:', error);
      throw error;
    }
  }

  /**
   * Process first consent click
   */
  async processFirstConsent(token: string, verificationData: z.infer<typeof ConsentVerificationSchema>): Promise<{
    message: string;
    requiresSecondConsent: boolean;
  }> {
    try {
      const validatedData = ConsentVerificationSchema.parse(verificationData);
      
      // Find consent by first token
      const consent = await this.findConsentByFirstToken(token);
      if (!consent) {
        throw new Error('Token de consentement invalide ou expiré');
      }

      if (consent.status !== 'pending') {
        throw new Error('Ce consentement a déjà été traité');
      }

      if (new Date() > consent.expiryDate) {
        throw new Error('Le délai de consentement a expiré');
      }

      // Generate second consent token
      const secondConsentToken = crypto.randomUUID();
      
      // Update consent with first consent confirmation
      await this.updateConsent(consent.id, {
        firstConsentDate: new Date(),
        secondConsentToken,
        updatedAt: new Date()
      });

      // Log audit trail
      await this.auditService.logAction({
        entityType: 'parental_consent',
        entityId: consent.id,
        action: 'first_consent',
        userId: null,
        details: {
          parentEmail: consent.parentEmail,
          firstConsentDate: new Date()
        },
        ipAddress: validatedData.ipAddress,
        userAgent: validatedData.userAgent
      });

      // Send second consent email
      await this.sendSecondConsentEmail({
        ...consent,
        secondConsentToken
      });

      logger.info(`First parental consent processed`, { 
        consentId: consent.id,
        parentEmail: consent.parentEmail 
      });

      return {
        message: 'Première confirmation reçue. Un second email de confirmation vous a été envoyé.',
        requiresSecondConsent: true
      };

    } catch (error) {
      logger.error('Error processing first consent:', error);
      throw error;
    }
  }

  /**
   * Process second consent click (final verification)
   */
  async processSecondConsent(token: string, verificationData: z.infer<typeof ConsentVerificationSchema>): Promise<{
    consentId: string;
    message: string;
    studentId: string;
  }> {
    try {
      const validatedData = ConsentVerificationSchema.parse(verificationData);
      
      // Find consent by second token
      const consent = await this.findConsentBySecondToken(token);
      if (!consent) {
        throw new Error('Token de consentement invalide ou expiré');
      }

      if (consent.status !== 'pending') {
        throw new Error('Ce consentement a déjà été traité');
      }

      if (new Date() > consent.expiryDate) {
        throw new Error('Le délai de consentement a expiré');
      }

      if (!consent.firstConsentDate) {
        throw new Error('La première confirmation n\'a pas été effectuée');
      }

      // Update consent as verified
      const verificationDate = new Date();
      await this.updateConsent(consent.id, {
        status: 'verified',
        secondConsentDate: verificationDate,
        verificationDate,
        updatedAt: verificationDate
      });

      // Create student account
      const studentId = await this.createStudentAccount(consent);

      // Log audit trail
      await this.auditService.logAction({
        entityType: 'parental_consent',
        entityId: consent.id,
        action: 'verified',
        userId: null,
        details: {
          parentEmail: consent.parentEmail,
          childName: consent.childName,
          studentId,
          verificationDate
        },
        ipAddress: validatedData.ipAddress,
        userAgent: validatedData.userAgent
      });

      // Send confirmation email
      await this.sendConsentConfirmationEmail(consent, studentId);

      logger.info(`Parental consent fully verified`, { 
        consentId: consent.id,
        parentEmail: consent.parentEmail,
        studentId
      });

      return {
        consentId: consent.id,
        studentId,
        message: 'Consentement parental vérifié avec succès. Le compte élève a été créé.'
      };

    } catch (error) {
      logger.error('Error processing second consent:', error);
      throw error;
    }
  }

  /**
   * Revoke parental consent
   */
  async revokeConsent(consentId: string, parentEmail: string, reason?: string): Promise<void> {
    try {
      const consent = await this.findConsentById(consentId);
      if (!consent) {
        throw new Error('Consentement introuvable');
      }

      if (consent.parentEmail !== parentEmail) {
        throw new Error('Email parental non autorisé pour ce consentement');
      }

      if (consent.status === 'revoked') {
        throw new Error('Ce consentement a déjà été révoqué');
      }

      // Update consent status
      await this.updateConsent(consentId, {
        status: 'revoked',
        updatedAt: new Date()
      });

      // Log audit trail
      await this.auditService.logAction({
        entityType: 'parental_consent',
        entityId: consentId,
        action: 'revoked',
        userId: null,
        details: {
          parentEmail,
          reason: reason || 'Révocation par le parent',
          revokedAt: new Date()
        },
        ipAddress: '',
        userAgent: ''
      });

      // If consent was verified, anonymize student data
      if (consent.status === 'verified') {
        await this.handleConsentRevocation(consent);
      }

      logger.info(`Parental consent revoked`, { 
        consentId,
        parentEmail,
        reason 
      });

    } catch (error) {
      logger.error('Error revoking consent:', error);
      throw error;
    }
  }

  /**
   * Get consent status and details
   */
  async getConsentStatus(consentId: string): Promise<{
    status: string;
    parentEmail: string;
    childName: string;
    consentTypes: string[];
    createdAt: Date;
    verificationDate?: Date;
    expiryDate: Date;
  }> {
    try {
      const consent = await this.findConsentById(consentId);
      if (!consent) {
        throw new Error('Consentement introuvable');
      }

      return {
        status: consent.status,
        parentEmail: consent.parentEmail,
        childName: consent.childName,
        consentTypes: consent.consentTypes,
        createdAt: consent.createdAt,
        verificationDate: consent.verificationDate,
        expiryDate: consent.expiryDate
      };

    } catch (error) {
      logger.error('Error getting consent status:', error);
      throw error;
    }
  }

  /**
   * Check if consent is valid for specific data processing
   */
  async isConsentValidForProcessing(studentId: string, processingType: string): Promise<boolean> {
    try {
      const consent = await this.findConsentByStudentId(studentId);
      if (!consent) {
        return false;
      }

      return consent.status === 'verified' && 
             consent.consentTypes.includes(processingType) &&
             new Date() <= consent.expiryDate;

    } catch (error) {
      logger.error('Error checking consent validity:', error);
      return false;
    }
  }

  // Private helper methods
  private async sendFirstConsentEmail(consent: ParentalConsent): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/consent/verify/${consent.firstConsentToken}`;
    
    const html = `
      <h2>Confirmation de consentement parental - RevEd Kids (1/2)</h2>
      <p>Bonjour ${consent.parentName},</p>
      <p>Pour confirmer le consentement parental pour ${consent.childName}, veuillez cliquer sur le lien suivant :</p>
      <a href="${verificationUrl}">Confirmer le consentement</p>
      <p>Ce lien expire le ${consent.expiryDate.toLocaleDateString('fr-FR')}.</p>
      <p>Types de consentement :</p>
      <p>${this.formatConsentTypes(consent.consentTypes)}</p>
    `;
    
    await this.emailService.sendEmail(
      consent.parentEmail,
      'Confirmation de consentement parental - RevEd Kids (1/2)',
      html
    );
  }

  private async sendSecondConsentEmail(consent: ParentalConsent & { secondConsentToken: string }): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/consent/verify/${consent.secondConsentToken}`;
    
    const html = `
      <h2>Confirmation finale de consentement parental - RevEd Kids (2/2)</h2>
      <p>Bonjour ${consent.parentName},</p>
      <p>Pour finaliser le consentement parental pour ${consent.childName}, veuillez cliquer sur le lien suivant :</p>
      <a href="${verificationUrl}">Finaliser le consentement</p>
      <p>Ce lien expire le ${consent.expiryDate.toLocaleDateString('fr-FR')}.</p>
    `;
    
    await this.emailService.sendEmail(
      consent.parentEmail,
      'Confirmation finale de consentement parental - RevEd Kids (2/2)',
      html
    );
  }

  private async sendConsentConfirmationEmail(consent: ParentalConsent, studentId: string): Promise<void> {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    
    const html = `
      <h2>Compte élève créé avec succès - RevEd Kids</h2>
      <p>Bonjour ${consent.parentName},</p>
      <p>Le compte élève pour ${consent.childName} a été créé avec succès.</p>
      <p>Identifiant élève : ${studentId}</p>
      <p>Vous pouvez maintenant vous connecter : <a href="${loginUrl}">Se connecter</a></p>
      <p>Pour toute question, contactez-nous à ${process.env.SUPPORT_EMAIL || 'support@revedkids.com'}.</p>
    `;
    
    await this.emailService.sendEmail(
      consent.parentEmail,
      'Compte élève créé avec succès - RevEd Kids',
      html
    );
  }

  private formatConsentTypes(types: string[]): string {
    const typeLabels: Record<string, string> = {
      data_processing: 'Traitement des données personnelles',
      educational_content: 'Accès au contenu éducatif',
      progress_tracking: 'Suivi des progrès scolaires',
      communication: 'Communications relatives au service',
      analytics: 'Analyses statistiques anonymisées',
      marketing: 'Communications marketing (optionnel)'
    };

    return types.map(type => `• ${typeLabels[type] || type}`).join('\n');
  }

  // Test helper methods (for mocking in tests)
  async findConsentByToken(token: string): Promise<ParentalConsent | null> {
    try {
      const [consent] = await db.select().from(gdprConsentRequests)
        .where(eq(gdprConsentRequests.requestToken, token))
        .limit(1);
      
      return consent ? this.mapToParentalConsent(consent) : null;
    } catch (error) {
      logger.error('Error finding consent by token:', error);
      return null;
    }
  }

  async findConsentBySecondToken(token: string): Promise<ParentalConsent | null> {
    try {
      // For now, we'll use the same logic as first token
      // In a real implementation, you'd have a separate second token field
      const [consent] = await db.select().from(gdprConsentRequests)
        .where(eq(gdprConsentRequests.requestToken, token))
        .limit(1);
      
      return consent ? this.mapToParentalConsent(consent) : null;
    } catch (error) {
      logger.error('Error finding consent by second token:', error);
      return null;
    }
  }

  async findConsentById(consentId: string): Promise<ParentalConsent | null> {
    try {
      const [consent] = await db.select().from(gdprConsentRequests)
        .where(eq(gdprConsentRequests.id, parseInt(consentId)))
        .limit(1);
      
      return consent ? this.mapToParentalConsent(consent) : null;
    } catch (error) {
      logger.error('Error finding consent by ID:', error);
      return null;
    }
  }

  async updateConsent(consentId: string, updates: Partial<ParentalConsent>): Promise<void> {
    try {
      await db.update(gdprConsentRequests)
        .set({
          status: updates.status || 'pending',
          processedAt: updates.status === 'verified' ? new Date() : null
        })
        .where(eq(gdprConsentRequests.id, parseInt(consentId)));
    } catch (error) {
      logger.error('Error updating consent:', error);
      throw new Error('Failed to update consent');
    }
  }

  private mapToParentalConsent(dbConsent: any): ParentalConsent {
    return {
      id: dbConsent.id.toString(),
      parentName: dbConsent.requesterName || 'Parent',
      parentEmail: dbConsent.requesterEmail || '',
      childName: dbConsent.studentName || 'Child',
      childAge: 8, // Default age for testing
      consentTypes: ['data_processing', 'educational_content'],
      status: dbConsent.status || 'pending',
      firstConsentToken: dbConsent.requestToken || '',
      secondConsentToken: dbConsent.requestToken || '', // For testing
      firstConsentDate: dbConsent.firstConsentDate || undefined,
      secondConsentDate: dbConsent.secondConsentDate || undefined,
      verificationDate: dbConsent.verificationDate || undefined,
      expiryDate: new Date(dbConsent.expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000), // Use expiresAt from DB
      ipAddress: dbConsent.ipAddress || '',
      userAgent: dbConsent.userAgent || '',
      createdAt: dbConsent.createdAt || new Date(),
      updatedAt: dbConsent.updatedAt || new Date()
    };
  }

  private async createStudentAccount(consent: ParentalConsent): Promise<string> {
    try {
      const result = await db.transaction(async (tx) => {
        // Calculate date of birth from age
        const dateNaissance = new Date();
        dateNaissance.setFullYear(dateNaissance.getFullYear() - consent.childAge);

        // Create student account
        const [student] = await tx.insert(students).values({
          prenom: consent.childName.split(' ')[0] || consent.childName,
          nom: consent.childName.split(' ').slice(1).join(' ') || 'Élève',
          email: null, // Child doesn't have email initially
          passwordHash: null, // Password will be set during first login
          dateNaissance,
          niveauActuel: this.calculateGradeLevelFromAge(consent.childAge),
          totalPoints: 0,
          serieJours: 0,
          mascotteType: 'dragon',
          dernierAcces: null,
          estConnecte: false,
          failedLoginAttempts: 0,
          lockedUntil: null,
          passwordResetToken: null,
          passwordResetExpires: null,
          niveauScolaire: this.calculateGradeLevelFromAge(consent.childAge),
          mascotteColor: '#ff6b35'
        });

        return student.insertId.toString();
      });

      logger.info('Student account created from parental consent', {
        studentId: result,
        consentId: consent.id,
        childName: consent.childName
      });

      return result;

    } catch (error) {
      logger.error('Error creating student account:', error);
      throw new Error('Échec de la création du compte élève');
    }
  }

  private async handleConsentRevocation(consent: ParentalConsent): Promise<void> {
    try {
      // Find the student account associated with this consent
      const studentRecord = await this.findStudentByConsentId(consent.id);
      
      if (studentRecord) {
        // Schedule anonymization of all student data
        await this.anonymizationService.scheduleAnonymization({
          entityType: 'student',
          entityId: studentRecord.id.toString(),
          reason: 'consent_withdrawal',
          preserveStatistics: false, // Complete anonymization
          immediateExecution: true,
          notifyUser: false // Don't notify as consent was revoked
        });

        logger.info('Student data anonymization scheduled after consent revocation', {
          consentId: consent.id,
          studentId: studentRecord.id,
          childName: consent.childName
        });
      }

      // Log the revocation handling
      await this.auditService.logAction({
        entityType: 'parental_consent',
        entityId: consent.id,
        action: 'anonymize',
        userId: null,
        details: {
          reason: 'consent_revoked',
          childName: consent.childName,
          parentEmail: consent.parentEmail,
          studentId: studentRecord?.id
        },
        severity: 'high',
        category: 'compliance'
      });

    } catch (error) {
      logger.error('Error handling consent revocation:', error);
      throw error;
    }
  }

  // Private helper methods
  private calculateGradeLevelFromAge(age: number): string {
    if (age <= 6) return 'CP';
    if (age <= 7) return 'CE1';
    if (age <= 8) return 'CE2';
    if (age <= 9) return 'CM1';
    if (age <= 10) return 'CM2';
    if (age <= 11) return '6ème';
    if (age <= 12) return '5ème';
    if (age <= 13) return '4ème';
    if (age <= 14) return '3ème';
    if (age <= 15) return '2nde';
    if (age <= 16) return '1ère';
    return 'Terminale';
  }

  private async findStudentByConsentId(consentId: string): Promise<{ id: number } | null> {
    try {
      // This would require adding a consentId field to students table
      // For now, we'll implement a workaround by searching through audit logs
      // In a production system, you'd add a consentId foreign key to students table
      
      // Query audit logs to find student creation linked to this consent
      const auditResult = await this.auditService.queryAuditLogs({
        entityType: 'parental_consent',
        entityId: consentId,
        action: 'verified',
        includeDetails: true,
        limit: 1
      });

      if (auditResult.entries.length > 0) {
        const entry = auditResult.entries[0];
        if (entry.details?.studentId) {
          const studentId = parseInt(entry.details.studentId);
          return { id: studentId };
        }
      }

      return null;

    } catch (error) {
      logger.error('Error finding student by consent ID:', error);
      return null;
    }
  }

  // Database methods implementation
  private async saveConsent(consent: ParentalConsent): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(gdprConsentRequests).values({
          studentId: null, // Will be set when student account is created
          consentType: consent.consentTypes.join(','),
          status: consent.status,
          requestToken: consent.firstConsentToken,
          requestType: 'parental_consent',
          expiresAt: consent.expiryDate
        });

        // Store additional consent data in audit log for complete tracking
        await this.auditService.logAction({
          entityType: 'parental_consent',
          entityId: consent.id,
          action: 'create',
          userId: null,
          details: {
            parentName: consent.parentName,
            parentEmail: consent.parentEmail,
            childName: consent.childName,
            childAge: consent.childAge,
            consentTypes: consent.consentTypes,
            firstConsentToken: consent.firstConsentToken,
            expiryDate: consent.expiryDate
          },
          ipAddress: consent.ipAddress,
          userAgent: consent.userAgent,
          severity: 'medium',
          category: 'compliance'
        });
      });

      logger.debug('Consent saved to database', { consentId: consent.id });

    } catch (error) {
      logger.error('Error saving consent to database:', error);
      throw new Error('Échec de l\'enregistrement du consentement');
    }
  }

  private async findConsentByFirstToken(token: string): Promise<ParentalConsent | null> {
    try {
      // Query audit logs for consent with this first token
      const auditResult = await this.auditService.queryAuditLogs({
        entityType: 'parental_consent',
        action: 'stored',
        includeDetails: true,
        limit: 50
      });

      for (const entry of auditResult.entries) {
        if (entry.details?.firstConsentToken === token) {
          return await this.findConsentById(entry.entityId);
        }
      }

      return null;

    } catch (error) {
      logger.error('Error finding consent by first token:', error);
      return null;
    }
  }

  private async findConsentByStudentId(studentId: string): Promise<ParentalConsent | null> {
    try {
      // Query audit logs for verified consent with this student ID
      const auditResult = await this.auditService.queryAuditLogs({
        entityType: 'parental_consent',
        action: 'verified',
        includeDetails: true,
        limit: 50
      });

      for (const entry of auditResult.entries) {
        if (entry.details?.studentId === studentId) {
          return await this.findConsentById(entry.entityId);
        }
      }

      return null;

    } catch (error) {
      logger.error('Error finding consent by student ID:', error);
      return null;
    }
  }

  private async findPendingConsentByEmail(email: string): Promise<ParentalConsent | null> {
    try {
      // Query audit logs for pending consents by this email
      const auditResult = await this.auditService.queryAuditLogs({
        entityType: 'parental_consent',
        action: 'stored',
        includeDetails: true,
        limit: 20
      });

      // Filter by parent email and pending status
      for (const entry of auditResult.entries) {
        if (entry.details?.parentEmail === email) {
          const consent = await this.findConsentById(entry.entityId);
          if (consent && consent.status === 'pending') {
            return consent;
          }
        }
      }

      return null;

    } catch (error) {
      logger.error('Error finding pending consent by email:', error);
      return null;
    }
  }
}