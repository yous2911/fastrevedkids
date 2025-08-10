/**
 * React Hook for Accessibility Testing Integration
 * Provides easy integration with the accessibility testing service
 */

import { useEffect, useState, useCallback } from 'react';
import { accessibilityTesting } from '../services/accessibility-testing.service';

// Define types locally to avoid import issues
interface AccessibilityReport {
  violations: any[];
  passes: any[];
  incomplete: any[];
  inapplicable: any[];
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

interface UseAccessibilityTestingOptions {
  autoTest?: boolean;
  autoFix?: boolean;
  testInterval?: number;
  onViolations?: (violations: any[]) => void;
  onTestComplete?: (report: AccessibilityReport) => void;
}

interface UseAccessibilityTestingReturn {
  currentReport: AccessibilityReport | null;
  isTestRunning: boolean;
  lastAutoFixResult: AutoFixResult | null;
  runTest: (selector?: string) => Promise<AccessibilityReport>;
  autoFix: (report?: AccessibilityReport) => Promise<AutoFixResult>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  generateReport: (format?: 'console' | 'html' | 'json') => string | void;
  validateWCAG: (level?: 'A' | 'AA' | 'AAA') => Promise<{ isCompliant: boolean; violations: any[]; level: string; }>;
}

export const useAccessibilityTesting = (options: UseAccessibilityTestingOptions = {}): UseAccessibilityTestingReturn => {
  const {
    autoTest = false,
    autoFix = false,
    testInterval = 30000,
    onViolations,
    onTestComplete
  } = options;

  const [currentReport, setCurrentReport] = useState<AccessibilityReport | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [lastAutoFixResult, setLastAutoFixResult] = useState<AutoFixResult | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const runTest = useCallback(async (selector?: string): Promise<AccessibilityReport> => {
    setIsTestRunning(true);
    
    try {
      const report = selector 
        ? await accessibilityTesting.testComponent(selector)
        : await accessibilityTesting.runAccessibilityTest();
      
      setCurrentReport(report);
      
      if (report.violationCount > 0 && onViolations) {
        onViolations(report.violations);
      }
      
      if (onTestComplete) {
        onTestComplete(report);
      }
      
      // Auto-fix if enabled and there are violations
      if (autoFix && report.violationCount > 0) {
        const fixResult = await accessibilityTesting.autoFixViolations(report);
        setLastAutoFixResult(fixResult);
        
        // Run test again to see if fixes worked
        if (fixResult.fixed > 0) {
          const retestReport = await accessibilityTesting.runAccessibilityTest();
          setCurrentReport(retestReport);
        }
      }
      
      return report;
    } catch (error) {
      console.error('Accessibility test failed:', error);
      throw error;
    } finally {
      setIsTestRunning(false);
    }
  }, [autoFix, onViolations, onTestComplete]);

  const performAutoFix = useCallback(async (report?: AccessibilityReport): Promise<AutoFixResult> => {
    try {
      const fixResult = await accessibilityTesting.autoFixViolations(report || currentReport || undefined);
      setLastAutoFixResult(fixResult);
      
      // Re-run test after fixes
      if (fixResult.fixed > 0) {
        await runTest();
      }
      
      return fixResult;
    } catch (error) {
      console.error('Auto-fix failed:', error);
      throw error;
    }
  }, [currentReport, runTest]);

  const startMonitoring = useCallback(() => {
    if (!isMonitoring) {
      accessibilityTesting.startContinuousMonitoring(testInterval);
      setIsMonitoring(true);
    }
  }, [isMonitoring, testInterval]);

  const stopMonitoring = useCallback(() => {
    if (isMonitoring) {
      accessibilityTesting.stopContinuousMonitoring();
      setIsMonitoring(false);
    }
  }, [isMonitoring]);

  const generateReport = useCallback((format: 'console' | 'html' | 'json' = 'console') => {
    return accessibilityTesting.generateReport(format, currentReport || undefined);
  }, [currentReport]);

  const validateWCAG = useCallback(async (level: 'A' | 'AA' | 'AAA' = 'AA') => {
    return accessibilityTesting.validateWCAGCompliance(level);
  }, []);

  // Auto-test on mount and when enabled
  useEffect(() => {
    if (autoTest) {
      const timer = setTimeout(() => {
        runTest();
      }, 1000); // Small delay to ensure DOM is ready

      return () => clearTimeout(timer);
    }
  }, [autoTest, runTest]);

  // Cleanup monitoring on unmount
  useEffect(() => {
    return () => {
      if (isMonitoring) {
        accessibilityTesting.stopContinuousMonitoring();
      }
    };
  }, [isMonitoring]);

  return {
    currentReport,
    isTestRunning,
    lastAutoFixResult,
    runTest,
    autoFix: performAutoFix,
    startMonitoring,
    stopMonitoring,
    generateReport,
    validateWCAG
  };
};

/**
 * Hook for development-only accessibility testing
 * Only runs in development mode to avoid production overhead
 */
export const useDevAccessibilityTesting = (options: UseAccessibilityTestingOptions = {}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return useAccessibilityTesting(
    isDevelopment ? options : { ...options, autoTest: false, autoFix: false }
  );
};

/**
 * Hook for accessibility testing specific components
 */
export const useComponentAccessibilityTesting = (selector: string, options: UseAccessibilityTestingOptions = {}) => {
  const testing = useAccessibilityTesting(options);
  
  const testComponent = useCallback(() => {
    return testing.runTest(selector);
  }, [selector, testing.runTest]);

  useEffect(() => {
    if (options.autoTest) {
      const timer = setTimeout(testComponent, 1000);
      return () => clearTimeout(timer);
    }
  }, [options.autoTest, testComponent]);

  return {
    ...testing,
    testComponent
  };
};