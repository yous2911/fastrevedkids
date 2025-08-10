import { Tutorial, ModuleAchievement, AchievementTrigger } from '../types/wahoo.types';

// ==========================================
// TUTORIAL SERVICE - Gestion des Guides
// ==========================================

export class TutorialService {
  private activeTutorial: Tutorial | null = null;
  private tutorialHistory: string[] = [];

  /**
   * Démarrer un tutoriel
   */
  startTutorial(tutorial: Tutorial): void {
    this.activeTutorial = tutorial;
    this.tutorialHistory.push(tutorial.script);
    
    // Simuler le démarrage audio
    if (tutorial.voice_id) {
      this.playVoiceover(tutorial.voice_id, tutorial.script);
    }

    // Déclencher l'animation si présente
    if (tutorial.animation) {
      this.triggerAnimation(tutorial.animation);
    }

    console.log(`🎤 Tutorial started: ${tutorial.type} - "${tutorial.script}"`);
  }

  /**
   * Arrêter le tutoriel actuel
   */
  stopTutorial(): void {
    if (this.activeTutorial) {
      console.log(`⏹️ Tutorial stopped: ${this.activeTutorial.script}`);
      this.activeTutorial = null;
    }
  }

  /**
   * Vérifier si un tutoriel est actif
   */
  isTutorialActive(): boolean {
    return this.activeTutorial !== null;
  }

  /**
   * Obtenir le tutoriel actuel
   */
  getActiveTutorial(): Tutorial | null {
    return this.activeTutorial;
  }

  /**
   * Simuler la lecture audio
   */
  private playVoiceover(voiceId: string, script: string): void {
    console.log(`🔊 Playing voiceover: ${voiceId} - "${script}"`);
    // Intégration future avec un service TTS
  }

  /**
   * Déclencher une animation
   */
  private triggerAnimation(animationName: string): void {
    console.log(`🎬 Triggering animation: ${animationName}`);
    // Intégration future avec Framer Motion
  }

  /**
   * Obtenir l'historique des tutoriels
   */
  getTutorialHistory(): string[] {
    return [...this.tutorialHistory];
  }
}

// ==========================================
// ACHIEVEMENT SERVICE - Gestion des Récompenses
// ==========================================

export class AchievementService {
  private unlockedAchievements: Set<string> = new Set();
  private moduleProgress: Map<string, number> = new Map();

  /**
   * Vérifier et débloquer les achievements
   */
  checkAchievements(
    moduleId: string,
    achievements: ModuleAchievement[],
    currentStreak: number,
    totalCorrect: number
  ): ModuleAchievement[] {
    const newlyUnlocked: ModuleAchievement[] = [];

    achievements.forEach(achievement => {
      if (!this.unlockedAchievements.has(achievement.trigger.type + moduleId)) {
        if (this.evaluateTrigger(achievement.trigger, currentStreak, totalCorrect, moduleId)) {
          this.unlockAchievement(achievement, moduleId);
          newlyUnlocked.push(achievement);
        }
      }
    });

    return newlyUnlocked;
  }

  /**
   * Évaluer si un trigger est activé
   */
  private evaluateTrigger(
    trigger: AchievementTrigger,
    currentStreak: number,
    totalCorrect: number,
    moduleId: string
  ): boolean {
    switch (trigger.type) {
      case 'consecutive_success_in_module':
        return currentStreak >= trigger.count;
      
      case 'perfect_streak':
        return currentStreak >= trigger.count && this.moduleProgress.get(moduleId) === 100;
      
      case 'module_completion':
        return this.moduleProgress.get(moduleId) === 100;
      
      case 'skill_mastery':
        // Logique pour la maîtrise de compétence
        return totalCorrect >= trigger.count;
      
      default:
        return false;
    }
  }

  /**
   * Débloquer un achievement
   */
  private unlockAchievement(achievement: ModuleAchievement, moduleId: string): void {
    const achievementKey = achievement.trigger.type + moduleId;
    this.unlockedAchievements.add(achievementKey);
    
    achievement.unlocked = true;
    achievement.unlockDate = new Date().toISOString();

    console.log(`🏆 Achievement unlocked: ${achievement.reward.name}`);
    
    // Déclencher l'animation de célébration
    this.triggerAchievementCelebration(achievement);
  }

