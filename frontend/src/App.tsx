import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FrenchPhonicsGame } from './components/games/FrenchPhonicsGame';
import FrenchMathsGame from './components/games/FrenchMathsGame';
import './App.css';

function App() {
  const [currentGame, setCurrentGame] = useState<'menu' | 'phonics' | 'maths'>('menu');

  const games = [
    {
      id: 'phonics',
      title: '🇫🇷 Phonétique Magique',
      description: 'Apprends les sons et assemble les mots',
      color: 'from-blue-500 to-purple-600',
      emoji: '🔤'
    },
    {
      id: 'maths',
      title: '🧮 Nombres Magiques',
      description: 'Découvre les secrets des mathématiques',
      color: 'from-green-500 to-teal-600',
      emoji: '✨'
    }
  ];

  const renderMenu = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl font-bold text-white mb-4">
            👑 RevEd Kids
          </h1>
          <p className="text-xl text-blue-200 mb-2">
            L'Apprentissage Magique pour les Enfants
          </p>
          <p className="text-lg text-gray-300">
            Choisis ton aventure éducative
          </p>
        </motion.div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              className="relative group cursor-pointer"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentGame(game.id as 'phonics' | 'maths')}
            >
              <div className={`
                bg-gradient-to-br ${game.color}
                rounded-3xl p-8 text-white text-center
                shadow-2xl border-2 border-white/20
                hover:border-white/40 transition-all duration-300
                group-hover:shadow-3xl
              `}>
                <div className="text-6xl mb-4">{game.emoji}</div>
                <h2 className="text-3xl font-bold mb-3">{game.title}</h2>
                <p className="text-lg opacity-90">{game.description}</p>
                
                {/* Hover effect */}
                <motion.div
                  className="absolute inset-0 bg-white/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-400 text-sm">
            ✨ Apprentissage Magique • 🎮 Jeux Interactifs • 🏆 Progression
          </p>
        </motion.div>
      </div>
    </div>
  );

  const renderBackButton = () => (
    <motion.button
      onClick={() => setCurrentGame('menu')}
      className="fixed top-6 left-6 z-50 bg-white/20 backdrop-blur-lg text-white px-4 py-2 rounded-2xl font-bold hover:bg-white/30 transition-colors"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      ⬅️ Retour au Menu
    </motion.button>
  );

  return (
    <div className="App">
      {currentGame === 'menu' && renderMenu()}
      {currentGame === 'phonics' && (
        <>
          {renderBackButton()}
          <FrenchPhonicsGame />
        </>
      )}
      {currentGame === 'maths' && (
        <>
          {renderBackButton()}
          <FrenchMathsGame />
        </>
      )}
    </div>
  );
}

export default App;
