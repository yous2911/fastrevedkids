import { CP2025Data } from '../types';
import { validateCP2025Data } from '../services/cp2025.service';
import { CP2025Service } from '../services/cp2025.service';

// ==========================================
// CP2025 DATA LOADER UTILITIES
// ==========================================

/**
 * Load CP2025 data from a JSON string
 */
export function loadCP2025FromJSON(jsonString: string): CP2025Service {
  try {
    const data = JSON.parse(jsonString) as CP2025Data;
    
    if (!validateCP2025Data(data)) {
      throw new Error('Invalid CP2025 data structure');
    }
    
    return new CP2025Service(data);
  } catch (error) {
    throw new Error(`Failed to load CP2025 data: ${error}`);
  }
}

/**
 * Load CP2025 data from a URL
 */
export async function loadCP2025FromURL(url: string): Promise<CP2025Service> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const jsonString = await response.text();
    return loadCP2025FromJSON(jsonString);
  } catch (error) {
    throw new Error(`Failed to load CP2025 data from URL: ${error}`);
  }
}

/**
 * Validate and merge multiple CP2025 data sources
 */
export function mergeCP2025Data(...dataSources: CP2025Data[]): CP2025Data {
  const merged: CP2025Data = {
    modules: [],
    exercises: []
  };

  const moduleIds = new Set<number>();
  const exerciseIds = new Set<string>();

  dataSources.forEach(data => {
    // Merge modules
    data.modules.forEach(module => {
      if (!moduleIds.has(module.id)) {
        merged.modules.push(module);
        moduleIds.add(module.id);
      }
    });

    // Merge exercises
    data.exercises.forEach(exercise => {
      const exerciseId = `${exercise.moduleId}-${exercise.titre}-${exercise.type}`;
      if (!exerciseIds.has(exerciseId)) {
        merged.exercises.push(exercise);
        exerciseIds.add(exerciseId);
      }
    });
  });

  return merged;
}

/**
 * Create a complete CP2025 dataset from your JSON
 */
