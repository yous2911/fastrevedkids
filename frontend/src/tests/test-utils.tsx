import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';


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
export const MOCK_STUDENT = {
  id: 1,
  prenom: 'Test',
  nom: 'Student',
  niveauActuel: 'CP',
  totalPoints: 100,
  serieJours: 5,
  mascotteType: 'dragon'
};

export const MOCK_EXERCISE = {
  id: 1,
  titre: 'Test Exercise',
  description: 'Test description',
  type: 'CALCUL',
  difficulte: 'FACILE',
  xp: 10,
  configuration: JSON.stringify({ question: '2+2=?', answer: '4' })
};

// Custom matchers
// (Add custom matchers here if needed)

// Cross-browser testing utilities
export const BROWSERS = {
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
export const simulateScreenReader = (text: string) => {
  // Mock screen reader announcement
  console.log(`Screen reader: ${text}`);
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
// Add animation testing utilities here if needed

// Sound and haptic testing mocks
export const MOCK_AUDIO_CONTEXT = {
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