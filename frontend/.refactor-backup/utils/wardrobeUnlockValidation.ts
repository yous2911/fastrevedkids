// Comprehensive wardrobe item unlock validation system
// This ensures secure and accurate validation of item unlock requirements

import { WARDROBE_ITEMS, WardrobeItem } from '../components/WardrobeData';
import { sanitizeTextInput, validateXPValue } from './securityValidation';

export interface StudentStats {
  xp: number;
  streak: number;
  exercisesCompleted: number;
  achievementsUnlocked: number;
}

export interface UnlockValidationResult {
  isUnlocked: boolean;
  reason?: string;
  requirement?: {
    type: string;
    current: number;
    required: number;
    progress: number; // Percentage completion
  };
  securityViolation?: boolean;
}

export interface UnlockAttempt {
  itemId: string;
  timestamp: number;
  studentId?: string;
  result: UnlockValidationResult;
}

// Rate limiting for unlock attempts
const unlockAttempts = new Map<string, UnlockAttempt[]>();
const MAX_UNLOCK_ATTEMPTS_PER_MINUTE = 20;

// Cache for unlock results to improve performance
const unlockResultCache = new Map<string, { result: UnlockValidationResult; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Security validation for student stats
const validateStudentStats = (stats: StudentStats): { isValid: boolean; sanitizedStats?: StudentStats; error?: string } => {
  // Validate XP
  const xpValidation = validateXPValue(stats.xp, 1000000);
  if (!xpValidation.isValid) {
    return { isValid: false, error: `Invalid XP: ${xpValidation.error}` };
  }

  // Validate streak
  const streakValidation = validateXPValue(stats.streak, 1000);
  if (!streakValidation.isValid) {
    return { isValid: false, error: `Invalid streak: ${streakValidation.error}` };
  }

  // Validate exercises completed
  const exercisesValidation = validateXPValue(stats.exercisesCompleted, 100000);
  if (!exercisesValidation.isValid) {
    return { isValid: false, error: `Invalid exercises: ${exercisesValidation.error}` };
  }

  // Validate achievements unlocked
  const achievementsValidation = validateXPValue(stats.achievementsUnlocked, 1000);
  if (!achievementsValidation.isValid) {
    return { isValid: false, error: `Invalid achievements: ${achievementsValidation.error}` };
  }

  // Cross-validation: ensure stats are reasonable
  const maxExpectedAchievements = Math.floor(stats.exercisesCompleted / 10); // Roughly 1 achievement per 10 exercises
  if (stats.achievementsUnlocked > maxExpectedAchievements + 50) { // Allow some flexibility
    return { isValid: false, error: 'Achievement count inconsistent with exercise completion' };
  }

  const maxExpectedXP = stats.exercisesCompleted * 100; // Roughly 100 XP per exercise
  if (stats.xp > maxExpectedXP + 10000) { // Allow bonus XP
    return { isValid: false, error: 'XP inconsistent with exercise completion' };
  }

  return {
    isValid: true,
    sanitizedStats: {
      xp: xpValidation.validatedValue,
      streak: streakValidation.validatedValue,
      exercisesCompleted: exercisesValidation.validatedValue,
      achievementsUnlocked: achievementsValidation.validatedValue
    }
  };
};

// Find wardrobe item by ID with security validation
const findWardrobeItem = (itemId: string): WardrobeItem | null => {
  // Sanitize item ID
  const sanitizedId = sanitizeTextInput(itemId, 50).sanitizedValue;
  if (!sanitizedId) {
    return null;
  }

  // Find item in the database
  const item = WARDROBE_ITEMS.find(item => item.id === sanitizedId);
  return item || null;
};

// Rate limiting check for unlock attempts
const checkUnlockRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const attempts = unlockAttempts.get(identifier) || [];
  
  // Remove attempts older than 1 minute
  const recentAttempts = attempts.filter(attempt => now - attempt.timestamp < 60000);
  unlockAttempts.set(identifier, recentAttempts);
  
  return recentAttempts.length < MAX_UNLOCK_ATTEMPTS_PER_MINUTE;
};

// Log unlock attempt for monitoring
const logUnlockAttempt = (itemId: string, result: UnlockValidationResult, studentId?: string): void => {
  const identifier = studentId || 'anonymous';
  const attempts = unlockAttempts.get(identifier) || [];
  
  attempts.push({
    itemId,
    timestamp: Date.now(),
    studentId,
    result
  });
  
  unlockAttempts.set(identifier, attempts);
};

