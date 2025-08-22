import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  variant?: 'default' | 'magical' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  animated?: boolean;
  className?: string;
}

const VARIANT_CLASSES = {
  default: 'border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  magical: 'border-2 border-purple-300 bg-gradient-to-r from-blue-50 to-purple-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-magical',
  outlined: 'border-2 border-gray-300 bg-transparent focus:ring-0 focus:border-blue-500'
};

const SIZE_CLASSES = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg'
};

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  variant = 'default',
  size = 'md',
  disabled = false,
  error,
  label,
  helperText,
  animated = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SelectOption | undefined>(
    options.find(opt => opt.value === value)
  );
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedOption(options.find(opt => opt.value === value));
  }, [value, options]);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    
    setSelectedOption(option);
    onChange?.(option.value);
    setIsOpen(false);
  };

  const BASE_CLASSES = 'relative w-full cursor-pointer transition-all duration-200';
  const inputClasses = [
    'w-full rounded-lg focus:outline-none transition-all duration-200',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div ref={selectRef} className={BASE_CLASSES}>
        <div
          className={inputClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedOption?.icon && (
                <span className="flex-shrink-0">
                  {selectedOption.icon}
                </span>
              )}
              <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
                {selectedOption?.label || placeholder}
              </span>
            </div>
            <motion.svg
              className="w-5 h-5 text-gray-400 flex-shrink-0"
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {options.map((option, index) => (
                <motion.div
                  key={option.value}
                  className={`
                    px-4 py-3 cursor-pointer transition-colors duration-150
                    ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                    ${selectedOption?.value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                  `}
                  onClick={() => handleSelect(option)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={!option.disabled ? { backgroundColor: '#f9fafb' } : undefined}
                >
                  <div className="flex items-center gap-2">
                    {option.icon && (
                      <span className="flex-shrink-0">
                        {option.icon}
                      </span>
                    )}
                    <span>{option.label}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};
