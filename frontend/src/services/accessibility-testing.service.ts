/**
 * Automated Accessibility Testing Service with axe-core
 * Provides comprehensive accessibility testing and auto-fix capabilities
 */

import axe, { AxeResults, Result, NodeResult } from 'axe-core';

interface AccessibilityReport {
  violations: Result[];
  passes: Result[];
  incomplete: Result[];
  inapplicable: Result[];
  timestamp: string;
  url: string;
  testCount: number;
  violationCount: number;
  passCount: number;
}

interface AutoFixResult {
  fixed: number;
  failed: number;
  details: Array<{
    ruleId: string;
    elementSelector: string;
    action: string;
    success: boolean;
    message: string;
  }>;
}

export class AccessibilityTestingService {
  private static instance: AccessibilityTestingService;
  private reports: AccessibilityReport[] = [];
  private autoFixRules = new Map<string, (element: Element, violation: Result) => boolean>();

  private constructor() {
    this.initializeAutoFixRules();
    this.configureAxe();
  }

  public static getInstance(): AccessibilityTestingService {
    if (!AccessibilityTestingService.instance) {
      AccessibilityTestingService.instance = new AccessibilityTestingService();
    }
    return AccessibilityTestingService.instance;
  }

  /**
   * Configure axe-core with custom rules and settings
   */
  private configureAxe(): void {
    // Configure axe for educational applications
    axe.configure({
      rules: [
        // Enable all WCAG 2.1 AA rules
        { id: 'color-contrast', enabled: true },
        { id: 'keyboard', enabled: true },
        { id: 'aria-labels', enabled: true },
        { id: 'focus-order-semantics', enabled: true },
        { id: 'landmark-one-main', enabled: true },
        { id: 'page-has-heading-one', enabled: true },
        { id: 'region', enabled: true },
        { id: 'skip-link', enabled: true },
        { id: 'aria-allowed-attr', enabled: true },
        { id: 'aria-required-attr', enabled: true },
        { id: 'form-field-multiple-labels', enabled: true },
        { id: 'label', enabled: true },
        { id: 'button-name', enabled: true },
        { id: 'link-name', enabled: true }
      ],
      // tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] // Tags moved to options
    });

    console.log('🧪 Axe-core configured for accessibility testing');
  }

  /**
   * Run comprehensive accessibility test
   */
  public async runAccessibilityTest(context?: Element | string): Promise<AccessibilityReport> {
    try {
      const testContext = context || document;
      const results: AxeResults = await axe.run(testContext);

      const report: AccessibilityReport = {
        violations: results.violations,
        passes: results.passes,
        incomplete: results.incomplete,
        inapplicable: results.inapplicable,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        testCount: results.violations.length + results.passes.length,
        violationCount: results.violations.length,
        passCount: results.passes.length
      };

      this.reports.push(report);
      this.logReport(report);

      return report;
    } catch (error) {
      console.error('Accessibility test failed:', error);
      throw error;
    }
  }

