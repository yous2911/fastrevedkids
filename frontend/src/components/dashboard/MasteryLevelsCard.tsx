import React from 'react';
import { motion } from 'framer-motion';

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

interface MasteryLevelsCardProps {
  competenceProgress: CompetenceProgress[];
  loading: boolean;
  studentLevel: string;
}

const masteryLevelsCard: React.FC<MasteryLevelsCardProps> = ({ 
  competenceProgress, 
  loading, 
  studentLevel 
}) => {
  const getMasteryStats = () => {
    if (!competenceProgress.length) return null;
    
    const STATS = {
      not_started: competenceProgress.filter(cp => cp.masteryLevel === 'not_started').length,
      discovering: competenceProgress.filter(cp => cp.masteryLevel === 'discovering').length,
      practicing: competenceProgress.filter(cp => cp.masteryLevel === 'practicing').length,
      mastering: competenceProgress.filter(cp => cp.masteryLevel === 'mastering').length,
      mastered: competenceProgress.filter(cp => cp.masteryLevel === 'mastered').length,
    };
    
    const total = Object.values(STATS).reduce((sum, count) => sum + count, 0);
    
    return { STATS, total };
  };

  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'not_started': return 'bg-gray-100 text-gray-600 border-gray-300';
      case 'discovering': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'practicing': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'mastering': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'mastered': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getMasteryIcon = (level: string) => {
    switch (level) {
      case 'not_started': return '⚪';
      case 'discovering': return '🌱';
      case 'practicing': return '🔄';
      case 'mastering': return '⭐';
      case 'mastered': return '🏆';
      default: return '⚪';
    }
  };

  const getMasteryLabel = (level: string) => {
    switch (level) {
      case 'not_started': return 'Non commencé';
      case 'discovering': return 'Découverte';
      case 'practicing': return 'En pratique';
      case 'mastering': return 'En maîtrise';
      case 'mastered': return 'Maîtrisé';
      default: return level;
    }
  };

  const masteryData = getMasteryStats();
  const overallProgress = masteryData ? 
    Math.round(((masteryData.STATS.mastered + masteryData.STATS.mastering * 0.8 + masteryData.STATS.practicing * 0.5) / masteryData.total) * 100) : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        🎯 Niveaux de Maîtrise
      </h3>
      
      {masteryData ? (
        <div className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Progression globale</span>
              <span className="text-sm font-bold text-blue-600">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-700"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Mastery Level Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Répartition par niveau :</h4>
            {Object.entries(masteryData.STATS).map(([level, count]) => (
              count > 0 && (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getMasteryIcon(level)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getMasteryColor(level)}`}>
                      {getMasteryLabel(level)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{count}</span>
                    <span className="text-xs text-gray-500">
                      ({Math.round((count / masteryData.total) * 100)}%)
                    </span>
                  </div>
                </motion.div>
              )
            ))}
          </div>

          {/* Recent Achievements */}
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-600 font-semibold text-sm">🏆 Récemment maîtrisé :</span>
            </div>
            {masteryData.STATS.mastered > 0 ? (
              <p className="text-green-700 text-sm">
                {masteryData.STATS.mastered} compétence{masteryData.STATS.mastered > 1 ? 's' : ''} maîtrisée{masteryData.STATS.mastered > 1 ? 's' : ''} !
              </p>
            ) : (
              <p className="text-green-600 text-sm">Continue à t'exercer pour maîtriser tes premières compétences !</p>
            )}
          </div>

          {/* Next Goals */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-600 font-semibold text-sm">🎯 Prochains objectifs :</span>
            </div>
            <p className="text-blue-700 text-sm">
              {masteryData.STATS.practicing > 0 ? (
                `${masteryData.STATS.practicing} compétence${masteryData.STATS.practicing > 1 ? 's' : ''} en cours de pratique`
              ) : masteryData.STATS.discovering > 0 ? (
                `${masteryData.STATS.discovering} compétence${masteryData.STATS.discovering > 1 ? 's' : ''} en découverte`
              ) : (
                'Commence de nouveaux exercices pour progresser !'
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-gray-600">Commencez des exercices pour voir votre progression !</p>
        </div>
      )}
    </div>
  );
};

export default masteryLevelsCard;