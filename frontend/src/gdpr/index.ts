// Export principal pour tous les composants et utilitaires RGPD
// Point d'entrée unique pour l'intégration RGPD dans l'application

// Types
export * from '../types/gdpr.types';

// Hooks principaux
export {
  useParentalConsent,
  useGDPRRequests,
  useConsentPreferences,
  useStudentDataExport,
  useGDPR,
  useConsentCheck
} from '../hooks/useGDPR';

// Hooks utilitaires
export {
  useGDPRConnection,
  useClientInfo,
  useGDPRLabels,
  useGDPRValidation,
  useGDPRStorage,
  useGDPRNotifications,
  useGDPRLoading
} from '../hooks/useGDPRUtils';

// Contexte et Provider
import {
  GDPRProvider,
  useGDPRContext,
  useGDPRPermissions,
  withGDPR
} from '../contexts/GDPRContext';

export {
  GDPRProvider,
  useGDPRContext,
  useGDPRPermissions,
  withGDPR
};

// Composants UI (à importer depuis les composants existants)
export { default as ConsentBanner } from '../components/gdpr/ConsentBanner';
export { default as GDPRDashboard } from '../components/gdpr/GDPRDashboard';
export { default as GDPRTestIntegration } from '../components/gdpr/GDPRTestIntegration';

// Services API (extensions RGPD)
import { apiService } from '../services/api.service';
export { apiService };

// Configuration par défaut RGPD
export const DEFAULT_GDPRCONFIG = {
  enabled: true,
  parentalConsentRequired: true,
  consentBannerEnabled: true,
  showGranularControls: true,
  cookieConsentRequired: true,
  dataRetentionDays: 1095, // 3 ans
  contactEmail: 'support@revedkids.com',
  privacyPolicyUrl: '/privacy',
  termsOfServiceUrl: '/terms'
};

// Utilitaires d'initialisation
export const initializeGDPR = async (config?: Partial<typeof DEFAULT_GDPRCONFIG>) => {
  try {
    // Vérifier la connexion aux services RGPD
    const healthCheck = await apiService.getGDPRHealthCheck();
    
    if (!healthCheck.success) {
      console.warn('⚠️ Services RGPD non disponibles');
      return { success: false, error: 'Services RGPD non disponibles' };
    }

    // Charger la configuration depuis le serveur
    const serverConfig = await apiService.getGDPRConfig();
    const FINAL_CONFIG = {
      ...DEFAULT_GDPRCONFIG,
      ...(serverConfig.success ? serverConfig.data : {}),
      ...config
    };

    console.log('✅ RGPD initialisé avec succès:', FINAL_CONFIG);
    return { success: true, config: FINAL_CONFIG };

  } catch (error) {
    console.error('❌ Erreur initialisation RGPD:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      config: { ...DEFAULT_GDPRCONFIG, ...config }
    };
  }
};

// Helpers pour l'intégration rapide
// Constantes utiles
export const GDPR_STORAGE_KEYS = {
  CONSENT_PREFERENCES: 'gdpr_consent_preferences',
  GDPR_REQUESTS: 'gdpr_requests_cache',
  FORM_DRAFTS: 'gdpr_form_drafts'
} as const;

export const GDPR_EVENTS = {
  CONSENT_GIVEN: 'gdpr:consent:given',
  CONSENT_REVOKED: 'gdpr:consent:revoked',
  REQUEST_SUBMITTED: 'gdpr:request:submitted',
  REQUEST_COMPLETED: 'gdpr:request:completed',
  DATA_EXPORTED: 'gdpr:data:exported'
} as const;

// Helpers de validation rapide
export const QUICK_VALIDATION = {
  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  isValidAge: (age: number): boolean => {
    return age >= 1 && age <= 18;
  },
  
  isValidName: (name: string): boolean => {
    return name.trim().length >= 2;
  },
  
  requiresParentalConsent: (age: number): boolean => {
    return age < 16; // Seuil RGPD pour le consentement parental
  }
};

// Types d'erreurs RGPD communes
export class GDPRError extends Error {
  constructor(
    message: string,
    public code: string = 'GDPR_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'GDPRError';
  }
}

export class ConsentError extends GDPRError {
  constructor(message: string, details?: any) {
    super(message, 'CONSENT_ERROR', details);
    this.name = 'ConsentError';
  }
}

export class DataExportError extends GDPRError {
  constructor(message: string, details?: any) {
    super(message, 'DATA_EXPORT_ERROR', details);
    this.name = 'DataExportError';
  }
}

// Guide d'intégration rapide (commentaires)
/*
GUIDE D'INTÉGRATION RAPIDE RGPD

1. Installation de base:
```tsx
import { GDPRProvider, initializeGDPR } from './gdpr';

// Dans votre App.tsx
const App = () => {
  useEffect(() => {
    initializeGDPR({
      enabled: true,
      parentalConsentRequired: true
    });
  }, []);

  return (
    <GDPRProvider>
      <YourApp />
    </GDPRProvider>
  );
};
```

2. Utilisation dans un composant:
```tsx
import { useGDPRContext, useConsentCheck } from './gdpr';

return <StudentData />;
};
```

3. Vérification des permissions:
```tsx
import { useGDPRPermissions } from './gdpr';

return <ExportButton />;
};
```

4. Gestion des demandes RGPD:
```tsx
import { useGDPRRequests } from './gdpr';

= useGDPRRequests();
  
  const handleSubmit = async (data) => {
    const requestId = await submitRequest(data);
    console.log('Demande soumise:', requestId);
  };
  
  return <FormComponent onSubmit={handleSubmit} loading={loading} />;
};
```
*/