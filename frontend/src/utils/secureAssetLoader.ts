// Secure 3D asset loading utility with security headers and validation
// This ensures safe loading of 3D assets with proper CSP and security measures

import * as THREE from 'three';

export interface AssetLoadingOptions {
  maxFileSize?: number; // Maximum file size in bytes (default: 50MB)
  allowedMimeTypes?: string[]; // Allowed MIME types
  timeout?: number; // Request timeout in ms
  retryAttempts?: number; // Number of retry attempts
  enableCaching?: boolean; // Enable browser caching
}

export interface AssetLoadingResult {
  success: boolean;
  data?: any;
  error?: string;
  securityViolation?: boolean;
}

// Default security configuration
const DEFAULT_OPTIONS: Required<AssetLoadingOptions> = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream', // For .glb files
    'text/plain', // For some .gltf files served as text
    'application/json' // For .gltf files
  ],
  timeout: 30000, // 30 seconds
  retryAttempts: 2,
  enableCaching: true
};

// Security headers for 3D asset requests
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'public, max-age=3600, immutable'
};

// Validate asset URL for security
export const validateAssetURL = (url: string): { isValid: boolean; error?: string; sanitizedURL?: string } => {
  try {
    // Basic URL validation
    const urlObj = new URL(url, window.location.origin);
    
    // Check protocol - only allow https and data URLs for assets
    if (!['https:', 'data:', 'blob:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Invalid protocol - only HTTPS, data, and blob URLs allowed' };
    }
    
    // Prevent directory traversal
    if (urlObj.pathname.includes('..') || urlObj.pathname.includes('//')) {
      return { isValid: false, error: 'Path traversal detected' };
    }
    
    // Check for suspicious query parameters
    const SUSPICIOUS_PARAMS = ['script', 'eval', 'javascript', 'vbscript'];
    for (const [key, value] of urlObj.searchParams.entries()) {
      if (SUSPICIOUS_PARAMS.some(param => 
        key.toLowerCase().includes(param) || 
        value.toLowerCase().includes(param)
      )) {
        return { isValid: false, error: 'Suspicious query parameters detected' };
      }
    }
    
    // Validate file extension for 3D assets
    const VALID_EXTENSIONS = ['.glb', '.gltf', '.obj', '.fbx', '.dae', '.3ds'];
    const hasValidExtension = VALID_EXTENSIONS.some(ext => 
      urlObj.pathname.toLowerCase().endsWith(ext)
    );
    
    // Allow data URLs for embedded assets
    if (urlObj.protocol !== 'data:' && !hasValidExtension) {
      return { isValid: false, error: 'Invalid file extension for 3D asset' };
    }
    
    return { 
      isValid: true, 
      sanitizedURL: urlObj.toString() 
    };
  } catch (error) {
    return { 
      isValid: false, 
      error: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Validate file content for security
const validateFileContent = async (
  data: ArrayBuffer, 
  expectedType: string
): Promise<{ isValid: boolean; error?: string }> => {
  // Check file size
  if (data.byteLength === 0) {
    return { isValid: false, error: 'Empty file received' };
  }
  
  if (data.byteLength > DEFAULT_OPTIONS.maxFileSize) {
    return { isValid: false, error: 'File size exceeds maximum allowed' };
  }
  
  // Basic magic number validation for common 3D formats
  const uint8Array = new Uint8Array(data);
  
  // GLB files start with 'glTF'
  if (expectedType.includes('gltf') || expectedType.includes('binary')) {
    const glbSignature = new TextDecoder().decode(uint8Array.slice(0, 4));
    if (data.byteLength >= 4 && glbSignature === 'glTF') {
      return { isValid: true };
    }
  }
  
  // Check for suspicious patterns that might indicate malicious content
  const SUSPICIOUS_PATTERNS = [
    '<script', 'javascript:', 'vbscript:', 'onload=', 'onerror=',
    'eval(', 'Function(', 'setTimeout(', 'setInterval('
  ];
  
  // Convert first 1KB to string for pattern checking
  const stringContent = new TextDecoder('utf-8', { fatal: false })
    .decode(uint8Array.slice(0, Math.min(1024, uint8Array.length)))
    .toLowerCase();
  
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (stringContent.includes(pattern.toLowerCase())) {
      return { 
        isValid: false, 
        error: `Suspicious content pattern detected: ${pattern}` 
      };
    }
  }
  
  return { isValid: true };
};

// Secure fetch function with proper headers and validation
export const secureAssetFetch = async (
  url: string, 
  options: AssetLoadingOptions = {}
): Promise<AssetLoadingResult> => {
  const CONFIG = { ...DEFAULT_OPTIONS, ...options };
  
  // Validate URL first
  const urlValidation = validateAssetURL(url);
  if (!urlValidation.isValid) {
    return {
      success: false,
      error: urlValidation.error,
      securityViolation: true
    };
  }
  
  const sanitizedURL = urlValidation.sanitizedURL!;
  
  let ATTEMPT = 0;
  while (ATTEMPT <= CONFIG.retryAttempts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
      
      const response = await fetch(sanitizedURL, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          ...SECURITY_HEADERS,
          'Accept': CONFIG.allowedMimeTypes.join(', ')
        },
        cache: CONFIG.enableCaching ? 'default' : 'no-cache',
        mode: 'cors',
        credentials: 'omit' // Don't send credentials for security
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Validate Content-Type header
      const contentType = response.headers.get('content-type') || '';
      const isValidMimeType = CONFIG.allowedMimeTypes.some(type => 
        contentType.toLowerCase().includes(type.toLowerCase())
      );
      
      if (!isValidMimeType && !sanitizedURL.startsWith('data:')) {
        return {
          success: false,
          error: `Invalid content type: ${contentType}`,
          securityViolation: true
        };
      }
      
      // Check Content-Length header
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > CONFIG.maxFileSize) {
        return {
          success: false,
          error: 'File size exceeds maximum allowed',
          securityViolation: true
        };
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Validate file content
      const contentValidation = await validateFileContent(arrayBuffer, contentType);
      if (!contentValidation.isValid) {
        return {
          success: false,
          error: contentValidation.error,
          securityViolation: true
        };
      }
      
      return {
        success: true,
        data: arrayBuffer
      };
      
    } catch (error) {
      ATTEMPT++;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout',
            securityViolation: false
          };
        }
        
        if (ATTEMPT > CONFIG.retryAttempts) {
          return {
            success: false,
            error: `Failed after ${CONFIG.retryAttempts + 1} attempts: ${error.message}`,
            securityViolation: false
          };
        }
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, ATTEMPT) * 1000));
    }
  }
  
  return {
    success: false,
    error: 'Unexpected error in asset loading',
    securityViolation: false
  };
};

