import React from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/auth/LoginScreen';
import { Dashboard } from './pages/Dashboard';

export function MainApp() {
  const { student, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 to-pink-400">
        <div className="text-white text-2xl font-bold animate-pulse">
          🎓 Chargement...
        </div>
      </div>
    );
  }

  return student ? (
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
    <LoginScreen />
  );
} 