import crypto from 'crypto';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { AuditTrailService } from './audit-trail.service';
import { config, gdprConfig } from '../config/config';

// Validation schemas
const EncryptionDataSchema = z.object({
  data: z.any(),
  keyId: z.string().optional(),
  algorithm: z.enum(['aes-256-gcm', 'aes-192-gcm', 'aes-128-gcm']).default('aes-256-gcm')
});

const KeyRotationConfigSchema = z.object({
  rotationIntervalDays: z.number().min(1).max(365).default(gdprConfig.encryptionKeyRotationDays),
  keyRetentionDays: z.number().min(1).max(730).default(gdprConfig.dataRetentionDays),
  autoRotation: z.boolean().default(true)
});

export interface EncryptionKey {
  id: string;
  key: Buffer;
  algorithm: string;
  version: number;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'rotation_pending' | 'deprecated' | 'revoked';
  usage: 'student_data' | 'sensitive_fields' | 'audit_logs' | 'exports';
}

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
  keyId: string;
  algorithm: string;
  version: number;
}

export interface KeyRotationEvent {
  id: string;
  oldKeyId: string;
  newKeyId: string;
  rotationType: 'scheduled' | 'manual' | 'emergency';
  reason: string;
  affectedRecords: number;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  errors?: string[];
}

export class EncryptionService {
  private keys: Map<string, EncryptionKey> = new Map();
  private activeKeyIds: Map<string, string> = new Map(); // usage -> keyId
  private auditService: AuditTrailService;
  private rotationConfig: z.infer<typeof KeyRotationConfigSchema>;

  constructor(rotationConfig?: Partial<z.infer<typeof KeyRotationConfigSchema>>) {
    this.auditService = new AuditTrailService();
    
    // Utiliser la configuration GDPR par défaut depuis config.ts
    const defaultConfig = {
      rotationIntervalDays: gdprConfig.encryptionKeyRotationDays,
      keyRetentionDays: gdprConfig.dataRetentionDays,
      autoRotation: true
    };
    
    this.rotationConfig = KeyRotationConfigSchema.parse({
      ...defaultConfig,
      ...rotationConfig
    });
    
    this.initializeEncryptionKeys();
    
    if (gdprConfig.enabled) {
      this.scheduleKeyRotation();
      logger.info('✅ Encryption service initialized with GDPR configuration');
    }
  }