  /**
   * Déclencher la célébration d'achievement
   */
  private triggerAchievementCelebration(achievement: ModuleAchievement): void {
    const CELEBRATION = {
      type: 'achievement_unlock',
      achievement: achievement,
      animation: 'epic_explosion',
      sound: 'achievement_fanfare',
      haptic: 'victory_dance'
    };

    console.log(`🎉 Achievement CELEBRATION: ${CELEBRATION}`);
    
    window.dispatchEvent(new CustomEvent('achievement-unlocked', {
      detail: CELEBRATION
    }));
  }

  /**
   * Mettre à jour la progression d'un module
   */
  updateModuleProgress(moduleId: string, progress: number): void {
    this.moduleProgress.set(moduleId, progress);
  }

  /**
   * Obtenir la progression d'un module
   */
  getModuleProgress(moduleId: string): number {
    return this.moduleProgress.get(moduleId) || 0;
  }

  /**
   * Vérifier si un achievement est débloqué
   */
  isAchievementUnlocked(triggerType: string, moduleId: string): boolean {
    return this.unlockedAchievements.has(triggerType + moduleId);
  }

  /**
   * Obtenir tous les achievements débloqués
   */
  getUnlockedAchievements(): string[] {
    return Array.from(this.unlockedAchievements);
  }

  /**
   * Réinitialiser les achievements (pour les tests)
   */
  resetAchievements(): void {
    this.unlockedAchievements.clear();
    this.moduleProgress.clear();
  }
}

// ==========================================
// MODULE PROGRESSION SERVICE
// ==========================================

export class ModuleProgressionService {
  private moduleStates: Map<string, {
    currentStep: number;
    completedSteps: Set<number>;
    exerciseProgress: Map<number, boolean>;
    totalExercises: number;
  }> = new Map();

  /**
   * Initialiser un module
   */
  initializeModule(moduleId: string, totalExercises: number): void {
    this.moduleStates.set(moduleId, {
      currentStep: 0,
      completedSteps: new Set(),
      exerciseProgress: new Map(),
      totalExercises
    });
  }

  /**
   * Marquer un exercice comme complété
   */
  completeExercise(moduleId: string, exerciseId: number): void {
    const moduleState = this.moduleStates.get(moduleId);
    if (moduleState) {
      moduleState.exerciseProgress.set(exerciseId, true);
      this.updateModuleProgress(moduleId);
    }
  }

  /**
   * Mettre à jour la progression du module
   */
  private updateModuleProgress(moduleId: string): void {
    const moduleState = this.moduleStates.get(moduleId);
    if (moduleState) {
      const completedExercises = Array.from(moduleState.exerciseProgress.values()).filter(Boolean).length;
      const progress = (completedExercises / moduleState.totalExercises) * 100;
      
      // Mettre à jour le service d'achievements
      const achievementService = new AchievementService();
      achievementService.updateModuleProgress(moduleId, progress);
    }
  }

  /**
   * Obtenir la progression d'un module
   */
  getModuleProgress(moduleId: string): {
    currentStep: number;
    completedSteps: number;
    totalSteps: number;
    progress: number;
  } {
    const moduleState = this.moduleStates.get(moduleId);
    if (!moduleState) {
      return { currentStep: 0, completedSteps: 0, totalSteps: 0, progress: 0 };
    }

    const completedExercises = Array.from(moduleState.exerciseProgress.values()).filter(Boolean).length;
    const progress = (completedExercises / moduleState.totalExercises) * 100;

    return {
      currentStep: moduleState.currentStep,
      completedSteps: completedExercises,
      totalSteps: moduleState.totalExercises,
      progress
    };
  }

  /**
   * Passer à l'étape suivante
   */
  nextStep(moduleId: string): void {
    const moduleState = this.moduleStates.get(moduleId);
    if (moduleState) {
      moduleState.completedSteps.add(moduleState.currentStep);
      moduleState.currentStep++;
    }
  }

  /**
   * Vérifier si un exercice est complété
   */
  isExerciseCompleted(moduleId: string, exerciseId: number): boolean {
    const moduleState = this.moduleStates.get(moduleId);
    return moduleState?.exerciseProgress.get(exerciseId) || false;
  }
}

// ==========================================
// INSTANCES GLOBALES
// ==========================================

export const tutorialService = new TutorialService();
export const achievementService = new AchievementService();
export const moduleProgressionService = new ModuleProgressionService(); 
