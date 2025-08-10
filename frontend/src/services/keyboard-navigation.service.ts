/**
 * Advanced Keyboard Navigation and Focus Management Service
 * Provides comprehensive keyboard navigation with intelligent focus management
 */

interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  isVisible: boolean;
  rect: DOMRect;
  group?: string;
}

interface KeyboardNavigationConfig {
  enableArrowKeys?: boolean;
  enableTabTrapping?: boolean;
  enableSpatialNavigation?: boolean;
  focusVisibleOnly?: boolean;
  respectTabIndex?: boolean;
  customSelectors?: string[];
}

interface FocusTrapConfig {
  trapContainer: HTMLElement;
  initialFocus?: HTMLElement | string;
  returnFocus?: HTMLElement;
  allowOutsideClick?: boolean;
  escapeDeactivates?: boolean;
}

export class KeyboardNavigationService {
  private static instance: KeyboardNavigationService;
  private focusableSelectors = [
    'input:not([disabled]):not([aria-hidden="true"])',
    'select:not([disabled]):not([aria-hidden="true"])',
    'textarea:not([disabled]):not([aria-hidden="true"])',
    'button:not([disabled]):not([aria-hidden="true"])',
    'a[href]:not([aria-hidden="true"])',
    '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
    '[contenteditable]:not([aria-hidden="true"])',
    'audio[controls]:not([aria-hidden="true"])',
    'video[controls]:not([aria-hidden="true"])',
    'details summary:not([aria-hidden="true"])',
    '[role="button"]:not([disabled]):not([aria-hidden="true"])',
    '[role="link"]:not([aria-hidden="true"])',
    '[role="menuitem"]:not([disabled]):not([aria-hidden="true"])',
    '[role="tab"]:not([disabled]):not([aria-hidden="true"])',
    '[role="checkbox"]:not([disabled]):not([aria-hidden="true"])',
    '[role="radio"]:not([disabled]):not([aria-hidden="true"])',
    '[role="slider"]:not([disabled]):not([aria-hidden="true"])'
  ];

  private activeTrap: FocusTrapConfig | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;
  private focusHistory: HTMLElement[] = [];
  private config: KeyboardNavigationConfig = {};

  private constructor() {
    this.setupGlobalKeyboardHandling();
  }

  public static getInstance(): KeyboardNavigationService {
    if (!KeyboardNavigationService.instance) {
      KeyboardNavigationService.instance = new KeyboardNavigationService();
    }
    return KeyboardNavigationService.instance;
  }

  /**
   * Configure keyboard navigation behavior
   */
  public configure(config: KeyboardNavigationConfig): void {
    this.config = { ...this.config, ...config };
    
    if (config.customSelectors) {
      this.focusableSelectors = [...this.focusableSelectors, ...config.customSelectors];
    }
  }

  /**
   * Get all focusable elements in a container
   */
  public getFocusableElements(container: HTMLElement = document.body): FocusableElement[] {
    const selector = this.focusableSelectors.join(', ');
    const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];

