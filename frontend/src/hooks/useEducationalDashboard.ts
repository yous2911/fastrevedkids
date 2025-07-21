import { useState, useEffect, useCallback } from 'react';
import { StudentMetrics, CompetencyMapping } from '../types/wahoo.types';
import { useWahooEngine, UseWahooEngineReturn } from './useWahooEngine';
import { useMascotData, UseMascotDataReturn } from './useMascotData';

// Mapping entre métriques ludiques et compétences éducatives
const COMPETENCY_MAPPING: CompetencyMapping = {
  'wizard_hat_epic': {
    description: 'Chapeau de Magicien',
    gameMetric: 'Objet débloqué par 10 exercices de maths',
    educationalValue: 'Maîtrise des opérations de base (addition/soustraction)',
    parentExplanation: 'Votre enfant a démontré une compréhension solide des calculs fondamentaux'
  },
  'crown_legendary': {
    description: 'Couronne de la Sagesse',
    gameMetric: 'Série de 30 bonnes réponses',
    educationalValue: 'Excellence en résolution de problèmes et concentration',
    parentExplanation: 'Votre enfant fait preuve d\'une concentration exceptionnelle et d\'une maîtrise avancée'
  },
  'monocle_detective': {
    description: 'Monocle de Détective',
    gameMetric: 'Résolution de mots mystères difficiles',
    educationalValue: 'Développement du vocabulaire et logique déductive',
    parentExplanation: 'Votre enfant enrichit son vocabulaire et développe sa capacité de déduction'
  },
  'smart_glasses_nerd': {
    description: 'Lunettes de Génie',
    gameMetric: 'Score parfait sur exercices difficiles',
    educationalValue: 'Maîtrise de concepts avancés et pensée critique',
    parentExplanation: 'Votre enfant est prêt pour des défis plus complexes'
  }
};

export const useEducationalDashboard = () => {
  const [studentMetrics, setStudentMetrics] = useState<StudentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get real data from hooks
  const wahooData = useWahooEngine();
  const mascotData = useMascotData();

  // Generate educational insights from real data
  const generateEducationalInsights = useCallback(() => {
    // Analyze engagement patterns
    const engagementPattern = analyzeEngagementPattern(wahooData);
    
    // Calculate learning velocity
    const learningVelocity = calculateLearningVelocity(wahooData);
    
    // Determine cognitive load
    const cognitiveLoad = determineCognitiveLoad(wahooData);
    
    // Identify mastered concepts
    const masteredConcepts = identifyMasteredConcepts(mascotData, wahooData);
    
    // Identify struggling areas
    const strugglingAreas = identifyStrugglingAreas(wahooData);

    return {
      masteredConcepts,
      strugglingAreas,
      confidenceLevel: determineConfidenceLevel(wahooData),
      cognitiveLoad,
      engagementPattern,
      learningVelocity
    };
  }, [wahooData, mascotData]);

  // Build student metrics from real data
  const buildStudentMetrics = useCallback((): StudentMetrics => {
    const educationalInsights = generateEducationalInsights();

    return {
      id: 'student_001', // This would come from your auth system
      name: 'Emma Martin', // This would come from your user data
      age: 9,
      streakCurrent: wahooData.streak,
      totalExercises: wahooData.totalCorrect,
      mascotHappiness: calculateMascotHappiness(mascotData, wahooData),
      unlockedItems: mascotData.unlockedItems,
      mysteryWordsCompleted: wahooData.mysteryWordsCompleted,
      wahooIntensityHistory: wahooData.intensityHistory,
      educationalInsights
    };
  }, [wahooData, mascotData, generateEducationalInsights]);

  // Update metrics when data changes
  useEffect(() => {
    try {
      setLoading(true);
      const metrics = buildStudentMetrics();
      setStudentMetrics(metrics);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des métriques');
    } finally {
      setLoading(false);
    }
  }, [buildStudentMetrics]);

  // Utility functions that work with real data
  const analyzeEngagementPattern = (wahooData: UseWahooEngineReturn): string => {
    const { streak, totalCorrect, sessionDuration, engagementLevel } = wahooData;
    
    if (engagementLevel === 'high' && streak > 10) {
      return 'Très engagé, sessions longues avec performance constante';
    } else if (engagementLevel === 'medium' && streak > 5) {
      return 'Engagement modéré, progression régulière';
    } else {
      return 'Engagement variable, besoin d\'encouragement';
    }
  };

  const calculateLearningVelocity = (wahooData: UseWahooEngineReturn): number => {
    const baseVelocity = 1.0;
    const streakBonus = wahooData.streak > 10 ? 0.2 : 0;
    const accuracyBonus = wahooData.totalCorrect > 100 ? 0.1 : 0;
    
    return Math.min(baseVelocity + streakBonus + accuracyBonus, 2.0);
  };

  const determineCognitiveLoad = (wahooData: UseWahooEngineReturn): 'optimal' | 'under-challenged' | 'overwhelmed' => {
    const { consecutiveErrors, averageResponseTime, engagementLevel } = wahooData;
    
    if (consecutiveErrors > 5 || averageResponseTime > 10) {
      return 'overwhelmed';
    } else if (engagementLevel === 'low' && consecutiveErrors < 2) {
      return 'under-challenged';
    } else {
      return 'optimal';
    }
  };

  const identifyMasteredConcepts = (mascotData: UseMascotDataReturn, wahooData: UseWahooEngineReturn): string[] => {
    const concepts: string[] = [];
    
    if (wahooData.totalCorrect > 50) {
      concepts.push('Addition et soustraction jusqu\'à 100');
    }
    
    if (mascotData.unlockedItems.includes('wizard_hat_epic')) {
      concepts.push('Reconnaissance des formes géométriques');
    }
    
    if (wahooData.streak > 15) {
      concepts.push('Orthographe des mots courants');
    }
    
    if (wahooData.mysteryWordsCompleted > 5) {
      concepts.push('Compréhension de lecture niveau CE1');
    }
    
    return concepts;
  };

  const identifyStrugglingAreas = (wahooData: UseWahooEngineReturn): string[] => {
    const areas: string[] = [];
    
    if (wahooData.consecutiveErrors > 3) {
      areas.push('Tables de multiplication (en cours)');
    }
    
    if (wahooData.averageResponseTime > 8) {
      areas.push('Accord du participe passé');
    }
    
    return areas;
  };

  const determineConfidenceLevel = (wahooData: UseWahooEngineReturn): 'low' | 'medium' | 'high' => {
    const { streak, consecutiveErrors, engagementLevel } = wahooData;
    
    if (streak > 10 && consecutiveErrors < 2 && engagementLevel === 'high') {
      return 'high';
    } else if (streak > 5 && consecutiveErrors < 5) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  const calculateMascotHappiness = (mascotData: UseMascotDataReturn, wahooData: UseWahooEngineReturn): number => {
    const baseHappiness = 50;
    const unlockBonus = mascotData.unlockedItems.length * 5;
    const engagementBonus = wahooData.engagementLevel === 'high' ? 20 : 
                           wahooData.engagementLevel === 'medium' ? 10 : 0;
    
    return Math.min(baseHappiness + unlockBonus + engagementBonus, 100);
  };

  return {
    studentMetrics,
    competencyMapping: COMPETENCY_MAPPING,
    loading,
    error,
    refresh: () => {
      setLoading(true);
      const metrics = buildStudentMetrics();
      setStudentMetrics(metrics);
      setLoading(false);
    }
  };
}; 