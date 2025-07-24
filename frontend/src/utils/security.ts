// Security utility functions
export class SecurityUtils {
  // Sanitize user input to prevent XSS
  static sanitizeInput(input: string): string {
    const element = document.createElement('div');
    element.textContent = input;
    return element.innerHTML;
  }

  // Validate URLs to prevent open redirects
  static isValidUrl(url: string, allowedDomains: string[] = []): boolean {
    try {
      const urlObj = new URL(url);
      
      // Only allow https and http protocols
      if (!['https:', 'http:'].includes(urlObj.protocol)) {
        return false;
      }

      // Check against allowed domains if provided
      if (allowedDomains.length > 0) {
        return allowedDomains.some(domain => 
          urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
        );
      }

      return true;
    } catch {
      return false;
    }
  }

  // Generate secure nonce for inline scripts
  static generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  // Check if running in secure context
  static isSecureContext(): boolean {
    return window.isSecureContext || window.location.protocol === 'https:';
  }

  // Secure localStorage wrapper
  static secureStorage = {
    setItem(key: string, value: string): void {
      try {
        if (!SecurityUtils.isSecureContext()) {
          console.warn('Storing sensitive data in insecure context');
        }
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Failed to store item securely:', error);
      }
    },

    getItem(key: string): string | null {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Failed to retrieve item securely:', error);
        return null;
      }
    },

    removeItem(key: string): void {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Failed to remove item securely:', error);
      }
    }
  };

  // Sanitize form data
  static sanitizeFormData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeFormData(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Check for XSS content
  static hasXSSContent(content: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    ];
    
    return xssPatterns.some(pattern => pattern.test(content));
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  static validatePassword(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include at least one lowercase letter');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include at least one uppercase letter');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include at least one number');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Include at least one special character');

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }

  // Client-side rate limiting
  static rateLimiter = {
    requests: new Map<string, { count: number; resetTime: number }>(),
    
    isAllowed(key: string, limit: number = 10, windowMs: number = 60000): boolean {
      const now = Date.now();
      const record = this.requests.get(key);
      
      if (!record || now > record.resetTime) {
        this.requests.set(key, { count: 1, resetTime: now + windowMs });
        return true;
      }
      
      if (record.count >= limit) {
        return false;
      }
      
      record.count++;
      return true;
    },
    
    clear(key: string): void {
      this.requests.delete(key);
    }
  };
} 