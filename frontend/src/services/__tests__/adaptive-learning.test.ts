import { adaptiveLearningService } from '../adaptive-learning.service';
import { exerciseService } from '../exercise.service';
import { StudentProgress, AdaptiveMetrics } from '../adaptive-learning.service';

// Mock API service
jest.mock('../api.service', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

describe('Adaptive Learning Service Integration', () => {
  const mockStudentProgress: StudentProgress[] = [
    {
      exerciceId: 1,
      statut: 'TERMINE',
      nombreTentatives: 3,
      tauxReussite: 0.8,
      historique: [
        {
          timestamp: new Date().toISOString(),
          reussi: true,
          tempsReponse: 45,
          completed: true,
          exerciseType: 'QCM'
        }
      ]
    },
    {
      exerciceId: 2,
      statut: 'EN_COURS',
      nombreTentatives: 2,
      tauxReussite: 0.5,
      historique: [
        {
          timestamp: new Date().toISOString(),
          reussi: false,
          tempsReponse: 60,
          completed: true,
          exerciseType: 'CALCUL'
        }
      ]
    }
  ];

  const mockExercise = {
    id: 1,
    type: 'QCM' as const,
    configuration: {
      question: 'Test question',
      choix: ['A', 'B', 'C'],
      bonneReponse: 'A'
    },
    difficulte: 'MOYEN' as const,
    xp: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Adaptive Learning Service', () => {
    it('should calculate adaptive difficulty correctly', () => {
      const metrics = adaptiveLearningService.calculateAdaptiveDifficulty(
        mockStudentProgress,
        mockExercise
      );

      expect(metrics).toHaveProperty('currentDifficulty');
      expect(metrics).toHaveProperty('optimalDifficulty');
      expect(metrics).toHaveProperty('performanceTrend');
      expect(metrics).toHaveProperty('learningVelocity');
      expect(metrics).toHaveProperty('frustrationIndex');
      expect(metrics).toHaveProperty('engagementScore');
      expect(metrics).toHaveProperty('recommendedAdjustment');

      expect(typeof metrics.currentDifficulty).toBe('number');
      expect(typeof metrics.optimalDifficulty).toBe('number');
      expect(['improving', 'stable', 'declining']).toContain(metrics.performanceTrend);
      expect(['increase', 'maintain', 'decrease']).toContain(metrics.recommendedAdjustment);
    });

    it('should check prerequisites correctly', () => {
      const prerequisites = adaptiveLearningService.checkPrerequisites(
        'addition_retenue',
        mockStudentProgress
      );

      expect(Array.isArray(prerequisites)).toBe(true);
      prerequisites.forEach(prereq => {
        expect(prereq).toHaveProperty('conceptId');
        expect(prereq).toHaveProperty('conceptName');
        expect(prereq).toHaveProperty('required');
        expect(prereq).toHaveProperty('mastered');
        expect(prereq).toHaveProperty('masteryLevel');
        expect(prereq).toHaveProperty('relatedExercises');
      });
    });

    it('should generate adaptive sequence', () => {
      const availableExercises = [mockExercise];
      const sequence = adaptiveLearningService.generateAdaptiveSequence(
        1,
        'addition_simple',
        mockStudentProgress,
        availableExercises
      );

      expect(Array.isArray(sequence)).toBe(true);
    });

    it('should calculate learning velocity', () => {
      const velocity = adaptiveLearningService.calculateLearningVelocity(mockStudentProgress);
      expect(typeof velocity).toBe('number');
      expect(velocity).toBeGreaterThan(0);
      expect(velocity).toBeLessThanOrEqual(2);
    });
  });

  describe('Exercise Service Integration', () => {
    it('should get adaptive insights', () => {
      const insights = exerciseService.getAdaptiveInsights();
      
      expect(insights).toHaveProperty('masteryLevel');
      expect(insights).toHaveProperty('learningVelocity');
      expect(insights).toHaveProperty('frustrationIndex');
      expect(insights).toHaveProperty('engagementScore');
      expect(insights).toHaveProperty('recommendedConcepts');

      expect(typeof insights.masteryLevel).toBe('number');
      expect(typeof insights.learningVelocity).toBe('number');
      expect(typeof insights.frustrationIndex).toBe('number');
      expect(typeof insights.engagementScore).toBe('number');
      expect(Array.isArray(insights.recommendedConcepts)).toBe(true);
    });

    it('should handle exercise attempt submission', async () => {
      const attempt = {
        exerciseId: 1,
        answer: 'A',
        timeSpent: 45,
        attempts: 1,
        completed: true,
        exerciseType: 'QCM'
      };

      // Mock the API response
      const mockApiService = await import('../api.service');
      jest.mocked(mockApiService.apiService.post).mockResolvedValue({
        success: true,
        data: {
          success: true,
          pointsGagnes: 10,
          nouveauStatut: 'TERMINE'
        }
      });

      const result = await exerciseService.submitExerciseAttempt(attempt);
      
      expect(result).toHaveProperty('adaptiveMetrics');
      expect(result).toHaveProperty('recommendedAdjustment');
    });
  });

  describe('Difficulty Level Mapping', () => {
    it('should map exercise difficulties correctly', () => {
      const difficulties = ['FACILE', 'MOYEN', 'DIFFICILE'];
      
      difficulties.forEach(difficulty => {
        const exercise = { ...mockExercise, difficulte: difficulty as any };
        const metrics = adaptiveLearningService.calculateAdaptiveDifficulty(
          mockStudentProgress,
          exercise
        );
        
        expect(metrics.currentDifficulty).toBeGreaterThan(0);
        expect(metrics.currentDifficulty).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('Performance Analysis', () => {
    it('should analyze performance trends', () => {
      const improvingProgress: StudentProgress[] = [
        {
          exerciceId: 1,
          statut: 'TERMINE',
          nombreTentatives: 1,
          tauxReussite: 1.0,
          historique: [
            { timestamp: new Date().toISOString(), reussi: true, completed: true }
          ]
        }
      ];

      const decliningProgress: StudentProgress[] = [
        {
          exerciceId: 1,
          statut: 'EN_COURS',
          nombreTentatives: 5,
          tauxReussite: 0.2,
          historique: [
            { timestamp: new Date().toISOString(), reussi: false, completed: true }
          ]
        }
      ];

      const improvingMetrics = adaptiveLearningService.calculateAdaptiveDifficulty(
        improvingProgress,
        mockExercise
      );

      const decliningMetrics = adaptiveLearningService.calculateAdaptiveDifficulty(
        decliningProgress,
        mockExercise
      );

      expect(improvingMetrics.performanceTrend).toBe('improving');
      expect(decliningMetrics.performanceTrend).toBe('declining');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty progress data', () => {
      const metrics = adaptiveLearningService.calculateAdaptiveDifficulty(
        [],
        mockExercise
      );

      expect(metrics).toBeDefined();
      expect(metrics.frustrationIndex).toBe(0);
      expect(metrics.engagementScore).toBe(0.5);
    });

    it('should handle missing exercise data', () => {
      const insights = exerciseService.getAdaptiveInsights();
      
      // Should return default values when no progress exists
      expect(insights.masteryLevel).toBe(0);
      expect(insights.learningVelocity).toBe(1);
      expect(insights.frustrationIndex).toBe(0);
      expect(insights.engagementScore).toBe(0.5);
    });
  });
}); 