    return elements
      .map(element => ({
        element,
        tabIndex: parseInt(element.getAttribute('tabindex') || '0'),
        isVisible: this.isElementVisible(element),
        rect: element.getBoundingClientRect(),
        group: element.getAttribute('data-focus-group') || undefined
      }))
      .filter(item => {
        // Filter based on config
        if (this.config.focusVisibleOnly && !item.isVisible) return false;
        if (this.config.respectTabIndex && item.tabIndex < 0) return false;
        return true;
      })
      .sort((a, b) => {
        // Sort by tab index, then by document order
        if (a.tabIndex !== b.tabIndex) {
          return a.tabIndex - b.tabIndex;
        }
        return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
  }

  /**
   * Create a focus trap within a container
   */
  public createFocusTrap(config: FocusTrapConfig): void {
    // Deactivate any existing trap
    this.deactivateFocusTrap();

    this.activeTrap = config;

    // Store current focused element for return focus
    if (!config.returnFocus && document.activeElement instanceof HTMLElement) {
      config.returnFocus = document.activeElement;
    }

    // Set initial focus
    this.setInitialFocus(config);

    // Setup keyboard event handling
    this.setupTrapKeyboardHandling();

    // Announce trap activation to screen readers
    this.announceToScreenReader('Dialogue ouvert. Utilisez Tab pour naviguer, Échap pour fermer.');

    console.log('🔒 Focus trap activated');
  }

  /**
   * Deactivate current focus trap
   */
  public deactivateFocusTrap(): void {
    if (!this.activeTrap) return;

    // Return focus to original element
    if (this.activeTrap.returnFocus && this.isElementVisible(this.activeTrap.returnFocus)) {
      this.activeTrap.returnFocus.focus();
    }

    // Remove event listeners
    this.removeTrapKeyboardHandling();

    this.activeTrap = null;
    console.log('🔓 Focus trap deactivated');
  }

  /**
   * Navigate to the next focusable element
   */
  public navigateNext(container?: HTMLElement, currentElement?: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container);
    const current = currentElement || document.activeElement as HTMLElement;
    const currentIndex = focusableElements.findIndex(item => item.element === current);

    if (currentIndex === -1) {
      // Focus first element if current not found
      return this.focusElement(focusableElements[0]?.element);
    }

    const nextIndex = (currentIndex + 1) % focusableElements.length;
    return this.focusElement(focusableElements[nextIndex].element);
  }

  /**
   * Navigate to the previous focusable element
   */
  public navigatePrevious(container?: HTMLElement, currentElement?: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container);
    const current = currentElement || document.activeElement as HTMLElement;
    const currentIndex = focusableElements.findIndex(item => item.element === current);

    if (currentIndex === -1) {
      // Focus last element if current not found
      return this.focusElement(focusableElements[focusableElements.length - 1]?.element);
    }

