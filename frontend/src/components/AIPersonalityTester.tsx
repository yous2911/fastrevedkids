import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdvancedMascotSystem from './AdvancedMascotSystem';

interface PersonalityProfile {
  extroversion: number;
  patience: number;
  playfulness: number;
  intelligence: number;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  studentData: {
    level: number;
    xp: number;
    currentStreak: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    recentPerformance: 'struggling' | 'average' | 'excellent';
  };
  activity: 'idle' | 'exercise' | 'achievement' | 'mistake' | 'learning';
  expectedBehavior: string[];
}

interface TestResult {
  scenario: string;
  interactions: string[];
  emotionalStates: any[];
  behaviorScore: number;
  timestamp: number;
}

const AIPersonalityTester: React.FC = () => {
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityProfile>({
    extroversion: 0.7,
    patience: 0.6,
    playfulness: 0.8,
    intelligence: 0.9
  });

  const [currentScenario, setCurrentScenario] = useState(0);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentInteractions, setCurrentInteractions] = useState<string[]>([]);
  const [currentEmotionalStates, setCurrentEmotionalStates] = useState<any[]>([]);

  // Predefined personality profiles for testing
  const personalityProfiles = {
    'extrovert-patient': { extroversion: 0.9, patience: 0.9, playfulness: 0.6, intelligence: 0.7 },
    'introvert-playful': { extroversion: 0.3, patience: 0.5, playfulness: 0.9, intelligence: 0.8 },
    'balanced-smart': { extroversion: 0.5, patience: 0.7, playfulness: 0.5, intelligence: 0.9 },
    'energetic-impatient': { extroversion: 0.8, patience: 0.3, playfulness: 0.8, intelligence: 0.6 },
    'calm-wise': { extroversion: 0.4, patience: 0.9, playfulness: 0.4, intelligence: 0.9 }
  };

  // Test scenarios to evaluate AI behavior
  const testScenarios: TestScenario[] = [
    {
      id: 'student-struggling-morning',
      name: 'Student Struggling in Morning',
      description: 'Student having difficulty with exercises in the morning',
      studentData: {
        level: 3,
        xp: 250,
        currentStreak: 2,
        timeOfDay: 'morning',
        recentPerformance: 'struggling'
      },
      activity: 'mistake',
      expectedBehavior: [
        'Patient mascots should be encouraging',
        'High intelligence should offer specific help',
        'Morning should boost energy responses'
      ]
    },
    {
      id: 'student-excellent-achievement',
      name: 'Student Excellence Achievement',
      description: 'Student performs excellently and achieves milestone',
      studentData: {
        level: 8,
        xp: 1500,
        currentStreak: 15,
        timeOfDay: 'afternoon',
        recentPerformance: 'excellent'
      },
      activity: 'achievement',
      expectedBehavior: [
        'Extroverts should be highly expressive',
        'Playful mascots should celebrate enthusiastically',
        'Should build stronger relationship bond'
      ]
    },
    {
      id: 'evening-fatigue-test',
      name: 'Evening Fatigue Response',
      description: 'Testing energy management in evening sessions',
      studentData: {
        level: 5,
        xp: 800,
        currentStreak: 8,
        timeOfDay: 'evening',
        recentPerformance: 'average'
      },
      activity: 'exercise',
      expectedBehavior: [
        'Energy should decrease in evening',
        'Extroverts should tire more',
        'Should suggest breaks when energy low'
      ]
    },
    {
      id: 'learning-curiosity-test',
      name: 'Learning and Curiosity Response',
      description: 'Testing intelligent responses to learning activities',
      studentData: {
        level: 6,
        xp: 1200,
        currentStreak: 20,
        timeOfDay: 'morning',
        recentPerformance: 'average'
      },
      activity: 'learning',
      expectedBehavior: [
        'High intelligence should ask deeper questions',
        'Should adapt dialogue to student level',
        'Curious mood should emerge naturally'
      ]
    },
    {
      id: 'relationship-memory-test',
      name: 'Relationship and Memory Test',
      description: 'Testing memory system and relationship building',
      studentData: {
        level: 10,
        xp: 2500,
        currentStreak: 30,
        timeOfDay: 'afternoon',
        recentPerformance: 'excellent'
      },
      activity: 'achievement',
      expectedBehavior: [
        'Should reference past interactions',
        'High relationship should show affection',
        'Memory should influence dialogue choices'
      ]
    }
  ];

  const handlePersonalityChange = (trait: keyof PersonalityProfile, value: number) => {
    setSelectedPersonality(prev => ({
      ...prev,
      [trait]: value
    }));
  };

  const selectPersonalityProfile = (profileName: keyof typeof personalityProfiles) => {
    setSelectedPersonality(personalityProfiles[profileName]);
  };

  const handleMascotInteraction = useCallback((interaction: string) => {
    setCurrentInteractions(prev => [...prev, interaction]);
  }, []);

  const handleEmotionalStateChange = useCallback((state: any) => {
    setCurrentEmotionalStates(prev => [...prev, { ...state, timestamp: Date.now() }]);
  }, []);

  const runScenarioTest = async (scenarioIndex: number) => {
    const scenario = testScenarios[scenarioIndex];
    setCurrentScenario(scenarioIndex);
    setCurrentInteractions([]);
    setCurrentEmotionalStates([]);
    setIsRunningTest(true);

    // Run test for 10 seconds to collect behavior data
    setTimeout(() => {
      const behaviorScore = calculateBehaviorScore(scenario, currentInteractions, currentEmotionalStates);
      
      const result: TestResult = {
        scenario: scenario.name,
        interactions: [...currentInteractions],
        emotionalStates: [...currentEmotionalStates],
        behaviorScore,
        timestamp: Date.now()
      };

      setTestResults(prev => [...prev, result]);
      setIsRunningTest(false);
    }, 10000);
  };

  const calculateBehaviorScore = (
    scenario: TestScenario,
    interactions: string[],
    emotionalStates: any[]
  ): number => {
    let score = 0;
    
    // Check if emotional states match expected behavior
    const latestState = emotionalStates[emotionalStates.length - 1];
    if (latestState) {
      // Score based on appropriate mood for scenario
      if (scenario.studentData.recentPerformance === 'excellent' && 
          ['excited', 'proud', 'happy'].includes(latestState.mood)) {
        score += 25;
      }
      
      if (scenario.studentData.recentPerformance === 'struggling' && 
          ['encouraging', 'focused'].includes(latestState.mood)) {
        score += 25;
      }
      
      // Score based on energy management
      if (scenario.studentData.timeOfDay === 'evening' && latestState.energy < 60) {
        score += 20;
      }
      
      if (scenario.studentData.timeOfDay === 'morning' && latestState.energy > 70) {
        score += 20;
      }
      
      // Score based on relationship building
      if (scenario.studentData.recentPerformance === 'excellent' && 
          latestState.relationship > 60) {
        score += 15;
      }
      
      // Score based on attention to student performance
      if (scenario.activity === 'mistake' && latestState.attention > 70) {
        score += 15;
      }
    }
    
    return Math.min(100, score);
  };

  const runAllTests = async () => {
    for (let i = 0; i < testScenarios.length; i++) {
      await new Promise(resolve => {
        runScenarioTest(i);
        setTimeout(resolve, 12000); // Wait for test completion + buffer
      });
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setCurrentInteractions([]);
    setCurrentEmotionalStates([]);
  };

  const getPersonalityDescription = (personality: PersonalityProfile): string => {
    const traits: string[] = [];
    if (personality.extroversion > 0.7) traits.push('Extroverted');
    if (personality.patience > 0.7) traits.push('Patient');
    if (personality.playfulness > 0.7) traits.push('Playful');
    if (personality.intelligence > 0.7) traits.push('Intelligent');
    
    return traits.length > 0 ? traits.join(', ') : 'Balanced';
  };

  const scenario = testScenarios[currentScenario];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl font-bold mb-2">
            🧠 AI Personality Behavior Tester
          </h1>
          <p className="text-indigo-200 text-lg">
            Test and validate mascot AI personality responses to different student scenarios
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel - Personality Controls */}
          <div className="space-y-6">
            
            {/* Personality Profile Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-xl font-bold mb-4">👤 Personality Profiles</h2>
              <div className="space-y-2">
                {Object.entries(personalityProfiles).map(([name, profile]) => (
                  <button
                    key={name}
                    onClick={() => selectPersonalityProfile(name as keyof typeof personalityProfiles)}
                    className="w-full p-3 text-left bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                  >
                    <div className="font-medium capitalize">
                      {name.replace('-', ' ')}
                    </div>
                    <div className="text-xs text-gray-300">
                      E:{profile.extroversion.toFixed(1)} P:{profile.patience.toFixed(1)} 
                      Pl:{profile.playfulness.toFixed(1)} I:{profile.intelligence.toFixed(1)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Personality Sliders */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-xl font-bold mb-4">🎛️ Custom Personality</h2>
              <div className="space-y-4">
                {Object.entries(selectedPersonality).map(([trait, value]) => (
                  <div key={trait}>
                    <label className="text-white text-sm font-medium block mb-2 capitalize">
                      {trait}: {value.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={value}
                      onChange={(e) => handlePersonalityChange(trait as keyof PersonalityProfile, parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-700 rounded">
                <div className="text-white text-sm font-medium">Current Profile:</div>
                <div className="text-gray-300 text-xs">
                  {getPersonalityDescription(selectedPersonality)}
                </div>
              </div>
            </div>

            {/* Test Controls */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-xl font-bold mb-4">🧪 Test Controls</h2>
              <div className="space-y-3">
                <button
                  onClick={() => runScenarioTest(currentScenario)}
                  disabled={isRunningTest}
                  className={`w-full p-3 rounded font-medium ${
                    isRunningTest 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isRunningTest ? 'Running Test...' : 'Run Current Scenario'}
                </button>
                
                <button
                  onClick={runAllTests}
                  disabled={isRunningTest}
                  className={`w-full p-3 rounded font-medium ${
                    isRunningTest 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  }`}
                >
                  Run All Tests
                </button>
                
                <button
                  onClick={clearResults}
                  className="w-full p-3 bg-red-600 hover:bg-red-500 text-white rounded font-medium"
                >
                  Clear Results
                </button>
              </div>
            </div>

            {/* Scenario Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-xl font-bold mb-4">📋 Test Scenarios</h2>
              <div className="space-y-2">
                {testScenarios.map((scenario, index) => (
                  <button
                    key={scenario.id}
                    onClick={() => setCurrentScenario(index)}
                    className={`w-full p-3 text-left rounded text-sm ${
                      currentScenario === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-xs opacity-80">{scenario.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Panel - Live Testing */}
          <div className="space-y-6">
            
            {/* Current Scenario Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-xl font-bold mb-4">
                📝 Current Scenario: {scenario.name}
              </h2>
              <p className="text-gray-300 mb-4">{scenario.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Level:</span>
                  <span className="text-white ml-2">{scenario.studentData.level}</span>
                </div>
                <div>
                  <span className="text-gray-400">XP:</span>
                  <span className="text-white ml-2">{scenario.studentData.xp}</span>
                </div>
                <div>
                  <span className="text-gray-400">Streak:</span>
                  <span className="text-white ml-2">{scenario.studentData.currentStreak}</span>
                </div>
                <div>
                  <span className="text-gray-400">Time:</span>
                  <span className="text-white ml-2">{scenario.studentData.timeOfDay}</span>
                </div>
                <div>
                  <span className="text-gray-400">Performance:</span>
                  <span className="text-white ml-2">{scenario.studentData.recentPerformance}</span>
                </div>
                <div>
                  <span className="text-gray-400">Activity:</span>
                  <span className="text-white ml-2">{scenario.activity}</span>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-white font-medium mb-2">Expected Behaviors:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  {scenario.expectedBehavior.map((behavior, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      {behavior}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Live Mascot Testing */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-xl font-bold mb-4">
                🎭 Live AI Testing
                {isRunningTest && (
                  <span className="ml-2 text-sm text-green-400 animate-pulse">
                    (Recording...)
                  </span>
                )}
              </h2>
              
              <div className="flex justify-center mb-6">
                <AdvancedMascotSystem
                  mascotType="dragon"
                  studentData={scenario.studentData}
                  currentActivity={scenario.activity}
                  equippedItems={['wizard_hat']}
                  onMascotInteraction={handleMascotInteraction}
                  onEmotionalStateChange={handleEmotionalStateChange}
                />
              </div>

              {/* Real-time Interaction Log */}
              <div className="bg-gray-700 rounded p-4 max-h-40 overflow-y-auto">
                <h3 className="text-white font-medium mb-2">Interaction Log:</h3>
                {currentInteractions.length > 0 ? (
                  <div className="space-y-1">
                    {currentInteractions.slice(-5).map((interaction, index) => (
                      <div key={index} className="text-sm text-gray-300">
                        <span className="text-blue-400">{new Date().toLocaleTimeString()}:</span> {interaction}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">No interactions yet...</div>
                )}
              </div>

              {/* Current Emotional State */}
              {currentEmotionalStates.length > 0 && (
                <div className="mt-4 bg-gray-700 rounded p-4">
                  <h3 className="text-white font-medium mb-2">Current State:</h3>
                  {(() => {
                    const latestState = currentEmotionalStates[currentEmotionalStates.length - 1];
                    return (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-400">Mood:</span> <span className="text-white">{latestState.mood}</span></div>
                        <div><span className="text-gray-400">Energy:</span> <span className="text-white">{latestState.energy}%</span></div>
                        <div><span className="text-gray-400">Attention:</span> <span className="text-white">{latestState.attention}%</span></div>
                        <div><span className="text-gray-400">Relationship:</span> <span className="text-white">{latestState.relationship}%</span></div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Test Results */}
          <div className="space-y-6">
            
            {/* Test Results Summary */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-xl font-bold mb-4">📊 Test Results</h2>
              
              {testResults.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gray-700 rounded p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-white font-medium text-sm">{result.scenario}</h3>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                          result.behaviorScore >= 80 ? 'bg-green-600 text-white' :
                          result.behaviorScore >= 60 ? 'bg-yellow-600 text-white' :
                          'bg-red-600 text-white'
                        }`}>
                          {result.behaviorScore}%
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-300 space-y-1">
                        <div>Interactions: {result.interactions.length}</div>
                        <div>State Changes: {result.emotionalStates.length}</div>
                        <div>
                          Time: {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                        
                        {result.emotionalStates.length > 0 && (
                          <div className="mt-2 p-2 bg-gray-600 rounded">
                            <div className="text-xs">Final State:</div>
                            {(() => {
                              const final = result.emotionalStates[result.emotionalStates.length - 1];
                              return (
                                <div className="text-xs space-y-1">
                                  <div>Mood: {final.mood}</div>
                                  <div>Energy: {final.energy}%</div>
                                  <div>Relationship: {final.relationship}%</div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  No test results yet. Run a scenario test to see results.
                </div>
              )}
            </div>

            {/* Performance Summary */}
            {testResults.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-white text-xl font-bold mb-4">📈 Performance Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Average Score:</span>
                    <span className="text-white font-bold">
                      {Math.round(testResults.reduce((sum, r) => sum + r.behaviorScore, 0) / testResults.length)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Tests Passed:</span>
                    <span className="text-white font-bold">
                      {testResults.filter(r => r.behaviorScore >= 70).length}/{testResults.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Interactions:</span>
                    <span className="text-white font-bold">
                      {testResults.reduce((sum, r) => sum + r.interactions.length, 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPersonalityTester;