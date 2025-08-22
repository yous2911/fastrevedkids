import React from 'react';
import { Button } from './components/ui/Button';
import { LazyComponentLoader } from './components/ui/LazyComponentLoader';
import { DashboardLazy, ExercisesLazy } from './pages/lazy';

// Test component to verify lazy loading implementation
export const TestLazyLoading: React.FC = () => {
  const [currentView, setCurrentView] = React.useState<'dashboard' | 'exercises'>('dashboard');

  return (
    <div>
      <div className="p-4 bg-gray-100">
        <h1>Lazy Loading Test</h1>
        <div className="space-x-2">
          <Button 
            onClick={() => setCurrentView('dashboard')}
            variant="primary"
            size="md"
          >
            Dashboard
          </Button>
          <Button 
            onClick={() => setCurrentView('exercises')}
            variant="success"
            size="md"
          >
            Exercises
          </Button>
        </div>
      </div>

      {currentView === 'dashboard' && (
        <LazyComponentLoader>
          <DashboardLazy
            onNavigate={() => {}}
            onStartExercise={() => {}}
            onLogout={() => {}}
          />
        </LazyComponentLoader>
      )}

      {currentView === 'exercises' && (
        <LazyComponentLoader>
          <ExercisesLazy
            onBack={() => setCurrentView('dashboard')}
            onStartExercise={() => {}}
          />
        </LazyComponentLoader>
      )}
    </div>
  );
};