// Core unlock validation function
export const validateItemUnlock = (
  itemId: string, 
  stats: StudentStats, 
  studentId?: string
): UnlockValidationResult => {
  const identifier = studentId || 'anonymous';
  
  // Rate limiting check
  if (!checkUnlockRateLimit(identifier)) {
    const result: UnlockValidationResult = {
      isUnlocked: false,
      reason: 'Too many unlock attempts. Please wait before trying again.',
      securityViolation: true
    };
    return result;
  }

  // Check cache first
  const cacheKey = `${itemId}-${JSON.stringify(stats)}`;
  const cached = unlockResultCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }

  // Validate student stats
  const statsValidation = validateStudentStats(stats);
  if (!statsValidation.isValid) {
    const result: UnlockValidationResult = {
      isUnlocked: false,
      reason: `Invalid student stats: ${statsValidation.error}`,
      securityViolation: true
    };
    logUnlockAttempt(itemId, result, studentId);
    return result;
  }

  const validatedStats = statsValidation.sanitizedStats!;

  // Find the wardrobe item
  const item = findWardrobeItem(itemId);
  if (!item) {
    const result: UnlockValidationResult = {
      isUnlocked: false,
      reason: 'Item not found',
      securityViolation: true
    };
    logUnlockAttempt(itemId, result, studentId);
    return result;
  }

  // Validate unlock requirement based on type
  let result: UnlockValidationResult;
  
  switch (item.unlockRequirement.type) {
    case 'xp':
      const xpProgress = Math.min((validatedStats.xp / item.unlockRequirement.value) * 100, 100);
      result = {
        isUnlocked: validatedStats.xp >= item.unlockRequirement.value,
        requirement: {
          type: 'XP',
          current: validatedStats.xp,
          required: item.unlockRequirement.value,
          progress: xpProgress
        },
        reason: validatedStats.xp >= item.unlockRequirement.value 
          ? undefined 
          : `Need ${item.unlockRequirement.value - validatedStats.xp} more XP`
      };
      break;

    case 'streak':
      const streakProgress = Math.min((validatedStats.streak / item.unlockRequirement.value) * 100, 100);
      result = {
        isUnlocked: validatedStats.streak >= item.unlockRequirement.value,
        requirement: {
          type: 'Streak',
          current: validatedStats.streak,
          required: item.unlockRequirement.value,
          progress: streakProgress
        },
        reason: validatedStats.streak >= item.unlockRequirement.value 
          ? undefined 
          : `Need ${item.unlockRequirement.value - validatedStats.streak} more days in streak`
      };
      break;

    case 'exercises':
      const exerciseProgress = Math.min((validatedStats.exercisesCompleted / item.unlockRequirement.value) * 100, 100);
      result = {
        isUnlocked: validatedStats.exercisesCompleted >= item.unlockRequirement.value,
        requirement: {
          type: 'Exercises',
          current: validatedStats.exercisesCompleted,
          required: item.unlockRequirement.value,
          progress: exerciseProgress
        },
        reason: validatedStats.exercisesCompleted >= item.unlockRequirement.value 
          ? undefined 
          : `Complete ${item.unlockRequirement.value - validatedStats.exercisesCompleted} more exercises`
      };
      break;

    case 'achievement':
      const achievementProgress = Math.min((validatedStats.achievementsUnlocked / item.unlockRequirement.value) * 100, 100);
      result = {
        isUnlocked: validatedStats.achievementsUnlocked >= item.unlockRequirement.value,
        requirement: {
          type: 'Achievements',
          current: validatedStats.achievementsUnlocked,
          required: item.unlockRequirement.value,
          progress: achievementProgress
        },
        reason: validatedStats.achievementsUnlocked >= item.unlockRequirement.value 
          ? undefined 
          : `Unlock ${item.unlockRequirement.value - validatedStats.achievementsUnlocked} more achievements`
      };
      break;

    default:
      result = {
        isUnlocked: false,
        reason: 'Unknown unlock requirement type',
        securityViolation: true
      };
  }

  // Cache the result
  unlockResultCache.set(cacheKey, { result, timestamp: Date.now() });

  // Log the attempt
  logUnlockAttempt(itemId, result, studentId);

  return result;
};

