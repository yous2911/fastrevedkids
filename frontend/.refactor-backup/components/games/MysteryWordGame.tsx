import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { wahooEngine } from '../../services/WahooEngine';

// Types pour le jeu du Mot Mystère
interface MysteryWordData {
  id: number;
  word: string;
  category: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
  image?: string;
  theme: 'animals' | 'objects' | 'food' | 'nature';
}

interface LetterState {
  letter: string;
  revealed: boolean;
  position: number;
}

interface GameState {
  currentWord: MysteryWordData;
  letters: LetterState[];
  guessedLetters: string[];
  wrongGuesses: string[];
  maxWrongGuesses: number;
  gameStatus: 'playing' | 'won' | 'lost';
  score: number;
  hintsUsed: number;
}

// Base de données des mots mystères
const MYSTERY_WORDS: MysteryWordData[] = [
  {
    id: 1,
    word: "PAPILLON",
    category: "Animaux",
    hint: "Il vole de fleur en fleur avec ses ailes colorées",
    difficulty: "easy",
    theme: "animals"
  },
  {
    id: 2,
    word: "ORDINATEUR",
    category: "Objets",
    hint: "Tu l'utilises pour jouer et apprendre",
    difficulty: "medium",
    theme: "objects"
  },
  {
    id: 3,
    word: "PHOTOGRAPHIE",
    category: "Objets",
    hint: "Image capturée avec un appareil",
    difficulty: "hard",
    theme: "objects"
  },
  {
    id: 4,
    word: "CHOCOLAT",
    category: "Nourriture",
    hint: "Douceur brune que les enfants adorent",
    difficulty: "easy",
    theme: "food"
  }
];

// Composant pour une lettre du mot
const LetterTile = ({ letter, revealed, position }: LetterState) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: position * 0.1 }}
    className={`w-12 h-12 m-1 border-2 rounded-lg flex items-center justify-center text-xl font-bold ${
      revealed 
        ? 'bg-green-400 border-green-600 text-white shadow-lg' 
        : 'bg-gray-200 border-gray-400 text-transparent'
    }`}
  >
    <motion.span
      initial={{ scale: 0, rotate: -180 }}
      animate={{ 
        scale: revealed ? [0, 1.3, 1] : 0,
        rotate: revealed ? 0 : -180
      }}
      transition={{ duration: 0.6, ease: "backOut" }}
    >
      {letter}
    </motion.span>
  </motion.div>
);

// Clavier virtuel
const VirtualKeyboard = ({ 
  onLetterClick, 
  guessedLetters, 
  wrongGuesses 
}: {
  onLetterClick: (letter: string) => void;
  guessedLetters: string[];
  wrongGuesses: string[];
}) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  return (
    <div className="grid grid-cols-6 md:grid-cols-9 gap-2 max-w-2xl mx-auto">
      {alphabet.map((letter) => {
        const isGuessed = guessedLetters.includes(letter);
        const isWrong = wrongGuesses.includes(letter);
        
        return (
          <motion.button
            key={letter}
            whileHover={{ scale: isGuessed ? 1 : 1.1 }}
            whileTap={{ scale: isGuessed ? 1 : 0.9 }}
            onClick={() => !isGuessed && onLetterClick(letter)}
            disabled={isGuessed}
            className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
              isWrong 
                ? 'bg-red-400 text-white border-red-600' 
                : isGuessed 
                  ? 'bg-green-400 text-white border-green-600' 
                  : 'bg-blue-400 hover:bg-blue-500 text-white border-blue-600'
            } ${isGuessed ? 'cursor-not-allowed' : 'cursor-pointer'} border-2`}
          >
            {letter}
          </motion.button>
        );
      })}
    </div>
  );
};

// Indicateur visuel des erreurs (style pendu stylisé)
const MistakeIndicator = ({ wrongGuesses, maxWrong }: { wrongGuesses: number, maxWrong: number }) => {
  const mistakeElements = ['🌱', '🌿', '🍃', '🌺', '🌸', '💐'];
  
  return (
    <div className="flex justify-center items-center bg-gradient-to-r from-pink-100 to-purple-100 p-4 rounded-xl">
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-2">Jardin Magique</div>
        <div className="flex gap-2">
          {Array.from({ length: maxWrong }, (_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xl ${
                i < wrongGuesses 
                  ? 'bg-red-200 border-2 border-red-400' 
                  : 'bg-green-200 border-2 border-green-400'
              }`}
            >
              {i < wrongGuesses ? '💔' : mistakeElements[i] || '🌟'}
            </motion.div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {maxWrong - wrongGuesses} essais restants
        </div>
      </div>
    </div>
  );
};

// Animation de victoire
const VictoryAnimation = ({ word, score }: { word: string, score: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="fixed inset-0 bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 flex items-center justify-center z-50"
  >
    <motion.div
      initial={{ y: 50 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="text-center text-white"
    >
      {/* Explosion de confettis */}
      {Array.from({length: 20}, (_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: [0, (Math.random() - 0.5) * 400],
            y: [0, (Math.random() - 0.5) * 400],
            rotate: [0, Math.random() * 360]
          }}
          transition={{ duration: 2, delay: i * 0.1 }}
          className="absolute text-2xl"
        >
          {['🎉', '🎊', '⭐', '✨', '🌟'][Math.floor(Math.random() * 5)]}
        </motion.div>
      ))}
      
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ delay: 0.5, type: "spring" }}
        className="text-6xl mb-4"
      >
        🎉
      </motion.div>
      
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-3xl font-bold mb-2"
      >
        BRAVO !
      </motion.h2>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-xl mb-4"
      >
        Tu as trouvé le mot : <strong>{word}</strong>
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-lg"
      >
        Score : <strong>{score}</strong> points
      </motion.div>
    </motion.div>
  </motion.div>
);

