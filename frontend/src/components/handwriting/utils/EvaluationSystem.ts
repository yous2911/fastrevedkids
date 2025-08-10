import { TracePoint, CursivePath, CompetenceExercise } from '../types/ExerciseTypes';

// ==========================================
// SYSTÈME D'ÉVALUATION CP 2025
// ==========================================

export interface CompetenceEvaluation {
  competenceCode: string;
  lettre: string;
  scores: {
    precision: number;
    vitesse: number;
    fluidite: number;
    inclinaison: number;
    pression: number;
  };
  totalScore: number;
  validee: boolean;
  commentaires: string[];
  recommandations: string[];
  prochaine_etape: string;
}

export const evaluateCompetence = (
  userTrace: TracePoint[], 
  referencePath: CursivePath, 
  exercice: CompetenceExercise,
  startTime: number
): CompetenceEvaluation => {
  
  if (userTrace.length < 5) {
    return {
      competenceCode: exercice.competenceCode,
      lettre: referencePath.targetLetter,
      scores: { precision: 0, vitesse: 0, fluidite: 0, inclinaison: 0, pression: 0 },
      totalScore: 0,
      validee: false,
      commentaires: ['Tracé trop court'],
      recommandations: ['Trace plus longuement la lettre'],
      prochaine_etape: 'Recommencer l\'exercice'
    };
  }

  const endTime = Date.now();
  const traceTime = (endTime - startTime) / 1000;
  
  // 1. PRÉCISION - Distance au tracé de référence
  let PROXIMITY_SCORE = 0;
  userTrace.forEach(userPoint => {
    const minDistance = Math.min(...referencePath.points.map(refPoint => 
      Math.sqrt(Math.pow(userPoint.x - refPoint.x, 2) + Math.pow(userPoint.y - refPoint.y, 2))
    ));
    PROXIMITY_SCORE += minDistance < 15 ? 1 : minDistance < 25 ? 0.7 : minDistance < 35 ? 0.4 : 0;
  });
  const precision = Math.min(100, (PROXIMITY_SCORE / userTrace.length) * 100);
  
  // 2. VITESSE - Selon cible compétence
  const speedScore = traceTime <= referencePath.speedTarget ? 100 : 
                    Math.max(0, 100 - (traceTime - referencePath.speedTarget) * 20);
  
  // 3. FLUIDITÉ - Régularité du mouvement
  let smoothnessScore = 100;
  if (userTrace.length > 3) {
    const distances: number[] = [];
    for (let i = 1; i < userTrace.length; i++) {
      distances.push(Math.sqrt(
        Math.pow(userTrace[i].x - userTrace[i-1].x, 2) + 
        Math.pow(userTrace[i].y - userTrace[i-1].y, 2)
      ));
    }
    const avgDistance = distances.reduce((a: number, b: number) => a + b, 0) / distances.length;
    const variance = distances.reduce((acc: number, d: number) => acc + Math.pow(d - avgDistance, 2), 0) / distances.length;
    smoothnessScore = Math.max(0, 100 - variance * 2);
  }
  
  // 4. INCLINAISON CURSIVE (15-20° pour CP)
  let inclinaisonScore = 50;
  if (userTrace.length > 10) {
    const firstPoint = userTrace[0];
    const lastPoint = userTrace[userTrace.length - 1];
    const angle = Math.atan2(lastPoint.y - firstPoint.y, lastPoint.x - firstPoint.x) * 180 / Math.PI;
    const targetAngle = referencePath.inclinationAngle;
    const angleDiff = Math.abs(angle - targetAngle);
    inclinaisonScore = Math.max(0, 100 - angleDiff * 4);
  }
  
  // 5. PRESSION - Constance et qualité
  const pressures = userTrace.map(p => p.pressure).filter(p => p > 0);
  let pressionScore = 50;
  if (pressures.length > 5) {
    const avgPression = pressures.reduce((a: number, b: number) => a + b, 0) / pressures.length;
    const variance = pressures.reduce((acc: number, p: number) => acc + Math.pow(p - avgPression, 2), 0) / pressures.length;
    
    // Score selon proximité pression idéale et constance
    const idealDistance = Math.abs(avgPression - 0.5); // PRESSURE_CONFIG.ideal
    const pressionQuality = Math.max(0, 100 - idealDistance * 200);
    const constance = Math.max(0, 100 - variance * 1000);
    pressionScore = (pressionQuality + constance) / 2;
  }
  
  // SCORE TOTAL pondéré selon compétence
  const WEIGHTS = {
    precision: 0.35,
    vitesse: 0.20,
    fluidite: 0.25,
    inclinaison: 0.15,
    pression: 0.05
  };
  
  const totalScore = Math.round(
    precision * WEIGHTS.precision + 
    speedScore * WEIGHTS.vitesse + 
    smoothnessScore * WEIGHTS.fluidite + 
    inclinaisonScore * WEIGHTS.inclinaison +
    pressionScore * WEIGHTS.pression
  );
  
  // VALIDATION COMPÉTENCE
  const validee = precision >= exercice.validation.seuil_precision &&
                  speedScore >= (exercice.validation.seuil_vitesse * 20) && // Conversion
                  smoothnessScore >= exercice.validation.seuil_fluidite &&
                  inclinaisonScore >= exercice.validation.seuil_inclinaison &&
                  totalScore >= exercice.competence.seuil_maitrise;
  
  // COMMENTAIRES AUTOMATIQUES
  const commentaires: string[] = [];
  const recommandations: string[] = [];
  
  if (precision < 70) {
    commentaires.push('🎯 Tracé à améliorer');
    recommandations.push('Suis mieux le modèle');
  } else if (precision >= 90) {
    commentaires.push('✨ Tracé très précis !');
  }
  
  if (speedScore < 60) {
    commentaires.push('⚡ Un peu lent');
    recommandations.push('Essaie d\'aller plus vite');
  } else if (speedScore >= 90) {
    commentaires.push('🚀 Excellente vitesse !');
  }
  
  if (smoothnessScore < 70) {
    commentaires.push('🌊 Mouvement saccadé');
    recommandations.push('Écris plus fluidement');
  } else if (smoothnessScore >= 90) {
    commentaires.push('🎭 Mouvement très fluide !');
  }
  
  if (inclinaisonScore < 60) {
    commentaires.push('📐 Inclinaison à corriger');
    recommandations.push('Penche plus vers la droite (15°)');
  } else if (inclinaisonScore >= 85) {
    commentaires.push('📏 Parfaite inclinaison cursive !');
  }
  
  if (pressionScore < 60) {
    commentaires.push('🖊️ Pression irrégulière');
    recommandations.push('Garde la même pression');
  } else if (pressionScore >= 85) {
    commentaires.push('✍️ Excellente maîtrise du stylet !');
  }
  
  // PROCHAINE ÉTAPE
  let prochaine_etape = '';
  if (validee) {
    prochaine_etape = 'Compétence validée ! Passer à la suivante';
  } else if (totalScore >= 70) {
    prochaine_etape = 'Presque ! Encore un essai';
  } else {
    prochaine_etape = 'Recommencer avec les conseils';
  }
  
  return {
    competenceCode: exercice.competenceCode,
    lettre: referencePath.targetLetter,
    scores: {
      precision: Math.round(precision),
      vitesse: Math.round(speedScore),
      fluidite: Math.round(smoothnessScore),
      inclinaison: Math.round(inclinaisonScore),
      pression: Math.round(pressionScore)
    },
    totalScore,
    validee,
    commentaires,
    recommandations,
    prochaine_etape
  };
}; 