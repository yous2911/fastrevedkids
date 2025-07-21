import { WahooContext, WahooFeedback, WahooIntensity } from '../types/wahoo.types';

// ==========================================
// WAHOO ENGINE - MOTEUR DE RÉCOMPENSES COGNITIVES
// ==========================================

export class WahooEngine {
  private context: WahooContext;
  private rules: WahooRule[];

  constructor(initialContext?: Partial<WahooContext>) {
    this.context = {
      streak: 0,
      totalCorrect: 0,
      difficulty: 'easy',
      studentEnergy: 100,
      lastWahooIntensity: 'subtle',
      sessionDuration: 0,
      consecutiveErrors: 0,
      averageResponseTime: 0,
      engagementLevel: 'medium',
      ...initialContext
    };

    this.rules = this.initializeRules();
  }

  // ==========================================
  // RÈGLES DE RÉCOMPENSES
  // ==========================================

  private initializeRules(): WahooRule[] {
    return [
      // Règle 1: Streak épique
      {
        condition: (ctx) => ctx.streak >= 10 && ctx.studentEnergy > 70,
        action: () => this.createEpicStreakFeedback(),
        priority: 10
      },

      // Règle 2: Premier succès de la session
      {
        condition: (ctx) => ctx.totalCorrect === 1 && ctx.sessionDuration < 5,
        action: () => this.createWelcomeFeedback(),
        priority: 9
      },

      // Règle 3: Récupération après erreurs
      {
        condition: (ctx) => ctx.consecutiveErrors >= 3 && ctx.studentEnergy < 50,
        action: () => this.createEncouragementFeedback(),
        priority: 8
      },

      // Règle 4: Performance exceptionnelle
      {
        condition: (ctx) => ctx.averageResponseTime < 2 && ctx.streak >= 5,
        action: () => this.createSpeedMasterFeedback(),
        priority: 7
      },

      // Règle 5: Difficulté croissante
      {
        condition: (ctx) => ctx.difficulty === 'hard' && ctx.streak >= 3,
        action: () => this.createChallengeMasterFeedback(),
        priority: 6
      },

      // Règle 6: Énergie faible
      {
        condition: (ctx) => ctx.studentEnergy < 30,
        action: () => this.createEnergyBoostFeedback(),
        priority: 5
      },

      // Règle 7: Streak standard
      {
        condition: (ctx) => ctx.streak >= 3 && ctx.streak < 10,
        action: () => this.createStandardStreakFeedback(),
        priority: 4
      },

      // Règle 8: Réponse correcte basique
      {
        condition: (ctx) => ctx.totalCorrect > 0,
        action: () => this.createBasicSuccessFeedback(),
        priority: 1
      }
    ];
  }

  // ==========================================
  // MÉTHODES PRINCIPALES
  // ==========================================

  /**
   * Évalue une réponse et génère le feedback approprié
   */
  evaluateResponse(isCorrect: boolean, responseTime: number): WahooFeedback {
    // Mettre à jour le contexte
    this.updateContext(isCorrect, responseTime);

    // Trouver la règle applicable avec la priorité la plus élevée
    const applicableRule = this.rules
      .filter(rule => rule.condition(this.context))
      .sort((a, b) => b.priority - a.priority)[0];

    if (applicableRule) {
      const feedback = applicableRule.action();
      this.context.lastWahooIntensity = feedback.intensity;
      return feedback;
    }

    // Feedback par défaut
    return this.createDefaultFeedback();
  }

  /**
   * Met à jour le contexte de l'élève
   */
  private updateContext(isCorrect: boolean, responseTime: number): void {
    if (isCorrect) {
      this.context.totalCorrect++;
      this.context.streak++;
      this.context.consecutiveErrors = 0;
      this.context.studentEnergy = Math.min(100, this.context.studentEnergy + 5);
    } else {
      this.context.streak = 0;
      this.context.consecutiveErrors++;
      this.context.studentEnergy = Math.max(0, this.context.studentEnergy - 10);
    }

    // Mettre à jour le temps de réponse moyen
    this.context.averageResponseTime = 
      (this.context.averageResponseTime * (this.context.totalCorrect - 1) + responseTime) / this.context.totalCorrect;

    // Mettre à jour le niveau d'engagement
    this.updateEngagementLevel();
  }

