import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import NextLevelXPSystem from '../components/ui/NextLevelXPSystem';
import CrossBrowserMascot3D from '../components/CrossBrowserMascot3D';
import MascotWardrobe3D from '../components/MascotWardrobe3D';

type XPTheme = 'default' | 'magic' | 'fire' | 'water' | 'crystal' | 'rainbow';
type MascotType = 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
type EmotionType = 'idle' | 'happy' | 'thinking' | 'celebrating' | 'oops';
type PerformanceType = 'struggling' | 'average' | 'excellent';
type ActivityType = 'idle' | 'exercise' | 'achievement' | 'mistake' | 'learning';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  xp: number;
  theme: XPTheme;
  mascotType: MascotType;
  studentPerformance: PerformanceType;
  activity: ActivityType;
  equippedItems: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}

const ComprehensiveTestSuite: React.FC = () => {
  const [currentTest, setCurrentTest] = useState(0);
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [performanceMetrics, setPerformanceMetrics] = useState({
    frameRate: 60,
    memoryUsage: 0,
    renderTime: 0,
    componentCount: 0
  });
  
  const performanceRef = useRef<{
    startTime: number;
    frameCount: number;
    lastFpsUpdate: number;
  }>({ startTime: Date.now(), frameCount: 0, lastFpsUpdate: Date.now() });

  // Comprehensive test scenarios
  const testScenarios: TestScenario[] = [
    // XP System Theme Tests
    {
      id: 'xp-magic-low',
      name: 'XP Magic Theme - Low XP',
      description: 'Test magic theme with low XP values and bubble generation',
      xp: 150,
      theme: 'magic',
      mascotType: 'fairy',
      studentPerformance: 'struggling',
      activity: 'exercise',
      equippedItems: ['wizard_hat'],
      timeOfDay: 'morning'
    },
    {
      id: 'xp-fire-medium',
      name: 'XP Fire Theme - Medium XP',
      description: 'Test fire theme with medium XP and particle effects',
      xp: 850,
      theme: 'fire',
      mascotType: 'dragon',
      studentPerformance: 'average',
      activity: 'learning',
      equippedItems: ['crown_gold', 'magic_wand'],
      timeOfDay: 'afternoon'
    },
    {
      id: 'xp-water-high',
      name: 'XP Water Theme - High XP',
      description: 'Test water theme with high XP and liquid physics',
      xp: 2500,
      theme: 'water',
      mascotType: 'cat',
      studentPerformance: 'excellent',
      activity: 'achievement',
      equippedItems: ['superhero_cape', 'lab_coat'],
      timeOfDay: 'evening'
    },
    {
      id: 'xp-crystal-max',
      name: 'XP Crystal Theme - Maximum XP',
      description: 'Test crystal theme with maximum XP and prismatic effects',
      xp: 5000,
      theme: 'crystal',
      mascotType: 'owl',
      studentPerformance: 'excellent',
      activity: 'achievement',
      equippedItems: ['wizard_hat', 'sword_epic', 'rainbow_shirt'],
      timeOfDay: 'morning'
    },
    {
      id: 'xp-rainbow-variable',
      name: 'XP Rainbow Theme - Variable XP',
      description: 'Test rainbow theme with changing XP values',
      xp: 1200,
      theme: 'rainbow',
      mascotType: 'robot',
      studentPerformance: 'average',
      activity: 'exercise',
      equippedItems: ['baseball_cap', 'magic_wand'],
      timeOfDay: 'afternoon'
    },
    {
      id: 'xp-default-stress',
      name: 'XP Default Theme - Stress Test',
      description: 'Test default theme with stress conditions',
      xp: 3750,
      theme: 'default',
      mascotType: 'dragon',
      studentPerformance: 'struggling',
      activity: 'mistake',
      equippedItems: [],
      timeOfDay: 'evening'
    },
    // Wardrobe Integration Tests
    {
      id: 'wardrobe-all-items',
      name: 'Wardrobe All Items Test',
      description: 'Test all wardrobe items on different mascots',
      xp: 2000,
      theme: 'magic',
      mascotType: 'fairy',
      studentPerformance: 'excellent',
      activity: 'achievement',
      equippedItems: ['wizard_hat', 'crown_gold', 'magic_wand', 'sword_epic', 'lab_coat', 'superhero_cape', 'rainbow_shirt', 'baseball_cap'],
      timeOfDay: 'morning'
    },
    {
      id: 'wardrobe-conflicts',
      name: 'Wardrobe Conflict Test',
      description: 'Test conflicting items and resolution',
      xp: 1500,
      theme: 'fire',
      mascotType: 'dragon',
      studentPerformance: 'average',
      activity: 'learning',
      equippedItems: ['wizard_hat', 'crown_gold', 'baseball_cap'], // Multiple hats
      timeOfDay: 'afternoon'
    },
    // AI Personality Tests
    {
      id: 'ai-extrovert-patient',
      name: 'AI Extrovert Patient Personality',
      description: 'Test high extroversion and patience traits',
      xp: 1800,
      theme: 'rainbow',
      mascotType: 'cat',
      studentPerformance: 'struggling',
      activity: 'mistake',
      equippedItems: ['magic_wand'],
      timeOfDay: 'morning'
    },
    {
      id: 'ai-introvert-playful',
      name: 'AI Introvert Playful Personality',
      description: 'Test low extroversion, high playfulness',
      xp: 900,
      theme: 'water',
      mascotType: 'owl',
      studentPerformance: 'excellent',
      activity: 'achievement',
      equippedItems: ['superhero_cape'],
      timeOfDay: 'afternoon'
    },
    {
      id: 'ai-intelligent-focused',
      name: 'AI High Intelligence Test',
      description: 'Test high intelligence personality with complex scenarios',
      xp: 3200,
      theme: 'crystal',
      mascotType: 'robot',
      studentPerformance: 'average',
      activity: 'learning',
      equippedItems: ['lab_coat', 'wizard_hat'],
      timeOfDay: 'evening'
    },
    // Performance Stress Tests
    {
      id: 'performance-multiple',
      name: 'Multiple Components Performance',
      description: 'Test performance with multiple animated components',
      xp: 2200,
      theme: 'fire',
      mascotType: 'dragon',
      studentPerformance: 'excellent',
      activity: 'achievement',
      equippedItems: ['crown_gold', 'magic_wand', 'superhero_cape'],
      timeOfDay: 'morning'
    }
  ];

  // Performance monitoring
  const monitorPerformance = useCallback(() => {
    const now = Date.now();
    performanceRef.current.frameCount++;
    
    if (now - performanceRef.current.lastFpsUpdate >= 1000) {
      const fps = performanceRef.current.frameCount;
      performanceRef.current.frameCount = 0;
      performanceRef.current.lastFpsUpdate = now;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        frameRate: fps,
        renderTime: now - performanceRef.current.startTime,
        componentCount: document.querySelectorAll('[data-testid]').length
      }));
    }
    
    requestAnimationFrame(monitorPerformance);
  }, []);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(monitorPerformance);
    return () => cancelAnimationFrame(animationFrame);
  }, [monitorPerformance]);

  // Auto testing functionality
  useEffect(() => {
    if (!isAutoTesting) return;
    
    const interval = setInterval(() => {
      setCurrentTest(prev => {
        const next = (prev + 1) % testScenarios.length;
        if (next === 0) {
          setIsAutoTesting(false);
        }
        return next;
      });
    }, 8000); // 8 seconds per test
    
    return () => clearInterval(interval);
  }, [isAutoTesting, testScenarios.length]);

  const currentScenario = testScenarios[currentTest];

  // Simulate student data based on test scenario
  const getStudentData = (scenario: TestScenario) => ({
    level: Math.floor(scenario.xp / 100) + 1,
    xp: scenario.xp,
    currentStreak: Math.floor(Math.random() * 30) + 1,
    timeOfDay: scenario.timeOfDay,
    recentPerformance: scenario.studentPerformance
  });

  // Handle test result recording
  const recordTestResult = (testId: string, result: any) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: {
        ...result,
        timestamp: Date.now(),
        performance: { ...performanceMetrics }
      }
    }));
  };

  // Responsive test helper
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h1 className="text-white text-3xl font-bold mb-4 text-center">
            🧪 Comprehensive Component Test Suite
          </h1>
          
          {/* Test Controls */}
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <Button
              onClick={() => setIsAutoTesting(!isAutoTesting)}
                             variant={isAutoTesting ? 'danger' : 'success'}
              size="md"
            >
              {isAutoTesting ? 'Stop Auto Test' : 'Start Auto Test'}
            </Button>
            
            <Button
              onClick={() => setCurrentTest((prev) => (prev + 1) % testScenarios.length)}
              variant="primary"
              size="md"
            >
              Next Test ({currentTest + 1}/{testScenarios.length})
            </Button>
            
            <Button
              onClick={() => setTestResults({})}
              variant="secondary"
              size="md"
            >
              Clear Results
            </Button>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-white font-bold">{performanceMetrics.frameRate}</div>
              <div className="text-gray-300 text-sm">FPS</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-white font-bold">{performanceMetrics.componentCount}</div>
              <div className="text-gray-300 text-sm">Components</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-white font-bold">{windowSize.width}x{windowSize.height}</div>
              <div className="text-gray-300 text-sm">Screen Size</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-white font-bold">{windowSize.isMobile ? 'Mobile' : 'Desktop'}</div>
              <div className="text-gray-300 text-sm">Device Type</div>
            </div>
          </div>
        </div>

        {/* Current Test Info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTest}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-800 rounded-lg p-6 mb-6"
          >
            <h2 className="text-white text-xl font-bold mb-2">
              Current Test: {currentScenario.name}
            </h2>
            <p className="text-gray-300 mb-4">{currentScenario.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">XP:</span>
                <span className="text-white ml-2">{currentScenario.xp}</span>
              </div>
              <div>
                <span className="text-gray-400">Theme:</span>
                <span className="text-white ml-2">{currentScenario.theme}</span>
              </div>
              <div>
                <span className="text-gray-400">Mascot:</span>
                <span className="text-white ml-2">{currentScenario.mascotType}</span>
              </div>
              <div>
                <span className="text-gray-400">Performance:</span>
                <span className="text-white ml-2">{currentScenario.studentPerformance}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Test Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* NextLevelXPSystem Test */}
          <motion.div
            layout
            className="bg-gray-800 rounded-lg p-6"
            data-testid="xp-system-test"
          >
            <h3 className="text-white text-lg font-bold mb-4">
              🌟 XP System Test
            </h3>
            <div className="flex justify-center mb-4">
              <NextLevelXPSystem
                currentXP={currentScenario.xp}
                maxXP={Math.ceil(currentScenario.xp / 1000) * 1000}
                level={Math.floor(currentScenario.xp / 100) + 1}
                theme={currentScenario.theme}
                onLevelUp={() => recordTestResult(`${currentScenario.id}-xp`, { levelUp: true })}
              />
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>Theme: {currentScenario.theme}</div>
              <div>XP: {currentScenario.xp} / {Math.ceil(currentScenario.xp / 1000) * 1000}</div>
              <div>Level: {Math.floor(currentScenario.xp / 100) + 1}</div>
            </div>
          </motion.div>

          {/* CrossBrowserMascot3D AI Test */}
          <motion.div
            layout
            className="bg-gray-800 rounded-lg p-6"
            data-testid="ai-mascot-test"
          >
            <h3 className="text-white text-lg font-bold mb-4">
              🤖 AI Mascot Test
            </h3>
            <div className="flex justify-center mb-4">
              <CrossBrowserMascot3D
                mascotType={currentScenario.mascotType}
                studentData={getStudentData(currentScenario)}
                currentActivity={currentScenario.activity}
                equippedItems={currentScenario.equippedItems}
                onMascotInteraction={(interaction) => 
                  recordTestResult(`${currentScenario.id}-ai`, { interaction })
                }
                onEmotionalStateChange={(state) => 
                  recordTestResult(`${currentScenario.id}-ai`, { emotionalState: state })
                }
              />
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>Type: {currentScenario.mascotType}</div>
              <div>Activity: {currentScenario.activity}</div>
              <div>Performance: {currentScenario.studentPerformance}</div>
              <div>Items: {currentScenario.equippedItems.length}</div>
            </div>
          </motion.div>

          {/* MascotWardrobe3D Test */}
          <motion.div
            layout
            className="bg-gray-800 rounded-lg p-6"
            data-testid="wardrobe-test"
          >
            <h3 className="text-white text-lg font-bold mb-4">
              👕 Wardrobe 3D Test
            </h3>
            <div className="flex justify-center mb-4">
              <MascotWardrobe3D
                mascotType={currentScenario.mascotType}
                emotion="happy"
                equippedItems={currentScenario.equippedItems}
                xpLevel={Math.floor(currentScenario.xp / 100) + 1}
                size="medium"
                enableInteraction={true}
                onMascotClick={() => 
                  recordTestResult(`${currentScenario.id}-wardrobe`, { clicked: true })
                }
                onItemConflict={(conflicts) => 
                  recordTestResult(`${currentScenario.id}-wardrobe`, { conflicts })
                }
                studentStats={{
                  xp: currentScenario.xp,
                  streak: 15,
                  exercisesCompleted: 50,
                  achievementsUnlocked: 8
                }}
              />
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>Equipped: {currentScenario.equippedItems.length} items</div>
              <div>Level: {Math.floor(currentScenario.xp / 100) + 1}</div>
              <div>Touch: {windowSize.isMobile ? 'Enabled' : 'Disabled'}</div>
            </div>
          </motion.div>

          {/* Performance Stress Test */}
          {currentScenario.id === 'performance-multiple' && (
            <motion.div
              layout
              className="bg-gray-800 rounded-lg p-6 lg:col-span-2 xl:col-span-3"
              data-testid="performance-stress-test"
            >
              <h3 className="text-white text-lg font-bold mb-4">
                ⚡ Performance Stress Test - Multiple Components
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="flex flex-col items-center space-y-2">
                    <NextLevelXPSystem
                      currentXP={currentScenario.xp + i * 100}
                      maxXP={Math.ceil((currentScenario.xp + i * 100) / 1000) * 1000}
                      level={Math.floor((currentScenario.xp + i * 100) / 100) + 1}
                      theme={['magic', 'fire', 'water', 'crystal', 'rainbow', 'default'][i % 6] as XPTheme}
                      size="compact"
                    />
                    <MascotWardrobe3D
                      mascotType={['dragon', 'fairy', 'robot', 'cat', 'owl'][i % 5] as MascotType}
                      emotion={['idle', 'happy', 'thinking', 'celebrating'][i % 4] as EmotionType}
                      equippedItems={currentScenario.equippedItems.slice(0, (i % 3) + 1)}
                      xpLevel={i + 1}
                      size="small"
                      enableInteraction={false}
                      studentStats={{
                        xp: currentScenario.xp,
                        streak: 15,
                        exercisesCompleted: 50,
                        achievementsUnlocked: 8
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <div className={`text-lg font-bold ${
                  performanceMetrics.frameRate >= 50 ? 'text-green-400' :
                  performanceMetrics.frameRate >= 30 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {performanceMetrics.frameRate} FPS
                </div>
                <div className="text-gray-400 text-sm">
                  {performanceMetrics.componentCount} Active Components
                </div>
              </div>
            </motion.div>
          )}

          {/* Mobile Touch Test */}
          {windowSize.isMobile && (
            <motion.div
              layout
              className="bg-gray-800 rounded-lg p-6 lg:col-span-2"
              data-testid="mobile-touch-test"
            >
              <h3 className="text-white text-lg font-bold mb-4">
                📱 Mobile Touch Test
              </h3>
              <div className="text-gray-300 mb-4">
                Touch interactions enabled. Test tapping, swiping, and multi-touch gestures.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-600 p-4 rounded text-center">
                  <NextLevelXPSystem
                    currentXP={currentScenario.xp}
                    maxXP={Math.ceil(currentScenario.xp / 1000) * 1000}
                    level={Math.floor(currentScenario.xp / 100) + 1}
                    theme={currentScenario.theme}
                    onLevelUp={() => recordTestResult('mobile-xp', { touchInteraction: true })}
                  />
                  <div className="text-xs text-gray-400 mt-2">Touch XP System</div>
                </div>
                <div className="border-2 border-dashed border-gray-600 p-4 rounded text-center">
                  <MascotWardrobe3D
                    mascotType={currentScenario.mascotType}
                    emotion="happy"
                    equippedItems={currentScenario.equippedItems}
                    xpLevel={Math.floor(currentScenario.xp / 100) + 1}
                    size="medium"
                    enableInteraction={true}
                    onMascotClick={() => recordTestResult('mobile-mascot', { touchInteraction: true })}
                    studentStats={{
                      xp: currentScenario.xp,
                      streak: 15,
                      exercisesCompleted: 50,
                      achievementsUnlocked: 8
                    }}
                  />
                  <div className="text-xs text-gray-400 mt-2">Touch Mascot</div>
                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Test Results Summary */}
        {Object.keys(testResults).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6 mt-6"
          >
            <h3 className="text-white text-lg font-bold mb-4">📊 Test Results Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
              {Object.entries(testResults).map(([testId, result]) => (
                <div key={testId} className="bg-gray-700 p-3 rounded">
                  <div className="text-white font-medium text-sm mb-1">
                    {testId}
                  </div>
                  <div className="text-xs text-gray-300">
                    FPS: {result.performance?.frameRate || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-300">
                    Components: {result.performance?.componentCount || 'N/A'}
                  </div>
                  <div className="text-xs text-green-400">
                    ✅ {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default ComprehensiveTestSuite;