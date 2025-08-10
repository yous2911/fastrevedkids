import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useGDPR } from '../hooks/useGDPR';
import { useGDPRNotifications, useGDPRConnection } from '../hooks/useGDPRUtils';
import {
  ParentalConsentRecord,
  GDPRRequestRecord,
  ConsentPreferencesRecord,
  GDPRConfig
} from '../types/gdpr.types';

// Types pour le contexte RGPD
interface GDPRState {
  // Configuration RGPD
  config: GDPRConfig | null;
  isEnabled: boolean;
  isConnected: boolean;
  
  // Données utilisateur
  currentStudentId: number | null;
  activeConsent: ParentalConsentRecord | null;
  userRequests: GDPRRequestRecord[];
  consentPreferences: ConsentPreferencesRecord | null;
  
  // États d'interface
  showConsentBanner: boolean;
  showGDPRDashboard: boolean;
  lastConsentCheck: Date | null;
  
  // Cache et performance
  cacheTimestamp: Date | null;
  backgroundSync: boolean;
}

interface GDPRActions {
  // Actions de configuration
  setConfig: (config: GDPRConfig) => void;
  setStudentId: (id: number | null) => void;
  
  // Actions de consentement
  updateActiveConsent: (consent: ParentalConsentRecord | null) => void;
  updateConsentPreferences: (preferences: ConsentPreferencesRecord | null) => void;
  
  // Actions de demandes RGPD
  addGDPRRequest: (request: GDPRRequestRecord) => void;
  updateGDPRRequest: (requestId: string, updates: Partial<GDPRRequestRecord>) => void;
  
  // Actions d'interface
  showConsentBannerAction: (show: boolean) => void;
  showGDPRDashboardAction: (show: boolean) => void;
  
  // Actions de cache
  refreshCache: () => void;
  enableBackgroundSync: (enabled: boolean) => void;
}

interface GDPRContextValue extends GDPRState, GDPRActions {
  // Hooks intégrés
  notifications: ReturnType<typeof useGDPRNotifications>;
  connection: ReturnType<typeof useGDPRConnection>;
  gdprHooks: ReturnType<typeof useGDPR>;
}

// Actions du reducer
type GDPRActionType = 
  | { type: 'SET_CONFIG'; payload: GDPRConfig }
  | { type: 'SET_STUDENT_ID'; payload: number | null }
  | { type: 'UPDATE_ACTIVE_CONSENT'; payload: ParentalConsentRecord | null }
  | { type: 'UPDATE_CONSENT_PREFERENCES'; payload: ConsentPreferencesRecord | null }
  | { type: 'ADD_GDPR_REQUEST'; payload: GDPRRequestRecord }
  | { type: 'UPDATE_GDPR_REQUEST'; payload: { requestId: string; updates: Partial<GDPRRequestRecord> } }
  | { type: 'SHOW_CONSENT_BANNER'; payload: boolean }
  | { type: 'SHOW_GDPR_DASHBOARD'; payload: boolean }
  | { type: 'REFRESH_CACHE' }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'ENABLE_BACKGROUND_SYNC'; payload: boolean };

// Reducer pour gérer l'état RGPD
const gdprReducer = (state: GDPRState, action: GDPRActionType): GDPRState => {
  switch (action.type) {
    case 'SET_CONFIG':
      return {
        ...state,
        config: action.payload,
        isEnabled: action.payload.enabled,
        showConsentBanner: action.payload.consentBannerEnabled && !state.activeConsent
      };
      
    case 'SET_STUDENT_ID':
      return {
        ...state,
        currentStudentId: action.payload,
        // Reset des données spécifiques à l'étudiant lors du changement
        activeConsent: null,
        consentPreferences: null,
        lastConsentCheck: null
      };
      
    case 'UPDATE_ACTIVE_CONSENT':
      return {
        ...state,
        activeConsent: action.payload,
        showConsentBanner: !action.payload && (state.config?.consentBannerEnabled ?? false),
        lastConsentCheck: new Date()
      };
      
    case 'UPDATE_CONSENT_PREFERENCES':
      return {
        ...state,
        consentPreferences: action.payload
      };
      
    case 'ADD_GDPR_REQUEST':
      return {
        ...state,
        userRequests: [action.payload, ...state.userRequests]
      };
      
    case 'UPDATE_GDPR_REQUEST':
      return {
        ...state,
        userRequests: state.userRequests.map(request =>
          request.id === action.payload.requestId
            ? { ...request, ...action.payload.updates }
            : request
        )
      };
      
    case 'SHOW_CONSENT_BANNER':
      return {
        ...state,
        showConsentBanner: action.payload
      };
      
    case 'SHOW_GDPR_DASHBOARD':
      return {
        ...state,
        showGDPRDashboard: action.payload
      };
      
    case 'REFRESH_CACHE':
      return {
        ...state,
        cacheTimestamp: new Date()
      };
      
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload
      };
      
    case 'ENABLE_BACKGROUND_SYNC':
      return {
        ...state,
        backgroundSync: action.payload
      };
      
    default:
      return state;
  }
};

