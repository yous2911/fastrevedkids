// ==========================================
// WAHOO ENGINE TYPES
// ==========================================

export interface WahooContext {
  streak: number;
  totalCorrect: number;
  difficulty: 'easy' | 'medium' | 'hard';
  studentEnergy: number; // 0-100
  lastWahooIntensity: 'subtle' | 'standard' | 'epic';
  sessionDuration: number; // minutes
  consecutiveErrors: number;
  averageResponseTime: number; // seconds
  engagementLevel: 'low' | 'medium' | 'high';
}

export type WahooIntensity = 'subtle' | 'standard' | 'epic';

export interface WahooFeedback {
  intensity: WahooIntensity;
  message: string;
  visualEffect?: string;
  soundEffect?: string;
  points: number;
  animation?: string;
}

// ==========================================
// TUTORIAL SYSTEM TYPES
// ==========================================

export interface Tutorial {
  type: 'voice_guide' | 'visual_guide' | 'interactive_guide';
  voice_id?: string;
  script: string;
  animation?: string;
  duration?: number; // seconds
  skipable?: boolean;
}

export interface TutorialStep {
  step: number;
  action: string;
  target: string;
  duration: number;
  easing: string;
  voiceover?: {
    text: string;
    timing: number;
  };
}

// ==========================================
// ACHIEVEMENT SYSTEM TYPES
// ==========================================

export interface AchievementTrigger {
  type: 'consecutive_success_in_module' | 'perfect_streak' | 'module_completion' | 'skill_mastery';
  count: number;
  moduleId?: string;
  skillCode?: string;
}

export interface AchievementReward {
  type: 'UNLOCK_ITEM' | 'WAHOO_BONUS' | 'BADGE' | 'SPECIAL_ANIMATION';
  item_id?: string;
  name?: string;
  rarity?: MascotItem['rarity'];
  description?: string;
  wahooMultiplier?: number;
  points?: number;
}

export interface ModuleAchievement {
  trigger: AchievementTrigger;
  reward: AchievementReward;
  unlocked?: boolean;
  unlockDate?: string;
}

// ==========================================
// ENHANCED MODULE TYPES
// ==========================================

export interface WahooModule {
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
  metadata?: {
    estimatedDuration: number; // minutes
    difficulty: 'easy' | 'medium' | 'hard';
    skillsCovered: string[];
  };
}

export interface ExerciseSeries {
  seriesId: string;
  exercises: WahooExercise[];
  metadata?: {
    progression: 'linear' | 'adaptive' | 'branching';
    unlockCondition?: string;
  };
}

// ==========================================
// ENHANCED EXERCISE TYPES
// ==========================================

export interface WahooExercise {
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
    storyContext?: string;
    wahooMultiplier?: number;
    unlockableItem?: string;
  };
}

export interface ExerciseConfiguration {
  question: string;
  bonneReponse: any;
  choix?: string[];
  words?: string[];
  operation?: string;
  resultat?: number;
  hints?: string[];
  timeLimit?: number;
  maxAttempts?: number;
  [key: string]: any; // Pour les configurations spécifiques
}

// ==========================================
// MASCOT SYSTEM TYPES
// ==========================================

export interface MascotItem {
  id: string;
  name: string;
  type: 'hat' | 'glasses' | 'accessory' | 'outfit' | 'background';
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockCondition: string;
  description: string;
  unlocked: boolean;
  equipped: boolean;
  imageUrl?: string;
  unlockDate?: string;
}

export interface MascotCollection {
  items: MascotItem[];
  equippedItems: {
    hat?: string;
    glasses?: string;
    accessory?: string;
    outfit?: string;
    background?: string;
  };
  totalItems: number;
  unlockedItems: number;
  rarityBreakdown: Record<MascotItem['rarity'], number>;
}

// ==========================================
// ANIMATED LESSON TYPES
// ==========================================

export interface AnimatedLesson {
  lessonId: string;
  title: string;
  problem: {
    type: string;
    description: string;
    visualElements?: string[];
  };
  voiceover: {
    provider: string;
    voice_id: string;
    script: Array<{
      text: string;
      timing: number;
      animation?: string;
    }>;
  };
  animation_steps: Array<{
    step: number;
    action: string;
    target: string;
    duration: number;
    easing: string;
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>;
  metadata: {
    duration: number; // minutes
    difficulty: 'easy' | 'medium' | 'hard';
    prerequisites: string[];
    learningObjectives: string[];
  };
}

// ==========================================
// EDUCATIONAL DASHBOARD TYPES
// ==========================================

export interface EducationalMetrics {
  academicProgress: {
    overallScore: number;
    subjectScores: Record<string, number>;
    competenceMastery: Record<string, number>;
    recentImprovements: string[];
  };
  engagementMetrics: {
    sessionDuration: number;
    exercisesCompleted: number;
    streakDays: number;
    engagementScore: number;
  };
  cognitiveInsights: {
    learningStyle: 'visual' | 'auditory' | 'kinesthetic';
    strengthAreas: string[];
    challengeAreas: string[];
    recommendedFocus: string[];
  };
  wahooAnalytics: {
    totalWahooPoints: number;
    wahooIntensityDistribution: Record<WahooIntensity, number>;
    motivationTrends: number[];
    rewardEffectiveness: number;
  };
}

// ==========================================
// GAME MODULE TYPES
// ==========================================

export interface MysteryWordGame {
  targetWord: string;
  hints: string[];
  maxAttempts: number;
  letterPool: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: string;
  unlockableReward?: string;
}

export interface SequencingTask {
  sequence: string[];
  shuffledSequence: string[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
  hints: string[];
}

// ==========================================
// EVENT BRIDGE TYPES
// ==========================================

export interface LessonEngineEvent {
  type: 'lesson_start' | 'lesson_pause' | 'lesson_resume' | 'lesson_complete' | 'quiz_answer';
  data: any;
  timestamp: number;
}

// ==========================================
// EDUCATIONAL DASHBOARD TYPES
// ==========================================

export interface StudentMetrics {
  id: string;
  name: string;
  age: number;
  // Métriques ludiques
  streakCurrent: number;
  totalExercises: number;
  mascotHappiness: number;
  unlockedItems: string[];
  mysteryWordsCompleted: number;
  wahooIntensityHistory: string[];
  
  // Traduction pédagogique
  educationalInsights: {
    masteredConcepts: string[];
    strugglingAreas: string[];
    confidenceLevel: 'low' | 'medium' | 'high';
    cognitiveLoad: 'optimal' | 'under-challenged' | 'overwhelmed';
    engagementPattern: string;
    learningVelocity: number;
  };
}

export interface CompetencyMapping {
  [key: string]: {
    description: string;
    gameMetric: string;
    educationalValue: string;
    parentExplanation: string;
  };
}

// ==========================================
// STYLING CONSTANTS
// ==========================================

export const WAHOO_COLORS = {
  violet: '#8A2BE2',
  blue: '#00BFFF',
  green: '#00FF7F',
  yellow: '#FFD700',
} as const;

export const WAHOO_ANIMATIONS = {
  timing: {
    smooth: '0.3s',
    magical: '0.5s',
    epic: '0.8s',
  },
  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    magical: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    epic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const; 