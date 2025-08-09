# BLUEPRINT DE PRODUCTION - APPLICATION "REV ED KIDS" (PROJET WAHOO)

## 1. VISION STRATÉGIQUE

- **Philosophie :** "EdApp, pas GameApp". La gamification est systématiquement au service de la science cognitive.
- **Proposition de Valeur :** "La Neuroplasticité Dirigée". Chaque fonctionnalité est conçue pour créer des moments "Eurêka" et renforcer les circuits neuronaux de l'apprentissage.
- **Positionnement :** Niveau 5 - L'Écosystème Cognitif Intelligent, au-delà des leaders actuels.

## 2. ARCHITECTURE PÉDAGOGIQUE

Le contenu est structuré selon une pyramide :
- **📚 70% - Les Classiques Réinventés :** Pratique fondamentale (QCM, Calculs) enrichie par le Moteur Wahoo.
- **🎮 25% - Les Aventures Pédagogiques :** Mini-jeux autonomes (`Mot Mystère`, `Séquençage d'Histoire`).
- **🧠 5% - Le Laboratoire Cognitif :** Exercices de diagnostic (`Mémoire de Travail`, `Métacognition`).
- **🎬 Masterclass Animées :** Modules d'enseignement approfondi (`LessonEngine`) pour les concepts complexes.

## 3. ARCHITECTURE TECHNIQUE

L'application est un écosystème de modules interconnectés :
1.  **`Moteur Wahoo` (`WahooEngine.js`) :** Moteur à règles qui orchestre les récompenses (feedback `subtle`, `standard`, `epic`) en fonction du contexte de l'élève (`streak`, `studentEnergy`, etc.).
2.  **`LessonEngine` (HTML/JS "vanilla") :** Lecteur de "Masterclass Animées". Il est piloté par JSON, gère les animations pas à pas, la voix off et le retour arrière. Il communique avec l'app principale via un "Pont d'Événements" (`window.dispatchEvent`).
3.  **Modules de Gameplay (React) :**
    - `MascotWardrobe.tsx` : Système de collection et de personnalisation pour la rétention à long terme.
    - `MysteryWordGame.tsx` : Module de jeu de lettres.
4.  **`EducationalDashboard.tsx` (React) :** ✅ **IMPLÉMENTÉ** - Portail parent/enseignant qui traduit les métriques ludiques en insights pédagogiques. Inclut analyse d'engagement, traduction cognitive, et mapping compétences.
5.  **`SyllabieModuleVisualizer.tsx` (React) :** Lecteur de "séries d'exercices classiques" avec navigation, filtres et suivi de progression.

## 4. STRUCTURES DE DONNÉES CLÉS (TYPESCRIPT)

```typescript
// État de l'élève pour le Moteur Wahoo
interface WahooContext {
  streak: number;
  totalCorrect: number;
  difficulty: 'easy' | 'medium' | 'hard';
  studentEnergy: number; // 0-100
  lastWahooIntensity: 'subtle' | 'standard' | 'epic';
}

// Système de Tutoriels
interface Tutorial {
  type: 'voice_guide' | 'visual_guide' | 'interactive_guide';
  voice_id?: string;
  script: string;
  animation?: string;
  duration?: number;
  skipable?: boolean;
}

// Système d'Achievements
interface ModuleAchievement {
  trigger: AchievementTrigger;
  reward: AchievementReward;
  unlocked?: boolean;
  unlockDate?: string;
}

// Module Pédagogique Complet
interface WahooModule {
  moduleId: string;
  title: string;
  description: string;
  targetCompetency: string;
  prerequisites: string[];
  steps: Array<{
    step: number;
    type: 'EXERCISE_SERIES' | 'MASTERCLASS' | 'LABORATORY';
    seriesId: string;
  }>;
  achievements: ModuleAchievement[];
}

// Exercice avec Tutoriel Intégré
interface WahooExercise {
  exercise_id: number;
  titre: string;
  consigne: string;
  type: 'QCM' | 'CALCUL' | 'DRAG_DROP_ORDER' | 'MYSTERY_WORD' | 'SEQUENCING_TASK' | 'DECISION_MAKING';
  difficulty: 'easy' | 'medium' | 'hard';
  configuration: ExerciseConfiguration;
  tutorial?: Tutorial;
  metadata: {
    competenceCode: string;
    cognitiveLoad?: 'low' | 'medium' | 'high';
    engagement?: 'low' | 'medium' | 'high';
  };
}

// Objet de collection pour la Garde-Robe
interface MascotItem {
  id: string;
  name: string;
  type: 'hat' | 'glasses' | 'accessory' | 'outfit' | 'background';
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockCondition: string;
  description: string;
  unlocked: boolean;
  equipped: boolean;
}

// Structure d'une Masterclass Animée
interface AnimatedLesson {
  lessonId: string;
  title: string;
  problem: { type: string; /* ... */ };
  voiceover: { provider: string; voice_id: string; script: any[] };
  animation_steps: any[];
  quiz: any[];
}
```

## 5. DIRECTION ARTISTIQUE (BIBLE GRAPHIQUE)

- **Style :** `flat design 2D, style illustration livre pour enfants moderne, contours noirs épurés (2px), ombres douces.`
- **Palette :**
  - Violet: `#8A2BE2`
  - Bleu: `#00BFFF`
  - Vert: `#00FF7F`
  - Jaune: `#FFD700`
