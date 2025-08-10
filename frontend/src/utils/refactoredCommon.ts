/**
 * Refactored Common Utilities
 * Consolidated functions to eliminate code duplication
 */

// ===== ERROR HANDLING =====

export interface ErrorWithContext extends Error {
  context?: string;
  timestamp?: Date;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Standardized error handling utility
 * Replaces duplicate error handling patterns across components
 */
export const handleError = (
  error: Error | unknown,
  context?: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): void => {
  const errorObj: ErrorWithContext = error instanceof Error ? error : new Error(String(error));
  errorObj.context = context;
  errorObj.timestamp = new Date();
  errorObj.severity = severity;

  // Console logging with severity-based styling
  const STYLES = {
    low: 'color: #6b7280',
    medium: 'color: #f59e0b',
    high: 'color: #ef4444',
    critical: 'color: #dc2626; font-weight: bold'
  };

  console.error(
    `%c[${severity.toUpperCase()}] ${context ? `${context}: ` : ''}${errorObj.message}`,
    STYLES[severity]
  );

  // In production, this would integrate with error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Send to error reporting service (Sentry, etc.)
  }
};

/**
 * Safe async operation wrapper
 * Replaces try-catch blocks throughout the codebase
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context, 'medium');
    return fallback;
  }
};

/**
 * Retry mechanism for failed operations
 * Consolidates retry logic from multiple components
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> => {
  let lastError: Error;
  
  for (let ATTEMPT = 1; ATTEMPT <= maxRetries; ATTEMPT++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (ATTEMPT === maxRetries) break;
      
      const waitTime = delay * Math.pow(backoffMultiplier, ATTEMPT - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
};

// ===== PERFORMANCE UTILITIES =====

/**
 * Debounce function - eliminates duplicate implementations
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle function - prevents excessive function calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(null, args);
    }
  };
};

/**
 * Performance measurement utility
 */
export const measurePerformance = <T>(
  operation: () => T,
  label?: string
): T => {
  const start = performance.now();
  const result = operation();
  const end = performance.now();
  
  console.log(
    `⚡ Performance${label ? ` [${label}]` : ''}: ${(end - start).toFixed(2)}ms`
  );
  
  return result;
};

/**
 * Async performance measurement
 */
export const measureAsyncPerformance = async <T>(
  operation: () => Promise<T>,
  label?: string
): Promise<T> => {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  
  console.log(
    `⚡ Async Performance${label ? ` [${label}]` : ''}: ${(end - start).toFixed(2)}ms`
  );
  
  return result;
};

// ===== DATA UTILITIES =====

/**
 * Deep clone utility - replaces multiple implementations
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof RegExp) return new RegExp(obj) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  
  if (obj instanceof Object) {
    const CLONED_OBJ = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        (CLONED_OBJ as any)[key] = deepClone((obj as any)[key]);
      }
    }
    return CLONED_OBJ;
  }
  
  return obj;
};

/**
 * Object comparison utility
 */
export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    
    return true;
  }
  
  return false;
};

// ===== ARRAY UTILITIES =====

/**
 * Remove duplicates from array by key
 */
export const uniqueBy = <T>(array: T[], keyFn: (item: T) => any): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Group array items by key
 */
export const groupBy = <T>(
  array: T[],
  keyFn: (item: T) => string | number
): Record<string | number, T[]> => {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string | number, T[]>);
};

/**
 * Chunk array into smaller arrays
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// ===== FORMAT UTILITIES =====

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const SIZES = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + SIZES[i];
};

/**
 * Format duration in milliseconds to human readable string
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

/**
 * Format percentage with proper precision
 */
export const formatPercentage = (value: number, total: number, decimals: number = 1): string => {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

// ===== VALIDATION UTILITIES =====

/**
 * Email validation
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

/**
 * URL validation
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// ===== DOM UTILITIES =====

/**
 * Scroll to element smoothly
 */
export const scrollToElement = (
  element: HTMLElement | string,
  options?: ScrollIntoViewOptions
): void => {
  const targetElement = typeof element === 'string' 
    ? document.querySelector(element) as HTMLElement
    : element;
  
  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      ...options
    });
  }
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    handleError(error, 'copyToClipboard', 'low');
    return false;
  }
};

// ===== STORAGE UTILITIES =====

/**
 * Safe localStorage operations
 */
export const STORAGE = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
};

// ===== RANDOM UTILITIES =====

/**
 * Generate random ID
 */
export const generateId = (length: number = 8): string => {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
};

/**
 * Generate UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ===== TYPE GUARDS =====

/**
 * Check if value is a function
 */
export const isFunction = (value: any): value is Function => {
  return typeof value === 'function';
};

/**
 * Check if value is an object (not array or null)
 */
export const isObject = (value: any): value is Record<string, any> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Check if value is a promise
 */
export const isPromise = (value: any): value is Promise<any> => {
  return value && typeof value.then === 'function';
};