import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/FastRevKidsAuth';
import { useStudentProgress, useStudentStats, useStudentAchievements, useRandomExercises, useCompetences } from '../hooks/useFastRevKidsApi';
import { apiService } from '../services/fastrevkids-api.service';
import MasteryLevelsCard from '../components/dashboard/MasteryLevelsCard';
import PrerequisiteVisualization from '../components/dashboard/PrerequisiteVisualization';
import AchievementBadges from '../components/dashboard/AchievementBadges';
import AnalyticsCharts from '../components/dashboard/AnalyticsCharts';

interface Student {
  id: number;
  prenom: string;
  nom: string;
  niveauActuel: string;
  totalPoints: number;
  serieJours: number;
  mascotteType: string;
  stats: {
    totalExercises: number;
    completedExercises: number;
    successRate: number;
    totalTime: number;
  };
}

interface CompetenceProgress {
  id: number;
  competenceCode: string;
  niveau: string;
  matiere: string;
  domaine: string;
  masteryLevel: string;
  progressPercent: number;
  totalAttempts: number;
  successfulAttempts: number;
  averageScore: number;
  totalTimeSpent: number;
  consecutiveSuccesses: number;
  lastAttemptAt: string;
  masteredAt?: string;
}

interface Achievement {
  id: number;
  achievementCode: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  xpReward: number;
  badgeIconUrl: string;
  currentProgress: number;
  maxProgress: number;
  progressPercentage: number;
  isCompleted: boolean;
  completedAt?: string;
  displayOrder: number;
}

interface Exercise {
  id: number;
  type: string;
  configuration: {
    question: string;
    difficulte: string;
  };
  xp: number;
  difficulte: string;
  sousChapitre?: {
    titre: string;
    chapitre: {
      titre: string;
      matiere: {
        nom: string;
      };
    };
  };
}

