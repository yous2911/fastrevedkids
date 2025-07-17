import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mathsService } from '../../services/mathsService';
import type { DefiMath } from '../../types/shared';

// Stone interface
interface Stone {
  id: string;
  valeur: number;
  couleur: string;
  emoji: string;
  nom: string;
  taille: 'petit' | 'moyen' | 'grand';
}

// Stone definitions
const STONES: Stone[] = [
  { id: 'unite_1', valeur: 1, couleur: 'from-blue-300 to-blue-500', emoji: '💙', nom: 'Perle Unique', taille: 'petit' },
  { id: 'unite_2', valeur: 2, couleur: 'from-green-300 to-green-500', emoji: '💚', nom: 'Duo Emeraude', taille: 'petit' },
  { id: 'unite_3', valeur: 3, couleur: 'from-purple-300 to-purple-500', emoji: '💜', nom: 'Triple Améthyste', taille: 'moyen' },
  { id: 'unite_4', valeur: 4, couleur: 'from-red-300 to-red-500', emoji: '❤️', nom: 'Quad Rubis', taille: 'moyen' },
  { id: 'unite_5', valeur: 5, couleur: 'from-yellow-300 to-yellow-500', emoji: '💛', nom: 'Penta Topaze', taille: 'moyen' },
  { id: 'unite_6', valeur: 6, couleur: 'from-pink-300 to-pink-500', emoji: '🩷', nom: 'Hexa Rose', taille: 'grand' },
  { id: 'unite_7', valeur: 7, couleur: 'from-cyan-300 to-cyan-500', emoji: '🩵', nom: 'Septa Turquoise', taille: 'grand' },
  { id: 'unite_8', valeur: 8, couleur: 'from-orange-300 to-orange-500', emoji: '🧡', nom: 'Octo Ambre', taille: 'grand' },
  { id: 'unite_9', valeur: 9, couleur: 'from-indigo-300 to-indigo-500', emoji: '💙', nom: 'Nova Saphir', taille: 'grand' },
  { id: 'dizaine_10', valeur: 10, couleur: 'from-gradient-rainbow', emoji: '🔟', nom: 'Cristal Dragon', taille: 'grand' }
];

