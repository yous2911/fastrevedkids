import { ApiResponse, PaginatedResponse, RequestConfig } from '../types/api.types';

// Enhanced error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 0,
    public code: string = 'API_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestId = 0;
  
  constructor() {
    // Enhanced base URL detection with fallbacks
    this.baseURL = this.initializeBaseURL();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client': 'reved-kids-frontend'
    };
    
    this.logConnectionInfo();
  }

  private initializeBaseURL(): string {
    // Try multiple environment variable names and fallbacks
    const possibleUrls = [
      process.env.REACT_APP_API_URL,
      process.env.REACT_APP_API_BASE_URL,
      process.env.REACT_APP_BACKEND_URL,
      'http://localhost:3003/api', // Default fallback
    ];

    for (const url of possibleUrls) {
      if (url && url.trim()) {
        return url.trim().replace(/\/$/, ''); // Remove trailing slash
      }
    }

    // Auto-detect based on current location
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      
      // Development detection
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:3003/api`;
      }
      
      // Production fallback
      return `${protocol}//${hostname}/api`;
    }

    return 'http://localhost:3003/api';
  }

  private logConnectionInfo(): void {
    console.log(`🔗 API Service initialized`);
    console.log(`📍 Base URL: ${this.baseURL}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  }

  // Enhanced cache management
  private getCacheKey(url: string, config?: RequestConfig): string {
    const method = config?.method || 'GET';
    const body = config?.body ? JSON.stringify(config.body) : '';
    const headers = config?.headers ? JSON.stringify(config.headers) : '';
    return `${method}:${url}:${body}:${headers}`;
  }

  private getCache<T>(key: string): ApiResponse<T> | null {
    const cached = this.requestCache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.requestCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Cleanup old cache entries periodically
    if (this.requestCache.size > 100) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.requestCache.entries()) {
      if (now > cached.timestamp + cached.ttl) {
        this.requestCache.delete(key);
      }
    }
  }

  // Enhanced HTTP client with improved error handling and retry logic
  private async request<T = any>(
    endpoint: string, 
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = parseInt(process.env.REACT_APP_API_TIMEOUT || '10000'),
      retries = 3,
      cache = false
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = this.getCacheKey(url, config);
    const requestIdLocal = ++this.requestId;

    // Enhanced cache handling
    if (cache && method === 'GET') {
      const cached = this.getCache<T>(cacheKey);
      if (cached) {
        console.log(`📦 Cache hit [${requestIdLocal}]: ${method} ${endpoint}`);
        return cached;
      }
    }

    const requestHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...headers,
      'X-Request-ID': requestIdLocal.toString(),
    };

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout),
      credentials: 'include', // For CORS cookies
    };

    // Only add body for non-GET requests
    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        delete requestHeaders['Content-Type']; // Let browser set it
        requestConfig.body = body;
      } else {
        requestConfig.body = JSON.stringify(body);
      }
    }

    let lastError: Error = new NetworkError('Unknown error');
    
    // Enhanced retry logic with exponential backoff
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 API Request [${requestIdLocal}:${attempt}/${retries}]: ${method} ${endpoint}`);
        
        const response = await fetch(url, requestConfig);
        
        // Handle different content types
        let responseData: any;
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
          } else {
            const text = await response.text();
            responseData = text ? { message: text } : {};
          }
        } catch (parseError) {
          console.warn('Failed to parse response:', parseError);
          responseData = { message: 'Invalid response format' };
        }

        // Enhanced error handling
        if (!response.ok) {
          const errorMessage = responseData.error?.message || 
                             responseData.message || 
                             `HTTP ${response.status}: ${response.statusText}`;
          const errorCode = responseData.error?.code || 'HTTP_ERROR';
          
          const apiError = new ApiError(errorMessage, response.status, errorCode, responseData);
          
          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw apiError;
          }
          
          lastError = apiError;
          throw apiError;
        }

        // Normalize response structure
        if (typeof responseData !== 'object' || responseData === null) {
          responseData = { success: true, data: responseData };
        }
        
        if (typeof responseData.success !== 'boolean') {
          responseData.success = true;
        }

        // Cache successful responses
        if (cache && method === 'GET' && responseData.success) {
          this.setCache(cacheKey, responseData);
        }

        console.log(`✅ API Success [${requestIdLocal}]: ${method} ${endpoint} (${response.status})`);
        return responseData;

      } catch (error: unknown) {
        // Enhanced error categorization
        if (error instanceof ApiError) {
          lastError = error;
          // Don't retry client errors (4xx)
          if (error.status >= 400 && error.status < 500) {
            break;
          }
        } else if (error instanceof TypeError || (error as Error).name === 'TypeError') {
          lastError = new NetworkError('Connexion impossible - Vérifiez votre réseau');
        } else if ((error as Error).name === 'AbortError') {
          lastError = new NetworkError('Délai d\'attente dépassé');
        } else if ((error as Error).name === 'TimeoutError') {
          lastError = new NetworkError('Timeout - Serveur trop lent');
        } else {
          lastError = error instanceof Error ? error : new NetworkError('Erreur inconnue');
        }

        // Exponential backoff with jitter
        if (attempt < retries) {
          const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          
          console.log(`⏳ Retry [${requestIdLocal}] in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`❌ API Failed [${requestIdLocal}] after ${retries} attempts: ${method} ${endpoint}`, lastError);
    throw lastError;
  }

  // Convenience methods matching backend endpoints
  async get<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data });
  }

  async put<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data });
  }

  async patch<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body: data });
  }

  async delete<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Health check with enhanced diagnostics
  async healthCheck(): Promise<{ healthy: boolean; latency: number; details?: any }> {
    const start = Date.now();
    try {
      const response = await this.get('/health', { timeout: 5000, cache: false });
      const latency = Date.now() - start;
      
      return { 
        healthy: true, 
        latency,
        details: response.data 
      };
    } catch (error) {
      const latency = Date.now() - start;
      return { 
        healthy: false, 
        latency,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Connection test
  async testConnection(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      console.log(`🏥 Health check: ${health.healthy ? '✅' : '❌'} (${health.latency}ms)`);
      return health.healthy;
    } catch (error) {
      console.error('🏥 Health check failed:', error);
      return false;
    }
  }

  // Cache management
  clearCache(): void {
    this.requestCache.clear();
    console.log('🗑️ API cache cleared');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys())
    };
  }

  // Authentication management
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    console.log('🔐 Auth token set');
  }

  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
    console.log('🔓 Auth token removed');
  }

  // URL management
  getBaseURL(): string {
    return this.baseURL;
  }

  setBaseURL(url: string): void {
    this.baseURL = url.replace(/\/$/, '');
    console.log(`🔗 Base URL updated: ${this.baseURL}`);
  }

  // Debug helpers
  getRequestStats(): any {
    return {
      baseURL: this.baseURL,
      defaultHeaders: { ...this.defaultHeaders },
      cacheSize: this.requestCache.size,
      lastRequestId: this.requestId,
    };
  }
}

// Global instance with connection test on initialization
export const apiService = new ApiService();

// Auto-test connection in development
if (process.env.NODE_ENV === 'development') {
  apiService.testConnection().catch(() => {
    console.warn('⚠️  Initial connection test failed - this is normal if backend is not running');
  });
} 