// État initial
const initialState: GDPRState = {
  config: null,
  isEnabled: false,
  isConnected: false,
  currentStudentId: null,
  activeConsent: null,
  userRequests: [],
  consentPreferences: null,
  showConsentBanner: false,
  showGDPRDashboard: false,
  lastConsentCheck: null,
  cacheTimestamp: null,
  backgroundSync: true
};

// Création du contexte
const GDPRContext = createContext<GDPRContextValue | null>(null);

// Props du provider
interface GDPRProviderProps {
  children: ReactNode;
  initialStudentId?: number;
  config?: Partial<GDPRConfig>;
}

// Provider du contexte RGPD
export const GDPRProvider: React.FC<GDPRProviderProps> = ({
  children,
  initialStudentId,
  config: initialConfig
}) => {
  const [state, dispatch] = useReducer(gdprReducer, {
    ...initialState,
    currentStudentId: initialStudentId || null
  });

  // Hooks intégrés
  const notifications = useGDPRNotifications();
  const connection = useGDPRConnection();
  const gdprHooks = useGDPR(state.currentStudentId || undefined);

  // Synchronisation de l'état de connexion
  useEffect(() => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: connection.isConnected || false });
  }, [connection.isConnected]);

  // Synchronisation de la configuration depuis les hooks
  useEffect(() => {
    if (gdprHooks.gdprConfig) {
      dispatch({ type: 'SET_CONFIG', payload: gdprHooks.gdprConfig });
    } else if (initialConfig) {
      // Utiliser la config par défaut si pas de config depuis l'API
      const defaultConfig: GDPRConfig = {
        enabled: true,
        parentalConsentRequired: true,
        consentBannerEnabled: true,
        showGranularControls: true,
        cookieConsentRequired: true,
        dataRetentionDays: 1095,
        contactEmail: 'support@revedkids.com',
        privacyPolicyUrl: '/privacy',
        termsOfServiceUrl: '/terms',
        ...initialConfig
      };
      dispatch({ type: 'SET_CONFIG', payload: defaultConfig });
    }
  }, [gdprHooks.gdprConfig, initialConfig]);

  // Synchronisation des préférences de consentement
  useEffect(() => {
    if (gdprHooks.preferences.preferences) {
      dispatch({ 
        type: 'UPDATE_CONSENT_PREFERENCES', 
        payload: gdprHooks.preferences.preferences 
      });
    }
  }, [gdprHooks.preferences.preferences]);

  // Vérification automatique du consentement lors du changement d'étudiant
  useEffect(() => {
    if (state.currentStudentId && state.isEnabled) {
      const checkConsent = async () => {
        try {
          const consentData = await gdprHooks.checkActiveConsent(state.currentStudentId!);
          dispatch({ 
            type: 'UPDATE_ACTIVE_CONSENT', 
            payload: consentData?.consent || null 
          });
        } catch (error) {
          console.error('❌ Erreur vérification consentement:', error);
          notifications.notifyWarning('Impossible de vérifier le consentement parental');
        }
      };

      checkConsent();
    }
  }, [state.currentStudentId, state.isEnabled, gdprHooks, notifications]);

  // Synchronisation en arrière-plan (si activée)
  useEffect(() => {
    if (!state.backgroundSync || !state.isEnabled) return;

    const syncInterval = setInterval(async () => {
      try {
        // Vérifier la connexion
        await connection.checkConnection();
        
        // Rafraîchir les données si nécessaire
        if (state.currentStudentId) {
          await gdprHooks.preferences.getPreferences();
        }
      } catch (error) {
        console.warn('⚠️ Synchronisation en arrière-plan échouée:', error);
      }
    }, 5 * 60 * 1000); // Toutes les 5 minutes

    return () => clearInterval(syncInterval);
  }, [state.backgroundSync, state.isEnabled, state.currentStudentId, connection, gdprHooks.preferences]);

  // Actions du contexte
  const actions: GDPRActions = {
    setConfig: (config: GDPRConfig) => {
      dispatch({ type: 'SET_CONFIG', payload: config });
    },
    
    setStudentId: (id: number | null) => {
      dispatch({ type: 'SET_STUDENT_ID', payload: id });
    },
    
    updateActiveConsent: (consent: ParentalConsentRecord | null) => {
      dispatch({ type: 'UPDATE_ACTIVE_CONSENT', payload: consent });
    },
    
    updateConsentPreferences: (preferences: ConsentPreferencesRecord | null) => {
      dispatch({ type: 'UPDATE_CONSENT_PREFERENCES', payload: preferences });
    },
    
    addGDPRRequest: (request: GDPRRequestRecord) => {
      dispatch({ type: 'ADD_GDPR_REQUEST', payload: request });
      notifications.notifySuccess('Demande RGPD soumise avec succès');
    },
    
    updateGDPRRequest: (requestId: string, updates: Partial<GDPRRequestRecord>) => {
      dispatch({ type: 'UPDATE_GDPR_REQUEST', payload: { requestId, updates } });
    },
    
    showConsentBannerAction: (show: boolean) => {
      dispatch({ type: 'SHOW_CONSENT_BANNER', payload: show });
    },
    
    showGDPRDashboardAction: (show: boolean) => {
      dispatch({ type: 'SHOW_GDPR_DASHBOARD', payload: show });
    },
    
    refreshCache: () => {
      dispatch({ type: 'REFRESH_CACHE' });
      notifications.notifyInfo('Cache RGPD actualisé');
    },
    
    enableBackgroundSync: (enabled: boolean) => {
      dispatch({ type: 'ENABLE_BACKGROUND_SYNC', payload: enabled });
    }
  };

  // Valeur du contexte
  const contextValue: GDPRContextValue = {
    // État
    ...state,
    
    // Actions
    ...actions,
    
    // Hooks intégrés
    notifications,
    connection,
    gdprHooks
  };

  return (
    <GDPRContext.Provider value={contextValue}>
      {children}
    </GDPRContext.Provider>
  );
};

