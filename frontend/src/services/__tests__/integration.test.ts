/**
 * Integration Tests for FastRevEd Kids Platform
 * Tests the actual API endpoints with real database data
 */

import { apiService } from '../api.service';
import { studentService } from '../student.service';
import { exerciseService } from '../exercise.service';

// Configuration for integration tests
const TEST_CONFIG = {
  API_BASE_URL: 'http://localhost:3003/api',
  TIMEOUT: 10000,
  STUDENT_ID: 1, // Test with existing student from seed data
};

// Helper to check if backend is running
const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Skip tests if backend is not running
const conditionalTest = (name: string, testFn: () => Promise<void>) => {
  it(name, async () => {
    const isBackendRunning = await checkBackendHealth();
    
    if (!isBackendRunning) {
      console.warn(`⚠️ Skipping test "${name}" - Backend not running on ${TEST_CONFIG.API_BASE_URL}`);
      return;
    }
    
    await testFn();
  }, TEST_CONFIG.TIMEOUT);
};

describe('Integration Tests - Real Database', () => {
  beforeAll(async () => {
    // Wait a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Backend Health', () => {
    conditionalTest('should have healthy backend service', async () => {
      const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
    });
  });

  describe('Student Service Integration', () => {
    conditionalTest('should fetch student data from real database', async () => {
      const result = await studentService.getStudent(TEST_CONFIG.STUDENT_ID);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('id');
        expect(result.data).toHaveProperty('prenom');
        expect(result.data).toHaveProperty('nom');
        expect(result.data.id).toBe(TEST_CONFIG.STUDENT_ID);
      }
    });

    conditionalTest('should fetch student progress from database', async () => {
      const result = await studentService.getProgress(TEST_CONFIG.STUDENT_ID);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    conditionalTest('should fetch student statistics from database', async () => {
      const result = await studentService.getStatistics(TEST_CONFIG.STUDENT_ID);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('totalExercises');
        expect(typeof result.data.totalExercises).toBe('number');
      }
    });

    conditionalTest('should fetch student achievements from database', async () => {
      const result = await studentService.getAchievements(TEST_CONFIG.STUDENT_ID);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('Exercise Service Integration', () => {
    conditionalTest('should fetch exercises from database', async () => {
      const result = await exerciseService.getExercises({ limit: 5 });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
        
        // Check exercise structure matches database schema
        const firstExercise = result.data[0];
        expect(firstExercise).toHaveProperty('id');
        expect(firstExercise).toHaveProperty('question');
        expect(firstExercise).toHaveProperty('type');
        expect(firstExercise).toHaveProperty('difficultyLevel');
      }
    });

    conditionalTest('should fetch random exercises for practice', async () => {
      const result = await exerciseService.getRandomExercises(3);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('Database Schema Validation', () => {
    conditionalTest('should have proper student data structure', async () => {
      const result = await studentService.getStudent(TEST_CONFIG.STUDENT_ID);
      
      if (result.success) {
        const student = result.data;
        
        // Validate against MySQL schema
        expect(typeof student.id).toBe('number');
        expect(typeof student.prenom).toBe('string');
        expect(typeof student.nom).toBe('string');
        expect(typeof student.totalPoints).toBe('number');
        expect(typeof student.serieJours).toBe('number');
        
        // Optional fields
        if (student.dateNaissance) {
          expect(typeof student.dateNaissance).toBe('string');
        }
        
        if (student.mascotteType) {
          expect(['dragon', 'fairy', 'robot', 'cat', 'owl']).toContain(student.mascotteType);
        }
      }
    });

    conditionalTest('should have proper exercise data structure', async () => {
      const result = await exerciseService.getExercises({ limit: 1 });
      
      if (result.success && result.data.length > 0) {
        const exercise = result.data[0];
        
        // Validate against MySQL exercises table
        expect(typeof exercise.id).toBe('number');
        expect(typeof exercise.question).toBe('string');
        expect(typeof exercise.type).toBe('string');
        expect(typeof exercise.difficultyLevel).toBe('number');
        expect(typeof exercise.xpReward).toBe('number');
        
        // Validate exercise types match database enum
        const validTypes = ['CALCUL', 'MENTAL_MATH', 'DRAG_DROP', 'QCM', 'LECTURE', 'ECRITURE', 'COMPREHENSION'];
        expect(validTypes).toContain(exercise.type);
        
        // Validate difficulty range (SuperMemo scale 0-5)
        expect(exercise.difficultyLevel).toBeGreaterThanOrEqual(0);
        expect(exercise.difficultyLevel).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('API Response Format', () => {
    conditionalTest('should return consistent API response format', async () => {
      const result = await studentService.getStudent(TEST_CONFIG.STUDENT_ID);
      
      // All API responses should have success field
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result).toHaveProperty('data');
      } else {
        expect(result).toHaveProperty('error');
        expect(result.error).toHaveProperty('code');
        expect(result.error).toHaveProperty('message');
      }
    });

    conditionalTest('should handle API errors gracefully', async () => {
      // Try to fetch non-existent student
      const result = await studentService.getStudent(99999);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toHaveProperty('code');
        expect(result.error).toHaveProperty('message');
        expect(typeof result.error.code).toBe('string');
        expect(typeof result.error.message).toBe('string');
      }
    });
  });

  describe('Data Integrity', () => {
    conditionalTest('should maintain data relationships', async () => {
      // Test that student progress references valid exercises and competences
      const progressResult = await studentService.getProgress(TEST_CONFIG.STUDENT_ID);
      
      if (progressResult.success && progressResult.data.length > 0) {
        const progressItem = progressResult.data[0];
        
        // Should have valid IDs
        expect(typeof progressItem.exerciceId).toBe('number');
        expect(progressItem.exerciceId).toBeGreaterThan(0);
        
        // Status should match database enum
        const validStatuses = ['not_started', 'learning', 'mastered', 'failed'];
        if (progressItem.statut) {
          expect(validStatuses).toContain(progressItem.statut);
        }
      }
    });

    conditionalTest('should have consistent XP calculations', async () => {
      const studentResult = await studentService.getStudent(TEST_CONFIG.STUDENT_ID);
      const exercisesResult = await exerciseService.getExercises({ limit: 10 });
      
      if (studentResult.success && exercisesResult.success) {
        const student = studentResult.data;
        const exercises = exercisesResult.data;
        
        // Student total XP should be non-negative
        expect(student.totalPoints).toBeGreaterThanOrEqual(0);
        
        // All exercises should have positive XP rewards
        exercises.forEach(exercise => {
          expect(exercise.xpReward).toBeGreaterThan(0);
          expect(exercise.xpReward).toBeLessThanOrEqual(100); // Reasonable upper limit
        });
      }
    });
  });

  describe('Performance', () => {
    conditionalTest('should respond within reasonable time limits', async () => {
      const startTime = Date.now();
      const result = await studentService.getStudent(TEST_CONFIG.STUDENT_ID);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    conditionalTest('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, () => 
        studentService.getStudent(TEST_CONFIG.STUDENT_ID)
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});

// Manual test runner for when Jest is not available
if (typeof describe === 'undefined') {
  console.log('Running integration tests manually...');
  
  const runManualTests = async () => {
    try {
      const isHealthy = await checkBackendHealth();
      
      if (!isHealthy) {
        console.error('❌ Backend is not running. Please start the backend server first:');
        console.log('  cd backend && npm run dev');
        return;
      }
      
      console.log('✅ Backend is healthy, running tests...');
      
      // Test student service
      const studentResult = await studentService.getStudent(TEST_CONFIG.STUDENT_ID);
      console.log('Student test:', studentResult.success ? '✅' : '❌');
      
      // Test exercise service
      const exerciseResult = await exerciseService.getExercises({ limit: 5 });
      console.log('Exercise test:', exerciseResult.success ? '✅' : '❌');
      
      console.log('🎉 Manual integration tests completed');
      
    } catch (error) {
      console.error('❌ Manual tests failed:', error);
    }
  };
  
  runManualTests();
}