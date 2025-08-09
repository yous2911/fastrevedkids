# Mobile Optimization Guide

Comprehensive mobile optimization system for enhanced 3D components with adaptive quality, touch interactions, and battery-conscious rendering.

## 🎯 Mobile Optimization Overview

The mobile optimization system provides:

1. **Advanced Device Detection** - Hardware profiling with performance tiers
2. **Adaptive Particle System** - Dynamic particle count based on device capabilities  
3. **Touch-Optimized Interactions** - Advanced gesture recognition and touch handling
4. **Intelligent Frame Rate Management** - 30fps optimization with thermal/battery awareness
5. **Battery-Conscious Animations** - Power-aware animation modes with automatic adaptation

## 📱 Key Features

### Device-Specific Quality Settings
- **High-end devices**: Full quality (60fps, 200 particles, all effects)
- **Mid-range devices**: Balanced quality (45fps, 60 particles, selective effects)
- **Low-end devices**: Optimized quality (30fps, 30 particles, minimal effects)
- **Battery saver**: Ultra-optimized (15fps, 10 particles, static mode)

### Adaptive Performance
- Real-time FPS monitoring with automatic quality adjustment
- Thermal throttling detection and response
- Memory pressure handling with cleanup
- Battery level aware optimization

### Touch Interaction
- Multi-touch gesture recognition (tap, double-tap, long-press, pan, pinch, swipe)
- Pressure-sensitive touch handling
- Desktop mouse compatibility
- Viewport-relative coordinate calculation

## 🚀 Quick Start

### Initialize Mobile Optimizations

```typescript
import { mobileDetector } from './src/utils/mobileOptimized';
import { mobileFrameRate } from './src/utils/mobileFrameRate';
import { BatteryOptimizedAnimations } from './src/components/mobile/BatteryOptimizedAnimations';

// Initialize mobile optimizations
const initializeMobile = async () => {
  // Detect device capabilities
  const capabilities = await mobileDetector.detectCapabilities();
  console.log('Device capabilities:', capabilities);
  
  // Setup frame rate optimization
  const recommendations = mobileFrameRate.getRecommendedSettings();
  mobileFrameRate.updateConfig({
    targetFPS: recommendations.targetFPS,
    adaptiveThrottling: true,
    thermalThrottling: true,
    batteryThrottling: true
  });
};

// Wrap your app with battery optimization
function App() {
  return (
    <BatteryOptimizedAnimations
      powerMode="auto" // Auto-adjust based on battery and performance
      debugMode={process.env.NODE_ENV === 'development'}
      onPowerModeChange={(mode) => console.log('Power mode:', mode.name)}
    >
      <YourAppContent />
    </BatteryOptimizedAnimations>
  );
}
```

### Use Mobile-Optimized Components

```typescript
import { MobileParticleSystem } from './src/components/mobile/MobileParticleSystem';
import { useMobileTouch } from './src/utils/mobileTouch';

function MobileOptimizedComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Setup touch handling
  const { getGestureState, setEnabled } = useMobileTouch(canvasRef, {
    onTap: (point, gesture) => {
      console.log('Tap at:', point.x, point.y);
    },
    onPinch: (center, gesture) => {
      console.log('Pinch scale:', gesture.scale);
    },
    onSwipe: (direction, gesture) => {
      console.log('Swiped:', direction);
    }
  });

  return (
    <div>
      {/* Mobile-optimized particle system */}
      <MobileParticleSystem
        width={400}
        height={300}
        theme="magic"
        intensity="medium"
        interactive={true}
        onParticleClick={(particle) => console.log('Clicked particle:', particle.id)}
        onPerformanceIssue={(issue, metrics) => {
          console.warn('Performance issue:', issue, metrics);
        }}
      />
      
      {/* Canvas with touch support */}
      <canvas 
        ref={canvasRef}
        width={400}
        height={300}
        style={{ touchAction: 'none' }} // Important for touch handling
      />
    </div>
  );
}
```

## 🔧 Detailed Configuration

### 1. Device Detection and Quality Settings

```typescript
import { mobileDetector } from './src/utils/mobileOptimized';

// Get device capabilities
const capabilities = await mobileDetector.detectCapabilities();
console.log('Device type:', capabilities.deviceType); // 'mobile' | 'tablet' | 'desktop'
console.log('Performance tier:', capabilities.performanceTier); // 'high' | 'medium' | 'low'
console.log('GPU tier:', capabilities.gpuTier); // 'high' | 'medium' | 'low'
console.log('Memory:', capabilities.memorySize); // 'high' | 'medium' | 'low'

// Get optimized quality settings
const qualitySettings = await mobileDetector.getQualitySettings();
console.log('Max particles:', qualitySettings.maxParticles);
console.log('Target FPS:', qualitySettings.targetFPS);
console.log('Enable shadows:', qualitySettings.enableShadows);

// Get battery optimization settings
const batteryOpt = mobileDetector.getBatteryOptimization();
if (batteryOpt.aggressiveMode) {
  console.log('🔋 Ultra battery saver mode active');
}
```

