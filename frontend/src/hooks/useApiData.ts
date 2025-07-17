import { useState, useEffect, useCallback, useRef } from 'react';
import { UseApiDataOptions, UseApiDataReturn } from '../types/api.types';

export function useApiData<T>(
  apiCall: () => Promise<{ success: boolean; data?: T }>,
  options: UseApiDataOptions = {}
): UseApiDataReturn<T> {
  const { immediate = false, dependencies = [], cache = false } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  
  const mountedRef = useRef(true);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  
  const refresh = useCallback(async (): Promise<void> => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const cacheKey = apiCall.toString();
      
      // Check cache first
      if (cache) {
        const cached = cacheRef.current.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
          setData(cached.data);
          setLoading(false);
          return;
        }
      }
      
      const response = await apiCall();
      
      if (!mountedRef.current) return;
      
      if (response.success && response.data) {
        setData(response.data);
        
        // Cache successful responses
        if (cache) {
          cacheRef.current.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
          });
        }
      } else {
        throw new Error('API call failed');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('useApiData error:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, cache]);
  
  useEffect(() => {
    if (immediate) {
      refresh();
    }
  }, [refresh, immediate, ...dependencies]);
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  return {
    data,
    loading,
    error,
    refresh
  };
} 