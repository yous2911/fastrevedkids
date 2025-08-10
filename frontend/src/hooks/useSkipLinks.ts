/**
 * Hook for automatic skip links integration
 * Manages skip link state and provides utilities for skip link management
 */

import { useEffect, useState, useCallback } from 'react';

interface SkipLinkConfig {
  autoDetect?: boolean;
  customSelectors?: Array<{
    selector: string;
    label: string;
    priority?: number;
  }>;
  maxLinks?: number;
}

interface UseSkipLinksReturn {
  skipLinks: Array<{
    id: string;
    label: string;
    target: string;
    priority: number;
  }>;
  addSkipLink: (selector: string, label: string, priority?: number) => void;
  removeSkipLink: (target: string) => void;
  refreshSkipLinks: () => void;
}

export const useSkipLinks = (config: SkipLinkConfig = {}): UseSkipLinksReturn => {
  const {
    autoDetect = true,
    customSelectors = [],
    maxLinks = 8
  } = config;

  const [skipLinks, setSkipLinks] = useState<Array<{
    id: string;
    label: string;
    target: string;
    priority: number;
  }>>([]);

  // Use window.location for route detection since react-router is not used
  const [pathname, setPathname] = useState(window.location.pathname);
  
  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };
    
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const detectLandmarks = useCallback(() => {
    const detectedLinks: Array<{
      id: string;
      label: string;
      target: string;
      priority: number;
    }> = [];

    // Route-specific selectors
    const routeSelectors = getRouteSpecificSelectors(pathname);

    // Combined selectors
    const allSelectors = [
      ...getDefaultSelectors(),
      ...routeSelectors,
      ...customSelectors
    ];

    allSelectors.forEach(({ selector, label, priority = 5 }) => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach((element, index) => {
        // Ensure element has an ID
        let targetId = element.id;
        if (!targetId) {
          targetId = generateId(label, index);
          element.id = targetId;
        }

        // Add ARIA landmark if not present
        addLandmarkRole(element, selector);

        // Verify element is accessible
        if (isElementAccessible(element)) {
          detectedLinks.push({
            id: `skip-${targetId}`,
            label: elements.length > 1 ? `${label} ${index + 1}` : label,
            target: `#${targetId}`,
            priority
          });
        }
      });
    });

    // Sort by priority and limit
    const sortedLinks = detectedLinks
      .sort((a, b) => a.priority - b.priority)
      .slice(0, maxLinks);

    setSkipLinks(sortedLinks);
  }, [pathname, customSelectors, maxLinks]);

  const addSkipLink = useCallback((selector: string, label: string, priority = 5) => {
    const element = document.querySelector(selector);
    if (element) {
      let targetId = element.id;
      if (!targetId) {
        targetId = generateId(label);
        element.id = targetId;
      }

      const newLink = {
        id: `skip-${targetId}`,
        label,
        target: `#${targetId}`,
        priority
      };

      setSkipLinks(prev => {
        const filtered = prev.filter(link => link.target !== newLink.target);
        return [...filtered, newLink]
          .sort((a, b) => a.priority - b.priority)
          .slice(0, maxLinks);
      });
    }
  }, [maxLinks]);

  const removeSkipLink = useCallback((target: string) => {
    setSkipLinks(prev => prev.filter(link => link.target !== target));
  }, []);

  const refreshSkipLinks = useCallback(() => {
    if (autoDetect) {
      // Small delay to ensure DOM is updated
      setTimeout(detectLandmarks, 100);
    }
  }, [autoDetect, detectLandmarks]);

  // Auto-detect on route change and DOM updates
  useEffect(() => {
    if (autoDetect) {
      detectLandmarks();
      
      // Re-detect when DOM changes
      const observer = new MutationObserver(() => {
        detectLandmarks();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['id', 'role', 'aria-label']
      });

      return () => observer.disconnect();
    }
  }, [autoDetect, detectLandmarks]);

  return {
    skipLinks,
    addSkipLink,
    removeSkipLink,
    refreshSkipLinks
  };
};

// Helper functions
function getDefaultSelectors() {
  return [
    { selector: 'main[role="main"], main, [role="main"]', label: 'Contenu principal', priority: 1 },
    { selector: 'nav[role="navigation"], nav, [role="navigation"]', label: 'Navigation', priority: 2 },
    { selector: '[role="search"], .search-form, .search-container', label: 'Recherche', priority: 3 },
    { selector: 'aside[role="complementary"], aside, [role="complementary"]', label: 'Contenu complémentaire', priority: 4 },
    { selector: 'footer[role="contentinfo"], footer, [role="contentinfo"]', label: 'Pied de page', priority: 6 },
    { selector: 'header[role="banner"], header, [role="banner"]', label: 'En-tête', priority: 5 }
  ];
}

function getRouteSpecificSelectors(pathname: string) {
  const routeMap: Record<string, Array<{ selector: string; label: string; priority: number }>> = {
    '/dashboard': [
      { selector: '.dashboard-main, .dashboard-container', label: 'Tableau de bord', priority: 1 },
      { selector: '.progress-summary', label: 'Résumé des progrès', priority: 2 },
      { selector: '.recent-activities', label: 'Activités récentes', priority: 3 }
    ],
    '/exercises': [
      { selector: '.exercises-list, .exercise-grid', label: 'Liste des exercices', priority: 1 },
      { selector: '.exercise-filters', label: 'Filtres d\'exercices', priority: 2 },
      { selector: '.exercise-categories', label: 'Catégories d\'exercices', priority: 3 }
    ],
    '/exercise': [
      { selector: '.exercise-container, .exercise-content', label: 'Exercice', priority: 1 },
      { selector: '.exercise-instructions', label: 'Instructions', priority: 2 },
      { selector: '.exercise-controls', label: 'Contrôles de l\'exercice', priority: 3 }
    ],
    '/profile': [
      { selector: '.profile-section, .profile-container', label: 'Profil', priority: 1 },
      { selector: '.profile-settings', label: 'Paramètres du profil', priority: 2 },
      { selector: '.profile-stats', label: 'Statistiques', priority: 3 }
    ],
    '/progress': [
      { selector: '.progress-section, .progress-container', label: 'Progression', priority: 1 },
      { selector: '.progress-charts', label: 'Graphiques de progression', priority: 2 },
      { selector: '.progress-details', label: 'Détails de progression', priority: 3 }
    ]
  };

  // Match exact path or partial path
  for (const [route, selectors] of Object.entries(routeMap)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return selectors;
    }
  }

  return [];
}

function generateId(label: string, index = 0): string {
  const baseId = label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return index > 0 ? `${baseId}-${index}` : baseId;
}

function addLandmarkRole(element: Element, selector: string) {
  if (!element.getAttribute('role')) {
    const roleMap: Record<string, string> = {
      'main': 'main',
      'nav': 'navigation',
      'aside': 'complementary',
      'footer': 'contentinfo',
      'header': 'banner',
      '.search': 'search'
    };

    for (const [key, role] of Object.entries(roleMap)) {
      if (selector.includes(key)) {
        element.setAttribute('role', role);
        break;
      }
    }
  }
}

function isElementAccessible(element: Element): boolean {
  // Check if element is visible
  const computedStyle = window.getComputedStyle(element as HTMLElement);
  if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
    return false;
  }

  // Check if element has content or interactive elements
  const hasTextContent = (element.textContent?.trim().length ?? 0) > 0;
  const hasInteractiveContent = element.querySelector('input, button, a, select, textarea');
  
  if (!hasTextContent && !hasInteractiveContent) {
    return false;
  }

  // Check dimensions
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }

  return true;
}