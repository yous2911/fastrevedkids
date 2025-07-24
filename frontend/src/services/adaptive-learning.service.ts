// src/services/adaptive-learning.service.ts
import { ExercicePedagogique } from '../types/api.types';

// Define StudentProgress interface locally since it's not exported from api.types
export interface StudentProgress {
  exerciceId: number;
  statut: 'NON_COMMENCE' | 'EN_COURS' | 'TERMINE' | 'ECHEC' | 'ACQUIS' | 'DIFFICILE';
  nombreTentatives: number;
  tauxReussite: number;
  historique?: Array<{
    timestamp: string;
    reussi: boolean;
    tempsReponse?: number;
    typeErreur?: string;
    completed?: boolean;
    exerciseType?: string;
  }>;
}

export interface DifficultyLevel {
  level: number;
  name: 'DECOUVERTE' | 'PRATIQUE' | 'CONSOLIDATION' | 'MAITRISE' | 'EXPERT';
  successRateThreshold: number;
  minAttempts: number;
  errorTolerance: number;
}

export interface PrerequisiteCheck {
  conceptId: string;
  conceptName: string;
  required: boolean;
  mastered: boolean;
  masteryLevel: number;
  relatedExercises: number[];
}

export interface AdaptiveMetrics {
  currentDifficulty: number;
  optimalDifficulty: number;
  performanceTrend: 'improving' | 'stable' | 'declining';
  learningVelocity: number;
  frustrationIndex: number;
  engagementScore: number;
  recommendedAdjustment: 'increase' | 'maintain' | 'decrease';
}

export class AdaptiveLearningService {
  private readonly DIFFICULTY_LEVELS: DifficultyLevel[] = [
    { level: 1, name: 'DECOUVERTE', successRateThreshold: 0.9, minAttempts: 3, errorTolerance: 0.8 },
    { level: 2, name: 'PRATIQUE', successRateThreshold: 0.8, minAttempts: 5, errorTolerance: 0.6 },
    { level: 3, name: 'CONSOLIDATION', successRateThreshold: 0.75, minAttempts: 7, errorTolerance: 0.5 },
    { level: 4, name: 'MAITRISE', successRateThreshold: 0.7, minAttempts: 10, errorTolerance: 0.3 },
    { level: 5, name: 'EXPERT', successRateThreshold: 0.65, minAttempts: 15, errorTolerance: 0.2 }
  ];

  // Prerequisite mapping for French primary curriculum
  private readonly PREREQUISITE_MAP: Record<string, string[]> = {
    'addition_simple': [],
    'addition_retenue': ['addition_simple'],
    'soustraction_simple': ['addition_simple'],
    'soustraction_retenue': ['soustraction_simple', 'addition_retenue'],
    'multiplication_table': ['addition_simple'],
    'multiplication_posee': ['multiplication_table', 'addition_retenue'],
    'division_simple': ['multiplication_table', 'soustraction_simple'],
    'division_posee': ['division_simple', 'multiplication_posee'],
    'fractions_simples': ['division_simple'],
    'fractions_operations': ['fractions_simples', 'multiplication_posee'],
    'decimaux_simples': ['fractions_simples'],
    'decimaux_operations': ['decimaux_simples', 'multiplication_posee'],
    'pourcentages': ['fractions_simples', 'decimaux_simples'],
    'proportionnalite': ['multiplication_posee', 'division_posee', 'fractions_simples'],
    'geometrie_perimetre': ['addition_simple', 'multiplication_simple'],
    'geometrie_aire': ['multiplication_posee', 'geometrie_perimetre'],
    'problemes_simples': ['addition_simple', 'soustraction_simple'],
    'problemes_complexes': ['multiplication_posee', 'division_simple', 'problemes_simples']
  };