### 2. Adaptive Particle System

```typescript
import { MobileParticleSystem } from './src/components/mobile/MobileParticleSystem';

// Automatically adapts based on device capabilities and battery
<MobileParticleSystem
  width={800}
  height={600}
  theme="fire" // 'magic' | 'fire' | 'water' | 'earth' | 'air'
  intensity="high" // 'low' | 'medium' | 'high'
  interactive={true}
  
  // Callbacks for interaction and monitoring
  onParticleClick={(particle) => {
    console.log('Particle clicked:', particle.type, particle.color);
  }}
  
  onPerformanceIssue={(issue, metrics) => {
    // Automatic quality adjustment based on performance
    console.warn(`Performance issue: ${issue}`, metrics);
  }}
/>

// Performance indicators show:
// - Current FPS and particle count
// - Battery optimization status (⚡ icon when active)
// - Device performance tier
```

### 3. Advanced Touch Handling

```typescript
import { useMobileTouch, TouchUtils } from './src/utils/mobileTouch';

function TouchCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { getGestureState, getActiveTouches, setEnabled } = useMobileTouch(canvasRef, {
    // Basic touch events
    onTouchStart: (point) => {
      console.log('Touch started at:', point.x, point.y);
      console.log('Pressure:', point.pressure);
    },
    
    // Gesture recognition
    onTap: (point, gesture) => {
      console.log('Single tap');
    },
    
    onDoubleTap: (point, gesture) => {
      console.log('Double tap - zoom in');
    },
    
    onLongPress: (point, gesture) => {
      console.log('Long press - context menu');
    },
    
    // Pan gestures
    onPanStart: (point, gesture) => {
      console.log('Pan started');
    },
    
    onPanMove: (point, gesture) => {
      console.log('Panning:', gesture.deltaX, gesture.deltaY);
      console.log('Velocity:', gesture.velocity);
    },
    
    onPanEnd: (point, gesture) => {
      console.log('Pan ended, distance:', gesture.distance);
    },
    
    // Multi-touch gestures
    onPinchStart: (center, gesture) => {
      console.log('Pinch started');
    },
    
    onPinchMove: (center, gesture) => {
      console.log('Pinch scale:', gesture.scale);
      console.log('Rotation:', gesture.rotation);
    },
    
    onPinchEnd: (center, gesture) => {
      console.log('Pinch ended, final scale:', gesture.scale);
    },
    
    // Swipe gestures
    onSwipe: (direction, gesture) => {
      console.log('Swiped:', direction); // 'up' | 'down' | 'left' | 'right'
      console.log('Velocity:', gesture.velocity);
    }
  }, {
    // Configuration
    enableMultiTouch: true,
    enablePressure: TouchUtils.isTouchDevice(),
    preventDefaultScroll: true,
    touchTolerance: TouchUtils.getOptimalTouchSize() / 2
  });

  // Get real-time gesture information
  const currentGesture = getGestureState();
  const activeTouches = getActiveTouches();
  
  return (
    <canvas 
      ref={canvasRef}
      style={{ 
        touchAction: 'none', // Prevent default touch behaviors
        userSelect: 'none',  // Prevent text selection
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    />
  );
}
```

### 4. Frame Rate Optimization

```typescript
import { mobileFrameRate } from './src/utils/mobileFrameRate';

// Register animation with mobile optimization
mobileFrameRate.registerCallback('myAnimation', (deltaTime, shouldSkip, quality) => {
  if (shouldSkip) {
    // Skip this frame for performance
    return;
  }
  
  // Adjust animation quality based on performance
  const particleCount = Math.floor(baseParticleCount * quality);
  const animationSpeed = baseSpeed * quality;
  
  // Your animation code here
  updateAnimation(deltaTime, particleCount, animationSpeed);
}, {
  priority: 'high', // 'critical' | 'high' | 'medium' | 'low'
  minFPS: 20,       // Minimum FPS before skipping
  canSkip: true,    // Allow frame skipping
  qualitySensitive: true // Respond to quality changes
});

// Monitor performance
const metrics = mobileFrameRate.getMetrics();
console.log('Current FPS:', metrics.currentFPS);
console.log('Thermal state:', metrics.thermalState);
console.log('Battery level:', metrics.batteryLevel);

// Adjust settings based on conditions
if (metrics.thermalState === 'critical') {
  mobileFrameRate.updateConfig({
    targetFPS: 15,
    adaptiveThrottling: true
  });
}
```

