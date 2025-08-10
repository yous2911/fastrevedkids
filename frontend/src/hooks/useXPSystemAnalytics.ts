import { useState, useEffect, useCallback } from 'react';

interface XPSystemMetrics {
  totalXPGained: number;
  levelUpsCount: number;
  averageSessionXP: number;
  streakDays: number;
  topPerformanceDays: string[];
  xpBreakdown: {
    exercises: number;
    achievements: number;
    bonuses: number;
  };
}

interface XPSystemAnalyticsData {
  metrics: XPSystemMetrics;
  trends: {
    weekly: number[];
    monthly: number[];
  };
  performance: {
    averageLevelTime: number;
    fastestLevelUp: number;
    consistency: number;
  };
}

export const useXPSystemAnalytics = (studentId?: number) => {
  const [data, setData] = useState<XPSystemAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionXP, setSessionXP] = useState(0);
  const [sessionInteractions, setSessionInteractions] = useState(0);

  const fetchAnalytics = useCallback(async () => {
    if (!studentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock data for now - replace with actual API call
      const mockData: XPSystemAnalyticsData = {
        metrics: {
          totalXPGained: 2350,
          levelUpsCount: 8,
          averageSessionXP: 145,
          streakDays: 12,
          topPerformanceDays: ['2024-01-15', '2024-01-20', '2024-01-22'],
          xpBreakdown: {
            exercises: 1800,
            achievements: 400,
            bonuses: 150
          }
        },
        trends: {
          weekly: [120, 145, 98, 167, 134, 189, 156],
          monthly: [1200, 1450, 1680, 1890]
        },
        performance: {
          averageLevelTime: 72, // hours
          fastestLevelUp: 24,   // hours
          consistency: 85       // percentage
        }
      };
      
      setData(mockData);
    } catch (err) {
      setError('Failed to load XP system analytics');
      console.error('XP Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const trackXPGain = useCallback((amount: number, source: 'exercise' | 'achievement' | 'bonus') => {
    // Track XP gain event
    if (data) {
      setData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            totalXPGained: prev.metrics.totalXPGained + amount,
            xpBreakdown: {
              ...prev.metrics.xpBreakdown,
              [source === 'exercise' ? 'exercises' : source === 'achievement' ? 'achievements' : 'bonuses']: 
                prev.metrics.xpBreakdown[source === 'exercise' ? 'exercises' : source === 'achievement' ? 'achievements' : 'bonuses'] + amount
            }
          }
        };
      });
    }
  }, [data]);

  const trackLevelUp = useCallback((newLevel: number) => {
    // Track level up event
    if (data) {
      setData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            levelUpsCount: prev.metrics.levelUpsCount + 1
          }
        };
      });
    }
  }, [data]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    sessionXP,
    sessionInteractions,
    refetch: fetchAnalytics,
    trackXPGain,
    trackLevelUp
  };
};