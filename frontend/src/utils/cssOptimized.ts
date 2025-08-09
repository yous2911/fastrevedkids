/**
 * CSS Optimization System
 * Minimizes CSS-in-JS overhead through static extraction, memoization, and efficient styling
 */

interface StyleCache {
  [key: string]: string;
}

interface ThemeVariables {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: Record<string, string>;
  animations: Record<string, string>;
  shadows: Record<string, string>;
  breakpoints: Record<string, string>;
}

interface StyleConfig {
  enableCaching: boolean;
  enableMinification: boolean;
  enableCriticalCSS: boolean;
  useStaticExtraction: boolean;
}

/**
 * Optimized CSS-in-JS manager with static extraction and caching
 */
export class OptimizedStyleManager {
  private static instance: OptimizedStyleManager;
  private styleCache: StyleCache = {};
  private staticStyles: Map<string, string> = new Map();
  private criticalStyles: Set<string> = new Set();
  private injectedStyles: Set<string> = new Set();
  private config: StyleConfig;
  private theme: ThemeVariables;

  private constructor() {
    this.config = {
      enableCaching: true,
      enableMinification: true,
      enableCriticalCSS: true,
      useStaticExtraction: true
    };

    this.theme = this.createOptimizedTheme();
    this.initializeStaticStyles();
  }

  public static getInstance(): OptimizedStyleManager {
    if (!OptimizedStyleManager.instance) {
      OptimizedStyleManager.instance = new OptimizedStyleManager();
    }
    return OptimizedStyleManager.instance;
  }

  /**
   * Create optimized CSS with caching and minification
   */
  public createStyles<T extends Record<string, any>>(
    styleDefinition: T,
    componentName?: string
  ): T {
    const cacheKey = componentName || JSON.stringify(styleDefinition);
    
    // Check cache first
    if (this.config.enableCaching && this.styleCache[cacheKey]) {
      return JSON.parse(this.styleCache[cacheKey]);
    }

    // Process styles
    const processedStyles = this.processStyleDefinition(styleDefinition);
    
    // Cache the result
    if (this.config.enableCaching) {
      this.styleCache[cacheKey] = JSON.stringify(processedStyles);
    }

    return processedStyles;
  }

  /**
   * Generate CSS class name with optimized styling
   */
  public css(
    styles: Record<string, any>,
    className?: string
  ): string {
    const styleString = this.convertStylesToCSS(styles);
    const hash = this.generateHash(styleString);
    const finalClassName = className ? `${className}_${hash}` : `css_${hash}`;

    // Inject styles if not already present
    if (!this.injectedStyles.has(hash)) {
      this.injectStyles(finalClassName, styleString);
      this.injectedStyles.add(hash);
    }

    return finalClassName;
  }

  /**
   * Create theme-aware styles with CSS variables
   */
  public createThemeStyles<T extends Record<string, any>>(
    styleDefinition: (theme: ThemeVariables) => T,
    componentName?: string
  ): T {
    const cacheKey = `theme_${componentName || 'anonymous'}`;
    
    if (this.config.enableCaching && this.styleCache[cacheKey]) {
      return JSON.parse(this.styleCache[cacheKey]);
    }

    const styles = styleDefinition(this.theme);
    const processedStyles = this.processStyleDefinition(styles);
    
    if (this.config.enableCaching) {
      this.styleCache[cacheKey] = JSON.stringify(processedStyles);
    }

    return processedStyles;
  }

  /**
   * Mark styles as critical for above-the-fold rendering
   */
  public markCritical(styles: Record<string, any>): void {
    const styleString = this.convertStylesToCSS(styles);
    this.criticalStyles.add(styleString);
  }

  /**
   * Extract all critical CSS for inline injection
   */
  public getCriticalCSS(): string {
    return Array.from(this.criticalStyles).join('\n');
  }

  /**
   * Get theme variables for external use
   */
  public getTheme(): ThemeVariables {
    return this.theme;
  }

  /**
   * Update theme and invalidate related caches
   */
  public updateTheme(newTheme: Partial<ThemeVariables>): void {
    this.theme = { ...this.theme, ...newTheme };
    this.invalidateThemeCache();
    this.updateCSSVariables();
  }

  /**
   * Get optimization statistics
   */
  public getStats(): {
    cacheSize: number;
    cacheHitRate: number;
    staticStylesCount: number;
    criticalStylesSize: number;
  } {
    return {
      cacheSize: Object.keys(this.styleCache).length,
      cacheHitRate: 0, // Would track this in real implementation
      staticStylesCount: this.staticStyles.size,
      criticalStylesSize: this.getCriticalCSS().length
    };
  }

