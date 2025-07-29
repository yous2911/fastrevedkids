import React from 'react';
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
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Dashboard
          </button>
          <button 
            onClick={() => setCurrentView('exercises')}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Exercises
          </button>
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