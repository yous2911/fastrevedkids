import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { Eleve } from '../types/api.types';

// Application state types
export interface AppState {
  // User/Student state
  currentStudent: Eleve | null;
  isAuthenticated: boolean;
  
  // Application state
  online: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: 'fr' | 'en';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  
  // Cache state
  lastSync: Date | null;
  pendingOperations: any[];
  
  // UI state
  sidebarOpen: boolean;
  notificationsEnabled: boolean;
}

// Action types
export type AppAction =
  | { type: 'SET_CURRENT_STUDENT'; payload: Eleve | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_THEME'; payload: AppState['theme'] }
  | { type: 'SET_LANGUAGE'; payload: AppState['language'] }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'TOGGLE_ANIMATIONS' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_LAST_SYNC'; payload: Date }
  | { type: 'ADD_PENDING_OPERATION'; payload: any }
  | { type: 'REMOVE_PENDING_OPERATION'; payload: string }
  | { type: 'CLEAR_PENDING_OPERATIONS' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  currentStudent: null,
  isAuthenticated: false,
  online: navigator.onLine,
  theme: 'auto',
  language: 'fr',
  soundEnabled: true,
  animationsEnabled: true,
  lastSync: null,
  pendingOperations: [],
  sidebarOpen: false,
  notificationsEnabled: true
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_STUDENT':
      return { ...state, currentStudent: action.payload };
    
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    
    case 'SET_ONLINE':
      return { ...state, online: action.payload };
    
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    
    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };
    
    case 'TOGGLE_ANIMATIONS':
      return { ...state, animationsEnabled: !state.animationsEnabled };
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    
    case 'SET_LAST_SYNC':
      return { ...state, lastSync: action.payload };
    
    case 'ADD_PENDING_OPERATION':
      return { 
        ...state, 
        pendingOperations: [...state.pendingOperations, action.payload] 
      };
    
    case 'REMOVE_PENDING_OPERATION':
      return {
        ...state,
        pendingOperations: state.pendingOperations.filter(op => op.id !== action.payload)
      };
    
    case 'CLEAR_PENDING_OPERATIONS':
      return { ...state, pendingOperations: [] };
    
    case 'RESET_STATE':
      return { ...initialState, online: navigator.onLine };
    
    default:
      return state;
  }
}

// Context types
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Convenience methods
  setCurrentStudent: (student: Eleve | null) => void;
  login: (student: Eleve) => void;
  logout: () => void;
  updateSettings: (settings: Partial<AppState>) => void;
  addPendingOperation: (operation: any) => void;
  syncPendingOperations: () => Promise<void>;
  toggleSound: () => void;
  toggleAnimations: () => void;
  toggleSidebar: () => void;
  setTheme: (theme: AppState['theme']) => void;
  setLanguage: (language: AppState['language']) => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        const savedState = localStorage.getItem('app_state');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          
          // Restore specific parts of state
          if (parsed.theme) dispatch({ type: 'SET_THEME', payload: parsed.theme });
          if (parsed.language) dispatch({ type: 'SET_LANGUAGE', payload: parsed.language });
          if (typeof parsed.soundEnabled === 'boolean') {
            if (!parsed.soundEnabled) dispatch({ type: 'TOGGLE_SOUND' });
          }
          if (typeof parsed.animationsEnabled === 'boolean') {
            if (!parsed.animationsEnabled) dispatch({ type: 'TOGGLE_ANIMATIONS' });
          }
        }
      } catch (error) {
        console.error('Failed to load persisted state:', error);
      }
    };

    loadPersistedState();
  }, []);

  // Persist state changes
  useEffect(() => {
    try {
      const stateToPersist = {
        theme: state.theme,
        language: state.language,
        soundEnabled: state.soundEnabled,
        animationsEnabled: state.animationsEnabled
      };
      localStorage.setItem('app_state', JSON.stringify(stateToPersist));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }, [state.theme, state.language, state.soundEnabled, state.animationsEnabled]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Convenience methods
  const setCurrentStudent = useCallback((student: Eleve | null) => {
    dispatch({ type: 'SET_CURRENT_STUDENT', payload: student });
  }, []);

  const login = useCallback((student: Eleve) => {
    dispatch({ type: 'SET_CURRENT_STUDENT', payload: student });
    dispatch({ type: 'SET_AUTHENTICATED', payload: true });
    apiService.setAuthToken(`student_${student.id}`); // Simple token for demo
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
    apiService.removeAuthToken();
    apiService.clearCache();
  }, []);

  const updateSettings = useCallback((settings: Partial<AppState>) => {
    Object.entries(settings).forEach(([key, value]) => {
      switch (key) {
        case 'theme':
          dispatch({ type: 'SET_THEME', payload: value as AppState['theme'] });
          break;
        case 'language':
          dispatch({ type: 'SET_LANGUAGE', payload: value as AppState['language'] });
          break;
        // Add other settings as needed
      }
    });
  }, []);

  const addPendingOperation = useCallback((operation: any) => {
    const operationWithId = {
      ...operation,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    dispatch({ type: 'ADD_PENDING_OPERATION', payload: operationWithId });
  }, []);

  const syncPendingOperations = useCallback(async () => {
    if (!state.online || state.pendingOperations.length === 0) return;

    try {
      // Process pending operations
      for (const operation of state.pendingOperations) {
        // Implement sync logic based on operation type
        console.log('Syncing operation:', operation);
        dispatch({ type: 'REMOVE_PENDING_OPERATION', payload: operation.id });
      }
      
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      console.error('Failed to sync pending operations:', error);
    }
  }, [state.online, state.pendingOperations]);

  // Additional convenience methods
  const toggleSound = useCallback(() => {
    dispatch({ type: 'TOGGLE_SOUND' });
  }, []);

  const toggleAnimations = useCallback(() => {
    dispatch({ type: 'TOGGLE_ANIMATIONS' });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const setTheme = useCallback((theme: AppState['theme']) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  const setLanguage = useCallback((language: AppState['language']) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (state.online) {
      syncPendingOperations();
    }
  }, [state.online, syncPendingOperations]);

  const contextValue: AppContextType = {
    state,
    dispatch,
    setCurrentStudent,
    login,
    logout,
    updateSettings,
    addPendingOperation,
    syncPendingOperations,
    toggleSound,
    toggleAnimations,
    toggleSidebar,
    setTheme,
    setLanguage
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use context
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 