  /**
   * Calculate adaptive difficulty based on student performance
   */
  calculateAdaptiveDifficulty(
    studentProgress: StudentProgress[],
    currentExercise: ExercicePedagogique
  ): AdaptiveMetrics {
    // Get recent performance data
    const recentAttempts = this.getRecentAttempts(studentProgress, 20);
    const successRate = this.calculateSuccessRate(recentAttempts);
    const avgResponseTime = this.calculateAverageResponseTime(recentAttempts);
    const errorPattern = this.analyzeErrorPatterns(recentAttempts);

    // Calculate performance metrics
    const performanceTrend = this.calculatePerformanceTrend(recentAttempts);
    const learningVelocity = this.calculateLearningVelocity(studentProgress);
    const frustrationIndex = this.calculateFrustrationIndex(recentAttempts, errorPattern);
    const engagementScore = this.calculateEngagementScore(recentAttempts, avgResponseTime);

    // Determine optimal difficulty
    const currentDifficulty = this.mapExerciseDifficulty(currentExercise.difficulte);
    const optimalDifficulty = this.calculateOptimalDifficulty(
      currentDifficulty,
      successRate,
      frustrationIndex,
      learningVelocity
    );

    // Recommend adjustment
    const recommendedAdjustment = this.getRecommendedAdjustment(
      currentDifficulty,
      optimalDifficulty,
      frustrationIndex
    );

    return {
      currentDifficulty,
      optimalDifficulty,
      performanceTrend,
      learningVelocity,
      frustrationIndex,
      engagementScore,
      recommendedAdjustment
    };
  }

  /**
   * Check prerequisites for a given concept
   */
  checkPrerequisites(
    conceptId: string,
    studentProgress: StudentProgress[]
  ): PrerequisiteCheck[] {
    const prerequisites = this.PREREQUISITE_MAP[conceptId] || [];
    
    return prerequisites.map(prereqId => {
      const relatedProgress = studentProgress.filter(p => 
        this.isExerciseRelatedToConcept(p.exerciceId, prereqId)
      );

      const mastered = this.isConceptMastered(relatedProgress);
      const masteryLevel = this.calculateMasteryLevel(relatedProgress);

      return {
        conceptId: prereqId,
        conceptName: this.getConceptName(prereqId),
        required: true,
        mastered,
        masteryLevel,
        relatedExercises: relatedProgress.map(p => p.exerciceId)
      };
    });
  }

  /**
   * Generate adaptive exercise sequence
   */
  generateAdaptiveSequence(
    studentId: number,
    targetConcept: string,
    studentProgress: StudentProgress[],
    availableExercises: ExercicePedagogique[]
  ): ExercicePedagogique[] {
    // Check prerequisites
    const prerequisites = this.checkPrerequisites(targetConcept, studentProgress);
    const unmasteredPrereqs = prerequisites.filter(p => !p.mastered);

    // If prerequisites aren't met, include them first
    let sequence: ExercicePedagogique[] = [];
    
    if (unmasteredPrereqs.length > 0) {
      // Add prerequisite exercises first
      unmasteredPrereqs.forEach(prereq => {
        const prereqExercises = availableExercises.filter(e =>
          this.isExerciseRelatedToConcept(e.id, prereq.conceptId)
        );
        sequence.push(...this.selectOptimalExercises(prereqExercises, studentProgress, 2));
      });
    }

    // Add target concept exercises with adaptive difficulty
    const targetExercises = availableExercises.filter(e =>
      this.isExerciseRelatedToConcept(e.id, targetConcept)
    );

    const adaptiveMetrics = this.calculateAdaptiveDifficulty(studentProgress, targetExercises[0]);
    const optimalExercises = this.filterByOptimalDifficulty(
      targetExercises,
      adaptiveMetrics.optimalDifficulty
    );

    sequence.push(...this.selectOptimalExercises(optimalExercises, studentProgress, 5));

    return sequence;
  }

  /**
   * Calculate optimal difficulty based on multiple factors
   */
  private calculateOptimalDifficulty(
    current: number,
    successRate: number,
    frustrationIndex: number,
    learningVelocity: number
  ): number {
    // Zone of Proximal Development calculation
    let optimal = current;

    // Adjust based on success rate
    if (successRate > 0.85 && frustrationIndex < 0.3) {
      optimal = Math.min(5, current + 0.5);
    } else if (successRate < 0.6 || frustrationIndex > 0.7) {
      optimal = Math.max(1, current - 0.5);
    }

    // Factor in learning velocity
    if (learningVelocity > 1.2) {
      optimal = Math.min(5, optimal + 0.25);
    } else if (learningVelocity < 0.8) {
      optimal = Math.max(1, optimal - 0.25);
    }

    return Math.round(optimal * 2) / 2; // Round to nearest 0.5
  }