// Batch validation for multiple items (more efficient)
export const validateMultipleItemUnlocks = (
  itemIds: string[], 
  stats: StudentStats, 
  studentId?: string
): Map<string, UnlockValidationResult> => {
  const results = new Map<string, UnlockValidationResult>();
  
  // Validate stats once for all items
  const statsValidation = validateStudentStats(stats);
  if (!statsValidation.isValid) {
    const errorResult: UnlockValidationResult = {
      isUnlocked: false,
      reason: `Invalid student stats: ${statsValidation.error}`,
      securityViolation: true
    };
    
    // Return error for all items
    itemIds.forEach(itemId => results.set(itemId, errorResult));
    return results;
  }

  // Validate each item
  for (const itemId of itemIds) {
    const result = validateItemUnlock(itemId, stats, studentId);
    results.set(itemId, result);
  }

  return results;
};

// Get all unlocked items for a student
export const getUnlockedItems = (
  stats: StudentStats, 
  mascotType?: string, 
  studentId?: string
): WardrobeItem[] => {
  const statsValidation = validateStudentStats(stats);
  if (!statsValidation.isValid) {
    console.warn('Invalid student stats for unlock check:', statsValidation.error);
    return [];
  }

  return WARDROBE_ITEMS.filter(item => {
    // Check mascot compatibility if specified
    if (mascotType && item.mascotType && !item.mascotType.includes(mascotType)) {
      return false;
    }

    // Check unlock requirement
    const validation = validateItemUnlock(item.id, stats, studentId);
    return validation.isUnlocked && !validation.securityViolation;
  });
};

// Get items that are close to being unlocked (for progress indication)
export const getItemsNearUnlock = (
  stats: StudentStats, 
  progressThreshold: number = 75,
  mascotType?: string,
  studentId?: string
): Array<{ item: WardrobeItem; progress: number }> => {
  const statsValidation = validateStudentStats(stats);
  if (!statsValidation.isValid) {
    return [];
  }

  const nearUnlockItems: Array<{ item: WardrobeItem; progress: number }> = [];

  WARDROBE_ITEMS.forEach(item => {
    // Check mascot compatibility if specified
    if (mascotType && item.mascotType && !item.mascotType.includes(mascotType)) {
      return;
    }

    const validation = validateItemUnlock(item.id, stats, studentId);
    
    // Skip already unlocked items or items with security violations
    if (validation.isUnlocked || validation.securityViolation) {
      return;
    }

    // Check if item is near unlock threshold
    if (validation.requirement && validation.requirement.progress >= progressThreshold) {
      nearUnlockItems.push({
        item,
        progress: validation.requirement.progress
      });
    }
  });

  // Sort by progress (highest first)
  return nearUnlockItems.sort((a, b) => b.progress - a.progress);
};

// Clear caches and rate limiting data (for testing or admin functions)
export const clearUnlockData = (): void => {
  unlockAttempts.clear();
  unlockResultCache.clear();
};

// Get unlock statistics (for admin/monitoring)
export const getUnlockStatistics = (): {
  totalAttempts: number;
  successfulUnlocks: number;
  securityViolations: number;
  cacheHitRate: number;
} => {
  let totalAttempts = 0;
  let successfulUnlocks = 0;
  let securityViolations = 0;

  for (const attempts of unlockAttempts.values()) {
    totalAttempts += attempts.length;
    successfulUnlocks += attempts.filter(a => a.result.isUnlocked).length;
    securityViolations += attempts.filter(a => a.result.securityViolation).length;
  }

  const cacheSize = unlockResultCache.size;
  const cacheHitRate = cacheSize > 0 ? (cacheSize / Math.max(totalAttempts, 1)) * 100 : 0;

  return {
    totalAttempts,
    successfulUnlocks,
    securityViolations,
    cacheHitRate
  };
};

// Validate item compatibility with mascot
export const validateItemMascotCompatibility = (
  itemId: string, 
  mascotType: string
): { isCompatible: boolean; reason?: string } => {
  const item = findWardrobeItem(itemId);
  if (!item) {
    return { isCompatible: false, reason: 'Item not found' };
  }

  // If item has no mascot restriction, it's compatible with all
  if (!item.mascotType || item.mascotType.length === 0) {
    return { isCompatible: true };
  }

  // Check if mascot type is in the allowed list
  const sanitizedMascotType = sanitizeTextInput(mascotType).sanitizedValue;
  const isCompatible = item.mascotType.includes(sanitizedMascotType);

  return {
    isCompatible,
    reason: isCompatible ? undefined : `This item is only compatible with: ${item.mascotType.join(', ')}`
  };
};