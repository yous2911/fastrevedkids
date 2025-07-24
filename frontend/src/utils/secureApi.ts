// Secure API wrapper with additional security measures
import { SecurityUtils } from './security';

interface SecureApiOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  validateResponse?: boolean;
}

class SecureApi {
  private baseUrl: string;
  private defaultTimeout = 10000;
  private defaultRetries = 3;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest(
    endpoint: string, 
    options: SecureApiOptions = {}
  ): Promise<Response> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      validateResponse = true,
      ...fetchOptions
    } = options;

    const url = `${this.baseUrl}${endpoint}`;

    // Validate URL
    if (!SecurityUtils.isValidUrl(url, [new URL(this.baseUrl).hostname])) {
      throw new Error('Invalid API URL');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestOptions: RequestInit = {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...fetchOptions.headers,
      },
    };

    // Add CSRF token if available
    const csrfToken = SecurityUtils.secureStorage.getItem('csrf-token');
    if (csrfToken) {
      (requestOptions.headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
    }

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (validateResponse && !response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Check for security headers in response
        this.validateSecurityHeaders(response);

        return response;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries && !controller.signal.aborted) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    clearTimeout(timeoutId);
    throw lastError!;
  }

  private validateSecurityHeaders(response: Response): void {
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
    ];

    const missingHeaders = requiredHeaders.filter(
      header => !response.headers.get(header)
    );

    if (missingHeaders.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('Missing security headers in API response:', missingHeaders);
    }
  }

  async get(endpoint: string, options?: SecureApiOptions): Promise<Response> {
    return this.makeRequest(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data?: any, options?: SecureApiOptions): Promise<Response> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any, options?: SecureApiOptions): Promise<Response> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string, options?: SecureApiOptions): Promise<Response> {
    return this.makeRequest(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create secure API instance
export const secureApi = new SecureApi(process.env.REACT_APP_API_URL || 'http://localhost:3001/api'); 