import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { WARDROBE_ITEMS, WardrobeItem } from './WardrobeData';
import { validateWardrobeSystemProps } from '../utils/propValidation';
import { 
  getUnlockedItems, 
  getItemsNearUnlock, 
  validateItemUnlock,
  validateItemMascotCompatibility 
} from '../utils/wardrobeUnlockValidation';
import {
  useKeyboardNavigation,
  useScreenReader,
  useReducedMotion,
  generateAriaLabel,
  useFocusManagement,
  getAnimationProps,
  useHighContrast,
  getAccessibleColor
} from '../utils/accessibility';
import '../styles/wcagColors.css';

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
  // Validate props for security and consistency
  const propValidation = useMemo(() => {
    return validateWardrobeSystemProps({
      studentStats,
      mascotType,
      equippedItems
    });
  }, [studentStats, mascotType, equippedItems]);

  // Use validated/sanitized props
  const validatedStudentStats = propValidation.sanitizedProps.studentStats || studentStats;
  const validatedMascotType = propValidation.sanitizedProps.mascotType || mascotType;
  const validatedEquippedItems = propValidation.sanitizedProps.equippedItems || equippedItems;

  // Log validation errors if any
  if (!propValidation.isValid) {
    console.warn('WardrobeSystem prop validation errors:', propValidation.errors);
  }
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const [focusedItemIndex, setFocusedItemIndex] = useState(0);
  const [focusedCategoryIndex, setFocusedCategoryIndex] = useState(0);
  const [currentFocusArea, setCurrentFocusArea] = useState<'categories' | 'items'>('categories');
  
  // Accessibility hooks
  const { announce } = useScreenReader();
  const reduceMotion = useReducedMotion();
  const isHighContrast = useHighContrast();
  const { focusFirst } = useFocusManagement();
  
  // Refs for focus management
  const wardrobeContainerRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const itemsGridRef = useRef<HTMLDivElement>(null);

  // Check which items are unlocked using secure validation system
  const unlockedItems = useMemo(() => {
    return getUnlockedItems(validatedStudentStats, validatedMascotType);
  }, [validatedStudentStats, validatedMascotType]);

  // Check for newly unlocked items
  useEffect(() => {
    const newUnlocked = unlockedItems.filter(item => 
      !newlyUnlocked.includes(item.id) && !validatedEquippedItems.includes(item.id)
    );
    
    newUnlocked.forEach(item => {
      onNewItemUnlocked(item);
      setNewlyUnlocked(prev => [...prev, item.id]);
    });
  }, [unlockedItems, newlyUnlocked, validatedEquippedItems, onNewItemUnlocked]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return unlockedItems;
    return unlockedItems.filter(item => item.type === selectedCategory);
  }, [unlockedItems, selectedCategory]);

  // Secure item equipping with additional validation
  const handleItemEquip = (itemId: string) => {
    // Double-check item unlock status
    const unlockValidation = validateItemUnlock(itemId, validatedStudentStats);
    if (!unlockValidation.isUnlocked || unlockValidation.securityViolation) {
      console.warn('Attempted to equip locked or invalid item:', itemId);
      return;
    }

    // Check mascot compatibility
    const compatibilityCheck = validateItemMascotCompatibility(itemId, validatedMascotType);
    if (!compatibilityCheck.isCompatible) {
      console.warn('Item not compatible with mascot:', compatibilityCheck.reason);
      return;
    }

    onItemEquip(itemId);
  };

  // Get items near unlock for preview
  const nearUnlockItems = useMemo(() => {
    return getItemsNearUnlock(validatedStudentStats, 50, validatedMascotType);
  }, [validatedStudentStats, validatedMascotType]);

  // Rarity colors
  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500'
  };

  // Categories
  const categories = [
    { id: 'all', name: 'Tous', icon: '👕' },
    { id: 'hat', name: 'Chapeaux', icon: '🎩' },
    { id: 'clothing', name: 'Vêtements', icon: '👔' },
    { id: 'accessory', name: 'Accessoires', icon: '👓' },
    { id: 'shoes', name: 'Chaussures', icon: '👟' },
    { id: 'special', name: 'Spéciaux', icon: '✨' }
  ];

  // Keyboard navigation for categories
  const categoryNavigation = useKeyboardNavigation(
    categories,
    (index) => {
      const category = categories[index];
      setSelectedCategory(category.id);
      setFocusedItemIndex(0); // Reset item focus when switching categories
      announce(`Catégorie sélectionnée: ${category.name}`);
    },
    { orientation: 'horizontal' }
  );

  // Keyboard navigation for items
  const itemNavigation = useKeyboardNavigation(
    filteredItems,
    (index) => {
      const item = filteredItems[index];
      if (item) {
        const isEquipped = validatedEquippedItems.includes(item.id);
        if (isEquipped) {
          onItemUnequip(item.id);
        } else {
          handleItemEquip(item.id);
        }
      }
    },
    { orientation: 'horizontal' }
  );

  // Global keyboard navigation handler
  const handleGlobalKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Tab':
        // Allow natural tab navigation
        break;
      case 'ArrowDown':
        if (currentFocusArea === 'categories') {
          e.preventDefault();
          setCurrentFocusArea('items');
          setFocusedItemIndex(0);
          announce('Navigation vers les objets');
        } else {
          // Handle vertical navigation within items grid
          const itemsPerRow = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 3 : 2;
          const newIndex = Math.min(focusedItemIndex + itemsPerRow, filteredItems.length - 1);
          setFocusedItemIndex(newIndex);
        }
        break;
      case 'ArrowUp':
        if (currentFocusArea === 'items') {
          const itemsPerRow = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 3 : 2;
          if (focusedItemIndex < itemsPerRow) {
            e.preventDefault();
            setCurrentFocusArea('categories');
            announce('Navigation vers les catégories');
          } else {
            const newIndex = Math.max(focusedItemIndex - itemsPerRow, 0);
            setFocusedItemIndex(newIndex);
          }
        }
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        if (currentFocusArea === 'categories') {
          categoryNavigation.handleKeyDown(e);
        } else {
          itemNavigation.handleKeyDown(e);
        }
        break;
      case 'Enter':
      case ' ':
        if (currentFocusArea === 'categories') {
          categoryNavigation.handleKeyDown(e);
        } else {
          itemNavigation.handleKeyDown(e);
        }
        break;
    }
  };

  return (
    <div 
      ref={wardrobeContainerRef}
      className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl mx-auto"
      role="region"
      aria-label="Système de garde-robe"
      onKeyDown={handleGlobalKeyDown}
      tabIndex={-1}
    >
      {/* Skip links */}
      <a 
        href="#wardrobe-categories" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Aller aux catégories
      </a>
      <a 
        href="#wardrobe-items" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 focus:z-50 focus:p-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Aller aux objets
      </a>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 
          className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2"
          id="wardrobe-title"
        >
          <span role="img" aria-label="Garde-robe">👗</span> Garde-Robe Magique
        </h1>
        <p className="text-gray-600" id="wardrobe-description">
          Personnalise ton compagnon avec des prix gagnés en apprenant !
        </p>
      </div>

      {/* Stats Bar */}
      <div 
        className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl"
        role="region"
        aria-label="Statistiques de l'étudiant"
      >
        <div className="text-center">
          <div 
            className="text-2xl font-bold text-purple-600"
            aria-label={`${validatedStudentStats.xp} points d'expérience au total`}
          >
            {validatedStudentStats.xp}
          </div>
          <div className="text-xs text-gray-600">XP Total</div>
        </div>
        <div className="text-center">
          <div 
            className="text-2xl font-bold text-blue-600"
            aria-label={`${validatedStudentStats.streak} jours de série d'apprentissage`}
          >
            {validatedStudentStats.streak}
          </div>
          <div className="text-xs text-gray-600">Série</div>
        </div>
        <div className="text-center">
          <div 
            className="text-2xl font-bold text-green-600"
            aria-label={`${validatedStudentStats.exercisesCompleted} exercices complétés`}
          >
            {validatedStudentStats.exercisesCompleted}
          </div>
          <div className="text-xs text-gray-600">Exercices</div>
        </div>
        <div className="text-center">
          <div 
            className="text-2xl font-bold text-yellow-600"
            aria-label={`${validatedStudentStats.achievementsUnlocked} succès débloqués`}
          >
            {validatedStudentStats.achievementsUnlocked}
          </div>
          <div className="text-xs text-gray-600">Succès</div>
        </div>
      </div>

      {/* Category Tabs */}
      <div 
        ref={categoriesRef}
        className="flex flex-wrap gap-2 mb-6"
        role="tablist"
        aria-label="Catégories d'objets"
        id="wardrobe-categories"
      >
        {categories.map((category, index) => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              setFocusedItemIndex(0);
              announce(`Catégorie ${category.name} sélectionnée`);
            }}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              ${selectedCategory === category.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
              ${currentFocusArea === 'categories' && categoryNavigation.isSelected(index)
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : ''
              }
            `}
            role="tab"
            aria-selected={selectedCategory === category.id}
            aria-controls={`category-${category.id}-panel`}
            id={`category-${category.id}-tab`}
            tabIndex={currentFocusArea === 'categories' && categoryNavigation.isSelected(index) ? 0 : -1}
          >
            <span role="img" aria-label={category.name}>{category.icon}</span> {category.name}
          </button>
        ))}
        
        {/* Instructions for keyboard users */}
        <div className="sr-only" aria-live="polite">
          Utilisez les flèches gauche et droite pour naviguer entre les catégories. 
          Appuyez sur Entrée pour sélectionner. Utilisez flèche bas pour aller aux objets.
        </div>
      </div>

      {/* Items Grid */}
      <div 
        ref={itemsGridRef}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        role="tabpanel"
        aria-labelledby={`category-${selectedCategory}-tab`}
        id={`category-${selectedCategory}-panel`}
      >
        {filteredItems.length > 0 && (
          <div className="sr-only" aria-live="polite">
            {filteredItems.length} objet{filteredItems.length > 1 ? 's' : ''} disponible{filteredItems.length > 1 ? 's' : ''} dans la catégorie {categories.find(c => c.id === selectedCategory)?.name}.
            Utilisez les flèches pour naviguer, Entrée pour équiper ou déséquiper.
          </div>
        )}
        
        {filteredItems.map((item, index) => {
          const isEquipped = validatedEquippedItems.includes(item.id);
          const isNewlyUnlocked = newlyUnlocked.includes(item.id);
          const isFocused = currentFocusArea === 'items' && focusedItemIndex === index;
          const itemAriaLabel = generateAriaLabel.item(item.name, item.rarity, true, isEquipped);

          return (
            <motion.div
              key={item.id}
              {...getAnimationProps(reduceMotion, {
                initial: { opacity: 0, scale: 0.8 },
                animate: { opacity: 1, scale: 1 },
                whileHover: { scale: 1.05 },
                whileTap: { scale: 0.95 }
              }, {
                initial: { opacity: 0 },
                animate: { opacity: 1 }
              })}
              className={`
                relative p-4 rounded-xl cursor-pointer transition-all
                ${isEquipped
                  ? 'ring-4 ring-green-400 bg-green-50'
                  : 'bg-gray-50 hover:bg-gray-100'
                }
                ${isNewlyUnlocked && !reduceMotion ? 'animate-bounce' : ''}
                ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}
              onClick={() => isEquipped ? onItemUnequip(item.id) : handleItemEquip(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  isEquipped ? onItemUnequip(item.id) : handleItemEquip(item.id);
                }
              }}
              tabIndex={isFocused ? 0 : -1}
              role="button"
              aria-label={itemAriaLabel}
              aria-pressed={isEquipped}
              id={`wardrobe-items`}
            >
              {/* New Item Badge */}
              {isNewlyUnlocked && (
                <div 
                  className={`absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full ${!reduceMotion ? 'animate-pulse' : ''}`}
                  aria-label="Objet nouvellement débloqué"
                >
                  NOUVEAU!
                </div>
              )}

              {/* Rarity Border */}
              <div 
                className={`absolute inset-0 rounded-xl bg-gradient-to-r ${rarityColors[item.rarity]} opacity-20`}
                aria-hidden="true"
              />

              {/* Item Icon */}
              <div 
                className="text-4xl text-center mb-2"
                role="img"
                aria-label={item.name}
              >
                {item.icon}
              </div>

              {/* Item Name */}
              <div className="font-bold text-sm text-center mb-1">
                {item.name}
              </div>

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

      {/* Near Unlock Items with Progress */}
      {nearUnlockItems.length > 0 && (
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <h3 className="font-bold text-blue-700 mb-4 text-center">
            🎯 Prochains Débloquages
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {nearUnlockItems.slice(0, 4).map(({ item, progress }) => (
              <div key={item.id} className="text-center p-3 bg-white rounded-lg border-2 border-blue-200 hover:border-blue-300 transition-colors">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xs font-medium mb-1">{item.name}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-blue-600 font-semibold">
                  {Math.round(progress)}% complété
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Items Preview */}
      <div className="mt-8 p-4 bg-gray-100 rounded-xl">
        <h3 className="font-bold text-gray-700 mb-4 text-center">
          🔒 Autres Prix à Débloquer
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WARDROBE_ITEMS
            .filter(item => {
              const isUnlocked = unlockedItems.includes(item);
              const isNearUnlock = nearUnlockItems.some(nearItem => nearItem.item.id === item.id);
              const isCompatible = !item.mascotType || item.mascotType.includes(validatedMascotType);
              return !isUnlocked && !isNearUnlock && isCompatible;
            })
            .slice(0, 4)
            .map(item => {
              const validation = validateItemUnlock(item.id, validatedStudentStats);
              return (
                <div key={item.id} className="text-center p-3 bg-white rounded-lg opacity-60">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xs font-medium mb-1">{item.name}</div>
                  <div className="text-xs text-gray-500">
                    {validation.requirement && (
                      <div>
                        {validation.requirement.type}: {validation.requirement.current}/{validation.requirement.required}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default WardrobeSystem; 
