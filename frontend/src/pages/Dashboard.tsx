import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudentData } from '../hooks/useStudentData';
import { useEducationData } from '../hooks/useEducationData';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ExercicePedagogique } from '../types/api.types';

interface DashboardProps {
  onNavigate: (path: string) => void;
  onStartExercise: (exercise: ExercicePedagogique) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onStartExercise }) => {
  const { state } = useApp();
  const { currentStudent } = state;
  
  const {
    student,
    studentLoading,
    recommendations,
    recommendationsLoading,
    progress,
    progressLoading
  } = useStudentData(currentStudent?.id || 0);

  const { stats, statsLoading } = useEducationData();
  const [greeting, setGreeting] = useState('');

  // Generate dynamic greeting
  useEffect(() => {
    const hour = new Date().getHours();
    const name = currentStudent?.prenom || 'Champion';
    
    if (hour < 12) {
      setGreeting(`Bonjour ${name} ! 🌅`);
    } else if (hour < 17) {
      setGreeting(`Bon après-midi ${name} ! ☀️`);
    } else if (hour < 21) {
      setGreeting(`Bonsoir ${name} ! 🌆`);
    } else {
      setGreeting(`Bonne soirée ${name} ! 🌙`);
    }
  }, [currentStudent]);

  if (studentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" message="Chargement de ton tableau de bord..." />
      </div>
    );
  }

  if (!student || !currentStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card variant="elevated" padding="lg" className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Impossible de charger tes données
          </h2>
          <p className="text-gray-600 mb-4">
            Vérifie ta connexion internet
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  const getMascotMessage = () => {
    const messages = {
      dragon: ['Prêt à conquérir de nouveaux défis ? 🐉', 'Ta flamme d\'apprentissage brûle fort !'],
      fairy: ['Laisse la magie t\'emporter vers de nouveaux savoirs ! ✨', 'Chaque exercice est une nouvelle étoile !'],
      robot: ['Calculs en cours... Apprentissage optimal détecté ! 🤖', 'Système éducatif: ACTIVÉ !'],
      cat: ['Ronron... Il est temps d\'apprendre ! 🐱', 'Curiosité féline activée !'],
      owl: ['La sagesse t\'appelle, jeune apprenti ! 🦉', 'Hoot hoot ! L\'école continue !']
    };
    
    const mascotMessages = messages[currentStudent.mascotteType] || messages.dragon;
    return mascotMessages[Math.floor(Math.random() * mascotMessages.length)];
  };

  const getStreakMessage = () => {
    const streak = student.eleve.serieJours;
    if (streak >= 7) return `🔥 ${streak} jours consécutifs ! Tu es en feu !`;
    if (streak >= 3) return `⭐ ${streak} jours d'affilée ! Continue !`;
    if (streak >= 1) return `💪 ${streak} jour${streak > 1 ? 's' : ''} ! C'est parti !`;
    return '🚀 Commence ta série aujourd\'hui !';
  };

  const getProgressPercentage = () => {
    if (!student.stats.totalExercises) return 0;
    return Math.round((student.stats.completedExercises / student.stats.totalExercises) * 100);
  };

  const getLevelProgress = () => {
    const totalPoints = student.eleve.totalPoints;
    const currentLevelPoints = totalPoints % 100; // Assuming 100 points per level
    return currentLevelPoints;
  };

  const getNextLevel = () => {
    const totalPoints = student.eleve.totalPoints;
    return Math.floor(totalPoints / 100) + 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-display font-bold text-magical-violet mb-2 animate-bounce-happy">
            {greeting}
          </h1>
          <p className="text-lg font-magical text-magical-blue">
            {getMascotMessage()}
          </p>
        </motion.div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="magical" padding="md" className="text-center">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-2xl font-bold text-magical-violet animate-xp-sparkle">
                {student.eleve.totalPoints}
              </div>
              <div className="text-sm text-gray-600">Points totaux</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated" padding="md" className="text-center">
              <div className="text-3xl mb-2">📚</div>
              <div className="text-2xl font-bold text-magical-blue">
                {student.stats.completedExercises}
              </div>
              <div className="text-sm text-gray-600">Exercices réussis</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="elevated" padding="md" className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-2xl font-bold text-success-500">
                {Math.round(student.stats.successRate)}%
              </div>
              <div className="text-sm text-gray-600">Taux de réussite</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="elevated" padding="md" className="text-center">
              <div className="text-3xl mb-2">🔥</div>
              <div className="text-2xl font-bold text-energy-500">
                {student.eleve.serieJours}
              </div>
              <div className="text-sm text-gray-600">Jours consécutifs</div>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Progress Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card variant="magical" padding="lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📈 Ta progression
                </h2>
                
                <div className="space-y-4">
                  {/* Level Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Niveau {Math.floor(student.eleve.totalPoints / 100) || 1}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getLevelProgress()}/100 points
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${getLevelProgress()}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {100 - getLevelProgress()} points pour le niveau {getNextLevel()}
                    </p>
                  </div>

                  {/* Overall Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Progression globale
                      </span>
                      <span className="text-sm text-gray-500">
                        {getProgressPercentage()}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                  </div>

                  {/* Streak */}
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <p className="text-center font-medium text-orange-800">
                      {getStreakMessage()}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Recommended Exercises */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card variant="elevated" padding="lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    🎯 Exercices recommandés
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate('/exercises')}
                  >
                    Voir tout
                  </Button>
                </div>

                {recommendationsLoading ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="md" message="Chargement..." />
                  </div>
                ) : recommendations && recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.slice(0, 3).map((exercise, index) => (
                      <motion.div
                        key={exercise.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => onStartExercise(exercise)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {exercise.type === 'QCM' && '❓'}
                              {exercise.type === 'CALCUL' && '🔢'}
                              {exercise.type === 'TEXTE_LIBRE' && '✏️'}
                              {exercise.type === 'DRAG_DROP' && '🎯'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {exercise.type}
                              </p>
                              <p className="text-sm text-gray-600 truncate max-w-xs">
                                {exercise.configuration.question}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-blue-600">
                              +{exercise.xp} XP
                            </div>
                            <div className="text-xs text-gray-500">
                              {exercise.difficulte}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-gray-600">
                      Aucun exercice recommandé pour le moment
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card variant="elevated" padding="lg">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  🚀 Actions rapides
                </h2>
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={() => onNavigate('/exercises')}
                    icon={<span>📚</span>}
                  >
                    Faire un exercice
                  </Button>
                  
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => onNavigate('/progress')}
                    icon={<span>📊</span>}
                  >
                    Voir ma progression
                  </Button>
                  
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => onNavigate('/achievements')}
                    icon={<span>🏆</span>}
                  >
                    Mes récompenses
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Mascot Corner */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card variant="magical" padding="lg" className="text-center">
                <div className="text-6xl mb-3">
                  {currentStudent.mascotteType === 'dragon' && '🐉'}
                  {currentStudent.mascotteType === 'fairy' && '🧚‍♀️'}
                  {currentStudent.mascotteType === 'robot' && '🤖'}
                  {currentStudent.mascotteType === 'cat' && '🐱'}
                  {currentStudent.mascotteType === 'owl' && '🦉'}
                </div>
                <h3 className="font-bold text-gray-800 mb-2">
                  Ton compagnon d'apprentissage
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {getMascotMessage()}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('/profile')}
                  className="text-purple-600"
                >
                  Personnaliser
                </Button>
              </Card>
            </motion.div>

            {/* Fun Facts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card variant="outlined" padding="md">
                <h3 className="font-bold text-gray-800 mb-3 text-center">
                  💡 Le savais-tu ?
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Ton cerveau grandit à chaque exercice !</p>
                  <p>• Tu as déjà appris {student.stats.completedExercises} nouvelles choses !</p>
                  <p>• Chaque erreur te rend plus intelligent !</p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}; 