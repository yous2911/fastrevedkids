import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api.service';
import { Eleve } from '../types/api.types';

interface AuthState {
  isAuthenticated: boolean;
  currentStudent: Eleve | null;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

interface LoginCredentials {
  prenom: string;
  nom: string;
  motDePasse?: string;
}

interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    student: Eleve;
  };
  error?: string | {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface UseAuthReturn {
  // State
  isAuthenticated: boolean;
  currentStudent: Eleve | null;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  
  // Utils
  isReady: boolean;
  checkConnection: () => Promise<boolean>;
}

const STORAGE_KEYS = {
  TOKEN: 'reved_kids_token',
  STUDENT: 'reved_kids_student',
  LAST_LOGIN: 'reved_kids_last_login',
} as const;

export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    currentStudent: null,
    isLoading: true,
    error: null,
    token: null,
  });

  const mountedRef = useRef(true);
  const initializationRef = useRef(false);

  // Safe state updater that checks if component is still mounted
  const safeSetAuthState = useCallback((updater: Partial<AuthState> | ((prev: AuthState) => AuthState)) => {
    if (!mountedRef.current) return;
    
    setAuthState(prev => {
      if (typeof updater === 'function') {
        return updater(prev);
      }
      return { ...prev, ...updater };
    });
  }, []);

  // Enhanced token management
  const saveToStorage = useCallback((token: string, student: Eleve) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.STUDENT, JSON.stringify(student));
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, []);

  const clearStorage = useCallback(() => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }, []);

  const loadFromStorage = useCallback((): { token: string | null; student: Eleve | null } => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const studentData = localStorage.getItem(STORAGE_KEYS.STUDENT);
      const lastLogin = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN);
      
      // Check if login is not too old (7 days)
      if (lastLogin) {
        const lastLoginDate = new Date(lastLogin);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        if (lastLoginDate < weekAgo) {
          console.log('🔄 Stored login expired, clearing...');
          clearStorage();
          return { token: null, student: null };
        }
      }
      
      const student = studentData ? JSON.parse(studentData) : null;
      
      return { token, student };
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      clearStorage();
      return { token: null, student: null };
    }
  }, [clearStorage]);

  // Initialize authentication state
  const initialize = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      safeSetAuthState({ isLoading: true, error: null });

      // Load from storage first
      const { token, student } = loadFromStorage();

      if (token && student) {
        // Set token in API service
        apiService.setAuthToken(token);

        // Verify token is still valid
        try {
          const isValid = await refreshToken();
          if (isValid) {
            safeSetAuthState({
              isAuthenticated: true,
              currentStudent: student,
              token,
              isLoading: false,
              error: null,
            });
            console.log('✅ Restored authentication from storage');
            return;
          }
        } catch (error) {
          console.warn('Token validation failed, clearing storage');
          clearStorage();
          apiService.removeAuthToken();
        }
      }

      // No valid stored auth
      safeSetAuthState({
        isAuthenticated: false,
        currentStudent: null,
        token: null,
        isLoading: false,
        error: null,
      });

    } catch (error) {
      console.error('Auth initialization failed:', error);
      safeSetAuthState({
        isAuthenticated: false,
        currentStudent: null,
        token: null,
        isLoading: false,
        error: 'Erreur d\'initialisation',
      });
    }
  }, [safeSetAuthState, loadFromStorage, clearStorage]);

  // Login function with enhanced error handling
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      safeSetAuthState({ isLoading: true, error: null });

      // Validate credentials
      if (!credentials.prenom?.trim() || !credentials.nom?.trim()) {
        throw new Error('Prénom et nom sont requis');
      }

      // Clean credentials
      const cleanCredentials = {
        prenom: credentials.prenom.trim(),
        nom: credentials.nom.trim(),
        motDePasse: credentials.motDePasse?.trim(),
      };

      console.log('🔐 Attempting login...');

      const response: AuthResponse = await apiService.post('/auth/login', cleanCredentials, {
        timeout: 15000, // Longer timeout for auth
      });

      if (!response.success || !response.data) {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || 'Échec de la connexion';
        throw new Error(errorMessage);
      }

      const { token, student } = response.data;

      // Save authentication state
      apiService.setAuthToken(token);
      saveToStorage(token, student);

      safeSetAuthState({
        isAuthenticated: true,
        currentStudent: student,
        token,
        isLoading: false,
        error: null,
      });

      console.log('✅ Login successful:', student.prenom);
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
      console.error('❌ Login failed:', errorMessage);

      safeSetAuthState({
        isAuthenticated: false,
        currentStudent: null,
        token: null,
        isLoading: false,
        error: errorMessage,
      });

      return false;
    }
  }, [safeSetAuthState, saveToStorage]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      safeSetAuthState({ isLoading: true });

      // Call backend logout if authenticated
      if (authState.isAuthenticated && authState.token) {
        try {
          await apiService.post('/auth/logout', {}, { timeout: 5000 });
        } catch (error) {
          console.warn('Backend logout failed (continuing anyway):', error);
        }
      }

      // Clear everything
      apiService.removeAuthToken();
      apiService.clearCache();
      clearStorage();

      safeSetAuthState({
        isAuthenticated: false,
        currentStudent: null,
        token: null,
        isLoading: false,
        error: null,
      });

      console.log('👋 Logout successful');

    } catch (error) {
      console.error('Logout error:', error);
      
      // Force logout even if there's an error
      apiService.removeAuthToken();
      clearStorage();
      safeSetAuthState({
        isAuthenticated: false,
        currentStudent: null,
        token: null,
        isLoading: false,
        error: null,
      });
    }
  }, [safeSetAuthState, authState.isAuthenticated, authState.token, clearStorage]);

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      if (!authState.token) {
        return false;
      }

      const response: AuthResponse = await apiService.post('/auth/refresh', {}, {
        timeout: 10000,
      });

      if (!response.success || !response.data) {
        throw new Error('Token refresh failed');
      }

      const { token: newToken, student } = response.data;

      // Update token
      apiService.setAuthToken(newToken);
      saveToStorage(newToken, student);

      safeSetAuthState(prev => ({
        ...prev,
        token: newToken,
        currentStudent: student,
      }));

      console.log('🔄 Token refreshed successfully');
      return true;

    } catch (error) {
      console.warn('Token refresh failed:', error);
      
      // If refresh fails, logout
      await logout();
      return false;
    }
  }, [authState.token, safeSetAuthState, saveToStorage, logout]);

  // Clear error function
  const clearError = useCallback(() => {
    safeSetAuthState({ error: null });
  }, [safeSetAuthState]);

  // Connection check
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      return await apiService.testConnection();
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
    
    return () => {
      mountedRef.current = false;
    };
  }, [initialize]);

  // Auto-refresh token periodically
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.token) return;

    const refreshInterval = setInterval(() => {
      refreshToken().catch(error => {
        console.warn('Auto token refresh failed:', error);
      });
    }, 20 * 60 * 1000); // Every 20 minutes

    return () => clearInterval(refreshInterval);
  }, [authState.isAuthenticated, authState.token, refreshToken]);

  // Handle page visibility (refresh token when page becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && authState.isAuthenticated) {
        refreshToken().catch(error => {
          console.warn('Visibility refresh failed:', error);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authState.isAuthenticated, refreshToken]);

  return {
    // State
    isAuthenticated: authState.isAuthenticated,
    currentStudent: authState.currentStudent,
    isLoading: authState.isLoading,
    error: authState.error,
    token: authState.token,
    
    // Actions
    login,
    logout,
    refreshToken,
    clearError,
    
    // Utils
    isReady: !authState.isLoading && !initializationRef.current,
    checkConnection,
  };
} 