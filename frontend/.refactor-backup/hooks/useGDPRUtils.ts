import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';
import {
  ConsentType,
  GDPRRequestType,
  RequestStatus,
  Priority,
  CONSENT_TYPES_LABELS,
  GDPR_REQUEST_TYPES_LABELS,
  REQUEST_STATUS_LABELS,
  PRIORITY_LABELS,
  getUserAgent,
  getClientIP
} from '../types/gdpr.types';

/**
 * Hook pour gérer l'état de connexion RGPD
 */
export const useGDPRConnection = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const response = await apiService.getGDPRHealthCheck();
      setIsConnected(response.success);
      setLastCheck(new Date());
      return response.success;
    } catch (error) {
      setIsConnected(false);
      setLastCheck(new Date());
      return false;
    }
  }, []);

  // Vérifier la connexion au montage
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    lastCheck,
    checkConnection
  };
};

/**
 * Hook pour obtenir automatiquement les informations client
 */
export const useClientInfo = () => {
  const [clientInfo, setClientInfo] = useState({
    userAgent: getUserAgent(),
    ipAddress: 'loading...'
  });

  useEffect(() => {
    const loadClientIP = async () => {
      try {
        const ip = await getClientIP();
        setClientInfo(prev => ({ ...prev, ipAddress: ip }));
      } catch (error) {
        console.warn('⚠️ Impossible d\'obtenir l\'IP client:', error);
        setClientInfo(prev => ({ ...prev, ipAddress: 'unknown' }));
      }
    };

    loadClientIP();
  }, []);

  return clientInfo;
};

/**
 * Hook pour les labels et traductions
 */
export const useGDPRLabels = () => {
  const getConsentTypeLabel = useCallback((type: ConsentType): string => {
    return CONSENT_TYPES_LABELS[type] || type;
  }, []);

  const getRequestTypeLabel = useCallback((type: GDPRRequestType): string => {
    return GDPR_REQUEST_TYPES_LABELS[type] || type;
  }, []);

  const getStatusLabel = useCallback((status: RequestStatus): string => {
    return REQUEST_STATUS_LABELS[status] || status;
  }, []);

  const getPriorityLabel = useCallback((priority: Priority): string => {
    return PRIORITY_LABELS[priority] || priority;
  }, []);

  const getStatusColor = useCallback((status: RequestStatus): string => {
    const colors: Record<RequestStatus, string> = {
      pending: 'orange',
      under_review: 'blue',
      verification_required: 'purple',
      approved: 'green',
      rejected: 'red',
      completed: 'green',
      expired: 'gray'
    };
    return colors[status] || 'gray';
  }, []);

  const getPriorityColor = useCallback((priority: Priority): string => {
    const colors: Record<Priority, string> = {
      low: 'green',
      medium: 'yellow',
      high: 'orange',
      urgent: 'red'
    };
    return colors[priority] || 'gray';
  }, []);

  return {
    getConsentTypeLabel,
    getRequestTypeLabel,
    getStatusLabel,
    getPriorityLabel,
    getStatusColor,
    getPriorityColor
  };
};

/**
 * Hook pour la validation des formulaires RGPD
 */
