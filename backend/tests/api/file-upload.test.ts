import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { build } from '../../src/app';
import { createTestDatabase, cleanupTestDatabase } from '../helpers/database';
import { createReadStream } from 'fs';
import { join } from 'path';
import FormData from 'form-data';

describe('File Upload API Endpoints', () => {
  let app: FastifyInstance;
  let testDb: any;
  let authToken: string;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    app = await build();
    await app.ready();

    // Create test user and get auth token
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        prenom: 'Test',
        nom: 'Uploader',
        email: 'uploader@example.com',
        password: 'SecurePass123!',
        dateNaissance: '2015-06-15',
        niveauScolaire: 'CP'
      }
    });

    const { token } = JSON.parse(registerResponse.payload).data;
    authToken = token;
  });

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
    await app.close();
  });

  describe('POST /files/upload', () => {
    it('should upload image file successfully', async () => {
      const form = new FormData();
      form.append('file', createReadStream(join(__dirname, '../fixtures/test-image.jpg')), {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      });
      form.append('category', 'image');
      form.append('isPublic', 'false');

      const response = await app.inject({
        method: 'POST',
        url: '/files/upload',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        },
        payload: form
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.file).toHaveProperty('id');
      expect(data.data.file.filename).toBe('test-image.jpg');
      expect(data.data.file.mimeType).toBe('image/jpeg');
      expect(data.data.file.category).toBe('image');
      expect(data.data.file.isPublic).toBe(false);
    });

    it('should upload document file successfully', async () => {
      const form = new FormData();
      form.append('file', createReadStream(join(__dirname, '../fixtures/test-document.pdf')), {
        filename: 'test-document.pdf',
        contentType: 'application/pdf'
      });
      form.append('category', 'document');
      form.append('isPublic', 'true');

      const response = await app.inject({
        method: 'POST',
        url: '/files/upload',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        },
        payload: form
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.file.mimeType).toBe('application/pdf');
      expect(data.data.file.category).toBe('document');
      expect(data.data.file.isPublic).toBe(true);
    });

    it('should upload audio file successfully', async () => {
      const form = new FormData();
      form.append('file', createReadStream(join(__dirname, '../fixtures/test-audio.mp3')), {
        filename: 'test-audio.mp3',
        contentType: 'audio/mpeg'
      });
      form.append('category', 'audio');

      const response = await app.inject({
        method: 'POST',
        url: '/files/upload',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        },
        payload: form
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.file.mimeType).toBe('audio/mpeg');
      expect(data.data.file.category).toBe('audio');
    });

    it('should upload video file successfully', async () => {
      const form = new FormData();
      form.append('file', createReadStream(join(__dirname, '../fixtures/test-video.mp4')), {
        filename: 'test-video.mp4',
        contentType: 'video/mp4'
      });
      form.append('category', 'video');

      const response = await app.inject({
        method: 'POST',
        url: '/files/upload',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        },
        payload: form
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.file.mimeType).toBe('video/mp4');
      expect(data.data.file.category).toBe('video');
    });

    it('should reject unauthorized upload', async () => {
      const form = new FormData();
      form.append('file', createReadStream(join(__dirname, '../fixtures/test-image.jpg')), {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      });

      const response = await app.inject({
        method: 'POST',
        url: '/files/upload',
        headers: {
          ...form.getHeaders()
        },
        payload: form
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject file with invalid MIME type', async () => {
      const form = new FormData();
      form.append('file', createReadStream(join(__dirname, '../fixtures/test-executable.exe')), {
        filename: 'test-executable.exe',
        contentType: 'application/x-executable'
      });

      const response = await app.inject({
        method: 'POST',
        url: '/files/upload',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        },
        payload: form
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('should reject file exceeding size limit', async () => {
      const form = new FormData();
      // Create a large file buffer (simulating large file)
      const largeBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB
      form.append('file', largeBuffer, {
        filename: 'large-file.jpg',
        contentType: 'image/jpeg'
      });

      const response = await app.inject({
        method: 'POST',
        url: '/files/upload',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        },
        payload: form
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FILE_TOO_LARGE');
    });

    it('should handle multiple file uploads', async () => {
      const form = new FormData();
      form.append('files', createReadStream(join(__dirname, '../fixtures/test-image.jpg')), {
        filename: 'test-image-1.jpg',
        contentType: 'image/jpeg'
      });
      form.append('files', createReadStream(join(__dirname, '../fixtures/test-image-2.jpg')), {
        filename: 'test-image-2.jpg',
        contentType: 'image/jpeg'
      });
      form.append('category', 'image');

      const response = await app.inject({
        method: 'POST',
        url: '/files/upload-multiple',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        },
        payload: form
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.files).toHaveLength(2);
      expect(data.data.files[0].filename).toBe('test-image-1.jpg');
      expect(data.data.files[1].filename).toBe('test-image-2.jpg');
    });
  });

  describe('GET /files/:id', () => {
    let uploadedFileId: string;

    beforeAll(async () => {
      // Upload a test file to get its ID
      const form = new FormData();
      form.append('file', createReadStream(join(__dirname, '../fixtures/test-image.jpg')), {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      });

      const response = await app.inject({
        method: 'POST',
        url: '/files/upload',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        },
        payload: form
      });

      const data = JSON.parse(response.payload);
      uploadedFileId = data.data.file.id;
    });

    it('should retrieve file metadata', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/files/${uploadedFileId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.file.id).toBe(uploadedFileId);
      expect(data.data.file.filename).toBe('test-image.jpg');
    });

    it('should reject access to private file by other user', async () => {
      // Create another user
      const otherUserResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          prenom: 'Other',
          nom: 'User',
          email: 'other@example.com',
          password: 'SecurePass123!',
          dateNaissance: '2015-06-15',
          niveauScolaire: 'CP'
        }
      });

      const { token: otherToken } = JSON.parse(otherUserResponse.payload).data;

      const response = await app.inject({
        method: 'GET',
        url: `/files/${uploadedFileId}`,
        headers: {
          'Authorization': `Bearer ${otherToken}`
        }
      });

      expect(response.statusCode).toBe(403);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('ACCESS_DENIED');
    });
  });

  describe('GET /files/:id/download', () => {
    let uploadedFileId: string;

    beforeAll(async () => {
      // Upload a test file to get its ID
      const form = new FormData();
      form.append('file', createReadStream(join(__dirname, '../fixtures/test-image.jpg')), {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      });

      const response = await app.inject({
        method: 'POST',
        url: '/files/upload',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        },
        payload: form
      });

      const data = JSON.parse(response.payload);
      uploadedFileId = data.data.file.id;
    });

    it('should download file successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/files/${uploadedFileId}/download`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('test-image.jpg');
    });

    it('should generate thumbnail for image files', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/files/${uploadedFileId}/thumbnail`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['content-disposition']).toContain('inline');
    });
  });

  describe('DELETE /files/:id', () => {
    let uploadedFileId: string;

    beforeAll(async () => {
      // Upload a test file to get its ID
      const form = new FormData();
      form.append('file', createReadStream(join(__dirname, '../fixtures/test-image.jpg')), {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      });

      const response = await app.inject({
        method: 'POST',
        url: '/files/upload',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        },
        payload: form
      });

      const data = JSON.parse(response.payload);
      uploadedFileId = data.data.file.id;
    });

    it('should delete file successfully', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/files/${uploadedFileId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted successfully');
    });

    it('should reject deletion of non-existent file', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/files/999999',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FILE_NOT_FOUND');
    });
  });

  describe('GET /files', () => {
    beforeAll(async () => {
      // Upload multiple test files
      const categories = ['image', 'document', 'audio', 'video'];
      
      for (const category of categories) {
        const form = new FormData();
        form.append('file', createReadStream(join(__dirname, `../fixtures/test-${category}.jpg`)), {
          filename: `test-${category}.jpg`,
          contentType: 'image/jpeg'
        });
        form.append('category', category);

        await app.inject({
          method: 'POST',
          url: '/files/upload',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            ...form.getHeaders()
          },
          payload: form
        });
      }
    });

    it('should list user files with pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/files?page=1&limit=10',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.files).toBeInstanceOf(Array);
      expect(data.data.pagination).toHaveProperty('page');
      expect(data.data.pagination).toHaveProperty('limit');
      expect(data.data.pagination).toHaveProperty('total');
    });

    it('should filter files by category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/files?category=image',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.files.every((file: any) => file.category === 'image')).toBe(true);
    });

    it('should search files by filename', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/files?search=test-image',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.files.every((file: any) => file.filename.includes('test-image'))).toBe(true);
    });
  });
});
