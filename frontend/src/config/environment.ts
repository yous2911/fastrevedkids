/**
 * Environment Configuration for RevEd Kids Frontend
 * Handles different deployment environments with type safety
 */

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  env: Environment;
  apiUrl: string;
  wsUrl: string;
  cdnUrl: string;
  sentryDsn: string;
  analyticsId: string;
  debugMode: boolean;
  enableDevTools: boolean;
  enablePerformanceMonitoring: boolean;
  enableErrorBoundary: boolean;
  enableServiceWorker: boolean;
  enableOfflineMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  features: {
    a11yTesting: boolean;
    performanceTesting: boolean;
    memoryTesting: boolean;
    betaFeatures: boolean;
    experimentalFeatures: boolean;
  };
  caching: {
    staticAssets: number; // in milliseconds
    apiResponses: number;
    images: number;
    audio: number;
    threeJsAssets: number;
  };
  performance: {
    budgets: {
      bundleSize: number; // in MB
      chunkSize: number; // in MB
      imageSize: number; // in KB
      audioSize: number; // in KB
    };
    thresholds: {
      firstContentfulPaint: number; // in ms
      largestContentfulPaint: number; // in ms
      cumulativeLayoutShift: number; // score
      firstInputDelay: number; // in ms
    };
  };
  security: {
    enableCSP: boolean;
    enableHSTS: boolean;
    allowedOrigins: string[];
    trustedDomains: string[];
  };
}

const baseConfig: Omit<EnvironmentConfig, 'env' | 'apiUrl' | 'wsUrl' | 'cdnUrl' | 'sentryDsn' | 'analyticsId'> = {
  debugMode: false,
  enableDevTools: false,
  enablePerformanceMonitoring: true,
  enableErrorBoundary: true,
  enableServiceWorker: true,
  enableOfflineMode: true,
  logLevel: 'warn',
  features: {
    a11yTesting: false,
    performanceTesting: false,
    memoryTesting: false,
    betaFeatures: false,
    experimentalFeatures: false,
  },
  caching: {
    staticAssets: 24 * 60 * 60 * 1000, // 24 hours
    apiResponses: 5 * 60 * 1000, // 5 minutes
    images: 7 * 24 * 60 * 60 * 1000, // 7 days
    audio: 30 * 24 * 60 * 60 * 1000, // 30 days
    threeJsAssets: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  performance: {
    budgets: {
      bundleSize: 3, // 3MB
      chunkSize: 1, // 1MB
      imageSize: 200, // 200KB
      audioSize: 500, // 500KB
    },
    thresholds: {
      firstContentfulPaint: 2000, // 2s
      largestContentfulPaint: 4000, // 4s
      cumulativeLayoutShift: 0.1, // 0.1
      firstInputDelay: 100, // 100ms
    },
  },
  security: {
    enableCSP: true,
    enableHSTS: true,
    allowedOrigins: [],
    trustedDomains: ['revedkids.com', 'api.revedkids.com'],
  },
};

const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    ...baseConfig,
    env: 'development',
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3003',
    wsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:3003',
    cdnUrl: process.env.REACT_APP_CDN_URL || '/assets',
    sentryDsn: process.env.REACT_APP_SENTRY_DSN || '',
    analyticsId: process.env.REACT_APP_ANALYTICS_ID || '',
    debugMode: true,
    enableDevTools: true,
    enablePerformanceMonitoring: false,
    enableServiceWorker: false,
    enableOfflineMode: false,
    logLevel: 'debug',
    features: {
      a11yTesting: true,
      performanceTesting: true,
      memoryTesting: true,
      betaFeatures: true,
      experimentalFeatures: true,
    },
    security: {
      ...baseConfig.security,
      enableCSP: false,
      allowedOrigins: ['http://localhost:3000', 'http://localhost:3003'],
    },
    performance: {
      ...baseConfig.performance,
      budgets: {
        bundleSize: 10, // More lenient in dev
        chunkSize: 5,
        imageSize: 1000,
        audioSize: 2000,
      },
    },
  },

  staging: {
    ...baseConfig,
    env: 'staging',
    apiUrl: process.env.REACT_APP_API_URL || 'https://staging-api.revedkids.com',
    wsUrl: process.env.REACT_APP_WS_URL || 'wss://staging-api.revedkids.com',
    cdnUrl: process.env.REACT_APP_CDN_URL || 'https://staging-cdn.revedkids.com',
    sentryDsn: process.env.REACT_APP_SENTRY_DSN || '',
    analyticsId: process.env.REACT_APP_ANALYTICS_ID || '',
    debugMode: true,
    enableDevTools: true,
    logLevel: 'info',
    features: {
      a11yTesting: true,
      performanceTesting: true,
      memoryTesting: true,
      betaFeatures: true,
      experimentalFeatures: false,
    },
    security: {
      ...baseConfig.security,
      allowedOrigins: ['https://staging.revedkids.com'],
      trustedDomains: ['staging.revedkids.com', 'staging-api.revedkids.com'],
    },
  },

  production: {
    ...baseConfig,
    env: 'production',
    apiUrl: process.env.REACT_APP_API_URL || 'https://api.revedkids.com',
    wsUrl: process.env.REACT_APP_WS_URL || 'wss://api.revedkids.com',
    cdnUrl: process.env.REACT_APP_CDN_URL || 'https://cdn.revedkids.com',
    sentryDsn: process.env.REACT_APP_SENTRY_DSN || '',
    analyticsId: process.env.REACT_APP_ANALYTICS_ID || '',
    logLevel: 'error',
    security: {
      ...baseConfig.security,
      allowedOrigins: ['https://revedkids.com', 'https://www.revedkids.com'],
    },
  },
};

