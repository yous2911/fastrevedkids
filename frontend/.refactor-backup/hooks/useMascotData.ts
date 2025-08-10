import { useState, useEffect, useCallback } from 'react';
import { MASCOT_COLLECTION } from '../data/mascotCollection';
import { MascotItem, MascotCollection } from '../types/wahoo.types';

export interface UseMascotDataReturn {
  collection: MascotCollection;
  unlockedItems: string[];
  equippedItems: {
    hat?: string;
    glasses?: string;
    accessory?: string;
    outfit?: string;
    background?: string;
  };
  unlockItem: (itemId: string) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (type: MascotItem['type']) => void;
}

export const useMascotData = (): UseMascotDataReturn => {
  const [collection, setCollection] = useState<MascotCollection>(() => {
    // Initialize from localStorage or default
    const saved = localStorage.getItem('mascotCollection');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          items: MASCOT_COLLECTION.map(item => ({
            ...item,
            unlocked: parsed.items?.find((savedItem: any) => savedItem.id === item.id)?.unlocked || item.unlocked,
            equipped: parsed.items?.find((savedItem: any) => savedItem.id === item.id)?.equipped || item.equipped
          })),
          equippedItems: parsed.equippedItems || {},
          totalItems: MASCOT_COLLECTION.length,
          unlockedItems: MASCOT_COLLECTION.filter(item => 
            parsed.items?.find((savedItem: any) => savedItem.id === item.id)?.unlocked || item.unlocked
          ).length,
          rarityBreakdown: calculateRarityBreakdown(MASCOT_COLLECTION)
        };
      } catch (error) {
        console.error('Error parsing saved mascot collection:', error);
      }
    }
    
    return {
      items: MASCOT_COLLECTION,
      equippedItems: {},
      totalItems: MASCOT_COLLECTION.length,
      unlockedItems: MASCOT_COLLECTION.filter(item => item.unlocked).length,
      rarityBreakdown: calculateRarityBreakdown(MASCOT_COLLECTION)
    };
  });

  // Calculate rarity breakdown
  const calculateRarityBreakdown = (items: MascotItem[]) => {
    return items.reduce((acc, item) => {
      acc[item.rarity] = (acc[item.rarity] || 0) + 1;
      return acc;
    }, {} as Record<MascotItem['rarity'], number>);
  };

  // Save to localStorage whenever collection changes
  useEffect(() => {
    localStorage.setItem('mascotCollection', JSON.stringify(collection));
  }, [collection]);

  // Unlock an item
  const unlockItem = useCallback((itemId: string) => {
    setCollection(prev => {
      const newItems = prev.items.map(item => 
        item.id === itemId ? { ...item, unlocked: true } : item
      );
      
      return {
        ...prev,
        items: newItems,
        unlockedItems: newItems.filter(item => item.unlocked).length
      };
    });

    // Dispatch unlock event
    window.dispatchEvent(new CustomEvent('mascot-item-unlocked', {
      detail: { itemId }
    }));
  }, []);

  // Equip an item
  const equipItem = useCallback((itemId: string) => {
    setCollection(prev => {
      const item = prev.items.find(i => i.id === itemId);
      if (!item || !item.unlocked) return prev;

      // Unequip other items of the same type
      const newItems = prev.items.map(i => ({
        ...i,
        equipped: i.type === item.type ? i.id === itemId : i.equipped
      }));

      const newEquippedItems = {
        ...prev.equippedItems,
        [item.type]: itemId
      };

      return {
        ...prev,
        items: newItems,
        equippedItems: newEquippedItems
      };
    });

    // Dispatch equip event
    window.dispatchEvent(new CustomEvent('mascot-item-equipped', {
      detail: { itemId, type: collection.items.find(i => i.id === itemId)?.type }
    }));
  }, [collection.items]);

  // Unequip an item
  const unequipItem = useCallback((type: MascotItem['type']) => {
    setCollection(prev => {
      const newItems = prev.items.map(item => ({
        ...item,
        equipped: item.type === type ? false : item.equipped
      }));

      const newEquippedItems = { ...prev.equippedItems };
      delete newEquippedItems[type];

      return {
        ...prev,
        items: newItems,
        equippedItems: newEquippedItems
      };
    });

    // Dispatch unequip event
    window.dispatchEvent(new CustomEvent('mascot-item-unequipped', {
      detail: { type }
    }));
  }, []);

  // Listen for achievement events that might unlock items
  useEffect(() => {
    const handleAchievement = (event: CustomEvent) => {
      if (event.detail.type === 'mystery_word_completed') {
        // Check if this achievement unlocks any items
        const unlockedItems = collection.items.filter(item => {
          if (item.unlockCondition.includes('mots mystères') && !item.unlocked) {
            const wordCount = parseInt(item.unlockCondition.match(/\d+/)?.[0] || '0');
            // This would need to be connected to actual mystery word count
            return false; // Placeholder logic
          }
          return false;
        });

        unlockedItems.forEach(item => unlockItem(item.id));
      }
    };

    window.addEventListener('wahoo-achievement', handleAchievement as EventListener);
    
    return () => {
      window.removeEventListener('wahoo-achievement', handleAchievement as EventListener);
    };
  }, [collection.items, unlockItem]);

  return {
    collection,
    unlockedItems: collection.items.filter(item => item.unlocked).map(item => item.id),
    equippedItems: collection.equippedItems,
    unlockItem,
    equipItem,
    unequipItem
  };
}; 