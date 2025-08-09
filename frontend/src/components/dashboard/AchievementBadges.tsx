import React from 'react';
import { motion } from 'framer-motion';

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

interface AchievementBadgesProps {
  achievements: Achievement[];
  loading: boolean;
  onViewAll: () => void;
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({ 
  achievements, 
  loading, 
  onViewAll 
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'silver': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'gold': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'platinum': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'diamond': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      case 'diamond': return '💠';
      default: return '🏅';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return '📚';
      case 'engagement': return '💪';
      case 'progress': return '📈';
      case 'social': return '👥';
      case 'special': return '⭐';
      default: return '🏆';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'text-blue-600';
      case 'engagement': return 'text-green-600';
      case 'progress': return 'text-purple-600';
      case 'social': return 'text-pink-600';
      case 'special': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const completedAchievements = achievements.filter(a => a.isCompleted);
  const inProgressAchievements = achievements.filter(a => !a.isCompleted && a.currentProgress > 0);
  const recentlyCompleted = completedAchievements.slice(0, 3);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          🏆 Récompenses
        </h3>
        {achievements.length > 0 && (
          <button
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            Voir tout →
          </button>
        )}
      </div>

      {achievements.length > 0 ? (
        <div className="space-y-4">
          {/* Stats Summary */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
            <div className="flex items-center justify-between text-sm">
              <div className="text-center">
                <div className="font-bold text-lg text-yellow-700">{completedAchievements.length}</div>
                <div className="text-yellow-600 text-xs">Obtenues</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-orange-700">{inProgressAchievements.length}</div>
                <div className="text-orange-600 text-xs">En cours</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-green-700">
                  {completedAchievements.reduce((sum, a) => sum + a.xpReward, 0)}
                </div>
                <div className="text-green-600 text-xs">XP total</div>
              </div>
            </div>
          </div>

          {/* Recently Completed Achievements */}
          {recentlyCompleted.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Récemment obtenues :</h4>
              <div className="space-y-2">
                {recentlyCompleted.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index, type: "spring", stiffness: 200 }}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-lg">{getDifficultyIcon(achievement.difficulty)}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold text-green-800 truncate">
                        {achievement.title}
                      </h5>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs border ${getDifficultyColor(achievement.difficulty)}`}>
                          {achievement.difficulty}
                        </span>
                        <span className="text-xs text-green-600">+{achievement.xpReward} XP</span>
                      </div>
                    </div>
                    <div className="text-green-500 text-sm">✅</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* In Progress Achievements */}
          {inProgressAchievements.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Presque réussies :</h4>
              <div className="space-y-2">
                {inProgressAchievements.slice(0, 2).map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{getCategoryIcon(achievement.category)}</span>
                      <h5 className="text-sm font-medium text-blue-800 flex-1 truncate">
                        {achievement.title}
                      </h5>
                      <span className="text-xs text-blue-600">
                        {achievement.progressPercentage}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-blue-100 rounded-full h-2">
                      <motion.div 
                        className="bg-blue-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${achievement.progressPercentage}%` }}
                        transition={{ delay: 0.2 + 0.1 * index, duration: 0.6 }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-blue-600">
                        {achievement.currentProgress}/{achievement.maxProgress}
                      </span>
                      <span className={`px-1 py-0.5 rounded text-xs ${getCategoryColor(achievement.category)}`}>
                        {achievement.category}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Achievement Categories */}
          {completedAchievements.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Récompenses par catégorie :</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['academic', 'engagement', 'progress', 'social'].map(category => {
                  const count = completedAchievements.filter(a => a.category === category).length;
                  return count > 0 && (
                    <div key={category} className="flex items-center gap-1">
                      <span>{getCategoryIcon(category)}</span>
                      <span className={getCategoryColor(category)}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-gray-600 text-sm">Aucune récompense pour le moment</p>
          <p className="text-gray-500 text-xs mt-1">Continue tes exercices pour débloquer des badges !</p>
        </div>
      )}
    </div>
  );
};

export default AchievementBadges;