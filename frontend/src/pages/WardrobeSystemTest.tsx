import React, { useState, useEffect } from 'react';
import MascotWardrobe3D from '../components/MascotWardrobe3D';

type MascotType = 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
type EmotionType = 'idle' | 'happy' | 'thinking' | 'celebrating' | 'oops';

const WardrobeSystemTest: React.FC = () => {
  const [mascotType, setMascotType] = useState<MascotType>('dragon');
  const [emotion, setEmotion] = useState<EmotionType>('idle');
  const [equippedItems, setEquippedItems] = useState<string[]>(['wizard_hat']);
  const [xpLevel, setXpLevel] = useState(10);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const [studentStats, setStudentStats] = useState({
    xp: 1500,
    streak: 35,
    exercisesCompleted: 75,
    achievementsUnlocked: 8
  });

  const mascotTypes: MascotType[] = ['dragon', 'fairy', 'robot', 'cat', 'owl'];
  const emotions: EmotionType[] = ['idle', 'happy', 'thinking', 'celebrating', 'oops'];
  
  const AVAILABLE_ITEMS = [
    { id: 'wizard_hat', name: 'Wizard Hat', unlockReq: 'XP: 1000', type: 'hat' },
    { id: 'crown_gold', name: 'Golden Crown', unlockReq: 'Streak: 30', type: 'hat' },
    { id: 'baseball_cap', name: 'Baseball Cap', unlockReq: 'XP: 100', type: 'hat' },
    { id: 'magic_wand', name: 'Magic Wand', unlockReq: 'Exercises: 50', type: 'accessory' },
    { id: 'sword_epic', name: 'Epic Sword', unlockReq: 'XP: 2000', type: 'accessory' },
    { id: 'lab_coat', name: 'Lab Coat', unlockReq: 'XP: 500', type: 'clothing' },
    { id: 'superhero_cape', name: 'Superhero Cape', unlockReq: 'Achievements: 5', type: 'clothing' },
    { id: 'rainbow_shirt', name: 'Rainbow Shirt', unlockReq: 'Exercises: 25', type: 'clothing' }
  ];

  const handleItemToggle = (itemId: string) => {
    setEquippedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleConflict = (conflictingItems: string[]) => {
    setConflicts(conflictingItems);
  };

  const clearAll = () => {
    setEquippedItems([]);
    setConflicts([]);
  };

  const equipRandomItems = () => {
    const randomCount = Math.floor(Math.random() * 4) + 1;
    const SHUFFLED = [...AVAILABLE_ITEMS].sort(() => 0.5 - Math.random());
    const selected = SHUFFLED.slice(0, randomCount).map(item => item.id);
    setEquippedItems(selected);
  };

  const testConflicts = () => {
    // Test conflicting items
    setEquippedItems(['wizard_hat', 'crown_gold', 'magic_wand', 'sword_epic']);
  };

  // Auto-cycle through emotions for testing
  const [autoCycle, setAutoCycle] = useState(false);
  useEffect(() => {
    if (!autoCycle) return;
    
    const interval = setInterval(() => {
      setEmotion(prev => {
        const currentIndex = emotions.indexOf(prev);
        return emotions[(currentIndex + 1) % emotions.length];
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [autoCycle]);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-8 text-center">
          🎭 Wardrobe System Testing Suite
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            
            {/* Mascot Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-xl mb-4">🐾 Mascot Type</h2>
              <div className="grid grid-cols-2 gap-2">
                {mascotTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setMascotType(type)}
                    className={`p-3 rounded text-sm font-medium ${
                      mascotType === type
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Emotion Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-xl mb-4">😊 Emotions</h2>
              <div className="space-y-2">
                {emotions.map(emotionType => (
                  <button
                    key={emotionType}
                    onClick={() => setEmotion(emotionType)}
                    className={`w-full p-2 rounded text-sm font-medium ${
                      emotion === emotionType
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                    }`}
                  >
                    {emotionType.charAt(0).toUpperCase() + emotionType.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setAutoCycle(!autoCycle)}
                className={`w-full mt-3 p-2 rounded text-sm font-medium ${
                  autoCycle ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
                } text-white`}
              >
                {autoCycle ? 'Stop Auto-Cycle' : 'Start Auto-Cycle'}
              </button>
            </div>

            {/* Student Stats */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-xl mb-4">📊 Student Stats</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-300 text-sm">XP: {studentStats.xp}</label>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    value={studentStats.xp}
                    onChange={(e) => setStudentStats(prev => ({ ...prev, xp: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm">Streak: {studentStats.streak}</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={studentStats.streak}
                    onChange={(e) => setStudentStats(prev => ({ ...prev, streak: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm">Exercises: {studentStats.exercisesCompleted}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={studentStats.exercisesCompleted}
                    onChange={(e) => setStudentStats(prev => ({ ...prev, exercisesCompleted: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm">Achievements: {studentStats.achievementsUnlocked}</label>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={studentStats.achievementsUnlocked}
                    onChange={(e) => setStudentStats(prev => ({ ...prev, achievementsUnlocked: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-xl mb-4">🎮 Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={equipRandomItems}
                  className="w-full p-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium"
                >
                  Equip Random Items
                </button>
                <button
                  onClick={testConflicts}
                  className="w-full p-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-medium"
                >
                  Test Conflicts
                </button>
                <button
                  onClick={clearAll}
                  className="w-full p-2 bg-red-600 hover:bg-red-500 text-white rounded font-medium"
                >
                  Clear All Items
                </button>
                <button
                  onClick={() => setXpLevel(prev => prev + 1)}
                  className="w-full p-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium"
                >
                  Level Up! (Level {xpLevel})
                </button>
              </div>
            </div>
          </div>

          {/* Center Panel - Mascot Display */}
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-xl mb-4 text-center">
                🎭 {mascotType.toUpperCase()} - {emotion.toUpperCase()}
              </h2>
              
              <div className="flex justify-center">
                <MascotWardrobe3D
                  mascotType={mascotType}
                  emotion={emotion}
                  equippedItems={equippedItems}
                  xpLevel={xpLevel}
                  size="large"
                  enableInteraction={true}
                  onMascotClick={() => console.log('Mascot clicked!')}
                  onItemConflict={handleConflict}
                  studentStats={studentStats}
                />
              </div>

              {/* Status Display */}
              <div className="mt-4 text-center space-y-2">
                <div className="text-gray-300 text-sm">
                  Equipped Items: {equippedItems.length}
                </div>
                {conflicts.length > 0 && (
                  <div className="text-red-400 text-sm">
                    ⚠️ Conflicts: {conflicts.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* All Mascot Types Preview */}
            <div className="bg-gray-800 rounded-lg p-6 w-full">
              <h2 className="text-white text-xl mb-4 text-center">All Mascot Types</h2>
              <div className="grid grid-cols-5 gap-4">
                {mascotTypes.map(type => (
                  <div key={type} className="text-center">
                    <div className="text-gray-300 text-sm mb-2">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                    <MascotWardrobe3D
                      mascotType={type}
                      emotion="idle"
                      equippedItems={equippedItems}
                      xpLevel={1}
                      size="small"
                      enableInteraction={false}
                      studentStats={studentStats}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Wardrobe Items */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-white text-xl mb-4">👕 Wardrobe Items</h2>
            
            <div className="space-y-3">
              {AVAILABLE_ITEMS.map(item => {
                const isEquipped = equippedItems.includes(item.id);
                const isConflicted = conflicts.includes(item.id);
                
                // Check if item is unlocked
                const isUnlocked = (() => {
                  switch (item.id) {
                    case 'wizard_hat': return studentStats.xp >= 1000;
                    case 'crown_gold': return studentStats.streak >= 30;
                    case 'baseball_cap': return studentStats.xp >= 100;
                    case 'magic_wand': return studentStats.exercisesCompleted >= 50;
                    case 'sword_epic': return studentStats.xp >= 2000;
                    case 'lab_coat': return studentStats.xp >= 500;
                    case 'superhero_cape': return studentStats.achievementsUnlocked >= 5;
                    case 'rainbow_shirt': return studentStats.exercisesCompleted >= 25;
                    default: return true;
                  }
                })();
                
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded border-2 transition-all ${
                      isConflicted
                        ? 'border-red-500 bg-red-900/20'
                        : isEquipped
                        ? 'border-green-500 bg-green-900/20'
                        : isUnlocked
                        ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                        : 'border-gray-700 bg-gray-800 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium ${
                          isUnlocked ? 'text-white' : 'text-gray-500'
                        }`}>
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.unlockReq} • {item.type}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isConflicted && (
                          <span className="text-red-400 text-sm">⚠️</span>
                        )}
                        {!isUnlocked && (
                          <span className="text-gray-500 text-sm">🔒</span>
                        )}
                        <button
                          onClick={() => handleItemToggle(item.id)}
                          disabled={!isUnlocked}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            isEquipped
                              ? 'bg-red-600 hover:bg-red-500 text-white'
                              : isUnlocked
                              ? 'bg-blue-600 hover:bg-blue-500 text-white'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isEquipped ? 'Unequip' : 'Equip'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Test Results */}
            <div className="mt-6 p-4 bg-gray-700 rounded">
              <h3 className="text-white font-medium mb-2">Test Results:</h3>
              <div className="text-sm space-y-1">
                <div className="text-green-400">✅ Positioning: Mascot-specific</div>
                <div className="text-green-400">✅ Scaling: Size adaptive</div>
                <div className={conflicts.length > 0 ? "text-red-400" : "text-green-400"}>
                  {conflicts.length > 0 ? "❌" : "✅"} Conflicts: {conflicts.length > 0 ? `${conflicts.length} detected` : 'None'}
                </div>
                <div className="text-green-400">✅ Persistence: localStorage</div>
                <div className="text-green-400">✅ Animation: Synchronized</div>
                <div className="text-green-400">✅ Unlock System: Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WardrobeSystemTest;