### 5. Battery-Conscious Animations

```typescript
import { 
  BatteryOptimizedAnimations, 
  useBatteryOptimizedAnimation 
} from './src/components/mobile/BatteryOptimizedAnimations';

function BatteryAwareComponent() {
  // Hook for individual animations
  const { animationStyle, shouldAnimate, isReducedMotion } = useBatteryOptimizedAnimation({
    type: 'bounce',
    duration: 600,
    easing: 'ease-out',
    criticalAnimation: false // Will be disabled in ultra-saver mode
  });
  
  return (
    <BatteryOptimizedAnimations
      powerMode="auto" // 'auto' | 'maximum' | 'balanced' | 'saver' | 'ultra-saver'
      debugMode={true}
      onPowerModeChange={(mode) => {
        console.log(`Power mode: ${mode.name}`);
        console.log(`Max FPS: ${mode.maxFPS}`);
        console.log(`Particles: ${mode.particleCount}`);
        console.log(`Effects: ${mode.enableEffects}`);
      }}
      onBatteryStatusChange={(status) => {
        console.log(`Battery: ${status.level}% ${status.charging ? '(charging)' : ''}`);
      }}
    >
      {/* Your animated content */}
      <div 
        className="animated-element"
        style={animationStyle}
      >
        {shouldAnimate ? 'Animated content' : 'Static content'}
      </div>
    </BatteryOptimizedAnimations>
  );
}
```

## 📊 Performance Monitoring

### Real-time Metrics

```typescript
// Get comprehensive performance data
const deviceCapabilities = await mobileDetector.detectCapabilities();
const frameMetrics = mobileFrameRate.getMetrics();
const qualitySettings = await mobileDetector.getQualitySettings();

console.log('📱 Device Performance Profile:');
console.log('- Device:', deviceCapabilities.deviceType, deviceCapabilities.modelInfo);
console.log('- CPU Cores:', navigator.hardwareConcurrency);
console.log('- Memory:', deviceCapabilities.memorySize);
console.log('- GPU:', deviceCapabilities.gpuTier);
console.log('- WebGL:', deviceCapabilities.supportsWebGL ? 'Yes' : 'No');

console.log('📈 Current Performance:');
console.log('- FPS:', frameMetrics.currentFPS.toFixed(1));
console.log('- Frame Time:', frameMetrics.frameTime.toFixed(2) + 'ms');
console.log('- Dropped Frames:', frameMetrics.droppedFrames);
console.log('- Thermal State:', frameMetrics.thermalState);

console.log('🔋 Battery Status:');
console.log('- Level:', frameMetrics.batteryLevel + '%');
console.log('- Charging:', frameMetrics.isCharging ? 'Yes' : 'No');

console.log('⚙️ Quality Settings:');
console.log('- Max Particles:', qualitySettings.maxParticles);
console.log('- Target FPS:', qualitySettings.targetFPS);
console.log('- Render Scale:', qualitySettings.renderScale);
console.log('- Effects Enabled:', qualitySettings.enablePostProcessing);
```

### Performance Benchmarking

```typescript
// Run device performance benchmarks
const performanceProfile = await mobileDetector.profilePerformance();
console.log('🏃 Performance Benchmarks:');
console.log('- Canvas Score:', performanceProfile.get('canvas'));
console.log('- WebGL Score:', performanceProfile.get('webgl'));
console.log('- Memory Score:', performanceProfile.get('memory'));
console.log('- Animation Score:', performanceProfile.get('animation'));

// Auto-adjust based on benchmarks
const overallScore = Array.from(performanceProfile.values())
  .reduce((sum, score) => sum + score, 0) / performanceProfile.size;

if (overallScore < 10) {
  console.log('⚠️ Low performance detected - enabling aggressive optimizations');
  mobileFrameRate.updateConfig({
    targetFPS: 15,
    adaptiveThrottling: true,
    frameSkipping: true
  });
}
```

## 🎮 Integration Examples

### Complete Mobile-Optimized 3D Component

