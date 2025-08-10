import React, { useState, forwardRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =====================================================
// BASE INPUT COMPONENT
// =====================================================

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'magical' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  success?: boolean;
  animated?: boolean;
  showValidation?: boolean;
  onValidate?: (value: string) => string | null;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  loading = false,
  success = false,
  animated = true,
  showValidation = true,
  onValidate,
  containerClassName = '',
  className = '',
  onChange,
  onBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg',
    xl: 'px-6 py-5 text-xl'
  };

  const variantClasses = {
    default: `
      border border-gray-300 bg-white 
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      ${error || internalError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
      ${success ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : ''}
    `,
    magical: `
      border-2 border-purple-300 bg-gradient-to-r from-blue-50 to-purple-50
      focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-magical
      ${error || internalError ? 'border-red-500 focus:ring-red-500 from-red-50 to-pink-50' : ''}
      ${success ? 'border-green-500 focus:ring-green-500 from-green-50 to-emerald-50' : ''}
    `,
    outlined: `
      border-2 border-gray-300 bg-transparent
      focus:ring-0 focus:border-blue-500
      ${error || internalError ? 'border-red-500 focus:border-red-500' : ''}
      ${success ? 'border-green-500 focus:border-green-500' : ''}
    `,
    filled: `
      border-0 bg-gray-100
      focus:ring-2 focus:ring-blue-500 focus:bg-white
      ${error || internalError ? 'bg-red-50 focus:ring-red-500' : ''}
      ${success ? 'bg-green-50 focus:ring-green-500' : ''}
    `
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onValidate && showValidation) {
      const validationError = onValidate(e.target.value);
      setInternalError(validationError);
    }
    onChange?.(e);
  }, [onChange, onValidate, showValidation]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onValidate && showValidation) {
      const validationError = onValidate(e.target.value);
      setInternalError(validationError);
    }
    onBlur?.(e);
  }, [onBlur, onValidate, showValidation]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setInternalError(null);
  }, []);

  const hasError = !!(error || internalError);
  const displayError = error || internalError;

  return (
    <div className={`w-full ${containerClassName}`}>
      {/* Label */}
      {label && (
        <motion.label
          className={`
            block text-sm font-medium mb-2 transition-colors
            ${hasError ? 'text-red-600' : success ? 'text-green-600' : 'text-gray-700'}
          `}
          initial={animated ? { opacity: 0, y: -10 } : false}
          animate={animated ? { opacity: 1, y: 0 } : false}
          transition={{ duration: 0.2 }}
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className={`
            absolute inset-y-0 left-0 flex items-center pointer-events-none z-10
            ${size === 'sm' ? 'pl-2' : size === 'lg' ? 'pl-4' : size === 'xl' ? 'pl-5' : 'pl-3'}
          `}>
            <div className={`
              ${hasError ? 'text-red-500' : success ? 'text-green-500' : 'text-gray-400'}
              transition-colors
            `}>
              {leftIcon}
            </div>
          </div>
        )}

        {/* Input Field */}
        <motion.input
          ref={ref}
          className={`
            w-full rounded-xl transition-all duration-200 outline-none
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            ${leftIcon ? (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : size === 'xl' ? 'pl-14' : 'pl-10') : ''}
            ${rightIcon || loading || success ? (size === 'sm' ? 'pr-8' : size === 'lg' ? 'pr-12' : size === 'xl' ? 'pr-14' : 'pr-10') : ''}
            ${props.disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
            ${className}
          `}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          whileFocus={animated ? { scale: 1.02 } : undefined}
          {...(props as any)}
        />

        {/* Right Icon/Status */}
        <div className={`
          absolute inset-y-0 right-0 flex items-center pointer-events-none
          ${size === 'sm' ? 'pr-2' : size === 'lg' ? 'pr-4' : size === 'xl' ? 'pr-5' : 'pr-3'}
        `}>
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
            />
          ) : success ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-green-500"
            >
              ✓
            </motion.div>
          ) : hasError ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-red-500"
            >
              ⚠
            </motion.div>
          ) : rightIcon ? (
            <div className="text-gray-400">
              {rightIcon}
            </div>
          ) : null}
        </div>

        {/* Focus Ring Animation */}
        {animated && isFocused && variant === 'magical' && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-purple-400 pointer-events-none"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0.5, 0], scale: [1, 1.05] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </div>

      {/* Helper Text / Error Message */}
      <AnimatePresence>
        {(displayError || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="mt-2"
          >
            {displayError ? (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span>
                {displayError}
              </p>
            ) : helperText ? (
              <p className="text-sm text-gray-500">
                {helperText}
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

// =====================================================
// TEXTAREA COMPONENT
// =====================================================

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'magical' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showValidation?: boolean;
  onValidate?: (value: string) => string | null;
  containerClassName?: string;
  maxLength?: number;
  showCharCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  animated = true,
  showValidation = true,
  onValidate,
  containerClassName = '',
  className = '',
  maxLength,
  showCharCount = false,
  onChange,
  onBlur,
  value,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[80px]',
    md: 'px-4 py-3 text-base min-h-[100px]',
    lg: 'px-5 py-4 text-lg min-h-[120px]'
  };

  const variantClasses = {
    default: `
      border border-gray-300 bg-white 
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      ${error || internalError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
    `,
    magical: `
      border-2 border-purple-300 bg-gradient-to-r from-blue-50 to-purple-50
      focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-magical
      ${error || internalError ? 'border-red-500 focus:ring-red-500 from-red-50 to-pink-50' : ''}
    `,
    outlined: `
      border-2 border-gray-300 bg-transparent
      focus:ring-0 focus:border-blue-500
      ${error || internalError ? 'border-red-500 focus:border-red-500' : ''}
    `,
    filled: `
      border-0 bg-gray-100
      focus:ring-2 focus:ring-blue-500 focus:bg-white
      ${error || internalError ? 'bg-red-50 focus:ring-red-500' : ''}
    `
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCharCount(newValue.length);
    
    if (onValidate && showValidation) {
      const validationError = onValidate(newValue);
      setInternalError(validationError);
    }
    onChange?.(e);
  }, [onChange, onValidate, showValidation]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (onValidate && showValidation) {
      const validationError = onValidate(e.target.value);
      setInternalError(validationError);
    }
    onBlur?.(e);
  }, [onBlur, onValidate, showValidation]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setInternalError(null);
  }, []);

  const hasError = !!(error || internalError);
  const displayError = error || internalError;

  // Update char count when value changes externally
  React.useEffect(() => {
    if (typeof value === 'string') {
      setCharCount(value.length);
    }
  }, [value]);

  return (
    <div className={`w-full ${containerClassName}`}>
      {/* Label */}
      {label && (
        <motion.label
          className={`
            block text-sm font-medium mb-2 transition-colors
            ${hasError ? 'text-red-600' : 'text-gray-700'}
          `}
          initial={animated ? { opacity: 0, y: -10 } : false}
          animate={animated ? { opacity: 1, y: 0 } : false}
          transition={{ duration: 0.2 }}
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>
      )}

      {/* Textarea Container */}
      <div className="relative">
        <motion.textarea
          ref={ref}
          className={`
            w-full rounded-xl transition-all duration-200 outline-none resize-vertical
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            ${props.disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
            ${className}
          `}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          value={value}
          maxLength={maxLength}
          whileFocus={animated ? { scale: 1.01 } : undefined}
          {...(props as any)}
        />

        {/* Focus Ring Animation */}
        {animated && isFocused && variant === 'magical' && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-purple-400 pointer-events-none"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0.5, 0], scale: [1, 1.02] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 flex justify-between items-start">
        <AnimatePresence>
          {(displayError || helperText) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {displayError ? (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span>⚠️</span>
                  {displayError}
                </p>
              ) : helperText ? (
                <p className="text-sm text-gray-500">
                  {helperText}
                </p>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Character Count */}
        {(showCharCount || maxLength) && (
          <motion.div
            className={`text-xs ${
              maxLength && charCount > maxLength * 0.9 
                ? charCount >= maxLength 
                  ? 'text-red-500' 
                  : 'text-yellow-500'
                : 'text-gray-400'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {maxLength ? `${charCount}/${maxLength}` : charCount}
          </motion.div>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

// =====================================================
// SEARCH INPUT COMPONENT
// =====================================================

interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'rightIcon'> {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
  debounceMs?: number;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  onClear,
  showClearButton = true,
  debounceMs = 300,
  value,
  onChange,
  placeholder = "Rechercher...",
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(e);

    // Debounced search
    if (onSearch) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onSearch(newValue);
      }, debounceMs);
    }
  }, [onChange, onSearch, debounceMs]);

  const handleClear = useCallback(() => {
    setInternalValue('');
    onClear?.();
    onSearch?.('');
  }, [onClear, onSearch]);

  return (
    <Input
      {...props}
      value={internalValue}
      onChange={handleChange}
      placeholder={placeholder}
      leftIcon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      rightIcon={
        showClearButton && internalValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null
      }
    />
  );
};

// =====================================================
// VALIDATION HELPERS
// =====================================================

export const VALIDATORS = {
  required: (value: string) => !value.trim() ? 'Ce champ est requis' : null,
  
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return value && !emailRegex.test(value) ? 'Adresse email invalide' : null;
  },
  
  minLength: (min: number) => (value: string) => 
    value && value.length < min ? `Minimum ${min} caractères` : null,
  
  maxLength: (max: number) => (value: string) => 
    value && value.length > max ? `Maximum ${max} caractères` : null,
  
  pattern: (regex: RegExp, message: string) => (value: string) =>
    value && !regex.test(value) ? message : null,
  
  numeric: (value: string) => {
    const numericRegex = /^\d+$/;
    return value && !numericRegex.test(value) ? 'Seuls les chiffres sont autorisés' : null;
  },
  
  combine: (...VALIDATORS: Array<(value: string) => string | null>) => (value: string) => {
    for (const validator of VALIDATORS) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  }
}; 