  private calculateFrustrationIndex(
    attempts: any[],
    errorPattern: any
  ): number {
    const consecutiveErrors = this.getConsecutiveErrors(attempts);
    const errorVariety = errorPattern.uniqueErrorTypes / Math.max(1, errorPattern.totalErrors);
    const timeIncreaseRate = this.getTimeIncreaseRate(attempts);

    return Math.min(1, (
      consecutiveErrors * 0.4 +
      (1 - errorVariety) * 0.3 +
      Math.max(0, timeIncreaseRate) * 0.3
    ));
  }

  private calculateEngagementScore(
    attempts: any[],
    avgResponseTime: number
  ): number {
    const consistencyScore = this.getResponseTimeConsistency(attempts);
    const completionRate = attempts.filter(a => a.completed).length / attempts.length;
    const optimalTimeRatio = this.getOptimalTimeRatio(avgResponseTime, attempts);

    return (
      consistencyScore * 0.3 +
      completionRate * 0.4 +
      optimalTimeRatio * 0.3
    );
  }

  private getRecentAttempts(progress: StudentProgress[], count: number): any[] {
    return progress
      .flatMap(p => p.historique || [])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, count);
  }

  private calculateSuccessRate(attempts: any[]): number {
    if (attempts.length === 0) return 0;
    return attempts.filter(a => a.reussi).length / attempts.length;
  }

  private calculateAverageResponseTime(attempts: any[]): number {
    if (attempts.length === 0) return 0;
    return attempts.reduce((sum, a) => sum + (a.tempsReponse || 0), 0) / attempts.length;
  }

  private analyzeErrorPatterns(attempts: any[]): any {
    const errors = attempts.filter(a => !a.reussi);
    const errorTypes = new Set(errors.map(e => e.typeErreur || 'unknown'));
    
    return {
      totalErrors: errors.length,
      uniqueErrorTypes: errorTypes.size,
      errorTypes: Array.from(errorTypes)
    };
  }

  private calculatePerformanceTrend(attempts: any[]): 'improving' | 'stable' | 'declining' {
    if (attempts.length < 5) return 'stable';

    const recentHalf = attempts.slice(0, Math.floor(attempts.length / 2));
    const olderHalf = attempts.slice(Math.floor(attempts.length / 2));

    const recentSuccess = this.calculateSuccessRate(recentHalf);
    const olderSuccess = this.calculateSuccessRate(olderHalf);

    const difference = recentSuccess - olderSuccess;

    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  private calculateLearningVelocity(progress: StudentProgress[]): number {
    // Calculate how quickly student masters new concepts
    const masteredConcepts = progress.filter(p => p.statut === 'ACQUIS' || p.statut === 'DIFFICILE');
    const avgAttemptsToMastery = masteredConcepts.reduce((sum, p) => sum + p.nombreTentatives, 0) / 
                                  Math.max(1, masteredConcepts.length);
    
    // Lower attempts = higher velocity
    return Math.max(0.5, Math.min(2, 10 / avgAttemptsToMastery));
  }

  private mapExerciseDifficulty(difficulty: string): number {
    const mapping: Record<string, number> = {
      'FACILE': 1,
      'MOYEN': 3,
      'DIFFICILE': 5
    };
    return mapping[difficulty] || 3;
  }

  private getRecommendedAdjustment(
    current: number,
    optimal: number,
    frustration: number
  ): 'increase' | 'maintain' | 'decrease' {
    const difference = optimal - current;
    
    // Override if frustration is high
    if (frustration > 0.7) return 'decrease';
    
    if (difference > 0.5) return 'increase';
    if (difference < -0.5) return 'decrease';
    return 'maintain';
  }

  private isExerciseRelatedToConcept(exerciseId: number, conceptId: string): boolean {
    // This would be connected to your actual exercise-concept mapping
    // For now, returning a placeholder
    return true;
  }

  private isConceptMastered(progress: StudentProgress[]): boolean {
    if (progress.length === 0) return false;
    
    const successRate = progress.reduce((sum, p) => sum + (p.tauxReussite || 0), 0) / progress.length;
    const completedCount = progress.filter(p => p.statut === 'ACQUIS').length;
    
    return successRate >= 0.8 && completedCount >= 3;
  }

  private calculateMasteryLevel(progress: StudentProgress[]): number {
    if (progress.length === 0) return 0;
    
    const avgSuccess = progress.reduce((sum, p) => sum + (p.tauxReussite || 0), 0) / progress.length;
    const completionRate = progress.filter(p => p.statut === 'ACQUIS').length / progress.length;
    
    return (avgSuccess * 0.7 + completionRate * 0.3) * 100;
  }

  private getConceptName(conceptId: string): string {
    const names: Record<string, string> = {
      'addition_simple': 'Addition simple',
      'addition_retenue': 'Addition avec retenue',
      'soustraction_simple': 'Soustraction simple',
      'soustraction_retenue': 'Soustraction avec retenue',
      'multiplication_table': 'Tables de multiplication',
      'multiplication_posee': 'Multiplication posée',
      'division_simple': 'Division simple',
      'division_posee': 'Division posée',
      'fractions_simples': 'Fractions simples',
      'fractions_operations': 'Opérations sur fractions',
      'decimaux_simples': 'Nombres décimaux',
      'decimaux_operations': 'Opérations décimales',
      'pourcentages': 'Pourcentages',
      'proportionnalite': 'Proportionnalité',
      'geometrie_perimetre': 'Périmètre',
      'geometrie_aire': 'Aire',
      'problemes_simples': 'Problèmes simples',
      'problemes_complexes': 'Problèmes complexes'
    };
    return names[conceptId] || conceptId;
  }

  private selectOptimalExercises(
    exercises: ExercicePedagogique[],
    progress: StudentProgress[],
    count: number
  ): ExercicePedagogique[] {
    // Sort by optimal difficulty and variety
    return exercises
      .sort((a, b) => {
        // Prioritize exercises not yet attempted
        const aAttempted = progress.some(p => p.exerciceId === a.id);
        const bAttempted = progress.some(p => p.exerciceId === b.id);
        
        if (!aAttempted && bAttempted) return -1;
        if (aAttempted && !bAttempted) return 1;
        
        return 0;
      })
      .slice(0, count);
  }

  private filterByOptimalDifficulty(
    exercises: ExercicePedagogique[],
    optimalDifficulty: number
  ): ExercicePedagogique[] {
    return exercises.filter(e => {
      const exerciseDiff = this.mapExerciseDifficulty(e.difficulte);
      return Math.abs(exerciseDiff - optimalDifficulty) <= 1;
    });
  }

  private getConsecutiveErrors(attempts: any[]): number {
    let consecutive = 0;
    for (const attempt of attempts) {
      if (!attempt.reussi) {
        consecutive++;
      } else {
        break;
      }
    }
    return consecutive;
  }

  private getTimeIncreaseRate(attempts: any[]): number {
    if (attempts.length < 3) return 0;
    
    const times = attempts.map(a => a.tempsReponse || 0);
    const recentAvg = times.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const olderAvg = times.slice(-3).reduce((a, b) => a + b, 0) / 3;
    
    return (recentAvg - olderAvg) / Math.max(1, olderAvg);
  }

  private getResponseTimeConsistency(attempts: any[]): number {
    if (attempts.length < 2) return 1;
    
    const times = attempts.map(a => a.tempsReponse || 0);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower std dev = higher consistency
    return Math.max(0, 1 - (stdDev / avg));
  }

  private getOptimalTimeRatio(avgTime: number, attempts: any[]): number {
    // Estimate optimal time based on exercise type
    const optimalTimes: Record<string, number> = {
      'QCM': 30,
      'CALCUL': 45,
      'TEXTE_LIBRE': 60,
      'DRAG_DROP': 40,
      'PROBLEME': 120
    };
    
    const exerciseTypes = attempts.map(a => a.exerciseType).filter(Boolean);
    if (exerciseTypes.length === 0) return 0.5;
    
    const avgOptimal = exerciseTypes.reduce((sum, type) => 
      sum + (optimalTimes[type] || 60), 0
    ) / exerciseTypes.length;
    
    // Ratio close to 1 is optimal
    const ratio = avgTime / avgOptimal;
    if (ratio < 0.5) return ratio * 2; // Too fast
    if (ratio > 2) return 2 / ratio; // Too slow
    return 1 - Math.abs(1 - ratio);
  }
}

export const adaptiveLearningService = new AdaptiveLearningService(); 