const FrenchMathsGame: React.FC = () => {
  const [defis, setDefis] = useState<DefiMath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showStats, setShowStats] = useState(false);
  
  // Gameplay state
  const [placedStones, setPlacedStones] = useState<Stone[]>([]);
  const [currentSum, setCurrentSum] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [showHintState, setShowHintState] = useState(false);
  const [solutionsFound, setSolutionsFound] = useState<number[][]>([]);
  
  // Player stats (to be connected to backend later)
  const [playerStats, setPlayerStats] = useState({
    totalCristaux: 50,
    totalEtoiles: 15,
    niveau: 2,
    pouvoirsMagiques: ['Assemblage Basique', 'Vision Magique'],
    defisReussis: new Set<string>(),
    streak: 0
  });

  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Get current challenge
  const currentDefi = defis[currentIndex];

  useEffect(() => {
    setLoading(true);
    mathsService.getAllDefisWithCache().then(response => {
      if (response.success && response.data) {
        setDefis(response.data);
        setError(null);
      } else {
        setError(response.error || 'Erreur inconnue lors du chargement des défis.');
      }
      setLoading(false);
    });
  }, []);

  const nextDefi = useCallback(() => {
    setCurrentIndex((prev) => (prev < defis.length - 1 ? prev + 1 : 0));
    resetChallenge();
  }, [defis.length]);

  const prevDefi = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : defis.length - 1));
    resetChallenge();
  }, [defis.length]);

  const resetChallenge = useCallback(() => {
    setPlacedStones([]);
    setCurrentSum(0);
    setIsCompleted(false);
    setFeedbackMessage('');
    setShowHintState(false);
    setSolutionsFound([]);
  }, []);

  const handleDragStart = useCallback((stone: Stone) => {
    if (!currentDefi) return;
    
    // Check if stone is already used
    const isUsed = placedStones.some(s => s.valeur === stone.valeur && s.id.includes(stone.id));
    if (isUsed) {
      setFeedbackMessage("🤔 Cette pierre est déjà utilisée !");
      return;
    }
    
    // Check if adding would exceed target
    const newSum = currentSum + stone.valeur;
    if (newSum > currentDefi.cible) {
      setFeedbackMessage(`🚫 ${newSum} c'est trop ! ${currentDefi.creature.nom} n'a besoin que de ${currentDefi.cible}`);
      return;
    }
    
    // Add stone
    const newStone = { ...stone, id: `${stone.id}-${Date.now()}` };
    setPlacedStones(prev => [...prev, newStone]);
    setCurrentSum(newSum);
    
    // Check if solution found
    if (newSum === currentDefi.cible) {
      checkSolution([...placedStones, newStone]);
    } else {
      setFeedbackMessage(`✨ ${newSum}... Continue ! Il faut ${currentDefi.cible}`);
    }
  }, [placedStones, currentSum, currentDefi]);

  const checkSolution = useCallback((stones: Stone[]) => {
    if (!currentDefi) return;
    
    const values = stones.map(s => s.valeur).sort((a, b) => a - b);
    const isValidSolution = currentDefi.solutions.some(solution => {
      const sortedSolution = solution.sort((a, b) => a - b);
      return values.length === sortedSolution.length && 
             values.every((val, index) => val === sortedSolution[index]);
    });
    
    if (isValidSolution) {
      const newSolution = [...values];
      const isNewSolution = !solutionsFound.some(sol => 
        sol.length === newSolution.length && 
        sol.every((val, index) => val === newSolution[index])
      );
      
      if (isNewSolution) {
        setSolutionsFound(prev => [...prev, newSolution]);
        setFeedbackMessage(`✨ Parfait ! ${currentDefi.creature.nom} se réveille !`);
        
        // Check if all solutions found
        if (solutionsFound.length + 1 >= currentDefi.solutions.length) {
          setIsCompleted(true);
          setPlayerStats(prev => ({
            ...prev,
            defisReussis: new Set([...prev.defisReussis, currentDefi.id]),
            totalCristaux: prev.totalCristaux + 10 * currentDefi.niveau,
            totalEtoiles: prev.totalEtoiles + currentDefi.niveau,
            streak: prev.streak + 1
          }));
        }
      } else {
        setFeedbackMessage(`👍 Bonne solution ! Tu l'avais déjà trouvée.`);
      }
    }
  }, [currentDefi, solutionsFound]);

  const removeStone = useCallback((stoneId: string) => {
    const stoneToRemove = placedStones.find(s => s.id === stoneId);
    if (stoneToRemove) {
      setPlacedStones(prev => prev.filter(s => s.id !== stoneId));
      setCurrentSum(prev => prev - stoneToRemove.valeur);
    }
  }, [placedStones]);

  const showHint = useCallback(() => {
    if (!currentDefi) return;
    setShowHintState(true);
    setFeedbackMessage(`💡 ${currentDefi.indice}`);
    setTimeout(() => setShowHintState(false), 5000);
  }, [currentDefi]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-2xl animate-pulse">Chargement des défis magiques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-red-400 text-xl font-bold">{error}</div>
      </div>
    );
  }

  if (!defis.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Aucun défi mathématique trouvé.</div>
      </div>
    );
  }

  if (!currentDefi) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Défi non trouvé.</div>
      </div>
    );
  }
  
  // Calculate stats
  const stats = {
    totalDefis: defis.length,
    defisReussis: playerStats.defisReussis.size,
    pourcentageReussite: Math.round((playerStats.defisReussis.size / defis.length) * 100),
    defisParNiveau: {
      1: defis.filter(d => d.niveau === 1).length,
      2: defis.filter(d => d.niveau === 2).length,
      3: defis.filter(d => d.niveau === 3).length,
      4: defis.filter(d => d.niveau === 4).length,
      5: defis.filter(d => d.niveau === 5).length,
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Stars */}
        {Array.from({ length: 50 }, (_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        {/* Animated Clouds */}
        {Array.from({ length: 5 }, (_, i) => (
          <motion.div
            key={`cloud-${i}`}
            className="absolute opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
            }}
            animate={{
              x: [0, 100, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          >
            ☁️
          </motion.div>
        ))}
      </div>

      {/* Header with Stats */}
      <div className="relative z-10 p-6">
        <motion.h1 
          className="text-5xl font-bold text-center text-white mb-6"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          👑 Le Royaume des Nombres Magiques
        </motion.h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 mx-auto max-w-6xl mb-6">
          {/* Player Stats */}
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-2xl font-bold">
              💎 {playerStats.totalCristaux} Cristaux
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-purple-400 text-white px-4 py-2 rounded-2xl font-bold">
              ⭐ {playerStats.totalEtoiles} Étoiles
            </div>
            <div className="bg-gradient-to-r from-green-400 to-teal-400 text-white px-4 py-2 rounded-2xl font-bold">
              🏆 Niveau {playerStats.niveau}
            </div>
            <div className="bg-gradient-to-r from-red-400 to-pink-400 text-white px-4 py-2 rounded-2xl font-bold">
              🔥 Série x{playerStats.streak}
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="bg-gradient-to-r from-gray-400 to-gray-600 text-white px-4 py-2 rounded-2xl font-bold hover:scale-105 transition-transform"
            >
              📊 Stats
            </button>
          </div>
          
          {/* Detailed Stats */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                className="bg-black/20 rounded-2xl p-4 mb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h3 className="text-white text-xl font-bold mb-3">📈 Progression Détaillée</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
                  <div className="bg-blue-500/30 rounded-lg p-3">
                    <div className="text-2xl font-bold">{stats.totalDefis}</div>
                    <div className="text-sm">Défis Totaux</div>
                  </div>
                  <div className="bg-green-500/30 rounded-lg p-3">
                    <div className="text-2xl font-bold">{stats.defisReussis}</div>
                    <div className="text-sm">Défis Réussis</div>
                  </div>
                  <div className="bg-purple-500/30 rounded-lg p-3">
                    <div className="text-2xl font-bold">{stats.pourcentageReussite}%</div>
                    <div className="text-sm">Réussite</div>
                  </div>
                  <div className="bg-orange-500/30 rounded-lg p-3">
                    <div className="text-2xl font-bold">{playerStats.pouvoirsMagiques.length}</div>
                    <div className="text-sm">Pouvoirs</div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-white font-bold mb-2">🎯 Progression par Niveau</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(stats.defisParNiveau).map(([niveau, total]) => {
                      const reussis = Array.from(playerStats.defisReussis).filter(id => 
                        defis.find(d => d.id === id)?.niveau === parseInt(niveau)
                      ).length;
                      const pourcentage = Math.round((reussis / total) * 100);
                      
                      return (
                        <div key={niveau} className="bg-white/10 rounded-lg p-2 text-center">
                          <div className="text-white font-bold">Niveau {niveau}</div>
                          <div className="text-sm text-gray-300">{reussis}/{total}</div>
                          <div className={`text-xs font-bold ${
                            pourcentage === 100 ? 'text-green-400' :
                            pourcentage >= 70 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {pourcentage}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Navigation */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={prevDefi}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold"
            >
              ⬅️ Précédent
            </button>
            
            <span className="bg-white/20 text-white px-4 py-2 rounded-lg font-bold">
              {currentIndex + 1}/{defis.length}
            </span>
            
            <button
              onClick={nextDefi}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold"
            >
              Suivant ➡️
            </button>
          </div>
        </div>
      </div>

      {/* Main Challenge Display */}
      <div className="relative z-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/15 backdrop-blur-lg rounded-3xl p-6 mb-6">
            <div className="text-center">
              {/* Magical Creature */}
              <motion.div
                className="mb-6"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="text-8xl mb-4">{currentDefi.creature.emoji}</div>
                <div className="text-3xl font-bold text-white mb-2">{currentDefi.creature.nom}</div>
                <div className="text-lg text-gray-300 mb-2">{currentDefi.creature.description}</div>
                <div className="text-sm text-purple-300 italic">Pouvoir: {currentDefi.creature.pouvoir}</div>
              </motion.div>
              
              {/* Challenge Instructions */}
              <div className="bg-blue-500/30 rounded-2xl p-4 mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">
                  🎯 Mission: Nombre {currentDefi.cible}
                </h3>
                <p className="text-lg text-blue-100 mb-2">{currentDefi.consigne}</p>
                <div className="flex justify-center gap-4 text-sm">
                  <span className={`px-3 py-1 rounded-lg font-bold ${
                    currentDefi.difficulte === 'facile' ? 'bg-green-500' :
                    currentDefi.difficulte === 'moyen' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    {currentDefi.difficulte === 'facile' ? '🟢 FACILE' :
                     currentDefi.difficulte === 'moyen' ? '🟡 MOYEN' :
                     '🔴 DIFFICILE'}
                  </span>
                  <span className="bg-purple-500 px-3 py-1 rounded-lg font-bold">
                    📚 Niveau {currentDefi.niveau}
                  </span>
                  <span className="bg-indigo-500 px-3 py-1 rounded-lg font-bold">
                    {currentDefi.type === 'decomposition' ? '🔍 DÉCOMPOSITION' :
                     currentDefi.type === 'complement' ? '🐉 COMPLÉMENT' :
                     currentDefi.type === 'addition' ? '➕ ADDITION' :
                     currentDefi.type === 'soustraction' ? '➖ SOUSTRACTION' :
                     '⚖️ COMPARAISON'}
                  </span>
                </div>
              </div>

              {/* Solutions Found */}
              {solutionsFound.length > 0 && (
                <div className="bg-green-500/30 rounded-2xl p-4 mb-4">
                  <h4 className="text-white font-bold mb-2">
                    ✅ Solutions Trouvées ({solutionsFound.length}/{currentDefi.solutions.length})
                  </h4>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {solutionsFound.map((solution, index) => (
                      <div key={index} className="bg-white/20 rounded-lg px-3 py-1 text-white font-bold">
                        {solution.join(' + ')} = {currentDefi.cible}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gameplay Zone */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Available Stones */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
              <h3 className="text-white text-xl font-bold text-center mb-4">
                💎 Pierres Magiques
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {currentDefi.pierresDisponibles.map(valeur => {
                  const stone = STONES.find(s => s.valeur === valeur) || STONES[0];
                  const isUsed = placedStones.some(s => s.valeur === valeur && s.id.includes(stone.id));
                  
                  return (
                    <motion.div
                      key={`stone-${valeur}-${Math.random()}`}
                      onClick={() => handleDragStart(stone)}
                      className={`
                        ${stone.taille === 'petit' ? 'w-12 h-12 text-sm' :
                          stone.taille === 'moyen' ? 'w-16 h-16 text-base' :
                          'w-20 h-20 text-lg'}
                        rounded-2xl bg-gradient-to-br ${stone.couleur}
                        flex items-center justify-center text-white font-bold
                        cursor-pointer shadow-lg border-2 border-white/30
                        hover:scale-110 transition-transform duration-200
                        ${isUsed ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      whileHover={!isUsed ? { scale: 1.1 } : {}}
                      whileTap={!isUsed ? { scale: 0.95 } : {}}
                    >
                      <div className="text-center">
                        <div className="text-lg">{stone.emoji}</div>
                        <div className="font-bold">{valeur}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Drop Zone */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
              <h3 className="text-white text-xl font-bold text-center mb-4">
                🏺 Chaudron Magique
              </h3>
              <div
                ref={dropZoneRef}
                className="min-h-48 border-4 border-dashed border-yellow-400 rounded-2xl p-4 flex flex-col items-center justify-center relative"
              >
                {placedStones.length === 0 ? (
                  <div className="text-center text-gray-300">
                    <div className="text-4xl mb-2">🌟</div>
                    <div>Clique sur les pierres pour les placer</div>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {placedStones.map((stone, index) => (
                        <motion.div
                          key={stone.id}
                          className={`
                            w-12 h-12 rounded-xl bg-gradient-to-br ${stone.couleur}
                            flex items-center justify-center text-white font-bold
                            shadow-lg border-2 border-white/30 cursor-pointer
                          `}
                          initial={{ scale: 0, rotate: 180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", duration: 0.5, delay: index * 0.1 }}
                          onClick={() => removeStone(stone.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <div className="text-center">
                            <div className="text-xs">{stone.emoji}</div>
                            <div className="font-bold text-xs">{stone.valeur}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-2">
                        Somme: {currentSum}
                      </div>
                      <div className="text-lg text-gray-300">
                        {placedStones.map(s => s.valeur).join(' + ')} = {currentSum}
                      </div>
                      {currentSum === currentDefi.cible && (
                        <motion.div
                          className="text-green-400 font-bold text-lg mt-2"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          🎉 PARFAIT !
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Help and Controls */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
              <h3 className="text-white text-xl font-bold text-center mb-4">
                🔮 Aide Magique
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={showHint}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-2xl font-bold transition-colors"
                >
                  💡 Indice Magique
                </button>
                
                <button
                  onClick={resetChallenge}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-2xl font-bold transition-colors"
                >
                  🔄 Recommencer
                </button>
                
                {isCompleted && (
                  <motion.button
                    onClick={nextDefi}
                    className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-2xl font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                  >
                    🎉 Défi Suivant !
                  </motion.button>
                )}
              </div>
              
              {/* Hint Display */}
              <AnimatePresence>
                {showHintState && (
                  <motion.div
                    className="mt-4 bg-yellow-500/30 rounded-2xl p-3"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <div className="text-yellow-100 text-sm text-center">
                      💡 {currentDefi.indice}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md"
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl text-center font-bold">
              {feedbackMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FrenchMathsGame; 