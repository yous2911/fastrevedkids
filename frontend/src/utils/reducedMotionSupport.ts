// Comprehensive reduced motion support utilities
// Provides animation preferences and motion-safe alternatives

import { useEffect, useState } from 'react';

// Comprehensive motion preferences
export interface MotionPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  prefersDarkMode: boolean;
  prefersReducedTransparency: boolean;
  largeText: boolean;
}

// Hook to get all accessibility motion preferences
export const useMotionPreferences = (): MotionPreferences => {
  const [preferences, setPreferences] = useState<MotionPreferences>({
    reduceMotion: false,
    highContrast: false,
    prefersDarkMode: false,
    prefersReducedTransparency: false,
    largeText: false
  });

  useEffect(() => {
    const updatePreferences = () => {
      setPreferences({
        reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches || 
                     window.matchMedia('(forced-colors: active)').matches,
        prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        prefersReducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)').matches,
        largeText: window.matchMedia('(min-resolution: 120dpi)').matches
      });
    };

    // Initial check
    updatePreferences();

    // Set up listeners for preference changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(forced-colors: active)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-reduced-transparency: reduce)'),
      window.matchMedia('(min-resolution: 120dpi)')
    ];

    const handleChange = () => updatePreferences();

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', handleChange);
    });

    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', handleChange);
      });
    };
  }, []);

  return preferences;
};

// Safe animation props that respect user preferences
export const getSafeAnimationProps = (
  normalProps: any,
  reducedProps: any = {},
  motionPreferences: MotionPreferences
) => {
  if (motionPreferences.reduceMotion) {
    return {
      ...normalProps,
      ...reducedProps,
      // Remove or minimize animations
      animate: reducedProps.animate || {},
      transition: { duration: 0.01, ...reducedProps.transition },
      whileHover: undefined,
      whileTap: undefined,
      whileFocus: reducedProps.whileFocus || normalProps.whileFocus
    };
  }

  return normalProps;
};

// Component-specific animation configurations
export const animationConfigs = {
  // XP System animations
  xpSystem: {
    normal: {
      levelUp: {
        initial: { opacity: 0, scale: 0.8, rotate: -10 },
        animate: { 
          opacity: 1, 
          scale: [0.8, 1.2, 1], 
          rotate: [0, 5, -5, 0] 
        },
        transition: { 
          duration: 1.2, 
          ease: 'backOut',
          scale: { times: [0, 0.6, 1] }
        }
      },
      progressBar: {
        initial: { width: 0 },
        animate: { width: '100%' },
        transition: { duration: 0.8, ease: 'easeOut' }
      },
      xpGain: {
        initial: { opacity: 0, y: 20, scale: 0.8 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.8 },
        transition: { duration: 0.5, ease: 'easeOut' }
      }
    },
    reduced: {
      levelUp: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2 }
      },
      progressBar: {
        initial: { width: 0 },
        animate: { width: '100%' },
        transition: { duration: 0.1 }
      },
      xpGain: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.1 }
      }
    }
  },

  // Wardrobe System animations
  wardrobe: {
    normal: {
      itemHover: {
        whileHover: { scale: 1.05, y: -5 },
        whileTap: { scale: 0.95 }
      },
      newItemBadge: {
        animate: { 
          scale: [1, 1.1, 1], 
          opacity: [0.8, 1, 0.8] 
        },
        transition: { 
          duration: 1.5, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }
      },
      categorySwitch: {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
        transition: { duration: 0.3 }
      }
    },
    reduced: {
      itemHover: {
        whileHover: {},
        whileTap: {}
      },
      newItemBadge: {
        animate: { opacity: 1 },
        transition: { duration: 0.1 }
      },
      categorySwitch: {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.1 }
      }
    }
  },

  // Mascot animations
  mascot: {
    normal: {
      emotionChange: {
        animate: { 
          rotateY: [0, 360], 
          scale: [1, 1.1, 1] 
        },
        transition: { 
          duration: 0.8, 
          ease: 'easeInOut' 
        }
      },
      idle: {
        animate: { 
          y: [0, -5, 0],
          rotateZ: [0, 1, -1, 0]
        },
        transition: { 
          duration: 4, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }
      },
      celebration: {
        animate: { 
          scale: [1, 1.3, 1.1, 1],
          rotate: [0, 10, -10, 0],
          y: [0, -20, 0]
        },
        transition: { 
          duration: 1, 
          ease: 'easeOut' 
        }
      }
    },
    reduced: {
      emotionChange: {
        animate: { opacity: [0.8, 1] },
        transition: { duration: 0.2 }
      },
      idle: {
        animate: {},
        transition: { duration: 0 }
      },
      celebration: {
        animate: { scale: 1.1 },
        transition: { duration: 0.2 }
      }
    }
  },

  // Particle effects
  particles: {
    normal: {
      sparkle: {
        animate: {
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
          rotate: [0, 180]
        },
        transition: {
          duration: 1.2,
          ease: 'easeOut'
        }
      },
      trail: {
        animate: {
          pathLength: 1,
          opacity: [0, 1, 0]
        },
        transition: {
          duration: 0.8,
          ease: 'easeInOut'
        }
      }
    },
    reduced: {
      sparkle: {
        animate: { opacity: 1 },
        transition: { duration: 0.1 }
      },
      trail: {
        animate: { opacity: 1 },
        transition: { duration: 0.1 }
      }
    }
  }
};