    const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    return this.focusElement(focusableElements[prevIndex].element);
  }

  /**
   * Navigate using arrow keys (spatial navigation)
   */
  public navigateDirection(direction: 'up' | 'down' | 'left' | 'right', container?: HTMLElement): HTMLElement | null {
    if (!this.config.enableSpatialNavigation) return null;

    const focusableElements = this.getFocusableElements(container);
    const current = document.activeElement as HTMLElement;
    const currentItem = focusableElements.find(item => item.element === current);

    if (!currentItem) return null;

    const candidates = focusableElements.filter(item => {
      if (item.element === current) return false;
      
      return this.isInDirection(currentItem.rect, item.rect, direction);
    });

    if (candidates.length === 0) return null;

    // Find the closest element in the specified direction
    const closest = candidates.reduce((best, candidate) => {
      const bestDistance = this.calculateDistance(currentItem.rect, best.rect, direction);
      const candidateDistance = this.calculateDistance(currentItem.rect, candidate.rect, direction);
      
      return candidateDistance < bestDistance ? candidate : best;
    });

    return this.focusElement(closest.element);
  }

  /**
   * Focus an element with enhanced behavior
   */
  public focusElement(element: HTMLElement | null): HTMLElement | null {
    if (!element || !this.isElementVisible(element)) return null;

    // Add to focus history
    this.addToFocusHistory(element);

    // Ensure element is focusable
    if (!element.hasAttribute('tabindex') && !this.isNativelyFocusable(element)) {
      element.setAttribute('tabindex', '-1');
    }

    // Focus with error handling
    try {
      element.focus();

      // Ensure focus is visible
      this.ensureFocusVisible(element);

      // Announce focus change to screen readers if needed
      this.announceElementFocus(element);

      return element;
    } catch (error) {
      console.warn('Failed to focus element:', error);
      return null;
    }
  }

  /**
   * Setup roving tabindex for a group of elements
   */
  public setupRovingTabindex(container: HTMLElement, selector: string = '[role="tab"], [role="menuitem"]'): void {
    const items = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
    
    if (items.length === 0) return;

    // Set initial tabindex values
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    // Setup keyboard handling
    const handleKeydown = (event: KeyboardEvent) => {
      const current = event.target as HTMLElement;
      const currentIndex = items.indexOf(current);
      
      if (currentIndex === -1) return;

      let targetIndex = -1;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          targetIndex = (currentIndex + 1) % items.length;
          break;
          
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          targetIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
          break;
          
        case 'Home':
          event.preventDefault();
          targetIndex = 0;
          break;
          
        case 'End':
          event.preventDefault();
          targetIndex = items.length - 1;
          break;
      }

      if (targetIndex !== -1) {
        // Update tabindex values
        items.forEach((item, index) => {
          item.setAttribute('tabindex', index === targetIndex ? '0' : '-1');
        });

        // Focus new element
        this.focusElement(items[targetIndex]);
      }
    };

    container.addEventListener('keydown', handleKeydown);

    // Store cleanup function
    (container as any).__rovingTabindexCleanup = () => {
      container.removeEventListener('keydown', handleKeydown);
    };
  }

  /**
   * Setup global keyboard handling
   */
  private setupGlobalKeyboardHandling(): void {
    document.addEventListener('keydown', (event) => {
      // Handle global keyboard shortcuts
      if (event.altKey && event.key === 'Tab') {
        // Alt+Tab equivalent for internal navigation
        event.preventDefault();
        this.handleGlobalNavigation(event.shiftKey ? 'previous' : 'next');
      }

      // Handle escape key globally
      if (event.key === 'Escape' && this.activeTrap) {
        if (this.activeTrap.escapeDeactivates !== false) {
          event.preventDefault();
          this.deactivateFocusTrap();
        }
      }
    });

    // Handle focus restoration on page load
    window.addEventListener('load', () => {
      this.restoreFocus();
    });
  }

  /**
   * Setup focus trap keyboard handling
   */
  private setupTrapKeyboardHandling(): void {
    if (!this.activeTrap) return;

    this.keydownListener = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        this.handleTrapTabNavigation(event);
      } else if (this.config.enableArrowKeys) {
        this.handleTrapArrowNavigation(event);
      }
    };

    document.addEventListener('keydown', this.keydownListener);
  }

  /**
   * Remove trap keyboard handling
   */
  private removeTrapKeyboardHandling(): void {
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
  }

  /**
   * Handle tab navigation within focus trap
   */
  private handleTrapTabNavigation(event: KeyboardEvent): void {
    if (!this.activeTrap) return;

    const focusableElements = this.getFocusableElements(this.activeTrap.trapContainer);
    
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0].element;
    const lastElement = focusableElements[focusableElements.length - 1].element;
    const currentElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab (backward)
      if (currentElement === firstElement) {
        event.preventDefault();
        this.focusElement(lastElement);
      }
    } else {
      // Tab (forward)
      if (currentElement === lastElement) {
        event.preventDefault();
        this.focusElement(firstElement);
      }
    }
  }

  /**
   * Handle arrow navigation within focus trap
   */
  private handleTrapArrowNavigation(event: KeyboardEvent): void {
    if (!this.config.enableArrowKeys) return;

    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!arrowKeys.includes(event.key)) return;

    const direction = event.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
    const navigated = this.navigateDirection(direction, this.activeTrap?.trapContainer);

    if (navigated) {
      event.preventDefault();
    }
  }

  /**
   * Set initial focus for focus trap
   */
  private setInitialFocus(config: FocusTrapConfig): void {
    let initialElement: HTMLElement | null = null;

    if (config.initialFocus) {
      if (typeof config.initialFocus === 'string') {
        initialElement = config.trapContainer.querySelector(config.initialFocus);
      } else {
        initialElement = config.initialFocus;
      }
    }

    if (!initialElement) {
      const focusableElements = this.getFocusableElements(config.trapContainer);
      initialElement = focusableElements[0]?.element || null;
    }

    if (initialElement) {
      // Small delay to ensure DOM is ready
      setTimeout(() => this.focusElement(initialElement), 10);
    }
  }

  /**
   * Utility methods
   */
  private isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0 &&
      element.offsetParent !== null
    );
  }

  private isNativelyFocusable(element: HTMLElement): boolean {
    const focusableTags = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A'];
    return focusableTags.includes(element.tagName) || 
           element.hasAttribute('contenteditable');
  }

  private isInDirection(fromRect: DOMRect, toRect: DOMRect, direction: string): boolean {
    const threshold = 10; // Pixel threshold for alignment

    switch (direction) {
      case 'up':
        return toRect.bottom <= fromRect.top + threshold;
      case 'down':
        return toRect.top >= fromRect.bottom - threshold;
      case 'left':
        return toRect.right <= fromRect.left + threshold;
      case 'right':
        return toRect.left >= fromRect.right - threshold;
      default:
        return false;
    }
  }

  private calculateDistance(fromRect: DOMRect, toRect: DOMRect, direction: string): number {
    const fromCenter = {
      x: fromRect.left + fromRect.width / 2,
      y: fromRect.top + fromRect.height / 2
    };
    const toCenter = {
      x: toRect.left + toRect.width / 2,
      y: toRect.top + toRect.height / 2
    };

    // Calculate Euclidean distance with direction bias
    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Add bias based on direction alignment
    let bias = 0;
    switch (direction) {
      case 'up':
      case 'down':
        bias = Math.abs(dx) * 0.3; // Prefer vertically aligned elements
        break;
      case 'left':
      case 'right':
        bias = Math.abs(dy) * 0.3; // Prefer horizontally aligned elements
        break;
    }

    return distance + bias;
  }

  private ensureFocusVisible(element: HTMLElement): void {
    // Add focus-visible class if needed
    if (!element.matches(':focus-visible')) {
      element.classList.add('focus-visible-programmatic');
    }

    // Scroll into view if needed
    const rect = element.getBoundingClientRect();
    const viewport = {
      top: 0,
      bottom: window.innerHeight,
      left: 0,
      right: window.innerWidth
    };

    if (rect.bottom > viewport.bottom || rect.top < viewport.top) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }

  private addToFocusHistory(element: HTMLElement): void {
    // Remove element if it's already in history
    this.focusHistory = this.focusHistory.filter(el => el !== element);
    
    // Add to beginning
    this.focusHistory.unshift(element);
    
    // Keep only last 10 elements
    this.focusHistory = this.focusHistory.slice(0, 10);
  }

  private announceElementFocus(element: HTMLElement): void {
    const label = element.getAttribute('aria-label') ||
                 element.getAttribute('title') ||
                 element.textContent?.trim();

    if (label && label.length > 0) {
      // Only announce if it's a significant focus change
      const role = element.getAttribute('role') || element.tagName.toLowerCase();
      if (['button', 'link', 'tab', 'menuitem'].includes(role)) {
        this.announceToScreenReader(`Focalisé sur ${label}`);
      }
    }
  }

  private announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  private handleGlobalNavigation(direction: 'next' | 'previous'): void {
    if (direction === 'next') {
      this.navigateNext();
    } else {
      this.navigatePrevious();
    }
  }

  private restoreFocus(): void {
    // Restore focus to the first focusable element if no element has focus
    if (!document.activeElement || document.activeElement === document.body) {
      const firstFocusable = this.getFocusableElements()[0];
      if (firstFocusable) {
        this.focusElement(firstFocusable.element);
      }
    }
  }

  /**
   * Public cleanup method
   */
  public dispose(): void {
    this.deactivateFocusTrap();
    this.focusHistory = [];
  }
}

// Export singleton instance
export const keyboardNav = KeyboardNavigationService.getInstance();