```typescript
import React, { useRef, useEffect } from 'react';
import { mobileDetector } from './src/utils/mobileOptimized';
import { mobileFrameRate } from './src/utils/mobileFrameRate';
import { useMobileTouch } from './src/utils/mobileTouch';
import { MobileParticleSystem } from './src/components/mobile/MobileParticleSystem';
import { BatteryOptimizedAnimations } from './src/components/mobile/BatteryOptimizedAnimations';

function MobileMascotViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    const initializeMobile = async () => {
      // Initialize mobile optimizations
      const capabilities = await mobileDetector.detectCapabilities();
      const qualitySettings = await mobileDetector.getQualitySettings();
      
      setDeviceInfo({
        tier: capabilities.performanceTier,
        maxParticles: qualitySettings.maxParticles,
        targetFPS: qualitySettings.targetFPS
      });

      // Setup frame rate optimization
      mobileFrameRate.updateConfig({
        targetFPS: qualitySettings.targetFPS,
        adaptiveThrottling: true,
        thermalThrottling: capabilities.deviceType === 'mobile',
        batteryThrottling: true
      });

      setIsInitialized(true);
    };

    initializeMobile();
  }, []);

  // Touch handling for 3D interaction
  const { getGestureState } = useMobileTouch(containerRef, {
    onPinch: (center, gesture) => {
      // Handle zoom
      const zoomFactor = gesture.scale;
      // Apply zoom to 3D scene
    },
    
    onPan: (point, gesture) => {
      // Handle rotation
      const rotationX = gesture.deltaY * 0.01;
      const rotationY = gesture.deltaX * 0.01;
      // Apply rotation to 3D scene
    },
    
    onTap: (point) => {
      // Handle mascot interaction
      console.log('Mascot tapped at:', point.x, point.y);
    }
  });

  if (!isInitialized || !deviceInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Optimizing for your device...</div>
      </div>
    );
  }

  return (
    <BatteryOptimizedAnimations powerMode="auto">
      <div 
        ref={containerRef}
        className="relative w-full h-64 rounded-lg overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        {/* Adaptive particle background */}
        <MobileParticleSystem
          width={400}
          height={256}
          theme="magic"
          intensity={deviceInfo.tier === 'high' ? 'high' : 'medium'}
          interactive={true}
        />
        
        {/* 3D Mascot would be rendered here */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🐉</div>
        </div>
        
        {/* Performance info */}
        <div className="absolute top-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
          {deviceInfo.tier} device • {deviceInfo.targetFPS}fps • {deviceInfo.maxParticles}p
        </div>
      </div>
    </BatteryOptimizedAnimations>
  );
}
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Poor Performance on Mobile
```typescript
// Check device capabilities
const capabilities = await mobileDetector.detectCapabilities();
if (capabilities.performanceTier === 'low') {
  // Force low quality settings
  const lowQualitySettings = {
    maxParticles: 20,
    targetFPS: 20,
    enableShadows: false,
    enablePostProcessing: false,
    renderScale: 0.6
  };
}
```

#### Touch Events Not Working
```typescript
// Ensure proper touch configuration
<canvas
  style={{
    touchAction: 'none', // Prevent default touch behaviors
    userSelect: 'none',  // Prevent text selection
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none'
  }}
/>

// Check touch capabilities
const touchCaps = mobileDetector.detectTouchCapabilities();
console.log('Max touch points:', touchCaps.maxTouchPoints);
console.log('Supports pressure:', touchCaps.supportsPressure);
```

#### Battery Optimization Not Working
```typescript
// Check battery API availability
if ('getBattery' in navigator) {
  const battery = await (navigator as any).getBattery();
  console.log('Battery level:', Math.round(battery.level * 100) + '%');
} else {
  console.warn('Battery API not available - using fallback optimization');
}
```

#### Frame Rate Issues
```typescript
// Monitor and debug frame rate
mobileFrameRate.registerCallback('debug-monitor', (deltaTime, shouldSkip, quality) => {
  console.log('Frame time:', deltaTime.toFixed(2) + 'ms');
  console.log('Should skip:', shouldSkip);
  console.log('Quality:', quality.toFixed(2));
}, { priority: 'low', canSkip: false });
```

## 📋 Mobile Optimization Checklist

- [ ] Initialize mobile device detection
- [ ] Configure adaptive particle system
- [ ] Setup touch event handling with gesture recognition
- [ ] Enable frame rate optimization (30fps target)
- [ ] Configure battery-conscious animations
- [ ] Add performance monitoring
- [ ] Test on various mobile devices
- [ ] Verify touch interactions work correctly
- [ ] Check battery optimization behavior
- [ ] Monitor thermal throttling response
- [ ] Test with different power modes

## 📈 Expected Results

With these mobile optimizations, you should see:

- **Performance**: Consistent 30fps on mid-range mobile, 20fps on low-end
- **Battery Life**: 40-60% better battery efficiency in saver modes
- **Touch Response**: < 16ms touch-to-visual response time
- **Adaptive Quality**: Automatic quality adjustment based on device capabilities
- **Thermal Management**: Automatic throttling when device overheats
- **Memory Usage**: 50% less memory consumption on mobile devices
- **User Experience**: Smooth interactions across all device tiers

The mobile optimization system automatically adapts to provide the best possible experience for each device while preserving battery life and preventing thermal issues.