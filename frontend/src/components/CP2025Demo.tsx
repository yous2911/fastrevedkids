import React from 'react';
import { useCP2025Data } from '../hooks/useCP2025Data';
import { CP2025Data } from '../types';

// Sample CP2025 data (your JSON structure)
const sampleCP2025Data: CP2025Data = {
  "modules": [
    {
      "id": 1,
      "titre": "Français CP - Lecture Période 1 & 2",
      "description": "Apprentissage des correspondances graphème-phonème, assemblage de syllabes et compréhension de phrases simples.",
      "niveau": "CP",
      "matiere": "FRANCAIS",
      "periode": "P1-P2",
      "ordre": 1,
      "metadata": {
        "competenceDomain": "CP.FR.L1",
        "cp2025": true
      }
    },
    {
      "id": 2,
      "titre": "Mathématiques CP - Nombres et Calculs Période 1 & 2",
      "description": "Construction des nombres, décomposition, calcul mental et résolution de problèmes simples.",
      "niveau": "CP",
      "matiere": "MATHEMATIQUES",
      "periode": "P1-P2",
      "ordre": 2,
      "metadata": {
        "competenceDomain": "CP.MA.N1",
        "cp2025": true
      }
    }
  ],
  "exercises": [
    {
      "titre": "Reconnaissance du son [o]",
      "consigne": "Écoute le mot. Entends-tu le son [o] ?",
      "type": "QCM",
      "difficulte": "decouverte",
      "moduleId": 1,
      "configuration": {
        "question": "Entends-tu le son [o] dans 'MOTO' ?",
        "choix": ["Oui", "Non"],
        "bonneReponse": "Oui",
        "audioRequired": true
      },
      "metadata": { "competenceCode": "CP.FR.L1.1" }
    },
    {
      "titre": "Dénombrer jusqu'à 10",
      "consigne": "Compte les jetons et choisis le bon nombre.",
      "type": "QCM",
      "difficulte": "decouverte",
      "moduleId": 2,
      "configuration": {
        "question": "Combien y a-t-il de jetons ?",
        "image_url": "/images/exercises/jetons_9.png",
        "choix": ["7", "8", "9", "10"],
        "bonneReponse": "9"
      },
      "metadata": { "competenceCode": "CP.MA.N1.1" }
    },
    {
      "titre": "Construction de la syllabe 'RI'",
      "consigne": "Assemble les lettres pour former la syllabe 'RI'.",
      "type": "DRAG_DROP",
      "difficulte": "decouverte",
      "moduleId": 1,
      "configuration": {
        "question": "Forme la syllabe 'RI'",
        "dragItems": [{"id": "r", "content": "R"}, {"id": "i", "content": "I"}, {"id": "a", "content": "A"}],
        "zones": [{"id": "syllabe", "label": "Syllabe", "limit": 2}],
        "solution": ["R", "I"]
      },
      "metadata": { "competenceCode": "CP.FR.L2.1" }
    }
  ]
};

export const CP2025Demo = (): React.ReactElement => {
  const cp2025Data = useCP2025Data({ initialData: sampleCP2025Data });

  if (cp2025Data.isLoading) {
    return <div>Chargement des données CP2025...</div>;
  }

  if (cp2025Data.error) {
    return <div>Erreur: {cp2025Data.error}</div>;
  }

  const { modules, exercises, statistics } = cp2025Data;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">
        Démonstration CP2025
      </h1>

      {/* Statistics */}
      {statistics && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{statistics.totalModules}</div>
              <div className="text-sm text-gray-600">Modules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statistics.totalExercises}</div>
              <div className="text-sm text-gray-600">Exercices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {statistics.exercisesByDifficulty.decouverte}
              </div>
              <div className="text-sm text-gray-600">Découverte</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.exercisesByType.QCM}
              </div>
              <div className="text-sm text-gray-600">QCM</div>
            </div>
          </div>
        </div>
      )}

      {/* Modules */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Modules CP2025</h2>
        <div className="grid gap-4">
          {modules.map((module) => (
            <div key={module.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900">{module.titre}</h3>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {module.niveau} - {module.matiere}
                </span>
              </div>
              <p className="text-gray-600 mb-2">{module.description}</p>
              <div className="flex gap-2 text-sm text-gray-500">
                <span>Période: {module.periode}</span>
                <span>•</span>
                <span>Ordre: {module.ordre}</span>
                <span>•</span>
                <span>Exercices: {cp2025Data.getExercisesByModuleId(module.id).length}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exercises by Module */}
      {modules.map((module) => {
        const moduleExercises = cp2025Data.getExercisesByModuleId(module.id);
        const progression = cp2025Data.getModuleExerciseProgression(module.id);

        return (
          <div key={module.id} className="mb-8">
            <h3 className="text-xl font-semibold mb-4">
              Exercices - {module.titre}
            </h3>
            
            {/* Progression by difficulty */}
            <div className="grid gap-4">
              {Object.entries(progression).map(([difficulte, exercises]) => (
                exercises.length > 0 && (
                  <div key={difficulte} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 capitalize">
                      {difficulte} ({exercises.length} exercices)
                    </h4>
                    <div className="grid gap-3">
                      {exercises.map((exercise, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-900">{exercise.titre}</h5>
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              {exercise.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{exercise.consigne}</p>
                          <div className="text-xs text-gray-500">
                            Compétence: {exercise.metadata.competenceCode}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        );
      })}

      {/* Exercise Types Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Types d'Exercices</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statistics && Object.entries(statistics.exercisesByType).map(([type, count]) => (
            count > 0 && (
              <div key={type} className="bg-white p-4 rounded-lg shadow border text-center">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-sm text-gray-600">{type}</div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Service Methods Demo */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Méthodes du Service</h2>
        <div className="grid gap-4 text-sm">
          <div>
            <strong>Exercices QCM:</strong> {cp2025Data.getExercisesByType('QCM').length}
          </div>
          <div>
            <strong>Exercices de découverte:</strong> {cp2025Data.getExercisesByDifficulty('decouverte').length}
          </div>
          <div>
            <strong>Exercices pour le module 1:</strong> {cp2025Data.getExercisesByModuleId(1).length}
          </div>
        </div>
      </div>
    </div>
  );
}; 