// Get current environment
const getEnvironment = (): Environment => {
  const env = process.env.NODE_ENV as Environment;
  return environments[env] ? env : 'development';
};

// Get current configuration
export const getCurrentEnvironment = (): Environment => getEnvironment();

export const getConfig = (): EnvironmentConfig => {
  const env = getEnvironment();
  return environments[env];
};

// Environment-specific utilities
export const isDevelopment = (): boolean => getEnvironment() === 'development';
export const isStaging = (): boolean => getEnvironment() === 'staging';
export const isProduction = (): boolean => getEnvironment() === 'production';

// Feature flags
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['features']): boolean => {
  return getConfig().features[feature];
};

// Performance budgets
export const getPerformanceBudget = (type: keyof EnvironmentConfig['performance']['budgets']) => {
  return getConfig().performance.budgets[type];
};

// Cache duration helpers
export const getCacheDuration = (type: keyof EnvironmentConfig['caching']) => {
  return getConfig().caching[type];
};

// URL builders
export const getApiUrl = (endpoint: string): string => {
  const config = getConfig();
  return `${config.apiUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

export const getWsUrl = (endpoint: string): string => {
  const config = getConfig();
  return `${config.wsUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

export const getCdnUrl = (asset: string): string => {
  const config = getConfig();
  return `${config.cdnUrl}${asset.startsWith('/') ? '' : '/'}${asset}`;
};

// Logging utility
export const shouldLog = (level: EnvironmentConfig['logLevel']): boolean => {
  const config = getConfig();
  const levels = ['error', 'warn', 'info', 'debug'];
  const currentLevelIndex = levels.indexOf(config.logLevel);
  const messageLevelIndex = levels.indexOf(level);
  return messageLevelIndex <= currentLevelIndex;
};

// Environment validation
export const validateEnvironment = (): { valid: boolean; errors: string[] } => {
  const config = getConfig();
  const errors: string[] = [];

  // Check required URLs
  if (!config.apiUrl) {
    errors.push('API URL is not configured');
  }

  // Check Sentry DSN in production
  if (isProduction() && !config.sentryDsn) {
    errors.push('Sentry DSN is required in production');
  }

  // Check Analytics ID in production
  if (isProduction() && !config.analyticsId) {
    errors.push('Analytics ID is required in production');
  }

  // Validate performance budgets
  if (config.performance.budgets.bundleSize <= 0) {
    errors.push('Bundle size budget must be positive');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Export config for immediate use
export const config = getConfig();

// Environment info for debugging
export const getEnvironmentInfo = () => ({
  environment: getCurrentEnvironment(),
  version: process.env.REACT_APP_VERSION || '1.0.0',
  buildTime: process.env.REACT_APP_BUILD_TIME || new Date().toISOString(),
  commit: process.env.REACT_APP_GIT_COMMIT || 'unknown',
  nodeEnv: process.env.NODE_ENV,
  config: getConfig(),
});

// Console logging for environment info (only in development)
if (isDevelopment()) {
  console.group('🌍 Environment Configuration');
  console.log('Environment:', getCurrentEnvironment());
  console.log('Config:', getConfig());
  console.log('Validation:', validateEnvironment());
  console.groupEnd();
}