import { useState, useEffect } from 'react';
import { MascotCollection } from '../types/wahoo.types';

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
}

export const useMascotData = (): UseMascotDataReturn => {
  const [mascotData, setMascotData] = useState<UseMascotDataReturn>({
    collection: {
      items: [],
      equippedItems: {},
      totalItems: 0,
      unlockedItems: 0,
      rarityBreakdown: {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0
      }
    },
    unlockedItems: [],
    equippedItems: {}
  });

  useEffect(() => {
    // Simulation des données de la collection mascotte
    const mockData: UseMascotDataReturn = {
      collection: {
        items: [],
        equippedItems: {
          hat: 'wizard_hat',
          glasses: 'cool_glasses'
        },
        totalItems: 50,
        unlockedItems: 4,
        rarityBreakdown: {
          common: 2,
          rare: 1,
          epic: 1,
          legendary: 0
        }
      },
      unlockedItems: ['wizard_hat', 'cool_glasses', 'cap', 'detective_hat'],
      equippedItems: {
        hat: 'wizard_hat',
        glasses: 'cool_glasses'
      }
    };

    setMascotData(mockData);
  }, []);

  return mascotData;
}; 