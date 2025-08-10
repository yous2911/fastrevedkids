import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';
import {
  UseConsentState,
  UseGDPRRequestsState,
  UseConsentPreferencesState,
  UseStudentDataExportState,
  SubmitConsentRequest,
  SubmitGDPRRequest,
  ConsentPreferencesRequest,
  StudentDataExportRequest,
  ParentalConsentRecord,
  GDPRRequestRecord,
  ConsentPreferencesRecord,
  GDPRRequestStatusResponse
} from '../types/gdpr.types';

// Helper function to safely extract error messages
const getErrorMessage = (error: string | { message: string; code?: string; details?: any } | undefined): string => {
  if (!error) return 'Erreur inconnue';
  if (typeof error === 'string') return error;
  return error.message || 'Erreur inconnue';
};

/**
 * Hook pour gérer le consentement parental
 */
export const useParentalConsent = (): UseConsentState => {
  const [consent, setConsent] = useState<ParentalConsentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitConsent = useCallback(async (data: SubmitConsentRequest): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.submitParentalConsent(data);
      
      if (response.success) {
        console.log('✅ Consentement soumis:', response.data);
        // Optionnel: récupérer le statut du consentement
        // await checkConsentStatus(response.data.consentId);
      } else {
        throw new Error(getErrorMessage(response.error));
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la soumission du consentement';
      setError(errorMessage);
      console.error('❌ Erreur consentement:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyConsent = useCallback(async (token: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.verifyParentalConsent(token);
      
      if (response.success) {
        console.log('✅ Consentement vérifié:', response.data);
      } else {
        throw new Error(getErrorMessage(response.error));
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la vérification du consentement';
      setError(errorMessage);
      console.error('❌ Erreur vérification:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkConsentStatus = useCallback(async (consentId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getConsentStatus(consentId);
      
      if (response.success && response.data) {
        setConsent(response.data);
      } else {
        throw new Error(getErrorMessage(response.error));
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la récupération du statut';
      setError(errorMessage);
      console.error('❌ Erreur statut consentement:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    consent,
    loading,
    error,
    submitConsent,
    verifyConsent,
    checkConsentStatus
  };
};

/**
 * Hook pour gérer les demandes RGPD
 */
export const useGDPRRequests = (): UseGDPRRequestsState => {
  const [requests, setRequests] = useState<GDPRRequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRequest = useCallback(async (data: SubmitGDPRRequest): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.submitGDPRRequest(data);
      
      if (response.success && response.data) {
        console.log('✅ Demande RGPD soumise:', response.data);
        return response.data.requestId;
      } else {
        throw new Error(getErrorMessage(response.error));
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la soumission de la demande RGPD';
      setError(errorMessage);
      console.error('❌ Erreur demande RGPD:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRequestStatus = useCallback(async (requestId: string): Promise<GDPRRequestStatusResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getGDPRRequestStatus(requestId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(getErrorMessage(response.error));
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la récupération du statut';
      setError(errorMessage);
      console.error('❌ Erreur statut demande:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyRequest = useCallback(async (requestId: string, token: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.verifyGDPRRequest(requestId, token);
      
      if (response.success) {
        console.log('✅ Demande RGPD vérifiée:', response.data);
      } else {
        throw new Error(getErrorMessage(response.error));
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la vérification de la demande';
      setError(errorMessage);
      console.error('❌ Erreur vérification demande:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserRequests = useCallback(async (email: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserGDPRRequests(email);
      
      if (response.success) {
        setRequests(response.data || []);
      } else {
        throw new Error(getErrorMessage(response.error));
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des demandes';
      setError(errorMessage);
      console.error('❌ Erreur chargement demandes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    requests,
    loading,
    error,
    submitRequest,
    getRequestStatus,
    verifyRequest,
    // Méthode additionnelle pour charger les demandes utilisateur
    loadUserRequests
  } as UseGDPRRequestsState & { loadUserRequests: (email: string) => Promise<void> };
};

/**
 * Hook pour gérer les préférences de consentement
 */
export const useConsentPreferences = (studentId?: number): UseConsentPreferencesState => {
  const [preferences, setPreferences] = useState<ConsentPreferencesRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePreferences = useCallback(async (prefs: ConsentPreferencesRequest): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.updateConsentPreferences(prefs);
      
      if (response.success) {
        console.log('✅ Préférences mises à jour:', response.data);
        // Recharger les préférences après mise à jour
        await getPreferences();
      } else {
        throw new Error(getErrorMessage(response.error));
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour des préférences';
      setError(errorMessage);
      console.error('❌ Erreur préférences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPreferences = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getConsentPreferences(studentId);
      
      if (response.success) {
        setPreferences(response.data || null);
      } else {
        throw new Error(getErrorMessage(response.error));
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des préférences';
      setError(errorMessage);
      console.error('❌ Erreur chargement préférences:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  // Charger les préférences au montage du composant
  useEffect(() => {
    getPreferences();
  }, [getPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    getPreferences
  };
};

/**
 * Hook pour gérer l'export de données étudiant
 */
export const useStudentDataExport = (): UseStudentDataExportState => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<any[]>([]);

  const exportData = useCallback(async (request: StudentDataExportRequest): Promise<Blob> => {
    setLoading(true);
    setError(null);
    
    try {
      const blob = await apiService.exportStudentData(request);
      
      // Ajouter à l'historique des exports
      const exportRecord = {
        ...request,
        exportedAt: new Date().toISOString(),
        size: blob.size,
        type: blob.type
      };
      
      setExportHistory(prev => [exportRecord, ...prev.slice(0, 9)]); // Garder les 10 derniers
      
      console.log('✅ Export réussi:', exportRecord);
      return blob;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'export des données';
      setError(errorMessage);
      console.error('❌ Erreur export:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadData = useCallback(async (request: StudentDataExportRequest, filename?: string): Promise<void> => {
    try {
      await apiService.downloadStudentDataExport(request, filename);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du téléchargement';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    exportData,
    exportHistory,
    // Méthode additionnelle pour téléchargement direct
    downloadData
  } as UseStudentDataExportState & { downloadData: (request: StudentDataExportRequest, filename?: string) => Promise<void> };
};

/**
 * Hook composé pour gérer tous les aspects RGPD
 */
export const useGDPR = (studentId?: number) => {
  const consent = useParentalConsent();
  const requests = useGDPRRequests();
  const preferences = useConsentPreferences(studentId);
  const dataExport = useStudentDataExport();

  const [gdprConfig, setGdprConfig] = useState<any>(null);
  const [healthCheck, setHealthCheck] = useState<any>(null);

  // Charger la configuration RGPD
  useEffect(() => {
    const loadGDPRConfig = async () => {
      try {
        const response = await apiService.getGDPRConfig();
        if (response.success) {
          setGdprConfig(response.data);
        }
      } catch (error) {
        console.warn('⚠️ Impossible de charger la config RGPD:', error);
      }
    };

    const checkGDPRHealth = async () => {
      try {
        const response = await apiService.getGDPRHealthCheck();
        if (response.success) {
          setHealthCheck(response.data);
        }
      } catch (error) {
        console.warn('⚠️ Santé RGPD non disponible:', error);
      }
    };

    loadGDPRConfig();
    checkGDPRHealth();
  }, []);

  // Vérifier le consentement actif pour un étudiant
  const checkActiveConsent = useCallback(async (id: number) => {
    try {
      const response = await apiService.checkActiveConsent(id);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('❌ Erreur vérification consentement actif:', error);
      return null;
    }
  }, []);

  return {
    // Hooks individuels
    consent,
    requests,
    preferences,
    dataExport,
    
    // Configuration et santé
    gdprConfig,
    healthCheck,
    
    // Utilitaires
    checkActiveConsent,
    
    // État global
    isGDPREnabled: gdprConfig?.enabled ?? true,
    isParentalConsentRequired: gdprConfig?.parentalConsentRequired ?? true
  };
};

/**
 * Hook pour vérifier automatiquement le consentement
 */
export const useConsentCheck = (studentId?: number) => {
  const [hasActiveConsent, setHasActiveConsent] = useState<boolean | null>(null);
  const [consentRecord, setConsentRecord] = useState<ParentalConsentRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;

    const checkConsent = async () => {
      setLoading(true);
      try {
        const response = await apiService.checkActiveConsent(studentId);
        if (response.success && response.data) {
          setHasActiveConsent(response.data.hasActiveConsent);
          setConsentRecord(response.data.consent || null);
        }
      } catch (error) {
        console.error('❌ Erreur vérification consentement:', error);
        setHasActiveConsent(false);
      } finally {
        setLoading(false);
      }
    };

    checkConsent();
  }, [studentId]);

  return {
    hasActiveConsent,
    consentRecord,
    loading,
    requiresConsent: hasActiveConsent === false
  };
};