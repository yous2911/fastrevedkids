// src/services/__tests__/student.service.test.ts
import { StudentService } from '../student.service';
import { apiService } from '../api.service';

// Mock API service
jest.mock('../api.service', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('StudentService', () => {
  const studentService = new StudentService();
  const mockApiService = apiService as jest.Mocked<typeof apiService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStudent', () => {
    it('should fetch student data', async () => {
      const mockStudent = {
        id: 1,
        prenom: 'Alice',
        nom: 'Dupont',
        totalPoints: 150
      };

      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockStudent
      });

      const result = await studentService.getStudent(1);

      expect(mockApiService.get).toHaveBeenCalledWith('/students/1', { cache: true });
      expect(result.data).toEqual(mockStudent);
    });

    it('should handle API errors', async () => {
      mockApiService.get.mockRejectedValue(new Error('Network error'));

      await expect(studentService.getStudent(1)).rejects.toThrow('Network error');
    });
  });

  describe('submitExerciseAttempt', () => {
    it('should submit valid attempt', async () => {
      const attempt = {
        reponse: 'Test answer',
        reussi: true,
        tempsReponse: 30,
        aidesUtilisees: 0
      };

      const mockResponse = {
        success: true,
        data: {
          pointsGagnes: 10,
          niveauAtteint: false
        }
      };

      mockApiService.post.mockResolvedValue(mockResponse);

      const result = await studentService.submitExerciseAttempt(1, 1, attempt);

      expect(mockApiService.post).toHaveBeenCalledWith(
        '/students/1/exercices',
        { exerciceId: 1, tentative: attempt },
        { timeout: 15000, retries: 2 }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should validate attempt data', async () => {
      const invalidAttempt = {
        reponse: '',
        reussi: 'invalid' as any,
        tempsReponse: -1,
        aidesUtilisees: 0
      };

      await expect(
        studentService.submitExerciseAttempt(1, 1, invalidAttempt)
      ).rejects.toThrow();
    });
  });

  describe('getRecommendations', () => {
    it('should fetch exercise recommendations', async () => {
      const mockRecommendations = [
        { id: 1, titre: 'Exercise 1' },
        { id: 2, titre: 'Exercise 2' }
      ];

      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockRecommendations
      });

      const result = await studentService.getRecommendations(1, 5);

      expect(mockApiService.get).toHaveBeenCalledWith(
        '/students/1/recommendations?limite=5',
        { cache: true }
      );
      expect(result.data).toEqual(mockRecommendations);
    });
  });
}); 