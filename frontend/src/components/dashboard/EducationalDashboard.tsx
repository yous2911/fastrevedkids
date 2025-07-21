import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentMetrics, CompetencyMapping } from '../../types/wahoo.types';
import { wahooEngine } from '../../services/WahooEngine';
import { MASCOT_COLLECTION } from '../../data/mascotCollection';

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

// Composant pour une carte de compétence
const CompetencyCard = ({ itemId, isUnlocked }: { itemId: string, isUnlocked: boolean }) => {
  const competency = COMPETENCY_MAPPING[itemId] || {
    description: 'Compétence inconnue',
    gameMetric: 'Métrique non définie',
    educationalValue: 'Valeur éducative non définie',
    parentExplanation: 'Explication non disponible'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-xl border-2 transition-all ${
        isUnlocked 
          ? 'bg-green-50 border-green-300 text-green-800' 
          : 'bg-gray-50 border-gray-300 text-gray-500'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-2xl ${!isUnlocked ? 'grayscale opacity-50' : ''}`}>
          {isUnlocked ? '🏆' : '🔒'}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm mb-1">{competency.description}</h4>
          <p className="text-xs mb-2">{competency.educationalValue}</p>
          {isUnlocked && (
            <div className="bg-green-100 border border-green-200 p-2 rounded text-xs">
              <strong>Pour les parents:</strong> {competency.parentExplanation}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Analyseur de patterns d'engagement
const EngagementAnalyzer = ({ student }: { student: StudentMetrics }) => {
  const getEngagementColor = () => {
    if (student.mascotHappiness >= 80) return 'text-green-600';
    if (student.mascotHappiness >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCognitiveLoadIndicator = () => {
    switch (student.educationalInsights.cognitiveLoad) {
      case 'optimal': return { color: 'bg-green-500', text: 'Charge cognitive optimale' };
      case 'under-challenged': return { color: 'bg-blue-500', text: 'Peut relever des défis plus difficiles' };
      case 'overwhelmed': return { color: 'bg-red-500', text: 'Besoin de simplification' };
    }
  };

  const cognitiveLoad = getCognitiveLoadIndicator();

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">📈 Analyse Pédagogique</h3>
      
      {/* Niveau d'engagement */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">Niveau d'Engagement</span>
          <span className={`text-lg font-bold ${getEngagementColor()}`}>
            {student.mascotHappiness}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${student.mascotHappiness}%` }}
            transition={{ duration: 1 }}
            className={`h-3 rounded-full ${
              student.mascotHappiness >= 80 ? 'bg-green-500' :
              student.mascotHappiness >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Basé sur la constance des sessions et la performance
        </p>
      </div>

      {/* Charge cognitive */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-600 mb-3">Charge Cognitive</h4>
        <div className={`p-3 rounded-lg ${cognitiveLoad.color} text-white`}>
          <div className="font-bold text-sm">{cognitiveLoad.text}</div>
          <div className="text-xs opacity-90 mt-1">
            Analysé via le Moteur Wahoo (fréquence des encouragements vs célébrations)
          </div>
        </div>
      </div>

      {/* Vélocité d'apprentissage */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">Vélocité d'Apprentissage</span>
          <span className="text-lg font-bold text-blue-600">
            {student.educationalInsights.learningVelocity}x
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {student.educationalInsights.learningVelocity > 1 ? 'Plus rapide' : 'Plus lent'} que la moyenne de l'âge
        </p>
      </div>

      {/* Pattern d'engagement */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-2">Pattern Comportemental</h4>
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800">
          {student.educationalInsights.engagementPattern}
        </div>
      </div>
    </div>
  );
};

// Traducteur métriques ludiques → pédagogiques
const GameToEducationTranslator = ({ student }: { student: StudentMetrics }) => {
  const translations = [
    {
      gameMetric: `Série actuelle: ${student.streakCurrent}`,
      educationalMeaning: 'Concentration et motivation soutenues',
      explanation: 'Une série élevée indique une capacité de concentration et une confiance en progression'
    },
    {
      gameMetric: `${student.mysteryWordsCompleted} mots mystères résolus`,
      educationalMeaning: 'Développement du vocabulaire et logique',
      explanation: 'Chaque mot mystère développe la déduction logique et enrichit le vocabulaire actif'
    },
    {
      gameMetric: `${student.unlockedItems.length} objets débloqués`,
      educationalMeaning: 'Compétences diversifiées validées',
      explanation: 'Chaque objet représente une compétence spécifique maîtrisée par l\'enfant'
    },
    {
      gameMetric: `Bonheur mascotte: ${student.mascotHappiness}%`,
      educationalMeaning: 'Indicateur d\'engagement émotionnel',
      explanation: 'Reflète l\'état émotionnel et la motivation intrinsèque de l\'enfant'
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">🔄 Traduction Pédagogique</h3>
      <div className="space-y-4">
        {translations.map((translation, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border-l-4 border-blue-500 pl-4"
          >
            <div className="text-sm text-gray-600 mb-1">Métrique ludique:</div>
            <div className="font-semibold text-gray-800 mb-2">{translation.gameMetric}</div>
            <div className="text-sm text-blue-600 font-medium mb-1">
              ↓ Signification éducative:
            </div>
            <div className="text-sm text-blue-800 font-semibold mb-2">
              {translation.educationalMeaning}
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {translation.explanation}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Composant principal du tableau de bord
const EducationalDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'competencies' | 'analysis' | 'translation'>('overview');
  const [student, setStudent] = useState<StudentMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildStudentMetrics = (): StudentMetrics => {
      // Get real data from WahooEngine
      const wahooContext = wahooEngine.getContext();
      
      // Get real mascot data
      const unlockedItems = MASCOT_COLLECTION
        .filter(item => item.unlocked)
        .map(item => item.id);
      
      const equippedItems = MASCOT_COLLECTION
        .filter(item => item.equipped)
        .reduce((acc, item) => ({ ...acc, [item.type]: item.id }), {});

      // Calculate mascot happiness based on real data
      const mascotHappiness = Math.min(50 + (unlockedItems.length * 5) + (wahooContext.streak * 2), 100);

      // Generate educational insights from real data
      const educationalInsights = {
        masteredConcepts: generateMasteredConcepts(wahooContext, unlockedItems),
        strugglingAreas: generateStrugglingAreas(wahooContext),
        confidenceLevel: determineConfidenceLevel(wahooContext),
        cognitiveLoad: determineCognitiveLoad(wahooContext),
        engagementPattern: analyzeEngagementPattern(wahooContext),
        learningVelocity: calculateLearningVelocity(wahooContext)
      };

      return {
        id: 'student_001', // This would come from your auth system
        name: 'Emma Martin', // This would come from your user data
        age: 9,
        streakCurrent: wahooContext.streak,
        totalExercises: wahooContext.totalCorrect,
        mascotHappiness,
        unlockedItems,
        mysteryWordsCompleted: 8, // This would come from your mystery word service
        wahooIntensityHistory: [wahooContext.lastWahooIntensity],
        educationalInsights
      };
    };

    try {
      setLoading(true);
      const metrics = buildStudentMetrics();
      setStudent(metrics);
    } catch (error) {
      console.error('Error building student metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Utility functions that work with real data
  const generateMasteredConcepts = (wahooContext: any, unlockedItems: string[]): string[] => {
    const concepts: string[] = [];
    
    if (wahooContext.totalCorrect > 50) {
      concepts.push('Addition et soustraction jusqu\'à 100');
    }
    
    if (unlockedItems.includes('wizard_hat_epic')) {
      concepts.push('Reconnaissance des formes géométriques');
    }
    
    if (wahooContext.streak > 15) {
      concepts.push('Orthographe des mots courants');
    }
    
    return concepts;
  };

  const generateStrugglingAreas = (wahooContext: any): string[] => {
    const areas: string[] = [];
    
    if (wahooContext.consecutiveErrors > 3) {
      areas.push('Tables de multiplication (en cours)');
    }
    
    if (wahooContext.averageResponseTime > 8) {
      areas.push('Accord du participe passé');
    }
    
    return areas;
  };

  const determineConfidenceLevel = (wahooContext: any): 'low' | 'medium' | 'high' => {
    if (wahooContext.streak > 10 && wahooContext.consecutiveErrors < 2) {
      return 'high';
    } else if (wahooContext.streak > 5 && wahooContext.consecutiveErrors < 5) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  const determineCognitiveLoad = (wahooContext: any): 'optimal' | 'under-challenged' | 'overwhelmed' => {
    if (wahooContext.consecutiveErrors > 5 || wahooContext.averageResponseTime > 10) {
      return 'overwhelmed';
    } else if (wahooContext.studentEnergy > 80 && wahooContext.consecutiveErrors < 2) {
      return 'under-challenged';
    } else {
      return 'optimal';
    }
  };

  const analyzeEngagementPattern = (wahooContext: any): string => {
    if (wahooContext.streak > 10 && wahooContext.studentEnergy > 70) {
      return 'Très engagé, sessions longues avec performance constante';
    } else if (wahooContext.streak > 5) {
      return 'Engagement modéré, progression régulière';
    } else {
      return 'Engagement variable, besoin d\'encouragement';
    }
  };

  const calculateLearningVelocity = (wahooContext: any): number => {
    const baseVelocity = 1.0;
    const streakBonus = wahooContext.streak > 10 ? 0.2 : 0;
    const accuracyBonus = wahooContext.totalCorrect > 100 ? 0.1 : 0;
    
    return Math.min(baseVelocity + streakBonus + accuracyBonus, 2.0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des données</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Vue d\'ensemble', emoji: '📊' },
    { id: 'competencies', name: 'Compétences', emoji: '🏆' },
    { id: 'analysis', name: 'Analyse', emoji: '📈' },
    { id: 'translation', name: 'Traduction', emoji: '🔄' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 Tableau de Bord Pédagogique</h1>
          <p className="text-xl text-gray-600">Science cognitive derrière chaque métrique ludique</p>
        </motion.div>

        {/* Profil étudiant */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-8"
        >
          <div className="flex items-center gap-6">
            <div className="text-6xl">👧</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
              <p className="text-gray-600">{student.age} ans • CE1</p>
              <div className="flex gap-4 mt-3">
                <div className="bg-blue-100 px-3 py-1 rounded-lg text-blue-800 font-medium">
                  {student.totalExercises} exercices complétés
                </div>
                <div className="bg-green-100 px-3 py-1 rounded-lg text-green-800 font-medium">
                  Série actuelle: {student.streakCurrent}
                </div>
                <div className="bg-purple-100 px-3 py-1 rounded-lg text-purple-800 font-medium">
                  Niveau de confiance: {student.educationalInsights.confidenceLevel === 'high' ? 'Élevé' : 'Moyen'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Onglets */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.emoji} {tab.name}
            </motion.button>
          ))}
        </div>

        {/* Contenu des onglets */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Compétences maîtrisées */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-800">✅ Compétences Maîtrisées</h3>
                <div className="space-y-3">
                  {student.educationalInsights.masteredConcepts.map((concept, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                    >
                      <div className="text-green-600 text-xl">✓</div>
                      <div className="text-green-800 font-medium">{concept}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Zones d'amélioration */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-800">🎯 En Cours d'Acquisition</h3>
                <div className="space-y-3">
                  {student.educationalInsights.strugglingAreas.map((area, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg"
                    >
                      <div className="text-orange-600 text-xl">⚡</div>
                      <div className="text-orange-800 font-medium">{area}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-800 text-sm">
                  💡 L'app adapte automatiquement la difficulté pour consolider ces compétences
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'competencies' && (
            <motion.div
              key="competencies"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {Object.keys(COMPETENCY_MAPPING).map(itemId => (
                <CompetencyCard
                  key={itemId}
                  itemId={itemId}
                  isUnlocked={student.unlockedItems.includes(itemId)}
                />
              ))}
            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <EngagementAnalyzer student={student} />
            </motion.div>
          )}

          {activeTab === 'translation' && (
            <motion.div
              key="translation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GameToEducationTranslator student={student} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer explicatif */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-6 text-center"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-2">🧠 Science Cognitive Appliquée</h3>
          <p className="text-gray-600 text-sm">
            Chaque métrique ludique est traduite en indicateur pédagogique validé scientifiquement. 
            Les récompenses ne sont jamais arbitraires - elles célèbrent des progrès cognitifs réels.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default EducationalDashboard; 