export const useGDPRValidation = () => {
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validateAge = useCallback((age: number): boolean => {
    return age >= 1 && age <= 18;
  }, []);

  const validateName = useCallback((name: string): boolean => {
    return name.trim().length >= 2;
  }, []);

  const validateConsentTypes = useCallback((types: ConsentType[]): boolean => {
    return types.length > 0 && types.includes('data_processing');
  }, []);

  const validateGDPRRequestDetails = useCallback((details: string): boolean => {
    return details.trim().length >= 10;
  }, []);

  const validateParentalConsentForm = useCallback((data: {
    parentEmail: string;
    parentName: string;
    childName: string;
    childAge: number;
    consentTypes: ConsentType[];
  }) => {
    const errors: Record<string, string> = {};

    if (!validateEmail(data.parentEmail)) {
      errors.parentEmail = 'Email invalide';
    }

    if (!validateName(data.parentName)) {
      errors.parentName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!validateName(data.childName)) {
      errors.childName = 'Le nom de l\'enfant doit contenir au moins 2 caractères';
    }

    if (!validateAge(data.childAge)) {
      errors.childAge = 'L\'âge doit être entre 1 et 18 ans';
    }

    if (!validateConsentTypes(data.consentTypes)) {
      errors.consentTypes = 'Le consentement de traitement des données est obligatoire';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [validateEmail, validateName, validateAge, validateConsentTypes]);

  const validateGDPRRequestForm = useCallback((data: {
    requesterEmail: string;
    requesterName: string;
    requestDetails: string;
    studentName?: string;
  }) => {
    const errors: Record<string, string> = {};

    if (!validateEmail(data.requesterEmail)) {
      errors.requesterEmail = 'Email invalide';
    }

    if (!validateName(data.requesterName)) {
      errors.requesterName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!validateGDPRRequestDetails(data.requestDetails)) {
      errors.requestDetails = 'La description doit contenir au moins 10 caractères';
    }

    if (data.studentName && !validateName(data.studentName)) {
      errors.studentName = 'Le nom de l\'étudiant doit contenir au moins 2 caractères';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [validateEmail, validateName, validateGDPRRequestDetails]);

  return {
    validateEmail,
    validateAge,
    validateName,
    validateConsentTypes,
    validateGDPRRequestDetails,
    validateParentalConsentForm,
    validateGDPRRequestForm
  };
};

/**
 * Hook pour la persistance locale des données RGPD
 */
export const useGDPRStorage = () => {
  const STORAGE_KEYS = {
    CONSENT_PREFERENCES: 'gdpr_consent_preferences',
    GDPR_REQUESTS: 'gdpr_requests_cache',
    FORM_DRAFTS: 'gdpr_form_drafts'
  };

  const saveConsentPreferences = useCallback((preferences: any) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONSENT_PREFERENCES, JSON.stringify({
        ...preferences,
        savedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder les préférences:', error);
    }
  }, []);

  const loadConsentPreferences = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONSENT_PREFERENCES);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('⚠️ Impossible de charger les préférences:', error);
      return null;
    }
  }, []);

  const saveFormDraft = useCallback((formType: string, data: any) => {
    try {
      const drafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.FORM_DRAFTS) || '{}');
      drafts[formType] = {
        ...data,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.FORM_DRAFTS, JSON.stringify(drafts));
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder le brouillon:', error);
    }
  }, []);

  const loadFormDraft = useCallback((formType: string) => {
    try {
      const drafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.FORM_DRAFTS) || '{}');
      return drafts[formType] || null;
    } catch (error) {
      console.warn('⚠️ Impossible de charger le brouillon:', error);
      return null;
    }
  }, []);

  const clearFormDraft = useCallback((formType: string) => {
    try {
      const drafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.FORM_DRAFTS) || '{}');
      delete drafts[formType];
      localStorage.setItem(STORAGE_KEYS.FORM_DRAFTS, JSON.stringify(drafts));
    } catch (error) {
      console.warn('⚠️ Impossible de supprimer le brouillon:', error);
    }
  }, []);

  const clearAllGDPRData = useCallback(() => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('⚠️ Impossible de nettoyer les données RGPD:', error);
    }
  }, []);

  return {
    saveConsentPreferences,
    loadConsentPreferences,
    saveFormDraft,
    loadFormDraft,
    clearFormDraft,
    clearAllGDPRData
  };
};

/**
 * Hook pour les notifications et feedback utilisateur
 */
export const useGDPRNotifications = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>>([]);

  const addNotification = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    message: string
  ) => {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Garder les 5 dernières

    // Auto-suppression après 5 secondes pour les succès et infos
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helpers pour les types de notifications courants
  const notifySuccess = useCallback((message: string) => addNotification('success', message), [addNotification]);
  const notifyError = useCallback((message: string) => addNotification('error', message), [addNotification]);
  const notifyWarning = useCallback((message: string) => addNotification('warning', message), [addNotification]);
  const notifyInfo = useCallback((message: string) => addNotification('info', message), [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo
  };
};

/**
 * Hook pour gérer les états de chargement multiples
 */
export const useGDPRLoading = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates
  };
};