import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger';
import { db } from '../db/connection';
import { files } from '../db/schema';
import { eq, and, lt, desc, sql } from 'drizzle-orm';
import { StorageStats } from '../types/upload.types';

export interface SimpleUploadedFile {
  id?: number;
  originalName?: string;
  filename: string;
  mimeType?: string;
  size?: number;
  path?: string;
  url?: string;
  thumbnailUrl?: string;
  metadata?: string;
  uploadedBy?: number;
  category?: string;
  isPublic?: boolean;
  status?: string;
  checksum?: string;
}

export class StorageService {
  private uploadPath: string;
  private maxStorageSize: number;

  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || path.resolve(process.cwd(), 'uploads');
    this.maxStorageSize = parseInt(process.env.MAX_STORAGE_SIZE || '10737418240'); // 10GB default
  }

  /**
   * Save file metadata to database
   */
  async saveFileMetadata(file: SimpleUploadedFile): Promise<void> {
    try {
      await db.insert(files).values({
        originalName: file.originalName,
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.size,
        path: file.path,
        url: file.url,
        thumbnailUrl: file.thumbnailUrl,
        metadata: file.metadata,
        uploadedBy: file.uploadedBy,
        category: file.category,
        isPublic: file.isPublic,
        status: file.status || 'ready',
        checksum: file.checksum,
      });

      logger.info('File metadata saved to database', { filename: file.filename });
    } catch (error) {
      logger.error('Error saving file metadata:', { filename: file.filename, error: error.message });
      throw new Error(`Failed to save file metadata: ${error.message}`);
    }
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string | number): Promise<SimpleUploadedFile | null> {
    try {
      const numericId = typeof fileId === 'string' ? parseInt(fileId, 10) : fileId;
      
      const fileData = await db
        .select()
        .from(files)
        .where(eq(files.id, numericId))
        .limit(1);

      if (fileData.length === 0) {
        return null;
      }

      const file = fileData[0];
      return {
        id: file.id,
        originalName: file.originalName,
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.size,
        path: file.path,
        url: file.url,
        thumbnailUrl: file.thumbnailUrl,
        metadata: file.metadata,
        uploadedBy: file.uploadedBy,
        category: file.category,
        isPublic: file.isPublic,
        status: file.status,
        checksum: file.checksum,
      };
    } catch (error) {
      logger.error('Error getting file by ID:', { fileId, error: error.message });
      return null;
    }
  }

  /**
   * Get files by user
   */
  async getFilesByUser(
    userId: string | number,
    options: {
      category?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ files: SimpleUploadedFile[]; total: number }> {
    try {
      const { category, limit = 20, offset = 0 } = options;
      const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

      let whereConditions = eq(files.uploadedBy, numericUserId);
      
      if (category) {
        whereConditions = and(whereConditions, eq(files.category, category));
      }

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(files)
        .where(whereConditions);

      const total = countResult[0]?.count || 0;

      // Get files
      const fileData = await db
        .select()
        .from(files)
        .where(whereConditions)
        .orderBy(desc(files.uploadedAt))
        .limit(limit)
        .offset(offset);

      const filesList: SimpleUploadedFile[] = fileData.map(file => ({
        id: file.id,
        originalName: file.originalName,
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.size,
        path: file.path,
        url: file.url,
        thumbnailUrl: file.thumbnailUrl,
        metadata: file.metadata,
        uploadedBy: file.uploadedBy,
        category: file.category,
        isPublic: file.isPublic,
        status: file.status,
        checksum: file.checksum,
      }));

      return { files: filesList, total };
    } catch (error) {
      logger.error('Error getting files by user:', { userId, error: error.message });
      throw new Error(`Failed to get user files: ${error.message}`);
    }
  }

  /**
   * Delete file by ID
   */
  async deleteFile(fileId: string | number): Promise<boolean> {
    try {
      const numericId = typeof fileId === 'string' ? parseInt(fileId, 10) : fileId;
      
      // Get file info first
      const file = await this.getFileById(numericId);
      if (!file) {
        return false;
      }

      // Delete from database
      await db.delete(files).where(eq(files.id, numericId));
      
      // Delete physical file if exists
      if (file.path && await fs.pathExists(file.path)) {
        await fs.remove(file.path);
      }

      logger.info('File deleted successfully', { fileId: numericId });
      return true;
    } catch (error) {
      logger.error('Error deleting file:', { fileId, error: error.message });
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const result = await db
        .select({
          count: sql<number>`count(*)`,
          totalSize: sql<number>`sum(${files.size})`
        })
        .from(files);

      const stats = result[0];
      const totalFiles = stats?.count || 0;
      const totalSize = stats?.totalSize || 0;
      const totalSizeMB = Math.round(totalSize / (1024 * 1024));

      return { 
        totalFiles, 
        totalSize,
        categorySizes: { image: 0, video: 0, audio: 0, document: 0, presentation: 0, exercise: 0, curriculum: 0, assessment: 0, resource: 0 },
        recentUploads: [],
        storageUsage: { used: totalSize, available: this.maxStorageSize - totalSize, percentage: (totalSize / this.maxStorageSize) * 100 }
      };
    } catch (error) {
      logger.error('Error getting storage stats:', { error: error.message });
      return { 
        totalFiles: 0, 
        totalSize: 0,
        categorySizes: { image: 0, video: 0, audio: 0, document: 0, presentation: 0, exercise: 0, curriculum: 0, assessment: 0, resource: 0 },
        recentUploads: [],
        storageUsage: { used: 0, available: this.maxStorageSize, percentage: 0 }
      };
    }
  }

  /**
   * Find file by checksum
   */
  async findFileByChecksum(checksum: string): Promise<SimpleUploadedFile | null> {
    try {
      const [file] = await db
        .select()
        .from(files)
        .where(eq(files.checksum, checksum))
        .limit(1);

      if (!file) return null;

      return {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        path: file.path,
        checksum: file.checksum,
        category: file.category
      };
    } catch (error) {
      logger.error('Error finding file by checksum:', { error: error.message, checksum });
      return null;
    }
  }

  /**
   * Mark file as deleted
   */
  async markFileAsDeleted(fileId: number): Promise<boolean> {
    try {
      await db
        .update(files)
        .set({ status: 'deleted' })
        .where(eq(files.id, fileId));
      
      return true;
    } catch (error) {
      logger.error('Error marking file as deleted:', { error: error.message, fileId });
      return false;
    }
  }

  /**
   * Cleanup expired files
   */
  async cleanupExpiredFiles(): Promise<number> {
    try {
      const expiredFiles = await db
        .select()
        .from(files)
        .where(and(
          eq(files.status, 'expired'),
          lt(files.uploadedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // 24 hours ago
        ));

      let cleanedCount = 0;
      for (const file of expiredFiles) {
        const success = await this.deleteFile(file.id);
        if (success) cleanedCount++;
      }

      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up expired files:', { error: error.message });
      return 0;
    }
  }

  /**
   * Cleanup old files
   */
  async cleanupOldFiles(maxAgeInDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);

      const oldFiles = await db
        .select()
        .from(files)
        .where(lt(files.uploadedAt, cutoffDate));

      let deletedCount = 0;

      for (const file of oldFiles) {
        const success = await this.deleteFile(file.id);
        if (success) {
          deletedCount++;
        }
      }

      logger.info('Old files cleanup completed', { deletedCount, maxAgeInDays });
      return deletedCount;
    } catch (error) {
      logger.error('Error during file cleanup:', { error: error.message });
      return 0;
    }
  }

  /**
   * Get storage health information
   */
  async getStorageHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
    diskUsage: {
      total: number;
      used: number;
      available: number;
      percentage: number;
    };
  }> {
    try {
      const stats = await this.getStorageStats();
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      // Check disk usage
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      
      if (stats.storageUsage.percentage > 90) {
        status = 'critical';
        issues.push('Storage usage is critical (>90%)');
        recommendations.push('Immediately cleanup old files or increase storage capacity');
      } else if (stats.storageUsage.percentage > 75) {
        status = 'warning';
        issues.push('Storage usage is high (>75%)');
        recommendations.push('Consider cleaning up old files or increasing storage capacity');
      }

      // Check for failed uploads
      const [failedUploads] = await db
        .select({ count: sql<number>`count(*)` })
        .from(files)
        .where(eq(files.status, 'failed'));

      if (failedUploads.count > 10) {
        issues.push(`${failedUploads.count} failed uploads detected`);
        recommendations.push('Investigate and cleanup failed uploads');
      }

      // Check for quarantined files
      const [quarantinedFiles] = await db
        .select({ count: sql<number>`count(*)` })
        .from(files)
        .where(eq(files.status, 'quarantined'));

      if (quarantinedFiles.count > 0) {
        issues.push(`${quarantinedFiles.count} quarantined files detected`);
        recommendations.push('Review and handle quarantined files');
      }

      return {
        status,
        issues,
        recommendations,
        diskUsage: {
          total: this.maxStorageSize,
          used: stats.storageUsage.used,
          available: stats.storageUsage.available,
          percentage: stats.storageUsage.percentage
        }
      };
    } catch (error) {
      logger.error('Error getting storage health:', error);
      return {
        status: 'critical',
        issues: ['Unable to assess storage health'],
        recommendations: ['Check storage service configuration'],
        diskUsage: {
          total: 0,
          used: 0,
          available: 0,
          percentage: 0
        }
      };
    }
  }
}