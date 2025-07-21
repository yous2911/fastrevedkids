import { MysteryWordGame } from '../types/wahoo.types';

// Interface pour les données de progression du jeu
export interface MysteryWordProgress {
  totalWordsCompleted: number;
  totalScore: number;
  wordsByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  averageAccuracy: number;
  longestStreak: number;
  currentStreak: number;
  hintsUsed: number;
  vocabularyExpansion: string[];
}

// Service pour gérer les mots mystères
export class MysteryWordService {
  private static instance: MysteryWordService;
  private progress: MysteryWordProgress;

  private constructor() {
    this.progress = {
      totalWordsCompleted: 0,
      totalScore: 0,
      wordsByDifficulty: { easy: 0, medium: 0, hard: 0 },
      averageAccuracy: 0,
      longestStreak: 0,
      currentStreak: 0,
      hintsUsed: 0,
      vocabularyExpansion: []
    };
  }

  static getInstance(): MysteryWordService {
    if (!MysteryWordService.instance) {
      MysteryWordService.instance = new MysteryWordService();
    }
    return MysteryWordService.instance;
  }

  // Récupérer la progression
  getProgress(): MysteryWordProgress {
    return { ...this.progress };
  }

  // Enregistrer une partie terminée
  recordGameCompletion(
    word: string,
    difficulty: 'easy' | 'medium' | 'hard',
    score: number,
    hintsUsed: number,
    accuracy: number
  ): void {
    this.progress.totalWordsCompleted++;
    this.progress.totalScore += score;
    this.progress.wordsByDifficulty[difficulty]++;
    this.progress.hintsUsed += hintsUsed;
    this.progress.currentStreak++;

    // Mettre à jour la précision moyenne
    const totalGames = this.progress.totalWordsCompleted;
    this.progress.averageAccuracy = 
      ((this.progress.averageAccuracy * (totalGames - 1)) + accuracy) / totalGames;

    // Mettre à jour la série la plus longue
    if (this.progress.currentStreak > this.progress.longestStreak) {
      this.progress.longestStreak = this.progress.currentStreak;
    }

    // Ajouter le mot au vocabulaire si pas déjà présent
    if (!this.progress.vocabularyExpansion.includes(word)) {
      this.progress.vocabularyExpansion.push(word);
    }

    // Sauvegarder dans le localStorage
    this.saveProgress();
  }

  // Enregistrer une défaite
  recordGameLoss(word: string, difficulty: 'easy' | 'medium' | 'hard'): void {
    this.progress.currentStreak = 0;
    this.saveProgress();
  }

  // Calculer les compétences développées
  getDevelopedSkills(): string[] {
    const skills: string[] = [];

    if (this.progress.totalWordsCompleted > 10) {
      skills.push('Développement du vocabulaire');
    }

    if (this.progress.averageAccuracy > 0.8) {
      skills.push('Excellence en déduction logique');
    }

    if (this.progress.longestStreak > 5) {
      skills.push('Persévérance et concentration');
    }

    if (this.progress.wordsByDifficulty.hard > 5) {
      skills.push('Maîtrise des mots complexes');
    }

    return skills;
  }

