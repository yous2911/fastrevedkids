// src/components/dashboard/StudentDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Trophy, 
  Star, 
  Target, 
  PlayCircle, 
  TrendingUp,
  Zap,
  Clock,
  CheckCircle
} from 'lucide-react';

// Types
interface Student {
  id: number;
  prenom: string;
  nom: string;
  niveau: string;
  totalPoints: number;
  serieJours: number;
  mascotteType: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  dateCreation: string;
  dernierAcces: string;
}

interface StudentStats {
  totalExercises: number;
  completedExercises: number;
  successRate: number;
  totalTime: number;
  averageScore: number;
  currentStreak: number;
  weeklyProgress: number;
  favoriteSubject: string;
}

interface Exercise {
  id: number;
  titre: string;
  type: 'calcul' | 'lecture' | 'geometrie' | 'orthographe' | 'conjugaison';
  niveau: string;
  difficulte: 1 | 2 | 3;
  pointsReussite: number;
  matiere: string;
  description?: string;
  estimatedTime?: number;
}

interface StudentDashboardProps {
  student: Student;
  stats: StudentStats;
  onStartExercise: (exerciseId: number) => void;
  onContinueProgress?: () => void;
  onReviewMistakes?: () => void;
  onViewTrophies?: () => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  animationKey?: string;
}