// Hook pour utiliser le contexte RGPD
export const useGDPRContext = (): GDPRContextValue => {
  const context = useContext(GDPRContext);
  
  if (!context) {
    throw new Error('useGDPRContext doit être utilisé dans un GDPRProvider');
  }
  
  return context;
};

// HOC pour encapsuler automatiquement les composants avec le contexte RGPD
export const withGDPR = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { gdprStudentId?: number; gdprConfig?: Partial<GDPRConfig> }> => {
  return ({ gdprStudentId, gdprConfig, ...props }) => (
    <GDPRProvider initialStudentId={gdprStudentId} config={gdprConfig}>
      <Component {...(props as P)} />
    </GDPRProvider>
  );
};

// Hook utilitaire pour vérifier si l'utilisateur peut accéder aux fonctionnalités
export const useGDPRPermissions = () => {
  const { isEnabled, activeConsent, config } = useGDPRContext();

  const canAccessStudentData = (studentId?: number) => {
    if (!isEnabled) return true; // Si RGPD désactivé, accès libre
    if (!config?.parentalConsentRequired) return true; // Si consentement pas requis
    if (!studentId) return false; // Pas d'ID étudiant
    return !!activeConsent; // Retourner true si consentement actif
  };

  const requiresConsentBanner = () => {
    return isEnabled && config?.consentBannerEnabled && !activeConsent;
  };

  const canExportData = () => {
    return isEnabled && !!activeConsent;
  };

  const canSubmitGDPRRequest = () => {
    return isEnabled; // Les demandes RGPD sont toujours possibles si RGPD activé
  };

  return {
    canAccessStudentData,
    requiresConsentBanner,
    canExportData,
    canSubmitGDPRRequest,
    isGDPREnabled: isEnabled,
    hasActiveConsent: !!activeConsent
  };
};