  /**
   * Encrypt sensitive student data
   */
  async encryptStudentData(
    data: any,
    usage: EncryptionKey['usage'] = 'student_data'
  ): Promise<EncryptedData> {
    try {
      const validatedInput = EncryptionDataSchema.parse({ data });
      
      // Get active encryption key for this usage
      const key = await this.getActiveKey(usage);
      if (!key) {
        throw new Error(`No active encryption key found for usage: ${usage}`);
      }

      // Serialize data
      const serializedData = JSON.stringify(validatedInput.data);
      
      // Generate random IV
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipher(key.algorithm, key.key);
      cipher.setAAD(Buffer.from(key.id)); // Additional authenticated data
      
      // Encrypt data
      let encrypted = cipher.update(serializedData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();

      const encryptedResult: EncryptedData = {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        keyId: key.id,
        algorithm: key.algorithm,
        version: key.version
      };

      // Log encryption event
      await this.auditService.logAction({
        entityType: 'encryption',
        entityId: key.id,
        action: 'encrypt',
        userId: null,
        details: {
          usage,
          keyId: key.id,
          algorithm: key.algorithm,
          dataSize: serializedData.length
        },
        ipAddress: '',
        userAgent: ''
      });

      logger.debug('Data encrypted successfully', { 
        keyId: key.id, 
        usage, 
        dataSize: serializedData.length 
      });

      return encryptedResult;

    } catch (error) {
      logger.error('Error encrypting data:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt student data
   */
  async decryptStudentData(encryptedData: EncryptedData): Promise<any> {
    try {
      // Get encryption key by ID
      const key = this.keys.get(encryptedData.keyId);
      if (!key) {
        throw new Error(`Encryption key not found: ${encryptedData.keyId}`);
      }

      if (key.status === 'revoked') {
        throw new Error(`Cannot decrypt with revoked key: ${encryptedData.keyId}`);
      }

      // Create decipher
      const decipher = crypto.createDecipher(encryptedData.algorithm, key.key);
      decipher.setAAD(Buffer.from(encryptedData.keyId));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      // Decrypt data
      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // Parse and return original data
      const originalData = JSON.parse(decrypted);

      // Log decryption event
      await this.auditService.logAction({
        entityType: 'encryption',
        entityId: key.id,
        action: 'decrypt',
        userId: null,
        details: {
          keyId: key.id,
          algorithm: encryptedData.algorithm,
          dataSize: decrypted.length
        },
        ipAddress: '',
        userAgent: ''
      });

      logger.debug('Data decrypted successfully', { 
        keyId: key.id, 
        dataSize: decrypted.length 
      });

      return originalData;

    } catch (error) {
      logger.error('Error decrypting data:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt specific sensitive fields
   */
  async encryptSensitiveFields(record: Record<string, any>, sensitiveFields: string[]): Promise<Record<string, any>> {
    const encryptedRecord = { ...record };
    
    for (const field of sensitiveFields) {
      if (record[field] !== undefined && record[field] !== null) {
        const encryptedField = await this.encryptStudentData(
          record[field], 
          'sensitive_fields'
        );
        encryptedRecord[`${field}_encrypted`] = encryptedField;
        delete encryptedRecord[field]; // Remove plain text
      }
    }

    return encryptedRecord;
  }

  /**
   * Decrypt specific sensitive fields
   */
  async decryptSensitiveFields(record: Record<string, any>, sensitiveFields: string[]): Promise<Record<string, any>> {
    const decryptedRecord = { ...record };
    
    for (const field of sensitiveFields) {
      const encryptedFieldName = `${field}_encrypted`;
      if (record[encryptedFieldName]) {
        try {
          const decryptedValue = await this.decryptStudentData(record[encryptedFieldName]);
          decryptedRecord[field] = decryptedValue;
          delete decryptedRecord[encryptedFieldName]; // Remove encrypted version
        } catch (error) {
          logger.warn(`Failed to decrypt field ${field}:`, error);
          // Keep encrypted field for manual recovery if needed
        }
      }
    }

    return decryptedRecord;
  }

  /**
   * Rotate encryption keys (manual trigger)
   */
  async rotateKeys(usage: EncryptionKey['usage'], reason: string = 'Manual rotation'): Promise<KeyRotationEvent> {
    try {
      const rotationId = crypto.randomUUID();
      const currentKey = await this.getActiveKey(usage);
      
      if (!currentKey) {
        throw new Error(`No active key found for usage: ${usage}`);
      }

      // Create rotation event
      const rotationEvent: KeyRotationEvent = {
        id: rotationId,
        oldKeyId: currentKey.id,
        newKeyId: '', // Will be set after new key creation
        rotationType: 'manual',
        reason,
        affectedRecords: 0,
        startTime: new Date(),
        status: 'pending'
      };

      logger.info(`Starting key rotation for usage: ${usage}`, { 
        rotationId, 
        oldKeyId: currentKey.id 
      });

      // Generate new encryption key
      const newKey = await this.generateNewKey(usage);
      rotationEvent.newKeyId = newKey.id;
      rotationEvent.status = 'in_progress';

      // Mark old key as deprecated
      currentKey.status = 'deprecated';
      await this.updateKey(currentKey);

      // Set new key as active
      this.activeKeyIds.set(usage, newKey.id);
      
      // Re-encrypt existing data with new key (background process)
      const affectedRecords = await this.reencryptExistingData(usage, currentKey.id, newKey.id);
      rotationEvent.affectedRecords = affectedRecords;

      // Complete rotation
      rotationEvent.status = 'completed';
      rotationEvent.endTime = new Date();

      // Log rotation event
      await this.auditService.logAction({
        entityType: 'key_rotation',
        entityId: rotationId,
        action: 'completed',
        userId: null,
        details: {
          usage,
          oldKeyId: currentKey.id,
          newKeyId: newKey.id,
          reason,
          affectedRecords,
          duration: rotationEvent.endTime.getTime() - rotationEvent.startTime.getTime()
        },
        ipAddress: '',
        userAgent: ''
      });

      logger.info(`Key rotation completed successfully`, { 
        rotationId, 
        usage, 
        affectedRecords 
      });

      return rotationEvent;

    } catch (error) {
      logger.error('Error during key rotation:', error);
      throw new Error('Key rotation failed');
    }
  }

  /**
   * Emergency key revocation
   */
  async emergencyKeyRevocation(keyId: string, reason: string): Promise<void> {
    try {
      const key = this.keys.get(keyId);
      if (!key) {
        throw new Error(`Key not found: ${keyId}`);
      }

      // Mark key as revoked
      key.status = 'revoked';
      await this.updateKey(key);

      // If this was an active key, generate emergency replacement
      for (const [usage, activeKeyId] of this.activeKeyIds.entries()) {
        if (activeKeyId === keyId) {
          const emergencyKey = await this.generateNewKey(key.usage);
          this.activeKeyIds.set(usage, emergencyKey.id);
          
          // Trigger emergency rotation
          await this.rotateKeys(usage, `Emergency rotation: ${reason}`);
        }
      }

      // Log emergency revocation
      await this.auditService.logAction({
        entityType: 'key_revocation',
        entityId: keyId,
        action: 'emergency_revoked',
        userId: null,
        details: {
          keyId,
          reason,
          usage: key.usage,
          revokedAt: new Date()
        },
        ipAddress: '',
        userAgent: ''
      });

      logger.warn(`Emergency key revocation completed`, { keyId, reason });

    } catch (error) {
      logger.error('Error during emergency key revocation:', error);
      throw error;
    }
  }

  /**
   * Get encryption key information (without exposing the actual key)
   */
  getKeyInfo(keyId: string): Omit<EncryptionKey, 'key'> | null {
    const key = this.keys.get(keyId);
    if (!key) return null;

    const { key: _, ...keyInfo } = key;
    return keyInfo;
  }

  /**
   * List all keys with their status
   */
  listKeys(): Array<Omit<EncryptionKey, 'key'>> {
    return Array.from(this.keys.values()).map(key => {
      const { key: _, ...keyInfo } = key;
      return keyInfo;
    });
  }

  /**
   * Cleanup expired keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    let cleanedCount = 0;
    const now = new Date();

    for (const [keyId, key] of this.keys.entries()) {
      if (key.status === 'deprecated' && now > key.expiresAt) {
        // Verify no data still uses this key before deletion
        const dataCount = await this.countDataUsingKey(keyId);
        if (dataCount === 0) {
          this.keys.delete(keyId);
          await this.deleteKeyFromStorage(keyId);
          cleanedCount++;
          
          logger.info(`Cleaned up expired key`, { keyId, usage: key.usage });
        }
      }
    }

    return cleanedCount;
  }

  // Private helper methods
  private async initializeEncryptionKeys(): Promise<void> {
    try {
      // Load existing keys from secure storage
      const storedKeys = await this.loadKeysFromStorage();
      
      if (storedKeys.length === 0) {
        // Generate initial keys for each usage type
        const usageTypes: EncryptionKey['usage'][] = [
          'student_data', 
          'sensitive_fields', 
          'audit_logs', 
          'exports'
        ];

        for (const usage of usageTypes) {
          const key = await this.generateNewKey(usage);
          this.activeKeyIds.set(usage, key.id);
        }

        logger.info('Initial encryption keys generated');
      } else {
        // Load existing keys
        for (const key of storedKeys) {
          this.keys.set(key.id, key);
          if (key.status === 'active') {
            this.activeKeyIds.set(key.usage, key.id);
          }
        }

        logger.info(`Loaded ${storedKeys.length} encryption keys from storage`);
      }

    } catch (error) {
      logger.error('Error initializing encryption keys:', error);
      throw error;
    }
  }

  private async generateNewKey(usage: EncryptionKey['usage']): Promise<EncryptionKey> {
    const keyId = crypto.randomUUID();
    const key = crypto.randomBytes(32); // 256-bit key
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.rotationConfig.keyRetentionDays * 24 * 60 * 60 * 1000);

    const encryptionKey: EncryptionKey = {
      id: keyId,
      key,
      algorithm: 'aes-256-gcm',
      version: await this.getNextKeyVersion(usage),
      createdAt: now,
      expiresAt,
      status: 'active',
      usage
    };

    this.keys.set(keyId, encryptionKey);
    await this.saveKeyToStorage(encryptionKey);

    logger.info(`Generated new encryption key`, { 
      keyId, 
      usage, 
      version: encryptionKey.version 
    });

    return encryptionKey;
  }

  private async getActiveKey(usage: EncryptionKey['usage']): Promise<EncryptionKey | null> {
    const activeKeyId = this.activeKeyIds.get(usage);
    if (!activeKeyId) return null;

    return this.keys.get(activeKeyId) || null;
  }

  private async getNextKeyVersion(usage: EncryptionKey['usage']): Promise<number> {
    let maxVersion = 0;
    for (const key of this.keys.values()) {
      if (key.usage === usage && key.version > maxVersion) {
        maxVersion = key.version;
      }
    }
    return maxVersion + 1;
  }

  private scheduleKeyRotation(): void {
    if (!this.rotationConfig.autoRotation) return;

    const intervalMs = this.rotationConfig.rotationIntervalDays * 24 * 60 * 60 * 1000;
    
    setInterval(async () => {
      try {
        for (const usage of this.activeKeyIds.keys()) {
          const key = await this.getActiveKey(usage);
          if (key && this.shouldRotateKey(key)) {
            await this.rotateKeys(usage, 'Scheduled automatic rotation');
          }
        }
      } catch (error) {
        logger.error('Error in scheduled key rotation:', error);
      }
    }, intervalMs);

    logger.info(`Scheduled automatic key rotation every ${this.rotationConfig.rotationIntervalDays} days`);
  }

  private shouldRotateKey(key: EncryptionKey): boolean {
    const rotationInterval = this.rotationConfig.rotationIntervalDays * 24 * 60 * 60 * 1000;
    const keyAge = Date.now() - key.createdAt.getTime();
    return keyAge >= rotationInterval;
  }

  private async reencryptExistingData(usage: EncryptionKey['usage'], oldKeyId: string, newKeyId: string): Promise<number> {
    // TODO: Implement re-encryption of existing data
    // This would query the database for all records encrypted with oldKeyId
    // and re-encrypt them with the new key
    logger.info(`Re-encrypting data from key ${oldKeyId} to ${newKeyId}`);
    return 0; // Placeholder
  }

  private async updateKey(key: EncryptionKey): Promise<void> {
    this.keys.set(key.id, key);
    await this.saveKeyToStorage(key);
  }

  private async countDataUsingKey(keyId: string): Promise<number> {
    // TODO: Implement database query to count records using this key
    return 0; // Placeholder
  }

  // Storage methods (implement with your secure key storage solution)
  private async loadKeysFromStorage(): Promise<EncryptionKey[]> {
    // TODO: Implement secure key storage loading (e.g., AWS KMS, HashiCorp Vault)
    return [];
  }

  private async saveKeyToStorage(key: EncryptionKey): Promise<void> {
    // TODO: Implement secure key storage saving
  }

  private async deleteKeyFromStorage(keyId: string): Promise<void> {
    // TODO: Implement secure key deletion
  }
}