import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProgressData {
  global: {
    totalExercises: number;
    completedExercises: number;
    successRate: number;
    totalTime: number;
    streak: number;
    level: string;
    totalPoints: number;
  };
  bySubject: Array<{
    matiere: string;
    completed: number;
    total: number;
    successRate: number;
    timeSpent: number;
  }>;
  recentSessions: Array<{
    date: string;
    exercisesCompleted: number;
    timeSpent: number;
    pointsEarned: number;
    successRate: number;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    emoji: string;
    unlockedAt?: string;
    progress?: number;
    target?: number;
  }>;
}

interface ProgressPageProps {
  onBack: () => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ onBack }) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'sessions' | 'achievements'>('overview');

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3003/api/students/progress', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProgressData(data.data);
        }
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.reload();
      }
    } catch (err) {
      setError('Erreur lors du chargement de la progression');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getSubjectEmoji = (subject: string) => {
    const emojis: Record<string, string> = {
      MATHEMATIQUES: '🔢',
      FRANCAIS: '📝',
      SCIENCES: '🔬',
      HISTOIRE_GEOGRAPHIE: '🌍',
      ANGLAIS: '🇬🇧'
    };
    return emojis[subject] || '📚';
  };

  const tabs = [
    { id: 'overview', name: 'Vue d\'ensemble', emoji: '📊' },
    { id: 'subjects', name: 'Par matière', emoji: '📚' },
    { id: 'sessions', name: 'Sessions', emoji: '📈' },
    { id: 'achievements', name: 'Réussites', emoji: '🏆' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de ta progression...</p>
        </div>
      </div>
    );
  }

  if (error || !progressData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadProgressData}
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
          <div className="flex items-center py-4">
            <button
              onClick={onBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Ma Progression</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200 mb-8">
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.emoji}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Stats Cards */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="text-3xl mb-2">📚</div>
                <div className="text-2xl font-bold">{progressData.global.completedExercises}</div>
                <div className="text-blue-100">Exercices terminés</div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-2xl font-bold">{progressData.global.successRate}%</div>
                <div className="text-green-100">Taux de réussite</div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="text-3xl mb-2">🔥</div>
                <div className="text-2xl font-bold">{progressData.global.streak}</div>
                <div className="text-purple-100">Jours consécutifs</div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                <div className="text-3xl mb-2">⏱️</div>
                <div className="text-2xl font-bold">{formatTime(progressData.global.totalTime)}</div>
                <div className="text-orange-100">Temps d'étude</div>
              </div>

              {/* Progress Chart */}
              <div className="md:col-span-2 lg:col-span-4 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Progression générale</h3>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Exercices complétés</span>
                    <span className="text-sm text-gray-500">
                      {progressData.global.completedExercises} / {progressData.global.totalExercises}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(progressData.global.completedExercises / progressData.global.totalExercises) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{progressData.global.level}</div>
                    <div className="text-gray-600 text-sm">Niveau actuel</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{progressData.global.totalPoints}</div>
                    <div className="text-gray-600 text-sm">Points totaux</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((progressData.global.completedExercises / progressData.global.totalExercises) * 100)}%
                    </div>
                    <div className="text-gray-600 text-sm">Progression</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'subjects' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {progressData.bySubject.map((subject, index) => (
                <div key={subject.matiere} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getSubjectEmoji(subject.matiere)}</span>
                      <h3 className="text-lg font-bold text-gray-800">{subject.matiere}</h3>
                    </div>
                    <span className="text-sm text-gray-500">
                      {subject.completed} / {subject.total} exercices
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(subject.completed / subject.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">{subject.successRate}%</div>
                      <div className="text-gray-600 text-sm">Réussite</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{formatTime(subject.timeSpent)}</div>
                      <div className="text-gray-600 text-sm">Temps</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        {Math.round((subject.completed / subject.total) * 100)}%
                      </div>
                      <div className="text-gray-600 text-sm">Progression</div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'sessions' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {progressData.recentSessions.length > 0 ? (
                progressData.recentSessions.map((session, index) => (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">
                        {new Date(session.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {formatTime(session.timeSpent)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">{session.exercisesCompleted}</div>
                        <div className="text-gray-600 text-sm">Exercices</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{session.successRate}%</div>
                        <div className="text-gray-600 text-sm">Réussite</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">{session.pointsEarned}</div>
                        <div className="text-gray-600 text-sm">Points</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-orange-600">{formatTime(session.timeSpent)}</div>
                        <div className="text-gray-600 text-sm">Durée</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200 text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Aucune session récente</h3>
                  <p className="text-gray-600">Commence à faire des exercices pour voir tes statistiques !</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {progressData.achievements.map((achievement, index) => (
                <div
                  key={achievement.id}
                  className={`rounded-2xl p-6 shadow-lg border-2 transition-all ${
                    achievement.unlockedAt
                      ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="text-center mb-4">
                    <div className={`text-4xl mb-2 ${achievement.unlockedAt ? 'animate-bounce' : 'grayscale'}`}>
                      {achievement.emoji}
                    </div>
                    <h3 className={`text-lg font-bold ${achievement.unlockedAt ? 'text-yellow-800' : 'text-gray-600'}`}>
                      {achievement.name}
                    </h3>
                    <p className={`text-sm ${achievement.unlockedAt ? 'text-yellow-700' : 'text-gray-500'}`}>
                      {achievement.description}
                    </p>
                  </div>

                  {achievement.unlockedAt ? (
                    <div className="text-center">
                      <div className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                        ✅ Débloqué le {new Date(achievement.unlockedAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ) : achievement.progress !== undefined && achievement.target !== undefined ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 text-sm">Progression</span>
                        <span className="text-gray-500 text-sm">
                          {achievement.progress} / {achievement.target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                        🔒 À débloquer
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {progressData.achievements.length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 bg-white rounded-2xl p-12 shadow-lg border border-gray-200 text-center">
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Aucune réussite pour le moment</h3>
                  <p className="text-gray-600">Continue à faire des exercices pour débloquer tes premiers succès !</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressPage; 