  /**
   * Clear all caches and reset
   */
  public clearCache(): void {
    this.styleCache = {};
    this.injectedStyles.clear();
    this.criticalStyles.clear();
  }

  /**
   * Process style definition with optimizations
   */
  private processStyleDefinition<T extends Record<string, any>>(styles: T): T {
    const processed = {} as T;

    for (const [key, value] of Object.entries(styles)) {
      if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        processed[key as keyof T] = this.processStyleDefinition(value);
      } else if (typeof value === 'string') {
        // Process CSS values
        processed[key as keyof T] = this.optimizeStyleValue(value) as T[keyof T];
      } else {
        processed[key as keyof T] = value;
      }
    }

    return processed;
  }

  /**
   * Optimize individual style values
   */
  private optimizeStyleValue(value: string): string {
    // Replace theme variables
    let optimized = value.replace(/var\(--(\w+)\)/g, (match, varName) => {
      return this.getThemeVariable(varName) || match;
    });

    // Optimize color values
    optimized = this.optimizeColorValue(optimized);
    
    // Optimize units
    optimized = this.optimizeUnits(optimized);

    return optimized;
  }

  /**
   * Convert styles object to CSS string
   */
  private convertStylesToCSS(styles: Record<string, any>): string {
    const cssRules: string[] = [];

    for (const [property, value] of Object.entries(styles)) {
      if (typeof value === 'object' && value !== null) {
        // Handle nested selectors (pseudo-classes, media queries, etc.)
        const nestedCSS = this.convertStylesToCSS(value);
        if (property.startsWith('&')) {
          cssRules.push(`${property.substring(1)} { ${nestedCSS} }`);
        } else if (property.startsWith('@')) {
          cssRules.push(`${property} { ${nestedCSS} }`);
        }
      } else {
        const cssProperty = this.camelToKebab(property);
        cssRules.push(`${cssProperty}: ${value};`);
      }
    }

    return cssRules.join(' ');
  }

  /**
   * Generate hash for style caching
   */
  private generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Inject styles into the document
   */
  private injectStyles(className: string, styles: string): void {
    if (typeof document === 'undefined') return;

    let styleSheet = document.getElementById('optimized-styles') as HTMLStyleElement;
    
    if (!styleSheet) {
      styleSheet = document.createElement('style');
      styleSheet.id = 'optimized-styles';
      styleSheet.type = 'text/css';
      document.head.appendChild(styleSheet);
    }

    const cssRule = `.${className} { ${styles} }`;
    
    if (styleSheet.sheet) {
      try {
        styleSheet.sheet.insertRule(cssRule, styleSheet.sheet.cssRules.length);
      } catch (e) {
        // Fallback for older browsers
        styleSheet.appendChild(document.createTextNode(cssRule));
      }
    } else {
      styleSheet.appendChild(document.createTextNode(cssRule));
    }
  }

  /**
   * Create optimized theme with CSS variables
   */
  private createOptimizedTheme(): ThemeVariables {
    return {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#06B6D4',
        gray50: '#F9FAFB',
        gray100: '#F3F4F6',
        gray200: '#E5E7EB',
        gray300: '#D1D5DB',
        gray400: '#9CA3AF',
        gray500: '#6B7280',
        gray600: '#4B5563',
        gray700: '#374151',
        gray800: '#1F2937',
        gray900: '#111827'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        },
        lineHeight: {
          tight: '1.25',
          normal: '1.5',
          relaxed: '1.75'
        }
      },
      animations: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideUp: 'slideUp 0.3s ease-out',
        bounce: 'bounce 0.6s ease-in-out',
        pulse: 'pulse 2s infinite',
        spin: 'spin 1s linear infinite'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      },
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
      }
    };
  }

  /**
   * Initialize common static styles
   */
  private initializeStaticStyles(): void {
    // Common utility classes
    this.staticStyles.set('flex-center', 'display: flex; align-items: center; justify-content: center;');
    this.staticStyles.set('absolute-fill', 'position: absolute; top: 0; left: 0; right: 0; bottom: 0;');
    this.staticStyles.set('visually-hidden', 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;');
    
    // Animation keyframes
    this.staticStyles.set('keyframes-fadeIn', `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `);
    
    this.staticStyles.set('keyframes-slideUp', `
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `);

    // Inject static styles
    this.injectStaticStyles();
  }

  /**
   * Inject static styles into document
   */
  private injectStaticStyles(): void {
    if (typeof document === 'undefined') return;

    const staticStyleSheet = document.createElement('style');
    staticStyleSheet.id = 'static-optimized-styles';
    staticStyleSheet.type = 'text/css';
    
    const staticCSS = Array.from(this.staticStyles.entries())
      .map(([name, css]) => {
        if (name.startsWith('keyframes-')) {
          return css;
        }
        return `.${name} { ${css} }`;
      })
      .join('\n');
    
    staticStyleSheet.textContent = staticCSS;
    document.head.appendChild(staticStyleSheet);
  }

  /**
   * Get theme variable value
   */
  private getThemeVariable(varName: string): string | undefined {
    // Flatten theme object to find variable
    const flatTheme = this.flattenTheme(this.theme);
    return flatTheme[varName];
  }

  /**
   * Flatten theme object for variable lookup
   */
  private flattenTheme(obj: any, prefix = ''): Record<string, string> {
    const flattened: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}-${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        Object.assign(flattened, this.flattenTheme(value, newKey));
      } else {
        flattened[newKey] = String(value);
      }
    }
    
    return flattened;
  }

  /**
   * Optimize color values (hex to rgb, remove unnecessary spaces, etc.)
   */
  private optimizeColorValue(value: string): string {
    // Convert long hex to short hex where possible
    value = value.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3');
    
    // Remove unnecessary spaces in rgb/rgba
    value = value.replace(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g, 'rgb($1,$2,$3)');
    value = value.replace(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/g, 'rgba($1,$2,$3,$4)');
    
    return value;
  }

  /**
   * Optimize units (remove unnecessary zeros, use shorter units)
   */
  private optimizeUnits(value: string): string {
    // Remove unnecessary zeros
    value = value.replace(/0+(\d+)/g, '$1');
    value = value.replace(/(\d+)\.0+(px|em|rem|%|vh|vw)/g, '$1$2');
    
    // Use shorter units where possible
    value = value.replace(/(\d+)\.0+/g, '$1');
    
    return value;
  }

  /**
   * Convert camelCase to kebab-case
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Invalidate theme-related cache entries
   */
  private invalidateThemeCache(): void {
    const themeKeys = Object.keys(this.styleCache).filter(key => key.startsWith('theme_'));
    themeKeys.forEach(key => delete this.styleCache[key]);
  }

  /**
   * Update CSS variables in the document
   */
  private updateCSSVariables(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const flatTheme = this.flattenTheme(this.theme);
    
    Object.entries(flatTheme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }
}

