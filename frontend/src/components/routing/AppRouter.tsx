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
import SkipLinks from '../accessibility/SkipLinks';
import AccessibilityTestPanel from '../accessibility/AccessibilityTestPanel';
import { useDevAccessibilityTesting } from '../../hooks/useAccessibilityTesting';
import '../../utils/accessibility-dev-tools';


import { SimpleExerciseComponent } from '../exercise/SimpleExerciseComponent';
import ExerciseEngineTest from '../../pages/ExerciseEngineTest';
import XPSystemThemeTest from '../../pages/XPSystemThemeTest';
import WardrobeSystemTest from '../../pages/WardrobeSystemTest';
import ComprehensiveTestSuite from '../../pages/ComprehensiveTestSuite';
import CrossBrowserTestSuite from '../../pages/CrossBrowserTestSuite';
import ErrorHandlingTestSuite from '../../pages/ErrorHandlingTestSuite';

type RouteType = 'dashboard' | 'exercises' | 'profile' | 'progress' | 'admin' | 'exercise' | 'exercise-test' | 'xp-theme-test' | 'wardrobe-test' | 'comprehensive-test' | 'cross-browser-test' | 'error-handling-test';

export const AppRouter: React.FC = () => {
  const { student, loading, logout, isAuthenticated } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<RouteType>('dashboard');
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  
  // Enable accessibility testing in development
  const { currentReport } = useDevAccessibilityTesting({
    autoTest: true,
    autoFix: true,
    onViolations: (violations) => {
      if (violations.length > 0) {
        console.warn(`🚨 ${violations.length} accessibility violations detected`);
      }
    }
  });

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

  const getDifficultyColor = (difficulte: string) => {
    const COLORS = {
      'FACILE': 'bg-green-100 text-green-800',
      'MOYEN': 'bg-yellow-100 text-yellow-800',
      'DIFFICILE': 'bg-red-100 text-red-800'
    };
    return COLORS[difficulte as keyof typeof COLORS] || 'bg-gray-100 text-gray-800';
  };

  const handleStartExercise = (exercise: Exercise) => {
    console.log('Starting exercise:', exercise);
    setCurrentExercise(exercise);
    setCurrentRoute('exercise');
  };

  const renderCurrentRoute = () => {
    switch (currentRoute) {
      case 'dashboard':
        return (
          <main id="main-content" role="main" aria-label="Tableau de bord">
            <LazyComponentLoader>
              <DashboardLazy
              onNavigate={(path: string) => {
                // Simple path mapping - could be enhanced with proper routing
                if (path.includes('exercises')) handleNavigation('exercises');
                else if (path.includes('profile')) handleNavigation('profile');
                else if (path.includes('progress')) handleNavigation('progress');
                else if (path.includes('admin')) handleNavigation('admin');
                else if (path.includes('exercise-test')) handleNavigation('exercise-test');
                else if (path.includes('xp-theme-test')) handleNavigation('xp-theme-test');
                else if (path.includes('wardrobe-test')) handleNavigation('wardrobe-test');
                else if (path.includes('comprehensive-test')) handleNavigation('comprehensive-test');
                else if (path.includes('cross-browser-test')) handleNavigation('cross-browser-test');
                else if (path.includes('error-handling-test')) handleNavigation('error-handling-test');
              }}
              onStartExercise={handleStartExercise as any}
              onLogout={logout}
            />
          </LazyComponentLoader>
        </main>
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

      case 'exercise':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        setCurrentExercise(null);
                        setCurrentRoute('exercises');
                      }}
                      className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-COLORS"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{currentExercise?.titre}</h1>
                      <p className="text-gray-600">{currentExercise?.consigne}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentExercise?.difficulte || 'FACILE')}`}>
                      {currentExercise?.difficulte}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {currentExercise?.xp} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Exercise Content */}
              {currentExercise && (
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                  <SimpleExerciseComponent
                    exercise={currentExercise}
                    onComplete={(result) => {
                      console.log('Exercise completed:', result);
                      // Handle completion - could show results, award XP, etc.
                      alert(`Félicitations! Vous avez gagné ${currentExercise.xp} XP!`);
                      setCurrentExercise(null);
                      setCurrentRoute('exercises');
                    }}
                    onExit={() => {
                      setCurrentExercise(null);
                      setCurrentRoute('exercises');
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'exercise-test':
        return <ExerciseEngineTest />;
        
      case 'xp-theme-test':
        return <XPSystemThemeTest />;
        
      case 'wardrobe-test':
        return <WardrobeSystemTest />;
        
      case 'comprehensive-test':
        return <ComprehensiveTestSuite />;
        
      case 'cross-browser-test':
        return <CrossBrowserTestSuite />;
        
      case 'error-handling-test':
        return <ErrorHandlingTestSuite />;

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

  return (
    <>
      <SkipLinks autoDetect={true} />
      <div id="app-main" role="application" aria-label="Application RevEd Kids">
        {renderCurrentRoute()}
      </div>
      
      {/* Development-only accessibility testing panel */}
      {process.env.NODE_ENV === 'development' && (
        <AccessibilityTestPanel
          isVisible={showAccessibilityPanel}
          onToggle={() => setShowAccessibilityPanel(!showAccessibilityPanel)}
          autoTest={true}
          autoFix={true}
        />
      )}
    </>
  );
};