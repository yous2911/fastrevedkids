// Sound Effects Configuration for RevEd Kids
// This file defines all sound effects used throughout the application

export interface SoundEffect {
  id: string;
  name: string;
  file: string;
  category: SoundCategory;
  volume: number;
  loop?: boolean;
  preload?: boolean;
  description: string;
}

export type SoundCategory = 
  | 'sparky'
  | 'buttons'
  | 'xp'
  | 'feedback'
  | 'exercises'
  | 'portal'
  | 'ambient'
  | 'ui'
  | 'session';

export type SoundType = keyof typeof SOUND_EFFECTS;

export const SOUND_EFFECTS: Record<string, SoundEffect> = {
  // 🎭 Sparky Mascot Sounds
  sparky_happy: {
    id: 'sparky_happy',
    name: 'Sparky Happy',
    file: '/sounds/sparky/sparky_happy.mp3',
    category: 'sparky',
    volume: 0.8,
    description: 'Sparky expressing joy and happiness'
  },
  sparky_excited: {
    id: 'sparky_excited',
    name: 'Sparky Excited',
    file: '/sounds/sparky/sparky_excited.mp3',
    category: 'sparky',
    volume: 0.8,
    description: 'Sparky showing excitement'
  },
  sparky_thinking: {
    id: 'sparky_thinking',
    name: 'Sparky Thinking',
    file: '/sounds/sparky/sparky_thinking.mp3',
    category: 'sparky',
    volume: 0.6,
    description: 'Sparky pondering and thinking'
  },
  sparky_celebrating: {
    id: 'sparky_celebrating',
    name: 'Sparky Celebrating',
    file: '/sounds/sparky/sparky_celebrating.mp3',
    category: 'sparky',
    volume: 0.9,
    description: 'Sparky celebrating achievements'
  },
  sparky_encouraging: {
    id: 'sparky_encouraging',
    name: 'Sparky Encouraging',
    file: '/sounds/sparky/sparky_encouraging.mp3',
    category: 'sparky',
    volume: 0.7,
    description: 'Sparky providing encouragement'
  },
  sparky_surprised: {
    id: 'sparky_surprised',
    name: 'Sparky Surprised',
    file: '/sounds/sparky/sparky_surprised.mp3',
    category: 'sparky',
    volume: 0.8,
    description: 'Sparky expressing surprise'
  },
  sparky_giggle: {
    id: 'sparky_giggle',
    name: 'Sparky Giggle',
    file: '/sounds/sparky/sparky_giggle.mp3',
    category: 'sparky',
    volume: 0.7,
    description: 'Sparky giggling playfully'
  },

  // 🎮 Button Interaction Sounds
  button_click: {
    id: 'button_click',
    name: 'Button Click',
    file: '/sounds/buttons/button_click.mp3',
    category: 'buttons',
    volume: 0.5,
    description: 'Standard button click sound'
  },
  button_hover: {
    id: 'button_hover',
    name: 'Button Hover',
    file: '/sounds/buttons/button_hover.mp3',
    category: 'buttons',
    volume: 0.3,
    description: 'Button hover effect sound'
  },
  button_success: {
    id: 'button_success',
    name: 'Button Success',
    file: '/sounds/buttons/button_success.mp3',
    category: 'buttons',
    volume: 0.7,
    description: 'Successful button action sound'
  },
  button_error: {
    id: 'button_error',
    name: 'Button Error',
    file: '/sounds/buttons/button_error.mp3',
    category: 'buttons',
    volume: 0.6,
    description: 'Error or invalid action sound'
  },
  button_magical: {
    id: 'button_magical',
    name: 'Magical Button',
    file: '/sounds/buttons/button_magical.mp3',
    category: 'buttons',
    volume: 0.8,
    description: 'Special magical button sound'
  },
  button_soft: {
    id: 'button_soft',
    name: 'Soft Button',
    file: '/sounds/buttons/button_soft.mp3',
    category: 'buttons',
    volume: 0.4,
    description: 'Gentle, soft button sound'
  },

  // ⭐ XP and Achievement Sounds
  xp_gain: {
    id: 'xp_gain',
    name: 'XP Gain',
    file: '/sounds/xp/xp_gain.mp3',
    category: 'xp',
    volume: 0.7,
    description: 'Experience points gained'
  },
  level_up: {
    id: 'level_up',
    name: 'Level Up',
    file: '/sounds/xp/level_up.mp3',
    category: 'xp',
    volume: 0.9,
    description: 'Student level increase'
  },
  achievement_unlock: {
    id: 'achievement_unlock',
    name: 'Achievement Unlocked',
    file: '/sounds/xp/achievement_unlock.mp3',
    category: 'xp',
    volume: 0.8,
    description: 'New achievement unlocked'
  },
  bonus_points: {
    id: 'bonus_points',
    name: 'Bonus Points',
    file: '/sounds/xp/bonus_points.mp3',
    category: 'xp',
    volume: 0.7,
    description: 'Bonus points awarded'
  },
  streak_bonus: {
    id: 'streak_bonus',
    name: 'Streak Bonus',
    file: '/sounds/xp/streak_bonus.mp3',
    category: 'xp',
    volume: 0.8,
    description: 'Streak bonus achieved'
  },
  badge_earned: {
    id: 'badge_earned',
    name: 'Badge Earned',
    file: '/sounds/xp/badge_earned.mp3',
    category: 'xp',
    volume: 0.8,
    description: 'New badge earned'
  },

  // 🎯 Feedback Sounds
  correct_answer: {
    id: 'correct_answer',
    name: 'Correct Answer',
    file: '/sounds/feedback/correct_answer.mp3',
    category: 'feedback',
    volume: 0.8,
    description: 'Positive feedback for correct answers'
  },
  incorrect_answer: {
    id: 'incorrect_answer',
    name: 'Incorrect Answer',
    file: '/sounds/feedback/incorrect_answer.mp3',
    category: 'feedback',
    volume: 0.6,
    description: 'Gentle feedback for incorrect answers'
  },
  perfect_score: {
    id: 'perfect_score',
    name: 'Perfect Score',
    file: '/sounds/feedback/perfect_score.mp3',
    category: 'feedback',
    volume: 0.9,
    description: 'Celebration for perfect scores'
  },
  good_job: {
    id: 'good_job',
    name: 'Good Job',
    file: '/sounds/feedback/good_job.mp3',
    category: 'feedback',
    volume: 0.7,
    description: 'Encouraging feedback'
  },
  try_again: {
    id: 'try_again',
    name: 'Try Again',
    file: '/sounds/feedback/try_again.mp3',
    category: 'feedback',
    volume: 0.5,
    description: 'Gentle encouragement to retry'
  },
  excellent: {
    id: 'excellent',
    name: 'Excellent',
    file: '/sounds/feedback/excellent.mp3',
    category: 'feedback',
    volume: 0.8,
    description: 'High praise for outstanding performance'
  },

  // 📚 Exercise Specific Sounds
  exercise_start: {
    id: 'exercise_start',
    name: 'Exercise Start',
    file: '/sounds/exercises/exercise_start.mp3',
    category: 'exercises',
    volume: 0.6,
    description: 'Beginning of an exercise'
  },
  exercise_complete: {
    id: 'exercise_complete',
    name: 'Exercise Complete',
    file: '/sounds/exercises/exercise_complete.mp3',
    category: 'exercises',
    volume: 0.8,
    description: 'Exercise completion sound'
  },
  hint_available: {
    id: 'hint_available',
    name: 'Hint Available',
    file: '/sounds/exercises/hint_available.mp3',
    category: 'exercises',
    volume: 0.5,
    description: 'Notification that a hint is available'
  },
  timer_warning: {
    id: 'timer_warning',
    name: 'Timer Warning',
    file: '/sounds/exercises/timer_warning.mp3',
    category: 'exercises',
    volume: 0.7,
    description: 'Time running out warning'
  },
  question_appear: {
    id: 'question_appear',
    name: 'Question Appear',
    file: '/sounds/exercises/question_appear.mp3',
    category: 'exercises',
    volume: 0.4,
    description: 'New question appearing'
  },
  answer_submit: {
    id: 'answer_submit',
    name: 'Answer Submit',
    file: '/sounds/exercises/answer_submit.mp3',
    category: 'exercises',
    volume: 0.5,
    description: 'Answer submission sound'
  },

  // 🌟 Portal and Navigation Sounds
  portal_open: {
    id: 'portal_open',
    name: 'Portal Open',
    file: '/sounds/portal/portal_open.mp3',
    category: 'portal',
    volume: 0.8,
    description: 'Opening a new learning section'
  },
  portal_close: {
    id: 'portal_close',
    name: 'Portal Close',
    file: '/sounds/portal/portal_close.mp3',
    category: 'portal',
    volume: 0.6,
    description: 'Closing a learning section'
  },
  page_transition: {
    id: 'page_transition',
    name: 'Page Transition',
    file: '/sounds/portal/page_transition.mp3',
    category: 'portal',
    volume: 0.4,
    description: 'Smooth page transition sound'
  },
  section_unlock: {
    id: 'section_unlock',
    name: 'Section Unlock',
    file: '/sounds/portal/section_unlock.mp3',
    category: 'portal',
    volume: 0.8,
    description: 'New section unlocked'
  },
  magic_sparkle: {
    id: 'magic_sparkle',
    name: 'Magic Sparkle',
    file: '/sounds/portal/magic_sparkle.mp3',
    category: 'portal',
    volume: 0.6,
    description: 'Magical sparkle effect'
  },

  // 🎵 Ambient and Background
  ambient_forest: {
    id: 'ambient_forest',
    name: 'Forest Ambience',
    file: '/sounds/ambient/forest.mp3',
    category: 'ambient',
    volume: 0.3,
    loop: true,
    description: 'Peaceful forest background'
  },
  ambient_ocean: {
    id: 'ambient_ocean',
    name: 'Ocean Ambience',
    file: '/sounds/ambient/ocean.mp3',
    category: 'ambient',
    volume: 0.3,
    loop: true,
    description: 'Calming ocean waves'
  },
  ambient_magical: {
    id: 'ambient_magical',
    name: 'Magical Ambience',
    file: '/sounds/ambient/magical.mp3',
    category: 'ambient',
    volume: 0.2,
    loop: true,
    description: 'Magical atmosphere sound'
  },

  // 🔊 UI Interaction Sounds
  notification: {
    id: 'notification',
    name: 'Notification',
    file: '/sounds/ui/notification.mp3',
    category: 'ui',
    volume: 0.6,
    description: 'General notification sound'
  },
  popup_open: {
    id: 'popup_open',
    name: 'Popup Open',
    file: '/sounds/ui/popup_open.mp3',
    category: 'ui',
    volume: 0.5,
    description: 'Modal or popup opening'
  },
  popup_close: {
    id: 'popup_close',
    name: 'Popup Close',
    file: '/sounds/ui/popup_close.mp3',
    category: 'ui',
    volume: 0.4,
    description: 'Modal or popup closing'
  },
  typing: {
    id: 'typing',
    name: 'Typing',
    file: '/sounds/ui/typing.mp3',
    category: 'ui',
    volume: 0.3,
    description: 'Text input typing sound'
  },
  swipe: {
    id: 'swipe',
    name: 'Swipe',
    file: '/sounds/ui/swipe.mp3',
    category: 'ui',
    volume: 0.4,
    description: 'Swipe gesture sound'
  },
  toggle_on: {
    id: 'toggle_on',
    name: 'Toggle On',
    file: '/sounds/ui/toggle_on.mp3',
    category: 'ui',
    volume: 0.5,
    description: 'Toggle switch on'
  },
  toggle_off: {
    id: 'toggle_off',
    name: 'Toggle Off',
    file: '/sounds/ui/toggle_off.mp3',
    category: 'ui',
    volume: 0.4,
    description: 'Toggle switch off'
  },
  session_timeout: {
    id: 'session_timeout',
    name: 'Session Timeout',
    file: '/sounds/ui/session_timeout.mp3',
    category: 'session',
    volume: 0.8,
    description: 'Sound played when a user session times out'
  }
};

