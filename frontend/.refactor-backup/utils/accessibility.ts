// Accessibility utilities for enhanced components
// Provides comprehensive a11y support including WCAG compliance

import { useEffect, useState, useRef } from 'react';

// WCAG color contrast utilities
export const calculateContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

// WCAG-compliant color combinations
export const wcagColors = {
  // High contrast colors (7:1 ratio for AAA compliance)
  highContrast: {
    primary: {
      background: '#000000',
      text: '#FFFFFF',
      accent: '#FFFF00'
    },
    secondary: {
      background: '#FFFFFF', 
      text: '#000000',
      accent: '#0000FF'
    }
  },
  // Standard contrast colors (4.5:1 ratio for AA compliance)
  standard: {
    primary: {
      background: '#1a1a1a',
      text: '#ffffff',
      accent: '#4ade80'
    },
    secondary: {
      background: '#f8fafc',
      text: '#1e293b',
      accent: '#3b82f6'
    }
  },
  // Theme-aware colors that meet WCAG standards
  themes: {
    magic: {
      background: '#1e1b4b',
      text: '#e2e8f0',
      accent: '#c084fc',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    fire: {
      background: '#7c1d02',
      text: '#fef2f2',
      accent: '#fb923c',
      success: '#22c55e',
      warning: '#fbbf24',
      error: '#dc2626'
    },
    water: {
      background: '#0c4a6e',
      text: '#f0f9ff',
      accent: '#38bdf8',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    }
  }
};

// Screen reader utilities
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Custom hook for screen reader announcements
export const useScreenReader = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  };

  return { announce };
};

// Reduced motion detection
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Focus management utilities
export const useFocusManagement = () => {
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  const trapFocus = (container: HTMLElement) => {
    const focusableEls = container.querySelectorAll(focusableElements);
    const firstFocusableEl = focusableEls[0] as HTMLElement;
    const lastFocusableEl = focusableEls[focusableEls.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusableEl) {
          lastFocusableEl.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusableEl) {
          firstFocusableEl.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };

  const focusFirst = (container: HTMLElement) => {
    const firstFocusable = container.querySelector(focusableElements) as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    }
  };

  return { trapFocus, focusFirst };
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  items: any[],
  onSelect?: (index: number) => void,
  options?: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
  }
) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { loop = true, orientation = 'horizontal' } = options || {};

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          e.preventDefault();
          newIndex = loop ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          e.preventDefault();
          newIndex = loop ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical') {
          e.preventDefault();
          newIndex = loop ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          e.preventDefault();
          newIndex = loop ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(currentIndex);
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
    isSelected: (index: number) => index === currentIndex
  };
};

// ARIA label generators
export const generateAriaLabel = {
  progress: (current: number, max: number, label: string = 'Progression') => 
    `${label}: ${current} sur ${max}, ${Math.round((current / max) * 100)} pour cent`,
  
  level: (level: number, xp: number, nextLevelXp: number) =>
    `Niveau ${level}, ${xp} points d'expérience, ${nextLevelXp - xp} points nécessaires pour le niveau suivant`,
  
  item: (name: string, rarity: string, unlocked: boolean, equipped: boolean) => {
    let label = `${name}, rareté ${rarity}`;
    if (!unlocked) label += ', verrouillé';
    if (equipped) label += ', équipé';
    return label;
  },
  
  mascot: (type: string, emotion: string, equippedItems: string[]) =>
    `Mascotte ${type}, émotion ${emotion}, ${equippedItems.length} objets équipés: ${equippedItems.join(', ')}`,
  
  button: (action: string, disabled: boolean = false) => {
    let label = action;
    if (disabled) label += ', désactivé';
    return label;
  }
};

// Color contrast checker
export const checkColorContrast = (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
  const ratio = calculateContrastRatio(foreground, background);
  const required = level === 'AAA' ? 7 : 4.5;
  return ratio >= required;
};

// High contrast mode detection
export const useHighContrast = (): boolean => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const checkHighContrast = () => {
      // Check for Windows high contrast mode
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        setIsHighContrast(true);
        return;
      }

      // Check for forced colors (Windows high contrast)
      if (window.matchMedia('(forced-colors: active)').matches) {
        setIsHighContrast(true);
        return;
      }

      // Check for high contrast preference
      const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
      setIsHighContrast(highContrastQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setIsHighContrast(e.matches);
      };

      highContrastQuery.addEventListener('change', handleChange);
      return () => highContrastQuery.removeEventListener('change', handleChange);
    };

    checkHighContrast();
  }, []);

  return isHighContrast;
};

// Theme-aware color getter
export const getAccessibleColor = (
  theme: string, 
  type: 'background' | 'text' | 'accent' | 'success' | 'warning' | 'error',
  highContrast: boolean = false
): string => {
  if (highContrast) {
    return type === 'background' ? '#000000' : '#FFFFFF';
  }

  const themeColors = wcagColors.themes[theme as keyof typeof wcagColors.themes];
  if (themeColors) {
    return themeColors[type];
  }

  // Fallback to standard colors
  return wcagColors.standard.primary[type as keyof typeof wcagColors.standard.primary] || '#000000';
};

// Animation utilities for reduced motion
export const getAnimationProps = (reduceMotion: boolean, normalProps: any, reducedProps: any = {}) => {
  return reduceMotion ? { ...normalProps, ...reducedProps } : normalProps;
};

// Focus visible utility
export const useFocusVisible = () => {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleFocus = () => setIsFocusVisible(true);
    const handleBlur = () => setIsFocusVisible(false);
    const handleMouseDown = () => setIsFocusVisible(false);

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);
    element.addEventListener('mousedown', handleMouseDown);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
      element.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return { ref, isFocusVisible };
};

// Skip link utility
export const createSkipLink = (targetId: string, label: string = 'Passer au contenu principal') => {
  return {
    targetId,
    label,
    href: `#${targetId}`,
    className: "sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white focus:no-underline",
    onFocus: (e: Event) => {
      // Ensure the target exists
      const target = document.getElementById(targetId);
      if (!target) {
        e.preventDefault();
        console.warn(`Skip link target #${targetId} not found`);
      }
    }
  };
};