  // Obtenir les recommandations pédagogiques
  getEducationalRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.progress.averageAccuracy < 0.6) {
      recommendations.push('Suggérer des mots plus simples pour renforcer la confiance');
    }

    if (this.progress.hintsUsed > this.progress.totalWordsCompleted * 0.5) {
      recommendations.push('Encourager la déduction avant d\'utiliser les indices');
    }

    if (this.progress.wordsByDifficulty.easy > this.progress.wordsByDifficulty.hard * 2) {
      recommendations.push('Proposer plus de défis difficiles pour stimuler la progression');
    }

    return recommendations;
  }

  // Générer un rapport pour les parents/enseignants
  generateEducationalReport(): {
    summary: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  } {
    const skills = this.getDevelopedSkills();
    const recommendations = this.getEducationalRecommendations();

    let summary = `L'enfant a résolu ${this.progress.totalWordsCompleted} mots mystères avec une précision de ${(this.progress.averageAccuracy * 100).toFixed(1)}%. `;
    
    if (this.progress.currentStreak > 0) {
      summary += `Il maintient actuellement une série de ${this.progress.currentStreak} succès consécutifs.`;
    }

    const areasForImprovement: string[] = [];
    if (this.progress.averageAccuracy < 0.7) {
      areasForImprovement.push('Améliorer la précision dans la déduction des lettres');
    }
    if (this.progress.hintsUsed > this.progress.totalWordsCompleted * 0.3) {
      areasForImprovement.push('Réduire la dépendance aux indices');
    }

    return {
      summary,
      strengths: skills,
      areasForImprovement,
      recommendations
    };
  }

  // Intégration avec le Moteur Wahoo
  getWahooContext(): {
    mysteryWordsCompleted: number;
    currentStreak: number;
    averageAccuracy: number;
    vocabularySize: number;
  } {
    return {
      mysteryWordsCompleted: this.progress.totalWordsCompleted,
      currentStreak: this.progress.currentStreak,
      averageAccuracy: this.progress.averageAccuracy,
      vocabularySize: this.progress.vocabularyExpansion.length
    };
  }

  // Vérifier les achievements
  checkAchievements(): Array<{
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
    progress: number;
    maxProgress: number;
  }> {
    const achievements = [
      {
        id: 'first_word',
        title: 'Premier Mot Découvert',
        description: 'Résoudre son premier mot mystère',
        unlocked: this.progress.totalWordsCompleted >= 1,
        progress: Math.min(this.progress.totalWordsCompleted, 1),
        maxProgress: 1
      },
      {
        id: 'vocabulary_master',
        title: 'Maître du Vocabulaire',
        description: 'Résoudre 20 mots différents',
        unlocked: this.progress.totalWordsCompleted >= 20,
        progress: Math.min(this.progress.totalWordsCompleted, 20),
        maxProgress: 20
      },
      {
        id: 'perfect_detective',
        title: 'Détective Parfait',
        description: 'Maintenir une précision de 90% sur 10 mots',
        unlocked: this.progress.averageAccuracy >= 0.9 && this.progress.totalWordsCompleted >= 10,
        progress: Math.min(this.progress.averageAccuracy * 100, 90),
        maxProgress: 90
      },
      {
        id: 'streak_champion',
        title: 'Champion des Séries',
        description: 'Maintenir une série de 10 succès consécutifs',
        unlocked: this.progress.longestStreak >= 10,
        progress: Math.min(this.progress.longestStreak, 10),
        maxProgress: 10
      }
    ];

    return achievements;
  }

  // Sauvegarder la progression
  private saveProgress(): void {
    try {
      localStorage.setItem('mysteryWordProgress', JSON.stringify(this.progress));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la progression:', error);
    }
  }

  // Charger la progression
  loadProgress(): void {
    try {
      const saved = localStorage.getItem('mysteryWordProgress');
      if (saved) {
        this.progress = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la progression:', error);
    }
  }

  // Réinitialiser la progression (pour les tests)
  resetProgress(): void {
    this.progress = {
      totalWordsCompleted: 0,
      totalScore: 0,
      wordsByDifficulty: { easy: 0, medium: 0, hard: 0 },
      averageAccuracy: 0,
      longestStreak: 0,
      currentStreak: 0,
      hintsUsed: 0,
      vocabularyExpansion: []
    };
    localStorage.removeItem('mysteryWordProgress');
  }
}

// Hook pour utiliser le service
export const useMysteryWordService = () => {
  const service = MysteryWordService.getInstance();
  
  return {
    getProgress: () => service.getProgress(),
    recordGameCompletion: service.recordGameCompletion.bind(service),
    recordGameLoss: service.recordGameLoss.bind(service),
    getDevelopedSkills: () => service.getDevelopedSkills(),
    getEducationalRecommendations: () => service.getEducationalRecommendations(),
    generateEducationalReport: () => service.generateEducationalReport(),
    getWahooContext: () => service.getWahooContext(),
    checkAchievements: () => service.checkAchievements(),
    resetProgress: () => service.resetProgress()
  };
}; 