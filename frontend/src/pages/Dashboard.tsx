import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
  const [student, setStudent] = useState<Student | null>(null);
  const [recommendations, setRecommendations] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudentData();
    generateGreeting();
  }, []);

  const loadStudentData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        onLogout();
        return;
      }

      // Get current student from token or make API call
      const response = await fetch('/api/students/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStudent(data.data);
          loadRecommendations(data.data.id);
        }
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        onLogout();
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async (studentId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/students/${studentId}/recommendations?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecommendations(data.data || []);
        }
      }
    } catch (err) {
      // Handle recommendation loading error silently
    }
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

  const getProgressPercentage = () => {
    if (!student?.stats) return 0;
    const { totalExercises, completedExercises } = student.stats;
    return totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;
  };

  const getStreakMessage = () => {
    const streak = student?.serieJours || 0;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de ton tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Impossible de charger tes données
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'Vérifiez votre connexion internet'}
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
                    {getMascotEmoji(student.mascotteType)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {greeting} {student.prenom} ! 🌟
                    </h2>
                    <p className="text-blue-100 text-lg">
                      {getMascotMessage(student.mascotteType)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{student.totalPoints}</div>
                    <div className="text-blue-100 text-sm">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{student.serieJours}</div>
                    <div className="text-blue-100 text-sm">Jours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{student.stats.successRate}%</div>
                    <div className="text-blue-100 text-sm">Réussite</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📊 Ta progression
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">Progression globale</span>
                      <span className="text-sm text-gray-500">{getProgressPercentage()}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <p className="text-center font-medium text-orange-800">
                      {getStreakMessage()}
                    </p>
                  </div>
                </div>
              </div>
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

                {recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.map((exercise, index) => (
                      <motion.div
                        key={exercise.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                        onClick={() => onStartExercise(exercise)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 mb-1">
                              {exercise.configuration.question.substring(0, 60)}
                              {exercise.configuration.question.length > 60 ? '...' : ''}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className={`px-2 py-1 rounded-full text-xs border ${getDifficultyColor(exercise.difficulte)}`}>
                                {exercise.difficulte}
                              </span>
                              <span>•</span>
                              <span>{exercise.xp} XP</span>
                              {exercise.sousChapitre && (
                                <>
                                  <span>•</span>
                                  <span>{exercise.sousChapitre.chapitre.matiere.nom}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-gray-400 ml-4">
                            →
                          </div>
                        </div>
                      </motion.div>
                    ))}
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
                    <span className="font-bold text-gray-800">{student.stats.completedExercises}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Taux de réussite</span>
                    <span className="font-bold text-green-600">{student.stats.successRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Temps d'étude</span>
                    <span className="font-bold text-blue-600">{Math.round(student.stats.totalTime / 60)}min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Niveau actuel</span>
                    <span className="font-bold text-purple-600">{student.niveauActuel}</span>
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
                  <h3 className="text-lg font-bold mb-1">Niveau {student.niveauActuel}</h3>
                  <p className="text-yellow-100 text-sm mb-3">
                    Tu progresses bien !
                  </p>
                  <div className="bg-white/20 rounded-full p-2">
                    <div className="text-2xl font-bold">{student.totalPoints}</div>
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