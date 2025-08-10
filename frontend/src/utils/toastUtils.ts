// Utility functions for toast management
export const generateToastId = (): string => {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const createToastProps = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => ({
  id: generateToastId(),
  message,
  type,
  onClose: () => {} // Will be overridden by useToast
}); 