import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { ExerciseEngine } from '../components/exercise/ExerciseEngine';
import { SimpleExerciseComponent } from '../components/exercise/SimpleExerciseComponent';
import { useAuth } from '../contexts/FastRevKidsAuth';
import { useRandomExercises } from '../hooks/useFastRevKidsApi';
import { useToast } from '../components/ui/Toast';
import { Exercise } from '../services/fastrevkids-api.service';

// Import des composants visuels avancés
import NextLevelXPSystem from '../components/ui/NextLevelXPSystem';
import CrossBrowserMascot3D from '../components/CrossBrowserMascot3D';
import AdvancedParticleEngine from '../components/ui/AdvancedParticleEngine';

// Local interface IFor backend data
interface BackendExercise {
  id: number;
  titre: string;
  description: string;
  type: string;
  configuration: string | {
    question: string;
    choix?: string[];
    bonneReponse?: string | number;
    operation?: string;
    resultat?: number;
    correctAnswer?: string;
    options?: string[];
    explanation?: string;
  };
  xp: number;
  difficulte: 'FACILE' | 'MOYEN' | 'DIFFICILE';
  createdAt: string;
  updatedAt: string;
}

interface TestResult {
  exerciseId: number;
  correct: boolean;
  attempts: number;
  xpEarned: number;
  timeSpent?: number;
  timestamp: string;
}

