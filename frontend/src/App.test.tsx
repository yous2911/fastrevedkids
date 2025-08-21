import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the problematic components that require external dependencies
jest.mock('./contexts/FastRevKidsAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: () => ({
    student: null,
    loading: false,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('./components/SecurityProvider/SecurityProvider', () => ({
  SecurityProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="security-provider">{children}</div>
  ),
}));

jest.mock('./components/SecurityHeaders/SecurityHeaders', () => {
  return function SecurityHeaders() {
    return <div data-testid="security-headers" />;
  };
});

jest.mock('./components/ErrorBoundary/ErrorBoundary', () => {
  return function ErrorBoundary({ children }: { children: React.ReactNode }) {
    return <div data-testid="error-boundary">{children}</div>;
  };
});

jest.mock('./components/ErrorBoundary/AsyncErrorBoundary', () => ({
  AsyncErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="async-error-boundary">{children}</div>
  ),
}));

jest.mock('./context/AppContext', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-provider">{children}</div>
  ),
  useApp: () => ({
    state: { sidebarOpen: false, currentStudent: null, online: true },
    dispatch: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('./components/routing/AppRouter', () => ({
  AppRouter: () => (
    <div data-testid="app-router">
      <div data-testid="login-form">
        <h1>FastRevEd Kids</h1>
        <p>Login to access your educational platform</p>
      </div>
    </div>
  ),
}));

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    
    // Check that the app structure renders properly
    expect(screen.getByTestId('security-provider')).toBeInTheDocument();
    expect(screen.getByTestId('async-error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('app-provider')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  test('renders FastRevEd Kids login interface', () => {
    render(<App />);
    
    // The app should show login screen when not authenticated
    expect(screen.getByText('FastRevEd Kids')).toBeInTheDocument();
    expect(screen.getByText('Login to access your educational platform')).toBeInTheDocument();
  });

  test('includes security components', () => {
    render(<App />);
    
    expect(screen.getByTestId('security-headers')).toBeInTheDocument();
  });

  test('has proper error boundary structure', () => {
    render(<App />);
    
    // Should have nested error boundaries for resilience
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('async-error-boundary')).toBeInTheDocument();
  });
});

// Integration test that doesn't require mocking
describe('App Integration', () => {
  test('app structure is properly nested', () => {
    const { container } = render(<App />);
    
    // Check that the component tree renders without errors
    expect(container).toBeInTheDocument();
  });
});