// Get safe animation config for a component
export const getSafeAnimationConfig = (
  componentName: keyof typeof animationConfigs,
  animationType: string,
  motionPreferences: MotionPreferences
) => {
  const config = animationConfigs[componentName];
  if (!config) return {};

  const normalConfig = config.normal[animationType as keyof typeof config.normal];
  const reducedConfig = config.reduced[animationType as keyof typeof config.reduced];

  if (motionPreferences.reduceMotion && reducedConfig) {
    return reducedConfig;
  }

  return normalConfig || {};
};

// CSS class generator for motion-safe styles
export const getMotionSafeClasses = (
  normalClasses: string,
  reducedClasses: string = '',
  motionPreferences: MotionPreferences
): string => {
  const baseClasses = normalClasses;
  
  if (motionPreferences.reduceMotion) {
    // Remove animation classes and add static alternatives
    const cleanedClasses = baseClasses
      .replace(/animate-\w+/g, '') // Remove Tailwind animation classes
      .replace(/transition-\w+/g, '') // Remove transition classes
      .replace(/hover:\w+/g, ''); // Remove hover effects if needed

    return `${cleanedClasses} ${reducedClasses}`.trim();
  }

  return baseClasses;
};

// Utility to create motion-aware timeouts
export const getMotionSafeTimeout = (
  normalDuration: number,
  reducedDuration: number = 100,
  motionPreferences: MotionPreferences
): number => {
  return motionPreferences.reduceMotion ? reducedDuration : normalDuration;
};

// Utility for motion-safe transforms
export const getMotionSafeTransform = (
  normalTransform: string,
  reducedTransform: string = '',
  motionPreferences: MotionPreferences
): string => {
  return motionPreferences.reduceMotion ? reducedTransform : normalTransform;
};

// Prefers reduced motion CSS media query helper
export const addReducedMotionCSS = () => {
  const style = document.createElement('style');
  style.textContent = `
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      
      /* Remove specific animations that might be jarring */
      .animate-spin,
      .animate-ping,
      .animate-pulse,
      .animate-bounce {
        animation: none !important;
      }
      
      /* Provide static alternatives for important visual feedback */
      .motion-safe-emphasis {
        border: 2px solid currentColor !important;
        font-weight: bold !important;
      }
      
      .motion-safe-success {
        background-color: #10b981 !important;
        color: white !important;
      }
      
      .motion-safe-warning {
        background-color: #f59e0b !important;
        color: white !important;
      }
      
      .motion-safe-error {
        background-color: #ef4444 !important;
        color: white !important;
      }
    }
  `;
  
  if (!document.head.querySelector('#reduced-motion-styles')) {
    style.id = 'reduced-motion-styles';
    document.head.appendChild(style);
  }
};

// Initialize reduced motion support when the module loads
if (typeof window !== 'undefined') {
  addReducedMotionCSS();
}

export default {
  useMotionPreferences,
  getSafeAnimationProps,
  getSafeAnimationConfig,
  getMotionSafeClasses,
  getMotionSafeTimeout,
  getMotionSafeTransform,
  addReducedMotionCSS,
  animationConfigs
};