import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ExercisesPage } from './pages/Exercises';
import { Profile } from './pages/Profile';
import { AppProvider, useApp } from './context/AppContext';
import { useToast } from './components/ui/Toast';
import { FrenchPhonicsGame } from './components/games/FrenchPhonicsGame';
import FrenchMathsGame from './components/games/FrenchMathsGame';

type AppScreen = 'login' | 'dashboard' | 'exercises' | 'profile' | 'phonics-game' | 'maths-game' | 'exercise-session';

interface Exercise {
  id: number;
  type: string;
  configuration: any;
  xp: number;
  difficulte: string;
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('login');
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const { state, login, logout } = useApp();
  const { ToastContainer } = useToast();

  // Check for existing auth token on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        // Verify token with backend
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            login(data.data);
            setCurrentScreen('dashboard');
          } else {
            localStorage.removeItem('auth_token');
          }
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (err) {
        localStorage.removeItem('auth_token');
      }
    }
  };

  const handleLoginSuccess = () => {
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    logout();
    setCurrentScreen('login');
  };

  const handleNavigate = (path: string) => {
    switch (path) {
      case '/dashboard':
        setCurrentScreen('dashboard');
        break;
      case '/exercises':
        setCurrentScreen('exercises');
        break;
      case '/profile':
        setCurrentScreen('profile');
        break;
      case '/phonics-game':
        setCurrentScreen('phonics-game');
        break;
      case '/maths-game':
        setCurrentScreen('maths-game');
        break;
      default:
        setCurrentScreen('dashboard');
    }
  };

  const handleStartExercise = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    setCurrentScreen('exercise-session');
  };

  const handleExerciseComplete = () => {
    setCurrentExercise(null);
    setCurrentScreen('dashboard');
  };

  const renderBackButton = (targetScreen: AppScreen = 'dashboard') => (
    <motion.button
      onClick={() => setCurrentScreen(targetScreen)}
      className="fixed top-6 left-6 z-50 bg-white/20 backdrop-blur-lg text-white px-4 py-2 rounded-2xl font-bold hover:bg-white/30 transition-colors"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      ⬅️ Retour
    </motion.button>
  );

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} />;

      case 'dashboard':
        return (
          <Dashboard
            onNavigate={handleNavigate}
            onStartExercise={handleStartExercise}
            onLogout={handleLogout}
          />
        );

      case 'exercises':
        return (
          <ExercisesPage
            onBack={() => setCurrentScreen('dashboard')}
            onStartExercise={handleStartExercise}
          />
        );

      case 'profile':
        return (
          <Profile
            onBack={() => setCurrentScreen('dashboard')}
          />
        );

      case 'phonics-game':
        return (
          <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
            {renderBackButton()}
            <FrenchPhonicsGame />
          </div>
        );

      case 'maths-game':
        return (
          <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900">
            {renderBackButton()}
            <FrenchMathsGame />
          </div>
        );

      case 'exercise-session':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            {renderBackButton('exercises')}
            <ExerciseSession
              exercise={currentExercise}
              onComplete={handleExerciseComplete}
              onExit={() => setCurrentScreen('exercises')}
            />
          </div>
        );

      default:
        return <Dashboard onNavigate={handleNavigate} onStartExercise={handleStartExercise} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="App">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentScreen()}
        </motion.div>
      </AnimatePresence>
      
      <ToastContainer />
    </div>
  );
}

// Simple Exercise Session Component
const ExerciseSession: React.FC<{
  exercise: Exercise | null;
  onComplete: () => void;
  onExit: () => void;
}> = ({ exercise, onComplete, onExit }) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Exercice non trouvé</h2>
          <button
            onClick={onExit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Retour aux exercices
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/students/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exerciseId: exercise.id,
          reponse: answer,
          tempsReponse: 30, // seconds
          pointsGagnes: 0 // will be calculated by backend
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsCorrect(data.data.estCorrect);
          setShowResult(true);
          
          setTimeout(() => {
            onComplete();
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Error submitting exercise:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md w-full"
        >
          <div className={`text-6xl mb-4 ${isCorrect ? 'animate-bounce' : ''}`}>
            {isCorrect ? '🎉' : '💪'}
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-600' : 'text-blue-600'}`}>
            {isCorrect ? 'Excellent !' : 'Bien essayé !'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isCorrect 
              ? `Bravo ! Tu as gagné ${exercise.xp} points !`
              : 'Continue tes efforts, tu vas y arriver !'
            }
          </p>
          <div className="text-sm text-gray-500">
            Retour automatique dans quelques secondes...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <span>{exercise.type}</span>
              <span>•</span>
              <span>{exercise.difficulte}</span>
              <span>•</span>
              <span>{exercise.xp} XP</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Exercice
            </h1>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-medium text-gray-800 mb-4">
              {exercise.configuration.question}
            </h2>

            {exercise.configuration.operation && (
              <div className="text-3xl font-mono text-center text-blue-600 mb-6 p-4 bg-blue-50 rounded-xl">
                {exercise.configuration.operation}
              </div>
            )}

            {exercise.configuration.choix ? (
              // Multiple choice
              <div className="space-y-3">
                {exercise.configuration.choix.map((choice: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setAnswer(choice)}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      answer === choice
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {choice}
                  </button>
                ))}
              </div>
            ) : (
              // Text input
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Tape ta réponse ici..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-lg text-center"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onExit}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-xl transition-colors font-medium"
            >
              Abandonner
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || isSubmitting}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Validation...
                </>
              ) : (
                'Valider ✨'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Main App with Provider
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
