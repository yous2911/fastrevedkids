import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { apiService } from '../services/api.service';
import { Eleve } from '../types/api.types';

interface AuthState {
  isAuthenticated: boolean;
  currentStudent: Eleve | null;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

export interface UseAuthReturn {
  // State
  isAuthenticated: boolean;
  currentStudent: Eleve | null;
  student: Eleve | null; // Alias for currentStudent
  isLoading: boolean;
  loading: boolean; // Alias for isLoading
  error: string | null;
  token: string | null;
  
  // Actions
  login: (prenom: string, nom: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Create Auth Context
const AuthContext = createContext<UseAuthReturn | null>(null);

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    currentStudent: null,
    isLoading: false,
    error: null,
    token: null,
  });

  // Login function
  const login = useCallback(async (prenom: string, nom: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prenom: prenom.trim(),
          nom: nom.trim()
        })
      });

      const data = await response.json();
      
      console.log('Login response:', data);

      if (response.ok && data.success) {
        const { student, token } = data.data;
        
        console.log('Setting auth state with student:', student);
        
        // Store token in localStorage
        localStorage.setItem('auth_token', token);
        
        setAuthState({
          isAuthenticated: true,
          currentStudent: student,
          isLoading: false,
          error: null,
          token: token,
        });

        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error?.message || 'Login failed',
        }));
        return false;
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Login failed',
      }));
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setAuthState({
      isAuthenticated: false,
      currentStudent: null,
      isLoading: false,
      error: null,
      token: null,
    });
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const authValue: UseAuthReturn = {
    // State
    isAuthenticated: authState.isAuthenticated,
    currentStudent: authState.currentStudent,
    student: authState.currentStudent, // Alias for currentStudent
    isLoading: authState.isLoading,
    loading: authState.isLoading, // Alias for isLoading
    error: authState.error,
    token: authState.token,
    
    // Actions
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 