/**
 * Pre-defined optimized style mixins
 */
export const optimizedMixins = {
  // Layout mixins
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  absoluteFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  
  // Typography mixins
  truncateText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  
  // Animation mixins
  smoothTransition: {
    transition: 'all 0.2s ease-in-out'
  },
  
  // Common styles
  cardShadow: {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },
  
  roundedButton: {
    borderRadius: '0.375rem',
    padding: '0.5rem 1rem',
    fontWeight: '500',
    fontSize: '0.875rem',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    transition: 'all 0.2s ease-in-out'
  }
};

/**
 * Responsive design utilities
 */
export const responsive = {
  mobile: (styles: Record<string, any>) => ({
    '@media (max-width: 767px)': styles
  }),
  
  tablet: (styles: Record<string, any>) => ({
    '@media (min-width: 768px) and (max-width: 1023px)': styles
  }),
  
  desktop: (styles: Record<string, any>) => ({
    '@media (min-width: 1024px)': styles
  }),
  
  hover: (styles: Record<string, any>) => ({
    '@media (hover: hover)': {
      '&:hover': styles
    }
  })
};

// Export singleton instance
export const styleManager = OptimizedStyleManager.getInstance();

/**
 * Utility function for creating optimized styles
 */
export const createOptimizedStyles = <T extends Record<string, any>>(
  styles: T,
  componentName?: string
): T => {
  return styleManager.createStyles(styles, componentName);
};

/**
 * Utility function for theme-aware styles
 */
export const createThemeStyles = <T extends Record<string, any>>(
  styleDefinition: (theme: ThemeVariables) => T,
  componentName?: string
): T => {
  return styleManager.createThemeStyles(styleDefinition, componentName);
};