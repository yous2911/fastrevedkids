import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Interface types for better TypeScript support
interface GameResult {
  type: string;
  score?: number;
  level?: number;
  cycles?: number;
}

interface BubblePopGameProps {
  onComplete: (result: GameResult) => void;
}

interface SparkyDanceGameProps {
  onComplete: (result: GameResult) => void;
}

interface MagicBreathingGameProps {
  onComplete: (result: GameResult) => void;
}

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

// Mini-jeu 1 : Bulles à éclater (relaxation)
const BubblePopGame: React.FC<BubblePopGameProps> = ({ onComplete }) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  useEffect(() => {
    // Créer des bulles aléatoirement
    const interval = setInterval(() => {
      setBubbles(prev => [...prev, {
        id: Math.random(),
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        size: Math.random() * 40 + 30,
        color: ['bg-blue-300', 'bg-purple-300', 'bg-pink-300', 'bg-green-300'][Math.floor(Math.random() * 4)]
      }]);
    }, 1000);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete({ type: 'bubblePop', score });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [onComplete, score]);

  const popBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setScore(prev => prev + 1);
  };

  return (
    <div className="relative w-full h-96 bg-gradient-to-b from-sky-200 to-blue-300 rounded-xl overflow-hidden">
      <div className="absolute top-4 left-4 bg-white rounded-lg px-3 py-1 shadow">
        <span className="font-bold text-blue-600">⏰ {timeLeft}s</span>
      </div>
      <div className="absolute top-4 right-4 bg-white rounded-lg px-3 py-1 shadow">
        <span className="font-bold text-purple-600">🎈 {score}</span>
      </div>
      
      {bubbles.map(bubble => (
        <motion.div
          key={bubble.id}
          className={`absolute rounded-full ${bubble.color} cursor-pointer shadow-lg`}
          style={{ 
            left: `${bubble.x}%`, 
            top: `${bubble.y}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          exit={{ scale: 1.5, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => popBubble(bubble.id)}
        >
          <div className="w-full h-full rounded-full border-2 border-white border-opacity-30" />
        </motion.div>
      ))}
    </div>
  );
};

// Mini-jeu 2 : Sparky Dance (défoulement)
const SparkyDanceGame: React.FC<SparkyDanceGameProps> = ({ onComplete }) => {
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);
  const [showSequence, setShowSequence] = useState<boolean>(false);
  const [level, setLevel] = useState<number>(1);
  const [gameState, setGameState] = useState<'waiting' | 'showing' | 'playing' | 'success' | 'failed'>('waiting');

  const directions = [
    { id: 'up', emoji: '⬆️', color: 'bg-blue-400' },
    { id: 'down', emoji: '⬇️', color: 'bg-green-400' },
    { id: 'left', emoji: '⬅️', color: 'bg-yellow-400' },
    { id: 'right', emoji: '➡️', color: 'bg-red-400' }
  ];

  const startNewRound = useCallback(() => {
    const newMove = directions[Math.floor(Math.random() * 4)].id;
    const newSequence = [...sequence, newMove];
    setSequence(newSequence);
    setPlayerSequence([]);
    setGameState('showing');
    setShowSequence(true);

    setTimeout(() => {
      setShowSequence(false);
      setGameState('playing');
    }, newSequence.length * 800 + 1000);
  }, [sequence]);

  useEffect(() => {
    if (gameState === 'waiting') {
      startNewRound();
    }
  }, [gameState, startNewRound]);

  const handleMove = (direction: string) => {
    if (gameState !== 'playing') return;

    const newPlayerSequence = [...playerSequence, direction];
    setPlayerSequence(newPlayerSequence);

    // Vérifier si correct
    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      setGameState('failed');
      setTimeout(() => onComplete({ type: 'sparkyDance', level: level - 1 }), 1500);
      return;
    }

    // Si séquence complète
    if (newPlayerSequence.length === sequence.length) {
      setGameState('success');
      if (level >= 5) {
        setTimeout(() => onComplete({ type: 'sparkyDance', level }), 1500);
      } else {
        setTimeout(() => {
          setLevel(prev => prev + 1);
          setGameState('waiting');
        }, 1000);
      }
    }
  };

  return (
    <div className="w-full h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl p-6 text-center">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white">🐾 Sparky Dance!</h3>
        <p className="text-purple-100">Niveau {level}/5 - Répète la séquence!</p>
      </div>

      {/* Sparky Character */}
      <motion.div 
        className="text-6xl mb-6"
        animate={{
          scale: gameState === 'success' ? [1, 1.3, 1] : gameState === 'failed' ? [1, 0.8, 1] : 1,
          rotate: showSequence ? [-10, 10, -10, 0] : 0
        }}
        transition={{ duration: 0.5 }}
      >
        🐕‍🦺
      </motion.div>

      {/* Sequence Display */}
      {showSequence && (
        <div className="flex justify-center space-x-2 mb-6">
          {sequence.map((move, index) => {
            const dir = directions.find(d => d.id === move);
            if (!dir) return null;
            return (
              <motion.div
                key={index}
                className={`w-12 h-12 ${dir.color} rounded-lg flex items-center justify-center text-2xl`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.8 }}
              >
                {dir.emoji}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Direction Buttons */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        <div></div>
        <motion.button
          onClick={() => handleMove('up')}
          className="w-16 h-16 bg-blue-400 rounded-lg text-3xl shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={gameState !== 'playing'}
        >
          ⬆️
        </motion.button>
        <div></div>
        
        <motion.button
          onClick={() => handleMove('left')}
          className="w-16 h-16 bg-yellow-400 rounded-lg text-3xl shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={gameState !== 'playing'}
        >
          ⬅️
        </motion.button>
        <div></div>
        <motion.button
          onClick={() => handleMove('right')}
          className="w-16 h-16 bg-red-400 rounded-lg text-3xl shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={gameState !== 'playing'}
        >
          ➡️
        </motion.button>
        
        <div></div>
        <motion.button
          onClick={() => handleMove('down')}
          className="w-16 h-16 bg-green-400 rounded-lg text-3xl shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={gameState !== 'playing'}
        >
          ⬇️
        </motion.button>
        <div></div>
      </div>

      {gameState === 'success' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-xl font-bold text-white"
        >
          🎉 Parfait! Niveau suivant...
        </motion.div>
      )}
    </div>
  );
};

// Mini-jeu 3 : Respiration magique (retour au calme)
const MagicBreathingGame: React.FC<MagicBreathingGameProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycle, setCycle] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          switch (phase) {
            case 'inhale':
              setPhase('hold');
              return 2;
            case 'hold':
              setPhase('exhale');
              return 4;
            case 'exhale':
              setCycle(prevCycle => {
                if (prevCycle >= 4) {
                  onComplete({ type: 'breathing', cycles: 5 });
                  return prevCycle;
                }
                setPhase('inhale');
                return prevCycle + 1;
              });
              return 4;
            default:
              return prev;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, onComplete]);

  const getInstruction = (): string => {
    switch (phase) {
      case 'inhale': return '🌬️ Inspire profondément...';
      case 'hold': return '⏸️ Retiens ton souffle...';
      case 'exhale': return '💨 Expire lentement...';
      default: return '';
    }
  };

  const getColor = (): string => {
    switch (phase) {
      case 'inhale': return 'from-blue-300 to-cyan-400';
      case 'hold': return 'from-purple-300 to-purple-400';
      case 'exhale': return 'from-green-300 to-emerald-400';
      default: return 'from-blue-300 to-cyan-400';
    }
  };

  return (
    <div className={`w-full h-96 bg-gradient-to-br ${getColor()} rounded-xl flex flex-col items-center justify-center text-center p-6`}>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">✨ Respiration Magique</h3>
        <p className="text-white opacity-90">Cycle {cycle + 1}/5</p>
      </div>

      {/* Breathing Circle */}
      <motion.div
        className="w-32 h-32 rounded-full bg-white bg-opacity-30 mb-6 flex items-center justify-center"
        animate={{
          scale: phase === 'inhale' ? 1.5 : phase === 'exhale' ? 0.8 : 1.2
        }}
        transition={{ 
          duration: timeLeft,
          ease: "easeInOut"
        }}
      >
        <motion.div
          className="w-16 h-16 rounded-full bg-white bg-opacity-50"
          animate={{
            scale: phase === 'inhale' ? 1.2 : phase === 'exhale' ? 0.6 : 1
          }}
          transition={{ 
            duration: timeLeft,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      <div className="text-xl font-bold text-white mb-2">
        {getInstruction()}
      </div>
      
      <div className="text-lg text-white opacity-80">
        {timeLeft} secondes
      </div>
    </div>
  );
};

interface Game {
  id: string;
  title: string;
  description: string;
  component: React.FC<{ onComplete: (result: GameResult) => void }>;
  type: 'relaxation' | 'movement' | 'calm';
}

interface CompletedGame {
  game: string;
  result: GameResult;
  timestamp: Date;
}

// Composant principal avec sélection
const MiniGamesDemo: React.FC = () => {
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [completed, setCompleted] = useState<CompletedGame[]>([]);

  const games: Game[] = [
    {
      id: 'bubblePop',
      title: '🎈 Éclate les Bulles',
      description: 'Jeu relaxant pour décompresser',
      component: BubblePopGame,
      type: 'relaxation'
    },
    {
      id: 'sparkyDance',
      title: '🐾 Sparky Dance',
      description: 'Jeu de mémoire et mouvement',
      component: SparkyDanceGame,
      type: 'movement'
    },
    {
      id: 'breathing',
      title: '✨ Respiration Magique',
      description: 'Retour au calme avec respiration',
      component: MagicBreathingGame,
      type: 'calm'
    }
  ];

  const handleGameComplete = (result: GameResult) => {
    if (currentGame) {
      setCompleted(prev => [...prev, { game: currentGame, result, timestamp: new Date() }]);
      setCurrentGame(null);
    }
  };

  if (currentGame) {
    const game = games.find(g => g.id === currentGame);
    if (!game) return null;
    const GameComponent = game.component;
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">{game.title}</h2>
          <button
            onClick={() => setCurrentGame(null)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Retour
          </button>
        </div>
        <GameComponent onComplete={handleGameComplete} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🎪 Mini-Jeux de Pause</h1>
        <p className="text-gray-600">Petites pauses ludiques pour maintenir l'attention et réduire la fatigue</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {games.map(game => (
          <motion.div
            key={game.id}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer border-2 border-transparent hover:border-purple-300 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentGame(game.id)}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-2">{game.title}</h3>
            <p className="text-gray-600 mb-4">{game.description}</p>
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                game.type === 'relaxation' ? 'bg-blue-100 text-blue-800' :
                game.type === 'movement' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {game.type === 'relaxation' ? 'Relaxation' :
                 game.type === 'movement' ? 'Mouvement' : 'Calme'}
              </span>
              <span className="text-purple-600 font-bold">Jouer →</span>
            </div>
          </motion.div>
        ))}
      </div>

      {completed.length > 0 && (
        <div className="bg-green-50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-green-800 mb-4">🏆 Jeux Complétés</h3>
          <div className="space-y-2">
            {completed.map((comp, index) => (
              <div key={index} className="flex justify-between items-center bg-white rounded-lg p-3">
                <span className="font-medium">{games.find(g => g.id === comp.game)?.title}</span>
                <span className="text-green-600 text-sm">
                  ✅ {comp.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniGamesDemo; 