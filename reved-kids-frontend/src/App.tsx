import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { KioskModeProvider } from './context/KioskModeContext';
import { FocusedLayout } from './components/layout/FocusedLayout';
import { Layout } from './components/layout/Layout';
import { KioskModeActivator } from './components/KioskModeActivator';

// Your existing components
import { Dashboard } from './pages/Dashboard';
import { ExercisesPage } from './pages/Exercises';
import { ProgressPage } from './pages/Progress';
import { Login } from './pages/Login';

function App() {
  return (
    <AppProvider>
      <KioskModeProvider
        autoActivate={false} // Set to true for automatic activation
        exitCode="PARENT123" // Change this to your preferred exit code
        sessionTimeout={45 * 60 * 1000} // 45 minutes session timeout
      >
        <Router>
          <Routes>
            {/* Login Route */}
            <Route path="/login" element={<Login onLoginSuccess={() => {}} />} />
            
            {/* Main App Routes with Kiosk Mode */}
            <Route 
              path="/*" 
              element={
                <FocusedLayout
                  showProgress={true}
                  allowPause={true}
                  sessionDuration={45} // 45 minutes
                  onSessionEnd={() => {
                    // Handle session end - redirect to dashboard or show completion
                    window.location.href = '/dashboard';
                  }}
                >
                  <Routes>
                    <Route 
                      path="/dashboard" 
                      element={
                        <Layout 
                          title="Tableau de bord"
                          currentPath="/dashboard"
                          items={[]}
                          onNavigate={(path) => {
                            // Handle navigation
                            window.location.href = path;
                          }}
                        >
                          <Dashboard 
                            onNavigate={(path) => {
                              window.location.href = path;
                            }}
                            onStartExercise={() => {}}
                            onLogout={() => {}}
                          />
                          
                          {/* Kiosk Mode Activator for Parents/Teachers */}
                          <KioskModeActivator>
                            🔒 Mode Concentration
                          </KioskModeActivator>
                        </Layout>
                      } 
                    />
                    
                    <Route 
                      path="/exercises/*" 
                      element={
                        <Layout 
                          title="Exercices"
                          currentPath="/exercises"
                          items={[]}
                          onNavigate={(path) => {
                            window.location.href = path;
                          }}
                        >
                          <ExercisesPage
                            onBack={() => {
                              window.location.href = '/dashboard';
                            }}
                            onStartExercise={() => {}}
                          />
                        </Layout>
                      } 
                    />
                    
                    <Route 
                      path="/progress" 
                      element={
                        <Layout 
                          title="Ma Progression"
                          currentPath="/progress"
                          items={[]}
                          onNavigate={(path) => {
                            window.location.href = path;
                          }}
                        >
                          <ProgressPage
                            onBack={() => {
                              window.location.href = '/dashboard';
                            }}
                          />
                        </Layout>
                      } 
                    />
                    
                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </FocusedLayout>
              } 
            />
          </Routes>
        </Router>
      </KioskModeProvider>
    </AppProvider>
  );
}

export default App;
