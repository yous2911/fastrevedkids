import React, { useState } from 'react';
import AdvancedParticleEngine from '../components/ui/AdvancedParticleEngine';
import AdvancedMascotSystem from '../components/ui/AdvancedMascotSystem';
import NextLevelXPSystem from '../components/ui/NextLevelXPSystem';
import SparkyMascot3D from '../components/ui/SparkyMascot3D';
import WardrobeSystem from '../components/ui/WardrobeSystem';

const AdvancedDemo: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<string>('particles');

  const components = {
    particles: { 
      name: 'Particle Engine', 
      component: () => <AdvancedParticleEngine particleType="sparkle" intensity="high" isActive={true} />
    },
    mascot: { 
      name: 'Advanced Mascot', 
      component: () => (
        <AdvancedMascotSystem 
          mascotType="dragon"
          studentData={{ 
            level: 5, 
            xp: 1250, 
            currentStreak: 7, 
            timeOfDay: "afternoon", 
            recentPerformance: "excellent" 
          }}
          currentActivity="learning"
          equippedItems={["hat_wizard", "wand_crystal"]}
          onMascotInteraction={(interaction) => console.log('Interaction:', interaction)}
          onEmotionalStateChange={(state) => console.log('Emotional state:', state)}
        />
      )
    },
    xp: { 
      name: 'XP System', 
      component: () => (
        <NextLevelXPSystem 
          currentXP={750}
          maxXP={1000}
          level={5}
        />
      )
    },
    sparky: { 
      name: 'Sparky 3D', 
      component: () => (
        <SparkyMascot3D 
          mascotType="dragon"
          emotion="happy"
          items={["crystal", "wand", "hat"]}
          xpLevel={5}
        />
      )
    },
    wardrobe: { 
      name: 'Wardrobe System', 
      component: () => (
        <WardrobeSystem 
          studentStats={{ xp: 1250, streak: 7, exercisesCompleted: 45, achievementsUnlocked: 12 }}
          mascotType="dragon"
          equippedItems={["hat_wizard", "wand_crystal"]}
          onItemEquip={(item) => console.log('Equipped:', item)}
          onItemUnequip={(item) => console.log('Unequipped:', item)}
          onNewItemUnlocked={(item) => console.log('New item unlocked:', item)}
        />
      )
    }
  };

  const ActiveComponent = components[activeComponent as keyof typeof components]?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-magical-violet-glow via-magical-blue-glow to-magical-green-glow p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-display text-center text-magical-violet mb-8 animate-bounce-happy">
          🎪 Advanced Components Demo
        </h1>
        
        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {Object.entries(components).map(([key, { name }]) => (
            <button
              key={key}
              onClick={() => setActiveComponent(key)}
              className={`px-6 py-3 rounded-magical font-magical text-lg transition-all duration-300 ${
                activeComponent === key
                  ? 'bg-magical-violet text-white shadow-magical-lg scale-105'
                  : 'bg-white/80 text-magical-violet hover:bg-magical-violet-glow hover:scale-105 shadow-magical'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Component Display */}
        <div className="bg-white/90 rounded-magical p-6 shadow-magical min-h-[600px]">
          <h2 className="text-2xl font-display text-magical-violet mb-4 text-center">
            {components[activeComponent as keyof typeof components]?.name}
          </h2>
          <div className="flex justify-center">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white/80 rounded-magical p-6 shadow-magical">
          <h3 className="text-xl font-display text-magical-violet mb-4">
            🎮 How to Test:
          </h3>
          <ul className="space-y-2 text-neutral-700">
            <li>• <strong>Particle Engine:</strong> Click to create particles, drag to move them</li>
            <li>• <strong>Advanced Mascot:</strong> Interact with the AI mascot, watch mood changes</li>
            <li>• <strong>XP System:</strong> Click to gain XP, watch liquid physics and level ups</li>
            <li>• <strong>Sparky 3D:</strong> Rotate the 3D mascot, collect items</li>
            <li>• <strong>Wardrobe System:</strong> Browse and equip different items</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDemo; 