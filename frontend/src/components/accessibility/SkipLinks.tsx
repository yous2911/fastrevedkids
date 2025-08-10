/**
 * Automatic Skip Links Component
 * Generates skip links based on page structure and landmarks
 */

import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface SkipLink {
  id: string;
  label: string;
  target: string;
  priority: number;
}

interface SkipLinksProps {
  customLinks?: SkipLink[];
  autoDetect?: boolean;
  className?: string;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({
  customLinks = [],
  autoDetect = true,
  className = ''
}) => {
  const [skipLinks, setSkipLinks] = useState<SkipLink[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const skipLinksRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Auto-detect landmarks and important sections
  useEffect(() => {
    if (!autoDetect) {
      setSkipLinks(customLinks);
      return;
    }

    const detectSkipLinks = () => {
      const detectedLinks: SkipLink[] = [];

      // Standard landmarks with priorities
      const landmarkSelectors = [
        { selector: 'main[role="main"], main', label: 'Contenu principal', priority: 1 },
        { selector: 'nav[role="navigation"], nav', label: 'Navigation', priority: 2 },
        { selector: '[role="search"], .search-form', label: 'Recherche', priority: 3 },
        { selector: 'aside[role="complementary"], aside', label: 'Contenu complémentaire', priority: 4 },
        { selector: 'footer[role="contentinfo"], footer', label: 'Pied de page', priority: 5 },
        { selector: '[role="banner"], header', label: 'En-tête', priority: 6 }
      ];

      // Educational content specific landmarks
      const educationalSelectors = [
        { selector: '.exercise-container', label: 'Exercice', priority: 1 },
        { selector: '.dashboard-main', label: 'Tableau de bord', priority: 1 },
        { selector: '.progress-section', label: 'Progression', priority: 2 },
        { selector: '.exercises-list', label: 'Liste des exercices', priority: 2 },
        { selector: '.profile-section', label: 'Profil', priority: 3 },
        { selector: '.settings-panel', label: 'Paramètres', priority: 4 }
      ];

      const allSelectors = [...landmarkSelectors, ...educationalSelectors];

      allSelectors.forEach(({ selector, label, priority }) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
          let targetId = element.id;
          
          if (!targetId) {
            // Generate ID if not present
            targetId = `skip-target-${label.toLowerCase().replace(/\s+/g, '-')}${index > 0 ? `-${index}` : ''}`;
            element.id = targetId;
          }

          // Check if element is actually visible and contains content
          const rect = element.getBoundingClientRect();
          const isVisible = rect.height > 0 && rect.width > 0;
          const hasContent = (element.textContent?.trim().length || 0) > 0 || !!element.querySelector('input, button, a');

          if (isVisible && hasContent) {
            detectedLinks.push({
              id: `skip-link-${targetId}`,
              label: elements.length > 1 ? `${label} ${index + 1}` : label,
              target: `#${targetId}`,
              priority
            });
          }
        });
      });

      // Add custom links
      detectedLinks.push(...customLinks);

      // Sort by priority and remove duplicates
      const uniqueLinks = detectedLinks
        .filter((link, index, self) => 
          self.findIndex(l => l.target === link.target) === index
        )
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 8); // Limit to 8 links to avoid clutter

      setSkipLinks(uniqueLinks);
    };

    // Detect links after DOM is ready
    const timer = setTimeout(detectSkipLinks, 100);

    // Re-detect when route changes
    detectSkipLinks();

    return () => clearTimeout(timer);
  }, [location.pathname, customLinks, autoDetect]);

  // Handle skip link activation
  const handleSkipToContent = (target: string, event: React.MouseEvent | React.KeyboardEvent) => {
    event.preventDefault();
    
    const targetElement = document.querySelector(target);
    if (targetElement) {
      // Ensure element is focusable
      const focusableElement = targetElement as HTMLElement;
      
      if (!focusableElement.getAttribute('tabindex')) {
        focusableElement.setAttribute('tabindex', '-1');
      }

      // Scroll to element and focus
      focusableElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });

      // Focus with a slight delay to ensure scrolling completes
      setTimeout(() => {
        focusableElement.focus();
        
        // Remove tabindex if we added it
        if (focusableElement.getAttribute('tabindex') === '-1') {
          focusableElement.removeAttribute('tabindex');
        }
      }, 300);

      // Hide skip links after activation
      setIsVisible(false);
      
      // Announce to screen readers
      const announcement = `Navigué vers ${targetElement.textContent?.split(' ').slice(0, 5).join(' ') || 'section'}`;
      announceToScreenReader(announcement);
    }
  };

  // Handle keyboard navigation within skip links
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    const links = skipLinksRef.current?.querySelectorAll('a');
    
    if (!links) return;
    
    const currentIndex = Array.from(links).findIndex(link => link === document.activeElement);
    
    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % links.length;
        (links[nextIndex] as HTMLElement).focus();
        break;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = currentIndex <= 0 ? links.length - 1 : currentIndex - 1;
        (links[prevIndex] as HTMLElement).focus();
        break;
        
      case 'Escape':
        setIsVisible(false);
        (document.activeElement as HTMLElement)?.blur();
        break;
    }
  };

  // Show skip links on focus
  const handleFocus = () => {
    setIsVisible(true);
  };

  // Hide skip links when focus leaves the container
  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    // Check if the new focus target is within skip links
    if (!skipLinksRef.current?.contains(event.relatedTarget as Node)) {
      setIsVisible(false);
    }
  };

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  if (skipLinks.length === 0) {
    return null;
  }

  return (
    <div
      ref={skipLinksRef}
      className={`skip-links ${className}`}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      role="navigation"
      aria-label="Liens d'accès rapide"
    >
      <div
        className={`skip-links-container ${
          isVisible ? 'skip-links-visible' : 'skip-links-hidden'
        }`}
      >
        {skipLinks.map((link) => (
          <a
            key={link.id}
            href={link.target}
            className="skip-link"
            onFocus={handleFocus}
            onClick={(e) => handleSkipToContent(link.target, e)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleSkipToContent(link.target, e);
              }
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      <style>{`
        .skip-links {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10000;
          pointer-events: none;
        }

        .skip-links-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 1rem;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-bottom: 3px solid #60a5fa;
        }

        .skip-links-hidden {
          transform: translateY(-100%);
          transition: transform 0.2s ease-out;
          pointer-events: none;
        }

        .skip-links-visible {
          transform: translateY(0);
          transition: transform 0.2s ease-out;
          pointer-events: all;
        }

        .skip-link {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.95);
          color: #1e3a8a;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
          border: 2px solid transparent;
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          pointer-events: all;
          white-space: nowrap;
        }

        .skip-link:hover,
        .skip-link:focus {
          background: #ffffff;
          color: #1e3a8a;
          border-color: #60a5fa;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
          outline: none;
        }

        .skip-link:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.5);
        }

        .skip-link:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Screen reader only class */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .skip-links-container {
            background: #000000;
            border-bottom-color: #ffffff;
          }

          .skip-link {
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
          }

          .skip-link:hover,
          .skip-link:focus {
            background: #000000;
            color: #ffffff;
            border-color: #ffffff;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .skip-links-container,
          .skip-link {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default SkipLinks;