import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

// Type workaround for THREE.js
declare const THREE: any;

// Wardrobe Items Data Structure
interface WardrobeItem {
  id: string;
  name: string;
  type: 'hat' | 'clothing' | 'accessory' | 'shoes' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockRequirement: {
    type: 'xp' | 'streak' | 'exercises' | 'achievement';
    value: number;
  };
  mascotType?: string[]; // Which mascots can wear this
  position: any;
  scale: any;
  rotation: any;
  color: number;
  geometry: 'box' | 'sphere' | 'cone' | 'cylinder' | 'custom';
  customGeometry?: THREE.BufferGeometry;
  animation?: string;
  magicalEffect?: boolean;
  description: string;
  icon: string;
}

// Wardrobe Database
const WARDROBE_ITEMS: WardrobeItem[] = [
  // HATS
  {
    id: 'wizard_hat',
    name: 'Chapeau de Magicien',
    type: 'hat',
    rarity: 'epic',
    unlockRequirement: { type: 'xp', value: 1000 },
    position: new THREE.Vector3(0, 2.5, 0),
    scale: new THREE.Vector3(0.8, 1.2, 0.8),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0x4B0082,
    geometry: 'cone',
    magicalEffect: true,
    description: 'Un chapeau magique qui scintille d\'étoiles !',
    icon: '🧙‍♂️'
  },
  {
    id: 'crown_gold',
    name: 'Couronne Royale',
    type: 'hat',
    rarity: 'legendary',
    unlockRequirement: { type: 'streak', value: 30 },
    position: new THREE.Vector3(0, 2.3, 0),
    scale: new THREE.Vector3(0.7, 0.4, 0.7),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0xFFD700,
    geometry: 'cylinder',
    magicalEffect: true,
    description: 'Pour les vrais champions de l\'apprentissage !',
    icon: '👑'
  },
  {
    id: 'baseball_cap',
    name: 'Casquette Cool',
    type: 'hat',
    rarity: 'common',
    unlockRequirement: { type: 'exercises', value: 10 },
    position: new THREE.Vector3(0, 2.0, 0.2),
    scale: new THREE.Vector3(0.8, 0.3, 0.8),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0xFF6347,
    geometry: 'cylinder',
    description: 'Style décontracté pour apprendre !',
    icon: '🧢'
  },
  {
    id: 'graduation_cap',
    name: 'Toque d\'Étudiant',
    type: 'hat',
    rarity: 'rare',
    unlockRequirement: { type: 'achievement', value: 5 },
    position: new THREE.Vector3(0, 2.2, 0),
    scale: new THREE.Vector3(0.9, 0.2, 0.9),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0x000000,
    geometry: 'box',
    description: 'Symbole de la réussite scolaire !',
    icon: '🎓'
  },

  // CLOTHING
  {
    id: 'superhero_cape',
    name: 'Cape de Super-Héros',
    type: 'clothing',
    rarity: 'epic',
    unlockRequirement: { type: 'xp', value: 2000 },
    position: new THREE.Vector3(0, 0.5, -0.8),
    scale: new THREE.Vector3(1.2, 1.5, 0.1),
    rotation: new THREE.Vector3(0.2, 0, 0),
    color: 0xFF0000,
    geometry: 'box',
    animation: 'cape_flow',
    magicalEffect: true,
    description: 'Vole vers la connaissance !',
    icon: '🦸‍♀️'
  },
  {
    id: 'lab_coat',
    name: 'Blouse de Scientifique',
    type: 'clothing',
    rarity: 'rare',
    unlockRequirement: { type: 'exercises', value: 50 },
    mascotType: ['robot', 'owl'],
    position: new THREE.Vector3(0, 0, 0.5),
    scale: new THREE.Vector3(1.1, 1.3, 0.2),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0xFFFFFF,
    geometry: 'box',
    description: 'Parfait pour les expériences !',
    icon: '🥽'
  },
  {
    id: 'rainbow_shirt',
    name: 'T-shirt Arc-en-ciel',
    type: 'clothing',
    rarity: 'rare',
    unlockRequirement: { type: 'streak', value: 7 },
    position: new THREE.Vector3(0, 0.2, 0.4),
    scale: new THREE.Vector3(1.0, 0.8, 0.2),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0xFF69B4,
    geometry: 'box',
    magicalEffect: true,
    description: 'Couleurs magiques de l\'apprentissage !',
    icon: '🌈'
  },

  // ACCESSORIES
  {
    id: 'magic_glasses',
    name: 'Lunettes Magiques',
    type: 'accessory',
    rarity: 'rare',
    unlockRequirement: { type: 'xp', value: 500 },
    position: new THREE.Vector3(0, 1.6, 0.45),
    scale: new THREE.Vector3(0.6, 0.2, 0.1),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0x000080,
    geometry: 'box',
    magicalEffect: true,
    description: 'Vois les solutions plus clairement !',
    icon: '👓'
  },
  {
    id: 'magic_wand',
    name: 'Baguette Magique',
    type: 'accessory',
    rarity: 'epic',
    unlockRequirement: { type: 'achievement', value: 10 },
    mascotType: ['fairy', 'dragon'],
    position: new THREE.Vector3(1.2, 0.5, 0),
    scale: new THREE.Vector3(0.1, 1.5, 0.1),
    rotation: new THREE.Vector3(0, 0, -0.3),
    color: 0x8B4513,
    geometry: 'cylinder',
    magicalEffect: true,
    animation: 'wand_sparkle',
    description: 'Transforme chaque erreur en apprentissage !',
    icon: '🪄'
  },
  {
    id: 'bow_tie',
    name: 'Nœud Papillon Élégant',
    type: 'accessory',
    rarity: 'common',
    unlockRequirement: { type: 'exercises', value: 25 },
    position: new THREE.Vector3(0, 1.2, 0.5),
    scale: new THREE.Vector3(0.4, 0.2, 0.15),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0x800080,
    geometry: 'box',
    description: 'Pour les occasions spéciales !',
    icon: '🎀'
  },
  {
    id: 'medal_bronze',
    name: 'Médaille de Bronze',
    type: 'accessory',
    rarity: 'common',
    unlockRequirement: { type: 'exercises', value: 20 },
    position: new THREE.Vector3(0, 0.8, 0.5),
    scale: new THREE.Vector3(0.3, 0.3, 0.05),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0xCD7F32,
    geometry: 'cylinder',
    description: 'Première étape vers la gloire !',
    icon: '🥉'
  },
  {
    id: 'medal_silver',
    name: 'Médaille d\'Argent',
    type: 'accessory',
    rarity: 'rare',
    unlockRequirement: { type: 'streak', value: 14 },
    position: new THREE.Vector3(0, 0.8, 0.5),
    scale: new THREE.Vector3(0.3, 0.3, 0.05),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0xC0C0C0,
    geometry: 'cylinder',
    description: 'Excellent progrès !',
    icon: '🥈'
  },
  {
    id: 'medal_gold',
    name: 'Médaille d\'Or',
    type: 'accessory',
    rarity: 'epic',
    unlockRequirement: { type: 'streak', value: 21 },
    position: new THREE.Vector3(0, 0.8, 0.5),
    scale: new THREE.Vector3(0.3, 0.3, 0.05),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0xFFD700,
    geometry: 'cylinder',
    magicalEffect: true,
    description: 'Champion de l\'apprentissage !',
    icon: '🥇'
  },

  // SHOES
  {
    id: 'magic_boots',
    name: 'Bottes Magiques',
    type: 'shoes',
    rarity: 'epic',
    unlockRequirement: { type: 'xp', value: 1500 },
    position: new THREE.Vector3(0, -1.2, 0.3),
    scale: new THREE.Vector3(0.6, 0.4, 0.8),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0x4B0082,
    geometry: 'box',
    magicalEffect: true,
    animation: 'boots_glow',
    description: 'Marche vers le succès avec style !',
    icon: '👢'
  },
  {
    id: 'sneakers',
    name: 'Baskets de Champion',
    type: 'shoes',
    rarity: 'common',
    unlockRequirement: { type: 'exercises', value: 15 },
    position: new THREE.Vector3(0, -1.2, 0.2),
    scale: new THREE.Vector3(0.5, 0.3, 0.7),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0x00FF00,
    geometry: 'box',
    description: 'Confort et performance !',
    icon: '👟'
  },

  // SPECIAL ITEMS
  {
    id: 'rainbow_aura',
    name: 'Aura Arc-en-ciel',
    type: 'special',
    rarity: 'legendary',
    unlockRequirement: { type: 'achievement', value: 25 },
    position: new THREE.Vector3(0, 0, 0),
    scale: new THREE.Vector3(2, 2, 2),
    rotation: new THREE.Vector3(0, 0, 0),
    color: 0xFFFFFF,
    geometry: 'sphere',
    animation: 'rainbow_pulse',
    magicalEffect: true,
    description: 'Rayonne de toute la magie de tes apprentissages !',
    icon: '✨'
  },
  {
    id: 'fire_wings',
    name: 'Ailes de Feu',
    type: 'special',
    rarity: 'legendary',
    unlockRequirement: { type: 'xp', value: 5000 },
    mascotType: ['dragon', 'fairy'],
    position: new THREE.Vector3(0, 0.5, -0.5),
    scale: new THREE.Vector3(1.5, 1.0, 0.2),
    rotation: new THREE.Vector3(0.2, 0, 0),
    color: 0xFF4500,
    geometry: 'box',
    animation: 'wing_flap',
    magicalEffect: true,
    description: 'Vole au sommet de tes capacités !',
    icon: '🔥'
  }
];

