import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// Advanced AI States for truly intelligent mascot behavior
interface MascotAIState {
  mood: 'happy' | 'excited' | 'focused' | 'tired' | 'curious' | 'proud' | 'encouraging';
  energy: number; // 0-100
  attention: number; // 0-100
  relationship: number; // 0-100 (bond with student)
  personality: {
    extroversion: number;
    patience: number;
    playfulness: number;
    intelligence: number;
  };
  memory: {
    lastInteraction: Date;
    favoriteActivities: string[];
    studentProgress: number;
    mistakePatterns: string[];
  };
}

interface AdvancedMascotProps {
  mascotType: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  studentData: {
    level: number;
    xp: number;
    currentStreak: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    recentPerformance: 'struggling' | 'average' | 'excellent';
  };
  currentActivity: 'idle' | 'exercise' | 'achievement' | 'mistake' | 'learning';
  equippedItems: string[];
  onMascotInteraction: (interaction: string) => void;
  onEmotionalStateChange: (state: MascotAIState) => void;
}

// Advanced 3D Mascot with AI personality
const AdvancedMascotSystem: React.FC<AdvancedMascotProps> = ({
  mascotType,
  studentData,
  currentActivity,
  equippedItems,
  onMascotInteraction,
  onEmotionalStateChange
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const mascotGroupRef = useRef<THREE.Group>();
  const animationRef = useRef<number>();
  
  // Advanced AI State Management
  const [aiState, setAiState] = useState<MascotAIState>({
    mood: 'happy',
    energy: 80,
    attention: 90,
    relationship: 50,
    personality: {
      extroversion: 0.7,
      patience: 0.6,
      playfulness: 0.8,
      intelligence: 0.9
    },
    memory: {
      lastInteraction: new Date(),
      favoriteActivities: ['exercises', 'achievements'],
      studentProgress: studentData.level,
      mistakePatterns: []
    }
  });

  const [currentDialogue, setCurrentDialogue] = useState<string>('');
  const [isThinking, setIsThinking] = useState(false);
  const [eyeTracking, setEyeTracking] = useState({ x: 0, y: 0 });
  const [breathingPhase, setBreathingPhase] = useState(0);

  // Enhanced AI Decision Making with better mood transitions
  const calculateMoodShift = useCallback(() => {
    let newMood = aiState.mood;
    let energyChange = 0;
    let relationshipChange = 0;
    let attentionChange = 0;

    // Time-based mood degradation (energy naturally decreases)
    const timeSinceLastInteraction = Date.now() - aiState.memory.lastInteraction.getTime();
    const minutesSinceInteraction = timeSinceLastInteraction / (1000 * 60);
    
    if (minutesSinceInteraction > 5) {
      energyChange -= Math.floor(minutesSinceInteraction / 5); // Lose energy over time
      attentionChange -= Math.floor(minutesSinceInteraction / 3);
    }

    // Time of day affects energy with personality consideration
    const extroversionBonus = aiState.personality.extroversion * 5;
    switch (studentData.timeOfDay) {
      case 'morning':
        energyChange += 5 + extroversionBonus;
        attentionChange += 10;
        break;
      case 'afternoon':
        energyChange += 2;
        break;
      case 'evening':
        energyChange -= 8 + (aiState.personality.extroversion * 3); // Extroverts tire more in evening
        attentionChange -= 5;
        break;
    }

    // Performance affects relationship and mood with memory influence
    const performanceWeight = aiState.memory.mistakePatterns.length > 3 ? 0.7 : 1.0; // Less impact if many mistakes
    
    switch (studentData.recentPerformance) {
      case 'excellent':
        newMood = aiState.energy > 70 ? 'excited' : 'proud';
        relationshipChange = Math.floor(5 * performanceWeight);
        energyChange += 10 + (aiState.personality.playfulness * 5);
        attentionChange += 15;
        
        // Update memory of student progress
        if (!aiState.memory.favoriteActivities.includes('excellence')) {
          aiState.memory.favoriteActivities.push('excellence');
        }
        break;
        
      case 'struggling':
        // Mood depends on patience and relationship level
        if (aiState.personality.patience > 0.7 && aiState.relationship > 60) {
          newMood = 'encouraging';
        } else if (aiState.personality.intelligence > 0.8) {
          newMood = 'focused';
        } else {
          newMood = 'curious'; // Try different approach
        }
        relationshipChange = Math.max(1, Math.floor(3 * aiState.personality.patience)); // Patient mascots care more
        energyChange -= 3;
        
        // Track mistake patterns
        const currentTime = new Date().toISOString().slice(0, 10); // Today's date
        if (!aiState.memory.mistakePatterns.includes(currentTime)) {
          aiState.memory.mistakePatterns.push(currentTime);
          // Keep only last 7 days
          aiState.memory.mistakePatterns = aiState.memory.mistakePatterns.slice(-7);
        }
        break;
        
      case 'average':
        newMood = aiState.personality.playfulness > 0.6 ? 'curious' : 'focused';
        relationshipChange = 1;
        energyChange += 2;
        break;
    }

    // Activity affects mood with personality modulation
    switch (currentActivity) {
      case 'achievement':
        const excitementLevel = aiState.personality.extroversion + aiState.personality.playfulness;
        newMood = excitementLevel > 1.0 ? 'excited' : 'proud';
        energyChange += 15 + (aiState.personality.playfulness * 10);
        attentionChange += 20;
        relationshipChange += 3;
        break;
        
      case 'mistake':
        // Don't immediately switch to encouraging - consider current state
        if (aiState.mood === 'excited' || aiState.mood === 'happy') {
          newMood = aiState.personality.patience > 0.6 ? 'encouraging' : 'focused';
        }
        energyChange -= 2;
        break;
        
      case 'exercise':
        if (aiState.energy > 50) {
          newMood = 'focused';
          energyChange -= 3 - aiState.personality.intelligence; // Smart mascots use less energy
        } else {
          newMood = 'tired';
          energyChange -= 5;
        }
        attentionChange += 5;
        break;
        
      case 'learning':
        newMood = aiState.personality.intelligence > 0.7 ? 'curious' : 'focused';
        energyChange -= 1;
        attentionChange += 10;
        break;
        
      case 'idle':
        // Gradual mood normalization during idle
        if (aiState.energy < 40) {
          newMood = 'tired';
        } else if (aiState.relationship > 80) {
          newMood = 'happy';
        }
        energyChange += 1; // Slow recovery
        break;
    }

    // Mood transition smoothing - don't jump between extreme moods
    const moodTransitions = {
      'tired': ['focused', 'happy'],
      'focused': ['curious', 'encouraging', 'tired'],
      'curious': ['happy', 'focused', 'excited'],
      'happy': ['excited', 'proud', 'curious'],
      'excited': ['happy', 'proud'],
      'proud': ['happy', 'excited'],
      'encouraging': ['focused', 'curious', 'happy']
    };
    
    const allowedTransitions = moodTransitions[aiState.mood as keyof typeof moodTransitions] || [];
    if (!allowedTransitions.includes(newMood) && newMood !== aiState.mood) {
      // Find closest allowed mood
      newMood = (allowedTransitions[0] as typeof newMood) || aiState.mood;
    }

    // Update AI state with bounds checking
    setAiState(prev => ({
      ...prev,
      mood: newMood,
      energy: Math.max(10, Math.min(100, prev.energy + energyChange)), // Never go below 10
      attention: Math.max(20, Math.min(100, prev.attention + attentionChange)),
      relationship: Math.max(0, Math.min(100, prev.relationship + relationshipChange)),
      memory: {
        ...prev.memory,
        lastInteraction: new Date(),
        studentProgress: studentData.level,
        favoriteActivities: [...new Set([...prev.memory.favoriteActivities, currentActivity])].slice(-5), // Keep last 5
        mistakePatterns: prev.memory.mistakePatterns
      }
    }));
  }, [aiState, studentData, currentActivity]);

  // Enhanced Intelligent Dialogue Generation with memory and context
  const generateIntelligentDialogue = useCallback(() => {
    const { mood, energy, relationship, personality, memory } = aiState;
    const { currentStreak, recentPerformance, level, xp, timeOfDay } = studentData;

    let dialogues: string[] = [];
    let contextualDialogues: string[] = [];

    // Base mood responses with personality influence
    switch (mood) {
      case 'proud':
        dialogues = [
          `Incredible! You've mastered ${level} levels!`,
          `I'm so proud of your ${currentStreak}-day streak!`,
          `You're becoming a real expert! ✨`,
          `Look how far you've come - ${xp} XP earned!`
        ];
        
        // Extroverted mascots are more expressive
        if (personality.extroversion > 0.7) {
          dialogues.push("I want to tell EVERYONE about your amazing progress!");
          dialogues.push("You're absolutely BRILLIANT! 🌟");
        }
        break;
        
      case 'encouraging':
        dialogues = [
          "Everyone learns differently - you're doing great!",
          "Mistakes help your brain grow stronger! 💪",
          "Let's try a different approach together.",
          "I believe in you - we'll figure this out!"
        ];
        
        // Patient mascots give more supportive messages
        if (personality.patience > 0.8) {
          dialogues.push("Take your time - learning is a journey, not a race.");
          dialogues.push("Every expert was once a beginner. You're doing amazing!");
        }
        
        // Reference past successes if high relationship
        if (relationship > 80 && memory.favoriteActivities.includes('excellence')) {
          dialogues.push("Remember how you aced that challenge yesterday? Same energy!");
        }
        break;
        
      case 'excited':
        dialogues = [
          "WOW! That was AMAZING! 🎉",
          "You just unlocked something incredible!",
          "I can't contain my excitement! You rock!",
          "This is SO COOL! You're on fire! 🔥"
        ];
        
        // Playful mascots add more enthusiasm
        if (personality.playfulness > 0.7) {
          dialogues.push("WOOOHOOO! *does a little dance* 💃");
          dialogues.push("Can we do that again?! That was EPIC!");
        }
        break;
        
      case 'curious':
        dialogues = [
          "I wonder what you'll discover next?",
          "What's your favorite thing we've learned?",
          "Ready for a new challenge? 🤔",
          "Hmm, that's interesting... tell me more!"
        ];
        
        // Intelligent mascots ask deeper questions
        if (personality.intelligence > 0.8) {
          dialogues.push("I'm curious about your problem-solving process...");
          dialogues.push("What patterns do you notice in these exercises?");
        }
        break;
        
      case 'focused':
        dialogues = [
          "Let's concentrate on this together.",
          "I can see you're really thinking hard!",
          "Take your time to understand this concept.",
          "Focus is your superpower! 🎯"
        ];
        break;
        
      case 'tired':
        dialogues = [
          "Maybe we should take a little break?",
          "You've been working so hard today!",
          "How about we try something easier for now?",
          "Even superheroes need rest sometimes! 😴"
        ];
        break;
        
      case 'happy':
      default:
        dialogues = [
          "It's so nice spending time with you!",
          "Learning together is my favorite thing!",
          "You always make me smile! 😊",
          "Ready for our next adventure?"
        ];
    }

    // Context-based additions
    
    // Time of day context
    if (timeOfDay === 'morning' && energy > 70) {
      contextualDialogues.push("Good morning! I love starting the day with learning!");
    } else if (timeOfDay === 'evening' && energy < 40) {
      contextualDialogues.push("You've worked so hard today. I'm impressed!");
    }
    
    // Streak-based encouragement
    if (currentStreak > 7) {
      contextualDialogues.push(`${currentStreak} days in a row! You're unstoppable! 🔥`);
    } else if (currentStreak === 1) {
      contextualDialogues.push("Great to see you back! Let's build that streak!");
    }
    
    // XP milestone recognition
    const xpMilestones = [100, 500, 1000, 2000, 5000];
    const nearestMilestone = xpMilestones.find(m => m > xp);
    if (nearestMilestone && xp > nearestMilestone - 50) {
      contextualDialogues.push(`You're so close to ${nearestMilestone} XP! Keep going!`);
    }
    
    // Memory-based personalization
    if (memory.mistakePatterns.length > 3 && recentPerformance !== 'struggling') {
      contextualDialogues.push("I'm so proud of how you've improved! Your persistence paid off!");
    }
    
    if (memory.favoriteActivities.includes('achievement') && currentActivity === 'achievement') {
      contextualDialogues.push("Another achievement! You're really good at these challenges!");
    }
    
    // Performance-based adjustments with relationship consideration
    if (recentPerformance === 'struggling' && relationship > 70) {
      contextualDialogues.push("I've seen you overcome tough challenges before. You've got this!");
    } else if (recentPerformance === 'excellent' && relationship > 60) {
      contextualDialogues.push("Working with you is such a joy! You make learning look easy!");
    }

    // Energy-based variations
    let allDialogues = [...dialogues, ...contextualDialogues];
    
    if (energy < 30) {
      // Tired mascot speaks more softly
      allDialogues = allDialogues.map(d => 
        d.replace(/!/g, '.').replace(/WOW/g, 'wow').replace(/AMAZING/g, 'amazing')
      );
    } else if (energy > 80 && personality.extroversion > 0.6) {
      // High energy extroverts are more expressive
      allDialogues = allDialogues.map(d => 
        d.includes('!') ? d : d.replace(/\.$/, '!')
      );
    }
    
    // Attention affects response complexity
    if (aiState.attention < 40) {
      // Low attention = shorter responses
      allDialogues = allDialogues.filter(d => d.length < 50);
    }

    return allDialogues[Math.floor(Math.random() * allDialogues.length)] || "Hi there! 👋";
  }, [aiState, studentData, currentActivity]);

  // Enhanced 3D Rendering with Personality-driven appearance
  const create3DMascot = useCallback(() => {
    const group = new THREE.Group();
    
    // Personality-driven geometry adjustments
    const headSize = 0.6 + (aiState.personality.extroversion * 0.3); // Extroverts have bigger heads
    const eyeSize = 0.12 + (aiState.personality.intelligence * 0.08); // Smart mascots have bigger eyes
    const bodyWidth = 0.9 + (aiState.personality.playfulness * 0.2); // Playful mascots are rounder
    
    // Dynamic scaling based on energy and mood
    let bodyScale = 1 + (aiState.energy / 400);
    if (aiState.mood === 'excited') bodyScale += 0.1;
    if (aiState.mood === 'tired') bodyScale -= 0.1;
    
    // Mood and relationship affect color
    const baseHue = {
      'happy': 0.3,      // Yellow-green
      'excited': 0.15,   // Orange
      'proud': 0.8,      // Purple
      'encouraging': 0.6,// Blue
      'focused': 0.7,    // Blue-purple
      'curious': 0.5,    // Cyan
      'tired': 0.1       // Red-orange
    }[aiState.mood] || 0.3;
    
    const relationshipBonus = (aiState.relationship / 100) * 0.2;
    const finalHue = (baseHue + relationshipBonus) % 1.0;
    
    // Head with personality-influenced appearance
    const headGeometry = new THREE.SphereGeometry(headSize, 
      Math.max(16, Math.floor(32 * (aiState.attention / 100))), // Attention affects geometry detail
      Math.max(16, Math.floor(32 * (aiState.attention / 100))))
    ;
    
    const headMaterial = new THREE.MeshPhongMaterial({ 
      color: new THREE.Color().setHSL(
        finalHue,
        0.7 + (aiState.personality.playfulness * 0.3), // Playful = more saturated
        0.5 + (aiState.energy / 200) + (aiState.personality.extroversion * 0.2) // Energy + extroversion = brighter
      ),
      shininess: 50 + (aiState.personality.intelligence * 50), // Smart mascots are shinier
      transparent: true,
      opacity: 0.85 + (aiState.attention / 667) // 0.85 to 1.0 based on attention
    });
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.4 + (aiState.personality.extroversion * 0.2), 0); // Extroverts stand taller
    head.castShadow = true;
    head.userData.isAnimated = true;
    group.add(head);

    // Intelligent Eyes with Personality-based characteristics
    const eyeGeometry = new THREE.SphereGeometry(eyeSize, 
      Math.max(8, Math.floor(16 * (aiState.attention / 100))), // Attention affects eye detail
      Math.max(8, Math.floor(16 * (aiState.attention / 100)))
    );
    
    // Eye color reflects intelligence and mood
    const eyeEmissiveColor = new THREE.Color();
    if (aiState.personality.intelligence > 0.8) {
      eyeEmissiveColor.setHex(0x4444FF); // Blue for high intelligence
    } else if (aiState.personality.playfulness > 0.7) {
      eyeEmissiveColor.setHex(0xFF4444); // Red for playful
    } else {
      eyeEmissiveColor.setHex(0x44FF44); // Green for balanced
    }
    
    const eyeMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      emissive: eyeEmissiveColor,
      emissiveIntensity: (aiState.attention / 200) + (aiState.personality.intelligence * 0.3)
    });

    // Eye positioning affected by personality
    const eyeSpread = 0.15 + (aiState.personality.extroversion * 0.1); // Extroverts have wider-set eyes
    const eyeHeight = head.position.y + 0.1 + (aiState.personality.intelligence * 0.1);
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());
    leftEye.position.set(-eyeSpread + eyeTracking.x * 0.1, eyeHeight + eyeTracking.y * 0.1, 0.5);
    leftEye.userData.isAnimated = true;
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());
    rightEye.position.set(eyeSpread + eyeTracking.x * 0.1, eyeHeight + eyeTracking.y * 0.1, 0.5);
    rightEye.userData.isAnimated = true;
    
    group.add(leftEye, rightEye);

    // Body with personality-influenced shape and breathing
    const bodyGeometry = new THREE.SphereGeometry(
      bodyWidth, 
      Math.max(12, Math.floor(24 * (aiState.energy / 100))), // Energy affects geometry complexity
      Math.max(12, Math.floor(24 * (aiState.energy / 100)))
    );
    
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: headMaterial.color.clone().multiplyScalar(0.9), // Slightly darker than head
      shininess: 40 + (aiState.personality.intelligence * 40),
      transparent: true,
      opacity: headMaterial.opacity
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Breathing intensity based on energy and mood
    const breathingIntensity = (aiState.energy / 1000) + (aiState.mood === 'excited' ? 0.03 : 0.02);
    const patienceScale = 1 + (aiState.personality.patience * 0.1); // Patient mascots are slightly larger
    
    body.scale.set(
      bodyScale * patienceScale,
      bodyScale * patienceScale * (1 + Math.sin(breathingPhase) * breathingIntensity),
      bodyScale * patienceScale
    );
    
    body.position.set(0, 0, 0);
    body.castShadow = true;
    body.userData.isAnimated = true;
    group.add(body);

    // Mood-based special effects
    if (aiState.mood === 'excited') {
      // Particle aura for excitement
      const particleGeometry = new THREE.BufferGeometry();
      const particleCount = 100;
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 5;
      }
      
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        color: 0xFFD700,
        size: 0.1,
        transparent: true,
        opacity: 0.8
      });
      
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      group.add(particles);
    }

    return group;
  }, [aiState, eyeTracking, breathingPhase]);

  // Advanced Animation Controller
  const updateMascotAnimation = useCallback((time: number) => {
    if (!mascotGroupRef.current) return;

    const mascot = mascotGroupRef.current;
    
    // Breathing animation
    setBreathingPhase(time * 0.002);
    
    // Mood-based animations
    switch (aiState.mood) {
      case 'excited':
        mascot.position.y = Math.sin(time * 0.01) * 0.3 + 0.2;
        mascot.rotation.z = Math.sin(time * 0.008) * 0.1;
        break;
        
      case 'encouraging':
        mascot.position.y = Math.sin(time * 0.003) * 0.1;
        mascot.rotation.x = Math.sin(time * 0.004) * 0.05;
        break;
        
      case 'focused':
        // Minimal movement when focused
        mascot.position.y = Math.sin(time * 0.001) * 0.02;
        break;
        
      case 'tired':
        mascot.position.y = Math.sin(time * 0.002) * 0.05 - 0.1;
        mascot.rotation.z = Math.sin(time * 0.001) * 0.02;
        break;
        
      default: // happy, curious, proud
        mascot.position.y = Math.sin(time * 0.004) * 0.15;
        mascot.rotation.y = Math.sin(time * 0.002) * 0.05;
    }

    // Energy affects animation speed
    const energyMultiplier = aiState.energy / 100;
    mascot.children.forEach((child: THREE.Object3D) => {
      if (child.userData.isAnimated) {
        child.rotation.y = time * 0.001 * energyMultiplier;
      }
    });

    // Eye tracking simulation (looking around intelligently)
    if (Math.random() < 0.01) { // Occasional eye movement
      setEyeTracking({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2
      });
    }
  }, [aiState]);

  // Smart Interaction Handler
  const handleIntelligentInteraction = useCallback((interactionType: string) => {
    setIsThinking(true);
    
    // Simulate AI thinking time based on personality
    const thinkingTime = (1 - aiState.personality.intelligence) * 1000 + 500;
    
    setTimeout(() => {
      const dialogue = generateIntelligentDialogue();
      setCurrentDialogue(dialogue);
      setIsThinking(false);
      
      // Update relationship based on interaction
      setAiState(prev => ({
        ...prev,
        relationship: Math.min(100, prev.relationship + 1),
        energy: Math.max(0, prev.energy - 2)
      }));
      
      onMascotInteraction(interactionType);
      onEmotionalStateChange(aiState);
    }, thinkingTime);
  }, [aiState, generateIntelligentDialogue, onMascotInteraction, onEmotionalStateChange]);

  // Initialize 3D Scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.background = null;
    sceneRef.current = scene;

    // Camera with dynamic positioning
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 4);
    cameraRef.current = camera;

    // Advanced renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(200, 200);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Advanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Mood lighting
    const moodLight = new THREE.PointLight(0x8A2BE2, 0.5, 10);
    moodLight.position.set(0, 2, 2);
    scene.add(moodLight);

    // Create mascot
    const mascot = create3DMascot();
    scene.add(mascot);
    mascotGroupRef.current = mascot;

    mountRef.current.appendChild(renderer.domElement);

    // Animation loop
    const animate = (time: number) => {
      updateMascotAnimation(time);
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate(0);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [create3DMascot, updateMascotAnimation]);

  // AI State Updates
  useEffect(() => {
    calculateMoodShift();
    const interval = setInterval(calculateMoodShift, 5000);
    return () => clearInterval(interval);
  }, [calculateMoodShift]);

  return (
    <div className="relative">
      {/* 3D Mascot Container */}
      <div 
        ref={mountRef}
        className="w-50 h-50 rounded-full cursor-pointer hover:scale-105 transition-transform duration-300"
        onClick={() => handleIntelligentInteraction('click')}
      />
      
      {/* AI Status Display */}
      <div className="absolute -top-2 -right-2 space-y-1">
        {/* Mood Indicator */}
        <div className={`w-4 h-4 rounded-full ${
          aiState.mood === 'excited' ? 'bg-yellow-400 animate-pulse' :
          aiState.mood === 'happy' ? 'bg-green-400' :
          aiState.mood === 'encouraging' ? 'bg-blue-400' :
          aiState.mood === 'focused' ? 'bg-purple-400' :
          aiState.mood === 'tired' ? 'bg-gray-400' :
          'bg-pink-400'
        }`} />
        
        {/* Energy Level */}
        <div className="w-4 h-8 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-t from-red-400 to-green-400 rounded-full transition-all duration-1000"
            style={{ height: `${aiState.energy}%` }}
          />
        </div>
      </div>

      {/* Intelligent Dialogue */}
      <AnimatePresence>
        {currentDialogue && (
          <motion.div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 max-w-xs"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-4 rounded-2xl shadow-xl">
              <p className="text-sm font-medium">{currentDialogue}</p>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-purple-600" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thinking Indicator */}
      <AnimatePresence>
        {isThinking && (
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-purple-400 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relationship Hearts */}
      {aiState.relationship > 80 && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <motion.div
            animate={{ y: [-5, -15, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-red-400 text-lg"
          >
            💕
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdvancedMascotSystem; 