- **Composition :** `Ratio 1:1, sujet centré, fond blanc uni.`
- **Animation :** Utiliser les variables CSS `--timing-smooth` et `--easing-magical` pour la cohérence.

## 6. IMPLÉMENTATION ACTUELLE

### Composants Déjà Créés
- ✅ `WahooEngine.ts` - Moteur de récompenses cognitives
- ✅ `wahoo.types.ts` - Types TypeScript complets (avec tutoriels et achievements)
- ✅ `MascotWardrobe.tsx` - Système de collection de mascotte
- ✅ `mascotCollection.ts` - Inventaire complet (50 objets)
- ✅ `SyllabieModuleVisualizer.tsx` - Module pédagogique complet
- ✅ `TutorialService.ts` - Gestion des tutoriels et achievements
- ✅ `EducationalDashboard.tsx` - Portail parent/enseignant (intégré avec WahooEngine)
- ✅ `MysteryWordGame.tsx` - Module de jeu de lettres (intégré avec WahooEngine)
- ✅ `useWahooEngine.ts` - Hook React pour WahooEngine
- ✅ `useMascotData.ts` - Hook React pour collection mascotte
- ✅ `useEducationalDashboard.ts` - Hook React pour tableau de bord

### Composants à Implémenter
- 🔄 `LessonEngine` - Lecteur de Masterclass Animées (HTML/JS vanilla)

### Architecture Backend
- ✅ API REST complète avec authentification JWT
- ✅ Base de données CP2025 avec 70+ exercices
- ✅ Tests complets (55 tests passants)
- ✅ Système de monitoring et métriques

### Intégration Frontend-Backend
- ✅ Services API TypeScript
- ✅ Hooks React pour la gestion d'état
- ✅ Système d'authentification
- ✅ Gestion des erreurs et loading states

## 7. PRINCIPES DE DÉVELOPPEMENT

### Règles de Code
1. **Cohérence TypeScript :** Tous les composants doivent utiliser les types définis dans `wahoo.types.ts`
2. **Animation Framer Motion :** Utiliser les animations définies dans `WAHOO_ANIMATIONS`
3. **Palette de Couleurs :** Respecter strictement `WAHOO_COLORS`
4. **Responsive Design :** Mobile-first avec breakpoints Tailwind
5. **Accessibilité :** WCAG 2.1 AA minimum

### Patterns d'Architecture
1. **Composition over Inheritance :** Privilégier les composants composables
2. **Event-Driven :** Communication entre modules via événements
3. **State Management :** Context API + hooks personnalisés
4. **Error Boundaries :** Gestion gracieuse des erreurs
5. **Performance :** Lazy loading et memoization

### Tests et Qualité
1. **Tests Unitaires :** 100% de couverture pour les services
2. **Tests d'Intégration :** Flux utilisateur complets
3. **Tests E2E :** Scénarios critiques
4. **Linting :** ESLint + Prettier
5. **Type Checking :** TypeScript strict

## 8. ROADMAP DE DÉVELOPPEMENT

### Phase 1 : Fondations (✅ Terminé)
- Architecture de base
- Système d'authentification
- Moteur Wahoo
- Types TypeScript

### Phase 2 : Composants Core (✅ Terminé)
- MascotWardrobe ✅
- Inventaire Garde-Robe (50 items) ✅
- SyllabieModuleVisualizer ✅
- TutorialService ✅
- EducationalDashboard ✅ (avec hooks d'intégration)
- Hooks d'intégration (useWahooEngine, useMascotData, useStudentData) ✅
- MysteryWordGame ✅ (avec service d'intégration)
- MysteryWordService ✅ (progression, achievements, rapports pédagogiques)

### Phase 3 : Intégration Avancée
- LessonEngine
- Pont d'Événements
- Optimisations de performance
- Tests E2E

### Phase 4 : Production
- Déploiement
- Monitoring
- Analytics
- Documentation utilisateur

## 9. MÉTRIQUES DE SUCCÈS

### Techniques
- Temps de chargement < 2s
- Score Lighthouse > 90
- Couverture de tests > 95%
- Zero erreurs TypeScript

### Pédagogiques
- Engagement utilisateur > 80%
- Rétention à 30 jours > 60%
- Progression académique mesurable
- Feedback positif des enseignants

### Business
- Adoption par les écoles
- Satisfaction utilisateur > 4.5/5
- Réduction du temps d'apprentissage
- Impact sur les résultats scolaires

## 10. RESSOURCES ET RÉFÉRENCES

### Documentation
- `CP2025_README.md` - Documentation complète du système CP2025
- `TEST_STATUS.md` - État des tests et qualité
- `PRODUCTION_DEPLOYMENT.md` - Guide de déploiement

### Outils et Technologies
- **Frontend :** React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend :** Node.js, Fastify, Drizzle ORM, MySQL
- **Tests :** Vitest, React Testing Library
- **Deployment :** Docker, Nginx, PM2

### Standards et Conventions
- **Code Style :** Airbnb ESLint config
- **Git :** Conventional Commits
- **API :** REST avec OpenAPI/Swagger
- **Database :** Normalisation 3NF

---

**Note :** Ce document est la source de vérité unique pour le développement. Toute modification doit être validée et documentée ici. 