// Wardrobe Component
interface WardrobeSystemProps {
  studentStats: {
    xp: number;
    streak: number;
    exercisesCompleted: number;
    achievementsUnlocked: number;
  };
  mascotType: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  equippedItems: string[];
  onItemEquip: (itemId: string) => void;
  onItemUnequip: (itemId: string) => void;
  onNewItemUnlocked: (item: WardrobeItem) => void;
}

const WardrobeSystem: React.FC<WardrobeSystemProps> = ({
  studentStats,
  mascotType,
  equippedItems,
  onItemEquip,
  onItemUnequip,
  onNewItemUnlocked
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  // Check which items are unlocked
  const unlockedItems = useMemo(() => {
    return WARDROBE_ITEMS.filter(item => {
      // Check mascot compatibility
      if (item.mascotType && !item.mascotType.includes(mascotType)) {
        return false;
      }

      // Check unlock requirements
      switch (item.unlockRequirement.type) {
        case 'xp':
          return studentStats.xp >= item.unlockRequirement.value;
        case 'streak':
          return studentStats.streak >= item.unlockRequirement.value;
        case 'exercises':
          return studentStats.exercisesCompleted >= item.unlockRequirement.value;
        case 'achievement':
          return studentStats.achievementsUnlocked >= item.unlockRequirement.value;
        default:
          return false;
      }
    });
  }, [studentStats, mascotType]);

  // Check for newly unlocked items
  useEffect(() => {
    const newUnlocked = unlockedItems.filter(item => 
      !newlyUnlocked.includes(item.id) && !equippedItems.includes(item.id)
    );
    
    newUnlocked.forEach(item => {
      onNewItemUnlocked(item);
      setNewlyUnlocked(prev => [...prev, item.id]);
    });
  }, [unlockedItems, newlyUnlocked, equippedItems, onNewItemUnlocked]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return unlockedItems;
    return unlockedItems.filter(item => item.type === selectedCategory);
  }, [unlockedItems, selectedCategory]);

  // Rarity colors
  const RARITY_COLORS = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500'
  };

  // Categories
  const CATEGORIES = [
    { id: 'all', name: 'Tous', icon: '👕' },
    { id: 'hat', name: 'Chapeaux', icon: '🎩' },
    { id: 'clothing', name: 'Vêtements', icon: '👔' },
    { id: 'accessory', name: 'Accessoires', icon: '👓' },
    { id: 'shoes', name: 'Chaussures', icon: '👟' },
    { id: 'special', name: 'Spéciaux', icon: '✨' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          👗 Garde-Robe Magique
        </h2>
        <p className="text-gray-600">
          Personnalise ton compagnon avec des prix gagnés en apprenant !
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{studentStats.xp}</div>
          <div className="text-xs text-gray-600">XP Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{studentStats.streak}</div>
          <div className="text-xs text-gray-600">Série</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{studentStats.exercisesCompleted}</div>
          <div className="text-xs text-gray-600">Exercices</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{studentStats.achievementsUnlocked}</div>
          <div className="text-xs text-gray-600">Succès</div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              ${selectedCategory === category.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map(item => {
          const isEquipped = equippedItems.includes(item.id);
          const isNewlyUnlocked = newlyUnlocked.includes(item.id);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative p-4 rounded-xl cursor-pointer transition-all
                ${isEquipped
                  ? 'ring-4 ring-green-400 bg-green-50'
                  : 'bg-gray-50 hover:bg-gray-100'
                }
                ${isNewlyUnlocked ? 'animate-bounce' : ''}
              `}
              onClick={() => isEquipped ? onItemUnequip(item.id) : onItemEquip(item.id)}
            >
              {/* New Item Badge */}
              {isNewlyUnlocked && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  NOUVEAU!
                </div>
              )}

              {/* Rarity Border */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${RARITY_COLORS[item.rarity]} opacity-20`} />

              {/* Item Icon */}
              <div className="text-4xl text-center mb-2">{item.icon}</div>

              {/* Item Name */}
              <div className="font-bold text-sm text-center mb-1">{item.name}</div>

              {/* Rarity */}
              <div className={`text-xs text-center font-medium mb-2 ${
                item.rarity === 'common' ? 'text-gray-600' :
                item.rarity === 'rare' ? 'text-blue-600' :
                item.rarity === 'epic' ? 'text-purple-600' :
                'text-yellow-600'
              }`}>
                {item.rarity === 'common' ? 'Commun' :
                 item.rarity === 'rare' ? 'Rare' :
                 item.rarity === 'epic' ? 'Épique' :
                 'Légendaire'}
              </div>

              {/* Description */}
              <div className="text-xs text-gray-600 text-center leading-tight">
                {item.description}
              </div>

              {/* Magical Effect Indicator */}
              {item.magicalEffect && (
                <div className="absolute top-2 left-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" />
                </div>
              )}

              {/* Equipped Badge */}
              {isEquipped && (
                <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  ✓ Porté
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* No Items Message */}
      {filteredItems.length === 0 && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎁</div>
          <div className="text-xl font-bold text-gray-600 mb-2">
            Aucun objet débloqué dans cette catégorie
          </div>
          <div className="text-gray-500">
            Continue d'apprendre pour débloquer de nouveaux prix !
          </div>
        </div>
      )}

      {/* Locked Items Preview */}
      <div className="mt-8 p-4 bg-gray-100 rounded-xl">
        <h3 className="font-bold text-gray-700 mb-4 text-center">
          🔒 Prochains Prix à Débloquer
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WARDROBE_ITEMS
            .filter(item => !unlockedItems.includes(item) && (!item.mascotType || item.mascotType.includes(mascotType)))
            .slice(0, 4)
            .map(item => (
              <div key={item.id} className="text-center p-3 bg-white rounded-lg opacity-60">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xs font-medium mb-1">{item.name}</div>
                <div className="text-xs text-gray-500">
                  {item.unlockRequirement.type === 'xp' ? `${item.unlockRequirement.value} XP` :
                   item.unlockRequirement.type === 'streak' ? `${item.unlockRequirement.value} jours` :
                   item.unlockRequirement.type === 'exercises' ? `${item.unlockRequirement.value} exercices` :
                   `${item.unlockRequirement.value} succès`}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export { WardrobeSystem };
export default WardrobeSystem; 