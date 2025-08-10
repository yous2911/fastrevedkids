/**
 * React Hook for ARIA Intelligence Enhancement
 * Provides easy integration with the ARIA Intelligence Service
 */

import { useEffect, useRef, useCallback } from 'react';
import { ariaIntelligence } from '../services/aria-intelligence.service';

interface UseARIAEnhancementOptions {
  autoEnhance?: boolean;
  watchForChanges?: boolean;
  customRules?: Array<{
    selector: string;
    role?: string;
    labelStrategy: 'content' | 'attribute' | 'context' | 'function' | 'generated';
    labelSource?: string;
    labelTemplate?: string;
    priority?: number;
  }>;
}

export const useARIAEnhancement = (options: UseARIAEnhancementOptions = {}) => {
  const {
    autoEnhance = true,
    watchForChanges = true,
    customRules = []
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const enhancedRef = useRef(false);

  // Add custom rules on mount
  useEffect(() => {
    customRules.forEach(rule => {
      ariaIntelligence.addRule({
        ...rule,
        priority: rule.priority || 5
      });
    });

    return () => {
      // Cleanup custom rules on unmount
      customRules.forEach(rule => {
        ariaIntelligence.removeRule(rule.selector);
      });
    };
  }, [customRules]);

  // Enhance accessibility for the container
  const enhanceContainer = useCallback(() => {
    if (containerRef.current && !enhancedRef.current) {
      ariaIntelligence.enhanceAccessibility(containerRef.current);
      enhancedRef.current = true;
    }
  }, []);

  // Auto-enhance on mount and when dependencies change
  useEffect(() => {
    if (autoEnhance) {
      const timer = setTimeout(enhanceContainer, 100);
      return () => clearTimeout(timer);
    }
  }, [autoEnhance, enhanceContainer]);

  // Watch for DOM changes and re-enhance
  useEffect(() => {
    if (!watchForChanges || !containerRef.current) return;

    const observer = new MutationObserver(() => {
      enhancedRef.current = false;
      enhanceContainer();
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id']
    });

    return () => observer.disconnect();
  }, [watchForChanges, enhanceContainer]);

  // Manual enhancement function
  const enhanceElement = useCallback((element: Element) => {
    ariaIntelligence.updateElement(element);
  }, []);

  // Enhance specific selector
  const enhanceSelector = useCallback((selector: string, root?: Element) => {
    const elements = (root || containerRef.current || document).querySelectorAll(selector);
    elements.forEach(enhanceElement);
  }, [enhanceElement]);

  return {
    containerRef,
    enhanceContainer,
    enhanceElement,
    enhanceSelector,
    isEnhanced: enhancedRef.current
  };
};

/**
 * Hook specifically for educational content enhancement
 */
export const useEducationalARIA = () => {
  return useARIAEnhancement({
    autoEnhance: true,
    watchForChanges: true,
    customRules: [
      {
        selector: '.exercise-title, .lesson-title',
        role: 'heading',
        labelStrategy: 'content',
        priority: 1
      },
      {
        selector: '.exercise-instructions',
        role: 'region',
        labelStrategy: 'function',
        labelTemplate: 'Instructions de l\'exercice',
        priority: 1
      },
      {
        selector: '.exercise-input',
        labelStrategy: 'context',
        labelTemplate: 'Réponse: {context}',
        priority: 1
      },
      {
        selector: '.score-display',
        role: 'status',
        labelStrategy: 'content',
        labelTemplate: 'Score actuel: {content}',
        priority: 1
      },
      {
        selector: '.progress-indicator',
        role: 'progressbar',
        labelStrategy: 'function',
        labelTemplate: 'Progression de l\'exercice',
        priority: 1
      },
      {
        selector: '.hint-button',
        labelStrategy: 'function',
        labelTemplate: 'Afficher un indice',
        priority: 2
      },
      {
        selector: '.solution-button',
        labelStrategy: 'function',
        labelTemplate: 'Afficher la solution',
        priority: 2
      },
      {
        selector: '.next-exercise',
        labelStrategy: 'function',
        labelTemplate: 'Passer à l\'exercice suivant',
        priority: 2
      },
      {
        selector: '.prev-exercise',
        labelStrategy: 'function',
        labelTemplate: 'Revenir à l\'exercice précédent',
        priority: 2
      }
    ]
  });
};

/**
 * Hook for form enhancement
 */
export const useFormARIA = () => {
  return useARIAEnhancement({
    autoEnhance: true,
    watchForChanges: true,
    customRules: [
      {
        selector: 'form:not([aria-label]):not([aria-labelledby])',
        role: 'form',
        labelStrategy: 'context',
        priority: 1
      },
      {
        selector: '.form-group',
        role: 'group',
        labelStrategy: 'context',
        priority: 2
      },
      {
        selector: '.error-message',
        role: 'alert',
        labelStrategy: 'content',
        priority: 1
      },
      {
        selector: '.success-message',
        role: 'status',
        labelStrategy: 'content',
        priority: 1
      },
      {
        selector: '.required-field',
        labelStrategy: 'function',
        labelTemplate: '{context} (requis)',
        priority: 1
      }
    ]
  });
};

/**
 * Hook for navigation enhancement
 */
export const useNavigationARIA = () => {
  return useARIAEnhancement({
    autoEnhance: true,
    watchForChanges: false, // Navigation usually doesn't change
    customRules: [
      {
        selector: '.nav-menu',
        role: 'navigation',
        labelStrategy: 'function',
        labelTemplate: 'Menu principal',
        priority: 1
      },
      {
        selector: '.breadcrumb',
        role: 'navigation',
        labelStrategy: 'function',
        labelTemplate: 'Fil d\'Ariane',
        priority: 1
      },
      {
        selector: '.pagination',
        role: 'navigation',
        labelStrategy: 'function',
        labelTemplate: 'Pagination',
        priority: 2
      },
      {
        selector: '.nav-item.active',
        labelStrategy: 'content',
        labelTemplate: '{content} (page actuelle)',
        priority: 1
      }
    ]
  });
};