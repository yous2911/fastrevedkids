import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MysteryWordGame as MysteryWordGameType } from '../../types/wahoo.types';

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
        transition={{ delay: 0.5, duration: 1 }}
        className="text-8xl mb-6"
      >
        🕵️‍♂️
      </motion.div>
      
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="text-6xl font-bold mb-4"
      >
        MYSTÈRE RÉSOLU!
      </motion.h1>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-3xl mb-6"
      >
        Le mot était: <span className="font-bold text-yellow-300">{word}</span>
      </motion.div>
      
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: "spring" }}
        className="bg-white bg-opacity-20 p-6 rounded-2xl"
      >
        <div className="text-4xl font-bold mb-2">{score} Points</div>
        <div className="text-lg">Excellent travail de détective!</div>
      </motion.div>
    </motion.div>
  </motion.div>
);

// Composant principal du jeu
const MysteryWordGame = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialWord = MYSTERY_WORDS[0];
    return {
      currentWord: initialWord,
      letters: initialWord.word.split('').map((letter, index) => ({
        letter,
        revealed: false,
        position: index
      })),
      guessedLetters: [],
      wrongGuesses: [],
      maxWrongGuesses: 6,
      gameStatus: 'playing',
      score: 0,
      hintsUsed: 0
    };
  });

  const [showHint, setShowHint] = useState(false);

  // Gérer la sélection d'une lettre
  const handleLetterGuess = (letter: string) => {
    if (gameState.gameStatus !== 'playing' || gameState.guessedLetters.includes(letter)) {
      return;
    }

    const newGuessedLetters = [...gameState.guessedLetters, letter];
    const isLetterInWord = gameState.currentWord.word.includes(letter);
    
    let newWrongGuesses = gameState.wrongGuesses;
    let newLetters = gameState.letters;
    let newScore = gameState.score;

    if (isLetterInWord) {
      // Révéler toutes les occurrences de cette lettre
      newLetters = gameState.letters.map(letterState => 
        letterState.letter === letter 
          ? { ...letterState, revealed: true }
          : letterState
      );
      newScore += 10; // Points pour lettre correcte
    } else {
      newWrongGuesses = [...gameState.wrongGuesses, letter];
    }

    // Vérifier les conditions de fin
    let newGameStatus: 'playing' | 'won' | 'lost' = 'playing';
    
    if (newWrongGuesses.length >= gameState.maxWrongGuesses) {
      newGameStatus = 'lost';
    } else if (newLetters.every(l => l.revealed)) {
      newGameStatus = 'won';
      newScore += 100; // Bonus de victoire
      newScore += Math.max(0, (gameState.maxWrongGuesses - newWrongGuesses.length) * 20); // Bonus performance
    }

    setGameState({
      ...gameState,
      letters: newLetters,
      guessedLetters: newGuessedLetters,
      wrongGuesses: newWrongGuesses,
      gameStatus: newGameStatus,
      score: newScore
    });
  };

  // Utiliser un indice
  const useHint = () => {
    if (gameState.hintsUsed >= 2) return;

    // Révéler une lettre non découverte
    const unrevealedLetters = gameState.letters.filter(l => !l.revealed);
    if (unrevealedLetters.length > 0) {
      const randomLetter = unrevealedLetters[Math.floor(Math.random() * unrevealedLetters.length)];
      handleLetterGuess(randomLetter.letter);
      setGameState(prev => ({
        ...prev,
        hintsUsed: prev.hintsUsed + 1,
        score: Math.max(0, prev.score - 20) // Coût de l'indice
      }));
    }
  };

  // Nouveau mot
  const nextWord = () => {
    const nextIndex = (MYSTERY_WORDS.findIndex(w => w.id === gameState.currentWord.id) + 1) % MYSTERY_WORDS.length;
    const nextWord = MYSTERY_WORDS[nextIndex];
    
    setGameState({
      currentWord: nextWord,
      letters: nextWord.word.split('').map((letter, index) => ({
        letter,
        revealed: false,
        position: index
      })),
      guessedLetters: [],
      wrongGuesses: [],
      maxWrongGuesses: 6,
      gameStatus: 'playing',
      score: gameState.score, // Conserver le score
      hintsUsed: 0
    });
    setShowHint(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">🕵️ Mot Mystère</h1>
          <p className="text-xl text-purple-200">Découvre le mot secret lettre par lettre!</p>
        </motion.div>

        {/* Statistiques */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl text-center text-white">
            <div className="text-2xl font-bold">{gameState.score}</div>
            <div className="text-sm">Points</div>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl text-center text-white">
            <div className="text-lg font-bold">{gameState.currentWord.category}</div>
            <div className="text-sm">Catégorie</div>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl text-center text-white">
            <div className="text-lg font-bold">{gameState.currentWord.difficulty}</div>
            <div className="text-sm">Difficulté</div>
          </div>
        </motion.div>

        {/* Zone de jeu principale */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl mb-6"
        >
          {/* Indicateur d'erreurs */}
          <div className="mb-6">
            <MistakeIndicator wrongGuesses={gameState.wrongGuesses.length} maxWrong={gameState.maxWrongGuesses} />
          </div>

          {/* Mot à deviner */}
          <div className="flex justify-center items-center mb-8 flex-wrap">
            {gameState.letters.map((letterState, index) => (
              <LetterTile key={index} {...letterState} />
            ))}
          </div>

          {/* Indice */}
          <div className="text-center mb-6">
            <button
              onClick={() => setShowHint(!showHint)}
              className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg font-bold mr-4 transition-colors"
            >
              💡 {showHint ? 'Cacher' : 'Montrer'} l'Indice
            </button>
            
            <button
              onClick={useHint}
              disabled={gameState.hintsUsed >= 2}
              className="bg-orange-400 hover:bg-orange-500 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-bold transition-colors"
            >
              🔍 Révéler une Lettre ({2 - gameState.hintsUsed} restants)
            </button>
          </div>

          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-blue-100 border border-blue-300 p-4 rounded-lg text-center text-blue-800 mb-6"
              >
                <div className="text-lg">💭 <strong>Indice:</strong> {gameState.currentWord.hint}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clavier virtuel */}
          <VirtualKeyboard
            onLetterClick={handleLetterGuess}
            guessedLetters={gameState.guessedLetters}
            wrongGuesses={gameState.wrongGuesses}
          />

          {/* Lettres déjà essayées */}
          {gameState.wrongGuesses.length > 0 && (
            <div className="text-center mt-6">
              <div className="text-gray-600 mb-2">Lettres incorrectes:</div>
              <div className="flex justify-center gap-2 flex-wrap">
                {gameState.wrongGuesses.map((letter, index) => (
                  <motion.span
                    key={letter}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-red-100 text-red-800 px-2 py-1 rounded font-bold"
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Bouton nouveau mot */}
        <div className="text-center">
          <button
            onClick={nextWord}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold text-lg transition-colors"
          >
            🎲 Nouveau Mystère
          </button>
        </div>
      </div>

      {/* Animation de victoire */}
      <AnimatePresence>
        {gameState.gameStatus === 'won' && (
          <VictoryAnimation word={gameState.currentWord.word} score={gameState.score} />
        )}
      </AnimatePresence>

      {/* Animation de défaite */}
      <AnimatePresence>
        {gameState.gameStatus === 'lost' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed inset-0 bg-gradient-to-br from-red-400 to-purple-600 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="text-center text-white"
            >
              <div className="text-8xl mb-6">🤔</div>
              <h1 className="text-5xl font-bold mb-4">Mystère Non Résolu!</h1>
              <div className="text-2xl mb-6">
                Le mot était: <span className="font-bold text-yellow-300">{gameState.currentWord.word}</span>
              </div>
              <button
                onClick={nextWord}
                className="bg-white text-purple-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors"
              >
                🎯 Nouveau Défi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MysteryWordGame; 