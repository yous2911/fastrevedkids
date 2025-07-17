import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

interface HapticConfig {
  intensity?: number;
  duration?: number;
}

export const useHaptic = () => {
  const triggerHaptic = useCallback((type: HapticType, config: HapticConfig = {}) => {
    const { intensity = 1, duration = 100 } = config;

    // Check if haptic feedback is supported
    if (!navigator.vibrate) {
      console.warn('Haptic feedback not supported on this device');
      return;
    }

    // Define haptic patterns for different types
    const hapticPatterns: Record<HapticType, number | number[]> = {
      light: 50,
      medium: 100,
      heavy: 200,
      success: [50, 100, 50],
      error: [100, 50, 100, 50, 100],
      warning: [100, 200, 100]
    };

    const pattern = hapticPatterns[type];
    
    if (Array.isArray(pattern)) {
      // For complex patterns, apply intensity scaling
      const scaledPattern = pattern.map(duration => Math.round(duration * intensity));
      navigator.vibrate(scaledPattern);
    } else {
      // For simple patterns, scale the duration
      navigator.vibrate(Math.round(pattern * intensity));
    }
  }, []);

  const triggerCustomHaptic = useCallback((pattern: number[], config: HapticConfig = {}) => {
    const { intensity = 1 } = config;
    
    if (!navigator.vibrate) {
      console.warn('Haptic feedback not supported on this device');
      return;
    }

    const scaledPattern = pattern.map(duration => Math.round(duration * intensity));
    navigator.vibrate(scaledPattern);
  }, []);

  const stopHaptic = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  }, []);

  const isHapticSupported = useCallback(() => {
    return !!navigator.vibrate;
  }, []);

  return {
    triggerHaptic,
    triggerCustomHaptic,
    stopHaptic,
    isHapticSupported
  };
}; 