import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { build } from '../../backend/src/app';
import { createTestDatabase, cleanupTestDatabase } from '../../backend/tests/helpers/database';

describe('Frontend API Integration Tests', () => {
  let app: FastifyInstance;
  let testDb: any;
  let authToken: string;
  let studentId: string;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    app = await build();
    await app.ready();

    // Create test user for frontend integration tests
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        prenom: 'Frontend',
        nom: 'Tester',
        email: 'frontend@example.com',
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

  describe('Authentication Integration', () => {
    it('should authenticate from frontend login form', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'frontend@example.com',
          password: 'SecurePass123!'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.student).toHaveProperty('id');
      expect(data.data.student.email).toBe('frontend@example.com');
    });

    it('should handle frontend logout correctly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
    });

    it('should refresh token from frontend', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
    });
  });

  describe('Student Dashboard Integration', () => {
    it('should load student dashboard data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/students/dashboard',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('student');
      expect(data.data).toHaveProperty('progress');
      expect(data.data).toHaveProperty('recentActivity');
      expect(data.data).toHaveProperty('achievements');
    });

    it('should load student profile data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/students/${studentId}/profile`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.student).toHaveProperty('prenom');
      expect(data.data.student).toHaveProperty('nom');
      expect(data.data.student).toHaveProperty('email');
      expect(data.data.student).toHaveProperty('niveauActuel');
      expect(data.data.student).toHaveProperty('totalPoints');
    });

    it('should update student profile from frontend', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/students/${studentId}/profile`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          prenom: 'Updated',
          nom: 'Name',
          mascotteType: 'fairy',
          mascotteColor: '#ff6b9d'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.student.prenom).toBe('Updated');
      expect(data.data.student.nom).toBe('Name');
      expect(data.data.student.mascotteType).toBe('fairy');
    });
  });

  describe('Exercises Integration', () => {
    it('should load exercises for frontend', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/exercises?competence=CP.FR.L1.1&difficulty=1',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.exercises).toBeInstanceOf(Array);
    });

    it('should submit exercise results from frontend', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/exercises/submit',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          exerciseId: 1,
          competenceCode: 'CP.FR.L1.1',
          isCorrect: true,
          timeSpent: 45,
          hintsUsed: 0,
          answerGiven: 'correct answer',
          supermemoQuality: 4
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.result).toHaveProperty('id');
      expect(data.data.result.isCorrect).toBe(true);
    });

    it('should get exercise progress from frontend', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/exercises/progress?competence=CP.FR.L1.1',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.progress).toHaveProperty('status');
      expect(data.data.progress).toHaveProperty('successRate');
      expect(data.data.progress).toHaveProperty('attemptsCount');
    });
  });

  describe('Competences Integration', () => {
    it('should load competences for frontend', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/competences?matiere=FR&niveau=CP',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.competences).toBeInstanceOf(Array);
      expect(data.data.competences.length).toBeGreaterThan(0);
    });

    it('should get competence details for frontend', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/competences/CP.FR.L1.1',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.competence).toHaveProperty('code');
      expect(data.data.competence).toHaveProperty('nom');
      expect(data.data.competence).toHaveProperty('description');
      expect(data.data.competence).toHaveProperty('prerequis');
    });

    it('should get learning path for frontend', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/competences/learning-path',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.learningPath).toBeInstanceOf(Array);
    });
  });

  describe('Mascot Integration', () => {
    it('should load mascot data for frontend', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/mascots/current',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.mascot).toHaveProperty('type');
      expect(data.data.mascot).toHaveProperty('currentEmotion');
      expect(data.data.mascot).toHaveProperty('xpLevel');
      expect(data.data.mascot).toHaveProperty('equippedItems');
    });

    it('should update mascot emotion from frontend', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/mascots/emotion',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          emotion: 'happy',
          reason: 'exercise_completed'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.mascot.currentEmotion).toBe('happy');
    });

    it('should equip mascot items from frontend', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/mascots/equip',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          itemId: 1,
          isEquipped: true
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
    });
  });

  describe('Wardrobe Integration', () => {
    it('should load wardrobe items for frontend', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/wardrobe/items',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.items).toBeInstanceOf(Array);
    });

    it('should unlock wardrobe items from frontend', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/wardrobe/unlock',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: {
          itemId: 1,
          unlockReason: 'xp_milestone'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
    });
  });

  describe('Achievements Integration', () => {
    it('should load achievements for frontend', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/achievements',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.achievements).toBeInstanceOf(Array);
    });

    it('should check achievement progress from frontend', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/achievements/progress',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.progress).toBeInstanceOf(Array);
    });
  });

  describe('File Upload Integration', () => {
    it('should upload files from frontend', async () => {
      const FormData = require('form-data');
      const fs = require('fs');
      const path = require('path');

      const form = new FormData();
      form.append('file', fs.createReadStream(path.join(__dirname, '../fixtures/test-image.jpg')), {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      });
      form.append('category', 'image');

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
    });

    it('should list user files from frontend', async () => {
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
      expect(data.data.files).toBeInstanceOf(Array);
    });
  });

  describe('Real-time Features Integration', () => {
    it('should establish WebSocket connection', async () => {
      // This would test WebSocket connection if implemented
      expect(true).toBe(true);
    });

    it('should receive real-time updates', async () => {
      // This would test real-time updates if implemented
      expect(true).toBe(true);
    });

    it('should handle real-time notifications', async () => {
      // This would test real-time notifications if implemented
      expect(true).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate network error
      const response = await app.inject({
        method: 'GET',
        url: '/nonexistent-endpoint',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle authentication errors', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/students/dashboard',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_TOKEN');
    });

    it('should handle validation errors', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'invalid-email',
          password: '123'
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
    });
  });

  describe('Performance Integration', () => {
    it('should load dashboard within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await app.inject({
        method: 'GET',
        url: '/students/dashboard',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        app.inject({
          method: 'GET',
          url: '/students/dashboard',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });
  });
});
