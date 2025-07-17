import { ApiResponse, PaginatedResponse, ApiError, NetworkError, RequestConfig } from '../types/api.types';

export class ApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  constructor(baseURL: string = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Cache management matching backend pattern
  private getCacheKey(url: string, config?: RequestConfig): string {
    const method = config?.method || 'GET';
    const body = config?.body ? JSON.stringify(config.body) : '';
    return `${method}:${url}:${body}`;
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

  private isCacheValid(key: string): boolean {
    const cached = this.requestCache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    return now <= cached.timestamp + cached.ttl;
  }

  private setCache(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Enhanced HTTP client with improved error handling
  private async request<T = any>(
    endpoint: string, 
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 10000,
      retries = 3,
      cache = false
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = this.getCacheKey(url, config);

    // Enhanced cache handling
    if (cache && method === 'GET') {
      const cached = this.getCache<T>(cacheKey);
      if (cached && this.isCacheValid(cacheKey)) {
        console.log(`📦 Cache hit: ${cacheKey}`);
        return cached;
      }
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...this.defaultHeaders,
      ...headers
    };

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout)
    };

    // Only add body for non-GET requests
    if (body && method !== 'GET') {
      requestConfig.body = JSON.stringify(body);
    }

    let lastError: Error = new NetworkError('Unknown error');
    
    // Enhanced retry logic with exponential backoff
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 API Request [${attempt}/${retries}]: ${method} ${url}`);
        
        const response = await fetch(url, requestConfig);
        
        // Handle empty responses
        let responseData: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const text = await response.text();
          responseData = text ? { message: text } : {};
        }

        // Enhanced error handling
        if (!response.ok) {
          const errorMessage = responseData.error?.message || 
                             responseData.message || 
                             `HTTP ${response.status}: ${response.statusText}`;
          const errorCode = responseData.error?.code || 'HTTP_ERROR';
          
          throw new ApiError(errorMessage, response.status, errorCode);
        }

        // Validate response structure
        if (typeof responseData !== 'object') {
          responseData = { success: true, data: responseData };
        }
        
        if (typeof responseData.success !== 'boolean') {
          responseData.success = true;
        }

        // Cache successful responses properly
        if (cache && method === 'GET' && responseData.success) {
          this.setCache(cacheKey, responseData);
        }

        console.log(`✅ API Success: ${method} ${url}`);
        return responseData;

      } catch (error: unknown) {
        // Better error categorization
        if (error instanceof ApiError) {
          lastError = error;
          // Don't retry client errors (4xx)
          if (error.status >= 400 && error.status < 500) {
            throw error;
          }
        } else if (error instanceof TypeError || (error as Error).name === 'AbortError') {
          lastError = new NetworkError('Connexion interrompue ou timeout');
        } else if ((error as Error).name === 'TimeoutError') {
          lastError = new NetworkError('Délai d\'attente dépassé');
        } else {
          lastError = error as Error;
        }

        // Exponential backoff with jitter
        if (attempt < retries) {
          const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          
          console.log(`⏳ Retry in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`❌ API Failed after ${retries} attempts: ${method} ${url}`, lastError);
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

  async delete<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Health check matching backend
  async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    const start = Date.now();
    try {
      await this.get('/health', { timeout: 5000, cache: false });
      return { healthy: true, latency: Date.now() - start };
    } catch {
      return { healthy: false, latency: Date.now() - start };
    }
  }

  // Clear cache (useful for logout, data refresh)
  clearCache(): void {
    this.requestCache.clear();
  }

  // Set authentication header
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }
}

// Global instance
export const apiService = new ApiService(); 