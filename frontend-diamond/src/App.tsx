import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, Home, Volume2, VolumeX } from 'lucide-react';
import NextLevelXPSystem from './components/NextLevelXPSystem';

// =============================================================================
// 🔊 SYSTÈME AUDIO PREMIUM DIAMANT
// =============================================================================
const useMagicalSounds = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (soundEnabled) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported');
      }
    }
  }, [soundEnabled]);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration);

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }, [soundEnabled]);

  const playMagicalChord = useCallback(() => {
    setTimeout(() => playTone(523.25, 0.3), 0);    // C5
    setTimeout(() => playTone(659.25, 0.3), 100);  // E5
    setTimeout(() => playTone(783.99, 0.3), 200);  // G5
    setTimeout(() => playTone(1046.50, 0.5), 300); // C6
  }, [playTone]);

  const playSparkleSound = useCallback(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        playTone(800 + Math.random() * 600, 0.1, 'sine');
      }, i * 80);
    }
  }, [playTone]);

  const playLevelUpFanfare = useCallback(() => {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((note, index) => {
      setTimeout(() => playTone(note, 0.4), index * 150);
    });
  }, [playTone]);

  const playButtonClick = useCallback(() => {
    playTone(800, 0.1, 'square');
  }, [playTone]);

  const playErrorSound = useCallback(() => {
    playTone(200, 0.3, 'square');
    setTimeout(() => playTone(150, 0.3, 'square'), 200);
  }, [playTone]);

  return {
    playMagicalChord,
    playSparkleSound,
    playLevelUpFanfare,
    playButtonClick,
    playErrorSound,
    soundEnabled,
    setSoundEnabled
  };
};

// =============================================================================
// ✨ MOTEUR DE PARTICULES DIAMANT 3D
// =============================================================================
interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'sparkle' | 'crystal' | 'star' | 'heart';
}

