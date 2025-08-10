import { useState, useEffect, useCallback } from 'react';

interface WardrobeItem {
  id: string;
  name: string;
  type: 'hat' | 'shirt' | 'pants' | 'shoes' | 'accessory';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: string;
  timesUsed: number;
}

interface WardrobeAnalyticsData {
  totalItems: number;
  unlockedItems: number;
  favoriteItems: WardrobeItem[];
  unlockProgress: {
    common: { unlocked: number; total: number };
    rare: { unlocked: number; total: number };
    epic: { unlocked: number; total: number };
    legendary: { unlocked: number; total: number };
  };
  usageStats: {
    mostUsedType: string;
    totalCustomizations: number;
    averageCustomizationsPerSession: number;
  };
  recentUnlocks: WardrobeItem[];
}

export const useWardrobeAnalytics = (studentId?: number) => {
  const [data, setData] = useState<WardrobeAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionInteractions, setSessionInteractions] = useState(0);

  const fetchAnalytics = useCallback(async () => {
    if (!studentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock data for now - replace with actual API call
      const mockData: WardrobeAnalyticsData = {
        totalItems: 48,
        unlockedItems: 23,
        favoriteItems: [
          {
            id: 'graduation-cap',
            name: 'Graduation Cap',
            type: 'hat',
            rarity: 'rare',
            unlocked: true,
            unlockedAt: '2024-01-15T10:30:00Z',
            timesUsed: 15
          },
          {
            id: 'superhero-cape',
            name: 'Superhero Cape',
            type: 'accessory',
            rarity: 'epic',
            unlocked: true,
            unlockedAt: '2024-01-20T14:22:00Z',
            timesUsed: 12
          }
        ],
        unlockProgress: {
          common: { unlocked: 12, total: 20 },
          rare: { unlocked: 8, total: 15 },
          epic: { unlocked: 3, total: 10 },
          legendary: { unlocked: 0, total: 3 }
        },
        usageStats: {
          mostUsedType: 'hat',
          totalCustomizations: 87,
          averageCustomizationsPerSession: 3.2
        },
        recentUnlocks: [
          {
            id: 'magic-boots',
            name: 'Magic Boots',
            type: 'shoes',
            rarity: 'rare',
            unlocked: true,
            unlockedAt: '2024-01-22T16:45:00Z',
            timesUsed: 5
          }
        ]
      };
      
      setData(mockData);
    } catch (err) {
      setError('Failed to load wardrobe analytics');
      console.error('Wardrobe Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const trackItemUsage = useCallback((itemId: string) => {
    if (data) {
      setData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          favoriteItems: prev.favoriteItems.map(item => 
            item.id === itemId 
              ? { ...item, timesUsed: item.timesUsed + 1 }
              : item
          ),
          usageStats: {
            ...prev.usageStats,
            totalCustomizations: prev.usageStats.totalCustomizations + 1
          }
        };
      });
    }
  }, [data]);

  const trackItemUnlock = useCallback((item: WardrobeItem) => {
    if (data) {
      setData(prev => {
        if (!prev) return prev;
        
        const newUnlockedItems = prev.unlockedItems + 1;
        const rarityKey = item.rarity;
        
        return {
          ...prev,
          unlockedItems: newUnlockedItems,
          unlockProgress: {
            ...prev.unlockProgress,
            [rarityKey]: {
              ...prev.unlockProgress[rarityKey],
              unlocked: prev.unlockProgress[rarityKey].unlocked + 1
            }
          },
          recentUnlocks: [item, ...prev.recentUnlocks.slice(0, 4)] // Keep last 5
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
    sessionInteractions,
    refetch: fetchAnalytics,
    trackItemUsage,
    trackItemUnlock
  };
};