// Sound categories with descriptions
export const SOUND_CATEGORIES: Record<SoundCategory, { name: string; description: string; color: string }> = {
  sparky: {
    name: 'Sparky Mascot',
    description: 'Sounds from our magical mascot Sparky',
    color: '#8A2BE2'
  },
  buttons: {
    name: 'Button Interactions',
    description: 'Click, hover, and interaction sounds',
    color: '#4F46E5'
  },
  xp: {
    name: 'XP & Achievements',
    description: 'Level ups, badges, and progression sounds',
    color: '#F59E0B'
  },
  feedback: {
    name: 'Learning Feedback',
    description: 'Correct, incorrect, and encouragement sounds',
    color: '#10B981'
  },
  exercises: {
    name: 'Exercise Events',
    description: 'Exercise-specific interaction sounds',
    color: '#EC4899'
  },
  portal: {
    name: 'Portal & Navigation',
    description: 'Section transitions and magical effects',
    color: '#8B5CF6'
  },
  ambient: {
    name: 'Ambient Sounds',
    description: 'Background atmosphere and environment sounds',
    color: '#06B6D4'
  },
  ui: {
    name: 'UI Interactions',
    description: 'General user interface sounds',
    color: '#6B7280'
  },
  session: {
    name: 'Session',
    description: 'Sounds related to user sessions and timeouts',
    color: '#EF4444'
  }
};

