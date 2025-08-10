/**
 * Wardrobe Item Testing Interface
 * Comprehensive testing and debugging tool for wardrobe items, equipment combinations, and visual effects
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WardrobeItem {
  id: string;
  name: string;
  category: 'hat' | 'accessory' | 'clothing' | 'shoes' | 'weapon' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockLevel: number;
  stats?: {
    charisma?: number;
    intelligence?: number;
    creativity?: number;
    luck?: number;
  };
  effects?: string[];
  animations?: string[];
  COLORS?: string[];
  materials?: {
    diffuse?: string;
    normal?: string;
    specular?: string;
    metallic?: number;
    roughness?: number;
  };
  compatibility?: string[]; // Compatible with other items
  conflicts?: string[]; // Conflicts with other items
}

interface WardrobeSet {
  id: string;
  name: string;
  items: string[];
  setBonuses: {
    stat: string;
    value: number;
  }[];
  theme: string;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  items: string[];
  mascotType: string;
  emotion: string;
  animation: string;
  lighting: string;
  background: string;
}

interface RenderStats {
  triangleCount: number;
  textureMemory: number; // MB
  renderTime: number; // ms
  drawCalls: number;
  shaderSwitches: number;
}

interface WardrobeTestingInterfaceProps {
  isVisible: boolean;
  onClose: () => void;
  wardrobeSystemRef?: React.RefObject<any>;
  onEquipItem?: (itemId: string) => void;
  onUnequipItem?: (itemId: string) => void;
  onEquipSet?: (setId: string) => void;
  onTestScenario?: (scenario: TestScenario) => void;
}

export const WardrobeTestingInterface: React.FC<WardrobeTestingInterfaceProps> = ({
  isVisible,
  onClose,
  wardrobeSystemRef,
  onEquipItem,
  onUnequipItem,
  onEquipSet,
  onTestScenario
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'sets' | 'testing' | 'performance' | 'compatibility'>('items');
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [wardrobeSets, setWardrobeSets] = useState<WardrobeSet[]>([]);
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([]);
  const [equippedItems, setEquippedItems] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [renderStats, setRenderStats] = useState<RenderStats>({
    triangleCount: 0,
    textureMemory: 0,
    renderTime: 0,
    drawCalls: 0,
    shaderSwitches: 0
  });
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const updateIntervalRef = useRef<NodeJS.Timeout>();
  const testQueueRef = useRef<TestScenario[]>([]);

  // Initialize wardrobe items and sets
  useEffect(() => {
    if (isVisible) {
      initializeWardrobeData();
      initializeTestScenarios();
      startPerformanceMonitoring();
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isVisible]);

  // Initialize wardrobe data
  const initializeWardrobeData = useCallback(() => {
    const items: WardrobeItem[] = [
      // Hats
      {
        id: 'wizard_hat',
        name: 'Wizard Hat',
        category: 'hat',
        rarity: 'rare',
        unlockLevel: 5,
        stats: { intelligence: 10, creativity: 5 },
        effects: ['sparkle', 'glow'],
        animations: ['float', 'twinkle'],
        COLORS: ['purple', 'blue', 'dark_blue'],
        materials: {
          diffuse: '/textures/wizard_hat_diffuse.png',
          normal: '/textures/wizard_hat_normal.png',
          metallic: 0.1,
          roughness: 0.8
        },
        compatibility: ['magic_robe', 'crystal_staff'],
        conflicts: ['baseball_cap', 'crown']
      },
      {
        id: 'graduation_cap',
        name: 'Graduation Cap',
        category: 'hat',
        rarity: 'common',
        unlockLevel: 1,
        stats: { intelligence: 15 },
        effects: ['academic_aura'],
        animations: ['tip_hat'],
        COLORS: ['black', 'navy', 'maroon'],
        materials: {
          diffuse: '/textures/graduation_cap_diffuse.png',
          metallic: 0.0,
          roughness: 0.9
        }
      },
      {
        id: 'baseball_cap',
        name: 'Baseball Cap',
        category: 'hat',
        rarity: 'common',
        unlockLevel: 1,
        stats: { luck: 5 },
        COLORS: ['red', 'blue', 'green', 'yellow'],
        conflicts: ['wizard_hat', 'crown']
      },
      
      // Accessories
      {
        id: 'magic_glasses',
        name: 'Magic Glasses',
        category: 'accessory',
        rarity: 'epic',
        unlockLevel: 8,
        stats: { intelligence: 8, creativity: 12 },
        effects: ['lens_flare', 'insight_glow'],
        animations: ['adjust_glasses', 'glow_pulse'],
        materials: {
          diffuse: '/textures/magic_glasses_diffuse.png',
          specular: '/textures/magic_glasses_specular.png',
          metallic: 0.9,
          roughness: 0.1
        },
        compatibility: ['wizard_hat', 'lab_coat']
      },
      {
        id: 'bow_tie',
        name: 'Bow Tie',
        category: 'accessory',
        rarity: 'rare',
        unlockLevel: 3,
        stats: { charisma: 10 },
        effects: ['dapper_shine'],
        COLORS: ['red', 'black', 'white', 'gold'],
        compatibility: ['tuxedo', 'formal_shirt']
      },
      
      // Clothing
      {
        id: 'superhero_cape',
        name: 'Superhero Cape',
        category: 'clothing',
        rarity: 'legendary',
        unlockLevel: 15,
        stats: { charisma: 20, luck: 10 },
        effects: ['heroic_aura', 'cape_flow', 'wind_effect'],
        animations: ['cape_flutter', 'dramatic_pose'],
        COLORS: ['red', 'blue', 'purple', 'gold'],
        materials: {
          diffuse: '/textures/superhero_cape_diffuse.png',
          normal: '/textures/superhero_cape_normal.png',
          metallic: 0.2,
          roughness: 0.6
        },
        compatibility: ['superhero_mask', 'power_boots']
      },
      {
        id: 'lab_coat',
        name: 'Lab Coat',
        category: 'clothing',
        rarity: 'rare',
        unlockLevel: 6,
        stats: { intelligence: 12, creativity: 8 },
        effects: ['scientific_precision'],
        COLORS: ['white', 'light_blue'],
        compatibility: ['magic_glasses', 'safety_goggles']
      },
      
      // Shoes
      {
        id: 'magic_boots',
        name: 'Magic Boots',
        category: 'shoes',
        rarity: 'epic',
        unlockLevel: 10,
        stats: { luck: 8, creativity: 5 },
        effects: ['magic_trail', 'sparkle_step'],
        animations: ['hover', 'magic_step'],
        COLORS: ['purple', 'silver', 'gold'],
        compatibility: ['wizard_hat', 'magic_robe']
      },
      {
        id: 'sneakers',
        name: 'Cool Sneakers',
        category: 'shoes',
        rarity: 'common',
        unlockLevel: 1,
        stats: { luck: 3 },
        COLORS: ['red', 'blue', 'black', 'white', 'rainbow']
      }
    ];

    const sets: WardrobeSet[] = [
      {
        id: 'wizard_set',
        name: 'Mystical Wizard Set',
        items: ['wizard_hat', 'magic_robe', 'magic_boots', 'crystal_staff'],
        setBonuses: [
          { stat: 'intelligence', value: 25 },
          { stat: 'creativity', value: 15 }
        ],
        theme: 'magic'
      },
      {
        id: 'academic_set',
        name: 'Academic Excellence Set',
        items: ['graduation_cap', 'lab_coat', 'magic_glasses', 'formal_shoes'],
        setBonuses: [
          { stat: 'intelligence', value: 30 }
        ],
        theme: 'academic'
      },
      {
        id: 'superhero_set',
        name: 'Heroic Champion Set',
        items: ['superhero_cape', 'superhero_mask', 'power_boots', 'hero_gloves'],
        setBonuses: [
          { stat: 'charisma', value: 35 },
          { stat: 'luck', value: 20 }
        ],
        theme: 'heroic'
      }
    ];

    setWardrobeItems(items);
    setWardrobeSets(sets);
  }, []);

  // Initialize test scenarios
  const initializeTestScenarios = useCallback(() => {
    const scenarios: TestScenario[] = [
      {
        id: 'basic_hat_test',
        name: 'Basic Hat Test',
        description: 'Test all hats with default mascot',
        items: ['wizard_hat'],
        mascotType: 'dragon',
        emotion: 'happy',
        animation: 'idle',
        lighting: 'default',
        background: 'neutral'
      },
      {
        id: 'full_wizard_set',
        name: 'Full Wizard Set',
        description: 'Test complete wizard set with magical effects',
        items: ['wizard_hat', 'magic_robe', 'magic_boots'],
        mascotType: 'fairy',
        emotion: 'magical',
        animation: 'cast_spell',
        lighting: 'magical',
        background: 'library'
      },
      {
        id: 'mix_and_match',
        name: 'Mix and Match',
        description: 'Test unusual item combinations',
        items: ['graduation_cap', 'superhero_cape', 'sneakers'],
        mascotType: 'robot',
        emotion: 'confused',
        animation: 'scratch_head',
        lighting: 'bright',
        background: 'classroom'
      },
      {
        id: 'performance_stress_test',
        name: 'Performance Stress Test',
        description: 'Maximum items with all effects enabled',
        items: ['wizard_hat', 'magic_glasses', 'superhero_cape', 'magic_boots'],
        mascotType: 'dragon',
        emotion: 'excited',
        animation: 'celebrate',
        lighting: 'dynamic',
        background: 'magical_forest'
      },
      {
        id: 'color_variation_test',
        name: 'Color Variation Test',
        description: 'Test different color combinations',
        items: ['baseball_cap', 'bow_tie', 'sneakers'],
        mascotType: 'cat',
        emotion: 'playful',
        animation: 'dance',
        lighting: 'colorful',
        background: 'rainbow'
      }
    ];

    setTestScenarios(scenarios);
  }, []);

  // Start performance monitoring
  const startPerformanceMonitoring = useCallback(() => {
    updateIntervalRef.current = setInterval(() => {
      if (wardrobeSystemRef?.current) {
        updateRenderStats();
      }
    }, 500); // Update twice per second
  }, [wardrobeSystemRef]);

  // Update render statistics
  const updateRenderStats = useCallback(() => {
    const system = wardrobeSystemRef?.current;
    if (!system) return;

    const stats: RenderStats = {
      triangleCount: system.getTriangleCount?.() || 0,
      textureMemory: system.getTextureMemory?.() || 0,
      renderTime: system.getLastFrameTime?.() || 0,
      drawCalls: system.getDrawCalls?.() || 0,
      shaderSwitches: system.getShaderSwitches?.() || 0
    };

    setRenderStats(stats);
  }, [wardrobeSystemRef]);

  // Filter and search items
  const filteredItems = useMemo(() => {
    return wardrobeItems.filter(item => {
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesRarity = filterRarity === 'all' || item.rarity === filterRarity;
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesRarity && matchesSearch;
    });
  }, [wardrobeItems, filterCategory, filterRarity, searchQuery]);

  // Handle item equip/unequip
  const handleItemToggle = useCallback((itemId: string) => {
    const isEquipped = equippedItems.includes(itemId);
    
    if (isEquipped) {
      setEquippedItems(prev => prev.filter(id => id !== itemId));
      onUnequipItem?.(itemId);
    } else {
      // Check for conflicts
      const item = wardrobeItems.find(i => i.id === itemId);
      if (item?.conflicts) {
        const hasConflict = equippedItems.some(equippedId => 
          item.conflicts?.includes(equippedId)
        );
        if (hasConflict) {
          alert('This item conflicts with currently equipped items!');
          return;
        }
      }

      setEquippedItems(prev => [...prev, itemId]);
      onEquipItem?.(itemId);
    }
  }, [equippedItems, wardrobeItems, onEquipItem, onUnequipItem]);

  // Handle set equip
  const handleSetEquip = useCallback((setId: string) => {
    const set = wardrobeSets.find(s => s.id === setId);
    if (!set) return;

    // Unequip all current items
    setEquippedItems([]);
    equippedItems.forEach(itemId => onUnequipItem?.(itemId));

    // Equip set items
    setTimeout(() => {
      setEquippedItems(set.items);
      onEquipSet?.(setId);
    }, 100);
  }, [wardrobeSets, equippedItems, onEquipSet, onUnequipItem]);

  // Run test scenario
  const handleTestScenario = useCallback(async (scenario: TestScenario) => {
    setIsTestRunning(true);
    
    try {
      // Clear current equipment
      setEquippedItems([]);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Equip scenario items
      setEquippedItems(scenario.items);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Run the test
      onTestScenario?.(scenario);
      
      // Collect results
      const startTime = performance.now();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Run test for 2 seconds
      const endTime = performance.now();
      
      const result = {
        scenario: scenario.name,
        averageRenderTime: (endTime - startTime) / 120, // Approximate frames
        finalStats: { ...renderStats },
        timestamp: Date.now(),
        success: true
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      
    } catch (error) {
      console.error('Test scenario failed:', error);
      const result = {
        scenario: scenario.name,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        success: false
      };
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setIsTestRunning(false);
    }
  }, [renderStats, onTestScenario]);

  // Run all test scenarios
  const handleRunAllTests = useCallback(async () => {
    setTestResults([]);
    for (const scenario of testScenarios) {
      await handleTestScenario(scenario);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between tests
    }
  }, [testScenarios, handleTestScenario]);

  // Get item rarity color
  const getRarityColor = useCallback((rarity: string) => {
    const COLORS = {
      common: 'text-gray-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-yellow-400'
    };
    return COLORS[rarity as keyof typeof COLORS] || 'text-gray-400';
  }, []);

  // Get category icon
  const getCategoryIcon = useCallback((category: string) => {
    const ICONS = {
      hat: '🎩',
      accessory: '👓',
      clothing: '👔',
      shoes: '👟',
      weapon: '⚔️',
      special: '✨'
    };
    return ICONS[category as keyof typeof ICONS] || '📦';
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-4 bg-gray-900 text-white rounded-lg shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Wardrobe Testing Interface</h2>
          <div className="text-sm opacity-80">
            Equipped: {equippedItems.length} items • {filteredItems.length} items shown
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunAllTests}
            disabled={isTestRunning}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isTestRunning 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            {isTestRunning ? '🧪 Testing...' : '🧪 Run All Tests'}
          </button>
          <button
            onClick={() => setEquippedItems([])}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm font-medium"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm font-medium"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex h-full">
        {/* Tabs */}
        <div className="w-48 bg-gray-800 p-4 border-r border-gray-700">
          <div className="space-y-2">
            {[
              { id: 'items', label: 'Items', icon: '👕' },
              { id: 'sets', label: 'Sets', icon: '🎯' },
              { id: 'testing', label: 'Testing', icon: '🧪' },
              { id: 'performance', label: 'Performance', icon: '📊' },
              { id: 'compatibility', label: 'Compatibility', icon: '🔗' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-3 rounded-lg transition-COLORS ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Currently Equipped */}
          <div className="mt-6 p-3 bg-gray-700 rounded-lg">
            <h3 className="font-medium mb-2">Currently Equipped</h3>
            <div className="max-h-32 overflow-auto">
              {equippedItems.length === 0 ? (
                <div className="text-xs text-gray-400">Nothing equipped</div>
              ) : (
                equippedItems.map(itemId => {
                  const item = wardrobeItems.find(i => i.id === itemId);
                  return (
                    <div key={itemId} className="flex items-center gap-2 text-xs py-1">
                      <span>{getCategoryIcon(item?.category || '')}</span>
                      <span className="flex-1 truncate">{item?.name}</span>
                      <button
                        onClick={() => handleItemToggle(itemId)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <h3 className="font-medium mb-2">Performance</h3>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Triangles:</span>
                <span className="text-blue-400">{renderStats.triangleCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Render Time:</span>
                <span className={`${renderStats.renderTime > 16 ? 'text-red-400' : 'text-green-400'}`}>
                  {renderStats.renderTime.toFixed(1)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>Texture Memory:</span>
                <span className="text-purple-400">{renderStats.textureMemory.toFixed(1)}MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              {activeTab === 'items' && (
                <ItemsTab
                  items={filteredItems}
                  equippedItems={equippedItems}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filterCategory={filterCategory}
                  onCategoryChange={setFilterCategory}
                  filterRarity={filterRarity}
                  onRarityChange={setFilterRarity}
                  onItemToggle={handleItemToggle}
                  getRarityColor={getRarityColor}
                  getCategoryIcon={getCategoryIcon}
                />
              )}

              {activeTab === 'sets' && (
                <SetsTab
                  sets={wardrobeSets}
                  wardrobeItems={wardrobeItems}
                  equippedItems={equippedItems}
                  onSetEquip={handleSetEquip}
                  getRarityColor={getRarityColor}
                  getCategoryIcon={getCategoryIcon}
                />
              )}

              {activeTab === 'testing' && (
                <TestingTab
                  scenarios={testScenarios}
                  testResults={testResults}
                  isTestRunning={isTestRunning}
                  onRunTest={handleTestScenario}
                  onRunAllTests={handleRunAllTests}
                />
              )}

              {activeTab === 'performance' && (
                <PerformanceTab
                  renderStats={renderStats}
                  equippedItems={equippedItems}
                  wardrobeItems={wardrobeItems}
                />
              )}

              {activeTab === 'compatibility' && (
                <CompatibilityTab
                  wardrobeItems={wardrobeItems}
                  equippedItems={equippedItems}
                  getCategoryIcon={getCategoryIcon}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Items tab component
const ItemsTab: React.FC<{
  items: WardrobeItem[];
  equippedItems: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterCategory: string;
  onCategoryChange: (category: string) => void;
  filterRarity: string;
  onRarityChange: (rarity: string) => void;
  onItemToggle: (itemId: string) => void;
  getRarityColor: (rarity: string) => string;
  getCategoryIcon: (category: string) => string;
}> = ({ 
  items, 
  equippedItems, 
  searchQuery, 
  onSearchChange,
  filterCategory,
  onCategoryChange,
  filterRarity,
  onRarityChange,
  onItemToggle,
  getRarityColor,
  getCategoryIcon
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-pink-400">Wardrobe Items</h3>

      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
          >
            <option value="all">All Categories</option>
            <option value="hat">Hats</option>
            <option value="accessory">Accessories</option>
            <option value="clothing">Clothing</option>
            <option value="shoes">Shoes</option>
            <option value="weapon">Weapons</option>
            <option value="special">Special</option>
          </select>
          <select
            value={filterRarity}
            onChange={(e) => onRarityChange(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
          >
            <option value="all">All Rarities</option>
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </select>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => {
          const isEquipped = equippedItems.includes(item.id);
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className={`bg-gray-800 rounded-lg p-4 border-2 transition-all cursor-pointer ${
                isEquipped 
                  ? 'border-green-500 bg-green-900/20' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => onItemToggle(item.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <div className="flex gap-2 text-xs">
                      <span className={getRarityColor(item.rarity)}>
                        {item.rarity.toUpperCase()}
                      </span>
                      <span className="text-gray-400">
                        Lv.{item.unlockLevel}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                    isEquipped
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {isEquipped ? '✓' : ''}
                </button>
              </div>

              {/* Stats */}
              {item.stats && (
                <div className="mb-2">
                  <div className="text-xs text-gray-400 mb-1">Stats:</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(item.stats).map(([stat, value]) => (
                      <span key={stat} className="text-xs bg-blue-600 px-2 py-1 rounded">
                        {stat}: +{value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Effects */}
              {item.effects && item.effects.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-gray-400 mb-1">Effects:</div>
                  <div className="flex flex-wrap gap-1">
                    {item.effects.map(effect => (
                      <span key={effect} className="text-xs bg-purple-600 px-2 py-1 rounded">
                        {effect}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {item.COLORS && item.COLORS.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {item.COLORS.map(color => (
                    <div
                      key={color}
                      className="w-4 h-4 rounded border border-gray-600"
                      style={{ backgroundColor: color.startsWith('#') ? color : 
                        color === 'red' ? '#ef4444' :
                        color === 'blue' ? '#3b82f6' :
                        color === 'green' ? '#10b981' :
                        color === 'yellow' ? '#f59e0b' :
                        color === 'purple' ? '#8b5cf6' :
                        color === 'white' ? '#ffffff' :
                        color === 'black' ? '#000000' :
                        '#6b7280'
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Sets tab component
const SetsTab: React.FC<{
  sets: WardrobeSet[];
  wardrobeItems: WardrobeItem[];
  equippedItems: string[];
  onSetEquip: (setId: string) => void;
  getRarityColor: (rarity: string) => string;
  getCategoryIcon: (category: string) => string;
}> = ({ sets, wardrobeItems, equippedItems, onSetEquip, getRarityColor, getCategoryIcon }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-blue-400">Wardrobe Sets</h3>

      <div className="space-y-4">
        {sets.map(set => {
          const setItems = set.items.map(itemId => wardrobeItems.find(i => i.id === itemId)).filter(Boolean) as WardrobeItem[];
          const equippedCount = set.items.filter(itemId => equippedItems.includes(itemId)).length;
          const isCompletelyEquipped = equippedCount === set.items.length;

          return (
            <div
              key={set.id}
              className={`bg-gray-800 rounded-lg p-4 border-2 ${
                isCompletelyEquipped ? 'border-gold-500 bg-gold-900/20' : 'border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-medium">{set.name}</h4>
                  <div className="text-sm text-gray-400">
                    {equippedCount}/{set.items.length} items equipped • {set.theme} theme
                  </div>
                </div>
                <button
                  onClick={() => onSetEquip(set.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium"
                >
                  Equip Set
                </button>
              </div>

              {/* Set Items */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {setItems.map(item => (
                  <div
                    key={item.id}
                    className={`p-3 rounded border ${
                      equippedItems.includes(item.id)
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-gray-600 bg-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-xl mb-1">{getCategoryIcon(item.category)}</div>
                      <div className="text-xs font-medium">{item.name}</div>
                      <div className={`text-xs ${getRarityColor(item.rarity)}`}>
                        {item.rarity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Set Bonuses */}
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm font-medium mb-2">Set Bonuses:</div>
                <div className="flex flex-wrap gap-2">
                  {set.setBonuses.map((bonus, index) => (
                    <span
                      key={index}
                      className={`text-xs px-2 py-1 rounded ${
                        isCompletelyEquipped 
                          ? 'bg-gold-600 text-black' 
                          : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {bonus.stat}: +{bonus.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Testing tab component
const TestingTab: React.FC<{
  scenarios: TestScenario[];
  testResults: any[];
  isTestRunning: boolean;
  onRunTest: (scenario: TestScenario) => void;
  onRunAllTests: () => void;
}> = ({ scenarios, testResults, isTestRunning, onRunTest, onRunAllTests }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-green-400">Test Scenarios</h3>
        <button
          onClick={onRunAllTests}
          disabled={isTestRunning}
          className={`px-4 py-2 rounded font-medium ${
            isTestRunning 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-500'
          }`}
        >
          {isTestRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {/* Test Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {scenarios.map(scenario => (
          <div key={scenario.id} className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium">{scenario.name}</h4>
                <p className="text-sm text-gray-400 mt-1">{scenario.description}</p>
              </div>
              <button
                onClick={() => onRunTest(scenario)}
                disabled={isTestRunning}
                className={`px-3 py-1 rounded text-sm ${
                  isTestRunning 
                    ? 'bg-gray-600 text-gray-400' 
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                Run Test
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div><span className="text-gray-400">Items:</span> {scenario.items.join(', ')}</div>
              <div><span className="text-gray-400">Mascot:</span> {scenario.mascotType}</div>
              <div><span className="text-gray-400">Animation:</span> {scenario.animation}</div>
              <div><span className="text-gray-400">Lighting:</span> {scenario.lighting}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium mb-3">Recent Test Results</h4>
          <div className="space-y-2 max-h-64 overflow-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  result.success 
                    ? 'border-green-500 bg-green-900/20' 
                    : 'border-red-500 bg-red-900/20'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium">{result.scenario}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {result.success ? (
                  <div className="text-xs mt-1 space-y-1">
                    <div>Avg Render Time: {result.averageRenderTime?.toFixed(1)}ms</div>
                    <div>Triangles: {result.finalStats?.triangleCount?.toLocaleString()}</div>
                    <div>Texture Memory: {result.finalStats?.textureMemory?.toFixed(1)}MB</div>
                  </div>
                ) : (
                  <div className="text-xs mt-1 text-red-400">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Performance tab component
const PerformanceTab: React.FC<{
  renderStats: RenderStats;
  equippedItems: string[];
  wardrobeItems: WardrobeItem[];
}> = ({ renderStats, equippedItems, wardrobeItems }) => {
  const equippedItemsData = equippedItems.map(itemId => 
    wardrobeItems.find(item => item.id === itemId)
  ).filter(Boolean) as WardrobeItem[];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-orange-400">Performance Metrics</h3>

      {/* Current Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Triangle Count</div>
          <div className="text-2xl font-bold text-blue-400">
            {renderStats.triangleCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Render Time</div>
          <div className={`text-2xl font-bold ${
            renderStats.renderTime > 16 ? 'text-red-400' : 'text-green-400'
          }`}>
            {renderStats.renderTime.toFixed(1)}ms
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Texture Memory</div>
          <div className="text-2xl font-bold text-purple-400">
            {renderStats.textureMemory.toFixed(1)}MB
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Draw Calls</div>
          <div className="text-2xl font-bold text-yellow-400">
            {renderStats.drawCalls}
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Performance Analysis</h4>
        <div className="space-y-2 text-sm">
          {renderStats.renderTime > 33 && (
            <div className="text-red-400">⚠️ Render time exceeds 30fps target (33ms)</div>
          )}
          {renderStats.renderTime > 16 && renderStats.renderTime <= 33 && (
            <div className="text-yellow-400">⚠️ Render time exceeds 60fps target (16ms)</div>
          )}
          {renderStats.triangleCount > 100000 && (
            <div className="text-orange-400">⚠️ High polygon count may impact performance</div>
          )}
          {renderStats.textureMemory > 100 && (
            <div className="text-red-400">⚠️ High texture memory usage</div>
          )}
          {renderStats.drawCalls > 50 && (
            <div className="text-yellow-400">⚠️ High draw call count</div>
          )}
          {renderStats.renderTime <= 16 && renderStats.triangleCount < 50000 && (
            <div className="text-green-400">✓ Performance is optimal</div>
          )}
        </div>
      </div>

      {/* Equipped Items Impact */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Equipped Items Impact</h4>
        <div className="space-y-2">
          {equippedItemsData.map(item => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span>{item.name}</span>
              <div className="flex gap-2 text-xs">
                <span className="text-blue-400">~5K tri</span>
                <span className="text-purple-400">~2MB tex</span>
                <span className="text-yellow-400">+1 draw</span>
              </div>
            </div>
          ))}
          {equippedItemsData.length === 0 && (
            <div className="text-gray-500">No items equipped</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Compatibility tab component
const CompatibilityTab: React.FC<{
  wardrobeItems: WardrobeItem[];
  equippedItems: string[];
  getCategoryIcon: (category: string) => string;
}> = ({ wardrobeItems, equippedItems, getCategoryIcon }) => {
  const compatibilityMatrix = useMemo(() => {
    const matrix: Record<string, { compatible: string[]; conflicts: string[] }> = {};
    
    wardrobeItems.forEach(item => {
      matrix[item.id] = {
        compatible: item.compatibility || [],
        conflicts: item.conflicts || []
      };
    });
    
    return matrix;
  }, [wardrobeItems]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-cyan-400">Item Compatibility</h3>

      {/* Current Conflicts */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Current Equipment Status</h4>
        {equippedItems.length === 0 ? (
          <div className="text-gray-500">No items equipped</div>
        ) : (
          <div className="space-y-2">
            {equippedItems.map(itemId => {
              const item = wardrobeItems.find(i => i.id === itemId);
              const conflicts = equippedItems.filter(equippedId => 
                compatibilityMatrix[itemId]?.conflicts?.includes(equippedId)
              );
              const compatible = equippedItems.filter(equippedId => 
                compatibilityMatrix[itemId]?.compatible?.includes(equippedId)
              );
              
              return (
                <div key={itemId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{getCategoryIcon(item?.category || '')}</span>
                    <span>{item?.name}</span>
                  </div>
                  <div className="flex gap-2">
                    {compatible.length > 0 && (
                      <span className="text-xs bg-green-600 px-2 py-1 rounded">
                        +{compatible.length} synergy
                      </span>
                    )}
                    {conflicts.length > 0 && (
                      <span className="text-xs bg-red-600 px-2 py-1 rounded">
                        {conflicts.length} conflicts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compatibility Matrix */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Item Relationships</h4>
        <div className="max-h-96 overflow-auto">
          {wardrobeItems.map(item => {
            const hasRelationships = (item.compatibility && item.compatibility.length > 0) || 
                                   (item.conflicts && item.conflicts.length > 0);
            
            if (!hasRelationships) return null;
            
            return (
              <div key={item.id} className="mb-4 p-3 bg-gray-700 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span>{getCategoryIcon(item.category)}</span>
                  <span className="font-medium">{item.name}</span>
                </div>
                
                {item.compatibility && item.compatibility.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-green-400 mb-1">Compatible with:</div>
                    <div className="flex flex-wrap gap-1">
                      {item.compatibility.map(compatId => {
                        const compatItem = wardrobeItems.find(i => i.id === compatId);
                        return (
                          <span key={compatId} className="text-xs bg-green-600 px-2 py-1 rounded">
                            {compatItem?.name || compatId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {item.conflicts && item.conflicts.length > 0 && (
                  <div>
                    <div className="text-xs text-red-400 mb-1">Conflicts with:</div>
                    <div className="flex flex-wrap gap-1">
                      {item.conflicts.map(conflictId => {
                        const conflictItem = wardrobeItems.find(i => i.id === conflictId);
                        return (
                          <span key={conflictId} className="text-xs bg-red-600 px-2 py-1 rounded">
                            {conflictItem?.name || conflictId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WardrobeTestingInterface;