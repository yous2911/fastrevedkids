import React, { useState, useEffect, createContext, useContext } from 'react';
import { studentService, Student } from '../services/student.service';

interface AuthContextType {
  student: Student | null;
  token: string | null;
  login: (prenom: string, nom: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedStudent = localStorage.getItem('student_data');
    
    if (savedToken && savedStudent) {
      try {
        setToken(savedToken);
        setStudent(JSON.parse(savedStudent));
        // Set token in API service
        import('../services/api.service').then(({ apiService }) => {
          apiService.setAuthToken(savedToken);
        });
      } catch (err) {
        console.error('Failed to restore session:', err);
        // Clear invalid session data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('student_data');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (prenom: string, nom: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await studentService.login(prenom, nom);
      
      if (response.success && response.data) {
        const { token, student } = response.data;
        
        setToken(token);
        setStudent(student);
        
        // Save to localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('student_data', JSON.stringify(student));
        
        // Set token in API service
        const { apiService } = await import('../services/api.service');
        apiService.setAuthToken(token);
        
        return true;
      }
      
      return false;
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setStudent(null);
    setToken(null);
    setError(null);
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('student_data');
    
    // Remove token from API service
    import('../services/api.service').then(({ apiService }) => {
      apiService.removeAuthToken();
    });
  };

  return (
    <AuthContext.Provider value={{
      student,
      token,
      login,
      logout,
      loading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
} 