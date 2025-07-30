import React from 'react';
import { AuthProvider } from './hooks/useAuth';
import { SecurityProvider } from './components/SecurityProvider/SecurityProvider';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { AsyncErrorBoundary } from './components/ErrorBoundary/AsyncErrorBoundary';
import SecurityHeaders from './components/SecurityHeaders/SecurityHeaders';
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
              {/* Security status indicator (development only) */}
              <SecurityHeaders />
            </AuthProvider>
          </AppProvider>
        </ErrorBoundary>
      </AsyncErrorBoundary>
    </SecurityProvider>
  );
}

export default App;
