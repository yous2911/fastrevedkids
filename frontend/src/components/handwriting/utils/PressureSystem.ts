// ==========================================
// SYSTÈME DE PRESSION STYLET AVANCÉ
// ==========================================

export interface PressureState {
  current: number;
  ideal: number;
  tolerance: number;
  feedback: 'parfait' | 'trop_fort' | 'trop_leger' | 'absent';
  color: string;
  message: string;
  quality: 'excellent' | 'bon' | 'moyen' | 'faible';
}

export const PRESSURE_CONFIG = {
  ideal: 0.5,
  tolerance: 0.15,
  minDetection: 0.1,
  maxWarning: 0.8,
  samplingRate: 10 // Échantillonnage pression toutes les 10ms
};

export const calculatePressureState = (pressure: number): PressureState => {
  const { ideal, tolerance, minDetection, maxWarning } = PRESSURE_CONFIG;
  
  if (pressure < minDetection) {
    return {
      current: pressure,
      ideal,
      tolerance,
      feedback: 'absent',
      color: '#FF6B6B',
      message: '✋ Pose ton stylet sur la tablette !',
      quality: 'faible'
    };
  } else if (pressure < ideal - tolerance) {
    return {
      current: pressure,
      ideal,
      tolerance,
      feedback: 'trop_leger',
      color: '#FFE066',
      message: '📝 Appuie un peu plus fort !',
      quality: 'moyen'
    };
  } else if (pressure > ideal + tolerance && pressure < maxWarning) {
    return {
      current: pressure,
      ideal,
      tolerance,
      feedback: 'trop_fort',
      color: '#FF8C42',
      message: '🪶 Plus doucement ! Comme une plume !',
      quality: 'moyen'
    };
  } else if (pressure >= maxWarning) {
    return {
      current: pressure,
      ideal,
      tolerance,
      feedback: 'trop_fort',
      color: '#FF4757',
      message: '⚠️ STOP ! Tu appuies trop fort !',
      quality: 'faible'
    };
  } else {
    return {
      current: pressure,
      ideal,
      tolerance,
      feedback: 'parfait',
      color: '#2ECC71',
      message: '✨ Parfait ! Pression idéale !',
      quality: 'excellent'
    };
  }
}; 