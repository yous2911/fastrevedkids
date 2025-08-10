import { CP2025Competence } from './CP2025Types';

// ==========================================
// EXERCICES BASÉS COMPÉTENCES CP 2025
// ==========================================

export interface TracePoint {
  x: number;
  y: number;
  timestamp: number;
  pressure: number;
}

export interface CompetenceExercise {
  id: string;
  competenceCode: string;
  competence: CP2025Competence;
  type: 'decouverte' | 'entrainement' | 'consolidation' | 'approfondissement';
  titre: string;
  consigne: string;
  objectif: string;
  lettresOuMots: string[];
  paths: CursivePath[];
  validation: {
    seuil_precision: number;
    seuil_vitesse: number;
    seuil_fluidite: number;
    seuil_inclinaison: number;
  };
  feedback: {
    succes: string[];
    encouragement: string[];
    conseil: string[];
  };
  audio: {
    introduction: string;
    phoneme: string[];
    validation: string[];
  };
  estimation_duree: number;
  points_reussite: number;
}

export interface CursivePath {
  letterName: string;
  targetLetter: string;
  color: string;
  strokeWidth: number;
  difficulty: number;
  speedTarget: number;
  precisionTarget: number;
  startPoint: TracePoint;
  endPoint: TracePoint;
  points: TracePoint[];
  connectionPoints?: TracePoint[];
  inclinationAngle: number;
  isCursive: boolean;
  competenceValidation: boolean;
}

// Générateur de tracés cursifs parfaits (police scolaire française)
export const PERFECT_CURSIVE_GENERATORS = {
  // === VOYELLES CP ===
  'a': (x: number, y: number, scale: number = 1) => [
    { x: x, y: y, timestamp: 0, pressure: 0.5 },
    { x: x + 8*scale, y: y - 15*scale, timestamp: 100, pressure: 0.5 },
    { x: x + 15*scale, y: y - 20*scale, timestamp: 200, pressure: 0.5 },
    { x: x + 22*scale, y: y - 15*scale, timestamp: 300, pressure: 0.5 },
    { x: x + 25*scale, y: y - 5*scale, timestamp: 400, pressure: 0.5 },
    { x: x + 22*scale, y: y + 2*scale, timestamp: 500, pressure: 0.5 },
    { x: x + 15*scale, y: y + 5*scale, timestamp: 600, pressure: 0.5 },
    { x: x + 8*scale, y: y + 2*scale, timestamp: 700, pressure: 0.5 },
    { x: x + 5*scale, y: y - 5*scale, timestamp: 800, pressure: 0.5 },
    { x: x + 8*scale, y: y - 10*scale, timestamp: 900, pressure: 0.5 },
    { x: x + 22*scale, y: y - 12*scale, timestamp: 1000, pressure: 0.5 },
    { x: x + 25*scale, y: y, timestamp: 1100, pressure: 0.5 }
  ],
  
  'i': (x: number, y: number, scale: number = 1) => [
    { x: x, y: y, timestamp: 0, pressure: 0.5 },
    { x: x + 2*scale, y: y - 8*scale, timestamp: 100, pressure: 0.5 },
    { x: x + 5*scale, y: y - 18*scale, timestamp: 200, pressure: 0.5 },
    { x: x + 8*scale, y: y - 15*scale, timestamp: 300, pressure: 0.5 },
    { x: x + 10*scale, y: y - 5*scale, timestamp: 400, pressure: 0.5 },
    { x: x + 12*scale, y: y, timestamp: 500, pressure: 0.5 }
  ],
  
  'o': (x: number, y: number, scale: number = 1) => [
    { x: x, y: y, timestamp: 0, pressure: 0.5 },
    { x: x + 5*scale, y: y - 15*scale, timestamp: 100, pressure: 0.5 },
    { x: x + 12*scale, y: y - 20*scale, timestamp: 200, pressure: 0.5 },
    { x: x + 20*scale, y: y - 15*scale, timestamp: 300, pressure: 0.5 },
    { x: x + 22*scale, y: y - 5*scale, timestamp: 400, pressure: 0.5 },
    { x: x + 20*scale, y: y + 2*scale, timestamp: 500, pressure: 0.5 },
    { x: x + 12*scale, y: y + 5*scale, timestamp: 600, pressure: 0.5 },
    { x: x + 5*scale, y: y + 2*scale, timestamp: 700, pressure: 0.5 },
    { x: x + 2*scale, y: y - 5*scale, timestamp: 800, pressure: 0.5 },
    { x: x + 25*scale, y: y, timestamp: 900, pressure: 0.5 }
  ],
  
  // === CONSONNES CP ===
  'l': (x: number, y: number, scale: number = 1) => [
    { x: x, y: y, timestamp: 0, pressure: 0.5 },
    { x: x + 2*scale, y: y - 10*scale, timestamp: 100, pressure: 0.5 },
    { x: x + 5*scale, y: y - 30*scale, timestamp: 200, pressure: 0.5 },
    { x: x + 8*scale, y: y - 35*scale, timestamp: 300, pressure: 0.5 },
    { x: x + 10*scale, y: y - 30*scale, timestamp: 400, pressure: 0.5 },
    { x: x + 12*scale, y: y - 15*scale, timestamp: 500, pressure: 0.5 },
    { x: x + 15*scale, y: y - 5*scale, timestamp: 600, pressure: 0.5 },
    { x: x + 18*scale, y: y, timestamp: 700, pressure: 0.5 }
  ],
  
  'm': (x: number, y: number, scale: number = 1) => [
    { x: x, y: y, timestamp: 0, pressure: 0.5 },
    { x: x, y: y - 15*scale, timestamp: 100, pressure: 0.5 },
    { x: x + 3*scale, y: y - 18*scale, timestamp: 200, pressure: 0.5 },
    { x: x + 8*scale, y: y - 15*scale, timestamp: 300, pressure: 0.5 },
    { x: x + 12*scale, y: y - 18*scale, timestamp: 400, pressure: 0.5 },
    { x: x + 15*scale, y: y - 15*scale, timestamp: 500, pressure: 0.5 },
    { x: x + 18*scale, y: y - 18*scale, timestamp: 600, pressure: 0.5 },
    { x: x + 22*scale, y: y - 15*scale, timestamp: 700, pressure: 0.5 },
    { x: x + 25*scale, y: y - 10*scale, timestamp: 800, pressure: 0.5 },
    { x: x + 28*scale, y: y, timestamp: 900, pressure: 0.5 }
  ]
};

// Fonction de génération de tracé parfait
export const generatePerfectTrace = (letter: string, x: number, y: number, scale: number = 1): TracePoint[] => {
  const generator = PERFECT_CURSIVE_GENERATORS[letter as keyof typeof PERFECT_CURSIVE_GENERATORS];
  if (!generator) {
    console.warn(`Lettre '${letter}' non disponible`);
    return [{ x, y, timestamp: 0, pressure: 0.5 }];
  }
  return generator(x, y, scale);
}; 