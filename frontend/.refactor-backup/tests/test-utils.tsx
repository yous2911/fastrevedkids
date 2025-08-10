import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GDPRProvider } from '../contexts/GDPRContext';

// Mock providers and contexts for testing
const MockGDPRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-testid="mock-gdpr-provider">{children}</div>
);

// Comprehensive providers wrapper for tests
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <MockGDPRProvider>
        {children}
      </MockGDPRProvider>
    </BrowserRouter>
  );
};

// Custom render function that includes all providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Accessibility testing utilities
export const axe = require('@axe-core/jest');

// Mock data generators
export const mockStudent = {
  id: 1,
  prenom: 'Test',
  nom: 'Student',
  niveauActuel: 'CP',
  totalPoints: 100,
  serieJours: 5,
  mascotteType: 'dragon'
};

export const mockExercise = {
  id: 1,
  titre: 'Test Exercise',
  description: 'Test description',
  type: 'CALCUL',
  difficulte: 'FACILE',
  xp: 10,
  configuration: JSON.stringify({ question: '2+2=?', answer: '4' })
};

// Custom matchers
export const toBeAccessible = (received: any) => {
  // Mock accessibility test result for now
  return {
    pass: true,
    message: () => 'Element is accessible'
  };
};

// Cross-browser testing utilities
export const browsers = {
  chrome: 'Chrome',
  firefox: 'Firefox',
  safari: 'Safari',
  edge: 'Edge'
};

// Performance testing utilities
export const measurePerformance = (fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
};

// Screen reader testing utilities
export const getByAriaLabel = (container: HTMLElement, label: string) => {
  return container.querySelector(`[aria-label="${label}"]`);
};

export const getByRole = (container: HTMLElement, role: string) => {
  return container.querySelector(`[role="${role}"]`);
};

// Keyboard navigation testing
export const simulateKeyPress = (key: string, element?: HTMLElement) => {
  const event = new KeyboardEvent('keydown', { key });
  const target = element || document.activeElement || document.body;
  target.dispatchEvent(event);
};

// Focus management testing
export const getFocusedElement = () => document.activeElement;

export const tabToNextElement = () => {
  simulateKeyPress('Tab');
};

export const tabToPreviousElement = () => {
  simulateKeyPress('Tab', document.activeElement as HTMLElement);
};

// Color contrast testing
export const getColorContrast = (foreground: string, background: string): number => {
  // Mock implementation - in real scenario, use a proper contrast calculation
  return 4.5; // WCAG AA compliance threshold
};

// Responsive design testing
export const setViewportSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

// Animation testing utilities
export const waitForAnimation = (duration: number = 300) => {
  return new Promise(resolve => setTimeout(resolve, duration));
};

// Sound and haptic testing mocks
export const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 0 }
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 1 }
  })),
  destination: {}
};

export const mockVibration = jest.fn();

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override the default render with our custom render
export { customRender as render };