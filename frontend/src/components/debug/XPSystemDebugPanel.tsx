/**
 * XP System Debug Panel
 * Comprehensive debugging interface IFor XP system physics and visual parameters
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface XPPhysicsParams {
  // Particle Physics
  gravity: number;
  particleSpeed: number;
  particleLifetime: number;
  particleSize: number;
  particleCount: number;
  
  // Animation Physics
  bounceHeight: number;
  bounceDecay: number;
  elasticity: number;
  friction: number;
  springTension: number;
  
  // Visual Parameters
  glowIntensity: number;
  colorSaturation: number;
  bloomStrength: number;
  trailLength: number;
  
  // Performance
  targetFPS: number;
  qualityLevel: number;
  enableOptimizations: boolean;
}

interface XPSystemState {
  currentXP: number;
  maxXP: number;
  level: number;
  xpGained: number;
  animationState: 'idle' | 'gaining' | 'leveling' | 'complete';
  particleSystemActive: boolean;
  performanceMetrics: {
    fps: number;
    frameTime: number;
    particleCount: number;
    memoryUsage: number;
  };
}

interface DebugEvent {
  timestamp: number;
  type: 'xp_gain' | 'level_up' | 'animation_start' | 'animation_end' | 'performance_warning' | 'parameter_change' | 'preset_saved' | 'preset_loaded' | 'reset_defaults';
  data: any;
}

interface XPSystemDebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
  xpSystemRef?: React.RefObject<any>;
  onParameterChange?: (params: Partial<XPPhysicsParams>) => void;
  onTriggerEvent?: (eventType: string, data?: any) => void;
}

export const XPSystemDebugPanel: React.FC<XPSystemDebugPanelProps> = ({
  isVisible,
  onClose,
  xpSystemRef,
  onParameterChange,
  onTriggerEvent
}) => {
  const [activeTab, setActiveTab] = useState<'physics' | 'visual' | 'performance' | 'events'>('physics');
  const [physicsParams, setPhysicsParams] = useState<XPPhysicsParams>({
    // Default physics parameters
    gravity: 0.5,
    particleSpeed: 100,
    particleLifetime: 2.0,
    particleSize: 4,
    particleCount: 50,
    
    bounceHeight: 20,
    bounceDecay: 0.8,
    elasticity: 0.6,
    friction: 0.99,
    springTension: 200,
    
    glowIntensity: 15,
    colorSaturation: 1.2,
    bloomStrength: 0.8,
    trailLength: 10,
    
    targetFPS: 60,
    qualityLevel: 1.0,
    enableOptimizations: true
  });

  const [systemState, setSystemState] = useState<XPSystemState>({
    currentXP: 750,
    maxXP: 1000,
    level: 5,
    xpGained: 0,
    animationState: 'idle',
    particleSystemActive: false,
    performanceMetrics: {
      fps: 60,
      frameTime: 16.67,
      particleCount: 0,
      memoryUsage: 0
    }
  });

  const [debugEvents, setDebugEvents] = useState<DebugEvent[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [presets, setPresets] = useState<Record<string, XPPhysicsParams>>({});
  
  const eventLogRef = useRef<HTMLDivElement>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  // Real-time system monitoring
  useEffect(() => {
    if (isVisible && xpSystemRef?.current) {
      updateIntervalRef.current = setInterval(() => {
        updateSystemState();
      }, 100); // Update 10 times per second
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isVisible, xpSystemRef]);

  // Load presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('xp-debug-presets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (error) {
        console.warn('Failed to load XP debug presets:', error);
      }
    }
  }, []);

  // Update system state from XP system reference
  const updateSystemState = useCallback(() => {
    if (!xpSystemRef?.current) return;

    const xpSystem = xpSystemRef.current;
    
    setSystemState(prevState => ({
      ...prevState,
      currentXP: xpSystem.getCurrentXP?.() || prevState.currentXP,
      maxXP: xpSystem.getMaxXP?.() || prevState.maxXP,
      level: xpSystem.getLevel?.() || prevState.level,
      animationState: xpSystem.getAnimationState?.() || prevState.animationState,
      particleSystemActive: xpSystem.isParticleSystemActive?.() || false,
      performanceMetrics: {
        fps: xpSystem.getFPS?.() || 60,
        frameTime: xpSystem.getFrameTime?.() || 16.67,
        particleCount: xpSystem.getParticleCount?.() || 0,
        memoryUsage: xpSystem.getMemoryUsage?.() || 0
      }
    }));
  }, [xpSystemRef]);

  // Handle parameter changes
  const handleParameterChange = useCallback((key: keyof XPPhysicsParams, value: number | boolean) => {
    const NEW_PARAMS = { ...physicsParams, [key]: value };
    setPhysicsParams(NEW_PARAMS);
    
    // Apply changes to XP system
    onParameterChange?.(NEW_PARAMS);
    
    // Log event
    if (isRecording) {
      addDebugEvent('parameter_change', { key, value, timestamp: Date.now() });
    }
  }, [physicsParams, onParameterChange, isRecording]);

  // Add debug event
  const addDebugEvent = useCallback((type: DebugEvent['type'], data: any) => {
    const event: DebugEvent = {
      timestamp: Date.now(),
      type,
      data
    };
    
    setDebugEvents(prev => {
      const NEW_EVENTS = [...prev, event];
      // Keep only last 100 events
      return NEW_EVENTS.slice(-100);
    });

    // Auto-scroll event log
    setTimeout(() => {
      if (eventLogRef.current) {
        eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
      }
    }, 10);
  }, []);

  // Save preset
  const savePreset = useCallback((name: string) => {
    const NEW_PRESETS = { ...presets, [name]: physicsParams };
    setPresets(NEW_PRESETS);
    localStorage.setItem('xp-debug-presets', JSON.stringify(NEW_PRESETS));
    addDebugEvent('preset_saved', { name });
  }, [presets, physicsParams]);

  // Load preset
  const loadPreset = useCallback((name: string) => {
    const preset = presets[name];
    if (preset) {
      setPhysicsParams(preset);
      onParameterChange?.(preset);
      addDebugEvent('preset_loaded', { name });
    }
  }, [presets, onParameterChange]);

  // Trigger test events
  const triggerTestEvent = useCallback((eventType: string) => {
    onTriggerEvent?.(eventType);
    addDebugEvent(eventType as any, { triggered: true, timestamp: Date.now() });
  }, [onTriggerEvent]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaultParams: XPPhysicsParams = {
      gravity: 0.5,
      particleSpeed: 100,
      particleLifetime: 2.0,
      particleSize: 4,
      particleCount: 50,
      bounceHeight: 20,
      bounceDecay: 0.8,
      elasticity: 0.6,
      friction: 0.99,
      springTension: 200,
      glowIntensity: 15,
      colorSaturation: 1.2,
      bloomStrength: 0.8,
      trailLength: 10,
      targetFPS: 60,
      qualityLevel: 1.0,
      enableOptimizations: true
    };
    
    setPhysicsParams(defaultParams);
    onParameterChange?.(defaultParams);
    addDebugEvent('reset_defaults', {});
  }, [onParameterChange]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-4 bg-gray-900 text-white rounded-lg shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">XP System Debug Panel</h2>
          <div className="text-sm opacity-80">
            Level {systemState.level} • {systemState.currentXP}/{systemState.maxXP} XP • {systemState.animationState}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsRecording(!isRecording)}
            variant={isRecording ? 'danger' : 'secondary'}
            size="sm"
          >
            {isRecording ? '⏹ Recording' : '⏺ Record'}
          </Button>
          <Button
            onClick={resetToDefaults}
            variant="warning"
            size="sm"
          >
            Reset
          </Button>
          <Button
            onClick={onClose}
            variant="danger"
            size="sm"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="flex h-full">
        {/* Tabs */}
        <div className="w-48 bg-gray-800 p-4 border-r border-gray-700">
          <div className="space-y-2">
            {[
              { id: 'physics', label: 'Physics', icon: '⚡' },
              { id: 'visual', label: 'Visual', icon: '🎨' },
              { id: 'performance', label: 'Performance', icon: '📊' },
              { id: 'events', label: 'Events', icon: '📝' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
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

          {/* System Status */}
          <div className="mt-6 p-3 bg-gray-700 rounded-lg">
            <h3 className="font-medium mb-2">System Status</h3>
            <div className="text-xs space-y-1">
              <div className={`flex justify-between ${
                systemState.performanceMetrics.fps >= 50 ? 'text-green-400' : 
                systemState.performanceMetrics.fps >= 30 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                <span>FPS:</span>
                <span>{systemState.performanceMetrics.fps.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-blue-400">
                <span>Particles:</span>
                <span>{systemState.performanceMetrics.particleCount}</span>
              </div>
              <div className="flex justify-between text-purple-400">
                <span>Memory:</span>
                <span>{systemState.performanceMetrics.memoryUsage.toFixed(1)}MB</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4">
            <h3 className="font-medium mb-2">Quick Actions</h3>
            <div className="space-y-1">
              {[
                { label: 'Gain 100 XP', action: () => triggerTestEvent('gain_xp_100') },
                { label: 'Level Up', action: () => triggerTestEvent('level_up') },
                { label: 'Particle Burst', action: () => triggerTestEvent('particle_burst') },
                { label: 'Reset XP', action: () => triggerTestEvent('reset_xp') }
              ].map(action => (
                <Button
                  key={action.label}
                  onClick={action.action}
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs p-2 text-left"
                >
                  {action.label}
                </Button>
              ))}
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
              {activeTab === 'physics' && (
                <PhysicsTab 
                  params={physicsParams} 
                  onChange={handleParameterChange}
                  onSavePreset={savePreset}
                  onLoadPreset={loadPreset}
                  presets={presets}
                />
              )}
              
              {activeTab === 'visual' && (
                <VisualTab 
                  params={physicsParams} 
                  onChange={handleParameterChange}
                  systemState={systemState}
                />
              )}
              
              {activeTab === 'performance' && (
                <PerformanceTab 
                  params={physicsParams} 
                  onChange={handleParameterChange}
                  metrics={systemState.performanceMetrics}
                />
              )}
              
              {activeTab === 'events' && (
                <EventsTab 
                  events={debugEvents}
                  isRecording={isRecording}
                  onClear={() => setDebugEvents([])}
                  eventLogRef={eventLogRef}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Physics parameters tab
const PhysicsTab: React.FC<{
  params: XPPhysicsParams;
  onChange: (key: keyof XPPhysicsParams, value: number | boolean) => void;
  onSavePreset: (name: string) => void;
  onLoadPreset: (name: string) => void;
  presets: Record<string, XPPhysicsParams>;
}> = ({ params, onChange, onSavePreset, onLoadPreset, presets }) => {
  const [presetName, setPresetName] = useState('');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-blue-400">Physics Parameters</h3>

      {/* Presets */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Presets</h4>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name..."
            className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
          />
          <button
            onClick={() => presetName && onSavePreset(presetName)}
            className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
          >
            Save
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(presets).map(name => (
            <button
              key={name}
              onClick={() => onLoadPreset(name)}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Particle Physics */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Particle Physics</h4>
        <div className="grid grid-cols-2 gap-4">
          <ParameterSlider
            label="Gravity"
            value={params.gravity}
            min={0}
            max={2}
            step={0.1}
            onChange={(value) => onChange('gravity', value)}
          />
          <ParameterSlider
            label="Speed"
            value={params.particleSpeed}
            min={10}
            max={300}
            step={10}
            onChange={(value) => onChange('particleSpeed', value)}
          />
          <ParameterSlider
            label="Lifetime"
            value={params.particleLifetime}
            min={0.5}
            max={5}
            step={0.1}
            onChange={(value) => onChange('particleLifetime', value)}
          />
          <ParameterSlider
            label="Size"
            value={params.particleSize}
            min={1}
            max={10}
            step={1}
            onChange={(value) => onChange('particleSize', value)}
          />
          <ParameterSlider
            label="Count"
            value={params.particleCount}
            min={10}
            max={200}
            step={10}
            onChange={(value) => onChange('particleCount', value)}
          />
        </div>
      </div>

      {/* Animation Physics */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Animation Physics</h4>
        <div className="grid grid-cols-2 gap-4">
          <ParameterSlider
            label="Bounce Height"
            value={params.bounceHeight}
            min={5}
            max={50}
            step={1}
            onChange={(value) => onChange('bounceHeight', value)}
          />
          <ParameterSlider
            label="Bounce Decay"
            value={params.bounceDecay}
            min={0.1}
            max={1}
            step={0.05}
            onChange={(value) => onChange('bounceDecay', value)}
          />
          <ParameterSlider
            label="Elasticity"
            value={params.elasticity}
            min={0.1}
            max={1}
            step={0.05}
            onChange={(value) => onChange('elasticity', value)}
          />
          <ParameterSlider
            label="Friction"
            value={params.friction}
            min={0.9}
            max={1}
            step={0.01}
            onChange={(value) => onChange('friction', value)}
          />
          <ParameterSlider
            label="Spring Tension"
            value={params.springTension}
            min={50}
            max={500}
            step={10}
            onChange={(value) => onChange('springTension', value)}
          />
        </div>
      </div>
    </div>
  );
};

// Visual parameters tab
const VisualTab: React.FC<{
  params: XPPhysicsParams;
  onChange: (key: keyof XPPhysicsParams, value: number | boolean) => void;
  systemState: XPSystemState;
}> = ({ params, onChange, systemState }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-purple-400">Visual Parameters</h3>

      {/* XP Bar Visualization */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-3">XP Bar Preview</h4>
        <div className="bg-gray-700 rounded-full h-6 relative overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            style={{ width: `${(systemState.currentXP / systemState.maxXP) * 100}%` }}
            animate={{
              boxShadow: `0 0 ${params.glowIntensity}px rgba(147, 51, 234, 0.8)`
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
            {systemState.currentXP} / {systemState.maxXP} XP
          </div>
        </div>
      </div>

      {/* Visual Effects */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Visual Effects</h4>
        <div className="grid grid-cols-2 gap-4">
          <ParameterSlider
            label="Glow Intensity"
            value={params.glowIntensity}
            min={0}
            max={30}
            step={1}
            onChange={(value) => onChange('glowIntensity', value)}
          />
          <ParameterSlider
            label="Color Saturation"
            value={params.colorSaturation}
            min={0.5}
            max={2}
            step={0.1}
            onChange={(value) => onChange('colorSaturation', value)}
          />
          <ParameterSlider
            label="Bloom Strength"
            value={params.bloomStrength}
            min={0}
            max={2}
            step={0.1}
            onChange={(value) => onChange('bloomStrength', value)}
          />
          <ParameterSlider
            label="Trail Length"
            value={params.trailLength}
            min={0}
            max={30}
            step={1}
            onChange={(value) => onChange('trailLength', value)}
          />
        </div>
      </div>

      {/* Color Preview */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Color Preview</h4>
        <div className="grid grid-cols-5 gap-2">
          {['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B'].map((color, index) => (
            <div
              key={color}
              className="h-12 rounded"
              style={{
                backgroundColor: color,
                filter: `saturate(${params.colorSaturation}) brightness(${params.bloomStrength})`,
                boxShadow: `0 0 ${params.glowIntensity}px ${color}80`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Performance tab
const PerformanceTab: React.FC<{
  params: XPPhysicsParams;
  onChange: (key: keyof XPPhysicsParams, value: number | boolean) => void;
  metrics: XPSystemState['performanceMetrics'];
}> = ({ params, onChange, metrics }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-green-400">Performance Settings</h3>

      {/* Current Metrics */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Current Metrics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-400">FPS</div>
            <div className={`text-lg font-bold ${
              metrics.fps >= 50 ? 'text-green-400' : 
              metrics.fps >= 30 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {metrics.fps.toFixed(1)}
            </div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-400">Frame Time</div>
            <div className="text-lg font-bold text-blue-400">
              {metrics.frameTime.toFixed(1)}ms
            </div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-400">Particles</div>
            <div className="text-lg font-bold text-purple-400">
              {metrics.particleCount}
            </div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-400">Memory</div>
            <div className="text-lg font-bold text-orange-400">
              {metrics.memoryUsage.toFixed(1)}MB
            </div>
          </div>
        </div>
      </div>

      {/* Performance Settings */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Performance Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <ParameterSlider
            label="Target FPS"
            value={params.targetFPS}
            min={15}
            max={120}
            step={5}
            onChange={(value) => onChange('targetFPS', value)}
          />
          <ParameterSlider
            label="Quality Level"
            value={params.qualityLevel}
            min={0.1}
            max={2}
            step={0.1}
            onChange={(value) => onChange('qualityLevel', value)}
          />
        </div>
        
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={params.enableOptimizations}
              onChange={(e) => onChange('enableOptimizations', e.target.checked)}
              className="rounded"
            />
            <span>Enable Performance Optimizations</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// Events tab
const EventsTab: React.FC<{
  events: DebugEvent[];
  isRecording: boolean;
  onClear: () => void;
  eventLogRef: React.RefObject<HTMLDivElement>;
}> = ({ events, isRecording, onClear, eventLogRef }) => {
  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-yellow-400">Event Log</h3>
        <div className="flex gap-2">
          <div className={`px-2 py-1 rounded text-xs ${
            isRecording ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}>
            {isRecording ? '⏺ Recording' : '⏸ Paused'}
          </div>
          <button
            onClick={onClear}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      <div 
        ref={eventLogRef}
        className="flex-1 bg-gray-800 rounded-lg p-4 overflow-auto font-mono text-sm"
      >
        {events.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No events recorded. Enable recording to capture events.
          </div>
        ) : (
          <div className="space-y-1">
            {events.map((event, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  event.type === 'performance_warning' ? 'bg-red-900/30 text-red-300' :
                  event.type === 'level_up' ? 'bg-green-900/30 text-green-300' :
                  event.type === 'xp_gain' ? 'bg-blue-900/30 text-blue-300' :
                  'bg-gray-700/50 text-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium">{event.type.replace('_', ' ').toUpperCase()}</span>
                  <span className="text-xs opacity-60">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {event.data && (
                  <div className="text-xs mt-1 opacity-80">
                    {JSON.stringify(event.data, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Parameter slider component
const ParameterSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, onChange }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-blue-400">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default XPSystemDebugPanel;