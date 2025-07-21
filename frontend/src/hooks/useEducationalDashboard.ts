import { useState, useEffect } from 'react';
import { StudentMetrics, CompetencyMapping } from '../types/wahoo.types';
import { useWahooEngine, UseWahooEngineReturn } from './useWahooEngine';
import { useMascotData, UseMascotDataReturn } from './useMascotData';
import { useStudentData, UseStudentDataReturn } from './useStudentData';

// Mapping entre métriques ludiques et compétences éducatives
const COMPETENCY_MAPPING: CompetencyMapping = {
  'wizard_hat': {
    description: 'Chapeau de Magicien',
    gameMetric: 'Objet débloqué par 10 exercices de maths',
    educationalValue: 'Maîtrise des opérations de base (addition/soustraction)',
    parentExplanation: 'Votre enfant a démontré une compréhension solide des calculs fondamentaux'
  },
  'crown': {
    description: 'Couronne Royale',
    gameMetric: 'Série de 20 bonnes réponses',
    educationalValue: 'Excellence en résolution de problèmes et concentration',
    parentExplanation: 'Votre enfant fait preuve d\'une concentration exceptionnelle et d\'une maîtrise avancée'
  },
  'detective_hat': {
    description: 'Chapeau de Détective',
    gameMetric: 'Résolution de 5 mots mystères',
    educationalValue: 'Développement du vocabulaire et logique déductive',
    parentExplanation: 'Votre enfant enrichit son vocabulaire et développe sa capacité de déduction'
  },
  'smart_glasses': {
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

  // Hooks pour récupérer les données
  const wahooData = useWahooEngine();
  const mascotData = useMascotData();
  const studentData = useStudentData();

  useEffect(() => {
    const generateEducationalInsights = () => {
      if (!wahooData || !mascotData || !studentData) return null;

      // Analyser les patterns d'engagement
      const engagementPattern = analyzeEngagementPattern(wahooData);
      
      // Calculer la vélocité d'apprentissage
      const learningVelocity = calculateLearningVelocity(wahooData, studentData);
      
      // Déterminer la charge cognitive
      const cognitiveLoad = determineCognitiveLoad(wahooData);
      
      // Identifier les compétences maîtrisées
      const masteredConcepts = identifyMasteredConcepts(mascotData, wahooData);
      
      // Identifier les zones d'amélioration
      const strugglingAreas = identifyStrugglingAreas(wahooData, studentData);

      return {
        masteredConcepts,
        strugglingAreas,
        confidenceLevel: determineConfidenceLevel(wahooData),
        cognitiveLoad,
        engagementPattern,
        learningVelocity
      };
    };

    const buildStudentMetrics = (): StudentMetrics | null => {
      if (!wahooData || !mascotData || !studentData) return null;

      const educationalInsights = generateEducationalInsights();
      if (!educationalInsights) return null;

      return {
        id: studentData.id,
        name: studentData.name,
        age: studentData.age,
        streakCurrent: wahooData.streak,
        totalExercises: wahooData.totalCorrect,
        mascotHappiness: calculateMascotHappiness(mascotData),
        unlockedItems: mascotData.unlockedItems || [],
        mysteryWordsCompleted: wahooData.mysteryWordsCompleted || 0,
        wahooIntensityHistory: wahooData.intensityHistory || [],
        educationalInsights
      };
    };

    try {
      setLoading(true);
      const metrics = buildStudentMetrics();
      setStudentMetrics(metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des métriques');
    } finally {
      setLoading(false);
    }
  }, [wahooData, mascotData, studentData]);

  return {
    studentMetrics,
    competencyMapping: COMPETENCY_MAPPING,
    loading,
    error
  };
};

// Fonctions utilitaires pour l'analyse pédagogique
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

const calculateLearningVelocity = (wahooData: UseWahooEngineReturn, studentData: UseStudentDataReturn): number => {
  // Calcul basé sur la progression par rapport à la moyenne de l'âge
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
  
  if (mascotData.unlockedItems?.includes('wizard_hat')) {
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

const identifyStrugglingAreas = (wahooData: UseWahooEngineReturn, studentData: UseStudentDataReturn): string[] => {
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

const calculateMascotHappiness = (mascotData: UseMascotDataReturn): number => {
  // Calcul basé sur les objets débloqués et l'engagement
  const baseHappiness = 50;
  const unlockBonus = (mascotData.unlockedItems?.length || 0) * 5;
  const engagementBonus = 20; // À ajuster selon l'engagement réel
  
  return Math.min(baseHappiness + unlockBonus + engagementBonus, 100);
}; 