// Composant principal du jeu
const MysteryWordGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentWord: MYSTERY_WORDS[0],
    letters: [],
    guessedLetters: [],
    wrongGuesses: [],
    maxWrongGuesses: 6,
    gameStatus: 'playing',
    score: 0,
    hintsUsed: 0
  });

  const [showHint, setShowHint] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  // Initialize game when component mounts
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const randomWord = MYSTERY_WORDS[Math.floor(Math.random() * MYSTERY_WORDS.length)];
    const letters = randomWord.word.split('').map((letter, index) => ({
      letter,
      revealed: false,
      position: index
    }));

    setGameState({
      currentWord: randomWord,
      letters,
      guessedLetters: [],
      wrongGuesses: [],
      maxWrongGuesses: 6,
      gameStatus: 'playing',
      score: 0,
      hintsUsed: 0
    });
    setShowHint(false);
    setShowVictory(false);
  };

  const handleLetterGuess = (letter: string) => {
    if (gameState.gameStatus !== 'playing') return;

    const newGuessedLetters = [...gameState.guessedLetters, letter];
    const isCorrect = gameState.currentWord.word.includes(letter);
    
    let newWrongGuesses = gameState.wrongGuesses;
    let newScore = gameState.score;
    
    if (isCorrect) {
      // Correct guess - reveal letters and add points
      const newLetters = gameState.letters.map(l => ({
        ...l,
        revealed: l.letter === letter ? true : l.revealed
      }));
      
      newScore += 10;
      
      // Check if word is complete
      const isWordComplete = newLetters.every(l => l.revealed);
      
      if (isWordComplete) {
        // Word completed - trigger victory
        const finalScore = newScore + (gameState.maxWrongGuesses - gameState.wrongGuesses.length) * 5;
        
        // Integrate with WahooEngine
        const wahooFeedback = wahooEngine.evaluateResponse(true, 2.0);
        
        // Dispatch achievement event
        window.dispatchEvent(new CustomEvent('wahoo-achievement', {
          detail: {
            type: 'mystery_word_completed',
            word: gameState.currentWord.word,
            difficulty: gameState.currentWord.difficulty,
            score: finalScore,
            wahooIntensity: wahooFeedback.intensity
          }
        }));

        setGameState(prev => ({
          ...prev,
          gameStatus: 'won',
          score: finalScore
        }));
        
        setShowVictory(true);
        return;
      }
      
      setGameState(prev => ({
        ...prev,
        letters: newLetters,
        guessedLetters: newGuessedLetters,
        score: newScore
      }));
    } else {
      // Wrong guess
      newWrongGuesses = [...gameState.wrongGuesses, letter];
      newScore = Math.max(0, gameState.score - 5);
      
      // Check if game over
      if (newWrongGuesses.length >= gameState.maxWrongGuesses) {
        // Game lost - trigger loss event
        window.dispatchEvent(new CustomEvent('wahoo-achievement', {
          detail: {
            type: 'mystery_word_failed',
            word: gameState.currentWord.word,
            difficulty: gameState.currentWord.difficulty
          }
        }));

        setGameState(prev => ({
          ...prev,
          gameStatus: 'lost',
          wrongGuesses: newWrongGuesses,
          score: newScore
        }));
        return;
      }
      
      setGameState(prev => ({
        ...prev,
        guessedLetters: newGuessedLetters,
        wrongGuesses: newWrongGuesses,
        score: newScore
      }));
    }
  };

  const useHint = () => {
    if (gameState.hintsUsed >= 2) return;
    
    const unrevealedLetters = gameState.letters.filter(l => !l.revealed);
    if (unrevealedLetters.length === 0) return;
    
    const randomLetter = unrevealedLetters[Math.floor(Math.random() * unrevealedLetters.length)];
    
    setGameState(prev => ({
      ...prev,
      letters: prev.letters.map(l => ({
        ...l,
        revealed: l.letter === randomLetter.letter ? true : l.revealed
      })),
      hintsUsed: prev.hintsUsed + 1,
      score: Math.max(0, prev.score - 10)
    }));
  };

  const nextWord = () => {
    initializeGame();
  };

  const resetGame = () => {
    initializeGame();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🔍 Mot Mystère</h1>
          <p className="text-xl text-gray-600">Découvre le mot caché lettre par lettre</p>
        </motion.div>

        {/* Game Info */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{gameState.score}</div>
              <div className="text-sm text-gray-600">Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {gameState.currentWord.category}
              </div>
              <div className="text-sm text-gray-600">Catégorie</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {gameState.currentWord.difficulty.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600">Difficulté</div>
            </div>
          </div>

          {/* Hint */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600">💡</span>
              <span className="font-semibold text-blue-800">Indice :</span>
            </div>
            <p className="text-blue-700">{gameState.currentWord.hint}</p>
          </div>
        </div>

        {/* Word Display */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-6">
          <div className="flex justify-center mb-8">
            {gameState.letters.map((letter, index) => (
              <LetterTile
                key={index}
                letter={letter.letter}
                revealed={letter.revealed}
                position={letter.position}
              />
            ))}
          </div>

          {/* Mistake Indicator */}
          <MistakeIndicator 
            wrongGuesses={gameState.wrongGuesses.length} 
            maxWrong={gameState.maxWrongGuesses} 
          />
        </div>

        {/* Virtual Keyboard */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <VirtualKeyboard
            onLetterClick={handleLetterGuess}
            guessedLetters={gameState.guessedLetters}
            wrongGuesses={gameState.wrongGuesses}
          />
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={useHint}
            disabled={gameState.hintsUsed >= 2 || gameState.gameStatus !== 'playing'}
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${
              gameState.hintsUsed >= 2 || gameState.gameStatus !== 'playing'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            💡 Indice ({2 - gameState.hintsUsed} restants)
          </motion.button>

          {gameState.gameStatus === 'won' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextWord}
              className="px-6 py-3 rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white transition-colors"
            >
              🎯 Mot Suivant
            </motion.button>
          )}

          {gameState.gameStatus === 'lost' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="px-6 py-3 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              🔄 Recommencer
            </motion.button>
          )}
        </div>

        {/* Game Over Messages */}
        <AnimatePresence>
          {gameState.gameStatus === 'lost' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
            >
              <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4">
                <div className="text-6xl mb-4">😔</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Dommage !</h2>
                <p className="text-gray-600 mb-4">
                  Le mot était : <strong>{gameState.currentWord.word}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Score final : {gameState.score} points
                </p>
                <button
                  onClick={resetGame}
                  className="px-6 py-3 rounded-xl font-bold bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Victory Animation */}
        <AnimatePresence>
          {showVictory && (
            <VictoryAnimation 
              word={gameState.currentWord.word} 
              score={gameState.score} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MysteryWordGame; 