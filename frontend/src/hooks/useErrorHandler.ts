import { useCallback, useState } from 'react';
import { ApiError, ValidationError, NetworkError } from '../types/api.types';

export interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  code?: string;
  field?: string;
  isVisible: boolean;
}

export interface UseErrorHandlerReturn {
  error: ErrorState | null;
  showError: (error: Error | string, type?: ErrorState['type']) => void;
  clearError: () => void;
  handleApiError: (error: Error) => void;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<ErrorState | null>(null);

  const showError = useCallback((error: Error | string, type: ErrorState['type'] = 'error') => {
    const message = typeof error === 'string' ? error : error.message;
    
    setError({
      message,
      type,
      isVisible: true,
      ...(error instanceof ValidationError && { field: error.field }),
      ...(error instanceof ApiError && { code: error.code })
    });

    // Auto-hide after 5 seconds for non-critical errors
    if (type !== 'error') {
      setTimeout(() => {
        setError(prev => prev ? { ...prev, isVisible: false } : null);
      }, 5000);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleApiError = useCallback((error: Error) => {
    console.error('API Error:', error);

    if (error instanceof ApiError) {
      switch (error.status) {
        case 400:
          showError(error.message || 'Données invalides', 'warning');
          break;
        case 401:
          showError('Session expirée, veuillez vous reconnecter', 'error');
          // Could trigger logout here
          break;
        case 403:
          showError('Accès non autorisé', 'error');
          break;
        case 404:
          showError('Ressource non trouvée', 'warning');
          break;
        case 429:
          showError('Trop de tentatives, veuillez patienter', 'warning');
          break;
        case 500:
        case 502:
        case 503:
          showError('Erreur du serveur, veuillez réessayer', 'error');
          break;
        default:
          showError(error.message || 'Erreur inattendue', 'error');
      }
    } else if (error instanceof NetworkError) {
      showError('Problème de connexion internet', 'error');
    } else if (error instanceof ValidationError) {
      showError(`Erreur de validation: ${error.message}`, 'warning');
    } else {
      showError('Une erreur inattendue s\'est produite', 'error');
    }
  }, [showError]);

  return {
    error,
    showError,
    clearError,
    handleApiError
  };
}; 