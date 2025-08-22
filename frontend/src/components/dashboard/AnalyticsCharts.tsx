import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui';

interface AnalyticsData {
  analytics: Array<{
    date: string;
    sessionTime: number;
    exercisesAttempted: number;
    exercisesCompleted: number;
    averageScore: number;
    xpEarned: number;
    competencesMastered: number;
    competencesProgressed: number;
    streakDays: number;
    subjectTimes: {
      francais: number;
      mathematiques: number;
      sciences: number;
      histoireGeographie: number;
      anglais: number;
    };
  }>;
  aggregatedMetrics: {
    totalDays: number;
    totalSessionTime: number;
    totalExercises: number;
    totalCompletedExercises: number;
    averageScore: number;
    totalXpEarned: number;
    totalCompetencesMastered: number;
    maxStreakDays: number;
    completionRate: number;
  };
  subjectBreakdown?: {
    [key: string]: {
      totalTime: number;
      percentage: number;
    };
  };
  trendAnalysis?: {
    sessionTime: { direction: string; change: number };
    averageScore: { direction: string; change: number };
    exercisesCompleted: { direction: string; change: number };
    competenceProgress: { direction: string; change: number };
    consistency: {
      activeDays: number;
      totalDays: number;
      consistencyRate: number;
    };
  };
}

