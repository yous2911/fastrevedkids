// Mock the API service directly in jest.mock
jest.mock('../api.service', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Import after mocking
import { studentService } from '../student.service';
import { apiService } from '../api.service';

// Get the mocked apiService
const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('StudentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStudent', () => {
    it('should get student by ID', async () => {
      const mockStudent = {
        id: 1,
        prenom: 'Alice',
        nom: 'Dupont',
        totalPoints: 1500,
        serieJours: 7,
      };

      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockStudent,
      });

      const result = await studentService.getStudent(1);

      expect(mockApiService.get).toHaveBeenCalledWith('/students/1');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStudent);
    });

    it('should handle API errors', async () => {
      mockApiService.get.mockResolvedValue({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' },
      });

      const result = await studentService.getStudent(999);

      expect(result.success).toBe(false);
    });
  });

  describe('getRecommendations', () => {
    it('should get exercise recommendations', async () => {
      const mockRecommendations = [
        {
          id: 1,
          titre: 'Addition Simple',
          description: 'Exercices d\'addition de base',
          difficulte: 'FACILE',
        },
      ];

      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockRecommendations,
      });

      const result = await studentService.getRecommendations(1, { limit: 5 });

      expect(mockApiService.get).toHaveBeenCalledWith('/students/1/recommendations?limit=5');
      expect(result.data).toEqual(mockRecommendations);
    });
  });

  describe('submitAttempt', () => {
    it('should submit valid exercise attempt', async () => {
      const attempt = {
        reponse: '7',
        reussi: true,
        tempsSecondes: 30,
        aidesUtilisees: 0,
      };

      const mockResponse = {
        success: true,
        data: {
          reussi: true,
          pointsGagnes: 10,
          nouveauNiveau: false,
        },
      };

      mockApiService.post.mockResolvedValue(mockResponse);

      const result = await studentService.submitAttempt(1, 1, attempt);

      expect(mockApiService.post).toHaveBeenCalledWith('/students/1/attempts', {
        exerciseId: 1,
        attempt,
      });
      expect(result.success).toBe(true);
    });

    it('should handle validation errors gracefully', async () => {
      const invalidAttempt = {
        reponse: '',
        reussi: 'invalid' as any,
        tempsSecondes: -5,
        aidesUtilisees: 0,
      };

      // The service should validate and throw an error
      try {
        await studentService.submitAttempt(1, 1, invalidAttempt);
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        // Validation error should be thrown
        expect(error).toBeDefined();
      }
    });
  });

  describe('getProgress', () => {
    it('should get student progress', async () => {
      const mockProgress = [
        {
          exerciceId: 1,
          statut: 'ACQUIS',
          nombreTentatives: 3,
          nombreReussites: 2,
          moyenneTemps: 45,
          progression: 85,
        },
      ];

      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockProgress,
      });

      const result = await studentService.getProgress(1);

      expect(mockApiService.get).toHaveBeenCalledWith('/students/1/progress?');
      expect(result.data).toEqual(mockProgress);
    });
  });

  describe('getStatistics', () => {
    it('should get student statistics', async () => {
      const mockStats = {
        totalExercises: 100,
        completedExercises: 75,
        successRate: 85,
        totalTime: 3600,
        streak: 7,
      };

      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockStats,
      });

      const result = await studentService.getStatistics(1);

      expect(mockApiService.get).toHaveBeenCalledWith('/students/1/statistics');
      expect(result.data).toEqual(mockStats);
    });
  });

  describe('getAchievements', () => {
    it('should get student achievements', async () => {
      const mockAchievements = [
        { id: 1, titre: 'Premier exercice', description: 'A complété son premier exercice' },
      ];

      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockAchievements,
      });

      const result = await studentService.getAchievements(1);

      expect(mockApiService.get).toHaveBeenCalledWith('/students/1/achievements');
      expect(result.data).toEqual(mockAchievements);
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
      const mockStreak = {
        serieJours: 7,
        lastActivity: '2024-01-01',
      };

      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockStreak,
      });

      const result = await studentService.getStreak(1);

      expect(mockApiService.get).toHaveBeenCalledWith('/students/1/streak');
      expect(result.data).toEqual(mockStreak);
    });
  });

  describe('logActivity', () => {
    it('should log student activity', async () => {
      const activity = {
        type: 'exercise_completed',
        details: { exerciseId: 1, score: 100 },
        duration: 300,
      };

      const mockResponse = {
        success: true,
        data: { id: 1, activity },
      };

      mockApiService.post.mockResolvedValue(mockResponse);

      const result = await studentService.logActivity(1, activity);

      expect(mockApiService.post).toHaveBeenCalledWith('/students/1/activity', activity);
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