export const ExerciseEngineTest: React.FC = () => {
  const { student, isAuthenticated } = useAuth();
  const { data: exercises, isLoading: exercisesLoading } = useRandomExercises(student?.niveau || 'CP', 10);
  const { success, error, warning } = useToast();
  
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<'simple' | 'full' | 'adaptive'>('full');
  const [showResults, setShowResults] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    difficulty: 'all',
    subject: 'all'
  });

  // États pour les effets visuels
  const [showVisualEffects, setShowVisualEffects] = useState(true);
  const [currentXP, setCurrentXP] = useState(750);
  const [maxXP] = useState(1000);
  const [level, setLevel] = useState(5);
  const [xpGained, setXpGained] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [mascotEmotion, setMascotEmotion] = useState<'idle' | 'happy' | 'thinking' | 'celebrating' | 'oops'>('idle');

  // Load exercises from backend
  useEffect(() => {
    if (isAuthenticated) {
      loadExercises();
    }
  }, [isAuthenticated, filters]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      let url = 'http://localhost:3003/api/subjects/exercises';
      
      const params = new URLSearchParams();
      if (filters.subject !== 'all') params.append('matiere', filters.subject);
      if (filters.difficulty !== 'all') params.append('difficulte', filters.difficulty);
      if (filters.type !== 'all') params.append('type', filters.type);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Exercises loaded successfully:', data);
        if (data.success) {
          // setExercises(data.data || []);
          success(`Loaded ${data.data?.length || 0} exercises`);
        } else {
          error('Failed to load exercises');
        }
      } else {
        error(`Failed to load exercises: ${response.status}`);
      }
    } catch (err) {
      error('Error loading exercises');
      console.error('Error loading exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseComplete = (result: any) => {
    const testResult: TestResult = {
      exerciseId: result.exerciseId,
      correct: result.correct,
      attempts: result.attempts,
      xpEarned: result.xpEarned,
      timeSpent: result.timeSpent,
      timestamp: new Date().toISOString()
    };

    setTestResults(prev => [...prev, testResult]);
    
    // Effets visuels pour la réussite
    if (result.correct) {
      setMascotEmotion('celebrating');
      setXpGained(result.xpEarned);
      setCurrentXP(prev => prev + result.xpEarned);
      setShowCelebration(true);
      
      // Vérifier le level up
      const newLevel = Math.floor((currentXP + result.xpEarned) / 200) + 1;
      if (newLevel > level) {
        setLevel(newLevel);
        setMascotEmotion('happy');
      }
      
      success(`✅ Exercise completed! XP earned: ${result.xpEarned}`);
      
      // Réinitialiser les effets après 3 secondes
      setTimeout(() => {
        setShowCelebration(false);
        setMascotEmotion('idle');
        setXpGained(0);
      }, 3000);
    } else {
      setMascotEmotion('oops');
      warning(`⚠️ Exercise completed with ${result.attempts} attempts`);
      
      setTimeout(() => {
        setMascotEmotion('idle');
      }, 2000);
    }

    // Auto-advance to next exercise after 2 seconds
    setTimeout(() => {
      const currentIndex = exercises.findIndex(ex => ex.id === currentExercise?.id);
      const nextExercise = exercises[currentIndex + 1];
      if (nextExercise) {
        setCurrentExercise(nextExercise);
      } else {
        setCurrentExercise(null);
        setShowResults(true);
      }
    }, 2000);
  };

  const handleExerciseExit = () => {
    setCurrentExercise(null);
    setShowResults(true);
  };

  const startExercise = (exercise: BackendExercise) => {
    // Convert BackendExercise to Exercise format
    const convertedExercise: Exercise = {
      id: exercise.id,
      competenceId: 1, // Default value
      type: exercise.type as Exercise['type'],
      question: exercise.titre,
      correctAnswer: '', // Will be parsed from configuration
      options: typeof exercise.configuration === 'string' ? JSON.parse(exercise.configuration) : exercise.configuration,
      difficultyLevel: exercise.difficulte === 'FACILE' ? 1 : exercise.difficulte === 'MOYEN' ? 2 : 3,
      xpReward: exercise.xp,
      timeLimit: 300, // Default 5 minutes
      hintsAvailable: 2,
      hintsText: [],
      metadata: {}
    };
    
    setCurrentExercise(convertedExercise);
    setShowResults(false);
    setMascotEmotion('thinking');
  };

  const resetTest = () => {
    setTestResults([]);
    setCurrentExercise(null);
    setShowResults(false);
    setCurrentXP(750);
    setLevel(5);
    setXpGained(0);
  };


  const getExerciseTypeInfo = (type: string) => {
    const TYPES = {
      QCM: { name: 'Choix multiples', emoji: '☑️', color: 'bg-blue-100 text-blue-800' },
      CALCUL: { name: 'Calcul', emoji: '🧮', color: 'bg-purple-100 text-purple-800' },
      TEXTE_LIBRE: { name: 'Texte libre', emoji: '✏️', color: 'bg-green-100 text-green-800' },
      DRAG_DROP: { name: 'Glisser-déposer', emoji: '🎯', color: 'bg-orange-100 text-orange-800' },
      CONJUGAISON: { name: 'Conjugaison', emoji: '📖', color: 'bg-pink-100 text-pink-800' },
      GEOMETRIE: { name: 'Géométrie', emoji: '📐', color: 'bg-indigo-100 text-indigo-800' },
      LECTURE: { name: 'Lecture', emoji: '📚', color: 'bg-yellow-100 text-yellow-800' }
    };
    return TYPES[type as keyof typeof TYPES] || { name: type, emoji: '❓', color: 'bg-gray-100 text-gray-800' };
  };

  const getDifficultyColor = (difficulty: string) => {
    const COLORS = {
      'FACILE': 'bg-green-100 text-green-800',
      'MOYEN': 'bg-yellow-100 text-yellow-800',
      'DIFFICILE': 'bg-red-100 text-red-800'
    };
    return COLORS[difficulty as keyof typeof COLORS] || 'bg-gray-100 text-gray-800';
  };

  const renderExerciseEngine = () => {
    if (!currentExercise || !student) return null;

    const COMMON_PROPS = {
      exercise: currentExercise,
      onComplete: handleExerciseComplete,
      onExit: handleExerciseExit
    };

    switch (selectedEngine) {
      case 'simple':
        return <SimpleExerciseComponent {...COMMON_PROPS} />;
      case 'full':
      default:
        return <ExerciseEngine {...COMMON_PROPS} />;
    }
  };

  const renderTestResults = () => {
    if (!showResults || testResults.length === 0) return null;

    const totalExercises = testResults.length;
    const correctAnswers = testResults.filter(r => r.correct).length;
    const totalXP = testResults.reduce((sum, r) => sum + r.xpEarned, 0);
    const averageAttempts = testResults.reduce((sum, r) => sum + r.attempts, 0) / totalExercises;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6 mb-6"
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-4">📊 Test Results</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalExercises}</div>
            <div className="text-sm text-blue-600">Exercises</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
            <div className="text-sm text-green-600">Correct</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{totalXP}</div>
            <div className="text-sm text-yellow-600">XP Earned</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{averageAttempts.toFixed(1)}</div>
            <div className="text-sm text-purple-600">Avg Attempts</div>
          </div>
        </div>

        <div className="space-y-2">
          {testResults.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${result.correct ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">Exercise {result.exerciseId}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{result.attempts} attempts</span>
                <span>{result.xpEarned} XP</span>
                {result.timeSpent && <span>{result.timeSpent}s</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-4">
          <Button
            onClick={resetTest}
            variant="primary"
            size="md"
          >
            🔄 Reset Test
          </Button>
          <Button
            onClick={() => setShowResults(false)}
            variant="secondary"
            size="md"
          >
            ← Back to Exercises
          </Button>
        </div>
      </motion.div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">🔒 Authentication Required</h1>
          <p className="text-gray-600">Please log in to test the exercise engine.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* TEST MESSAGE - REMOVE THIS AFTER TESTING */}
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ <strong>Exercise Engine Test Page Loaded Successfully!</strong> If you can see this message, the routing is working.
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🧪 Exercise Engine Test</h1>
          <p className="text-gray-600">Test the real exercise engine with backend data</p>
        </div>

        {/* Visual Effects Toggle */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">🎨 Visual Effects</h3>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showVisualEffects}
                onChange={(e) => setShowVisualEffects(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-COLORS ${
                showVisualEffects ? 'bg-purple-600' : 'bg-gray-300'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showVisualEffects ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {showVisualEffects ? 'ON' : 'OFF'}
              </span>
            </label>
          </div>
        </div>

        {/* Visual Effects Section */}
        {showVisualEffects && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* XP System */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h4 className="text-lg font-bold text-gray-800 mb-3">💎 XP System</h4>
              <NextLevelXPSystem
                currentXP={currentXP}
                maxXP={maxXP}
                level={level}
                xpGained={xpGained}
                theme="crystal"
                size="normal"
              />
            </div>

            {/* 3D Mascot */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h4 className="text-lg font-bold text-gray-800 mb-3">🐉 3D Mascot</h4>
              <div className="flex justify-center">
                <CrossBrowserMascot3D
                  mascotType="dragon"
                  emotion={mascotEmotion}
                  items={["crystal", "wand", "hat"]}
                  xpLevel={level}
                  size="medium"
                />
              </div>
            </div>

            {/* Particle Engine */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h4 className="text-lg font-bold text-gray-800 mb-3">✨ Particle Engine</h4>
              <div className="h-32 relative overflow-hidden rounded-lg">
                <AdvancedParticleEngine
                  particleType="sparkle"
                  intensity="medium"
                  isActive={showCelebration}
                />
              </div>
            </div>
          </div>
        )}

        {/* Engine Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎮 Select Engine</h3>
          <div className="flex gap-4">
            {[
              { key: 'simple', name: 'Simple Engine', desc: 'Basic exercise component' },
              { key: 'full', name: 'Full Engine', desc: 'Complete exercise engine with all features' }
            ].map(({ key, name, desc }) => (
              <button
                key={key}
                onClick={() => setSelectedEngine(key as any)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  selectedEngine === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">{name}</div>
                <div className="text-sm text-gray-600">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🔍 Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="p-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="QCM">QCM</option>
              <option value="CALCUL">Calcul</option>
              <option value="TEXTE_LIBRE">Text</option>
              <option value="DRAG_DROP">Drag & Drop</option>
            </select>
            
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="p-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Difficulties</option>
              <option value="FACILE">Easy</option>
              <option value="MOYEN">Medium</option>
              <option value="DIFFICILE">Hard</option>
            </select>
            
            <select
              value={filters.subject}
              onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              className="p-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Subjects</option>
              <option value="MATHEMATIQUES">Math</option>
              <option value="FRANCAIS">French</option>
              <option value="SCIENCES">Science</option>
            </select>
          </div>
        </div>

        {/* Current Exercise */}
        {currentExercise && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Current Exercise</h3>
            {renderExerciseEngine()}
          </div>
        )}

        {/* Test Results */}
        {renderTestResults()}

        {/* Exercise List */}
        {!currentExercise && !showResults && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                📚 Available Exercises ({exercises.length})
              </h3>
              {loading && <div className="text-blue-600">Loading...</div>}
            </div>

            {exercises.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {loading ? 'Loading exercises...' : 'No exercises found with current filters'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exercises.map((exercise) => {
                  const typeInfo = getExerciseTypeInfo(exercise.type);
                  const difficultyColor = getDifficultyColor('FACILE'); // Default since exercise doesn't have difficulte
                  
                  return (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
                      onClick={() => {
                        // Create a mock BackendExercise to satisfy the startExercise function
                        const mockBackendExercise = {
                          id: exercise.id,
                          titre: exercise.question,
                          description: exercise.question,
                          type: exercise.type,
                          configuration: JSON.stringify(exercise.options || {}),
                          xp: exercise.xpReward,
                          difficulte: exercise.difficultyLevel === 1 ? 'FACILE' as const : exercise.difficultyLevel === 2 ? 'MOYEN' as const : 'DIFFICILE' as const,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        };
                        startExercise(mockBackendExercise);
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.emoji} {typeInfo.name}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyColor}`}>
                          Level {exercise.difficultyLevel}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-gray-800 mb-2">{exercise.question}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        Exercise with {exercise.xpReward} XP reward
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>🎯 {exercise.xpReward} XP</span>
                        <span>📊 Level {exercise.difficultyLevel}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseEngineTest; 