interface GoalCardProps {
  title: string;
  current: number;
  target: number;
  icon: React.ReactNode;
  color?: 'blue' | 'yellow' | 'green' | 'purple' | 'red';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  date: string;
  type: 'streak' | 'points' | 'subject' | 'level';
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  student, 
  stats, 
  onStartExercise,
  onContinueProgress,
  onReviewMistakes,
  onViewTrophies
}) => {
  const [greeting, setGreeting] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Mock recommended exercises
  const mockRecommendedExercises: Exercise[] = [
    {
      id: 1,
      titre: "Addition magique",
      type: "calcul",
      niveau: "CP",
      difficulte: 1,
      pointsReussite: 10,
      matiere: "Mathématiques",
      description: "Apprends les additions avec des objets magiques !",
      estimatedTime: 5
    },
    {
      id: 2,
      titre: "Lecture enchantée",
      type: "lecture",
      niveau: "CP", 
      difficulte: 1,
      pointsReussite: 8,
      matiere: "Français",
      description: "Lis des mots magiques et découvre leur pouvoir !",
      estimatedTime: 8
    },
    {
      id: 3,
      titre: "Les formes mystérieuses",
      type: "geometrie",
      niveau: "CP",
      difficulte: 2,
      pointsReussite: 12,
      matiere: "Mathématiques", 
      description: "Explore le monde des formes géométriques !",
      estimatedTime: 6
    }
  ];

  // Mock achievements
  const mockAchievements: Achievement[] = [
    {
      id: '1',
      title: 'Série de 7 jours !',
      description: 'Tu as fait des exercices pendant 7 jours consécutifs',
      icon: '🔥',
      date: 'Il y a 2 jours',
      type: 'streak'
    },
    {
      id: '2',
      title: '100 points en maths',
      description: 'Tu as gagné 100 points en mathématiques',
      icon: '⭐',
      date: 'Il y a 5 jours',
      type: 'points'
    },
    {
      id: '3',
      title: 'Niveau 2 atteint !',
      description: 'Félicitations pour avoir atteint le niveau 2',
      icon: '🏆',
      date: 'Il y a 1 semaine',
      type: 'level'
    }
  ];

  // Generate dynamic greeting
  useEffect(() => {
    const hour = new Date().getHours();
    const name = student.prenom;
    
    if (hour < 12) {
      setGreeting(`Bonjour ${name} ! 🌅`);
    } else if (hour < 17) {
      setGreeting(`Bon après-midi ${name} ! ☀️`);
    } else if (hour < 21) {
      setGreeting(`Bonsoir ${name} ! 🌆`);
    } else {
      setGreeting(`Bonne soirée ${name} ! 🌙`);
    }

    setRecommendedExercises(mockRecommendedExercises);
    setAchievements(mockAchievements);
  }, [student.prenom, mockRecommendedExercises, mockAchievements]);

  // Show celebration for high streak
  useEffect(() => {
    if (student.serieJours >= 7) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [student.serieJours]);

  const getMascotMessage = useCallback((): string => {
    const messages = {
      dragon: ['Prêt à conquérir de nouveaux défis ? 🐉', 'Ta flamme d\'apprentissage brûle fort !'],
      fairy: ['Laisse la magie t\'emporter vers de nouveaux savoirs ! ✨', 'Chaque exercice est une nouvelle étoile !'],
      robot: ['Calculs en cours... Apprentissage optimal détecté ! 🤖', 'Système éducatif: ACTIVÉ !'],
      cat: ['Ronron... Il est temps d\'apprendre ! 🐱', 'Curiosité féline activée !'],
      owl: ['La sagesse t\'appelle, jeune apprenti ! 🦉', 'Hoot hoot ! L\'école continue !']
    };
    
    const mascotMessages = messages[student.mascotteType] || messages.dragon;
    return mascotMessages[Math.floor(Math.random() * mascotMessages.length)];
  }, [student.mascotteType]);

  const getStreakMessage = useCallback((): string => {
    const streak = student.serieJours;
    if (streak >= 7) return `🔥 ${streak} jours consécutifs ! Tu es en feu !`;
    if (streak >= 3) return `⭐ ${streak} jours d'affilée ! Continue !`;
    if (streak >= 1) return `💪 ${streak} jour${streak > 1 ? 's' : ''} ! C'est parti !`;
    return '🚀 Commence ta série aujourd\'hui !';
  }, [student.serieJours]);

  const getLevelProgress = useCallback((): number => {
    const totalPoints = student.totalPoints;
    const currentLevelPoints = totalPoints % 100; // Assuming 100 points per level
    return currentLevelPoints;
  }, [student.totalPoints]);

  const getNextLevel = useCallback((): number => {
    const totalPoints = student.totalPoints;
    return Math.floor(totalPoints / 100) + 1;
  }, [student.totalPoints]);

  const getCurrentLevel = useCallback((): number => {
    const totalPoints = student.totalPoints;
    return Math.floor(totalPoints / 100) || 1;
  }, [student.totalPoints]);

  const handleExerciseStart = useCallback((exerciseId: number): void => {
    setLoading(true);
    onStartExercise(exerciseId);
    setTimeout(() => setLoading(false), 1000);
  }, [onStartExercise]);

  const getExerciseIcon = (type: Exercise['type']): string => {
    const icons = {
      calcul: '🔢',
      lecture: '📖',
      geometrie: '📐',
      orthographe: '✏️',
      conjugaison: '📝'
    };
    return icons[type] || '🎯';
  };

  const getDifficultyColor = (difficulte: Exercise['difficulte']): string => {
    const colors = {
      1: 'text-green-600 bg-green-100',
      2: 'text-yellow-600 bg-yellow-100',
      3: 'text-red-600 bg-red-100'
    };
    return colors[difficulte] || 'text-gray-600 bg-gray-100';
  };

  const getDifficultyLabel = (difficulte: Exercise['difficulte']): string => {
    const labels = {
      1: 'Facile',
      2: 'Moyen',
      3: 'Difficile'
    };
    return labels[difficulte] || 'Inconnu';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-purple-800 mb-2">
                {greeting}
              </h1>
              <p className="text-lg text-purple-600 mb-4">
                {getMascotMessage()}
              </p>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Points totaux</p>
              <p className="text-2xl font-bold text-purple-600">{student.totalPoints}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Exercices réussis</p>
              <p className="text-2xl font-bold text-blue-600">{stats.completedExercises}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Série actuelle</p>
              <p className="text-2xl font-bold text-orange-600">{student.serieJours}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Taux de réussite</p>
              <p className="text-2xl font-bold text-green-600">{Math.round(stats.successRate)}%</p>
            </div>
          </div>
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Statistics Overview */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Trophy className="h-6 w-6" />}
                title="Total Points"
                value={student.totalPoints}
                subtitle="points gagnés"
                color="text-yellow-600"
                animationKey="points"
              />
              
              <StatCard
                icon={<Target className="h-6 w-6" />}
                title="Taux de réussite"
                value={`${Math.round(stats.successRate)}%`}
                subtitle="exercices réussis"
                color="text-green-600"
                animationKey="success"
              />
              
              <StatCard
                icon={<Zap className="h-6 w-6" />}
                title="Série actuelle"
                value={student.serieJours}
                subtitle="jours consécutifs"
                color="text-orange-600"
                animationKey="streak"
              />
              
              <StatCard
                icon={<BookOpen className="h-6 w-6" />}
                title="Exercices"
                value={stats.completedExercises}
                subtitle="terminés"
                color="text-blue-600"
                animationKey="exercises"
              />
            </div>

            {/* Progress Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  📈 Ta progression
                </h2>
                <button className="text-purple-600 hover:text-purple-800 transition-colors">
                  <TrendingUp className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Level Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Niveau {getCurrentLevel()}
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
                  <p className="text-xs text-gray-500 mt-2">
                    {100 - getLevelProgress()} points pour le niveau {getNextLevel()}
                  </p>
                </div>

                {/* Weekly Progress */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-700">Progrès cette semaine</h4>
                      <p className="text-sm text-gray-500">
                        Tu as gagné {stats.weeklyProgress} points cette semaine !
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        +{stats.weeklyProgress}
                      </div>
                      <div className="text-xs text-gray-500">cette semaine</div>
                    </div>
                  </div>
                </div>

                {/* Subject Progress */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Matières préférées</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔢</span>
                        <span className="font-medium">Mathématiques</span>
                      </div>
                      <span className="text-blue-600 font-bold">85%</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📚</span>
                        <span className="font-medium">Français</span>
                      </div>
                      <span className="text-green-600 font-bold">78%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Exercises */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  ⭐ Exercices recommandés
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedExercises.map((exercise) => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:scale-105"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">
                            {getExerciseIcon(exercise.type)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">
                            {exercise.titre}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {exercise.matiere} • {exercise.estimatedTime} min
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulte)}`}>
                        {getDifficultyLabel(exercise.difficulte)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {exercise.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-gray-600">
                          {exercise.pointsReussite} points
                        </span>
                      </div>
                      <button
                        onClick={() => handleExerciseStart(exercise.id)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        disabled={loading}
                      >
                        <PlayCircle className="h-4 w-4" />
                        {loading ? 'Chargement...' : 'Commencer'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {recommendedExercises.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-gray-600">
                    Bravo ! Tu as terminé tous tes exercices recommandés !
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Daily Goals */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                🎯 Objectifs du jour
              </h2>
              <div className="space-y-4">
                <GoalCard
                  title="Exercices réalisés"
                  current={3}
                  target={5}
                  icon={<BookOpen className="h-5 w-5" />}
                  color="blue"
                />
                
                <GoalCard
                  title="Points gagnés"
                  current={45}
                  target={50}
                  icon={<Star className="h-5 w-5" />}
                  color="yellow"
                />
                
                <GoalCard
                  title="Temps d'étude"
                  current={25}
                  target={30}
                  icon={<Clock className="h-5 w-5" />}
                  color="green"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                ⚡ Actions rapides
              </h2>
              <div className="space-y-3">
                <button 
                  onClick={onContinueProgress}
                  className="w-full bg-purple-100 text-purple-700 p-3 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-3"
                >
                  <PlayCircle className="h-5 w-5" />
                  <span>Continuer où j'en étais</span>
                </button>
                
                <button 
                  onClick={onReviewMistakes}
                  className="w-full bg-blue-100 text-blue-700 p-3 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-3"
                >
                  <Target className="h-5 w-5" />
                  <span>Réviser mes erreurs</span>
                </button>
                
                <button 
                  onClick={onViewTrophies}
                  className="w-full bg-green-100 text-green-700 p-3 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-3"
                >
                  <Trophy className="h-5 w-5" />
                  <span>Voir mes trophées</span>
                </button>
              </div>
            </div>

            {/* Achievements Preview */}
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                🏆 Derniers succès
              </h2>
              <div className="space-y-3">
                {achievements.slice(0, 2).map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg"
                  >
                    <div className="text-2xl">{achievement.icon}</div>
                    <div>
                      <p className="font-medium text-gray-800">{achievement.title}</p>
                      <p className="text-sm text-gray-600">{achievement.date}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Celebration Animation */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-2xl font-bold px-8 py-4 rounded-2xl shadow-xl">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <div>{getStreakMessage()}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// StatCard Component
const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  title, 
  value, 
  subtitle, 
  color = 'text-gray-600',
  animationKey = 'default'
}) => {
  return (
    <motion.div
      key={animationKey}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-gray-100 ${color}`}>
          {icon}
        </div>
      </div>
      
      <h3 className="text-sm font-medium text-gray-600 mb-1">
        {title}
      </h3>
      <div className="text-2xl font-bold text-gray-800 mb-1">
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

// GoalCard Component  
const GoalCard: React.FC<GoalCardProps> = ({ 
  title, 
  current, 
  target, 
  icon, 
  color = 'purple' 
}) => {
  const percentage = Math.round((current / target) * 100);
  const isCompleted = percentage >= 100;
  
  const getColorClasses = (color: GoalCardProps['color']) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      green: 'text-green-600 bg-green-100',
      purple: 'text-purple-600 bg-purple-100',
      red: 'text-red-600 bg-red-100'
    };
    const safeColor = color || 'purple';
    return colors[safeColor] || colors.purple;
  };
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${getColorClasses(color)}`}>
            {icon}
          </div>
          <span className="font-medium text-gray-700">
            {title}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {current}/{target}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${
            isCompleted ? 'bg-green-500' : `bg-${color}-500`
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      <div className="text-xs text-gray-500 flex items-center gap-1">
        {isCompleted ? (
          <>
            <CheckCircle className="h-3 w-3 text-green-500" />
            Objectif atteint !
          </>
        ) : (
          `${percentage}% complété`
        )}
      </div>
    </div>
  );
};

export default StudentDashboard; 