interface DashboardProps {
  onNavigate: (path: string) => void;
  onStartExercise: (exercise: Exercise) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onStartExercise, onLogout }) => {
  const [greeting, setGreeting] = useState('');

  // Get student from auth context
  const { student } = useAuth();
  
  // Use API hooks for data fetching
  const { data: progressData, isLoading: progressLoading } = useStudentProgress();
  const { data: statsData, isLoading: statsLoading } = useStudentStats(); 
  const { data: achievementsData, isLoading: achievementsLoading } = useStudentAchievements();
  const { data: recommendations, isLoading: recommendationsLoading } = useRandomExercises(student?.niveau || 'CP', 3);
  
  const dataLoading = progressLoading || statsLoading || achievementsLoading || recommendationsLoading;

  useEffect(() => {
    if (student) {
      generateGreeting();
    }
  }, [student]);

  // Use real stats from API or fallback
  const stats = statsData?.stats || {
    totalExercises: 25,
    completedExercises: 18,
    successRate: 85,
    totalTime: 120
  };

  const generateGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = '';
    
    if (hour < 12) timeGreeting = 'Bonjour';
    else if (hour < 17) timeGreeting = 'Bon après-midi';
    else if (hour < 21) timeGreeting = 'Bonsoir';
    else timeGreeting = 'Bonne soirée';
    
    setGreeting(timeGreeting);
  };

  const getMascotEmoji = (type: string) => {
    const mascots: Record<string, string> = {
      dragon: '🐉',
      fairy: '🧚‍♀️',
      robot: '🤖',
      cat: '🐱',
      owl: '🦉'
    };
    return mascots[type] || '👤';
  };

  const getMascotMessage = (type: string) => {
    const messages: Record<string, string[]> = {
      dragon: ['Prêt à conquérir de nouveaux défis ? 🐉', 'Ta flamme d\'apprentissage brûle fort !'],
      fairy: ['Laisse la magie t\'emporter vers de nouveaux savoirs ! ✨', 'Chaque exercice est une nouvelle étoile !'],
      robot: ['Calculs en cours... Apprentissage optimal détecté ! 🤖', 'Système éducatif: ACTIVÉ !'],
      cat: ['Ronron... Il est temps d\'apprendre ! 🐱', 'Curiosité féline activée !'],
      owl: ['La sagesse t\'appelle, jeune apprenti ! 🦉', 'Hoot hoot ! Il est temps d\'étudier !']
    };
    const typeMessages = messages[type] || ['Prêt pour une nouvelle aventure ?'];
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
  };

  const getStreakMessage = () => {
    const streak = student?.currentStreak || 0;
    if (streak === 0) return "Commence ta série aujourd'hui ! 🌟";
    if (streak === 1) return "Première journée ! Continue ! 🔥";
    if (streak < 7) return `${streak} jours consécutifs ! Super ! 🚀`;
    if (streak < 30) return `${streak} jours de suite ! Incroyable ! 🏆`;
    return `${streak} jours ! Tu es un champion ! 👑`;
  };

  const getDifficultyColor = (difficulte: string) => {
    switch (difficulte?.toLowerCase()) {
      case 'facile': return 'bg-green-100 text-green-800 border-green-300';
      case 'moyen': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'difficile': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (dataLoading && !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de ton tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Impossible de charger tes données
          </h2>
          <p className="text-gray-600 mb-4">
            Vérifiez votre connexion internet
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">RevEd Kids</h1>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">Tableau de bord</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Connecté en tant que</div>
                <div className="font-medium text-gray-900">{student.prenom} {student.nom}</div>
              </div>
              <button
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Se déconnecter"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">
                    🧚‍♀️
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {greeting} {student.prenom} ! 🌟
                    </h2>
                    <p className="text-blue-100 text-lg">
                      Prêt pour de nouvelles aventures magiques !
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{student.totalXp}</div>
                    <div className="text-blue-100 text-sm">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{student.currentStreak}</div>
                    <div className="text-blue-100 text-sm">Jours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.successRate}%</div>
                    <div className="text-blue-100 text-sm">Réussite</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mastery Levels Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <MasteryLevelsCard 
                competenceProgress={[]}
                loading={progressLoading}
                studentLevel={student.niveau}
              />
            </motion.div>

            {/* Analytics Charts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <AnalyticsCharts 
                analyticsData={{ analytics: [], aggregatedMetrics: { totalDays: 0, totalSessionTime: 0, totalExercises: 0, totalCompletedExercises: 0, averageScore: 0, totalXpEarned: 0, totalCompetencesMastered: 0, maxStreakDays: 0, completionRate: 0 } }}
                loading={statsLoading}
              />
            </motion.div>

            {/* Recommended Exercises */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    🎯 Exercices recommandés
                  </h3>
                  <button
                    onClick={() => onNavigate('/exercises')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    Voir tout →
                  </button>
                </div>

                {recommendations && recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.map((exercise, index) => (
                      <motion.div
                        key={exercise.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                        onClick={() => console.log('Start exercise', exercise)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 mb-1">
                              {exercise.question.substring(0, 60)}
                              {exercise.question.length > 60 ? '...' : ''}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className={`px-2 py-1 rounded-full text-xs border ${getDifficultyColor(exercise.difficultyLevel.toString())}`}>
                                Niveau {exercise.difficultyLevel}
                              </span>
                              <span>•</span>
                              <span>{exercise.xpReward} XP</span>
                              <span>•</span>
                              <span>{exercise.type}</span>
                            </div>
                          </div>
                          <div className="text-gray-400 ml-4">
                            →
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : recommendationsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600">Chargement des exercices...</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-gray-600">Aucun exercice recommandé pour le moment</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Achievement Badges */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <AchievementBadges 
                achievements={[]}
                loading={achievementsLoading}
                onViewAll={() => onNavigate('/achievements')}
              />
            </motion.div>

            {/* Prerequisite Visualization */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <PrerequisiteVisualization 
                studentId={student?.id || 0}
                currentLevel={student?.niveau || 'CP'}
                loading={dataLoading}
              />
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  🚀 Actions rapides
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => onNavigate('/exercises')}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <span>📚</span>
                    Faire un exercice
                  </button>
                  
                  <button
                    onClick={() => onNavigate('/exercise-test')}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <span>🧪</span>
                    Test Exercise Engine
                  </button>
                  
                  <button
                    onClick={() => onNavigate('/xp-theme-test')}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <span>🎨</span>
                    Test XP System Themes
                  </button>
                  
                  <button
                    onClick={() => onNavigate('/wardrobe-test')}
                    className="w-full bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-600 hover:to-cyan-700 text-white p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <span>👕</span>
                    Test Wardrobe System
                  </button>
                  
                  <button
                    onClick={() => onNavigate('/comprehensive-test')}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <span>🧪</span>
                    Comprehensive Test Suite
                  </button>
                  
                  <button
                    onClick={() => onNavigate('/cross-browser-test')}
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <span>🔧</span>
                    Cross-Browser Tests
                  </button>
                  
                  <button
                    onClick={() => onNavigate('/error-handling-test')}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <span>🛡️</span>
                    Error Handling Tests
                  </button>
                  
                  <button
                    onClick={() => onNavigate('/progress')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <span>📊</span>
                    Voir ma progression
                  </button>
                  
                  <button
                    onClick={() => onNavigate('/achievements')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <span>🏆</span>
                    Mes réussites
                  </button>
                  
                  <button
                    onClick={() => onNavigate('/profile')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <span>👤</span>
                    Mon profil
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📈 Statistiques
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Exercices terminés</span>
                    <span className="font-bold text-gray-800">{stats.completedExercises}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Taux de réussite</span>
                    <span className="font-bold text-green-600">{stats.successRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Temps d'étude</span>
                    <span className="font-bold text-blue-600">{Math.round(stats.totalTime / 60)}min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Niveau actuel</span>
                    <span className="font-bold text-purple-600">{student.niveau}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Level Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
                <div className="text-center">
                  <div className="text-3xl mb-2">🏆</div>
                  <h3 className="text-lg font-bold mb-1">Niveau {student.niveau}</h3>
                  <p className="text-yellow-100 text-sm mb-3">
                    Tu progresses bien !
                  </p>
                  <div className="bg-white/20 rounded-full p-2">
                    <div className="text-2xl font-bold">{student.totalXp}</div>
                    <div className="text-xs">Points totaux</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 