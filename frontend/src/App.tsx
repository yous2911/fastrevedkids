import React from 'react';
import { AuthProvider } from './hooks/useAuth';
import { SecurityProvider } from './components/SecurityProvider/SecurityProvider';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { AsyncErrorBoundary } from './components/ErrorBoundary/AsyncErrorBoundary';
import SecurityHeaders from './components/SecurityHeaders/SecurityHeaders';
import { performanceMonitor } from './utils/analytics';
import { MainApp } from './MainApp';

function App() {
  // Set user context for monitoring when user logs in
  React.useEffect(() => {
    // Example: Set user context when user data is available
    const user = getCurrentUser(); // Your user retrieval logic
    if (user && user.id) {
      performanceMonitor.setUserId(user.id);
    }
  }, []);

  return (
    <SecurityProvider>
      <AsyncErrorBoundary>
        <ErrorBoundary>
          <AuthProvider>
            <MainApp />
            {/* Security status indicator (development only) */}
            <SecurityHeaders />
          </AuthProvider>
        </ErrorBoundary>
      </AsyncErrorBoundary>
    </SecurityProvider>
  );
}

// Helper function to get current user (implement based on your auth system)
function getCurrentUser(): { id: string } | null {
  // This should be implemented based on your authentication system
  // For now, returning null as placeholder
  return null;
}

export default App;
