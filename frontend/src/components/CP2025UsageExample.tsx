import React from 'react';
import { useCP2025Data } from '../hooks/useCP2025Data';
import { getCompleteCP2025Service } from '../utils/cp2025DataLoader';

export const cP2025UsageExample: React.FC = () => {
  // Method 1: Using the hook with complete data
  const completeData = getCompleteCP2025Service();
  const cp2025Data = useCP2025Data({ 
    initialData: JSON.parse(completeData.exportData()) 
  });

  // Method 2: Using the service directly
  const service = getCompleteCP2025Service();

  if (cp2025Data.isLoading) {
    return <div>Chargement...</div>;
  }

  if (cp2025Data.error) {
    return <div>Erreur: {cp2025Data.error}</div>;
  }

  const { modules, exercises, statistics } = cp2025Data;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Exemple d'Utilisation CP2025</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-3 rounded text-center">
          <div className="text-xl font-bold">{modules.length}</div>
          <div className="text-sm">Modules</div>
        </div>
        <div className="bg-green-100 p-3 rounded text-center">
          <div className="text-xl font-bold">{exercises.length}</div>
          <div className="text-sm">Exercices</div>
        </div>
        <div className="bg-purple-100 p-3 rounded text-center">
          <div className="text-xl font-bold">
            {exercises.filter(ex => ex.type === 'QCM').length}
          </div>
          <div className="text-sm">QCM</div>
        </div>
      </div>

      {/* Module List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Modules Disponibles</h2>
        <div className="space-y-2">
          {modules.map(module => (
            <div key={module.id} className="bg-gray-50 p-3 rounded">
              <div className="font-medium">{module.titre}</div>
              <div className="text-sm text-gray-600">
                {module.niveau} - {module.matiere} - {module.periode}
              </div>
              <div className="text-xs text-gray-500">
                {cp2025Data.getExercisesByModuleId(module.id).length} exercices
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise Examples by Type */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Exemples d'Exercices par Type</h2>
        
        {/* QCM Examples */}
        <div className="mb-4">
          <h3 className="font-medium text-blue-600 mb-2">QCM</h3>
          {cp2025Data.getExercisesByType('QCM').slice(0, 2).map((exercise, index) => (
            <div key={index} className="bg-blue-50 p-2 rounded mb-2">
              <div className="font-medium">{exercise.titre}</div>
              <div className="text-sm">{exercise.consigne}</div>
            </div>
          ))}
        </div>

        {/* CALCUL Examples */}
        <div className="mb-4">
          <h3 className="font-medium text-green-600 mb-2">CALCUL</h3>
          {cp2025Data.getExercisesByType('CALCUL').slice(0, 2).map((exercise, index) => (
            <div key={index} className="bg-green-50 p-2 rounded mb-2">
              <div className="font-medium">{exercise.titre}</div>
              <div className="text-sm">{exercise.consigne}</div>
            </div>
          ))}
        </div>

        {/* DRAG_DROP Examples */}
        <div className="mb-4">
          <h3 className="font-medium text-purple-600 mb-2">DRAG_DROP</h3>
          {cp2025Data.getExercisesByType('DRAG_DROP').slice(0, 2).map((exercise, index) => (
            <div key={index} className="bg-purple-50 p-2 rounded mb-2">
              <div className="font-medium">{exercise.titre}</div>
              <div className="text-sm">{exercise.consigne}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Methods Demo */}
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-3">Méthodes du Service</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Exercices Module 3:</strong> {service.getExercisesByModuleId(3).length}
          </div>
          <div>
            <strong>Exercices Découverte:</strong> {service.getExercisesByDifficulty('decouverte').length}
          </div>
          <div>
            <strong>Exercices Consolidation:</strong> {service.getExercisesByDifficulty('consolidation').length}
          </div>
          <div>
            <strong>Compétence CP.FR.L1.3:</strong> {service.getExercisesByCompetenceCode('CP.FR.L1.3').length}
          </div>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="mt-6 bg-white p-4 rounded border">
          <h2 className="text-lg font-semibold mb-3">Statistiques Complètes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Total Modules:</strong> {statistics.totalModules}
            </div>
            <div>
              <strong>Total Exercices:</strong> {statistics.totalExercises}
            </div>
            <div>
              <strong>Découverte:</strong> {statistics.exercisesByDifficulty.decouverte}
            </div>
            <div>
              <strong>Entraînement:</strong> {statistics.exercisesByDifficulty.entrainement}
            </div>
            <div>
              <strong>Consolidation:</strong> {statistics.exercisesByDifficulty.consolidation}
            </div>
            <div>
              <strong>QCM:</strong> {statistics.exercisesByType.QCM}
            </div>
            <div>
              <strong>CALCUL:</strong> {statistics.exercisesByType.CALCUL}
            </div>
            <div>
              <strong>DRAG_DROP:</strong> {statistics.exercisesByType.DRAG_DROP}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