// Preload configuration
export const PRELOAD_SOUNDS = [
  'button_click',
  'button_hover',
  'correct_answer',
  'incorrect_answer',
  'sparky_happy',
  'sparky_encouraging',
  'notification',
  'exercise_start',
  'exercise_complete'
];

// Sound settings
export const SOUND_SETTINGS = {
  masterVolume: 1.0,
  enableSounds: true,
  enableHaptics: true,
  categories: {
    sparky: { enabled: true, volume: 1.0 },
    buttons: { enabled: true, volume: 0.8 },
    xp: { enabled: true, volume: 1.0 },
    feedback: { enabled: true, volume: 1.0 },
    exercises: { enabled: true, volume: 0.9 },
    portal: { enabled: true, volume: 0.8 },
    ambient: { enabled: true, volume: 0.4 },
    ui: { enabled: true, volume: 0.7 }
  }
};

// Helper functions
export const getSoundsByCategory = (category: SoundCategory): SoundEffect[] => {
  return Object.values(SOUND_EFFECTS).filter(sound => sound.category === category);
};

export const getSoundById = (id: string): SoundEffect | undefined => {
  return SOUND_EFFECTS[id];
};

export const getAllSoundCategories = (): SoundCategory[] => {
  return Object.keys(SOUND_CATEGORIES) as SoundCategory[];
}; 