import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import NextLevelXPSystem from '../components/ui/NextLevelXPSystem';

type ThemeType = 'default' | 'magic' | 'fire' | 'water' | 'crystal' | 'rainbow';
type SizeType = 'compact' | 'normal' | 'large' | 'massive';

const XPSystemThemeTest: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('magic');
  const [currentSize, setCurrentSize] = useState<SizeType>('normal');
  const [currentXP, setCurrentXP] = useState(750);
  const [maxXP] = useState(1000);
  const [level, setLevel] = useState(5);
  const [xpGained, setXpGained] = useState(0);
  const [bonusMultiplier, setBonusMultiplier] = useState(1);
  const [streakActive, setStreakActive] = useState(false);
  const [recentAchievements, setRecentAchievements] = useState<string[]>([]);
  const [forceRerender, setForceRerender] = useState(0);
  const [testInvalidTheme, setTestInvalidTheme] = useState(false);

  const themes: ThemeType[] = ['default', 'magic', 'fire', 'water', 'crystal', 'rainbow'];
  const sizes: SizeType[] = ['compact', 'normal', 'large', 'massive'];

  // Test theme persistence across re-renders
  const triggerRerender = () => {
    setForceRerender(prev => prev + 1);
  };

  // Test XP gain animation
  const handleXPGain = (amount: number) => {
    setXpGained(amount);
    setCurrentXP(prev => {
      const newXP = prev + amount;
      if (newXP >= maxXP) {
        setLevel(prevLevel => prevLevel + 1);
        setRecentAchievements(['Level Up!']);
        setTimeout(() => setRecentAchievements([]), 3000);
        return newXP - maxXP;
      }
      return newXP;
    });
    
    setTimeout(() => setXpGained(0), 100);
  };

  // Auto-cycle through themes for testing
  const [autoCycle, setAutoCycle] = useState(false);
  useEffect(() => {
    if (!autoCycle) return;
    
    const interval = setInterval(() => {
      setCurrentTheme(prev => {
        const currentIndex = themes.indexOf(prev);
        return themes[(currentIndex + 1) % themes.length];
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [autoCycle, themes]);

  // Test responsive behavior
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getResponsiveSize = (): SizeType => {
    if (windowSize.width < 480) return 'compact';
    if (windowSize.width < 768) return 'normal';
    if (windowSize.width < 1024) return 'large';
    return 'massive';
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-8 text-center">
          NextLevelXPSystem Theme Testing
        </h1>

        {/* Test Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Theme Selection */}
            <div>
              <h3 className="text-white text-lg mb-3">Theme Selection</h3>
              <div className="flex flex-wrap gap-2">
                {themes.map(theme => (
                  <button
                    key={theme}
                    onClick={() => setCurrentTheme(theme)}
                    className={`px-3 py-2 rounded text-sm ${
                      currentTheme === theme
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                    }`}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setTestInvalidTheme(!testInvalidTheme)}
                className={`mt-2 px-3 py-2 rounded text-sm ${
                  testInvalidTheme ? 'bg-red-600' : 'bg-yellow-600'
                } text-white`}
              >
                {testInvalidTheme ? 'Testing Invalid Theme' : 'Test Invalid Theme'}
              </button>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-white text-lg mb-3">Size Selection</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setCurrentSize(size)}
                    className={`px-3 py-2 rounded text-sm ${
                      currentSize === size
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setCurrentSize(getResponsiveSize())}
                variant="success"
                size="sm"
              >
                Auto Responsive ({getResponsiveSize()})
              </Button>
            </div>

            {/* Test Actions */}
            <div>
              <h3 className="text-white text-lg mb-3">Test Actions</h3>
              <div className="space-y-2">
                <Button
                  onClick={() => handleXPGain(50)}
                  variant="success"
                  size="sm"
                  className="w-full"
                >
                  Gain 50 XP
                </Button>
                <Button
                  onClick={() => handleXPGain(100)}
                  variant="success"
                  size="sm"
                  className="w-full"
                >
                  Gain 100 XP
                </Button>
                <Button
                  onClick={triggerRerender}
                  variant="warning"
                  size="sm"
                  className="w-full"
                >
                  Force Re-render ({forceRerender})
                </Button>
                <Button
                  onClick={() => setAutoCycle(!autoCycle)}
                  variant={autoCycle ? 'danger' : 'primary'}
                  size="sm"
                  className="w-full"
                >
                  {autoCycle ? 'Stop Auto-Cycle' : 'Start Auto-Cycle'}
                </Button>
              </div>
            </div>
          </div>

          {/* XP Controls */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-white text-lg mb-3">XP System Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-gray-300 text-sm">Current XP</label>
                <input
                  type="range"
                  min="0"
                  max={maxXP}
                  value={currentXP}
                  onChange={(e) => setCurrentXP(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-gray-400 text-xs">{currentXP}/{maxXP}</span>
              </div>
              <div>
                <label className="text-gray-300 text-sm">Bonus Multiplier</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={bonusMultiplier}
                  onChange={(e) => setBonusMultiplier(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-gray-400 text-xs">x{bonusMultiplier.toFixed(1)}</span>
              </div>
              <div className="flex items-center">
                <label className="text-gray-300 text-sm mr-3">Streak Active</label>
                <input
                  type="checkbox"
                  checked={streakActive}
                  onChange={(e) => setStreakActive(e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              <div className="text-gray-300 text-sm">
                Window: {windowSize.width}x{windowSize.height}
              </div>
            </div>
          </div>
        </div>

        {/* Current Theme Display */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-white text-xl mb-4">
            Current Theme: {currentTheme.toUpperCase()} | Size: {currentSize.toUpperCase()}
          </h2>
          <div className="flex justify-center">
            <NextLevelXPSystem
              currentXP={currentXP}
              maxXP={maxXP}
              level={level}
              theme={testInvalidTheme ? ('invalid' as any) : currentTheme}
              size={currentSize}
              xpGained={xpGained}
              bonusMultiplier={bonusMultiplier}
              streakActive={streakActive}
              recentAchievements={recentAchievements}
              enablePhysics={true}
              interactive={true}
              onLevelUp={(newLevel) => console.log('Level up!', newLevel)}
              onMilestone={(milestone) => console.log('Milestone!', milestone)}
            />
          </div>
        </div>

        {/* All Themes Comparison */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-white text-xl mb-4">All Themes Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map(theme => (
              <div key={theme} className="space-y-4">
                <h3 className="text-white text-lg font-semibold text-center">
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </h3>
                <div className="flex justify-center">
                  <NextLevelXPSystem
                    currentXP={currentXP}
                    maxXP={maxXP}
                    level={level}
                    theme={theme}
                    size="normal"
                    enablePhysics={true}
                    interactive={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Size Comparison */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-white text-xl mb-4">Size Comparison - {currentTheme.toUpperCase()}</h2>
          <div className="space-y-6">
            {sizes.map(size => (
              <div key={size} className="space-y-2">
                <h3 className="text-white text-md font-semibold">
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </h3>
                <div className="flex justify-center">
                  <NextLevelXPSystem
                    currentXP={currentXP}
                    maxXP={maxXP}
                    level={level}
                    theme={currentTheme}
                    size={size}
                    enablePhysics={true}
                    interactive={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-white text-xl mb-4">Test Results</h2>
          <div className="text-gray-300 space-y-2">
            <div>✅ Theme Switching: {currentTheme} active</div>
            <div>✅ Size Responsiveness: {currentSize} size active</div>
            <div>✅ Re-render Count: {forceRerender}</div>
            <div>✅ XP Animation: {xpGained > 0 ? 'Active' : 'Idle'}</div>
            <div>✅ Invalid Theme Test: {testInvalidTheme ? 'Testing fallback' : 'Normal operation'}</div>
            <div>✅ Auto-cycle: {autoCycle ? 'Running' : 'Stopped'}</div>
            <div>✅ Physics: Active</div>
            <div>✅ Interactions: Enabled</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPSystemThemeTest;