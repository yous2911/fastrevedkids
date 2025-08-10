import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CP2025_COMPETENCES } from './types/CP2025Types';
import { PressureState, calculatePressureState } from './utils/PressureSystem';
import { TracePoint, CompetenceExercise, generatePerfectTrace } from './types/ExerciseTypes';
import { CompetenceEvaluation, evaluateCompetence } from './utils/EvaluationSystem';
import { CP2025AudioManager } from './utils/AudioManager';
import { useCP2025Backend, CP2025ProgressData } from './hooks/useCP2025Backend';

// === EXERCICES COMPÉTENCES CP 2025 ===
const COMPETENCE_EXERCISES: CompetenceExercise[] = [
  // CP.FR.L1.1 - Correspondances Graphème-Phonème Période 1
  {
    id: 'cp_fr_l1_1_vowels',
    competenceCode: 'CP.FR.L1.1',
    competence: CP2025_COMPETENCES['CP.FR.L1.1'],
    type: 'decouverte',
    titre: 'Les voyelles en cursive - Période 1',
    consigne: 'Trace les voyelles a, i, o en cursive en respectant le modèle',
    objectif: 'Maîtriser les tracés cursifs des voyelles de base',
    lettresOuMots: ['a', 'i', 'o'],
    paths: [
      {
        letterName: 'a',
        targetLetter: 'a',
        color: '#FF6B9D',
        strokeWidth: 6,
        difficulty: 1,
        speedTarget: 3,
        precisionTarget: 80,
        inclinationAngle: 15,
        isCursive: true,
        competenceValidation: true,
        startPoint: { x: 50, y: 180, timestamp: 0, pressure: 0.5 },
        endPoint: { x: 75, y: 180, timestamp: 1100, pressure: 0.5 },
        points: generatePerfectTrace('a', 50, 180)
      },
      {
        letterName: 'i',
        targetLetter: 'i',
        color: '#4ECDC4',
        strokeWidth: 6,
        difficulty: 1,
        speedTarget: 2,
        precisionTarget: 85,
        inclinationAngle: 15,
        isCursive: true,
        competenceValidation: true,
        startPoint: { x: 120, y: 180, timestamp: 0, pressure: 0.5 },
        endPoint: { x: 132, y: 180, timestamp: 500, pressure: 0.5 },
        points: generatePerfectTrace('i', 120, 180)
      },
      {
        letterName: 'o',
        targetLetter: 'o',
        color: '#45B7D1',
        strokeWidth: 6,
        difficulty: 1,
        speedTarget: 3,
        precisionTarget: 80,
        inclinationAngle: 15,
        isCursive: true,
        competenceValidation: true,
        startPoint: { x: 180, y: 180, timestamp: 0, pressure: 0.5 },
        endPoint: { x: 205, y: 180, timestamp: 900, pressure: 0.5 },
        points: generatePerfectTrace('o', 180, 180)
      }
    ],
    validation: {
      seuil_precision: 80,
      seuil_vitesse: 5,
      seuil_fluidite: 70,
      seuil_inclinaison: 70
    },
    feedback: {
      succes: ['✨ Excellent ! Tu maîtrises les voyelles !', '🎯 Parfait tracé cursif !'],
      encouragement: ['💪 Encore un effort !', '📝 Tu progresses !'],
      conseil: ['🎯 Garde la même inclinaison', '🪶 Pression plus douce']
    },
    audio: {
      introduction: 'vowels_intro_cp',
      phoneme: ['phoneme_a', 'phoneme_i', 'phoneme_o'],
      validation: ['excellent_voyelles', 'bravo_cursive']
    },
    estimation_duree: 8,
    points_reussite: 15
  },

  // CP.FR.E1.1 - Écriture cursive réglure 3mm
  {
    id: 'cp_fr_e1_1_cursive_basic',
    competenceCode: 'CP.FR.E1.1',
    competence: CP2025_COMPETENCES['CP.FR.E1.1'],
    type: 'entrainement',
    titre: 'Écriture cursive - Réglure 3mm',
    consigne: 'Écris les lettres l, m en respectant les lignes de réglure',
    objectif: 'Former correctement les lettres cursives sur réglure 3mm',
    lettresOuMots: ['l', 'm'],
    paths: [
      {
        letterName: 'l',
        targetLetter: 'l',
        color: '#2ECC71',
        strokeWidth: 5,
        difficulty: 2,
        speedTarget: 4,
        precisionTarget: 85,
        inclinationAngle: 17,
        isCursive: true,
        competenceValidation: true,
        startPoint: { x: 80, y: 180, timestamp: 0, pressure: 0.5 },
        endPoint: { x: 98, y: 180, timestamp: 700, pressure: 0.5 },
        points: generatePerfectTrace('l', 80, 180)
      },
      {
        letterName: 'm',
        targetLetter: 'm',
        color: '#E74C3C',
        strokeWidth: 5,
        difficulty: 2,
        speedTarget: 4,
        precisionTarget: 85,
        inclinationAngle: 17,
        isCursive: true,
        competenceValidation: true,
        startPoint: { x: 150, y: 180, timestamp: 0, pressure: 0.5 },
        endPoint: { x: 178, y: 180, timestamp: 900, pressure: 0.5 },
        points: generatePerfectTrace('m', 150, 180)
      }
    ],
    validation: {
      seuil_precision: 85,
      seuil_vitesse: 6,
      seuil_fluidite: 75,
      seuil_inclinaison: 75
    },
    feedback: {
      succes: ['🎯 Super ! Tes lettres sont bien formées !', '📏 Réglure parfaitement respectée !'],
      encouragement: ['📝 Continue, c\'est bien !', '⚡ Tu maîtrises de mieux en mieux !'],
      conseil: ['📐 Garde l\'inclinaison de 17°', '📏 Respecte bien les lignes']
    },
    audio: {
      introduction: 'cursive_reglure_intro',
      phoneme: ['phoneme_l', 'phoneme_m'],
      validation: ['parfait_cursive', 'reglure_respectee']
    },
    estimation_duree: 10,
    points_reussite: 20
  }
];

const PlumeEnchanteeCP2025: React.FC = () => {
  // États principaux
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [userTrace, setUserTrace] = useState<TracePoint[]>([]);
  const [traceStartTime, setTraceStartTime] = useState<number>(0);
  
  // États exercices et compétences
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [availableExercises, setAvailableExercises] = useState<CompetenceExercise[]>(COMPETENCE_EXERCISES);
  const [completedCompetences, setCompletedCompetences] = useState<Set<string>>(new Set());
  
  // États feedback et évaluation
  const [currentEvaluation, setCurrentEvaluation] = useState<CompetenceEvaluation | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showCompetenceInfo, setShowCompetenceInfo] = useState(true);
  const [showGuidance, setShowGuidance] = useState(true);
  
  // États interface
  const [showReglure, setShowReglure] = useState(true);
  
  // États pression stylet
  const [currentPressure, setCurrentPressure] = useState<PressureState>({
    current: 0,
    ideal: 0.5,
    tolerance: 0.15,
    feedback: 'absent',
    color: '#95A5A6',
    message: 'Prends ton stylet et commence à écrire !',
    quality: 'faible'
  });
  const [pressureHistory, setPressureHistory] = useState<number[]>([]);
  const [showPressureAlert, setShowPressureAlert] = useState(false);
  
  // États progression et gamification
  const [playerStats, setPlayerStats] = useState({
    totalXP: 0,
    totalDiamonds: 0,
    totalStars: 0,
    level: 1,
    competencesValidees: new Set<string>(),
    currentStreak: 0,
    sessionTime: 0
  });
  
  // Managers
  const audioManager = useRef(new CP2025AudioManager()).current;
  const { submitCompetenceResult, getStudentCompetences } = useCP2025Backend();
  
  // Exercice et lettre actuels
  const currentExercise = availableExercises[currentExerciseIndex];
  const currentLetter = currentExercise?.paths[currentLetterIndex];

  // ==========================================
  // CANVAS SETUP ET RENDU
  // ==========================================
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        setCtx(context);
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 800 * dpr;
        canvas.height = 400 * dpr;
        canvas.style.width = '800px';
        canvas.style.height = '400px';
        context.scale(dpr, dpr);
        context.lineCap = 'round';
        context.lineJoin = 'round';
      }
    }
  }, []);

  const drawCanvas = useCallback(() => {
    if (!ctx || !currentExercise) return;
    
    ctx.clearRect(0, 0, 800, 400);
    
    // Lignes Seyès adaptatives selon compétence
    if (showReglure) {
      // Déterminer taille réglure selon compétence
      const reglureActuelle = currentExercise.competenceCode.includes('E1.1') ? 12 : // 3mm 
                             currentExercise.competenceCode.includes('E1.2') ? 10 : // 2.5mm
                             12; // Par défaut
      
      // Lignes secondaires (réglure fine)
      ctx.strokeStyle = 'rgba(200, 220, 255, 0.4)';
      ctx.lineWidth = 1;
      for (let y = 0; y < 400; y += reglureActuelle) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
      }
      
      // Lignes principales (tous les 4 interlignes)
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.7)';
      ctx.lineWidth = 1.5;
      for (let y = reglureActuelle * 2; y < 400; y += reglureActuelle * 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
      }
      
      // Ligne de base (écriture) - plus visible
      ctx.strokeStyle = 'rgba(50, 100, 200, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 180);
      ctx.lineTo(800, 180);
      ctx.stroke();
    }
    
    // Tracés de référence avec indication compétence
    currentExercise.paths.forEach((letterPath, index) => {
      const isCurrentLetter = index === currentLetterIndex;
      const opacity = isCurrentLetter ? 0.8 : 0.4;
      
      if (showGuidance || isCurrentLetter) {
        ctx.strokeStyle = letterPath.color;
        ctx.lineWidth = letterPath.strokeWidth;
        ctx.globalAlpha = opacity;
        
        // Tracé de référence
        ctx.beginPath();
        letterPath.points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        
        // Points de départ/arrivée pour cursive
        if (isCurrentLetter && showGuidance && letterPath.isCursive) {
          // Point de départ (vert)
          ctx.fillStyle = '#22C55E';
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(letterPath.startPoint.x, letterPath.startPoint.y, 8, 0, 2 * Math.PI);
          ctx.fill();
          
          // Point d'arrivée (rouge)
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(letterPath.endPoint.x, letterPath.endPoint.y, 6, 0, 2 * Math.PI);
          ctx.fill();
          
          // Flèche directionnelle
          const midX = (letterPath.startPoint.x + letterPath.endPoint.x) / 2;
          const midY = (letterPath.startPoint.y + letterPath.endPoint.y) / 2 - 30;
          ctx.fillStyle = '#8B5CF6';
          ctx.font = '20px Arial';
          ctx.fillText('→', midX, midY);
        }
      }
    });
    
    ctx.globalAlpha = 1;
    
    // Tracé utilisateur avec effet pression
    if (userTrace.length > 1) {
      userTrace.forEach((point, index) => {
        if (index === 0) return;
        
        const prevPoint = userTrace[index - 1];
        const pressure = point.pressure || 0.5;
        
        // Épaisseur variable selon pression
        const lineWidth = Math.max(2, Math.min(12, 6 * pressure));
        
        // Couleur selon qualité pression
        const pressureState = calculatePressureState(pressure);
        ctx.strokeStyle = pressureState.color;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = 0.8;
        
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      });
    }
    
    ctx.globalAlpha = 1;
  }, [ctx, currentExercise, currentLetterIndex, userTrace, showGuidance, showReglure]);

  // ==========================================
  // GESTION STYLET AVEC PRESSION
  // ==========================================
  
  const handlePointerStart = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'pen') {
      audioManager.playSound('utilise_stylet');
      return;
    }

    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const pos = { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top,
      timestamp: Date.now(),
      pressure: e.pressure
    };
    
    const pressureState = calculatePressureState(e.pressure);
    setCurrentPressure(pressureState);
    
    if (pressureState.feedback !== 'parfait') {
      setShowPressureAlert(true);
      audioManager.playSound(`pression_${pressureState.feedback}`);
      setTimeout(() => setShowPressureAlert(false), 2000);
    }
    
    setDrawing(true);
    setUserTrace([pos]);
    setPressureHistory([e.pressure]);
    setTraceStartTime(Date.now());
  }, [audioManager]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawing || e.pointerType !== 'pen') return;
    
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const pos = { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top,
      timestamp: Date.now(),
      pressure: e.pressure
    };
    
    const pressureState = calculatePressureState(e.pressure);
    setCurrentPressure(pressureState);
    
    setUserTrace(prev => [...prev, pos]);
    setPressureHistory(prev => [...prev, e.pressure]);
  }, [drawing]);

  const handlePointerEnd = useCallback(() => {
    setDrawing(false);
    
    // Analyse finale de la pression
    if (pressureHistory.length > 5) {
      const avgPressure = pressureHistory.reduce((a, b) => a + b, 0) / pressureHistory.length;
      const variance = pressureHistory.reduce((acc, p) => acc + Math.pow(p - avgPressure, 2), 0) / pressureHistory.length;
      
      if (variance < 0.02 && avgPressure >= 0.4 && avgPressure <= 0.6) {
        audioManager.playSound('pression_parfaite');
      }
    }
  }, [pressureHistory, audioManager]);

  // ==========================================
  // VALIDATION COMPÉTENCE CP 2025
  // ==========================================
  
  const validateCompetence = useCallback(async () => {
    if (!currentExercise || !currentLetter || userTrace.length < 5) {
      audioManager.playSound('trace_plus_long');
      return;
    }

    // Évaluation selon référentiel CP 2025
    const evaluation = evaluateCompetence(userTrace, currentLetter, currentExercise, traceStartTime);
    setCurrentEvaluation(evaluation);
    setShowEvaluation(true);
    
    // Mise à jour progression
    if (evaluation.validee) {
      setCompletedCompetences(prev => new Set([...prev, evaluation.competenceCode]));
      setPlayerStats(prev => ({
        ...prev,
        competencesValidees: new Set([...prev.competencesValidees, evaluation.competenceCode]),
        totalXP: prev.totalXP + currentExercise.points_reussite,
        totalStars: prev.totalStars + 3,
        currentStreak: prev.currentStreak + 1
      }));
      
      audioManager.playValidationSequence(true, currentExercise.competenceCode);
    } else {
      setPlayerStats(prev => ({
        ...prev,
        currentStreak: 0
      }));
      
      audioManager.playValidationSequence(false, currentExercise.competenceCode);
    }
    
    // Sauvegarde backend
    const progressData: CP2025ProgressData = {
      studentId: 'current-student', // À remplacer par l'ID réel
      competenceCode: evaluation.competenceCode,
      exerciseId: currentExercise.id,
      evaluation,
      timestamp: new Date(),
      sessionDuration: (Date.now() - traceStartTime) / 1000,
      attempts: 1
    };
    
    await submitCompetenceResult(progressData);
    
    // Passage exercice suivant si validé
    if (evaluation.validee) {
      setTimeout(() => {
        if (currentLetterIndex < currentExercise.paths.length - 1) {
          setCurrentLetterIndex(prev => prev + 1);
          setUserTrace([]);
          setShowEvaluation(false);
        } else if (currentExerciseIndex < availableExercises.length - 1) {
          setCurrentExerciseIndex(prev => prev + 1);
          setCurrentLetterIndex(0);
          setUserTrace([]);
          setShowEvaluation(false);
        }
      }, 4000);
    }
  }, [currentExercise, currentLetter, userTrace, traceStartTime, currentLetterIndex, currentExerciseIndex, availableExercises.length, audioManager, submitCompetenceResult]);

  // ==========================================
  // CONTRÔLES INTERFACE
  // ==========================================
  
  const resetTrace = useCallback(() => {
    setUserTrace([]);
    setCurrentEvaluation(null);
    setShowEvaluation(false);
    setPressureHistory([]);
  }, []);

  const toggleGuidance = useCallback(() => {
    setShowGuidance(prev => !prev);
  }, []);

  const toggleReglure = useCallback(() => {
    setShowReglure(prev => !prev);
  }, []);

  // ==========================================
  // EFFECTS
  // ==========================================
  
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    if (currentExercise) {
      setTimeout(() => {
        audioManager.playCompetenceIntro(currentExercise.competenceCode);
      }, 1000);
    }
  }, [currentExercise, audioManager]);

  // Chargement compétences étudiant
  useEffect(() => {
    const loadStudentProgress = async () => {
      const competences = await getStudentCompetences('current-student');
      const validatedCodes = Object.keys(competences).filter(code => competences[code].validated);
      setCompletedCompetences(new Set(validatedCodes));
    };
    
    loadStudentProgress();
  }, [getStudentCompetences]);

  if (!currentExercise) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 to-pink-400">
        <div className="text-white text-2xl font-bold">
          🎉 Toutes les compétences CP 2025 sont maîtrisées !
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 p-4">
      {/* Header avec informations compétence */}
      <div className="text-center mb-6 max-w-4xl">
        <h1 className="text-white text-4xl font-bold mb-4">
          ✍️ Plume Enchantée CP 2025
        </h1>
        
        {/* Carte compétence */}
        <AnimatePresence>
          {showCompetenceInfo && (
            <motion.div
              className="bg-white/95 backdrop-blur rounded-3xl p-6 mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="text-left">
                  <div className="text-sm font-bold text-purple-600 mb-1">
                    {currentExercise.competenceCode}
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {currentExercise.competence.titre}
                  </h2>
                  <p className="text-gray-600 text-sm mb-3">
                    {currentExercise.competence.description}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-lg text-white text-xs font-bold ${
                      currentExercise.competence.periode === 'P1' ? 'bg-green-500' :
                      currentExercise.competence.periode === 'P2' ? 'bg-blue-500' :
                      currentExercise.competence.periode === 'P3' ? 'bg-orange-500' :
                      currentExercise.competence.periode === 'P4' ? 'bg-purple-500' :
                      'bg-pink-500'
                    }`}>
                      {currentExercise.competence.periode}
                    </span>
                    <span className="bg-gray-500 text-white px-3 py-1 rounded-lg text-xs font-bold">
                      {currentExercise.competence.domaine}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-white text-xs font-bold ${
                      currentExercise.type === 'decouverte' ? 'bg-green-400' :
                      currentExercise.type === 'entrainement' ? 'bg-blue-400' :
                      currentExercise.type === 'consolidation' ? 'bg-orange-400' :
                      'bg-red-400'
                    }`}>
                      {currentExercise.type.toUpperCase()}
                    </span>
                    {completedCompetences.has(currentExercise.competenceCode) && (
                      <span className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold">
                        ✅ VALIDÉE
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowCompetenceInfo(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>
              
              {/* Objectifs de la compétence */}
              <div className="text-left">
                <h3 className="font-bold text-gray-700 mb-2">🎯 Objectifs :</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {currentExercise.competence.objectifs.map((objectif, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      {objectif}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Progression dans l'exercice */}
              <div className="mt-4 bg-gray-100 rounded-lg p-3">
                <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                  <span>Progression</span>
                  <span>{currentLetterIndex + 1}/{currentExercise.paths.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentLetterIndex + 1) / currentExercise.paths.length) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zone de dessin */}
      <div className="relative mb-6">
        <canvas
          ref={canvasRef}
          className="border-4 border-white/30 rounded-2xl shadow-2xl bg-white/90 backdrop-blur"
          onPointerDown={handlePointerStart}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          style={{ touchAction: 'none' }}
        />
        
        {/* Indicateur pression en temps réel */}
        <AnimatePresence>
          {showPressureAlert && (
            <motion.div
              className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: currentPressure.color }}
                />
                <div>
                  <div className="font-bold text-gray-800 text-sm">
                    {currentPressure.message}
                  </div>
                  <div className="text-xs text-gray-600">
                    Pression: {Math.round(currentPressure.current * 100)}%
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contrôles */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={validateCompetence}
          disabled={userTrace.length < 5}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✅ Valider
        </button>
        
        <button
          onClick={resetTrace}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          🔄 Recommencer
        </button>
        
        <button
          onClick={toggleGuidance}
          className={`px-6 py-3 font-bold rounded-xl shadow-lg transition-all ${
            showGuidance 
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white' 
              : 'bg-white/20 text-white border-2 border-white/30'
          }`}
        >
          👁️ {showGuidance ? 'Masquer' : 'Afficher'} guide
        </button>
        
        <button
          onClick={toggleReglure}
          className={`px-6 py-3 font-bold rounded-xl shadow-lg transition-all ${
            showReglure 
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' 
              : 'bg-white/20 text-white border-2 border-white/30'
          }`}
        >
          📏 {showReglure ? 'Masquer' : 'Afficher'} réglure
        </button>
      </div>

      {/* Évaluation */}
      <AnimatePresence>
        {showEvaluation && currentEvaluation && (
          <motion.div
            className="bg-white/95 backdrop-blur rounded-3xl p-6 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {currentEvaluation.validee ? '🎉 Compétence Validée !' : '📝 À améliorer'}
              </h3>
              <p className="text-gray-600">
                Lettre : <span className="font-bold text-purple-600">{currentEvaluation.lettre}</span>
              </p>
            </div>
            
            {/* Scores détaillés */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-bold text-gray-700 mb-2">🎯 Précision</div>
                <div className="text-2xl font-bold text-blue-600">{currentEvaluation.scores.precision}%</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-bold text-gray-700 mb-2">⚡ Vitesse</div>
                <div className="text-2xl font-bold text-green-600">{currentEvaluation.scores.vitesse}%</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-bold text-gray-700 mb-2">🌊 Fluidité</div>
                <div className="text-2xl font-bold text-purple-600">{currentEvaluation.scores.fluidite}%</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-bold text-gray-700 mb-2">📐 Inclinaison</div>
                <div className="text-2xl font-bold text-orange-600">{currentEvaluation.scores.inclinaison}%</div>
              </div>
            </div>
            
            {/* Score total */}
            <div className="text-center mb-6">
              <div className="text-sm font-bold text-gray-700 mb-2">Score Total</div>
              <div className="text-4xl font-bold text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {currentEvaluation.totalScore}%
              </div>
            </div>
            
            {/* Commentaires */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-700 mb-3">💬 Commentaires :</h4>
              <ul className="space-y-2">
                {currentEvaluation.commentaires.map((comment, index) => (
                  <li key={index} className="text-gray-600 text-sm">• {comment}</li>
                ))}
              </ul>
            </div>
            
            {/* Recommandations */}
            {currentEvaluation.recommandations.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-3">💡 Conseils :</h4>
                <ul className="space-y-2">
                  {currentEvaluation.recommandations.map((recommandation, index) => (
                    <li key={index} className="text-gray-600 text-sm">• {recommandation}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Prochaine étape */}
            <div className="text-center">
              <div className="text-sm font-bold text-gray-700 mb-2">🔄 Prochaine étape</div>
              <div className="text-gray-600">{currentEvaluation.prochaine_etape}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistiques joueur */}
      <div className="bg-white/20 backdrop-blur rounded-2xl p-4 mt-6">
        <div className="flex gap-6 text-white">
          <div className="text-center">
            <div className="text-2xl font-bold">⭐</div>
            <div className="text-sm">{playerStats.totalStars}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">💎</div>
            <div className="text-sm">{playerStats.totalDiamonds}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">🔥</div>
            <div className="text-sm">{playerStats.currentStreak}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">📊</div>
            <div className="text-sm">{playerStats.totalXP} XP</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlumeEnchanteeCP2025; 