interface AnalyticsChartsProps {
  analyticsData: AnalyticsData | null;
  loading: boolean;
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ analyticsData, loading }) => {
  const chartData = useMemo(() => {
    if (!analyticsData?.analytics) return null;
    
    // Get last 7 days of data for mini charts
    const recentData = analyticsData.analytics.slice(-7);
    
    return {
      recentData,
      maxSessionTime: Math.max(...recentData.map(d => d.sessionTime)) || 1,
      maxScore: Math.max(...recentData.map(d => d.averageScore)) || 100,
      maxExercises: Math.max(...recentData.map(d => d.exercisesCompleted)) || 1,
      maxXp: Math.max(...recentData.map(d => d.xpEarned)) || 1,
    };
  }, [analyticsData]);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'increasing': return 'text-green-600';
      case 'decreasing': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getSubjectIcon = (subject: string) => {
    const ICONS = {
      francais: '📖',
      mathematiques: '🔢',
      sciences: '🔬',
      histoireGeographie: '🌍',
      anglais: '🇬🇧'
    };
    return ICONS[subject as keyof typeof ICONS] || '📚';
  };

  const getSubjectColor = (subject: string) => {
    const COLORS = {
      francais: 'bg-blue-100 text-blue-700',
      mathematiques: 'bg-green-100 text-green-700',
      sciences: 'bg-purple-100 text-purple-700',
      histoireGeographie: 'bg-orange-100 text-orange-700',
      anglais: 'bg-red-100 text-red-700'
    };
    return COLORS[subject as keyof typeof COLORS] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <Card variant="default" padding="lg" rounded="2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="lg" rounded="2xl">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        📊 Analyse des performances
      </h3>

      {analyticsData ? (
        <div className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200"
            >
              <div className="text-xs text-blue-600 mb-1">Temps total</div>
              <div className="text-lg font-bold text-blue-700">
                {Math.round(analyticsData.aggregatedMetrics.totalSessionTime / 60)}min
              </div>
              {analyticsData.trendAnalysis?.sessionTime && (
                <div className={`text-xs flex items-center gap-1 ${getTrendColor(analyticsData.trendAnalysis.sessionTime.direction)}`}>
                  <span>{getTrendIcon(analyticsData.trendAnalysis.sessionTime.direction)}</span>
                  <span>{Math.abs(analyticsData.trendAnalysis.sessionTime.change)}%</span>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200"
            >
              <div className="text-xs text-green-600 mb-1">Score moyen</div>
              <div className="text-lg font-bold text-green-700">
                {Math.round(analyticsData.aggregatedMetrics.averageScore)}%
              </div>
              {analyticsData.trendAnalysis?.averageScore && (
                <div className={`text-xs flex items-center gap-1 ${getTrendColor(analyticsData.trendAnalysis.averageScore.direction)}`}>
                  <span>{getTrendIcon(analyticsData.trendAnalysis.averageScore.direction)}</span>
                  <span>{Math.abs(analyticsData.trendAnalysis.averageScore.change)}%</span>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200"
            >
              <div className="text-xs text-purple-600 mb-1">Exercices</div>
              <div className="text-lg font-bold text-purple-700">
                {analyticsData.aggregatedMetrics.totalCompletedExercises}
              </div>
              {analyticsData.trendAnalysis?.exercisesCompleted && (
                <div className={`text-xs flex items-center gap-1 ${getTrendColor(analyticsData.trendAnalysis.exercisesCompleted.direction)}`}>
                  <span>{getTrendIcon(analyticsData.trendAnalysis.exercisesCompleted.direction)}</span>
                  <span>{Math.abs(analyticsData.trendAnalysis.exercisesCompleted.change)}%</span>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 border border-yellow-200"
            >
              <div className="text-xs text-yellow-600 mb-1">XP total</div>
              <div className="text-lg font-bold text-yellow-700">
                {analyticsData.aggregatedMetrics.totalXpEarned}
              </div>
              <div className="text-xs text-yellow-600">
                Série: {analyticsData.aggregatedMetrics.maxStreakDays} jours
              </div>
            </motion.div>
          </div>

          {/* Mini Charts */}
          {chartData && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-600">Progression sur 7 jours :</h4>
              
              {/* Session Time Chart */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                  ⏱️ Temps de session quotidien
                </div>
                <div className="flex items-end gap-1 h-12">
                  {chartData.recentData.map((day, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.sessionTime / chartData.maxSessionTime) * 100}%` }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                      className="bg-blue-400 rounded-sm flex-1 min-h-1"
                      title={`${Math.round(day.sessionTime / 60)}min le ${new Date(day.date).toLocaleDateString()}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Il y a 7j</span>
                  <span>Aujourd'hui</span>
                </div>
              </div>

              {/* Score Chart */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                  🎯 Score moyen quotidien
                </div>
                <div className="flex items-end gap-1 h-12">
                  {chartData.recentData.map((day, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.averageScore / chartData.maxScore) * 100}%` }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                      className="bg-green-400 rounded-sm flex-1 min-h-1"
                      title={`${Math.round(day.averageScore)}% le ${new Date(day.date).toLocaleDateString()}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Subject Breakdown */}
          {analyticsData.subjectBreakdown && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">Répartition par matière :</h4>
              <div className="space-y-2">
                {Object.entries(analyticsData.subjectBreakdown)
                  .filter(([_, data]) => data.percentage > 0)
                  .sort(([_, a], [__, b]) => b.percentage - a.percentage)
                  .slice(0, 3)
                  .map(([subject, data]) => (
                    <motion.div
                      key={subject}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getSubjectColor(subject)}`}>
                        <span className="text-sm">{getSubjectIcon(subject)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-gray-700 capitalize">
                            {subject.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-xs text-gray-600">{data.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.percentage}%` }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className={`h-1 rounded-full ${getSubjectColor(subject).includes('blue') ? 'bg-blue-400' :
                              getSubjectColor(subject).includes('green') ? 'bg-green-400' :
                              getSubjectColor(subject).includes('purple') ? 'bg-purple-400' :
                              getSubjectColor(subject).includes('orange') ? 'bg-orange-400' : 'bg-red-400'}`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}

          {/* Consistency */}
          {analyticsData.trendAnalysis?.consistency && (
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-orange-700">Régularité :</span>
                <span className="text-lg font-bold text-orange-600">
                  {analyticsData.trendAnalysis.consistency.consistencyRate}%
                </span>
              </div>
              <div className="text-xs text-orange-600 mt-1">
                {analyticsData.trendAnalysis.consistency.activeDays} jours actifs sur {analyticsData.trendAnalysis.consistency.totalDays}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-600">Commencez des exercices pour voir vos statistiques !</p>
        </div>
      )}
    </Card>
  );
};

export default AnalyticsCharts;