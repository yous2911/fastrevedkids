import React from 'react';
import { AuthProvider } from './contexts/FastRevKidsAuth';
import { SecurityProvider } from './components/SecurityProvider/SecurityProvider';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { AsyncErrorBoundary } from './components/ErrorBoundary/AsyncErrorBoundary';
import { AppProvider } from './context/AppContext';
import { MainApp } from './MainApp';

function App() {
  // Remove the problematic useEffect that was causing issues
  // The AuthProvider will handle user context properly

  return (
    <SecurityProvider>
      <AsyncErrorBoundary>
        <ErrorBoundary>
          <AppProvider>
            <AuthProvider>
              <MainApp />
            </AuthProvider>
          </AppProvider>
        </ErrorBoundary>
      </AsyncErrorBoundary>
    </SecurityProvider>
  );
}

export default App;