  /**
   * Met à jour le niveau d'engagement basé sur les métriques
   */
  private updateEngagementLevel(): void {
    const engagementScore = 
      (this.context.streak * 10) + 
      (this.context.studentEnergy * 0.5) + 
      (this.context.totalCorrect * 2) - 
      (this.context.consecutiveErrors * 5);

    if (engagementScore > 80) {
      this.context.engagementLevel = 'high';
    } else if (engagementScore > 40) {
      this.context.engagementLevel = 'medium';
    } else {
      this.context.engagementLevel = 'low';
    }
  }

  // ==========================================
  // GÉNÉRATEURS DE FEEDBACK
  // ==========================================

  private createEpicStreakFeedback(): WahooFeedback {
    return {
      intensity: 'epic',
      message: '🎉 INCROYABLE ! Tu es en feu ! 🔥',
      visualEffect: 'epic-explosion',
      soundEffect: 'epic-victory',
      points: 50,
      animation: 'epic-bounce'
    };
  }

  private createWelcomeFeedback(): WahooFeedback {
    return {
      intensity: 'standard',
      message: '🌟 Bienvenue ! Commençons l\'aventure !',
      visualEffect: 'welcome-sparkle',
      soundEffect: 'welcome-chime',
      points: 10,
      animation: 'gentle-fade-in'
    };
  }

  private createEncouragementFeedback(): WahooFeedback {
    return {
      intensity: 'subtle',
      message: '💪 Ne lâche rien ! Tu vas y arriver !',
      visualEffect: 'gentle-glow',
      soundEffect: 'encouragement',
      points: 5,
      animation: 'soft-pulse'
    };
  }

  private createSpeedMasterFeedback(): WahooFeedback {
    return {
      intensity: 'standard',
      message: '⚡ Tu es rapide comme l\'éclair !',
      visualEffect: 'speed-trail',
      soundEffect: 'speed-whoosh',
      points: 25,
      animation: 'quick-flash'
    };
  }

  private createChallengeMasterFeedback(): WahooFeedback {
    return {
      intensity: 'standard',
      message: '🏆 Maître des défis !',
      visualEffect: 'trophy-glow',
      soundEffect: 'achievement',
      points: 30,
      animation: 'trophy-bounce'
    };
  }

  private createEnergyBoostFeedback(): WahooFeedback {
    return {
      intensity: 'subtle',
      message: '🔋 Un petit coup de boost !',
      visualEffect: 'energy-spark',
      soundEffect: 'energy-boost',
      points: 15,
      animation: 'energy-wave'
    };
  }

  private createStandardStreakFeedback(): WahooFeedback {
    return {
      intensity: 'standard',
      message: '🎯 Excellente série ! Continue !',
      visualEffect: 'streak-fire',
      soundEffect: 'streak-success',
      points: 20,
      animation: 'streak-bounce'
    };
  }

  private createBasicSuccessFeedback(): WahooFeedback {
    return {
      intensity: 'subtle',
      message: '✅ Bravo !',
      visualEffect: 'success-check',
      soundEffect: 'success-chime',
      points: 10,
      animation: 'check-mark'
    };
  }

  private createDefaultFeedback(): WahooFeedback {
    return {
      intensity: 'subtle',
      message: '👍 Continue comme ça !',
      visualEffect: 'default-glow',
      soundEffect: 'default-chime',
      points: 5,
      animation: 'gentle-pulse'
    };
  }

  // ==========================================
  // MÉTHODES UTILITAIRES
  // ==========================================

  /**
   * Obtient le contexte actuel
   */
  getContext(): WahooContext {
    return { ...this.context };
  }

  /**
   * Met à jour la difficulté
   */
  setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.context.difficulty = difficulty;
  }

  /**
   * Met à jour la durée de session
   */
  updateSessionDuration(minutes: number): void {
    this.context.sessionDuration = minutes;
  }

  /**
   * Réinitialise le contexte pour une nouvelle session
   */
  resetSession(): void {
    this.context.streak = 0;
    this.context.consecutiveErrors = 0;
    this.context.sessionDuration = 0;
    this.context.lastWahooIntensity = 'subtle';
  }

  /**
   * Obtient les statistiques de performance
   */
  getPerformanceStats() {
    return {
      totalCorrect: this.context.totalCorrect,
      currentStreak: this.context.streak,
      averageResponseTime: this.context.averageResponseTime,
      engagementLevel: this.context.engagementLevel,
      studentEnergy: this.context.studentEnergy
    };
  }
}

// ==========================================
// TYPES INTERNES
// ==========================================

interface WahooRule {
  condition: (context: WahooContext) => boolean;
  action: () => WahooFeedback;
  priority: number;
}

// ==========================================
// INSTANCE GLOBALE
// ==========================================

export const wahooEngine = new WahooEngine(); 