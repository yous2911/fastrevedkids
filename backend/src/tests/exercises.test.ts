import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { build } from '../app-test';
import { FastifyInstance } from 'fastify';

describe('Exercise Routes', () => {
  let app: FastifyInstance;
  let authToken: string;

  beforeEach(async () => {
    app = await build();
    
    // Login as admin
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { prenom: 'Admin', nom: 'User' }
    });
    
    authToken = JSON.parse(loginResponse.body).data.token;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/exercises/modules', () => {
    it('should create module with competence mapping', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/exercises/modules',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          titre: 'Test Module CP',
          description: 'Module de test pour CP',
          niveau: 'CP',
          matiere: 'FRANCAIS',
          periode: 'P1',
          competenceCode: 'CP.FR.L1.1'
        }
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.titre).toBe('Test Module CP');
    });
  });

  describe('POST /api/exercises/bulk-generate', () => {
    it('should generate multiple exercises from competence codes', async () => {
      // First create a module
      const moduleResponse = await app.inject({
        method: 'POST',
        url: '/api/exercises/modules',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          titre: 'Module Test',
          description: 'Test module',
          niveau: 'CP',
          matiere: 'FRANCAIS',
          periode: 'P1'
        }
      });
      
      const moduleId = JSON.parse(moduleResponse.body).data.id;

      const response = await app.inject({
        method: 'POST',
        url: '/api/exercises/bulk-generate',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          competenceCodes: ['CP.FR.L1.1', 'CP.FR.L1.2'],
          moduleId,
          baseConfiguration: { audioRequired: true },
          generateVariations: true
        }
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.created).toBeGreaterThan(0);
    });
  });

  describe('GET /api/exercises/by-competence/:code', () => {
    it('should get exercises filtered by competence code', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/exercises/by-competence/CP.FR.L1.1?limit=5'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.exercises)).toBe(true);
    });
  });

  describe('POST /api/exercises', () => {
    it('should create exercise with CP 2025 competence mapping', async () => {
      // First create a module
      const moduleResponse = await app.inject({
        method: 'POST',
        url: '/api/exercises/modules',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          titre: 'Module Test',
          description: 'Test module',
          niveau: 'CP',
          matiere: 'FRANCAIS',
          periode: 'P1'
        }
      });
      
      const moduleId = JSON.parse(moduleResponse.body).data.id;

      const response = await app.inject({
        method: 'POST',
        url: '/api/exercises',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          titre: 'Test Exercise',
          consigne: 'Test instruction',
          type: 'QCM',
          difficulte: 'decouverte',
          moduleId,
          competenceCode: 'CP.FR.L1.1',
          configuration: {
            question: 'Test question?',
            choix: ['A', 'B', 'C'],
            bonneReponse: 'A'
          }
        }
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.titre).toBe('Test Exercise');
    });

    it('should validate competence code format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/exercises',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          titre: 'Test Exercise',
          consigne: 'Test instruction',
          type: 'QCM',
          difficulte: 'decouverte',
          moduleId: 1,
          competenceCode: 'INVALID.CODE',
          configuration: {
            question: 'Test question?',
            choix: ['A', 'B', 'C'],
            bonneReponse: 'A'
          }
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_COMPETENCE_CODE');
    });
  });

  describe('PUT /api/exercises/:id', () => {
    it('should update exercise', async () => {
      // First create an exercise
      const moduleResponse = await app.inject({
        method: 'POST',
        url: '/api/exercises/modules',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          titre: 'Module Test',
          description: 'Test module',
          niveau: 'CP',
          matiere: 'FRANCAIS',
          periode: 'P1'
        }
      });
      
      const moduleId = JSON.parse(moduleResponse.body).data.id;

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/exercises',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          titre: 'Test Exercise',
          consigne: 'Test instruction',
          type: 'QCM',
          difficulte: 'decouverte',
          moduleId,
          competenceCode: 'CP.FR.L1.1',
          configuration: {
            question: 'Test question?',
            choix: ['A', 'B', 'C'],
            bonneReponse: 'A'
          }
        }
      });
      
      const exerciseId = JSON.parse(createResponse.body).data.id;

      const response = await app.inject({
        method: 'PUT',
        url: `/api/exercises/${exerciseId}`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          titre: 'Updated Exercise',
          configuration: {
            question: 'Updated question?',
            choix: ['X', 'Y', 'Z'],
            bonneReponse: 'X'
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
    });
  });

  describe('DELETE /api/exercises/:id', () => {
    it('should delete exercise', async () => {
      // First create an exercise
      const moduleResponse = await app.inject({
        method: 'POST',
        url: '/api/exercises/modules',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          titre: 'Module Test',
          description: 'Test module',
          niveau: 'CP',
          matiere: 'FRANCAIS',
          periode: 'P1'
        }
      });
      
      const moduleId = JSON.parse(moduleResponse.body).data.id;

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/exercises',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          titre: 'Test Exercise',
          consigne: 'Test instruction',
          type: 'QCM',
          difficulte: 'decouverte',
          moduleId,
          competenceCode: 'CP.FR.L1.1',
          configuration: {
            question: 'Test question?',
            choix: ['A', 'B', 'C'],
            bonneReponse: 'A'
          }
        }
      });
      
      const exerciseId = JSON.parse(createResponse.body).data.id;

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/exercises/${exerciseId}`,
        headers: { authorization: `Bearer ${authToken}` }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
    });
  });
}); 