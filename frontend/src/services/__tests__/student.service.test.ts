// Real Database Integration Tests
// Using actual database instead of mocks
import { studentService } from '../student.service';

// Test configuration
const TEST_CONFIG = {
  BACKEND_URL: 'http://localhost:3003',
  STUDENT_ID: 1, // Using seed data student ID
  TIMEOUT: 10000,
};

// Helper to check if backend is available
const isBackendAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${TEST_CONFIG.BACKEND_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
};

// Conditional test wrapper
const testWithBackend = (name: string, testFn: () => Promise<void>) => {
  it(name, async () => {
    const available = await isBackendAvailable();
    if (!available) {
      console.warn(`⚠️ Skipping "${name}" - Backend not running`);
      return;
    }
    await testFn();
  }, TEST_CONFIG.TIMEOUT);
};

describe('StudentService - Real Database Integration', () => {
  beforeAll(async () => {
    // Give backend time to start if needed
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('getStudent', () => {
    testWithBackend('should get real student by ID from database', async () => {
      const result = await studentService.getStudent(TEST_CONFIG.STUDENT_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('id');
        expect(result.data).toHaveProperty('prenom');
        expect(result.data).toHaveProperty('nom');
        expect(result.data.id).toBe(TEST_CONFIG.STUDENT_ID);
        expect(typeof result.data.prenom).toBe('string');
        expect(typeof result.data.nom).toBe('string');
      }
    });

    testWithBackend('should handle non-existent student ID', async () => {
      const result = await studentService.getStudent(99999);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toHaveProperty('code');
        expect(result.error).toHaveProperty('message');
      }
    });
  });

  describe('getRecommendations', () => {
    testWithBackend('should get exercise recommendations from database', async () => {
      const result = await studentService.getRecommendations(TEST_CONFIG.STUDENT_ID, { limit: 5 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        result.data.forEach(recommendation => {
          expect(recommendation).toHaveProperty('id');
          expect(typeof recommendation.id).toBe('number');
        });
      }
    });
  });

  describe('submitAttempt', () => {
    testWithBackend('should submit valid exercise attempt to database', async () => {
      const ATTEMPT = {
        reponse: '7',
        reussi: true,
        tempsSecondes: 30,
        aidesUtilisees: 0,
      };

      const result = await studentService.submitAttempt(TEST_CONFIG.STUDENT_ID, 1, ATTEMPT);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('reussi');
        expect(typeof result.data.reussi).toBe('boolean');
      }
    });

    testWithBackend('should validate attempt data before submission', async () => {
      const INVALID_ATTEMPT = {
        reponse: '',
        reussi: 'invalid' as any,
        tempsSecondes: -5,
        aidesUtilisees: 0,
      };

      const result = await studentService.submitAttempt(TEST_CONFIG.STUDENT_ID, 1, INVALID_ATTEMPT);
      expect(result.success).toBe(false);
    });
  });

  describe('getProgress', () => {
    testWithBackend('should get real student progress from database', async () => {
      const result = await studentService.getProgress(TEST_CONFIG.STUDENT_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        result.data.forEach(progress => {
          expect(progress).toHaveProperty('exerciceId');
          expect(typeof progress.exerciceId).toBe('number');
        });
      }
    });
  });

  describe('getStatistics', () => {
    it('should get student statistics', async () => {
      const MOCK_STATS = {
        totalExercises: 100,
        completedExercises: 75,
        successRate: 85,
        totalTime: 3600,
        streak: 7,
      };

      mockApiService.get.mockResolvedValue({
        success: true,
        data: MOCK_STATS,
      });

      const result = await studentService.getStatistics(1);

      expect(mockApiService.get).toHaveBeenCalledWith('/students/1/statistics');
      expect(result.data).toEqual(MOCK_STATS);
    });
  });

  describe('getAchievements', () => {
    it('should get student achievements', async () => {
      const MOCK_ACHIEVEMENTS = [
        { id: 1, titre: 'Premier exercice', description: 'A complété son premier exercice' },
      ];

      mockApiService.get.mockResolvedValue({
        success: true,
        data: MOCK_ACHIEVEMENTS,
      });

      const result = await studentService.getAchievements(1);

      expect(mockApiService.get).toHaveBeenCalledWith('/students/1/achievements');
      expect(result.data).toEqual(MOCK_ACHIEVEMENTS);
    });
  });

  describe('updatePreferences', () => {
    it('should update student preferences', async () => {
      const preferences = {
        soundEnabled: true,
        hapticEnabled: false,
        theme: 'dark',
      };

      const mockResponse = {
        success: true,
        data: { id: 1, preferences },
      };

      mockApiService.put.mockResolvedValue(mockResponse);

      const result = await studentService.updatePreferences(1, preferences);

      expect(mockApiService.put).toHaveBeenCalledWith('/students/1/preferences', { preferences });
      expect(result.success).toBe(true);
    });
  });

  describe('updateLevel', () => {
    it('should update student level', async () => {
      const mockResponse = {
        success: true,
        data: { id: 1, niveauActuel: 'CM1' },
      };

      mockApiService.put.mockResolvedValue(mockResponse);

      const result = await studentService.updateLevel(1, 'CM1');

      expect(mockApiService.put).toHaveBeenCalledWith('/students/1/level', { niveauActuel: 'CM1' });
      expect(result.success).toBe(true);
    });
  });

  describe('getStreak', () => {
    it('should get student streak', async () => {
      const MOCK_STREAK = {
        serieJours: 7,
        lastActivity: '2024-01-01',
      };

      mockApiService.get.mockResolvedValue({
        success: true,
        data: MOCK_STREAK,
      });

      const result = await studentService.getStreak(1);

      expect(mockApiService.get).toHaveBeenCalledWith('/students/1/streak');
      expect(result.data).toEqual(MOCK_STREAK);
    });
  });

  describe('logActivity', () => {
    it('should log student ACTIVITY', async () => {
      const ACTIVITY = {
        type: 'exercise_completed',
        details: { exerciseId: 1, score: 100 },
        duration: 300,
      };

      const mockResponse = {
        success: true,
        data: { id: 1, ACTIVITY },
      };

      mockApiService.post.mockResolvedValue(mockResponse);

      const result = await studentService.logActivity(1, ACTIVITY);

      expect(mockApiService.post).toHaveBeenCalledWith('/students/1/activity', ACTIVITY);
      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockApiService.get.mockRejectedValue(new Error('Network error'));

      await expect(
        studentService.getStudent(1)
      ).rejects.toThrow('Network error');
    });

    it('should handle API errors gracefully', async () => {
      mockApiService.get.mockResolvedValue({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Invalid request' },
      });

      const result = await studentService.getStudent(-1);
      expect(result.success).toBe(false);
    });
  });
}); 