/**
 * Smart ARIA Labels and Auto-Roles Service
 * Intelligently generates ARIA labels and assigns roles based on content and context
 */

interface ARIARule {
  selector: string;
  role?: string;
  labelStrategy: 'content' | 'attribute' | 'context' | 'function' | 'generated';
  labelSource?: string;
  labelTemplate?: string;
  priority: number;
}

interface ElementContext {
  element: Element;
  parentContext?: string;
  siblingCount?: number;
  indexInSiblings?: number;
  contentType?: string;
  interactionType?: string;
}

export class ARIAIntelligenceService {
  private static instance: ARIAIntelligenceService;
  private rules: ARIARule[] = [];
  private labelCache = new Map<Element, string>();
  private observer?: MutationObserver;

  private constructor() {
    this.initializeDefaultRules();
    this.startObserving();
  }

  public static getInstance(): ARIAIntelligenceService {
    if (!ARIAIntelligenceService.instance) {
      ARIAIntelligenceService.instance = new ARIAIntelligenceService();
    }
    return ARIAIntelligenceService.instance;
  }

  /**
   * Initialize default ARIA rules for common patterns
   */
  private initializeDefaultRules(): void {
    this.rules = [
      // Educational content rules
      {
        selector: '.exercise-container, .exercise-content',
        role: 'region',
        labelStrategy: 'context',
        labelTemplate: 'Exercice: {exerciseTitle}',
        priority: 1
      },
      {
        selector: '.exercise-question, .question',
        role: 'group',
        labelStrategy: 'content',
        labelTemplate: 'Question: {content}',
        priority: 2
      },
      {
        selector: '.exercise-feedback, .feedback',
        role: 'status',
        labelStrategy: 'function',
        labelTemplate: 'Feedback de l\'exercice',
        priority: 2
      },
      {
        selector: '.progress-bar, .progress-indicator',
        role: 'progressbar',
        labelStrategy: 'function',
        labelTemplate: 'Progression: {percentage}%',
        priority: 1
      },
      {
        selector: '.score-display, .points-display',
        role: 'status',
        labelStrategy: 'content',
        labelTemplate: 'Score: {content}',
        priority: 2
      },

      // Navigation and interaction rules
      {
        selector: 'button:not([aria-label]):not([aria-labelledby])',
        labelStrategy: 'function',
        priority: 1
      },
      {
        selector: 'a:not([aria-label]):not([aria-labelledby])',
        labelStrategy: 'function',
        priority: 1
      },
      {
        selector: 'input[type="text"], input[type="email"], input[type="password"]',
        labelStrategy: 'context',
        priority: 1
      },
      {
        selector: 'select:not([aria-label]):not([aria-labelledby])',
        labelStrategy: 'context',
        priority: 1
      },

      // Content structure rules
      {
        selector: '.card, .content-card',
        role: 'article',
        labelStrategy: 'content',
        priority: 3
      },
      {
        selector: '.sidebar, .side-panel',
        role: 'complementary',
        labelStrategy: 'function',
        labelTemplate: 'Panneau latéral',
        priority: 3
      },
      {
        selector: '.modal, .dialog',
        role: 'dialog',
        labelStrategy: 'context',
        priority: 1
      },
      {
        selector: '.tabs',
        role: 'tablist',
        labelStrategy: 'function',
        labelTemplate: 'Onglets',
        priority: 2
      },
      {
        selector: '.tab',
        role: 'tab',
        labelStrategy: 'content',
        priority: 2
      },
      {
        selector: '.tab-panel',
        role: 'tabpanel',
        labelStrategy: 'context',
        priority: 2
      },

      // Lists and grids
      {
        selector: '.grid, .data-grid',
        role: 'grid',
        labelStrategy: 'context',
        priority: 2
      },
      {
        selector: '.list-item:not(li)',
        role: 'listitem',
        labelStrategy: 'content',
        priority: 3
      },

      // Interactive widgets
      {
        selector: '.toggle, .switch',
        role: 'switch',
        labelStrategy: 'function',
        priority: 1
      },
      {
        selector: '.slider',
        role: 'slider',
        labelStrategy: 'function',
        priority: 1
      },
      {
        selector: '.spinner',
        role: 'progressbar',
        labelStrategy: 'function',
        labelTemplate: 'Chargement en cours',
        priority: 1
      }
    ];
  }

  /**
   * Apply ARIA labels and roles to all elements
   */
  public enhanceAccessibility(root: Element = document.body): void {
    const processed = new Set<Element>();

    this.rules
      .sort((a, b) => a.priority - b.priority)
      .forEach(rule => {
        const elements = root.querySelectorAll(rule.selector);
        
        elements.forEach(element => {
          if (processed.has(element)) return;
          
          this.applyRule(element, rule);
          processed.add(element);
        });
      });

    console.log(`🏷️ Enhanced accessibility for ${processed.size} elements`);
  }

  /**
   * Apply a specific ARIA rule to an element
   */
  private applyRule(element: Element, rule: ARIARule): void {
    const htmlElement = element as HTMLElement;
    
    // Apply role if specified and not already present
    if (rule.role && !element.getAttribute('role')) {
      element.setAttribute('role', rule.role);
    }

    // Apply ARIA label if not already present
    if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
      const label = this.generateLabel(element, rule);
      if (label) {
        element.setAttribute('aria-label', label);
        this.labelCache.set(element, label);
      }
    }

    // Add additional ARIA attributes based on role
    this.addRoleSpecificAttributes(htmlElement, rule.role);
  }

  /**
   * Generate intelligent ARIA label based on strategy
   */
  private generateLabel(element: Element, rule: ARIARule): string | null {
    const context = this.analyzeElementContext(element);

    switch (rule.labelStrategy) {
      case 'content':
        return this.generateContentLabel(element, rule.labelTemplate);
      
      case 'attribute':
        return this.generateAttributeLabel(element, rule.labelSource);
      
      case 'context':
        return this.generateContextLabel(element, context, rule.labelTemplate);
      
      case 'function':
        return this.generateFunctionLabel(element, context, rule.labelTemplate);
      
      case 'generated':
        return this.generateSmartLabel(element, context);
      
      default:
        return this.generateSmartLabel(element, context);
    }
  }

  /**
   * Generate label from element content
   */
  private generateContentLabel(element: Element, template?: string): string | null {
    const textContent = element.textContent?.trim();
    if (!textContent) return null;

    if (template) {
      return template.replace('{content}', textContent);
    }

    return textContent.length > 50 
      ? textContent.substring(0, 47) + '...'
      : textContent;
  }

  /**
   * Generate label from element attributes
   */
  private generateAttributeLabel(element: Element, source?: string): string | null {
    if (source) {
      return element.getAttribute(source);
    }

    // Try common label sources
    const labelSources = ['title', 'alt', 'placeholder', 'data-label', 'name'];
    for (const attr of labelSources) {
      const value = element.getAttribute(attr);
      if (value) return value;
    }

    return null;
  }

  /**
   * Generate label from context
   */
  private generateContextLabel(element: Element, context: ElementContext, template?: string): string | null {
    const htmlElement = element as HTMLElement;

    // For form inputs, look for associated labels
    if (htmlElement.tagName === 'INPUT' || htmlElement.tagName === 'SELECT' || htmlElement.tagName === 'TEXTAREA') {
      const associatedLabel = this.findAssociatedLabel(htmlElement);
      if (associatedLabel) return associatedLabel;
    }

    // Look for nearby text that might serve as a label
    const nearbyLabel = this.findNearbyLabel(element);
    if (nearbyLabel && template) {
      return template.replace('{context}', nearbyLabel);
    }

    return nearbyLabel;
  }

  /**
   * Generate label based on element function
   */
  private generateFunctionLabel(element: Element, context: ElementContext, template?: string): string | null {
    const htmlElement = element as HTMLElement;
    const tagName = htmlElement.tagName.toLowerCase();

    // Button labels
    if (tagName === 'button') {
      const iconLabel = this.interpretIcon(element);
      if (iconLabel) return iconLabel;

      if (template) return template;
      return this.getButtonFunctionLabel(htmlElement);
    }

    // Link labels
    if (tagName === 'a') {
      const href = htmlElement.getAttribute('href');
      if (href) {
        if (href.startsWith('#')) return `Aller à ${href.substring(1)}`;
        if (href.startsWith('mailto:')) return `Envoyer email à ${href.substring(7)}`;
        if (href.startsWith('tel:')) return `Appeler ${href.substring(4)}`;
      }
      return 'Lien';
    }

    // Use template if provided
    if (template) {
      return this.interpolateTemplate(template, context);
    }

    return null;
  }

  /**
   * Generate smart label using AI-like analysis
   */
  private generateSmartLabel(element: Element, context: ElementContext): string | null {
    const htmlElement = element as HTMLElement;
    
    // Check for visual cues
    const iconLabel = this.interpretIcon(element);
    if (iconLabel) return iconLabel;

    // Check for semantic classes
    const semanticLabel = this.interpretSemanticClasses(element);
    if (semanticLabel) return semanticLabel;

    // Check element purpose based on parent context
    const contextualLabel = this.inferFromContext(element, context);
    if (contextualLabel) return contextualLabel;

    // Fallback to content or type-based label
    const contentLabel = this.generateContentLabel(element);
    if (contentLabel) return contentLabel;

    return this.getGenericLabel(htmlElement);
  }

  /**
   * Analyze element context for better label generation
   */
  private analyzeElementContext(element: Element): ElementContext {
    const parent = element.parentElement;
    const siblings = parent ? Array.from(parent.children) : [];
    
    return {
      element,
      parentContext: parent?.className || parent?.tagName || '',
      siblingCount: siblings.length,
      indexInSiblings: siblings.indexOf(element),
      contentType: this.inferContentType(element),
      interactionType: this.inferInteractionType(element)
    };
  }

  /**
   * Find associated label for form elements
   */
  private findAssociatedLabel(element: HTMLElement): string | null {
    const id = element.id;
    
    // Look for label with for attribute
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent?.trim() || null;
    }

    // Look for wrapping label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      return parentLabel.textContent?.replace(element.textContent || '', '').trim() || null;
    }

    // Look for nearby text
    return this.findNearbyLabel(element);
  }

  /**
   * Find nearby text that could serve as a label
   */
  private findNearbyLabel(element: Element): string | null {
    const parent = element.parentElement;
    if (!parent) return null;

    // Check siblings for text nodes or label elements
    const siblings = Array.from(parent.children);
    const elementIndex = siblings.indexOf(element);

    // Check previous sibling
    if (elementIndex > 0) {
      const prevSibling = siblings[elementIndex - 1];
      const text = prevSibling.textContent?.trim();
      if (text && text.length < 100) return text;
    }

    // Check parent for descriptive text
    const parentText = parent.textContent?.trim();
    const elementText = element.textContent?.trim();
    if (parentText && elementText) {
      const descriptiveText = parentText.replace(elementText, '').trim();
      if (descriptiveText && descriptiveText.length < 100) {
        return descriptiveText;
      }
    }

    return null;
  }

  /**
   * Interpret icons to generate meaningful labels
   */
  private interpretIcon(element: Element): string | null {
    const iconMap: Record<string, string> = {
      // Common icon classes
      'fa-home': 'Accueil',
      'fa-user': 'Profil utilisateur',
      'fa-search': 'Rechercher',
      'fa-menu': 'Menu',
      'fa-close': 'Fermer',
      'fa-edit': 'Modifier',
      'fa-delete': 'Supprimer',
      'fa-save': 'Enregistrer',
      'fa-download': 'Télécharger',
      'fa-upload': 'Téléverser',
      'fa-play': 'Lire',
      'fa-pause': 'Pause',
      'fa-stop': 'Arrêter',
      'fa-next': 'Suivant',
      'fa-prev': 'Précédent',
      'fa-back': 'Retour',
      'fa-forward': 'Avancer',
      'fa-settings': 'Paramètres',
      'fa-help': 'Aide',
      'fa-info': 'Information',
      'fa-warning': 'Attention',
      'fa-error': 'Erreur',
      'fa-success': 'Succès',

      // Educational icons
      'fa-book': 'Manuel',
      'fa-pencil': 'Écrire',
      'fa-calculator': 'Calculatrice',
      'fa-graduation-cap': 'Éducation',
      'fa-trophy': 'Réussite',
      'fa-star': 'Étoile',
      'fa-heart': 'Favoris',
      'fa-eye': 'Voir',
      'fa-eye-slash': 'Masquer'
    };

    const classNames = element.className.split(' ');
    for (const className of classNames) {
      if (iconMap[className]) {
        return iconMap[className];
      }
    }

    // Check for Unicode icons in content
    const content = element.textContent?.trim();
    if (content && /^[\u2000-\u2BFF\u2600-\u26FF\u2700-\u27BF]$/.test(content)) {
      // Common Unicode symbols
      const unicodeMap: Record<string, string> = {
        '✓': 'Valide',
        '✗': 'Invalide',
        '→': 'Suivant',
        '←': 'Précédent',
        '↑': 'Haut',
        '↓': 'Bas',
        '⚠': 'Attention',
        '❤': 'Favoris',
        '★': 'Étoile',
        '🏠': 'Accueil',
        '👤': 'Utilisateur',
        '🔍': 'Recherche',
        '⚙': 'Paramètres'
      };
      
      return unicodeMap[content] || 'Icône';
    }

    return null;
  }

  /**
   * Interpret semantic CSS classes
   */
  private interpretSemanticClasses(element: Element): string | null {
    const classMap: Record<string, string> = {
      'btn-primary': 'Bouton principal',
      'btn-secondary': 'Bouton secondaire',
      'btn-success': 'Bouton de succès',
      'btn-danger': 'Bouton de suppression',
      'btn-warning': 'Bouton d\'avertissement',
      'btn-info': 'Bouton d\'information',
      'alert-success': 'Message de succès',
      'alert-error': 'Message d\'erreur',
      'alert-warning': 'Message d\'avertissement',
      'alert-info': 'Message d\'information',
      'loading': 'Chargement en cours',
      'spinner': 'Indicateur de chargement',
      'progress': 'Barre de progression',
      'score': 'Score',
      'points': 'Points',
      'level': 'Niveau',
      'exercise': 'Exercice',
      'question': 'Question',
      'answer': 'Réponse',
      'feedback': 'Commentaire',
      'hint': 'Indice',
      'solution': 'Solution'
    };

    const classNames = element.className.split(' ');
    for (const className of classNames) {
      if (classMap[className]) {
        return classMap[className];
      }
    }

    return null;
  }

  /**
   * Infer label from parent/context
   */
  private inferFromContext(element: Element, context: ElementContext): string | null {
    // If element is in an exercise context
    if (context.parentContext?.includes('exercise')) {
      const tagName = element.tagName.toLowerCase();
      if (tagName === 'button') return 'Bouton d\'exercice';
      if (tagName === 'input') return 'Réponse à l\'exercice';
    }

    // If element is in a navigation context
    if (context.parentContext?.includes('nav')) {
      return 'Élément de navigation';
    }

    return null;
  }

  /**
   * Add role-specific ARIA attributes
   */
  private addRoleSpecificAttributes(element: HTMLElement, role?: string): void {
    if (!role) return;

    switch (role) {
      case 'progressbar':
        if (!element.getAttribute('aria-valuemin')) {
          element.setAttribute('aria-valuemin', '0');
        }
        if (!element.getAttribute('aria-valuemax')) {
          element.setAttribute('aria-valuemax', '100');
        }
        break;

      case 'tab':
        if (!element.getAttribute('aria-selected')) {
          element.setAttribute('aria-selected', 'false');
        }
        break;

      case 'tabpanel':
        if (!element.getAttribute('aria-hidden')) {
          element.setAttribute('aria-hidden', 'true');
        }
        break;

      case 'dialog':
        if (!element.getAttribute('aria-modal')) {
          element.setAttribute('aria-modal', 'true');
        }
        break;

      case 'switch':
        if (!element.getAttribute('aria-checked')) {
          element.setAttribute('aria-checked', 'false');
        }
        break;
    }
  }

  /**
   * Start observing DOM changes
   */
  private startObserving(): void {
    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldProcess = true;
        }
      });

      if (shouldProcess) {
        // Debounce processing
        clearTimeout((this as any).processingTimeout);
        (this as any).processingTimeout = setTimeout(() => {
          this.enhanceAccessibility();
        }, 100);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Helper methods
   */
  private inferContentType(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    const className = element.className;

    if (className.includes('exercise')) return 'educational';
    if (className.includes('nav')) return 'navigation';
    if (className.includes('form')) return 'form';
    if (tagName === 'img') return 'image';
    if (tagName === 'video') return 'video';
    if (tagName === 'audio') return 'audio';

    return 'general';
  }

  private inferInteractionType(element: Element): string {
    const tagName = element.tagName.toLowerCase();

    if (['button', 'a'].includes(tagName)) return 'clickable';
    if (['input', 'select', 'textarea'].includes(tagName)) return 'input';
    if (element.getAttribute('contenteditable')) return 'editable';
    if (element.getAttribute('draggable')) return 'draggable';

    return 'static';
  }

  private getButtonFunctionLabel(button: HTMLElement): string {
    const className = button.className.toLowerCase();
    const text = button.textContent?.trim();

    if (className.includes('submit')) return 'Soumettre';
    if (className.includes('cancel')) return 'Annuler';
    if (className.includes('close')) return 'Fermer';
    if (className.includes('save')) return 'Enregistrer';
    if (className.includes('delete')) return 'Supprimer';
    if (className.includes('edit')) return 'Modifier';
    
    return text || 'Bouton';
  }

  private getGenericLabel(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const labelMap: Record<string, string> = {
      'button': 'Bouton',
      'a': 'Lien',
      'input': 'Champ de saisie',
      'select': 'Liste déroulante',
      'textarea': 'Zone de texte',
      'img': 'Image',
      'video': 'Vidéo',
      'audio': 'Audio',
      'canvas': 'Graphique',
      'svg': 'Graphique vectoriel'
    };

    return labelMap[tagName] || 'Élément interactif';
  }

  private interpolateTemplate(template: string, context: ElementContext): string {
    return template
      .replace('{index}', (context.indexInSiblings! + 1).toString())
      .replace('{total}', context.siblingCount!.toString())
      .replace('{type}', context.contentType || 'élément')
      .replace('{interaction}', context.interactionType || 'interaction');
  }

  /**
   * Public API methods
   */
  public addRule(rule: ARIARule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  public removeRule(selector: string): void {
    this.rules = this.rules.filter(rule => rule.selector !== selector);
  }

  public updateElement(element: Element): void {
    const matchingRules = this.rules.filter(rule =>
      element.matches(rule.selector)
    );

    matchingRules.forEach(rule => {
      this.applyRule(element, rule);
    });
  }

  public dispose(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.labelCache.clear();
  }
}

// Export singleton instance
export const ariaIntelligence = ARIAIntelligenceService.getInstance();