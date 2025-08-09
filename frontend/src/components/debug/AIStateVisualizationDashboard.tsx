/**
 * AI State Visualization Dashboard
 * Real-time monitoring and visualization of AI behavior, decision trees, and state transitions
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIAgent {
  id: string;
  type: 'mascot' | 'npc' | 'system' | 'tutorial';
  name: string;
  state: AIState;
  behavior: BehaviorState;
  goals: Goal[];
  memory: MemoryState;
  emotions: EmotionState;
  interactions: InteractionHistory[];
  performance: PerformanceMetrics;
}

interface AIState {
  current: string;
  previous: string;
  transitions: StateTransition[];
  duration: number;
  confidence: number;
  metadata: Record<string, any>;
}

interface BehaviorState {
  type: 'idle' | 'active' | 'responding' | 'learning' | 'sleeping';
  priority: number;
  actions: Action[];
  constraints: Constraint[];
  decisionTree: DecisionNode;
}

interface Goal {
  id: string;
  type: 'primary' | 'secondary' | 'reactive';
  description: string;
  priority: number;
  progress: number;
  deadline?: number;
  dependencies: string[];
  status: 'active' | 'completed' | 'paused' | 'failed';
}

interface MemoryState {
  shortTerm: MemoryItem[];
  longTerm: MemoryItem[];
  episodic: Episode[];
  semantic: SemanticMemory;
  workingMemory: WorkingMemory;
}

interface MemoryItem {
  id: string;
  type: 'fact' | 'event' | 'pattern' | 'preference';
  content: any;
  importance: number;
  timestamp: number;
  accessCount: number;
  associations: string[];
}

interface EmotionState {
  primary: string;
  intensity: number;
  valence: number; // -1 (negative) to 1 (positive)
  arousal: number; // 0 (calm) to 1 (excited)
  emotions: Record<string, number>;
  triggers: EmotionTrigger[];
  history: EmotionHistory[];
}

interface StateTransition {
  from: string;
  to: string;
  trigger: string;
  timestamp: number;
  confidence: number;
  reason: string;
}

interface DecisionNode {
  id: string;
  type: 'condition' | 'action' | 'goal';
  label: string;
  value?: any;
  children: DecisionNode[];
  parent?: string;
  weight: number;
  activeTime: number;
}

interface InteractionHistory {
  id: string;
  type: 'user' | 'system' | 'agent';
  content: string;
  timestamp: number;
  response: string;
  satisfaction: number;
  context: Record<string, any>;
}

interface PerformanceMetrics {
  responseTime: number;
  accuracy: number;
  efficiency: number;
  userSatisfaction: number;
  memoryUsage: number;
  computeTime: number;
  errorRate: number;
  adaptationRate: number;
}

interface AIStateVisualizationDashboardProps {
  isVisible: boolean;
  onClose: () => void;
  aiAgents?: AIAgent[];
  onAgentStateChange?: (agentId: string, state: AIState) => void;
  onBehaviorOverride?: (agentId: string, behavior: Partial<BehaviorState>) => void;
  realTimeUpdates?: boolean;
}

export const AIStateVisualizationDashboard: React.FC<AIStateVisualizationDashboardProps> = ({
  isVisible,
  onClose,
  aiAgents = [],
  onAgentStateChange,
  onBehaviorOverride,
  realTimeUpdates = true
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'behavior' | 'memory' | 'emotions' | 'performance'>('overview');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [mockAgents, setMockAgents] = useState<AIAgent[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedStates, setRecordedStates] = useState<Record<string, AIState[]>>({});
  const [visualizationMode, setVisualizationMode] = useState<'network' | 'timeline' | 'heatmap'>('network');
  
  const updateIntervalRef = useRef<NodeJS.Timeout>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateHistoryRef = useRef<Record<string, AIState[]>>({});

  // Generate mock AI agents for demonstration
  useEffect(() => {
    if (aiAgents.length === 0) {
      const mockData = generateMockAIAgents();
      setMockAgents(mockData);
      if (!selectedAgent && mockData.length > 0) {
        setSelectedAgent(mockData[0].id);
      }
    }
  }, [aiAgents, selectedAgent]);

  // Real-time updates
  useEffect(() => {
    if (realTimeUpdates && isVisible) {
      updateIntervalRef.current = setInterval(() => {
        updateMockAgentStates();
      }, 1000); // Update every second
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [realTimeUpdates, isVisible]);

  // Canvas visualization rendering
  useEffect(() => {
    if (canvasRef.current && selectedAgent) {
      renderVisualization();
    }
  }, [selectedAgent, visualizationMode, mockAgents]);

  const agents = aiAgents.length > 0 ? aiAgents : mockAgents;
  const currentAgent = selectedAgent ? agents.find(a => a.id === selectedAgent) : null;

  // Generate mock AI agents
  const generateMockAIAgents = useCallback((): AIAgent[] => {
    return [
      {
        id: 'mascot-dragon',
        type: 'mascot',
        name: 'Dragon Companion',
        state: {
          current: 'interactive',
          previous: 'idle',
          transitions: [],
          duration: 5432,
          confidence: 0.85,
          metadata: { mood: 'playful', energy: 78 }
        },
        behavior: {
          type: 'active',
          priority: 8,
          actions: [
            { id: 'greet', type: 'social', priority: 5 },
            { id: 'animate', type: 'visual', priority: 7 }
          ],
          constraints: [
            { id: 'energy', type: 'resource', limit: 100 }
          ],
          decisionTree: {
            id: 'root',
            type: 'condition',
            label: 'User Present?',
            children: [],
            weight: 1.0,
            activeTime: 0
          }
        },
        goals: [
          {
            id: 'engage-user',
            type: 'primary',
            description: 'Keep user engaged and motivated',
            priority: 10,
            progress: 65,
            dependencies: [],
            status: 'active'
          }
        ],
        memory: {
          shortTerm: [],
          longTerm: [],
          episodic: [],
          semantic: { concepts: new Map(), relationships: new Map() },
          workingMemory: { capacity: 7, items: [] }
        },
        emotions: {
          primary: 'joy',
          intensity: 0.7,
          valence: 0.8,
          arousal: 0.6,
          emotions: { joy: 0.7, excitement: 0.5, curiosity: 0.3 },
          triggers: [],
          history: []
        },
        interactions: [],
        performance: {
          responseTime: 120,
          accuracy: 0.92,
          efficiency: 0.88,
          userSatisfaction: 0.85,
          memoryUsage: 45.2,
          computeTime: 8.5,
          errorRate: 0.02,
          adaptationRate: 0.15
        }
      },
      {
        id: 'tutorial-ai',
        type: 'tutorial',
        name: 'Learning Assistant',
        state: {
          current: 'analyzing',
          previous: 'waiting',
          transitions: [],
          duration: 2341,
          confidence: 0.92,
          metadata: { currentTopic: 'mathematics', difficulty: 'medium' }
        },
        behavior: {
          type: 'learning',
          priority: 9,
          actions: [],
          constraints: [],
          decisionTree: {
            id: 'tutorial-root',
            type: 'condition',
            label: 'Student Understanding?',
            children: [],
            weight: 1.0,
            activeTime: 0
          }
        },
        goals: [
          {
            id: 'adapt-difficulty',
            type: 'primary',
            description: 'Adjust content difficulty based on performance',
            priority: 9,
            progress: 40,
            dependencies: [],
            status: 'active'
          }
        ],
        memory: {
          shortTerm: [],
          longTerm: [],
          episodic: [],
          semantic: { concepts: new Map(), relationships: new Map() },
          workingMemory: { capacity: 7, items: [] }
        },
        emotions: {
          primary: 'curiosity',
          intensity: 0.6,
          valence: 0.5,
          arousal: 0.4,
          emotions: { curiosity: 0.6, patience: 0.8, determination: 0.7 },
          triggers: [],
          history: []
        },
        interactions: [],
        performance: {
          responseTime: 200,
          accuracy: 0.95,
          efficiency: 0.91,
          userSatisfaction: 0.88,
          memoryUsage: 62.3,
          computeTime: 15.2,
          errorRate: 0.01,
          adaptationRate: 0.22
        }
      }
    ];
  }, []);

  // Update mock agent states for real-time simulation
  const updateMockAgentStates = useCallback(() => {
    setMockAgents(prev => prev.map(agent => {
      const newState = simulateStateTransition(agent.state);
      const newEmotions = simulateEmotionEvolution(agent.emotions);
      const newPerformance = simulatePerformanceMetrics(agent.performance);
      
      // Record state transitions
      if (isRecording) {
        setRecordedStates(prevRecorded => ({
          ...prevRecorded,
          [agent.id]: [...(prevRecorded[agent.id] || []), newState].slice(-100)
        }));
      }

      // Store state history
      stateHistoryRef.current[agent.id] = [
        ...(stateHistoryRef.current[agent.id] || []),
        newState
      ].slice(-50);

      return {
        ...agent,
        state: newState,
        emotions: newEmotions,
        performance: newPerformance
      };
    }));
  }, [isRecording]);

  // Simulate state transitions
  const simulateStateTransition = (currentState: AIState): AIState => {
    const states = ['idle', 'active', 'interactive', 'learning', 'responding', 'analyzing'];
    const shouldTransition = Math.random() < 0.3; // 30% chance to transition

    if (!shouldTransition) {
      return {
        ...currentState,
        duration: currentState.duration + 1000
      };
    }

    const newState = states[Math.floor(Math.random() * states.length)];
    const transition: StateTransition = {
      from: currentState.current,
      to: newState,
      trigger: 'random',
      timestamp: Date.now(),
      confidence: 0.7 + Math.random() * 0.3,
      reason: 'Simulated transition'
    };

    return {
      current: newState,
      previous: currentState.current,
      transitions: [...currentState.transitions, transition].slice(-10),
      duration: 0,
      confidence: transition.confidence,
      metadata: currentState.metadata
    };
  };

  // Simulate emotion evolution
  const simulateEmotionEvolution = (currentEmotions: EmotionState): EmotionState => {
    const emotions = { ...currentEmotions.emotions };
    
    // Randomly adjust emotions
    Object.keys(emotions).forEach(emotion => {
      const change = (Math.random() - 0.5) * 0.1; // -0.05 to +0.05
      emotions[emotion] = Math.max(0, Math.min(1, emotions[emotion] + change));
    });

    const primaryEmotion = Object.keys(emotions).reduce((a, b) => 
      emotions[a] > emotions[b] ? a : b
    );

    return {
      ...currentEmotions,
      emotions,
      primary: primaryEmotion,
      intensity: emotions[primaryEmotion],
      valence: calculateValence(emotions),
      arousal: calculateArousal(emotions)
    };
  };

  // Simulate performance metrics
  const simulatePerformanceMetrics = (current: PerformanceMetrics): PerformanceMetrics => {
    return {
      responseTime: Math.max(50, current.responseTime + (Math.random() - 0.5) * 20),
      accuracy: Math.max(0.5, Math.min(1, current.accuracy + (Math.random() - 0.5) * 0.05)),
      efficiency: Math.max(0.5, Math.min(1, current.efficiency + (Math.random() - 0.5) * 0.03)),
      userSatisfaction: Math.max(0, Math.min(1, current.userSatisfaction + (Math.random() - 0.5) * 0.02)),
      memoryUsage: Math.max(10, Math.min(100, current.memoryUsage + (Math.random() - 0.5) * 5)),
      computeTime: Math.max(1, current.computeTime + (Math.random() - 0.5) * 2),
      errorRate: Math.max(0, Math.min(0.1, current.errorRate + (Math.random() - 0.5) * 0.005)),
      adaptationRate: Math.max(0, Math.min(1, current.adaptationRate + (Math.random() - 0.5) * 0.01))
    };
  };

  // Helper functions
  const calculateValence = (emotions: Record<string, number>): number => {
    const positive = ['joy', 'excitement', 'satisfaction', 'love'] as const;
    const negative = ['anger', 'fear', 'sadness', 'frustration'] as const;
    
    const positiveSum = positive.reduce((sum, emotion) => sum + (emotions[emotion] || 0), 0);
    const negativeSum = negative.reduce((sum, emotion) => sum + (emotions[emotion] || 0), 0);
    
    return (positiveSum - negativeSum) / Math.max(positiveSum + negativeSum, 1);
  };

  const calculateArousal = (emotions: Record<string, number>): number => {
    const high = ['excitement', 'anger', 'fear', 'surprise'] as const;
    const low = ['sadness', 'contentment', 'boredom'] as const;
    
    const highSum = high.reduce((sum, emotion) => sum + (emotions[emotion] || 0), 0);
    const lowSum = low.reduce((sum, emotion) => sum + (emotions[emotion] || 0), 0);
    
    return highSum / Math.max(highSum + lowSum, 1);
  };

  // Render canvas visualization
  const renderVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentAgent) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    switch (visualizationMode) {
      case 'network':
        renderNetworkVisualization(ctx, currentAgent);
        break;
      case 'timeline':
        renderTimelineVisualization(ctx, currentAgent);
        break;
      case 'heatmap':
        renderHeatmapVisualization(ctx, currentAgent);
        break;
    }
  }, [currentAgent, visualizationMode]);

  // Network visualization
  const renderNetworkVisualization = (ctx: CanvasRenderingContext2D, agent: AIAgent) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const radius = 80;

    // Draw central node (agent)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = getStateColor(agent.state.current);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw state nodes around center
    const states = ['idle', 'active', 'interactive', 'learning', 'responding'];
    states.forEach((state, index) => {
      const angle = (index / states.length) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, 2 * Math.PI);
      ctx.fillStyle = state === agent.state.current ? getStateColor(state) : '#f0f0f0';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.stroke();

      // Draw connection to current state
      if (state === agent.state.current) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#333';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state, x, y - 25);
    });

    // Draw agent label
    ctx.fillStyle = '#333';
    ctx.font = '12px bold monospace';
    ctx.textAlign = 'center';
    ctx.fillText(agent.name, centerX, centerY + 50);
  };

  // Timeline visualization
  const renderTimelineVisualization = (ctx: CanvasRenderingContext2D, agent: AIAgent) => {
    const history = stateHistoryRef.current[agent.id] || [];
    if (history.length < 2) return;

    const width = ctx.canvas.width - 40;
    const height = ctx.canvas.height - 40;
    const stepWidth = width / Math.max(history.length - 1, 1);

    // Draw timeline
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, height + 20);
    ctx.lineTo(width + 20, height + 20);
    ctx.stroke();

    // Draw state transitions
    history.forEach((state, index) => {
      const x = 20 + index * stepWidth;
      const y = height + 20 - (getStateValue(state.current) * height);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = getStateColor(state.current);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.stroke();

      if (index > 0) {
        const prevX = 20 + (index - 1) * stepWidth;
        const prevY = height + 20 - (getStateValue(history[index - 1].current) * height);
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = getStateColor(state.current);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  // Heatmap visualization
  const renderHeatmapVisualization = (ctx: CanvasRenderingContext2D, agent: AIAgent) => {
    const emotions = agent.emotions.emotions;
    const emotionNames = Object.keys(emotions);
    const cellWidth = ctx.canvas.width / emotionNames.length;
    const cellHeight = ctx.canvas.height / emotionNames.length;

    emotionNames.forEach((emotion1, i) => {
      emotionNames.forEach((emotion2, j) => {
        const intensity1 = emotions[emotion1];
        const intensity2 = emotions[emotion2];
        const correlation = Math.abs(intensity1 - intensity2);
        
        const x = i * cellWidth;
        const y = j * cellHeight;
        
        ctx.fillStyle = `rgba(255, 0, 0, ${1 - correlation})`;
        ctx.fillRect(x, y, cellWidth, cellHeight);
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
        
        // Label
        if (i === j) {
          ctx.fillStyle = '#fff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(emotion1.slice(0, 3), x + cellWidth/2, y + cellHeight/2);
        }
      });
    });
  };

  // Helper functions
  const getStateColor = (state: string): string => {
    const colors: Record<string, string> = {
      idle: '#95a5a6',
      active: '#3498db',
      interactive: '#2ecc71',
      learning: '#f39c12',
      responding: '#e74c3c',
      analyzing: '#9b59b6'
    };
    return colors[state] || '#95a5a6';
  };

  const getStateValue = (state: string): number => {
    const values: Record<string, number> = {
      idle: 0.1,
      active: 0.4,
      interactive: 0.7,
      learning: 0.6,
      responding: 0.9,
      analyzing: 0.8
    };
    return values[state] || 0.5;
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-4 bg-gray-900 text-white rounded-lg shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">AI State Visualization Dashboard</h2>
          <div className="text-sm opacity-80">
            {agents.length} AI Agents • {currentAgent?.name || 'No agent selected'}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isRecording ? 'bg-red-500 hover:bg-red-400' : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            {isRecording ? '⏹ Recording' : '⏺ Record'}
          </button>
          <select
            value={visualizationMode}
            onChange={(e) => setVisualizationMode(e.target.value as any)}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
          >
            <option value="network">Network</option>
            <option value="timeline">Timeline</option>
            <option value="heatmap">Heatmap</option>
          </select>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm font-medium"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex h-full">
        {/* Agent List */}
        <div className="w-64 bg-gray-800 p-4 border-r border-gray-700 overflow-auto">
          <h3 className="font-medium mb-3">AI Agents</h3>
          <div className="space-y-2">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedAgent === agent.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <div className="font-medium">{agent.name}</div>
                <div className="text-xs opacity-60">{agent.type}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getStateColor(agent.state.current) }}
                  />
                  <span className="text-xs">{agent.state.current}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="bg-gray-800 border-b border-gray-700">
            <div className="flex">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'behavior', label: 'Behavior', icon: '🎯' },
                { id: 'memory', label: 'Memory', icon: '🧠' },
                { id: 'emotions', label: 'Emotions', icon: '😊' },
                { id: 'performance', label: 'Performance', icon: '⚡' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 bg-gray-700 text-white'
                      : 'border-transparent hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                {activeTab === 'overview' && currentAgent && (
                  <OverviewTab 
                    agent={currentAgent}
                    visualizationMode={visualizationMode}
                    canvasRef={canvasRef}
                  />
                )}
                
                {activeTab === 'behavior' && currentAgent && (
                  <BehaviorTab 
                    agent={currentAgent}
                    onBehaviorOverride={onBehaviorOverride}
                  />
                )}
                
                {activeTab === 'memory' && currentAgent && (
                  <MemoryTab agent={currentAgent} />
                )}
                
                {activeTab === 'emotions' && currentAgent && (
                  <EmotionsTab agent={currentAgent} />
                )}
                
                {activeTab === 'performance' && currentAgent && (
                  <PerformanceTab agent={currentAgent} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Overview tab component
const OverviewTab: React.FC<{
  agent: AIAgent;
  visualizationMode: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}> = ({ agent, visualizationMode, canvasRef }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-purple-400">Agent Overview</h3>

      {/* Current State */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Current State</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{agent.state.current}</div>
            <div className="text-sm text-gray-400">State</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{agent.state.confidence.toFixed(2)}</div>
            <div className="text-sm text-gray-400">Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{(agent.state.duration / 1000).toFixed(1)}s</div>
            <div className="text-sm text-gray-400">Duration</div>
          </div>
        </div>
      </div>

      {/* Visualization */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-3">State Visualization ({visualizationMode})</h4>
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full bg-gray-700 rounded"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Goals Progress</h4>
          <div className="space-y-2">
            {agent.goals.slice(0, 3).map(goal => (
              <div key={goal.id}>
                <div className="flex justify-between text-sm">
                  <span>{goal.description}</span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Emotional State</h4>
          <div className="text-center">
            <div className="text-3xl mb-2">{getEmotionEmoji(agent.emotions.primary)}</div>
            <div className="text-lg font-medium">{agent.emotions.primary}</div>
            <div className="text-sm text-gray-400">Intensity: {agent.emotions.intensity.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Additional tab components would be implemented here...
const BehaviorTab: React.FC<{ agent: AIAgent; onBehaviorOverride?: any }> = ({ agent }) => (
  <div>Behavior analysis for {agent.name}</div>
);

const MemoryTab: React.FC<{ agent: AIAgent }> = ({ agent }) => (
  <div>Memory state for {agent.name}</div>
);

const EmotionsTab: React.FC<{ agent: AIAgent }> = ({ agent }) => (
  <div>Emotional analysis for {agent.name}</div>
);

const PerformanceTab: React.FC<{ agent: AIAgent }> = ({ agent }) => (
  <div>Performance metrics for {agent.name}</div>
);

// Helper functions
function getEmotionEmoji(emotion: string): string {
  const emojis: Record<string, string> = {
    joy: '😊',
    excitement: '🎉',
    curiosity: '🤔',
    patience: '😌',
    determination: '💪',
    satisfaction: '😌',
    love: '❤️',
    anger: '😠',
    fear: '😰',
    sadness: '😢'
  };
  return emojis[emotion] || '😐';
}

// Type definitions for missing interfaces
interface Action {
  id: string;
  type: string;
  priority: number;
}

interface Constraint {
  id: string;
  type: string;
  limit: number;
}

interface Episode {
  id: string;
  content: any;
  timestamp: number;
}

interface SemanticMemory {
  concepts: Map<string, any>;
  relationships: Map<string, any>;
}

interface WorkingMemory {
  capacity: number;
  items: any[];
}

interface EmotionTrigger {
  id: string;
  trigger: string;
  response: string;
}

interface EmotionHistory {
  timestamp: number;
  emotion: string;
  intensity: number;
}

export default AIStateVisualizationDashboard;