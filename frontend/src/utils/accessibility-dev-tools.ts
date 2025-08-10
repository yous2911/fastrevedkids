/**
 * Development Tools for Accessibility Testing
 * Provides global functions and utilities for accessibility testing in development
 */

import { accessibilityTesting } from '../services/accessibility-testing.service';
import { keyboardNav } from '../services/keyboard-navigation.service';
import { ariaIntelligence } from '../services/aria-intelligence.service';

// Global accessibility testing utilities for development
if (process.env.NODE_ENV === 'development') {
  // Add global functions to window object for console access
  (window as any).a11y = {
    // Testing functions
    test: () => accessibilityTesting.runAccessibilityTest(),
    testComponent: (selector: string) => accessibilityTesting.testComponent(selector),
    autoFix: () => accessibilityTesting.autoFixViolations(),
    
    // WCAG validation
    validateWCAG: (level: 'A' | 'AA' | 'AAA' = 'AA') => accessibilityTesting.validateWCAGCompliance(level),
    
    // Reports
    report: (format: 'console' | 'html' | 'json' = 'console') => accessibilityTesting.generateReport(format),
    downloadReport: () => {
      const html = accessibilityTesting.generateReport('html') as string;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);
    },
    
    // Monitoring
    startMonitoring: (interval = 30000) => accessibilityTesting.startContinuousMonitoring(interval),
    stopMonitoring: () => accessibilityTesting.stopContinuousMonitoring(),
    
    // ARIA Intelligence
    enhanceARIA: (root?: Element) => ariaIntelligence.enhanceAccessibility(root),
    updateElement: (selector: string) => {
      const element = document.querySelector(selector);
      if (element) ariaIntelligence.updateElement(element);
    },
    
    // Keyboard Navigation
    focusNext: () => keyboardNav.navigateNext(),
    focusPrevious: () => keyboardNav.navigatePrevious(),
    focusElement: (selector: string) => {
      const element = document.querySelector(selector) as HTMLElement;
      return keyboardNav.focusElement(element);
    },
    createFocusTrap: (selector: string) => {
      const container = document.querySelector(selector) as HTMLElement;
      if (container) {
        keyboardNav.createFocusTrap({
          trapContainer: container,
          escapeDeactivates: true
        });
      }
    },
    releaseFocusTrap: () => keyboardNav.deactivateFocusTrap(),
    
    // Utility functions
    findFocusable: (container?: Element) => keyboardNav.getFocusableElements(container as HTMLElement),
    highlight: (selector: string, color = 'red') => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        (element as HTMLElement).style.outline = `2px solid ${color}`;
      });
    },
    removeHighlight: (selector: string) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        (element as HTMLElement).style.outline = '';
      });
    },
    
    // Accessibility audit shortcuts
    quickAudit: async () => {
      console.group('🧪 Quick Accessibility Audit');
      
      // Run basic test
      const report = await accessibilityTesting.runAccessibilityTest();
      console.log(`Violations: ${report.violationCount}, Passes: ${report.passCount}`);
      
      // Test WCAG compliance
      const wcag = await accessibilityTesting.validateWCAGCompliance('AA');
      console.log(`WCAG 2.1 AA Compliant: ${wcag.isCompliant}`);
      
      // Check keyboard navigation
      const focusable = keyboardNav.getFocusableElements();
      console.log(`Focusable elements: ${focusable.length}`);
      
      // Auto-fix if violations found
      if (report.violationCount > 0) {
        const fixes = await accessibilityTesting.autoFixViolations(report);
        console.log(`Auto-fixed: ${fixes.fixed}/${fixes.fixed + fixes.failed} issues`);
      }
      
      console.groupEnd();
      return {
        report,
        wcag,
        focusableCount: focusable.length,
        autoFixed: report.violationCount > 0 ? await accessibilityTesting.autoFixViolations(report) : null
      };
    },
    
    // Help function
    help: () => {
      console.log(`
🧪 Accessibility Development Tools

Basic Testing:
  a11y.test()                    - Run accessibility test
  a11y.testComponent('.selector') - Test specific component
  a11y.autoFix()                 - Auto-fix violations
  a11y.quickAudit()              - Complete accessibility audit

WCAG Validation:
  a11y.validateWCAG('AA')        - Validate WCAG compliance (A, AA, AAA)

Reports:
  a11y.report()                  - Show report in console
  a11y.report('html')            - Get HTML report
  a11y.downloadReport()          - Download HTML report

Monitoring:
  a11y.startMonitoring()         - Start continuous monitoring
  a11y.stopMonitoring()          - Stop monitoring

ARIA Enhancement:
  a11y.enhanceARIA()             - Enhance all elements
  a11y.updateElement('.selector') - Enhance specific element

Keyboard Navigation:
  a11y.focusNext()               - Focus next element
  a11y.focusPrevious()           - Focus previous element
  a11y.focusElement('.selector')  - Focus specific element
  a11y.createFocusTrap('.modal')  - Create focus trap
  a11y.releaseFocusTrap()        - Release focus trap

Utilities:
  a11y.findFocusable()           - Find all focusable elements
  a11y.highlight('.selector')     - Highlight elements
  a11y.removeHighlight('.selector') - Remove highlighting

For help: a11y.help()
      `);
    }
  };

  // Add keyboard shortcuts for quick testing
  document.addEventListener('keydown', (event) => {
    // Ctrl+Alt+A - Quick accessibility audit
    if (event.ctrlKey && event.altKey && event.key === 'a') {
      event.preventDefault();
      (window as any).a11y.quickAudit();
    }
    
    // Ctrl+Alt+T - Run accessibility test
    if (event.ctrlKey && event.altKey && event.key === 't') {
      event.preventDefault();
      (window as any).a11y.test();
    }
    
    // Ctrl+Alt+F - Auto-fix violations
    if (event.ctrlKey && event.altKey && event.key === 'f') {
      event.preventDefault();
      (window as any).a11y.autoFix();
    }
    
    // Ctrl+Alt+R - Generate report
    if (event.ctrlKey && event.altKey && event.key === 'r') {
      event.preventDefault();
      (window as any).a11y.report();
    }
  });

  // Welcome message
  console.log(`
🧪 Accessibility Development Tools Loaded!

Quick shortcuts:
  Ctrl+Alt+A - Quick audit
  Ctrl+Alt+T - Run test  
  Ctrl+Alt+F - Auto-fix
  Ctrl+Alt+R - Show report

Type 'a11y.help()' in console for all commands
  `);
}

export {};