// Secure THREE.js texture loader wrapper
export class SecureTextureLoader extends THREE.TextureLoader {
  loadSecure(
    url: string, 
    onLoad?: (texture: THREE.Texture) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: Error) => void,
    options: AssetLoadingOptions = {}
  ): Promise<THREE.Texture> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await secureAssetFetch(url, options);
        
        if (!result.success) {
          const error = new Error(result.error || 'Failed to load texture');
          onError?.(error);
          reject(error);
          return;
        }
        
        // Create blob URL for secure loading
        const blob = new Blob([result.data]);
        const blobUrl = URL.createObjectURL(blob);
        
        const texture = (this as any).load(
          blobUrl,
          (loadedTexture) => {
            URL.revokeObjectURL(blobUrl); // Clean up
            onLoad?.(loadedTexture);
            resolve(loadedTexture);
          },
          onProgress,
          (error) => {
            URL.revokeObjectURL(blobUrl); // Clean up on error
            onError?.(error);
            reject(error);
          }
        );
        
        // Set security-related properties
        texture.flipY = false; // Prevent potential issues
        texture.premultiplyAlpha = false;
        
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Unknown error'));
        reject(error);
      }
    });
  }
}

// Content Security Policy helper
export const generateAssetCSP = (): string => {
  return [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "script-src 'self' 'unsafe-inline'", // Needed for Three.js workers
    "style-src 'self' 'unsafe-inline'", // Needed for dynamic styles
    "base-uri 'self'"
  ].join('; ');
};

// Apply CSP meta tag (call this in your app initialization)
export const applySecurity3DCSP = (): void => {
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  
  if (!existingCSP) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = generateAssetCSP();
    document.head.appendChild(meta);
  }
};

// Rate limiting for asset loading
const loadingCounts = new Map<string, { count: number; lastReset: number }>();

export const checkAssetLoadingRateLimit = (
  identifier: string, 
  maxLoads: number = 20, 
  timeWindow: number = 60000
): boolean => {
  const now = Date.now();
  const loadData = loadingCounts.get(identifier);
  
  if (!loadData || (now - loadData.lastReset) > timeWindow) {
    loadingCounts.set(identifier, { count: 1, lastReset: now });
    return true;
  }
  
  if (loadData.count >= maxLoads) {
    return false;
  }
  
  loadData.count++;
  return true;
};

// Secure asset cache with size limits
class SecureAssetCache {
  private cache = new Map<string, { data: any; timestamp: number; size: number }>();
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  private maxAge = 3600000; // 1 hour
  private currentSize = 0;
  
  set(key: string, data: any, size: number): void {
    // Clean expired entries
    this.cleanup();
    
    // Check if we need to make room
    while (this.currentSize + size > this.maxCacheSize && this.cache.size > 0) {
      this.evictOldest();
    }
    
    // Validate key to prevent cache pollution
    if (key.length > 256 || !/^[a-zA-Z0-9_\-./:%]+$/.test(key)) {
      console.warn('Invalid cache key rejected');
      return;
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size
    });
    this.currentSize += size;
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return null;
    }
    
    return entry.data;
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
        this.currentSize -= entry.size;
      }
    }
  }
  
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      this.cache.delete(oldestKey);
      this.currentSize -= entry.size;
    }
  }
  
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }
}

export const secureAssetCache = new SecureAssetCache();