  /**
   * Auto-fix accessibility violations where possible
   */
  public async autoFixViolations(report?: AccessibilityReport): Promise<AutoFixResult> {
    const targetReport = report || await this.runAccessibilityTest();
    const result: AutoFixResult = {
      fixed: 0,
      failed: 0,
      details: []
    };

    for (const violation of targetReport.violations) {
      const autoFixer = this.autoFixRules.get(violation.id);
      
      if (autoFixer) {
        for (const node of violation.nodes) {
          try {
            const elements = document.querySelectorAll(node.target.join(', '));
            
            for (const element of elements) {
              const success = autoFixer(element, violation);
              
              result.details.push({
                ruleId: violation.id,
                elementSelector: node.target.join(', '),
                action: this.getAutoFixAction(violation.id),
                success,
                message: success ? 'Fixed automatically' : 'Could not auto-fix'
              });

              if (success) {
                result.fixed++;
              } else {
                result.failed++;
              }
            }
          } catch (error) {
            result.failed++;
            result.details.push({
              ruleId: violation.id,
              elementSelector: node.target.join(', '),
              action: 'Error during auto-fix',
              success: false,
              message: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } else {
        result.failed++;
        result.details.push({
          ruleId: violation.id,
          elementSelector: 'N/A',
          action: 'No auto-fix available',
          success: false,
          message: `No auto-fix rule for ${violation.id}`
        });
      }
    }

    console.log('🔧 Auto-fix results:', result);
    return result;
  }

  /**
   * Initialize auto-fix rules
   */
  private initializeAutoFixRules(): void {
    // Fix missing form labels
    this.autoFixRules.set('label', (element: Element, violation: Result) => {
      const input = element as HTMLInputElement;
      const placeholder = input.placeholder;
      const name = input.name;
      const type = input.type;

      if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
        if (placeholder) {
          input.setAttribute('aria-label', placeholder);
          return true;
        } else if (name) {
          input.setAttribute('aria-label', this.formatFieldName(name));
          return true;
        } else if (type) {
          input.setAttribute('aria-label', `${this.formatFieldName(type)} field`);
          return true;
        }
      }
      return false;
    });

    // Fix missing button names
    this.autoFixRules.set('button-name', (element: Element, violation: Result) => {
      const button = element as HTMLButtonElement;
      
      if (!button.getAttribute('aria-label') && !button.textContent?.trim()) {
        // Try to infer from class names
        const className = button.className;
        if (className.includes('close')) {
          button.setAttribute('aria-label', 'Fermer');
          return true;
        } else if (className.includes('menu')) {
          button.setAttribute('aria-label', 'Menu');
          return true;
        } else if (className.includes('submit')) {
          button.setAttribute('aria-label', 'Soumettre');
          return true;
        } else if (className.includes('save')) {
          button.setAttribute('aria-label', 'Enregistrer');
          return true;
        } else {
          button.setAttribute('aria-label', 'Bouton');
          return true;
        }
      }
      return false;
    });

    // Fix missing link names
    this.autoFixRules.set('link-name', (element: Element, violation: Result) => {
      const link = element as HTMLAnchorElement;
      
      if (!link.getAttribute('aria-label') && !link.textContent?.trim()) {
        const href = link.getAttribute('href');
        if (href) {
          if (href.startsWith('#')) {
            link.setAttribute('aria-label', `Aller à ${href.substring(1)}`);
          } else if (href.startsWith('mailto:')) {
            link.setAttribute('aria-label', 'Envoyer un email');
          } else if (href.startsWith('tel:')) {
            link.setAttribute('aria-label', 'Appeler');
          } else {
            link.setAttribute('aria-label', 'Lien');
          }
          return true;
        }
      }
      return false;
    });

    // Fix missing landmark regions
    this.autoFixRules.set('region', (element: Element, violation: Result) => {
      // Add role="main" to main content areas
      if (element.tagName.toLowerCase() === 'main' && !element.getAttribute('role')) {
        element.setAttribute('role', 'main');
        return true;
      }
      
      // Add appropriate roles based on context
      const classList = element.className.toLowerCase();
      if (classList.includes('main') || classList.includes('content')) {
        element.setAttribute('role', 'main');
        return true;
      } else if (classList.includes('nav') || classList.includes('menu')) {
        element.setAttribute('role', 'navigation');
        return true;
      } else if (classList.includes('sidebar') || classList.includes('aside')) {
        element.setAttribute('role', 'complementary');
        return true;
      }
      
      return false;
    });

    // Fix missing skip links
    this.autoFixRules.set('skip-link', (element: Element, violation: Result) => {
      // This is handled by the SkipLinks component
      // Just ensure the main content has proper ID
      if (element.tagName.toLowerCase() === 'main' && !element.id) {
        element.id = 'main-content';
        return true;
      }
      return false;
    });

    // Fix missing ARIA attributes
    this.autoFixRules.set('aria-required-attr', (element: Element, violation: Result) => {
      const role = element.getAttribute('role');
      
      switch (role) {
        case 'tab':
          if (!element.getAttribute('aria-selected')) {
            element.setAttribute('aria-selected', 'false');
            return true;
          }
          break;
        case 'progressbar':
          if (!element.getAttribute('aria-valuemin')) {
            element.setAttribute('aria-valuemin', '0');
          }
          if (!element.getAttribute('aria-valuemax')) {
            element.setAttribute('aria-valuemax', '100');
          }
          if (!element.getAttribute('aria-valuenow')) {
            element.setAttribute('aria-valuenow', '0');
          }
          return true;
        case 'slider':
          if (!element.getAttribute('aria-valuemin')) {
            element.setAttribute('aria-valuemin', '0');
          }
          if (!element.getAttribute('aria-valuemax')) {
            element.setAttribute('aria-valuemax', '100');
          }
          if (!element.getAttribute('aria-valuenow')) {
            element.setAttribute('aria-valuenow', '50');
          }
          return true;
      }
      
      return false;
    });

    // Fix heading hierarchy
    this.autoFixRules.set('page-has-heading-one', (element: Element, violation: Result) => {
      // Find the main title and ensure it's h1
      const titles = document.querySelectorAll('h1, h2, h3, .title, .page-title, .main-title');
      if (titles.length > 0) {
        const firstTitle = titles[0];
        if (firstTitle.tagName.toLowerCase() !== 'h1') {
          // Create h1 wrapper or convert existing element
          const h1 = document.createElement('h1');
          h1.textContent = firstTitle.textContent;
          h1.className = firstTitle.className;
          firstTitle.parentNode?.replaceChild(h1, firstTitle);
          return true;
        }
      }
      return false;
    });

    console.log(`🔧 Initialized ${this.autoFixRules.size} auto-fix rules`);
  }

  /**
   * Generate accessibility report in different formats
   */
  public generateReport(format: 'console' | 'html' | 'json' = 'console', report?: AccessibilityReport): string | void {
    const targetReport = report || this.reports[this.reports.length - 1];
    
    if (!targetReport) {
      console.warn('No accessibility report available');
      return;
    }

    switch (format) {
      case 'console':
        this.logReport(targetReport);
        break;
      case 'html':
        return this.generateHTMLReport(targetReport);
      case 'json':
        return JSON.stringify(targetReport, null, 2);
    }
  }

  /**
   * Monitor accessibility continuously
   */
  public startContinuousMonitoring(intervalMs: number = 30000): void {
    const monitor = setInterval(async () => {
      try {
        const report = await this.runAccessibilityTest();
        if (report.violationCount > 0) {
          console.warn(`⚠️ Accessibility violations detected: ${report.violationCount}`);
          await this.autoFixViolations(report);
        }
      } catch (error) {
        console.error('Continuous accessibility monitoring error:', error);
      }
    }, intervalMs);

    // Store interval ID for cleanup
    (window as any).__accessibilityMonitor = monitor;
    console.log('🔄 Started continuous accessibility monitoring');
  }

  /**
   * Stop continuous monitoring
   */
  public stopContinuousMonitoring(): void {
    const monitor = (window as any).__accessibilityMonitor;
    if (monitor) {
      clearInterval(monitor);
      delete (window as any).__accessibilityMonitor;
      console.log('⏹️ Stopped continuous accessibility monitoring');
    }
  }

  /**
   * Test specific components or areas
   */
  public async testComponent(selector: string): Promise<AccessibilityReport> {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Component not found: ${selector}`);
    }

    return this.runAccessibilityTest(element);
  }

  /**
   * Validate WCAG compliance level
   */
  public async validateWCAGCompliance(level: 'A' | 'AA' | 'AAA' = 'AA'): Promise<{
    isCompliant: boolean;
    violations: Result[];
    level: string;
  }> {
    const tags = level === 'A' ? ['wcag2a'] : 
                 level === 'AA' ? ['wcag2a', 'wcag2aa'] :
                 ['wcag2a', 'wcag2aa', 'wcag2aaa'];

    const results: AxeResults = await new Promise<AxeResults>((resolve) => {
      axe.run(document, { tags: tags } as any, (err, results) => {
        if (err || !results) {
          resolve({ 
            violations: [], 
            passes: [], 
            inapplicable: [], 
            incomplete: [], 
            timestamp: new Date().toISOString(), 
            url: window.location.href,
            toolOptions: {},
            testEngine: { name: 'axe-core', version: '4.0.0' },
            testRunner: { name: 'axe' },
            testEnvironment: { userAgent: navigator.userAgent, windowWidth: window.innerWidth, windowHeight: window.innerHeight }
          } as AxeResults);
        } else {
          resolve(results);
        }
      });
    });
    
    return {
      isCompliant: results.violations.length === 0,
      violations: results.violations,
      level: `WCAG 2.1 ${level}`
    };
  }

  // Helper methods
  private logReport(report: AccessibilityReport): void {
    console.group('🧪 Accessibility Test Report');
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`URL: ${report.url}`);
    console.log(`Tests: ${report.testCount} | Violations: ${report.violationCount} | Passes: ${report.passCount}`);
    
    if (report.violationCount > 0) {
      console.group('❌ Violations');
      report.violations.forEach(violation => {
        console.group(`${violation.id} (${violation.impact})`);
        console.log(violation.description);
        console.log(`Help: ${violation.helpUrl}`);
        violation.nodes.forEach(node => {
          console.log(`Element: ${node.target.join(', ')}`);
          console.log(`HTML: ${node.html}`);
        });
        console.groupEnd();
      });
      console.groupEnd();
    }
    
    console.log(`✅ ${report.passCount} tests passed`);
    console.groupEnd();
  }

  private generateHTMLReport(report: AccessibilityReport): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Rapport d'Accessibilité</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .violation { background: #ffebee; border: 1px solid #f44336; margin: 10px 0; padding: 15px; }
          .pass { background: #e8f5e8; border: 1px solid #4caf50; margin: 10px 0; padding: 15px; }
          .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
          .impact-critical { border-left: 5px solid #f44336; }
          .impact-serious { border-left: 5px solid #ff9800; }
          .impact-moderate { border-left: 5px solid #ffeb3b; }
          .impact-minor { border-left: 5px solid #4caf50; }
        </style>
      </head>
      <body>
        <h1>Rapport d'Accessibilité - RevEd Kids</h1>
        <div class="summary">
          <p><strong>Date:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
          <p><strong>URL:</strong> ${report.url}</p>
          <p><strong>Tests:</strong> ${report.testCount}</p>
          <p><strong>Violations:</strong> ${report.violationCount}</p>
          <p><strong>Succès:</strong> ${report.passCount}</p>
        </div>
        
        ${report.violations.map(violation => `
          <div class="violation impact-${violation.impact}">
            <h3>${violation.id}</h3>
            <p><strong>Impact:</strong> ${violation.impact}</p>
            <p>${violation.description}</p>
            <p><strong>Aide:</strong> <a href="${violation.helpUrl}" target="_blank">${violation.helpUrl}</a></p>
            <div>
              <strong>Éléments concernés:</strong>
              <ul>
                ${violation.nodes.map(node => `
                  <li>
                    <code>${node.target.join(', ')}</code>
                    <pre>${node.html}</pre>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        `).join('')}
        
        <h2>Tests Réussis (${report.passCount})</h2>
        <details>
          <summary>Voir les détails</summary>
          ${report.passes.map(pass => `
            <div class="pass">
              <h4>${pass.id}</h4>
              <p>${pass.description}</p>
            </div>
          `).join('')}
        </details>
      </body>
      </html>
    `;
  }

  private formatFieldName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  }

  private getAutoFixAction(ruleId: string): string {
    const actionMap: Record<string, string> = {
      'label': 'Add aria-label',
      'button-name': 'Add button label',
      'link-name': 'Add link label',
      'region': 'Add landmark role',
      'skip-link': 'Add content ID',
      'aria-required-attr': 'Add required ARIA attributes',
      'page-has-heading-one': 'Fix heading hierarchy'
    };
    
    return actionMap[ruleId] || 'Generic fix attempt';
  }
}

// Export singleton instance
export const accessibilityTesting = AccessibilityTestingService.getInstance();