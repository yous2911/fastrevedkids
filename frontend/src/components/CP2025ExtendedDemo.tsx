import React from 'react';
import { useCP2025Data } from '../hooks/useCP2025Data';
import { CP2025Data } from '../types';

// Extended CP2025 data with your new structure
const extendedCP2025Data: CP2025Data = {
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
    },
    {
      "id": 3,
      "titre": "Français CP - Graphèmes et Sons Complexes",
      "description": "Maîtrise des sons complexes (ch, on, an...), accord singulier/pluriel et construction de phrases.",
      "niveau": "CP",
      "matiere": "FRANCAIS",
      "periode": "P2-P3",
      "ordre": 3,
      "metadata": { 
        "competenceDomain": "CP.FR.L1", 
        "cp2025": true 
      }
    },
    {
      "id": 4,
      "titre": "Mathématiques CP - Nombres > 60 et Mesures",
      "description": "Apprentissage des nombres jusqu'à 100, des doubles/moitiés, et initiation aux grandeurs (longueur, temps, monnaie).",
      "niveau": "CP",
      "matiere": "MATHEMATIQUES",
      "periode": "P3-P4",
      "ordre": 4,
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
      "titre": "Reconnaissance du son [ɔ̃] (on)",
      "consigne": "Clique sur l'image si tu entends le son [ɔ̃] comme dans 'pont'.",
      "type": "QCM",
      "difficulte": "decouverte",
      "moduleId": 3,
      "configuration": {
        "question": "Où entends-tu le son [ɔ̃] ?",
        "choix": [
          {"id": "c1", "image": { "url_placeholder": "/images/words/mouton.png", "description": "Un mouton blanc dans un pré vert."}},
          {"id": "c2", "image": { "url_placeholder": "/images/words/sirene.png", "description": "Une sirène assise sur un rocher."}}
        ],
        "bonneReponse": "c1"
      },
      "metadata": { "competenceCode": "CP.FR.L1.3" }
    },
    {
      "titre": "Lire les grands nombres",
      "consigne": "Lis le nombre et choisis la bonne réponse.",
      "type": "QCM",
      "difficulte": "decouverte",
      "moduleId": 4,
      "configuration": { 
        "question": "75", 
        "choix": ["Soixante-cinq", "Soixante-quinze", "Septante-cinq"], 
        "bonneReponse": "Soixante-quinze" 
      },
      "metadata": { "competenceCode": "CP.MA.N1.4" }
    },
    {
      "titre": "Singulier ou Pluriel",
      "consigne": "Choisis le bon article : 'le' ou 'les'.",
      "type": "QCM",
      "difficulte": "decouverte",
      "moduleId": 3,
      "configuration": {
        "question": "Complète la phrase.",
        "image": { "url_placeholder": "/images/people/garcons.png", "description": "Deux garçons qui jouent au ballon." },
        "choix": ["le", "les"], 
        "bonneReponse": "les", 
        "phrase_template": "___ garçons jouent."
      },
      "metadata": { "competenceCode": "CP.FR.G1.3" }
    },
    {
      "titre": "Calculer un double",
      "consigne": "Calcule le double.",
      "type": "CALCUL",
      "difficulte": "decouverte",
      "moduleId": 4,
      "configuration": { 
        "question": "Quel est le double de 4 ?", 
        "operation": "4 + 4", 
        "resultat": 8 
      },
      "metadata": { "competenceCode": "CP.MA.N3.4" }
    },
    {
      "titre": "Assembler une syllabe complexe",
      "consigne": "Assemble les lettres pour former la syllabe 'CHON'.",
      "type": "DRAG_DROP",
      "difficulte": "entrainement",
      "moduleId": 3,
      "configuration": {
        "question": "Forme la syllabe 'CHON'",
        "dragItems": [{"id": "d1", "content": "CH"}, {"id": "d2", "content": "ON"}, {"id": "d3", "content": "AN"}],
        "zones": [{"id": "z1", "label": "Syllabe", "limit": 2}],
        "solution": ["CH", "ON"]
      },
      "metadata": { "competenceCode": "CP.FR.L1.3" }
    },
    {
      "titre": "Écrire les grands nombres",
      "consigne": "Écris 'quatre-vingt-deux' en chiffres.",
      "type": "TEXTE_LIBRE",
      "difficulte": "entrainement",
      "moduleId": 4,
      "configuration": { 
        "question": "quatre-vingt-deux", 
        "inputType": "keyboard", 
        "bonneReponse": "82" 
      },
      "metadata": { "competenceCode": "CP.MA.N1.4" }
    },
    {
      "titre": "Comprendre un texte court",
      "consigne": "Lis le texte et réponds à la question.",
      "type": "QCM",
      "difficulte": "maitrise",
      "moduleId": 3,
      "configuration": {
        "question": "Texte : 'Le lion est dans la savane. Il voit une gazelle. Il a très faim.' Que voit le lion ?",
        "choix": ["Un zèbre", "Un serpent", "Une gazelle"],
        "bonneReponse": "Une gazelle"
      },
      "metadata": { "competenceCode": "CP.FR.C2.1" }
    },
    {
      "titre": "Problème de recherche de l'écart",
      "consigne": "Lis le problème et calcule l'écart.",
      "type": "CALCUL",
      "difficulte": "maitrise",
      "moduleId": 4,
      "configuration": { 
        "question": "J'ai 12 billes et tu en as 8. Combien de billes ai-je de plus que toi ?", 
        "resultat": 4,
        "operation": "soustraction"
      },
      "metadata": { "competenceCode": "CP.MA.N4.2" }
    }
  ]
};

