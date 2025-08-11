import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WardrobeItem } from '../../services/fastrevkids-api.service';
import { useWardrobe } from '../../hooks/useFastRevKidsApi';

// ==========================================
// MASCOT WARDROBE - SYSTÈME DE COLLECTION
// ==========================================

interface MascotWardrobeProps {
  className?: string;
}

export const MascotWardrobe: React.FC<MascotWardrobeProps> = ({
  className = ''
}) => {
  const { data: wardrobeData, isLoading, unlockItem, equipItem, unequipItem } = useWardrobe();
  const [selectedCategory, setSelectedCategory] = useState<WardrobeItem['type']>('hat');
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState<number | null>(null);

  const categories: Array<{ type: WardrobeItem['type']; label: string; emoji: string }> = [
    { type: 'hat', label: 'Chapeaux', emoji: '🎩' },
    { type: 'clothing', label: 'Vêtements', emoji: '👕' },
    { type: 'accessory', label: 'Accessoires', emoji: '🎒' },
    { type: 'shoes', label: 'Chaussures', emoji: '👟' },
    { type: 'special', label: 'Spéciaux', emoji: '✨' }
  ];

  const RARITY_COLORS = {
    common: '#6B7280',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B'
  };

  const RARITY_LABELS = {
    common: 'Commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire'
  };

  const getItemsByCategory = (category: WardrobeItem['type']) => {
    return wardrobeData?.items?.filter(item => item.type === category) || [];
  };

  const handleItemClick = (item: WardrobeItem) => {
    setSelectedItem(item);
    
    if (!item.isUnlocked) {
      setShowUnlockAnimation(item.id);
      setTimeout(() => setShowUnlockAnimation(null), 2000);
    }
  };

  const handleEquipItem = async (item: WardrobeItem) => {
    if (item.isUnlocked) {
      await equipItem(item.id);
    }
  };

  const handleUnequipItem = async (item: WardrobeItem) => {
    await unequipItem(item.id);
  };

  const isItemEquipped = (item: WardrobeItem) => {
    return item.isEquipped;
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎭 Garde-Robe de la Mascotte
        </h2>
        <p className="text-gray-600">
          {wardrobeData?.summary?.unlocked || 0} / {wardrobeData?.summary?.total || 0} objets débloqués
        </p>
      </div>

      {/* Categories */}
      <div className="flex justify-center mb-6 space-x-2">
        {categories.map((category) => (
          <motion.button
            key={category.type}
            onClick={() => setSelectedCategory(category.type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === category.type
                ? 'bg-purple-100 text-purple-700 shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-2">{category.emoji}</span>
            {category.label}
          </motion.button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <AnimatePresence>
          {getItemsByCategory(selectedCategory).map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className={`relative group cursor-pointer ${
                !item.isUnlocked ? 'opacity-50' : ''
              }`}
              onClick={() => handleItemClick(item)}
            >
              {/* Item Card */}
              <div
                className={`relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 transition-all ${
                  isItemEquipped(item)
                    ? 'border-purple-500 bg-purple-50'
                    : item.isUnlocked
                    ? 'border-gray-200 hover:border-purple-300'
                    : 'border-gray-300'
                }`}
              >
                {/* Item Icon */}
                <div className="text-center mb-3">
                  <div className="text-4xl mb-2">{item.icon}</div>
                  <h3 className="font-semibold text-sm text-gray-800 truncate">
                    {item.name}
                  </h3>
                </div>

                {/* Rarity Badge */}
                <div
                  className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: RARITY_COLORS[item.rarity] }}
                >
                  {RARITY_LABELS[item.rarity]}
                </div>

                {/* Lock Icon */}
                {!item.isUnlocked && (
                  <div className="absolute inset-0 bg-black bg-opacity-20 rounded-xl flex items-center justify-center">
                    <div className="text-2xl">🔒</div>
                  </div>
                )}

                {/* Equipped Badge */}
                {isItemEquipped(item) && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}

                {/* Hover Actions */}
                {item.isUnlocked && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isItemEquipped(item)) {
                          handleUnequipItem(item);
                        } else {
                          handleEquipItem(item);
                        }
                      }}
                      className="bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-medium shadow-lg"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isItemEquipped(item) ? 'Retirer' : 'Équiper'}
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Unlock Animation */}
              <AnimatePresence>
                {showUnlockAnimation === item.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="bg-yellow-400 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                      🔓 Débloqué !
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Selected Item Details */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-xl p-4"
        >
          <div className="flex items-center mb-3">
            <div className="text-3xl mr-3">{selectedItem.icon}</div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">{selectedItem.name}</h3>
              <p className="text-sm text-gray-600">{selectedItem.description}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Rareté:</span>
              <span
                className="font-semibold"
                style={{ color: RARITY_COLORS[selectedItem.rarity] }}
              >
                {RARITY_LABELS[selectedItem.rarity]}
              </span>
            </div>

            {selectedItem.isUnlocked ? (
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <span className="text-green-600 font-semibold">Débloqué</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-600">Condition:</span>
                <span className="text-orange-600 font-semibold">
                  {selectedItem.unlockRequirementValue} {selectedItem.unlockRequirementType}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {selectedItem.isUnlocked && (
            <div className="mt-4 flex space-x-2">
              {isItemEquipped(selectedItem) ? (
                <motion.button
                  onClick={() => handleUnequipItem(selectedItem)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Retirer
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => handleEquipItem(selectedItem)}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Équiper
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Collection Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {Object.entries(RARITY_LABELS).map(([rarity, label]) => {
            const count = wardrobeData?.items?.filter(item => item.rarity === rarity).length || 0;
            return (
              <div key={rarity} className="text-sm">
                <div
                  className="font-bold mb-1"
                  style={{ color: RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] }}
                >
                  {label}
                </div>
                <div className="text-gray-600">{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 