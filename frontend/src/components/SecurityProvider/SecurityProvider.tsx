// Provider component to enforce security policies
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { SecurityUtils } from '../../utils/security';
import { reportError } from '../../utils/sentry';

interface SecurityContextType {
  sanitizeInput: (input: string) => string;
  isValidUrl: (url: string) => boolean;
  secureStorage: typeof SecurityUtils.secureStorage;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  useEffect(() => {
    // Set up security monitoring
    const handleSecurityViolation = (event: SecurityPolicyViolationEvent) => {
      reportError(
        new Error(`CSP Violation: ${event.violatedDirective}`),
        {
          blockedURI: event.blockedURI,
          documentURI: event.documentURI,
          effectiveDirective: event.effectiveDirective,
          originalPolicy: event.originalPolicy,
          sourceFile: event.sourceFile,
          lineNumber: event.lineNumber,
          columnNumber: event.columnNumber,
        }
      );
      
      console.error('CSP Violation:', event);
    };

    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', handleSecurityViolation);

    // Set up trusted types if supported
    const trustedTypes = (window as any).trustedTypes;
    if (trustedTypes && typeof trustedTypes.createPolicy === 'function') {
      try {
        trustedTypes.createPolicy('default', {
          createHTML: (string: string) => string,
          createScript: (string: string) => string,
          createScriptURL: (string: string) => string,
        });
      } catch (error) {
        console.warn('Trusted Types policy already exists');
      }
    }

    return () => {
      document.removeEventListener('securitypolicyviolation', handleSecurityViolation);
    };
  }, []);

  const contextValue: SecurityContextType = {
    sanitizeInput: SecurityUtils.sanitizeInput,
    isValidUrl: SecurityUtils.isValidUrl,
    secureStorage: SecurityUtils.secureStorage,
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}; 