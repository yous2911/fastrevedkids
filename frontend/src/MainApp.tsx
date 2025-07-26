import React from 'react';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

export function MainApp() {
  const { student, loading, logout, isAuthenticated } = useAuth();

  console.log('MainApp render:', { student, loading, isAuthenticated });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 to-pink-400">
        <div className="text-white text-2xl font-bold animate-pulse">
          🎓 Chargement...
        </div>
      </div>
    );
  }

  return (student || isAuthenticated) ? (
    <Dashboard 
      onNavigate={(path) => {
        // Handle navigation - could be enhanced with React Router
        // TODO: Implement navigation logic
      }}
      onStartExercise={(exercise) => {
        // Handle starting an exercise
        // TODO: Implement exercise start logic
      }}
      onLogout={logout}
    />
  ) : (
    <Login onLoginSuccess={() => {
      // Force a re-render when login succeeds
      // The useAuth hook should handle the state update automatically
      // This callback is called after successful login to trigger UI update
      console.log('Login success callback triggered');
    }} />
  );
} 