// Global type declarations to fix TypeScript errors

// Extend Window interface for trustedTypes
interface Window {
  trustedTypes?: {
    createPolicy: (
      name: string,
      rules: {
        createHTML?: (string: string) => string;
        createScript?: (string: string) => string;
        createScriptURL?: (string: string) => string;
      }
    ) => any;
  };
  gtag?: (...args: any[]) => void;
  isSecureContext?: boolean;
}

// Extend global for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export {}; 