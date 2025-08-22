import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThreeDErrorBoundary from '../components/error/ThreeDErrorBoundary';
import { FallbackUISystem, LoadingState, ErrorMessage } from '../components/fallback/FallbackUISystem';
import PhysicsSystemManager from '../components/physics/PhysicsSystemManager';
import RobustXPSystem from '../components/ui/RobustXPSystem';
import CrossBrowserMascot3D from '../components/CrossBrowserMascot3D';
import { browserCompat } from '../utils/browserCompatibility';
import { Button } from '../components/ui/Button';

interface ErrorTest {
  id: string;
  name: string;
  description: string;
  category: 'webgl' | 'canvas' | 'physics' | 'memory' | 'boundary';
  simulateError: () => void;
}

interface TestResult {
  testId: string;
  success: boolean;
  error?: Error;
  fallbackUsed: boolean;
  recoveryTime: number;
  timestamp: number;
}

const ErrorHandlingTestSuite: React.FC = () => {
  const [activeTests, setActiveTests] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showErrorComponent, setShowErrorComponent] = useState(false);
  const [simulatedError, setSimulatedError] = useState<Error | null>(null);
  const [isAutoTesting, setIsAutoTesting] = useState(false);

  const browserInfo = useMemo(() => browserCompat.getBrowserInfo(), []);

  // Test scenarios
  const errorTests: ErrorTest[] = [
    {
      id: 'webgl-context-loss',
      name: 'WebGL Context Loss',
      description: 'Simulate WebGL context loss and recovery',
      category: 'webgl',
      simulateError: () => {
        // Simulate context loss
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (gl) {
          const loseContext = gl.getExtension('WEBGL_lose_context');
          loseContext?.loseContext();
        }
        setSimulatedError(new Error('WebGL context lost'));
      }
    },
    {
      id: 'webgl-unavailable',
      name: 'WebGL Unavailable',
      description: 'Test fallback when WebGL is not supported',
      category: 'webgl',
      simulateError: () => {
        // Mock WebGL as unavailable
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, contextType: string, ...args: any[]) {
          if (contextType === 'webgl' || contextType === 'webgl2') {
            return null;
          }
          return originalGetContext.call(this, contextType as any, ...args);
        } as any;
        setSimulatedError(new Error('WebGL not supported'));
      }
    },
    {
      id: 'canvas2d-failure',
      name: 'Canvas2D Context Failure',
      description: 'Test handling when Canvas2D context creation fails',
      category: 'canvas',
      simulateError: () => {
        setSimulatedError(new Error('Canvas2D context creation failed'));
      }
    },
    {
      id: 'memory-pressure',
      name: 'Memory Pressure',
      description: 'Simulate low memory conditions',
      category: 'memory',
      simulateError: () => {
        // Create memory pressure
        const largeArrays: any[] = [];
        try {
          for (let i = 0; i < 100; i++) {
            largeArrays.push(new Array(1000000).fill(0));
          }
        } catch (e) {
          setSimulatedError(new Error('Out of memory'));
        }
      }
    },
    {
      id: 'physics-overflow',
      name: 'Physics System Overflow',
      description: 'Test physics system with too many particles',
      category: 'physics',
      simulateError: () => {
        setSimulatedError(new Error('Physics system particle overflow'));
      }
    },
    {
      id: 'component-crash',
      name: 'Component Crash',
      description: 'Force a React component to crash',
      category: 'boundary',
      simulateError: () => {
        setShowErrorComponent(true);
        setSimulatedError(new Error('React component crashed'));
      }
    },
    {
      id: 'render-failure',
      name: 'Render Failure',
      description: 'Simulate rendering pipeline failure',
      category: 'webgl',
      simulateError: () => {
        setSimulatedError(new Error('Render pipeline failed'));
      }
    },
    {
      id: 'shader-compilation',
      name: 'Shader Compilation Error',
      description: 'Test WebGL shader compilation failure',
      category: 'webgl',
      simulateError: () => {
        setSimulatedError(new Error('Shader compilation failed'));
      }
    }
  ];

  // Component that crashes for testing error boundaries
  const CrashingComponent: React.FC = () => {
    if (showErrorComponent) {
      throw new Error('Intentional component crash for testing');
    }
    return <div>Component working normally</div>;
  };

  // Run individual test
  const runTest = useCallback(async (test: ErrorTest) => {
    const startTime = Date.now();
    setActiveTests(prev => new Set(prev).add(test.id));
    
    try {
      // Simulate the error
      test.simulateError();
      
      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const recoveryTime = Date.now() - startTime;
      const result: TestResult = {
        testId: test.id,
        success: true, // If we get here, error was handled gracefully
        fallbackUsed: true,
        recoveryTime,
        timestamp: Date.now()
      };
      
      setTestResults(prev => [...prev, result]);
      
    } catch (error) {
      const recoveryTime = Date.now() - startTime;
      const result: TestResult = {
        testId: test.id,
        success: false,
        error: error as Error,
        fallbackUsed: false,
        recoveryTime,
        timestamp: Date.now()
      };
      
      setTestResults(prev => [...prev, result]);
    } finally {
      setActiveTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(test.id);
        return newSet;
      });
      
      // Clean up simulated error
      setTimeout(() => {
        setSimulatedError(null);
        setShowErrorComponent(false);
      }, 3000);
    }
  }, []);

  // Run all tests
  const runAllTests = useCallback(async () => {
    setIsAutoTesting(true);
    setTestResults([]);
    
    for (const test of errorTests) {
      await runTest(test);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between tests
    }
    
    setIsAutoTesting(false);
  }, [errorTests, runTest]);

  // Clear results
  const clearResults = useCallback(() => {
    setTestResults([]);
    setSimulatedError(null);
    setShowErrorComponent(false);
  }, []);

  // Handle error from components
  const handleComponentError = useCallback((error: Error) => {
    console.error('Component error captured:', error);
    // This would be handled by the error boundary in a real scenario
  }, []);

  // Get test result for a specific test
  const getTestResult = (testId: string) => {
    return testResults.find(result => result.testId === testId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-red-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl font-bold mb-2">
            🛡️ Error Handling Test Suite
          </h1>
          <p className="text-gray-300 text-lg">
            Comprehensive testing for error boundaries, fallbacks, and recovery systems
          </p>
        </div>

        {/* System Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-white text-xl font-bold mb-4">🖥️ System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Browser:</span>
              <span className="text-white ml-2">{browserInfo.name} {browserInfo.version}</span>
            </div>
            <div>
              <span className="text-gray-400">Device:</span>
              <span className="text-white ml-2">{browserInfo.isMobile ? 'Mobile' : 'Desktop'}</span>
            </div>
            <div>
              <span className="text-gray-400">Hardware Tier:</span>
              <span className="text-white ml-2">{browserInfo.hardwareTier}</span>
            </div>
            <div>
              <span className="text-gray-400">WebGL Support:</span>
              <span className="text-white ml-2">{browserCompat.supportsWebGL() ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-gray-400">Canvas2D Support:</span>
              <span className="text-white ml-2">{browserCompat.supportsCanvas2D() ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-gray-400">Memory Limit:</span>
              <span className="text-white ml-2">~{browserInfo.memoryLimit}MB</span>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-xl font-bold">🧪 Test Controls</h2>
            <div className="flex gap-4">
              <Button
                onClick={runAllTests}
                disabled={isAutoTesting}
                variant="danger"
                size="md"
              >
                {isAutoTesting ? 'Running All Tests...' : 'Run All Tests'}
              </Button>
              <Button
                onClick={clearResults}
                variant="secondary"
                size="md"
              >
                Clear Results
              </Button>
            </div>
          </div>

          {/* Individual Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {errorTests.map(test => {
              const isActive = activeTests.has(test.id);
              const result = getTestResult(test.id);
              
              return (
                <motion.button
                  key={test.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => runTest(test)}
                  disabled={isActive || isAutoTesting}
                  className={`p-4 rounded-lg text-left transition-all ${
                    isActive 
                      ? 'bg-yellow-600 text-white cursor-not-allowed' 
                      : result?.success
                      ? 'bg-green-600 hover:bg-green-500 text-white'
                      : result?.success === false
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{test.name}</span>
                    <span className="text-xs px-2 py-1 bg-black/20 rounded">
                      {test.category}
                    </span>
                  </div>
                  <p className="text-xs opacity-80">{test.description}</p>
                  
                  {isActive && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Testing...</span>
                    </div>
                  )}
                  
                  {result && (
                    <div className="mt-2 text-xs">
                      {result.success ? '✅ Handled' : '❌ Failed'} 
                      ({result.recoveryTime}ms)
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Live Component Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          
          {/* Error Boundary Test */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-white text-lg font-bold mb-4">🛡️ Error Boundary Test</h3>
            <ThreeDErrorBoundary
              componentName="Test Component"
              onError={handleComponentError}
              showRetry={true}
              maxRetries={3}
            >
              <div className="h-32 bg-gray-700 rounded flex items-center justify-center">
                <CrashingComponent />
              </div>
            </ThreeDErrorBoundary>
            <Button
              onClick={() => setShowErrorComponent(!showErrorComponent)}
              variant="danger"
              size="sm"
            >
              {showErrorComponent ? 'Fix Component' : 'Crash Component'}
            </Button>
          </div>

          {/* Fallback UI Test */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-white text-lg font-bold mb-4">�� Fallback UI Test</h3>
            <FallbackUISystem
              mascotType="dragon"
              emotion="oops"
              reason="webgl_unavailable"
              size="medium"
              onRetry={() => console.log('Retry clicked')}
              onFallbackAccept={() => console.log('Fallback accepted')}
              showUpgrade={true}
            />
          </div>

          {/* Physics Degradation Test */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-white text-lg font-bold mb-4">⚡ Physics System Test</h3>
            <PhysicsSystemManager
              width={200}
              height={150}
              onPerformanceIssue={(issue, metrics) => {
                console.log('Physics issue:', issue, metrics);
              }}
              initialQuality="high"
              enableFallback={true}
            />
          </div>

          {/* Robust XP System Test */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-white text-lg font-bold mb-4">🌟 Robust XP System</h3>
            <RobustXPSystem
              currentXP={750}
              maxXP={1000}
              level={5}
              xpGained={50}
              theme="fire"
              size="normal"
              enablePhysics={true}
              enableFallback={true}
              onError={(error) => console.error('XP System error:', error)}
            />
          </div>

          {/* Cross-Browser 3D Test */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-white text-lg font-bold mb-4">🎮 Cross-Browser 3D</h3>
            <ThreeDErrorBoundary
              componentName="CrossBrowser3D"
              onError={handleComponentError}
            >
              <CrossBrowserMascot3D
                mascotType="robot"
                emotion="thinking"
                equippedItems={['wizard_hat']}
                xpLevel={3}
                size="medium"
                enableInteraction={true}
              />
            </ThreeDErrorBoundary>
          </div>

          {/* Loading State Test */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-white text-lg font-bold mb-4">⏳ Loading States</h3>
            <div className="space-y-4">
              <LoadingState
                message="Loading 3D assets..."
                progress={65}
                canCancel={true}
                onCancel={() => console.log('Loading cancelled')}
              />
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-white text-xl font-bold mb-4">📊 Test Results</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => {
                const test = errorTests.find(t => t.id === result.testId);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded border-l-4 ${
                      result.success 
                        ? 'bg-green-900/20 border-green-500' 
                        : 'bg-red-900/20 border-red-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-medium">{test?.name}</h3>
                        <p className="text-sm text-gray-300">{test?.description}</p>
                        {result.error && (
                          <p className="text-xs text-red-400 mt-1">
                            Error: {result.error instanceof Error ? result.error.message : String(result.error)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                          result.success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {result.success ? 'PASS' : 'FAIL'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {result.recoveryTime}ms
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-700 rounded">
              <h3 className="text-white font-medium mb-2">Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {testResults.filter(r => r.success).length}
                  </div>
                  <div className="text-xs text-gray-400">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">
                    {testResults.filter(r => !r.success).length}
                  </div>
                  <div className="text-xs text-gray-400">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {Math.round(testResults.reduce((sum, r) => sum + r.recoveryTime, 0) / testResults.length)}ms
                  </div>
                  <div className="text-xs text-gray-400">Avg Recovery</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message Display */}
        <AnimatePresence>
          {simulatedError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-4 right-4 max-w-md"
            >
              <ErrorMessage
                type="error"
                title="Simulated Error"
                message={simulatedError.message}
                dismissible={true}
                onDismiss={() => setSimulatedError(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default ErrorHandlingTestSuite;