export const CP2025ExtendedDemo: React.FC = () => {
  const cp2025Data = useCP2025Data({ initialData: extendedCP2025Data });

  if (cp2025Data.isLoading) {
    return <div>Chargement des données CP2025...</div>;
  }

  if (cp2025Data.error) {
    return <div>Erreur: {cp2025Data.error}</div>;
  }

  const { modules, exercises, statistics } = cp2025Data;

  // Helper function to render image information
  const renderImageInfo = (image: any) => {
    if (!image) return null;
    return (
      <div className="text-xs text-gray-500 mt-1">
        <div>🖼️ {image.url_placeholder}</div>
        <div>📝 {image.description}</div>
      </div>
    );
  };

  // Helper function to render choice content
  const renderChoice = (choice: any) => {
    if (typeof choice === 'string') {
      return <span>{choice}</span>;
    }
    return (
      <div>
        <span>{choice.text || choice.id}</span>
        {choice.image && renderImageInfo(choice.image)}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">
        Démonstration CP2025 Étendue
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

      {/* Modules Overview */}
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

      {/* Exercises by Module with Enhanced Display */}
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
                          
                          {/* Enhanced configuration display */}
                          <div className="text-xs text-gray-500 space-y-1">
                            <div><strong>Question:</strong> {exercise.configuration.question}</div>
                            
                            {/* Display choices for QCM */}
                            {exercise.type === 'QCM' && 'choix' in exercise.configuration && (
                              <div>
                                <strong>Choix:</strong>
                                <div className="ml-2 mt-1">
                                  {exercise.configuration.choix.map((choice, i) => (
                                    <div key={i} className="mb-1">
                                      {renderChoice(choice)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Display image if present */}
                            {'image' in exercise.configuration && exercise.configuration.image && (
                              <div>
                                <strong>Image:</strong>
                                {renderImageInfo(exercise.configuration.image)}
                              </div>
                            )}
                            
                            {/* Display phrase template if present */}
                            {'phrase_template' in exercise.configuration && exercise.configuration.phrase_template && (
                              <div><strong>Template:</strong> {exercise.configuration.phrase_template}</div>
                            )}
                            
                            {/* Display correct answer based on exercise type */}
                            {exercise.type === 'QCM' && 'bonneReponse' in exercise.configuration && (
                              <div><strong>Réponse:</strong> {exercise.configuration.bonneReponse}</div>
                            )}
                            {exercise.type === 'CALCUL' && 'resultat' in exercise.configuration && (
                              <div><strong>Résultat:</strong> {exercise.configuration.resultat}</div>
                            )}
                            {exercise.type === 'DRAG_DROP' && 'solution' in exercise.configuration && (
                              <div><strong>Solution:</strong> {Array.isArray(exercise.configuration.solution) ? exercise.configuration.solution.join(', ') : String(exercise.configuration.solution)}</div>
                            )}
                            
                            <div><strong>Compétence:</strong> {exercise.metadata?.competenceCode || 'N/A'}</div>
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
            <strong>Exercices pour le module 3:</strong> {cp2025Data.getExercisesByModuleId(3).length}
          </div>
          <div>
            <strong>Exercices avec images:</strong> {
              exercises.filter(ex => 
                ex.type === 'QCM' && 
                'choix' in ex.configuration && 
                ex.configuration.choix.some((choice: any) => choice.image)
              ).length
            }
          </div>
        </div>
      </div>
    </div>
  );
}; 
