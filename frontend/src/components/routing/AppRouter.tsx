import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Login } from '../../pages/Login';
import { LazyComponentLoader } from '../ui/LazyComponentLoader';
import {
  DashboardLazy,
  ExercisesLazy,
  ProfileLazy,
  ProgressLazy,
  AdminPanelLazy
} from '../../pages/lazy';
import { preloadRouteComponents } from '../../utils/lazyLoading';
import { Exercise } from '../../types/api.types';

type RouteType = 'dashboard' | 'exercises' | 'profile' | 'progress' | 'admin';

export const AppRouter: React.FC = () => {
  const { student, loading, logout, isAuthenticated } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<RouteType>('dashboard');

  // Preload components after initial load
  useEffect(() => {
    if (student || isAuthenticated) {
      preloadRouteComponents();
    }
  }, [student, isAuthenticated]);

  console.log('AppRouter render:', { student, loading, isAuthenticated, currentRoute });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 to-pink-400">
        <div className="text-white text-2xl font-bold animate-pulse">
          🎓 Chargement...
        </div>
      </div>
    );
  }

  const handleNavigation = (route: RouteType) => {
    setCurrentRoute(route);
  };

  // Adapter function to safely convert between Exercise types
  const adaptExerciseForComponents = (exercise: Exercise) => {
    return {
      ...exercise,
      // Ensure all required properties exist with safe defaults
      createdAt: exercise.createdAt || new Date().toISOString(),
      updatedAt: exercise.updatedAt || new Date().toISOString(),
      configuration: {
        ...exercise.configuration,
        difficulte: exercise.difficulte // Use the exercise's difficulte
      }
    };
  };

  const handleStartExercise = (exercise: Exercise) => {
    console.log('Starting exercise:', exercise);
    // TODO: Implement exercise start logic
  };

  const renderCurrentRoute = () => {
    switch (currentRoute) {
      case 'dashboard':
        return (
          <LazyComponentLoader>
            <DashboardLazy
              onNavigate={(path: string) => {
                // Simple path mapping - could be enhanced with proper routing
                if (path.includes('exercises')) handleNavigation('exercises');
                else if (path.includes('profile')) handleNavigation('profile');
                else if (path.includes('progress')) handleNavigation('progress');
                else if (path.includes('admin')) handleNavigation('admin');
              }}
              onStartExercise={handleStartExercise as any}
              onLogout={logout}
            />
          </LazyComponentLoader>
        );

      case 'exercises':
        return (
          <LazyComponentLoader>
            <ExercisesLazy
              onBack={() => handleNavigation('dashboard')}
              onStartExercise={handleStartExercise as any}
            />
          </LazyComponentLoader>
        );

      case 'profile':
        return (
          <LazyComponentLoader>
            <ProfileLazy onBack={() => handleNavigation('dashboard')} />
          </LazyComponentLoader>
        );

      case 'progress':
        return (
          <LazyComponentLoader>
            <ProgressLazy onBack={() => handleNavigation('dashboard')} />
          </LazyComponentLoader>
        );

      case 'admin':
        return (
          <LazyComponentLoader>
            <AdminPanelLazy onBack={() => handleNavigation('dashboard')} />
          </LazyComponentLoader>
        );

      default:
        return (
          <LazyComponentLoader>
            <DashboardLazy
              onNavigate={handleNavigation as any}
              onStartExercise={handleStartExercise as any}
              onLogout={logout}
            />
          </LazyComponentLoader>
        );
    }
  };

  // Show login if not authenticated
  if (!student && !isAuthenticated) {
    return (
      <Login onLoginSuccess={() => {
        console.log('Login success callback triggered');
        setCurrentRoute('dashboard');
      }} />
    );
  }

  return renderCurrentRoute();
};