export function createCompleteCP2025Dataset(): CP2025Data {
  // Your complete data structure
  const completeData: CP2025Data = {
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
      },
      {
        "id": 5,
        "titre": "Français CP - Maîtrise et Automatisation",
        "description": "Lecture fluente, compréhension de l'implicite, graphèmes complexes et production de textes courts.",
        "niveau": "CP",
        "matiere": "FRANCAIS",
        "periode": "P4-P5",
        "ordre": 5,
        "metadata": { 
          "competenceDomain": "CP.FR.L1", 
          "cp2025": true 
        }
      },
      {
        "id": 6,
        "titre": "Mathématiques CP - Vers la Multiplication et les Données",
        "description": "Sens de la multiplication et de la division, problèmes à étapes, et lecture de graphiques.",
        "niveau": "CP",
        "matiere": "MATHEMATIQUES",
        "periode": "P4-P5",
        "ordre": 6,
        "metadata": { 
          "competenceDomain": "CP.MA.N4", 
          "cp2025": true 
        }
      },
      {
        "id": 7,
        "titre": "Français CP - Logique et Raisonnement",
        "description": "Application des compétences de lecture et d'écriture à des problèmes de logique, de catégorisation et de compréhension fine.",
        "niveau": "CP",
        "matiere": "FRANCAIS",
        "periode": "P5-Synthese",
        "ordre": 7,
        "metadata": { 
          "competenceDomain": "CP.FR.C2", 
          "cp2025": true 
        }
      },
      {
        "id": 8,
        "titre": "Mathématiques CP - Stratégies de Résolution",
        "description": "Développement de la flexibilité mentale en mathématiques : problèmes à étapes, problèmes inversés et raisonnement logique.",
        "niveau": "CP",
        "matiere": "MATHEMATIQUES",
        "periode": "P5-Synthese",
        "ordre": 8,
        "metadata": { 
          "competenceDomain": "CP.MA.P3", 
          "cp2025": true 
        }
      },
      {
        "id": 9,
        "titre": "Français - Pont vers le CE1",
        "description": "Introduction à la conjugaison, aux homophones grammaticaux et à la structure des phrases complexes.",
        "niveau": "CP-CE1",
        "matiere": "FRANCAIS",
        "periode": "Synthese-CE1",
        "ordre": 9,
        "metadata": { 
          "competenceDomain": "FR.CE1.G1", 
          "cp2025": true 
        }
      },
      {
        "id": 10,
        "titre": "Mathématiques - Pont vers le CE1",
        "description": "Découverte des nombres jusqu'à 1000, des opérations posées, des tables de multiplication et de la lecture précise de l'heure.",
        "niveau": "CP-CE1",
        "matiere": "MATHEMATIQUES",
        "periode": "Synthese-CE1",
        "ordre": 10,
        "metadata": { 
          "competenceDomain": "MA.CE1.N1", 
          "cp2025": true 
        }
      }
    ],
    "exercises": [
      // Module 1 & 2 exercises (from your first JSON)
      {
        "titre": "Reconnaissance du son [o]",
        "consigne": "Écoute le mot. Entends-tu le son [o] ?",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 1,
        "configuration": {
          "question": "Entends-tu le son [o] dans 'MOTO' ?",
          "choix": [
            { "id": "oui", "text": "Oui" },
            { "id": "non", "text": "Non" }
          ],
          "bonneReponse": "oui",
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
          "choix": [
            { "id": "7", "text": "7" },
            { "id": "8", "text": "8" },
            { "id": "9", "text": "9" },
            { "id": "10", "text": "10" }
          ],
          "bonneReponse": "9"
        },
        "metadata": { "competenceCode": "CP.MA.N1.1" }
      },
      // Module 3 & 4 exercises (from your second JSON)
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
          "choix": [
            { "id": "soixante-cinq", "text": "Soixante-cinq" },
            { "id": "soixante-quinze", "text": "Soixante-quinze" },
            { "id": "septante-cinq", "text": "Septante-cinq" }
          ],
          "bonneReponse": "soixante-quinze"
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
          "choix": [
            { "id": "le", "text": "le" },
            { "id": "les", "text": "les" }
          ],
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
          "solution": ["d1", "d2"]
        },
        "metadata": { "competenceCode": "CP.FR.L1.3" }
      },
      {
        "titre": "Écrire les grands nombres",
        "consigne": "Écris 'quatre-vingt-deux' en chiffres.",
        "type": "TEXT_INPUT",
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
        "difficulte": "consolidation",
        "moduleId": 3,
        "configuration": {
          "question": "Texte : 'Le lion est dans la savane. Il voit une gazelle. Il a très faim.' Que voit le lion ?",
          "choix": [
            { "id": "un-zebre", "text": "Un zèbre" },
            { "id": "un-serpent", "text": "Un serpent" },
            { "id": "une-gazelle", "text": "Une gazelle" }
          ],
          "bonneReponse": "une-gazelle"
        },
        "metadata": { "competenceCode": "CP.FR.C2.1" }
      },
      {
        "titre": "Problème de recherche de l'écart",
        "consigne": "Lis le problème et calcule l'écart.",
        "type": "CALCUL",
        "difficulte": "consolidation",
        "moduleId": 4,
        "configuration": { 
          "question": "J'ai 12 billes et tu en as 8. Combien de billes ai-je de plus que toi ?", 
          "operation": "12 - 8",
          "resultat": 4 
        },
        "metadata": { "competenceCode": "CP.MA.N4.2" }
      },
      // Module 5 & 6 exercises (from your third JSON)
      {
        "titre": "Reconnaissance du son [ɛj] (eil)",
        "consigne": "Dans quel mot entends-tu le son [ɛj] comme dans 'réveil' ?",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 5,
        "configuration": {
          "question": "Choisis le bon mot.",
          "choix": [
            { "id": "soleil", "text": "Soleil" },
            { "id": "solide", "text": "Solide" }
          ],
          "bonneReponse": "soleil"
        },
        "metadata": { "competenceCode": "CP.FR.L1.4" }
      },
      {
        "titre": "Sens de la multiplication",
        "consigne": "Quelle opération correspond à l'image ?",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 6,
        "configuration": {
          "question": "Regarde les groupes de pommes.",
          "image": { "url_placeholder": "/images/groups/3x2_pommes.png", "description": "Trois groupes distincts, chacun contenant deux pommes." },
          "choix": [
            { "id": "2+3", "text": "2 + 3" },
            { "id": "3+3", "text": "3 + 3" },
            { "id": "2+2+2", "text": "2 + 2 + 2" }
          ],
          "bonneReponse": "2+2+2"
        },
        "metadata": { "competenceCode": "CP.MA.N4.3" }
      },
      {
        "titre": "Le son de 'ss'",
        "consigne": "Où le 's' fait-il le son [s] comme dans 'serpent' ?",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 5,
        "configuration": {
          "question": "Choisis le mot où tu entends [s].",
          "choix": [
            { "id": "poison", "text": "Poison" },
            { "id": "poisson", "text": "Poisson" }
          ],
          "bonneReponse": "poisson"
        },
        "metadata": { "competenceCode": "CP.FR.L1.4" }
      },
      {
        "titre": "Sens de la division (partage)",
        "consigne": "Lis la situation et choisis la bonne image.",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 6,
        "configuration": {
          "question": "Je partage équitablement 6 bonbons entre 3 enfants. Quelle image est correcte ?",
          "choix": [
            {"id": "c1", "image": { "url_placeholder": "/images/shares/6_to_3_correct.png", "description": "Trois enfants, chacun avec deux bonbons." }},
            {"id": "c2", "image": { "url_placeholder": "/images/shares/6_to_3_incorrect.png", "description": "Un enfant avec quatre bonbons, les deux autres avec un seul." }}
          ],
          "bonneReponse": "c1"
        },
        "metadata": { "competenceCode": "CP.MA.N4.4" }
      },
      {
        "titre": "Comprendre le connecteur 'mais'",
        "consigne": "Lis la phrase et réponds à la question.",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 5,
        "configuration": {
          "question": "Phrase : 'Le gâteau est beau mais il n'est pas bon.' Est-ce que le gâteau est bon ?",
          "choix": [
            { "id": "oui", "text": "Oui" },
            { "id": "non", "text": "Non" }
          ],
          "bonneReponse": "non"
        },
        "metadata": { "competenceCode": "CP.FR.C1.4" }
      },
      {
        "titre": "Comparer des masses",
        "consigne": "Clique sur l'objet le plus lourd.",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 6,
        "configuration": {
          "question": "Regarde la balance.",
          "image": { "url_placeholder": "/images/scales/balance_plume_enclume.png", "description": "Une balance de Roberval. Sur un plateau, une plume. Sur l'autre, une enclume. Le plateau de l'enclume est plus bas." },
          "choix": [
            {"id": "i1", "text": "La plume"},
            {"id": "i2", "text": "L'enclume"}
          ],
          "bonneReponse": "i2"
        },
        "metadata": { "competenceCode": "CP.MA.M2.1" }
      },
      {
        "titre": "Lire un diagramme simple",
        "consigne": "Observe le graphique et réponds.",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 6,
        "configuration": {
          "question": "Quel est le fruit préféré des élèves ?",
          "image": { "url_placeholder": "/images/charts/fruits_bar_chart.png", "description": "Un diagramme en barres montrant les fruits préférés. Pomme: 5 votes. Banane: 3 votes. Fraise: 8 votes. La barre pour 'Fraise' est la plus haute." },
          "choix": [
            { "id": "pomme", "text": "Pomme" },
            { "id": "banane", "text": "Banane" },
            { "id": "fraise", "text": "Fraise" }
          ],
          "bonneReponse": "fraise"
        },
        "metadata": { "competenceCode": "CP.MA.D1.3" }
      },
      {
        "titre": "Correspondance 'ph' -> [f]",
        "consigne": "Dans quel mot les lettres 'ph' font-elles le son [f] ?",
        "type": "QCM",
        "difficulte": "entrainement",
        "moduleId": 5,
        "configuration": {
          "question": "Choisis le bon mot.",
          "choix": [
            { "id": "un-phare", "text": "un phare" },
            { "id": "une-harpe", "text": "une harpe" }
          ],
          "bonneReponse": "un-phare"
        },
        "metadata": { "competenceCode": "CP.FR.L1.5" }
      },
      {
        "titre": "Problème de multiplication",
        "consigne": "Calcule le nombre total d'objets.",
        "type": "CALCUL",
        "difficulte": "entrainement",
        "moduleId": 6,
        "configuration": { 
          "question": "J'ai 3 paquets. Dans chaque paquet, il y a 4 gâteaux. Combien de gâteaux ai-je en tout ?", 
          "operation": "3 x 4",
          "resultat": 12 
        },
        "metadata": { "competenceCode": "CP.MA.P2.1" }
      },
      {
        "titre": "Utiliser la ponctuation",
        "consigne": "Quelle ponctuation faut-il à la fin de cette phrase ?",
        "type": "QCM",
        "difficulte": "entrainement",
        "moduleId": 5,
        "configuration": {
          "question": "Quelle heure est-il",
          "choix": [
            { "id": "point", "text": "." },
            { "id": "question", "text": "?" },
            { "id": "exclamation", "text": "!" }
          ],
          "bonneReponse": "question"
        },
        "metadata": { "competenceCode": "CP.FR.L3.4" }
      },
      {
        "titre": "Décomposer un nombre < 100",
        "consigne": "Décompose le nombre en dizaines et unités.",
        "type": "DRAG_DROP",
        "difficulte": "entrainement",
        "moduleId": 6,
        "configuration": {
          "question": "87 = ... + ...",
          "dragItems": [{"id": "d1", "content": "7"}, {"id": "d2", "content": "80"}, {"id": "d3", "content": "8"}],
          "zones": [{"id": "z1", "label": "Dizaines"}, {"id": "z2", "label": "Unités"}],
          "solution": {"z1": ["d2"], "z2": ["d1"]}
        },
        "metadata": { "competenceCode": "CP.MA.N2.3" }
      },
      {
        "titre": "Repérer une erreur de copie",
        "consigne": "Trouve l'erreur dans la phrase copiée.",
        "type": "TEXT_INPUT",
        "difficulte": "entrainement",
        "moduleId": 5,
        "configuration": {
          "question": "Modèle : 'Le cheval galope.' Copie : 'Le chevale galope.'",
          "inputType": "clickable_letters",
          "bonneReponse": ["e"],
          "lettres": ["L", "e", " ", "c", "h", "e", "v", "a", "l", "e", " ", "g", "a", "l", "o", "p", "e", "."]
        },
        "metadata": { "competenceCode": "CP.FR.E1.6" }
      },
      {
        "titre": "Rendre la monnaie",
        "consigne": "Calcule la monnaie rendue.",
        "type": "CALCUL",
        "difficulte": "entrainement",
        "moduleId": 6,
        "configuration": { 
          "question": "J'achète un livre à 7 €. Je donne un billet de 10 €. Combien d'argent doit-on me rendre ?", 
          "operation": "10 - 7",
          "resultat": 3 
        },
        "metadata": { "competenceCode": "CP.MA.M4.3" }
      },
      {
        "titre": "Reproduire une figure",
        "consigne": "Reproduis la figure sur le quadrillage de droite.",
        "type": "DRAG_DROP",
        "difficulte": "entrainement",
        "moduleId": 6,
        "configuration": {
          "question": "Clique sur les cases pour dessiner la même maison.",
          "image": { "url_placeholder": "/images/grids/repro_maison.png", "description": "À gauche, une grille avec une maison simple dessinée (un carré surmonté d'un triangle). À droite, une grille vide." },
          "bonneReponse": "maison"
        },
        "metadata": { "competenceCode": "CP.MA.G2.3" }
      },
      {
        "titre": "Comprendre l'implicite",
        "consigne": "Lis la situation et déduis la réponse.",
        "type": "QCM",
        "difficulte": "consolidation",
        "moduleId": 5,
        "configuration": {
          "question": "Léo met son manteau, son bonnet et ses gants avant de sortir. Quel temps fait-il probablement dehors ?",
          "choix": [
            { "id": "chaud", "text": "Il fait chaud" },
            { "id": "froid", "text": "Il fait froid" },
            { "id": "pluie", "text": "Il pleut" }
          ],
          "bonneReponse": "froid"
        },
        "metadata": { "competenceCode": "CP.FR.C2.4" }
      },
      {
        "titre": "Problème d'arrangement",
        "consigne": "Lis le problème et trouve le nombre total.",
        "type": "CALCUL",
        "difficulte": "consolidation",
        "moduleId": 6,
        "configuration": { 
          "question": "Dans sa boîte, un chocolatier range 3 rangées de 5 chocolats. Combien de chocolats y a-t-il dans la boîte ?", 
          "operation": "3 x 5",
          "resultat": 15 
        },
        "metadata": { "competenceCode": "CP.MA.P2.2" }
      },
      {
        "titre": "Rédiger un texte court",
        "consigne": "Mets les deux phrases dans le bon ordre pour raconter une petite histoire.",
        "type": "DRAG_DROP",
        "difficulte": "consolidation",
        "moduleId": 5,
        "configuration": {
          "question": "Ordonne l'histoire :",
          "dragItems": [
            {"id": "p1", "content": "Il marque un but."},
            {"id": "p2", "content": "Tom joue au football."}
          ],
          "zones": [{"id": "z1", "label": "Histoire ordonnée"}],
          "solution": ["p2", "p1"]
        },
        "metadata": { "competenceCode": "CP.FR.E3.2" }
      },
      {
        "titre": "Compléter une suite numérique",
        "consigne": "Écris le nombre qui manque dans la suite.",
        "type": "TEXT_INPUT",
        "difficulte": "consolidation",
        "moduleId": 6,
        "configuration": { 
          "question": "88, 89, __, 91, 92", 
          "inputType": "keyboard", 
          "bonneReponse": "90" 
        },
        "metadata": { "competenceCode": "CP.MA.N1.5" }
      },
      {
        "titre": "Orthographier un mot avec 'ill'",
        "consigne": "Écris le mot que tu entends : 'fille'",
        "type": "TEXT_INPUT",
        "difficulte": "consolidation",
        "moduleId": 5,
        "configuration": { 
          "question": "Écris le mot...", 
          "audioRequired": true, 
          "inputType": "keyboard", 
          "bonneReponse": "fille" 
        },
        "metadata": { "competenceCode": "CP.FR.L1.4" }
      },
      {
        "titre": "Comparer des données dans un graphique",
        "consigne": "Observe le graphique et réponds à la question.",
        "type": "CALCUL",
        "difficulte": "consolidation",
        "moduleId": 6,
        "configuration": {
          "question": "Combien d'élèves de plus préfèrent la fraise à la banane ?",
          "image": { "url_placeholder": "/images/charts/fruits_bar_chart.png", "description": "Le même diagramme que précédemment. Fraise: 8 votes. Banane: 3 votes." },
          "operation": "8 - 3",
          "resultat": 5
        },
        "metadata": { "competenceCode": "CP.MA.D1.4" }
      },
      {
        "titre": "Lecture fluente et compréhension fine",
        "consigne": "Lis le petit texte et réponds à la question.",
        "type": "QCM",
        "difficulte": "consolidation",
        "moduleId": 5,
        "configuration": {
          "question": "Texte : 'C'est le matin. La poule rousse sort du poulailler. Elle picore des graines près de la mare.' Où la poule trouve-t-elle les graines ?",
          "choix": [
            { "id": "poulailler", "text": "Dans le poulailler" },
            { "id": "mare", "text": "Près de la mare" },
            { "id": "maison", "text": "Dans la maison" }
          ],
          "bonneReponse": "mare"
        },
        "metadata": { "competenceCode": "CP.FR.L3.3" }
      },
      // Module 7 & 8 exercises (from your fourth JSON - Synthesis)
      {
        "titre": "L'intrus sonore",
        "consigne": "Écoute bien les mots. Lequel ne contient pas le son [a] ?",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 7,
        "configuration": {
          "question": "Quel est l'intrus ?",
          "choix": [
            {"id":"c1", "text":"PAPA", "audio":"/audio/papa.mp3"},
            {"id":"c2", "text":"MOTO", "audio":"/audio/moto.mp3"},
            {"id":"c3", "text":"CHAT", "audio":"/audio/chat.mp3"}
          ],
          "bonneReponse": "c2",
          "aide": "Le son [a] s'écrit avec la lettre 'a'. Écoute bien chaque mot."
        },
        "metadata": { "competenceCode": "CP.FR.L1.1" }
      },
      {
        "titre": "Vrai ou Faux ? Ordre des nombres",
        "consigne": "Cette affirmation est-elle vraie ou fausse ?",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 8,
        "configuration": {
          "question": "Affirmation : Le nombre 8 est plus grand que le nombre 12.",
          "choix": [
            { "id": "vrai", "text": "Vrai" },
            { "id": "faux", "text": "Faux" }
          ],
          "bonneReponse": "faux",
          "aide": "Regarde la file numérique. Le nombre 8 vient avant le nombre 12."
        },
        "metadata": { "competenceCode": "CP.MA.N1.5" }
      },
      {
        "titre": "L'intrus dans la phrase",
        "consigne": "Quel mot n'est pas un nom d'objet dans cette liste ?",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 7,
        "configuration": {
          "question": "Cherche l'intrus.",
          "choix": [
            { "id": "table", "text": "table" },
            { "id": "chaise", "text": "chaise" },
            { "id": "joli", "text": "joli" }
          ],
          "bonneReponse": "joli"
        },
        "metadata": { "competenceCode": "CP.FR.G1.1" }
      },
      {
        "titre": "Quelle opération choisir ?",
        "consigne": "Pour résoudre ce problème, quelle opération dois-tu utiliser ?",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 8,
        "configuration": {
          "question": "Problème : Tu as 10 bonbons. Tu en manges 3. Pour savoir combien il t'en reste, tu dois faire...",
          "choix": [
            { "id": "addition", "text": "une addition (+)" },
            { "id": "soustraction", "text": "une soustraction (-)" }
          ],
          "bonneReponse": "soustraction",
          "aide": "Quand on retire quelque chose, on fait une soustraction."
        },
        "metadata": { "competenceCode": "CP.MA.P3.2" }
      },
      {
        "titre": "L'intrus des formes",
        "consigne": "Clique sur la forme qui n'est pas une figure plane.",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 8,
        "configuration": {
          "question": "Laquelle de ces formes est un solide ?",
          "choix": [
            {"id": "i1", "image": { "url_placeholder": "/images/shapes/carre.svg", "description": "Un carré bleu."}},
            {"id": "i2", "image": { "url_placeholder": "/images/shapes/cube.svg", "description": "Un cube en 3D."}},
            {"id": "i3", "image": { "url_placeholder": "/images/shapes/cercle.svg", "description": "Un cercle rouge."}}
          ],
          "bonneReponse": "i2",
          "aide": "Une figure plane est plate comme une feuille de papier. Un solide a une épaisseur, on peut le tenir dans la main."
        },
        "metadata": { "competenceCode": "CP.MA.G1.2" }
      },
      {
        "titre": "Logique de ponctuation",
        "consigne": "Choisis le bon point pour terminer la phrase.",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 7,
        "configuration": {
          "question": "J'adore jouer au ballon",
          "choix": [
            { "id": "question", "text": "?" },
            { "id": "exclamation", "text": "!" },
            { "id": "point", "text": "." }
          ],
          "bonneReponse": "point"
        },
        "metadata": { "competenceCode": "CP.FR.E3.3" }
      },
      {
        "titre": "Vérifier sa lecture",
        "consigne": "Lis le mot et dis si l'affirmation est vraie ou fausse.",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 7,
        "configuration": {
          "question": "Le mot 'ordinateur' a 3 syllabes.",
          "choix": [
            { "id": "vrai", "text": "Vrai" },
            { "id": "faux", "text": "Faux" }
          ],
          "bonneReponse": "faux",
          "aide": "Comptons ensemble : or-di-na-teur. Il y en a 4 !"
        },
        "metadata": { "competenceCode": "CP.FR.L2.3" }
      },
      {
        "titre": "Problème inversé",
        "consigne": "Trouve l'opération qui donne le bon résultat.",
        "type": "QCM",
        "difficulte": "entrainement",
        "moduleId": 8,
        "configuration": {
          "question": "Le résultat est 15. Quelle était l'opération ?",
          "choix": [
            { "id": "10+4", "text": "10 + 4" },
            { "id": "18-3", "text": "18 - 3" },
            { "id": "7+7", "text": "7 + 7" }
          ],
          "bonneReponse": "18-3"
        },
        "metadata": { "competenceCode": "CP.MA.N3.1" }
      },
      {
        "titre": "Corriger l'accord",
        "consigne": "Il y a une erreur dans la phrase. Réécris le mot correct.",
        "type": "TEXT_INPUT",
        "difficulte": "entrainement",
        "moduleId": 7,
        "configuration": {
          "question": "Phrase à corriger : 'les chat sont gris'.",
          "inputType": "keyboard", 
          "bonneReponse": "chats",
          "aide": "Avec 'les', le nom prend un 's' à la fin."
        },
        "metadata": { "competenceCode": "CP.FR.G1.4" }
      },
      {
        "titre": "Suite logique de nombres",
        "consigne": "Observe bien la suite et trouve le nombre manquant.",
        "type": "TEXT_INPUT",
        "difficulte": "entrainement",
        "moduleId": 8,
        "configuration": { 
          "question": "5, 10, 15, __, 25", 
          "inputType": "keyboard", 
          "bonneReponse": "20", 
          "aide": "On avance de 5 en 5." 
        },
        "metadata": { "competenceCode": "CP.MA.N1.5" }
      },
      {
        "titre": "Trouver la bonne question",
        "consigne": "Lis la situation et la réponse. Quelle question a-t-on bien pu poser ?",
        "type": "QCM",
        "difficulte": "entrainement",
        "moduleId": 7,
        "configuration": {
          "question": "Situation : Un garçon regarde par la fenêtre. Réponse : 'Il pleut.'",
          "choix": [
            { "id": "age", "text": "Quel âge a le garçon ?" },
            { "id": "temps", "text": "Quel temps fait-il ?" }
          ],
          "bonneReponse": "temps"
        },
        "metadata": { "competenceCode": "CP.FR.C2.4" }
      },
      {
        "titre": "Vrai ou Faux ? Problème de monnaie",
        "consigne": "Lis l'affirmation et dis si elle est vraie ou fausse.",
        "type": "QCM",
        "difficulte": "entrainement",
        "moduleId": 8,
        "configuration": {
          "question": "Avec un billet de 5€, je peux acheter une glace à 3€ et un bonbon à 1€.",
          "choix": [
            { "id": "vrai", "text": "Vrai" },
            { "id": "faux", "text": "Faux" }
          ],
          "bonneReponse": "vrai",
          "aide": "La glace et le bonbon coûtent 3 + 1 = 4€ en tout. C'est moins que 5€."
        },
        "metadata": { "competenceCode": "CP.MA.M4.4" }
      },
      {
        "titre": "Associer cause et conséquence",
        "consigne": "Relie la cause (ce qui se passe en premier) à sa conséquence logique.",
        "type": "DRAG_DROP",
        "difficulte": "entrainement",
        "moduleId": 7,
        "configuration": {
          "question": "Associe les phrases.",
          "dragItems": [{"id": "cause1", "content": "J'ai très faim."}],
          "zones": [
            {"id": "cons1", "label": "Je vais dormir."},
            {"id": "cons2", "label": "Je prépare un sandwich."}
          ],
          "solution": {"cons2": ["cause1"]}
        },
        "metadata": { "competenceCode": "CP.FR.C1.4" }
      },
      {
        "titre": "Estimer une longueur",
        "consigne": "Sans mesurer, essaie d'estimer la longueur de la gomme.",
        "type": "QCM",
        "difficulte": "entrainement",
        "moduleId": 8,
        "configuration": {
          "question": "La règle mesure 10 cm. Combien mesure la gomme environ ?",
          "image": { "url_placeholder": "/images/measures/gomme_estimation.png", "description": "Une règle graduée de 10cm. En dessous, une gomme qui fait visiblement moins de la moitié de la règle, environ 4cm." },
          "choix": [
            { "id": "1cm", "text": "1 cm" },
            { "id": "4cm", "text": "4 cm" },
            { "id": "10cm", "text": "10 cm" }
          ],
          "bonneReponse": "4cm"
        },
        "metadata": { "competenceCode": "CP.MA.M1.4" }
      },
      {
        "titre": "Inférence avancée",
        "consigne": "Lis la situation et choisis ce qu'il s'est probably passé.",
        "type": "QCM",
        "difficulte": "consolidation",
        "moduleId": 7,
        "configuration": {
          "question": "Mila revient du jardin avec les mains pleines de terre et un grand sourire. Elle tient un seau rempli de fraises. Qu'a-t-elle fait ?",
          "choix": [
            { "id": "sieste", "text": "Elle a fait une sieste." },
            { "id": "jardinage", "text": "Elle a fait du jardinage." },
            { "id": "lecture", "text": "Elle a lu un livre." }
          ],
          "bonneReponse": "jardinage"
        },
        "metadata": { "competenceCode": "CP.FR.C2.4" }
      },
      {
        "titre": "Problème à deux étapes",
        "consigne": "Lis bien le problème et calcule le résultat final.",
        "type": "CALCUL",
        "difficulte": "consolidation",
        "moduleId": 8,
        "configuration": { 
          "question": "J'ai un billet de 20€. J'achète un livre à 10€ et un stylo à 2€. Combien d'argent me reste-t-il ?", 
          "operation": "20 - (10 + 2)",
          "resultat": 8, 
          "aide": "Calcule d'abord le total des achats (10 + 2), puis soustrais ce total de 20." 
        },
        "metadata": { "competenceCode": "CP.MA.P1.2" }
      },
      {
        "titre": "Analyse grammaticale",
        "consigne": "Fais glisser chaque mot de la phrase dans la bonne catégorie.",
        "type": "DRAG_DROP",
        "difficulte": "consolidation",
        "moduleId": 7,
        "configuration": {
          "question": "Analyse la phrase : Le chat noir dort.",
          "dragItems": [{"id": "w1", "content": "chat"}, {"id": "w2", "content": "noir"}, {"id": "w3", "content": "dort"}],
          "zones": [{"id": "z1", "label": "Nom"}, {"id": "z2", "label": "Adjectif"}, {"id": "z3", "label": "Verbe"}],
          "solution": {"z1": ["w1"], "z2": ["w2"], "z3": ["w3"]}
        },
        "metadata": { "competenceCode": "CP.FR.G1.1" }
      },
      {
        "titre": "Interpréter un graphique",
        "consigne": "Observe le graphique et choisis l'affirmation qui est VRAIE.",
        "type": "QCM",
        "difficulte": "consolidation",
        "moduleId": 8,
        "configuration": {
          "question": "Quelle affirmation est correcte ?",
          "image": { "url_placeholder": "/images/charts/animaux_bar_chart.png", "description": "Diagramme des animaux préférés. Chiens: 9 votes. Chats: 7 votes. Poissons: 4 votes." },
          "choix": [
            { "id": "poisson-populaire", "text": "Le poisson est l'animal le plus populaire." },
            { "id": "chats-plus-populaires", "text": "Il y a plus de votes pour les chats que pour les chiens." },
            { "id": "chien-plus-populaire", "text": "Le chien est plus populaire que le chat." }
          ],
          "bonneReponse": "chien-plus-populaire"
        },
        "metadata": { "competenceCode": "CP.MA.D1.4" }
      },
      {
        "titre": "Les homophones a / à",
        "consigne": "Complète la phrase avec le bon mot : 'a' ou 'à'.",
        "type": "QCM",
        "difficulte": "consolidation",
        "moduleId": 7,
        "configuration": {
          "question": "Lucas __ un vélo et il va __ l'école.",
          "choix": [
            { "id": "a-a", "text": "a / à" },
            { "id": "a-a-inverse", "text": "à / a" }
          ],
          "bonneReponse": "a-a",
          "aide": "On peut remplacer 'a' par 'avait'. On ne peut pas pour 'à'."
        },
        "metadata": { "competenceCode": "CP.FR.E2.2" }
      },
      {
        "titre": "Logique spatiale complexe",
        "consigne": "Suis les instructions pour placer les objets correctement.",
        "type": "DRAG_DROP",
        "difficulte": "consolidation",
        "moduleId": 8,
        "configuration": {
          "question": "Place le livre ROUGE à GAUCHE du livre BLEU.",
          "image": { "url_placeholder": "/images/scenes/etagere_vide.png", "description": "Une étagère de bibliothèque vide." },
          "dragItems": [
            {"id": "d1", "content": "Livre Rouge"},
            {"id": "d2", "content": "Livre Bleu"}
          ],
          "zones": [
            {"id": "z1", "label": "Position 1"},
            {"id": "z2", "label": "Position 2"}
          ],
          "solution": {"z1": ["d1"], "z2": ["d2"]}
        },
        "metadata": { "competenceCode": "CP.MA.G2.1" }
      },
      {
        "titre": "Production d'écrit guidée",
        "consigne": "Regarde l'image et écris une phrase complète pour la décrire.",
        "type": "TEXT_INPUT",
        "difficulte": "consolidation",
        "moduleId": 7,
        "configuration": {
          "question": "Écris une phrase pour dire ce que tu vois.",
          "image": { "url_placeholder": "/images/scenes/enfant_gateau.png", "description": "Un enfant sourit devant un gâteau d'anniversaire avec des bougies allumées." },
          "inputType": "keyboard", 
          "bonneReponse": "L'enfant fête son anniversaire."
        },
        "metadata": { "competenceCode": "CP.FR.E3.2" }
      },
      // Module 9 & 10 exercises (from your fifth JSON - Bridge to CE1)
      {
        "titre": "Découverte de la conjugaison : ÊTRE",
        "consigne": "Choisis la bonne forme du verbe 'être' pour compléter la phrase.",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 9,
        "configuration": {
          "question": "Je ___ un pirate et tu ___ une fée.",
          "choix": [
            { "id": "suis-es", "text": "suis / es" },
            { "id": "es-suis", "text": "es / suis" }
          ],
          "bonneReponse": "suis-es"
        },
        "metadata": { "competenceCode": "FR.CE1.G2.1" }
      },
      {
        "titre": "Découverte des nombres > 100",
        "consigne": "Comment s'écrit ce nombre en chiffres ?",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 10,
        "configuration": {
          "question": "Cent-vingt-trois",
          "choix": [
            { "id": "123", "text": "123" },
            { "id": "10023", "text": "10023" },
            { "id": "1203", "text": "1203" }
          ],
          "bonneReponse": "123",
          "aide": "Cent = 1 centaine, vingt = 2 dizaines, trois = 3 unités."
        },
        "metadata": { "competenceCode": "MA.CE1.N1.1" }
      },
      {
        "titre": "Trouver le sujet du verbe",
        "consigne": "Dans la phrase, qui fait l'action ?",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 9,
        "configuration": {
          "question": "Phrase : 'La courageuse tortue mange une salade.' Qui est-ce qui mange ?",
          "choix": [
            { "id": "salade", "text": "La salade" },
            { "id": "tortue", "text": "La courageuse tortue" }
          ],
          "bonneReponse": "tortue"
        },
        "metadata": { "competenceCode": "FR.CE1.G1.2" }
      },
      {
        "titre": "Découverte de la table de 2",
        "consigne": "Calcule cette multiplication.",
        "type": "CALCUL",
        "difficulte": "decouverte",
        "moduleId": 10,
        "configuration": { 
          "question": "Calcule 2 x 4.", 
          "operation": "2 x 4",
          "resultat": 8, 
          "aide": "C'est la même chose que de calculer le double de 4, ou 4 + 4." 
        },
        "metadata": { "competenceCode": "MA.CE1.N3.2" }
      },
      {
        "titre": "Homophones : et / est",
        "consigne": "Choisis les bons mots pour compléter la phrase.",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 9,
        "configuration": {
          "question": "Mon chien ___ beau __ très gentil.",
          "choix": [
            { "id": "est-et", "text": "est / et" },
            { "id": "et-est", "text": "et / est" }
          ],
          "bonneReponse": "est-et",
          "aide": "'est' est le verbe être. 'et' veut dire 'et puis'."
        },
        "metadata": { "competenceCode": "FR.CE1.E2.3" }
      },
      {
        "titre": "Lire la demi-heure",
        "consigne": "Regarde l'horloge et choisis la bonne heure.",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 10,
        "configuration": {
          "question": "Quelle heure est-il ?",
          "image": { "url_placeholder": "/images/clocks/horloge_02h30.png", "description": "Une horloge analogique. La petite aiguille est entre le 2 et le 3, la grande sur le 6." },
          "choix": [
            { "id": "deux-heures", "text": "Deux heures" },
            { "id": "deux-heures-et-demie", "text": "Deux heures et demie" },
            { "id": "trois-heures", "text": "Trois heures" }
          ],
          "bonneReponse": "deux-heures-et-demie"
        },
        "metadata": { "competenceCode": "MA.CE1.M3.1" }
      },
      {
        "titre": "L'intrus des verbes",
        "consigne": "Quel mot n'est pas un verbe (une action) ?",
        "type": "QCM",
        "difficulte": "decouverte",
        "moduleId": 9,
        "configuration": {
          "question": "Cherche l'intrus.",
          "choix": [
            { "id": "courir", "text": "courir" },
            { "id": "maison", "text": "maison" },
            { "id": "chanter", "text": "chanter" },
            { "id": "voir", "text": "voir" }
          ],
          "bonneReponse": "maison"
        },
        "metadata": { "competenceCode": "FR.CE1.G1.1" }
      },
      {
        "titre": "L'addition posée avec retenue",
        "consigne": "Résous l'addition. N'oublie pas la retenue !",
        "type": "CALCUL",
        "difficulte": "entrainement",
        "moduleId": 10,
        "configuration": {
          "question": "Combien font 36 + 25 ?",
          "image": { "url_placeholder": "/images/operations/addition_retenue.png", "description": "L'addition 36 + 25 posée en colonnes, avec un espace pour la retenue." },
          "operation": "36 + 25",
          "resultat": 61,
          "aide": "6 + 5 = 11. Je pose 1 et je retiens 1 dizaine. Puis 1 + 3 + 2 = 6."
        },
        "metadata": { "competenceCode": "MA.CE1.N3.1" }
      },
      {
        "titre": "Conjugaison : AVOIR au présent",
        "consigne": "Écris la bonne forme du verbe 'avoir'.",
        "type": "TEXT_INPUT",
        "difficulte": "entrainement",
        "moduleId": 9,
        "configuration": { 
          "question": "Tu __ un nouveau cartable.", 
          "inputType": "keyboard", 
          "bonneReponse": "as" 
        },
        "metadata": { "competenceCode": "FR.CE1.G2.1" }
      },
      {
        "titre": "Problème : la table de 5",
        "consigne": "Lis le problème et trouve la solution.",
        "type": "CALCUL",
        "difficulte": "entrainement",
        "moduleId": 10,
        "configuration": { 
          "question": "J'ai 4 billets de 5 euros. Combien d'argent ai-je en tout ?", 
          "operation": "4 x 5",
          "resultat": 20 
        },
        "metadata": { "competenceCode": "MA.CE1.P2.1" }
      },
      {
        "titre": "Logique de phrase : 'parce que'",
        "consigne": "Construis une phrase logique en utilisant 'parce que'.",
        "type": "DRAG_DROP",
        "difficulte": "entrainement",
        "moduleId": 9,
        "configuration": {
          "question": "Remets dans l'ordre.",
          "dragItems": [{"id":"p1", "content":"Je prends mon parapluie"}, {"id":"p2", "content":"parce qu'il pleut"}],
          "zones": [{"id": "z1", "label": "Phrase ordonnée"}],
          "solution": ["p1", "p2"]
        },
        "metadata": { "competenceCode": "FR.CE1.C1.4" }
      },
      {
        "titre": "Homophones : son / sont",
        "consigne": "Choisis les bons mots pour compléter la phrase.",
        "type": "QCM",
        "difficulte": "entrainement",
        "moduleId": 9,
        "configuration": {
          "question": "Les élèves ___ dans la cour avec ___ ballon.",
          "choix": [
            { "id": "son-sont", "text": "son / sont" },
            { "id": "sont-son", "text": "sont / son" }
          ],
          "bonneReponse": "sont-son",
          "aide": "'sont' est le verbe être. 'son' montre que le ballon est à quelqu'un."
        },
        "metadata": { "competenceCode": "FR.CE1.E2.3" }
      },
      {
        "titre": "Découverte de la symétrie",
        "consigne": "Cette figure a-t-elle un axe de symétrie ?",
        "type": "QCM",
        "difficulte": "entrainement",
        "moduleId": 10,
        "configuration": {
          "question": "Observe bien le papillon.",
          "image": { "url_placeholder": "/images/shapes/papillon_symetrique.png", "description": "Un papillon parfaitement symétrique dessiné autour d'un axe vertical." },
          "choix": [
            { "id": "oui", "text": "Oui" },
            { "id": "non", "text": "Non" }
          ],
          "bonneReponse": "oui",
          "aide": "Si on plie l'image sur le trait, les deux moitiés se superposent parfaitement."
        },
        "metadata": { "competenceCode": "MA.CE1.G3.2" }
      },
      {
        "titre": "Soustraction posée simple",
        "consigne": "Calcule cette soustraction.",
        "type": "CALCUL",
        "difficulte": "entrainement",
        "moduleId": 10,
        "configuration": { 
          "question": "Combien font 87 - 34 ?", 
          "operation": "87 - 34",
          "resultat": 53 
        },
        "metadata": { "competenceCode": "MA.CE1.N3.1" }
      },
      {
        "titre": "Raconter une histoire en images",
        "consigne": "Regarde les 3 images et écris une petite histoire de trois phrases.",
        "type": "TEXT_INPUT",
        "difficulte": "consolidation",
        "moduleId": 9,
        "configuration": {
          "question": "Raconte ce qu'il se passe.",
          "image": { "url_placeholder": "/images/stories/garcon_plante_fleur.png", "description": "Série de 3 images : 1. Un garçon tient une graine. 2. Il la plante en terre. 3. Il arrose une belle fleur qui a poussé." },
          "inputType": "multiline_keyboard",
          "bonneReponse": "Le garçon plante une graine. Il arrose la terre. Une jolie fleur a poussé."
        },
        "metadata": { "competenceCode": "FR.CE1.E3.2" }
      },
      {
        "titre": "Problème à étapes multiples",
        "consigne": "Lis bien le problème et calcule la réponse finale.",
        "type": "CALCUL",
        "difficulte": "consolidation",
        "moduleId": 10,
        "configuration": { 
          "question": "J'achète 2 gâteaux à 3€ chacun. Je paie avec un billet de 10€. Combien d'argent la vendeuse doit-elle me rendre ?", 
          "operation": "10 - (2 x 3)",
          "resultat": 4, 
          "aide": "Étape 1 : Calcule le prix total des gâteaux. Étape 2 : Calcule la monnaie rendue." 
        },
        "metadata": { "competenceCode": "MA.CE1.P3.1" }
      },
      {
        "titre": "Conjugaison : Verbes en -er",
        "consigne": "Choisis la bonne terminaison pour chaque verbe.",
        "type": "QCM",
        "difficulte": "consolidation",
        "moduleId": 9,
        "configuration": {
          "question": "Nous (mangeons/mangez) et vous (chante/chantez).",
          "choix": [
            { "id": "mangeons-chantez", "text": "mangeons / chantez" },
            { "id": "mangez-chante", "text": "mangez / chante" }
          ],
          "bonneReponse": "mangeons-chantez"
        },
        "metadata": { "competenceCode": "FR.CE1.G2.2" }
      },
      {
        "titre": "La soustraction avec retenue",
        "consigne": "Résous cette soustraction posée.",
        "type": "CALCUL",
        "difficulte": "consolidation",
        "moduleId": 10,
        "configuration": {
          "question": "Combien font 53 - 27 ?",
          "image": { "url_placeholder": "/images/operations/soustraction_retenue.png", "description": "La soustraction 53 - 27 posée en colonnes." },
          "operation": "53 - 27",
          "resultat": 26
        },
        "metadata": { "competenceCode": "MA.CE1.N3.1" }
      },
      {
        "titre": "Trouver la question cachée",
        "consigne": "Lis le texte, puis trouve la question qui correspond à la réponse donnée.",
        "type": "QCM",
        "difficulte": "consolidation",
        "moduleId": 10,
        "configuration": {
          "question": "Texte : Le film commence à 16h et il dure 2 heures. Réponse : 'À 18h.'",
          "choix": [
            { "id": "heure-debut", "text": "À quelle heure le film commence-t-il ?" },
            { "id": "duree", "text": "Combien de temps dure le film ?" },
            { "id": "heure-fin", "text": "À quelle heure le film se termine-t-il ?" }
          ],
          "bonneReponse": "heure-fin"
        },
        "metadata": { "competenceCode": "MA.CE1.P3.3" }
      },
      {
        "titre": "Lire les quarts d'heure",
        "consigne": "Quelle heure est-il sur cette horloge ?",
        "type": "QCM",
        "difficulte": "consolidation",
        "moduleId": 10,
        "configuration": {
          "question": "Regarde bien les aiguilles.",
          "image": { "url_placeholder": "/images/clocks/horloge_04h15.png", "description": "Une horloge analogique. La petite aiguille est juste après le 4, la grande sur le 3." },
          "choix": [
            { "id": "quatre-heures", "text": "Quatre heures" },
            { "id": "quatre-heures-et-quart", "text": "Quatre heures et quart" },
            { "id": "cinq-heures-moins-le-quart", "text": "Cinq heures moins le quart" }
          ],
          "bonneReponse": "quatre-heures-et-quart"
        },
        "metadata": { "competenceCode": "MA.CE1.M3.1" }
      },
      {
        "titre": "Homophones : on / ont",
        "consigne": "Complète la phrase avec 'on' ou 'ont'.",
        "type": "QCM",
        "difficulte": "consolidation",
        "moduleId": 9,
        "configuration": {
          "question": "Les joueurs ___ gagné le match, ___ est très contents !",
          "choix": [
            { "id": "ont-on", "text": "ont / on" },
            { "id": "on-ont", "text": "on / ont" }
          ],
          "bonneReponse": "ont-on",
          "aide": "'ont' est le verbe avoir (ils avaient). 'on' peut être remplacé par 'il'."
        },
        "metadata": { "competenceCode": "FR.CE1.E2.3" }
      }
    ]
  };

  return completeData;
}

/**
 * Get a service instance with the complete dataset
 */
export function getCompleteCP2025Service(): CP2025Service {
  const data = createCompleteCP2025Dataset();
  return new CP2025Service(data);
}

/**
 * Export data to JSON file (for download)
 */
export function exportCP2025ToJSON(data: CP2025Data, filename: string = 'cp2025-data.json'): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 