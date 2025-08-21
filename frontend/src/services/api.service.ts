import { ApiResponse, RequestConfig } from '../types/api.types';
import {
  SubmitConsentRequest,
  SubmitConsentResponse,
  SubmitGDPRRequest,
  SubmitGDPRResponse,
  ConsentPreferencesRequest,
  GDPRRequestStatusResponse,
  StudentDataExportRequest,
  ParentalConsentRecord,
  GDPRRequestRecord,
  ConsentPreferencesRecord
} from '../types/gdpr.types';

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

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  tags: string[];
  dependencies: string[];
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition: (error: any) => boolean;
}

export class ApiService {
  private static authToken: string | null = null;
  private static refreshInProgress = false;
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestCache = new Map<string, CacheEntry>();
  private requestId = 0;
  private cacheInvalidationRules = new Map<string, string[]>();
  private retryConfig: RetryConfig;
  
  constructor() {
    // Enhanced base URL detection with fallbacks
    this.baseURL = this.initializeBaseURL();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client': 'reved-kids-frontend'
    };
    
    // Initialize intelligent retry configuration
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      retryCondition: (error: any) => {
        // Retry on network errors, 5xx errors, and specific 4xx errors
        return error instanceof NetworkError ||
               (error instanceof ApiError && error.status >= 500) ||
               (error instanceof ApiError && [408, 429].includes(error.status));
      }
    };
    
    // Setup cache invalidation rules
    this.setupCacheInvalidationRules();
    
    this.logConnectionInfo();
  }

  private initializeBaseURL(): string {
    // Try multiple environment variable names and fallbacks
    const POSSIBLE_URLS = [
      process.env.REACT_APP_API_URL,
      process.env.REACT_APP_API_BASE_URL,
      process.env.REACT_APP_BACKEND_URL,
      'http://localhost:5000/api', // Default fallback
    ];

    for (const url of POSSIBLE_URLS) {
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
        return `${protocol}//${hostname}:5000/api`;
      }
      
      // Production fallback
      return `${protocol}//${hostname}/api`;
    }

    return 'http://localhost:5000/api';
  }

  private setupCacheInvalidationRules(): void {
    // Define which endpoints invalidate which cache tags
    this.cacheInvalidationRules.set('POST:/students', ['students', 'student-stats']);
    this.cacheInvalidationRules.set('PUT:/students', ['students', 'student-stats']);
    this.cacheInvalidationRules.set('DELETE:/students', ['students', 'student-stats']);
    this.cacheInvalidationRules.set('POST:/exercises', ['exercises', 'student-progress']);
    this.cacheInvalidationRules.set('PUT:/exercises', ['exercises', 'student-progress']);
    this.cacheInvalidationRules.set('POST:/auth/login', ['auth', 'user-profile']);
    this.cacheInvalidationRules.set('POST:/auth/logout', ['auth', 'user-profile']);
    // GDPR cache invalidation rules
    this.cacheInvalidationRules.set('POST:/gdpr/consent/submit', ['consent', 'gdpr']);
    this.cacheInvalidationRules.set('POST:/gdpr/request/submit', ['gdpr', 'data-export']);
    this.cacheInvalidationRules.set('POST:/gdpr/consent/preferences', ['consent']);
    this.cacheInvalidationRules.set('GET:/gdpr/consent/verify', ['consent']);
    this.cacheInvalidationRules.set('GET:/gdpr/request/verify', ['gdpr']);
  }

  private logConnectionInfo(): void {
    // Removed console logs for security - no sensitive data exposure
  }

  // Enhanced intelligent cache management
  private getCacheKey(url: string, config?: RequestConfig): string {
    const method = config?.method || 'GET';
    const body = config?.body ? JSON.stringify(config.body) : '';
    const headers = config?.headers ? JSON.stringify(config.headers) : '';
    return `${method}:${url}:${body}:${headers}`;
  }

  private getCacheTags(endpoint: string, method: string = 'GET'): string[] {
    // Assign cache tags based on endpoint patterns
    const tags: string[] = [];
    
    if (endpoint.includes('/students')) tags.push('students');
    if (endpoint.includes('/exercises')) tags.push('exercises');
    if (endpoint.includes('/progress')) tags.push('student-progress');
    if (endpoint.includes('/auth')) tags.push('auth');
    if (endpoint.includes('/profile')) tags.push('user-profile');
    if (endpoint.includes('/stats')) tags.push('student-stats');
    if (endpoint.includes('/gdpr')) tags.push('gdpr');
    if (endpoint.includes('/consent')) tags.push('consent');
    if (endpoint.includes('/export')) tags.push('data-export');
    
    return tags;
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

  private setCache(
    key: string, 
    data: any, 
    ttl: number = 300000, 
    tags: string[] = [],
    dependencies: string[] = []
  ): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
      dependencies
    });
    
    // Cleanup old cache entries periodically
    if (this.requestCache.size > 100) {
      this.cleanupCache();
    }
  }

  // Intelligent cache invalidation by tags
  private invalidateCacheByTags(tags: string[]): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.requestCache.entries()) {
      // If cache entry has any of the invalidation tags, mark for deletion
      if (entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.requestCache.delete(key);
      console.log(`🗑️ Cache invalidated: ${key}`);
    });
    
    if (keysToDelete.length > 0) {
      console.log(`🔄 Invalidated ${keysToDelete.length} cache entries for tags: ${tags.join(', ')}`);
    }
  }

  // Smart cache invalidation based on request
  private handleCacheInvalidation(endpoint: string, method: string): void {
    const invalidationKey = `${method}:${endpoint}`;
    const tagsToInvalidate = this.cacheInvalidationRules.get(invalidationKey);
    
    if (tagsToInvalidate) {
      this.invalidateCacheByTags(tagsToInvalidate);
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

  // Enhanced exponential backoff with jitter
  private calculateRetryDelay(ATTEMPT: number): number {
    const exponentialDelay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, ATTEMPT - 1),
      this.retryConfig.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return exponentialDelay + jitter;
  }

  // Smart retry logic
  private shouldRetry(error: any, ATTEMPT: number): boolean {
    return ATTEMPT <= this.retryConfig.maxRetries && 
           this.retryConfig.retryCondition(error);
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
    const cacheTags = this.getCacheTags(endpoint, method);

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
    for (let ATTEMPT = 1; ATTEMPT <= retries; ATTEMPT++) {
      try {
        console.log(`🔄 API Request [${requestIdLocal}:${ATTEMPT}/${retries}]: ${method} ${endpoint}`);
        
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

        // Enhanced error handling with authentication retry
        if (!response.ok) {
          const errorMessage = responseData.error?.message || 
                             responseData.message || 
                             `HTTP ${response.status}: ${response.statusText}`;
          const errorCode = responseData.error?.code || 'HTTP_ERROR';
          
          // Handle authentication errors with automatic token refresh
          if (response.status === 401 && !ApiService.refreshInProgress) {
            // Authentication failed, attempting token refresh (sensitive operation)
            
            try {
              ApiService.refreshInProgress = true;
              const refreshed = await this.refreshAuthToken();
              
              if (refreshed) {
                // Token refreshed successfully, retrying request
                // Retry the request with the new token
                continue;
              }
            } catch (refreshError) {
              // Token refresh failed - auth state cleared
              // Clear any stored auth state
              this.clearAuthState();
            } finally {
              ApiService.refreshInProgress = false;
            }
          }
          
          const apiError = new ApiError(errorMessage, response.status, errorCode, responseData);
          
          // Don't retry client errors (4xx) except for authentication errors we just handled
          if (response.status >= 400 && response.status < 500 && response.status !== 401) {
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

        // Cache successful responses with tags
        if (cache && method === 'GET' && responseData.success) {
          this.setCache(cacheKey, responseData, timeout * 2, cacheTags);
        }

        // Handle cache invalidation for mutation requests
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
          this.handleCacheInvalidation(endpoint, method);
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

        // Enhanced retry logic with exponential backoff
        if (ATTEMPT < retries && this.shouldRetry(lastError, ATTEMPT)) {
          const delay = this.calculateRetryDelay(ATTEMPT);
          
          console.log(`⏳ Smart retry [${requestIdLocal}] ATTEMPT ${ATTEMPT}/${retries} in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (ATTEMPT < retries) {
          // Break early if error shouldn't be retried
          break;
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

  // Enhanced cache management
  clearCache(): void {
    this.requestCache.clear();
    console.log('🗑️ API cache cleared');
  }

  clearCacheByTags(tags: string[]): void {
    this.invalidateCacheByTags(tags);
  }

  clearCacheByPattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.requestCache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.requestCache.delete(key));
    console.log(`🗑️ Cleared ${keysToDelete.length} cache entries matching pattern`);
  }

  getCacheStats(): { 
    size: number; 
    keys: string[]; 
    tags: Record<string, number>;
    TOTAL_SIZE: number;
  } {
    const tags: Record<string, number> = {};
    let TOTAL_SIZE = 0;
    
    for (const [key, entry] of this.requestCache.entries()) {
      entry.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
      TOTAL_SIZE += JSON.stringify(entry.data).length;
    }
    
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys()),
      tags,
      TOTAL_SIZE
    };
  }

  // Preload frequently used data
  async preloadData(endpoints: string[]): Promise<void> {
    console.log(`🚀 Preloading ${endpoints.length} endpoints...`);
    
    const promises = endpoints.map(endpoint => 
      this.get(endpoint, { cache: true }).catch(error => {
        console.warn(`Failed to preload ${endpoint}:`, error.message);
      })
    );
    
    await Promise.allSettled(promises);
    console.log('✅ Preloading completed');
  }

  // Authentication management
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    // Auth token configured securely
  }

  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
    // Auth token removed
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

  // =================================
  // GDPR API METHODS
  // =================================

  /**
   * Soumettre une demande de consentement parental
   */
  async submitParentalConsent(data: SubmitConsentRequest): Promise<ApiResponse<SubmitConsentResponse>> {
    return this.post<SubmitConsentResponse>('/gdpr/consent/submit', data, {
      cache: false,
      timeout: 15000
    });
  }

  /**
   * Vérifier un token de consentement parental
   */
  async verifyParentalConsent(token: string): Promise<ApiResponse<{ message: string }>> {
    return this.get<{ message: string }>(`/gdpr/consent/verify/${token}`, {
      cache: false,
      timeout: 10000
    });
  }

  /**
   * Obtenir le statut d'un consentement
   */
  async getConsentStatus(consentId: string): Promise<ApiResponse<ParentalConsentRecord>> {
    return this.get<ParentalConsentRecord>(`/gdpr/consent/status/${consentId}`, {
      cache: true,
      timeout: 8000
    });
  }

  /**
   * Soumettre une demande RGPD
   */
  async submitGDPRRequest(data: SubmitGDPRRequest): Promise<ApiResponse<SubmitGDPRResponse>> {
    return this.post<SubmitGDPRResponse>('/gdpr/request/submit', data, {
      cache: false,
      timeout: 15000
    });
  }

  /**
   * Vérifier une demande RGPD
   */
  async verifyGDPRRequest(requestId: string, token: string): Promise<ApiResponse<{ message: string }>> {
    return this.get<{ message: string }>(`/gdpr/request/${requestId}/verify/${token}`, {
      cache: false,
      timeout: 10000
    });
  }

  /**
   * Obtenir le statut d'une demande RGPD
   */
  async getGDPRRequestStatus(requestId: string): Promise<ApiResponse<GDPRRequestStatusResponse>> {
    return this.get<GDPRRequestStatusResponse>(`/gdpr/request/${requestId}/status`, {
      cache: true,
      timeout: 8000
    });
  }

  /**
   * Obtenir la liste des demandes RGPD pour un utilisateur
   */
  async getUserGDPRRequests(email: string): Promise<ApiResponse<GDPRRequestRecord[]>> {
    return this.get<GDPRRequestRecord[]>(`/gdpr/requests?email=${encodeURIComponent(email)}`, {
      cache: true,
      timeout: 10000
    });
  }

  /**
   * Mettre à jour les préférences de consentement
   */
  async updateConsentPreferences(data: ConsentPreferencesRequest): Promise<ApiResponse<{ preferencesId: string; message: string }>> {
    return this.post<{ preferencesId: string; message: string }>('/gdpr/consent/preferences', data, {
      cache: false,
      timeout: 10000
    });
  }

  /**
   * Obtenir les préférences de consentement actuelles
   */
  async getConsentPreferences(studentId?: number): Promise<ApiResponse<ConsentPreferencesRecord>> {
    const endpoint = studentId 
      ? `/gdpr/consent/preferences?studentId=${studentId}`
      : '/gdpr/consent/preferences';
    
    return this.get<ConsentPreferencesRecord>(endpoint, {
      cache: true,
      timeout: 8000
    });
  }

  /**
   * Exporter les données d'un étudiant
   */
  async exportStudentData(request: StudentDataExportRequest): Promise<Blob> {
    const { studentId, format = 'json', includeProgress = true, includeAuditLogs = false } = request;
    
    const params = new URLSearchParams({
      format,
      includeProgress: includeProgress.toString(),
      includeAuditLogs: includeAuditLogs.toString()
    });

    const url = `/gdpr/export/${studentId}?${params.toString()}`;
    
    // Pour l'export, on utilise fetch directement pour gérer la réponse blob
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'GET',
      headers: this.defaultHeaders,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new ApiError(
        `Erreur lors de l'export: ${response.statusText}`,
        response.status,
        'EXPORT_ERROR'
      );
    }

    return response.blob();
  }

  /**
   * Télécharger l'export de données
   */
  async downloadStudentDataExport(
    request: StudentDataExportRequest,
    filename?: string
  ): Promise<void> {
    try {
      const blob = await this.exportStudentData(request);
      const defaultFilename = filename || 
        `student-${request.studentId}-export-${new Date().toISOString().split('T')[0]}.${request.format || 'json'}`;

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`📁 Téléchargement initié: ${defaultFilename}`);
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      throw error;
    }
  }

  /**
   * Vérifier l'état de santé du service RGPD
   */
  async getGDPRHealthCheck(): Promise<ApiResponse<any>> {
    return this.get('/gdpr/health', {
      cache: false,
      timeout: 5000
    });
  }

  // ===== AUTHENTICATION METHODS =====

  /**
   * Refresh authentication token using refresh token cookie
   */
  private async refreshAuthToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include cookies for refresh token
      });

      if (response.ok) {
        const data = await response.json();
        // Token refresh successful
        return true;
      } else {
        // Token refresh failed - invalid response
        return false;
      }
    } catch (error) {
      // Token refresh error - network or server issue
      return false;
    }
  }

  /**
   * Clear authentication state
   */
  private clearAuthState(): void {
    ApiService.authToken = null;
    // Trigger logout in the application
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  /**
   * Login with email/password or legacy name-based credentials
   */
  async login(credentials: {
    email?: string;
    prenom?: string;
    nom?: string;
    password: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/auth/login', credentials);
  }

  /**
   * Register new student account
   */
  async register(userData: {
    prenom: string;
    nom: string;
    email: string;
    password: string;
    dateNaissance: string;
    niveauActuel: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/auth/register', userData);
  }

  /**
   * Logout current user
   */
  async logout(): Promise<ApiResponse<any>> {
    try {
      const response = await this.post('/auth/logout', {});
      this.clearAuthState();
      return response;
    } catch (error) {
      // Clear state even if logout request fails
      this.clearAuthState();
      throw error;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.get('/auth/me', { cache: false });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<any>> {
    return this.post('/auth/password-reset', { email });
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<ApiResponse<any>> {
    return this.post('/auth/password-reset/confirm', {
      token,
      newPassword
    });
  }

  /**
   * Obtenir la configuration RGPD publique
   */
  async getGDPRConfig(): Promise<ApiResponse<any>> {
    return this.get('/gdpr/config', {
      cache: true,
      timeout: 8000
    });
  }

  /**
   * Révoquer un consentement
   */
  async revokeConsent(consentId: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>(`/gdpr/consent/${consentId}/revoke`, {
      reason: reason || 'Révocation demandée par l\'utilisateur'
    }, {
      cache: false,
      timeout: 10000
    });
  }

  /**
   * Obtenir l'historique des consentements pour un étudiant
   */
  async getConsentHistory(studentId: number): Promise<ApiResponse<ParentalConsentRecord[]>> {
    return this.get<ParentalConsentRecord[]>(`/gdpr/consent/history/${studentId}`, {
      cache: true,
      timeout: 10000
    });
  }

  /**
   * Vérifier si un consentement actif existe pour un étudiant
   */
  async checkActiveConsent(studentId: number): Promise<ApiResponse<{ hasActiveConsent: boolean; consent?: ParentalConsentRecord }>> {
    return this.get<{ hasActiveConsent: boolean; consent?: ParentalConsentRecord }>(`/gdpr/consent/check/${studentId}`, {
      cache: true,
      timeout: 8000
    });
  }

  /**
   * Helpers pour obtenir les informations client
   */
  private getClientInfo() {
    return {
      ipAddress: 'client-ip', // En prod, obtenir via service
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
    };
  }

  /**
   * Helper pour enrichir les requêtes RGPD avec les infos client
   */
  private enrichGDPRRequest<T extends Record<string, any>>(data: T): T & { ipAddress: string; userAgent: string } {
    const clientInfo = this.getClientInfo();
    return {
      ...data,
      ...clientInfo
    };
  }

  /**
   * Méthodes convenances avec enrichissement automatique
   */
  async submitParentalConsentWithClientInfo(data: Omit<SubmitConsentRequest, 'ipAddress' | 'userAgent'>): Promise<ApiResponse<SubmitConsentResponse>> {
    return this.submitParentalConsent(this.enrichGDPRRequest(data));
  }

  async submitGDPRRequestWithClientInfo(data: Omit<SubmitGDPRRequest, 'ipAddress' | 'userAgent'>): Promise<ApiResponse<SubmitGDPRResponse>> {
    return this.submitGDPRRequest(this.enrichGDPRRequest(data));
  }

  async updateConsentPreferencesWithClientInfo(data: Omit<ConsentPreferencesRequest, 'ipAddress' | 'userAgent'>): Promise<ApiResponse<{ preferencesId: string; message: string }>> {
    return this.updateConsentPreferences(this.enrichGDPRRequest(data));
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