import React from 'react';

// Mock for framer-motion
export const MOCK_FRAMER_MOTION = {
  motion: {
    div: React.forwardRef(({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }, ref) => 
      React.createElement('div', { ...props, ref }, children)),
    input: React.forwardRef(({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }, ref) => 
      React.createElement('input', { ...props, ref }, children)),
    textarea: React.forwardRef(({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }, ref) => 
      React.createElement('textarea', { ...props, ref }, children)),
    button: React.forwardRef(({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }, ref) => 
      React.createElement('button', { ...props, ref }, children)),
    label: React.forwardRef(({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }, ref) => 
      React.createElement('label', { ...props, ref }, children)),
  },
  AnimatePresence: ({ children }) => children,
};

// Mock for useSound hook
export const mockUseSound = jest.fn(() => [jest.fn(), { stop: jest.fn(), pause: jest.fn() }]);

// Mock for useHaptic hook
export const mockUseHaptic = jest.fn(() => ({
  vibrate: jest.fn(),
  impact: jest.fn(),
  success: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
}));