const ParticleEngine: React.FC<{
  isActive: boolean;
  intensity: 0 | 1 | 2 | 3 | 4 | 5; // SuperMemo quality levels
  type: 'success' | 'levelup' | 'magic';
  position?: { x: number; y: number };
}> = ({ isActive, intensity, type, position = { x: 50, y: 50 } }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  const colors = useMemo(() => ({
    success: ['#10b981', '#34d399', '#6ee7b7', '#d1fae5'],
    levelup: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ede9fe'],
    magic: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
  }), []);

  const createParticle = useCallback((x: number, y: number): Particle => {
    const particleColors = colors[type];
    return {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 3,
      size: Math.random() * 6 + 3,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      life: 0,
      maxLife: Math.random() * 80 + 40,
      type: (['sparkle', 'crystal', 'star', 'heart'] as const)[Math.floor(Math.random() * 4)]
    };
  }, [type, colors]);

  const updateParticles = useCallback(() => {
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.life++;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.15; // Gravité magique
      particle.vx *= 0.98; // Friction
      return particle.life < particle.maxLife;
    });
  }, []);

  const drawParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current.forEach(particle => {
      const alpha = Math.max(0, 1 - (particle.life / particle.maxLife));
      ctx.save();
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.life * 0.1);
      
      // Dessiner selon le type avec effets 3D
      switch (particle.type) {
        case 'sparkle':
          // Étoile brillante
          ctx.shadowBlur = 10;
          ctx.shadowColor = particle.color;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const radius = i % 2 === 0 ? particle.size : particle.size * 0.4;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'crystal':
          // Cristal 3D
          ctx.shadowBlur = 8;
          ctx.shadowColor = particle.color;
          ctx.beginPath();
          ctx.moveTo(0, -particle.size);
          ctx.lineTo(particle.size * 0.7, 0);
          ctx.lineTo(0, particle.size);
          ctx.lineTo(-particle.size * 0.7, 0);
          ctx.closePath();
          ctx.fill();
          // Reflet
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.beginPath();
          ctx.moveTo(0, -particle.size * 0.6);
          ctx.lineTo(particle.size * 0.3, -particle.size * 0.2);
          ctx.lineTo(0, particle.size * 0.2);
          ctx.lineTo(-particle.size * 0.3, -particle.size * 0.2);
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'star':
          // Étoile 5 branches
          ctx.shadowBlur = 6;
          ctx.shadowColor = particle.color;
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const radius = i % 2 === 0 ? particle.size : particle.size * 0.5;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'heart':
          // Cœur 3D
          ctx.shadowBlur = 8;
          ctx.shadowColor = particle.color;
          const size = particle.size;
          ctx.beginPath();
          ctx.moveTo(0, size * 0.3);
          ctx.bezierCurveTo(-size, -size * 0.5, -size, size * 0.3, 0, size);
          ctx.bezierCurveTo(size, size * 0.3, size, -size * 0.5, 0, size * 0.3);
          ctx.fill();
          break;
      }
      
      ctx.restore();
    });
  }, []);

  const animate = useCallback(() => {
    updateParticles();
    drawParticles();
    animationRef.current = requestAnimationFrame(animate);
  }, [updateParticles, drawParticles]);

  useEffect(() => {
    if (isActive) {
      const intensityConfig = {
        low: { count: 15, interval: 80 },
        0: { count: 10, interval: 100 }, // BLACKOUT
    1: { count: 15, interval: 80 },  // HARD
    2: { count: 20, interval: 70 },  // DIFFICULT
    3: { count: 30, interval: 50 },  // GOOD
    4: { count: 40, interval: 40 },  // EASY
    5: { count: 50, interval: 30 },  // PERFECT
        high: { count: 60, interval: 30 },
        epic: { count: 120, interval: 15 }
      };

      const config = intensityConfig[intensity];
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Créer les particules
      for (let i = 0; i < config.count; i++) {
        setTimeout(() => {
          const x = (position.x / 100) * canvas.width + (Math.random() - 0.5) * 200;
          const y = (position.y / 100) * canvas.height + (Math.random() - 0.5) * 200;
          particlesRef.current.push(createParticle(x, y));
        }, i * config.interval);
      }

      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, intensity, position, createParticle, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      style={{ background: 'transparent' }}
    />
  );
};

// =============================================================================
// 🐸 MASCOTTE PREMIUM DIAMANT AVEC ÉMOTIONS
// =============================================================================
const MascottePremium: React.FC<{
  emotion: 'idle' | 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sleepy';
  message?: string;
  onInteraction?: () => void;
}> = ({ emotion, message, onInteraction }) => {
  const [currentEmotion, setCurrentEmotion] = useState(emotion);
  const [showMessage, setShowMessage] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const emotionEmojis = {
    idle: '🐸',
    happy: '😊🐸',
    excited: '🤩🐸',
    thinking: '🤔🐸',
    celebrating: '🎉🐸',
    sleepy: '😴🐸'
  };

  const emotionMessages = {
    idle: ['Prêt pour l\'aventure ?', 'Que veux-tu apprendre ?'],
    happy: ['Super travail !', 'Tu es fantastique !'],
    excited: ['INCROYABLE !', 'Tu es un génie !'],
    thinking: ['Réfléchissons ensemble...', 'Prenons notre temps'],
    celebrating: ['BRAVO ! 🎉', 'Tu as réussi !'],
    sleepy: ['Zzz... Prêt à continuer ?', '*bâille*']
  };

  useEffect(() => {
    setCurrentEmotion(emotion);
    if (message) {
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  }, [emotion, message]);

  const handleClick = () => {
    setIsInteracting(true);
    setCurrentEmotion('excited');
    setShowMessage(true);
    
    setTimeout(() => {
      setCurrentEmotion('happy');
      setIsInteracting(false);
      setShowMessage(false);
    }, 2000);

    onInteraction?.();
  };

  const getEmotionAnimation = () => {
    switch (currentEmotion) {
      case 'happy':
        return 'animate-bounce';
      case 'excited':
        return 'animate-pulse';
      case 'thinking':
        return 'animate-pulse';
      case 'celebrating':
        return 'animate-spin';
      default:
        return '';
    }
  };

  return (
    <div className="mascot-container">
      {/* Aura magique */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-green-400/20 blur-xl animate-pulse" />
      
      {/* Particules autour de la mascotte */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            style={{
              top: `${20 + Math.sin(i * 60) * 30}%`,
              left: `${20 + Math.cos(i * 60) * 30}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: [0, 360]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Mascotte principale */}
      <motion.div
        className={`
          text-6xl cursor-pointer relative z-10 filter drop-shadow-lg
          ${getEmotionAnimation()}
          ${isInteracting ? 'scale-125' : 'hover:scale-110'}
          transition-all duration-300
        `}
        onClick={handleClick}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20 
        }}
      >
        {emotionEmojis[currentEmotion]}
      </motion.div>

      {/* Bulle de dialogue */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            className="absolute bottom-full right-0 mb-4 bg-white/95 backdrop-blur-sm border-2 border-purple-200 rounded-2xl px-4 py-2 shadow-xl max-w-xs"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="absolute bottom-0 right-4 transform translate-y-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white/95" />
            </div>
            
            <p className="text-sm font-medium text-gray-800 text-center">
              {message || emotionMessages[currentEmotion][Math.floor(Math.random() * emotionMessages[currentEmotion].length)]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Effet de clic */}
      <AnimatePresence>
        {isInteracting && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-yellow-400"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// 💎 CRISTAUX XP PREMIUM AVEC PHYSIQUE 3D
// =============================================================================
const XPCrystalsPremium: React.FC<{
  currentXP: number;
  maxXP: number;
  level: number;
  onLevelUp?: (newLevel: number) => void;
}> = ({ currentXP, maxXP, level, onLevelUp }) => {
  const [displayXP, setDisplayXP] = useState(currentXP);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [showXPGain, setShowXPGain] = useState<number | null>(null);
  const { playLevelUpFanfare, playSparkleSound } = useMagicalSounds();

  const progress = Math.min((displayXP / maxXP) * 100, 100);

  // Animation XP gain
  useEffect(() => {
    if (currentXP > displayXP) {
      const difference = currentXP - displayXP;
      setShowXPGain(difference);
      playSparkleSound();
      
      // Animation progressive
      const duration = 1000;
      const steps = 30;
      const increment = difference / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        setDisplayXP(prev => Math.min(prev + increment, currentXP));
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setDisplayXP(currentXP);
          setTimeout(() => setShowXPGain(null), 1000);
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [currentXP, displayXP, playSparkleSound]);

  // Détection level up
  useEffect(() => {
    if (displayXP >= maxXP && !isLevelingUp) {
      setIsLevelingUp(true);
      playLevelUpFanfare();
      
      setTimeout(() => {
        onLevelUp?.(level + 1);
        setIsLevelingUp(false);
      }, 2000);
    }
  }, [displayXP, maxXP, isLevelingUp, level, onLevelUp, playLevelUpFanfare]);

  return (
    <div className="relative flex flex-col items-center space-y-4">
      {/* Niveau avec couronne */}
      <motion.div
        className="relative"
        animate={isLevelingUp ? { 
          scale: [1, 1.3, 1], 
          rotate: [0, 360, 0] 
        } : {}}
        transition={{ duration: 2 }}
      >
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg">
          Niveau {level}
        </div>
        
        {isLevelingUp && (
          <motion.div
            className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-3xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            👑
          </motion.div>
        )}
      </motion.div>

      {/* Cristal principal rotatif */}
      <motion.div
        className="relative"
        animate={{
          rotate: [0, 360],
          scale: isLevelingUp ? [1, 1.2, 1] : 1
        }}
        transition={{
          rotate: { duration: 10, repeat: Infinity, ease: "linear" },
          scale: { duration: 2 }
        }}
      >
        {/* Aura du cristal */}
        <div className="absolute inset-0 w-20 h-20 bg-purple-400 rounded-full blur-lg opacity-50 animate-pulse" />
        
        {/* Cristal 3D */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg transform rotate-45 shadow-xl">
          {/* Facettes */}
          <div className="absolute inset-2 bg-gradient-to-br from-white/40 to-transparent rounded-lg" />
          <div className="absolute top-1 left-1 w-3 h-3 bg-white/60 rounded-full blur-sm" />
          
          {/* Reflet animé */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-lg"
            animate={{ x: [-60, 60] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Cristaux satellites */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-400 rounded-full"
            animate={{
              x: [0, Math.cos(i * 60 * Math.PI / 180) * 40],
              y: [0, Math.sin(i * 60 * Math.PI / 180) * 40],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
      </motion.div>

      {/* Barre de progression liquide */}
      <div className="relative w-64 h-6 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full relative overflow-hidden"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Effet liquide ondulant */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          {/* Bulles dans le liquide */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/50 rounded-full"
              animate={{
                y: [15, -5],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              style={{ left: `${i * 30 + 10}%`, bottom: 0 }}
            />
          ))}
        </motion.div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-700">
            {Math.round(displayXP)} / {maxXP} XP
          </span>
        </div>
      </div>

      {/* XP flottant */}
      <AnimatePresence>
        {showXPGain && (
          <motion.div
            className="absolute text-xl font-bold text-yellow-500 pointer-events-none z-50"
            style={{ top: '10%', left: '60%' }}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              scale: [0.5, 1.2, 1.2, 0.8], 
              y: [-30, -60, -80, -100] 
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 2 }}
          >
            +{showXPGain} XP ✨
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// 🎯 APP PRINCIPALE DIAMANT PREMIUM
// =============================================================================
const DiamondCPCE2Interface = () => {
  const [currentView, setCurrentView] = useState('home');
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  const [mascotEmotion, setMascotEmotion] = useState<'idle' | 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sleepy'>('happy');
  const [mascotMessage, setMascotMessage] = useState('');
  const [showParticles, setShowParticles] = useState(false);
  const [particleType, setParticleType] = useState<'success' | 'levelup' | 'magic'>('magic');
  
  const [studentData, setStudentData] = useState({
    prenom: 'Emma',
    niveau: 'CE1',
    stars: 47,
    hearts: 3,
    streak: 5,
    currentXP: 75,
    maxXP: 100,
    level: 3
  });

  const { 
    playMagicalChord, 
    playSparkleSound, 
    playButtonClick, 
    playErrorSound,
    soundEnabled, 
    setSoundEnabled 
  } = useMagicalSounds();

  // Matières avec animations
  const subjects = [
    {
      id: 'mathematiques',
      name: 'Mathématiques',
      emoji: '🔢',
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-500/50',
      description: 'Compter, additionner, géométrie',
      exercises: [
        {
          id: 1,
          type: 'CALCUL',
          question: 'Combien font 5 + 3 ?',
          operation: '5 + 3 = ?',
          bonneReponse: 8,
          choix: [6, 7, 8, 9],
          xp: 15
        },
        {
          id: 2,
          type: 'MENTAL_MATH',
          difficulty: 3, // GOOD level
          xp: 20
        },
        {
          id: 3,
          type: 'DRAG_DROP',
          question: 'Classe les nombres par ordre croissant',
          items: [
            { id: '1', content: '3', category: 'small' },
            { id: '2', content: '7', category: 'GOOD' },
            { id: '3', content: '1', category: 'small' },
            { id: '4', content: '9', category: 'large' }
          ],
          zones: [
            { id: 'zone1', label: 'Petits nombres', accepts: ['small'] },
            { id: 'zone2', label: 'Nombres moyens', accepts: ['GOOD'] },
            { id: 'zone3', label: 'Grands nombres', accepts: ['large'] }
          ],
          xp: 25
        }
      ]
    },
    {
      id: 'francais',
      name: 'Français',
      emoji: '📚',
      gradient: 'from-green-400 via-green-500 to-green-600',
      shadowColor: 'shadow-green-500/50',
      description: 'Lettres, mots, lecture',
      exercises: [
        {
          id: 4,
          type: 'QCM',
          question: 'Quel mot commence par "B" ?',
          choix: ['Pomme', 'Banane', 'Orange', 'Cerise'],
          bonneReponse: 'Banane',
          xp: 12
        },
        {
          id: 5,
          type: 'DRAG_DROP',
          question: 'Classe les mots par catégorie',
          items: [
            { id: '1', content: 'Chat', category: 'animal' },
            { id: '2', content: 'Pomme', category: 'fruit' },
            { id: '3', content: 'Chien', category: 'animal' },
            { id: '4', content: 'Banane', category: 'fruit' }
          ],
          zones: [
            { id: 'zone1', label: 'Animaux', accepts: ['animal'] },
            { id: 'zone2', label: 'Fruits', accepts: ['fruit'] }
          ],
          xp: 18
        }
      ]
    },
    {
      id: 'sciences',
      name: 'Sciences',
      emoji: '🔬',
      gradient: 'from-purple-400 via-purple-500 to-purple-600',
      shadowColor: 'shadow-purple-500/50',
      description: 'Animaux, plantes, corps humain',
      exercises: [
        {
          id: 6,
          type: 'DRAG_DROP',
          question: 'Classe les animaux par habitat',
          items: [
            { id: '1', content: 'Poisson', category: 'eau' },
            { id: '2', content: 'Oiseau', category: 'air' },
            { id: '3', content: 'Lion', category: 'terre' },
            { id: '4', content: 'Dauphin', category: 'eau' }
          ],
          zones: [
            { id: 'zone1', label: 'Dans l\'eau', accepts: ['eau'] },
            { id: 'zone2', label: 'Dans l\'air', accepts: ['air'] },
            { id: 'zone3', label: 'Sur terre', accepts: ['terre'] }
          ],
          xp: 20
        }
      ]
    },
    {
      id: 'geographie',
      name: 'Géographie',
      emoji: '🌍',
      gradient: 'from-orange-400 via-orange-500 to-orange-600',
      shadowColor: 'shadow-orange-500/50',
      description: 'Pays, villes, cartes',
      exercises: [
        {
          id: 7,
          type: 'QCM',
          question: 'Quelle est la capitale de la France ?',
          choix: ['Londres', 'Paris', 'Berlin', 'Madrid'],
          bonneReponse: 'Paris',
          xp: 15
        }
      ]
    }
  ];

  const handleSubjectClick = (subject: any) => {
    playButtonClick();
    setMascotEmotion('thinking');
    setMascotMessage('C\'est parti pour une nouvelle aventure !');
    
    if (subject.exercises.length > 0) {
      setCurrentView('exercise');
      setCurrentExercise(subject.exercises[0]);
    } else {
      setMascotEmotion('sleepy');
      setMascotMessage('Cette matière arrive bientôt ! 🚧');
      setShowParticles(true);
      setParticleType('magic');
      setTimeout(() => setShowParticles(false), 2000);
    }
  };

  const handleAnswerSubmit = (answer: any, isCorrect: boolean) => {
    if (isCorrect) {
      setMascotEmotion('celebrating');
      setMascotMessage('BRAVO ! Tu as réussi ! 🎉');
      setShowParticles(true);
      setParticleType('success');
      playSparkleSound();
      
      // Gain XP
      setStudentData(prev => ({
        ...prev,
        currentXP: Math.min(prev.currentXP + 15, prev.maxXP),
        stars: prev.stars + 1
      }));
      
      setTimeout(() => {
        setShowParticles(false);
        setCurrentView('home');
        setMascotEmotion('happy');
      }, 2000);
    } else {
      setMascotEmotion('thinking');
      setMascotMessage('Essaie encore, tu vas y arriver ! 💪');
      playErrorSound();
    }
  };

  const handleLevelUp = (newLevel: number) => {
    setStudentData(prev => ({
      ...prev,
      level: newLevel,
      maxXP: prev.maxXP + 20
    }));
    setMascotEmotion('excited');
    setMascotMessage('NIVEAU SUPÉRIEUR ! 🎉');
  };

  const handleMascotInteraction = () => {
    playMagicalChord();
    setShowParticles(true);
    setParticleType('magic');
    setTimeout(() => setShowParticles(false), 1000);
  };

  // Rendu de l'écran d'accueil
  const renderHome = () => (
    <div className="min-h-screen p-6">
      {/* Header avec stats */}
      <motion.div 
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center space-x-4">
          <motion.div 
            className="text-4xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🌟
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bonjour {studentData.prenom} !</h1>
            <p className="text-gray-600">Niveau {studentData.niveau}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white/80 rounded-full px-4 py-2">
            <Star className="w-6 h-6 text-yellow-500 mr-2" />
            <span className="font-bold text-gray-800">{studentData.stars}</span>
          </div>
          <div className="flex items-center bg-white/80 rounded-full px-4 py-2">
            <Heart className="w-6 h-6 text-red-500 mr-2" />
            <span className="font-bold text-gray-800">{studentData.hearts}</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-6 h-6 text-green-500" />
            ) : (
              <VolumeX className="w-6 h-6 text-gray-400" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Système XP Avancé */}
      <motion.div
        className="mb-8 flex justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <NextLevelXPSystem
          currentXP={studentData.currentXP}
          maxXP={studentData.maxXP}
          level={studentData.level}
          xpGained={15}
          bonusMultiplier={studentData.streak > 3 ? 2 : 1}
          streakActive={studentData.streak > 3}
          recentAchievements={['Premier exercice réussi!', 'Série de 5!']}
          onLevelUp={handleLevelUp}
          onMilestone={(milestone) => {
            console.log(`Milestone reached: ${milestone}%`);
            setMascotEmotion('excited');
            setMascotMessage(`Progression: ${milestone}% !`);
          }}
          size="large"
          theme="magic"
          enablePhysics={true}
          interactive={true}
        />
      </motion.div>

      {/* Matières */}
      <motion.div 
        className="grid grid-cols-2 gap-6 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {subjects.map((subject, index) => (
          <motion.button
            key={subject.id}
            onClick={() => handleSubjectClick(subject)}
            className={`
              bg-gradient-to-br ${subject.gradient} p-8 rounded-3xl shadow-xl border-4 border-white/50
              hover:shadow-2xl transform hover:scale-105 transition-all duration-300
              ${subject.shadowColor}
            `}
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <div className="text-center text-white">
              <div className="text-6xl mb-4 animate-float">{subject.emoji}</div>
              <h3 className="text-xl font-bold mb-2">{subject.name}</h3>
              <p className="text-sm opacity-90">{subject.description}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );

  // Rendu de l'exercice
  const renderExercise = () => {
    if (!currentExercise) return null;

    return (
      <div className="min-h-screen p-6">
        {/* Header avec retour */}
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => {
              setCurrentView('home');
              setMascotEmotion('happy');
            }}
            className="btn-magical"
          >
            <Home className="w-5 h-5 mr-2" />
            Accueil
          </button>
          
          <h2 className="text-2xl font-bold text-gray-800">Exercice</h2>
          
          <div className="flex items-center space-x-4">
            <Star className="w-6 h-6 text-yellow-500" />
            <span className="font-bold">{studentData.stars}</span>
          </div>
        </motion.div>

        {/* Contenu de l'exercice */}
        <motion.div
          className="card-magical max-w-2xl mx-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-xl font-bold text-center mb-6">{currentExercise.question}</h3>
          
          {currentExercise.type === 'CALCUL' && (
            <div className="text-center">
              <div className="text-4xl font-bold mb-6">{currentExercise.operation}</div>
              <div className="grid grid-cols-2 gap-4">
                {currentExercise.choix.map((choice: number, index: number) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSubmit(choice, choice === currentExercise.bonneReponse)}
                    className="btn-magical text-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    {choice}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          
          {currentExercise.type === 'QCM' && (
            <div className="space-y-4">
              {currentExercise.choix.map((choice: string, index: number) => (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerSubmit(choice, choice === currentExercise.bonneReponse)}
                  className="w-full btn-magical text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  {String.fromCharCode(65 + index)}. {choice}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-magic-sky/30 via-magic-ocean/20 to-magic-forest/30">
      {/* Particules */}
      <ParticleEngine
        isActive={showParticles}
        intensity={4}
        type={particleType}
        position={{ x: 50, y: 50 }}
      />

      {/* Mascotte */}
      <MascottePremium
        emotion={mascotEmotion}
        message={mascotMessage}
        onInteraction={handleMascotInteraction}
      />

      {/* Contenu principal */}
      <AnimatePresence mode="wait">
        {currentView === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.5 }}
          >
            {renderHome()}
          </motion.div>
        )}
        
        {currentView === 'exercise' && (
          <motion.div
            key="exercise"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            {renderExercise()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return <DiamondCPCE2Interface />;
}

export default App;
