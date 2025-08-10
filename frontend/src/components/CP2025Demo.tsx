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
    // ===== DÉCOUVERTE - PHONOLOGIE =====
    {
      "titre": "Le Mystère du Son [o]",
      "consigne": "Aide Léo le lion à trouver les mots qui contiennent le son [o]. Écoute attentivement !",
      "type": "QCM",
      "difficulte": "decouverte",
      "moduleId": 1,
      "configuration": {
        "question": "Dans quel mot entends-tu le son [o] ?",
        "choix": [
          {"id": "moto", "text": "MOTO", "image": "/images/words/moto.png", "audio": "/audio/words/moto.mp3"},
          {"id": "chat", "text": "CHAT", "image": "/images/words/chat.png", "audio": "/audio/words/chat.mp3"},
          {"id": "soleil", "text": "SOLEIL", "image": "/images/words/soleil.png", "audio": "/audio/words/soleil.mp3"},
          {"id": "maison", "text": "MAISON", "image": "/images/words/maison.png", "audio": "/audio/words/maison.mp3"}
        ],
        "bonneReponse": "moto",
        "audioRequired": true,
        "feedback": {
          "correct": "Bravo ! Tu as bien entendu le son [o] dans MOTO ! 🎉",
          "incorrect": "Écoute encore... Le son [o] fait 'oooo' comme dans MOTO ! 🦁"
        }
      },
      "metadata": { 
        "competenceCode": "CP.FR.L1.1",
        "cognitiveLoad": "low",
        "engagement": "high"
      }
    },

    // ===== DÉCOUVERTE - NUMÉRATION =====
    {
      "titre": "Le Trésor de Pirate Pierre",
      "consigne": "Pirate Pierre a trouvé un trésor ! Compte les pièces d'or avec lui.",
      "type": "QCM",
      "difficulte": "decouverte",
      "moduleId": 2,
      "configuration": {
        "question": "Combien de pièces d'or Pirate Pierre a-t-il trouvées ?",
        "image_url": "/images/exercises/treasure_coins_9.png",
        "choix": [
          {"id": "7", "text": "7 pièces", "image": "/images/numbers/7.png"},
          {"id": "8", "text": "8 pièces", "image": "/images/numbers/8.png"},
          {"id": "9", "text": "9 pièces", "image": "/images/numbers/9.png"},
          {"id": "10", "text": "10 pièces", "image": "/images/numbers/10.png"}
        ],
        "bonneReponse": "9",
        "feedback": {
          "correct": "Excellent ! Pirate Pierre a 9 pièces d'or ! 💰",
          "incorrect": "Compte encore une fois, doucement... 1, 2, 3, 4, 5, 6, 7, 8, 9 ! 🏴‍☠️"
        }
      },
      "metadata": { 
        "competenceCode": "CP.MA.N1.1",
        "cognitiveLoad": "low",
        "engagement": "high",
        "storyContext": "Pirate Pierre discovers a treasure and needs help counting"
      }
    },

    // ===== DÉCOUVERTE - SYLLABES =====
    {
      "titre": "L'Atelier de Syllabes",
      "consigne": "Aide la fée des syllabes à assembler les lettres pour former 'RI'.",
      "type": "DRAG_DROP",
      "difficulte": "decouverte",
      "moduleId": 1,
      "configuration": {
        "question": "Forme la syllabe 'RI' avec les lettres",
        "dragItems": [
          {"id": "r", "content": "R", "color": "blue", "sound": "/audio/letters/r.mp3"},
          {"id": "i", "content": "I", "color": "red", "sound": "/audio/letters/i.mp3"},
          {"id": "a", "content": "A", "color": "green", "sound": "/audio/letters/a.mp3", "distractor": true}
        ],
        "zones": [{"id": "syllabe", "label": "Syllabe", "limit": 2, "visual": "magical_frame"}],
        "solution": ["R", "I"],
        "feedback": {
          "correct": "Parfait ! Tu as formé 'RI' ! La fée est ravie ! ✨",
          "incorrect": "Essaie encore... R + I = RI ! 🧚‍♀️"
        }
      },
      "metadata": { 
        "competenceCode": "CP.FR.L2.1",
        "cognitiveLoad": "medium",
        "engagement": "high",
        "storyContext": "A fairy helps children assemble syllables"
      }
    },

    // ===== ENTRAÎNEMENT - PHONOLOGIE =====
    {
      "titre": "Le Défi des Sons",
      "consigne": "Écoute les mots et trouve celui qui contient le son [o].",
      "type": "QCM",
      "difficulte": "entrainement",
      "moduleId": 1,
      "configuration": {
        "question": "Quel mot contient le son [o] ?",
        "choix": [
          {"id": "robot", "text": "ROBOT", "audio": "/audio/words/robot.mp3"},
          {"id": "table", "text": "TABLE", "audio": "/audio/words/table.mp3"},
          {"id": "porte", "text": "PORTE", "audio": "/audio/words/porte.mp3"},
          {"id": "livre", "text": "LIVRE", "audio": "/audio/words/livre.mp3"}
        ],
        "bonneReponse": "robot",
        "audioRequired": true,
        "timeLimit": 15,
        "feedback": {
          "correct": "Excellent ! ROBOT contient bien le son [o] ! 🤖",
          "incorrect": "Écoute encore... Le son [o] est dans ROBOT ! 🎯"
        }
      },
      "metadata": { 
        "competenceCode": "CP.FR.L1.2",
        "cognitiveLoad": "medium",
        "engagement": "medium",
        "storyContext": "A robot challenges children to identify sounds"
      }
    },

    // ===== ENTRAÎNEMENT - CALCUL =====
    {
      "titre": "Le Marché des Fruits",
      "consigne": "Aide Marie à compter ses fruits au marché.",
      "type": "CALCUL",
      "difficulte": "entrainement",
      "moduleId": 2,
      "configuration": {
        "question": "Marie a 5 pommes et 3 oranges. Combien de fruits a-t-elle en tout ?",
        "operation": "addition",
        "resultat": 8,
        "visual": {
          "type": "story",
          "image": "/images/stories/market_fruits.png",
          "animation": "counting_sequence"
        },
        "feedback": {
          "correct": "Parfait ! 5 + 3 = 8 fruits ! Marie est contente ! 🍎🍊",
          "incorrect": "Compte : 5 pommes + 3 oranges = 8 fruits ! 🧮"
        }
      },
      "metadata": { 
        "competenceCode": "CP.MA.N2.1",
        "cognitiveLoad": "medium",
        "engagement": "medium",
        "storyContext": "Marie needs help counting fruits at the market"
      }
    },

    // ===== CONSOLIDATION - COMPRÉHENSION =====
    {
      "titre": "L'Histoire de Tom",
      "consigne": "Lis l'histoire de Tom et réponds à la question.",
      "type": "QCM",
      "difficulte": "maitrise",
      "moduleId": 1,
      "configuration": {
        "question": "Où va Tom dans l'histoire ?",
        "story": {
          "text": "Tom aime aller à l'école. Il prend son sac et marche avec ses amis. L'école est grande et belle.",
          "audio": "/audio/stories/tom_ecole.mp3",
          "image": "/images/stories/tom_school.png"
        },
        "choix": [
          {"id": "ecole", "text": "À l'école", "image": "/images/places/school.png"},
          {"id": "maison", "text": "À la maison", "image": "/images/places/home.png"},
          {"id": "parc", "text": "Au parc", "image": "/images/places/park.png"},
          {"id": "magasin", "text": "Au magasin", "image": "/images/places/store.png"}
        ],
        "bonneReponse": "ecole",
        "feedback": {
          "correct": "Bravo ! Tom va bien à l'école ! 📚",
          "incorrect": "Relis l'histoire... Tom va à l'école ! 🏫"
        }
      },
      "metadata": { 
        "competenceCode": "CP.FR.L3.1",
        "cognitiveLoad": "high",
        "engagement": "high",
        "storyContext": "Tom's story about going to school"
      }
    },

    // ===== APPROFONDISSEMENT - PROBLÈME =====
    {
      "titre": "Le Défi du Chef",
      "consigne": "Le chef cuisinier a besoin d'aide pour préparer sa recette.",
      "type": "CALCUL",
      "difficulte": "maitrise",
      "moduleId": 2,
      "configuration": {
        "question": "Le chef a 12 œufs. Il en utilise 4 pour faire un gâteau. Combien d'œufs lui reste-t-il ?",
        "operation": "soustraction",
        "resultat": 8,
        "visual": {
          "type": "problem_solving",
          "image": "/images/problems/chef_eggs.png",
          "animation": "egg_counting"
        },
        "feedback": {
          "correct": "Excellent ! 12 - 4 = 8 œufs restent ! Le chef est ravi ! 👨‍🍳",
          "incorrect": "Calcule : 12 œufs - 4 utilisés = 8 œufs restent ! 🥚"
        }
      },
      "metadata": { 
        "competenceCode": "CP.MA.N4.2",
        "cognitiveLoad": "high",
        "engagement": "high",
        "storyContext": "A chef needs help calculating ingredients"
      }
    }
  ]
};

export const cP2025Demo = (): React.ReactElement => {
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
              <div className="text-2xl font-bold text-blue-600">{modules.length}</div>
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
                            Compétence: {exercise.metadata?.competenceCode || 'N/A'}
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