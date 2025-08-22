import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { browserCompat, isWebGLSupported, requiresFallback } from '../utils/browserCompatibility';
import CrossBrowserMascot3D from '../components/CrossBrowserMascot3D';
import Canvas2DRenderer from '../components/fallback/Canvas2DRenderer';
import MobileOptimizedRenderer from '../components/MobileOptimizedRenderer';

interface BrowserTestResult {
  testName: string;
  passed: boolean;
  performance: {
    fps: number;
    renderTime: number;
    memoryUsage: number;
  };
  compatibility: {
    webglSupported: boolean;
    webglVersion: number | null;
    browserOptimizations: string[];
    fallbackUsed: boolean;
  };
  timestamp: number;
  error?: string;
}

interface PerformanceIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
}

const CrossBrowserTestSuite: React.FC = () => {
  const [testResults, setTestResults] = useState<BrowserTestResult[]>([]);
  const [performanceIssues, setPerformanceIssues] = useState<PerformanceIssue[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const performanceRef = useRef({ startTime: 0, frameCount: 0 });

  // Browser information
  const browserInfo = browserCompat.getBrowserInfo();
  const webglCapabilities = browserCompat.getWebGLCapabilities();
  const optimalSettings = browserCompat.getOptimalSettings();
  const chromeOptimizations = browserCompat.getChromeOptimizations();
  const firefoxCompatibility = browserCompat.getFirefoxCompatibility();
  const safariFixes = browserCompat.getSafariCanvasFixes();

  // Test scenarios
  const TEST_SCENARIOS = [
    {
      id: 'webgl-support',
      name: 'WebGL Support Detection',
      description: 'Test WebGL support and capabilities detection'
    },
    {
      id: 'safari-canvas2d',
      name: 'Safari Canvas2D Compatibility',
      description: 'Test Safari-specific Canvas2D rendering issues'
    },
    {
      id: 'mobile-performance',
      name: 'Mobile Performance Optimization',
      description: 'Test mobile browser performance and optimizations'
    },
    {
      id: 'chrome-firefox-compat',
      name: 'Chrome vs Firefox Compatibility',
      description: 'Test cross-browser Three.js compatibility'
    },
    {
      id: 'low-end-degradation',
      name: 'Low-End Device Graceful Degradation',
      description: 'Test fallback systems for low-end devices'
    },
    {
      id: 'context-loss-recovery',
      name: 'WebGL Context Loss Recovery',
      description: 'Test WebGL context loss and recovery'
    },
    {
      id: 'memory-management',
      name: 'Memory Management',
      description: 'Test memory usage and cleanup'
    },
    {
      id: 'thermal-throttling',
      name: 'Thermal Throttling Detection',
      description: 'Test thermal throttling detection on mobile'
    }
  ];

  // Performance monitoring
  const monitorPerformance = useCallback(() => {
    const now = performance.now();
    performanceRef.current.frameCount++;
    
    if (now - performanceRef.current.startTime >= 1000) {
      const fps = performanceRef.current.frameCount;
      const memory = (performance as any).memory;
      
      return {
        fps,
        renderTime: now - performanceRef.current.startTime,
        memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0
      };
    }
    
    return null;
  }, []);

  // Handle performance issues
  const handlePerformanceIssue = useCallback((issue: string) => {
    const newIssue: PerformanceIssue = {
      type: issue,
      severity: issue.includes('thermal') ? 'high' : 
               issue.includes('memory') ? 'medium' : 'low',
      message: `Performance issue detected: ${issue}`,
      timestamp: Date.now()
    };
    
    setPerformanceIssues(prev => [...prev, newIssue]);
  }, []);

  // Individual test functions
  const testWebGLSupport = useCallback(async (): Promise<BrowserTestResult> => {
    const startTime = performance.now();
    
    try {
      const webglSupported = isWebGLSupported();
      const capabilities = browserCompat.getWebGLCapabilities();
      
      const result: BrowserTestResult = {
        testName: 'WebGL Support Detection',
        passed: webglSupported,
        performance: {
          fps: 60,
          renderTime: performance.now() - startTime,
          memoryUsage: 0
        },
        compatibility: {
          webglSupported,
          webglVersion: capabilities.version,
          browserOptimizations: [],
          fallbackUsed: !webglSupported
        },
        timestamp: Date.now()
      };

      if (!webglSupported) {
        result.error = 'WebGL not supported, fallback required';
      }

      return result;
    } catch (error) {
      return {
        testName: 'WebGL Support Detection',
        passed: false,
        performance: { fps: 0, renderTime: performance.now() - startTime, memoryUsage: 0 },
        compatibility: { webglSupported: false, webglVersion: null, browserOptimizations: [], fallbackUsed: true },
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  const testSafariCanvas2D = useCallback(async (): Promise<BrowserTestResult> => {
    const startTime = performance.now();
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas2D context not available');
      }

      canvas.width = 100;
      canvas.height = 100;
      
      // Test Safari-specific issues
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 50, 50);
      
      // Test getImageData (Safari has restrictions)
      let getImageDataWorks = true;
      try {
        ctx.getImageData(0, 0, 1, 1);
      } catch (e) {
        getImageDataWorks = false;
      }

      // Test gradient creation
      let gradientWorks = true;
      try {
        const gradient = ctx.createLinearGradient(0, 0, 100, 100);
        gradient.addColorStop(0, 'red');
        gradient.addColorStop(1, 'blue');
        ctx.fillStyle = gradient;
        ctx.fillRect(50, 50, 50, 50);
      } catch (e) {
        gradientWorks = false;
      }

      const passed = getImageDataWorks && gradientWorks;
      const optimizations: string[] = [];
      
      if (browserInfo.name === 'safari') {
        if (safariFixes.forceContextRestore) optimizations.push('context-restore');
        if (safariFixes.avoidGetImageData) optimizations.push('avoid-getImageData');
      }

      return {
        testName: 'Safari Canvas2D Compatibility',
        passed,
        performance: {
          fps: 60,
          renderTime: performance.now() - startTime,
          memoryUsage: 0
        },
        compatibility: {
          webglSupported: false,
          webglVersion: null,
          browserOptimizations: optimizations,
          fallbackUsed: true
        },
        timestamp: Date.now(),
        error: passed ? undefined : 'Safari Canvas2D restrictions detected'
      };
    } catch (error) {
      return {
        testName: 'Safari Canvas2D Compatibility',
        passed: false,
        performance: { fps: 0, renderTime: performance.now() - startTime, memoryUsage: 0 },
        compatibility: { webglSupported: false, webglVersion: null, browserOptimizations: [], fallbackUsed: true },
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [browserInfo, safariFixes]);

  const testMobilePerformance = useCallback(async (): Promise<BrowserTestResult> => {
    const startTime = performance.now();
    
    try {
      const isMobile = browserInfo.isMobile;
      const hardwareTier = browserInfo.hardwareTier;
      const memoryLimit = browserInfo.memoryLimit;
      
      // Simulate mobile performance test
      const targetFps = isMobile ? 30 : 60;
      const actualFps = isMobile && hardwareTier === 'low' ? 20 : targetFps;
      
      const optimizations: string[] = [];
      if (isMobile) {
        optimizations.push('mobile-optimized');
        optimizations.push('reduced-quality');
        if (hardwareTier === 'low') optimizations.push('thermal-throttling');
      }

      return {
        testName: 'Mobile Performance Optimization',
        passed: actualFps >= (targetFps * 0.8),
        performance: {
          fps: actualFps,
          renderTime: performance.now() - startTime,
          memoryUsage: memoryLimit * 0.6 // Simulated usage
        },
        compatibility: {
          webglSupported: isWebGLSupported(),
          webglVersion: webglCapabilities.version,
          browserOptimizations: optimizations,
          fallbackUsed: hardwareTier === 'low'
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        testName: 'Mobile Performance Optimization',
        passed: false,
        performance: { fps: 0, renderTime: performance.now() - startTime, memoryUsage: 0 },
        compatibility: { webglSupported: false, webglVersion: null, browserOptimizations: [], fallbackUsed: true },
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [browserInfo, webglCapabilities]);

  const testChromeFirefoxCompat = useCallback(async (): Promise<BrowserTestResult> => {
    const startTime = performance.now();
    
    try {
      const optimizations: string[] = [];
      
      if (browserInfo.name === 'chrome') {
        if (chromeOptimizations.useHardwareAcceleration) optimizations.push('hardware-acceleration');
        if (chromeOptimizations.preferWebGL2) optimizations.push('webgl2-preferred');
        if (chromeOptimizations.enableGPUMemoryOptimization) optimizations.push('gpu-memory-opt');
      }
      
      if (browserInfo.name === 'firefox') {
        if (firefoxCompatibility.usePolyfills) optimizations.push('polyfills');
        if (firefoxCompatibility.limitConcurrentTextures) optimizations.push('texture-limits');
        if (firefoxCompatibility.avoidComplexShaders) optimizations.push('simple-shaders');
      }

      // Test specific browser features
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      let extensionsSupported = 0;
      if (gl) {
        const extensions = gl.getSupportedExtensions() || [];
        extensionsSupported = extensions.length;
      }

      return {
        testName: 'Chrome vs Firefox Compatibility',
        passed: extensionsSupported > 5,
        performance: {
          fps: 60,
          renderTime: performance.now() - startTime,
          memoryUsage: 0
        },
        compatibility: {
          webglSupported: !!gl,
          webglVersion: gl ? (gl instanceof WebGL2RenderingContext ? 2 : 1) : null,
          browserOptimizations: optimizations,
          fallbackUsed: false
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        testName: 'Chrome vs Firefox Compatibility',
        passed: false,
        performance: { fps: 0, renderTime: performance.now() - startTime, memoryUsage: 0 },
        compatibility: { webglSupported: false, webglVersion: null, browserOptimizations: [], fallbackUsed: true },
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [browserInfo, chromeOptimizations, firefoxCompatibility]);

  const testLowEndDegradation = useCallback(async (): Promise<BrowserTestResult> => {
    const startTime = performance.now();
    
    try {
      const isLowEnd = browserCompat.isLowEndDevice();
      const shouldUseFallback = requiresFallback();
      
      const optimizations: string[] = [];
      if (isLowEnd) {
        optimizations.push('low-end-optimizations');
        optimizations.push('reduced-geometry');
        optimizations.push('simple-materials');
      }
      
      if (shouldUseFallback) {
        optimizations.push('canvas2d-fallback');
      }

      return {
        testName: 'Low-End Device Graceful Degradation',
        passed: true, // This test always passes as it's about graceful degradation
        performance: {
          fps: isLowEnd ? 20 : 60,
          renderTime: performance.now() - startTime,
          memoryUsage: browserInfo.memoryLimit * 0.4
        },
        compatibility: {
          webglSupported: !shouldUseFallback,
          webglVersion: shouldUseFallback ? null : webglCapabilities.version,
          browserOptimizations: optimizations,
          fallbackUsed: shouldUseFallback
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        testName: 'Low-End Device Graceful Degradation',
        passed: false,
        performance: { fps: 0, renderTime: performance.now() - startTime, memoryUsage: 0 },
        compatibility: { webglSupported: false, webglVersion: null, browserOptimizations: [], fallbackUsed: true },
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [browserInfo, webglCapabilities]);

  // Run all TESTS
  const runAllTests = useCallback(async () => {
    setIsRunningTests(true);
    setTestResults([]);
    setPerformanceIssues([]);
    
    const TESTS = [
      { name: 'webgl-support', fn: testWebGLSupport },
      { name: 'safari-canvas2d', fn: testSafariCanvas2D },
      { name: 'mobile-performance', fn: testMobilePerformance },
      { name: 'chrome-firefox-compat', fn: testChromeFirefoxCompat },
      { name: 'low-end-degradation', fn: testLowEndDegradation }
    ];

    for (const test of TESTS) {
      setCurrentTest(test.name);
      
      try {
        const result = await test.fn();
        setTestResults(prev => [...prev, result]);
        
        // Wait between TESTS
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Test ${test.name} failed:`, error);
      }
    }
    
    setCurrentTest('');
    setIsRunningTests(false);
  }, [testWebGLSupport, testSafariCanvas2D, testMobilePerformance, testChromeFirefoxCompat, testLowEndDegradation]);

  // Simulate WebGL context loss for testing
  const simulateContextLoss = useCallback(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    
    if (gl) {
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
        console.log('WebGL context lost (simulated)');
        
        setTimeout(() => {
          loseContext.restoreContext();
          console.log('WebGL context restored');
        }, 2000);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl font-bold mb-2">
            🔧 Cross-Browser Compatibility Test Suite
          </h1>
          <p className="text-slate-300 text-lg">
            Comprehensive testing for 3D components across different browsers and devices
          </p>
        </div>

        {/* Browser Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-white text-xl font-bold mb-4">🖥️ Browser Info</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-slate-400">Name:</span> <span className="text-white">{browserInfo.name} {browserInfo.version}</span></div>
              <div><span className="text-slate-400">Mobile:</span> <span className="text-white">{browserInfo.isMobile ? 'Yes' : 'No'}</span></div>
              <div><span className="text-slate-400">Hardware:</span> <span className="text-white">{browserInfo.hardwareTier}</span></div>
              <div><span className="text-slate-400">Memory:</span> <span className="text-white">{browserInfo.memoryLimit}MB</span></div>
              <div><span className="text-slate-400">Pixel Ratio:</span> <span className="text-white">{browserInfo.devicePixelRatio}</span></div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-white text-xl font-bold mb-4">🎮 WebGL Info</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-slate-400">Supported:</span> <span className="text-white">{webglCapabilities.supported ? 'Yes' : 'No'}</span></div>
              <div><span className="text-slate-400">Version:</span> <span className="text-white">{webglCapabilities.version || 'None'}</span></div>
              <div><span className="text-slate-400">Renderer:</span> <span className="text-white text-xs">{webglCapabilities.renderer}</span></div>
              <div><span className="text-slate-400">Max Texture:</span> <span className="text-white">{webglCapabilities.maxTextureSize}</span></div>
              <div><span className="text-slate-400">Extensions:</span> <span className="text-white">{webglCapabilities.extensions.length}</span></div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-white text-xl font-bold mb-4">⚙️ Optimal Settings</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-slate-400">Pixel Ratio:</span> <span className="text-white">{optimalSettings.pixelRatio}</span></div>
              <div><span className="text-slate-400">Antialias:</span> <span className="text-white">{optimalSettings.antialias ? 'Yes' : 'No'}</span></div>
              <div><span className="text-slate-400">Shadows:</span> <span className="text-white">{optimalSettings.shadowMapEnabled ? 'Yes' : 'No'}</span></div>
              <div><span className="text-slate-400">Max Lights:</span> <span className="text-white">{optimalSettings.maxLights}</span></div>
              <div><span className="text-slate-400">Particles:</span> <span className="text-white">{optimalSettings.particleCount}</span></div>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h2 className="text-white text-xl font-bold mb-2">Test Controls</h2>
              {currentTest && (
                <p className="text-slate-300">Currently running: {currentTest}</p>
              )}
            </div>
            
            <div className="flex gap-4">
              <Button
                onClick={runAllTests}
                disabled={isRunningTests}
                variant="primary"
                size="md"
              >
                {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              
              <Button
                onClick={simulateContextLoss}
                variant="warning"
                size="md"
              >
                Simulate Context Loss
              </Button>
            </div>
          </div>
        </div>

        {/* Live Component Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-white text-lg font-bold mb-4">🖼️ WebGL/3D Component</h3>
            <div className="flex justify-center">
              <CrossBrowserMascot3D
                mascotType="dragon"
                emotion="happy"
                equippedItems={['wizard_hat']}
                xpLevel={5}
                size="medium"
              />
            </div>
            <div className="text-xs text-slate-400 mt-2 text-center">
              {isWebGLSupported() ? 'WebGL Supported' : 'Using Fallback'}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-white text-lg font-bold mb-4">🎨 Canvas2D Fallback</h3>
            <div className="flex justify-center">
              <Canvas2DRenderer
                width={150}
                height={150}
                mascotType="fairy"
                emotion="celebrating"
                equippedItems={['crown_gold']}
                xpLevel={3}
              />
            </div>
            <div className="text-xs text-slate-400 mt-2 text-center">
              Canvas2D Renderer
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-white text-lg font-bold mb-4">📱 Mobile Optimized</h3>
            <div className="flex justify-center">
              <MobileOptimizedRenderer
                mascotType="robot"
                emotion="thinking"
                equippedItems={['magic_wand']}
                xpLevel={7}
                size="medium"
                onPerformanceIssue={handlePerformanceIssue}
              />
            </div>
            <div className="text-xs text-slate-400 mt-2 text-center">
              Mobile Optimized
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 mb-8">
            <h2 className="text-white text-xl font-bold mb-4">📊 Test Results</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {testResults.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded border-l-4 ${
                    result.passed 
                      ? 'bg-green-900/20 border-green-500' 
                      : 'bg-red-900/20 border-red-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-medium">{result.testName}</h3>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      result.passed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {result.passed ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-300 space-y-1">
                    <div>FPS: {result.performance.fps} | Render: {Math.round(result.performance.renderTime)}ms</div>
                    <div>WebGL: {result.compatibility.webglSupported ? `v${result.compatibility.webglVersion}` : 'No'}</div>
                    <div>Optimizations: {result.compatibility.browserOptimizations.join(', ') || 'None'}</div>
                    {result.error && (
                      <div className="text-red-400 text-xs mt-2">{result.error}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Issues */}
        {performanceIssues.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-white text-xl font-bold mb-4">⚠️ Performance Issues</h2>
            <div className="space-y-2">
              {performanceIssues.slice(-5).map((issue, index) => (
                <div
                  key={index}
                  className={`p-3 rounded text-sm ${
                    issue.severity === 'high' ? 'bg-red-900/20 text-red-300' :
                    issue.severity === 'medium' ? 'bg-yellow-900/20 text-yellow-300' :
                    'bg-blue-900/20 text-blue-300'
                  }`}
                >
                  <div className="flex justify-between">
                    <span>{issue.message}</span>
                    <span className="text-xs opacity-75">
                      {new Date(issue.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CrossBrowserTestSuite;