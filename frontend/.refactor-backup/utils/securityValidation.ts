// Security validation utilities for enhanced components
// This file contains defensive security measures for validating user data

export interface XPValidationResult {
  isValid: boolean;
  validatedValue: number;
  error?: string;
}

export interface UserInputValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  error?: string;
}

// XP Value Validation
export const validateXPValue = (xp: unknown, maxAllowed: number = 1000000): XPValidationResult => {
  // Type validation
  if (typeof xp !== 'number') {
    return {
      isValid: false,
      validatedValue: 0,
      error: 'XP must be a number'
    };
  }

  // NaN check
  if (isNaN(xp) || !isFinite(xp)) {
    return {
      isValid: false,
      validatedValue: 0,
      error: 'XP must be a valid finite number'
    };
  }

  // Range validation
  if (xp < 0) {
    return {
      isValid: false,
      validatedValue: 0,
      error: 'XP cannot be negative'
    };
  }

  if (xp > maxAllowed) {
    return {
      isValid: false,
      validatedValue: maxAllowed,
      error: `XP exceeds maximum allowed value of ${maxAllowed}`
    };
  }

  // Decimal precision validation (XP should be whole numbers)
  if (xp % 1 !== 0) {
    return {
      isValid: true,
      validatedValue: Math.floor(xp),
      error: 'XP rounded down to nearest integer'
    };
  }

  return {
    isValid: true,
    validatedValue: xp
  };
};

// Level validation based on XP
export const validateLevel = (level: unknown, xp: number): XPValidationResult => {
  if (typeof level !== 'number' || isNaN(level) || !isFinite(level)) {
    return {
      isValid: false,
      validatedValue: 1,
      error: 'Level must be a valid number'
    };
  }

  // Calculate expected level based on XP (assuming 1000 XP per level)
  const expectedLevel = Math.floor(xp / 1000) + 1;
  const minLevel = Math.max(1, expectedLevel - 2); // Allow 2 levels below expected
  const maxLevel = expectedLevel + 2; // Allow 2 levels above expected

  if (level < 1) {
    return {
      isValid: false,
      validatedValue: 1,
      error: 'Level cannot be less than 1'
    };
  }

  if (level < minLevel || level > maxLevel) {
    return {
      isValid: false,
      validatedValue: expectedLevel,
      error: `Level ${level} inconsistent with XP ${xp}. Expected around ${expectedLevel}`
    };
  }

  return {
    isValid: true,
    validatedValue: Math.floor(level)
  };
};

// Sanitize text input to prevent XSS and injection attacks
export const sanitizeTextInput = (input: unknown, maxLength: number = 100): UserInputValidationResult => {
  // Type check
  if (typeof input !== 'string') {
    return {
      isValid: false,
      sanitizedValue: '',
      error: 'Input must be a string'
    };
  }

  // Length validation
  if (input.length > maxLength) {
    return {
      isValid: false,
      sanitizedValue: input.substring(0, maxLength),
      error: `Input exceeds maximum length of ${maxLength} characters`
    };
  }

  // Remove potentially dangerous characters and HTML tags
  const sanitized = input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script tags
    .replace(/eval\(/gi, '') // Remove eval calls
    .replace(/expression\(/gi, '') // Remove CSS expressions
    .trim();

  // Check for remaining suspicious content
  const suspiciousPatterns = [
    /data:text\/html/gi,
    /vbscript:/gi,
    /livescript:/gi,
    /mocha:/gi,
    /\{\{.*\}\}/g // Template injection
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      return {
        isValid: false,
        sanitizedValue: '',
        error: 'Input contains potentially dangerous content'
      };
    }
  }

  return {
    isValid: true,
    sanitizedValue: sanitized
  };
};

// Validate mascot customization data
export const validateMascotCustomization = (customization: unknown): { isValid: boolean; sanitized: any; error?: string } => {
  if (!customization || typeof customization !== 'object') {
    return {
      isValid: false,
      sanitized: {},
      error: 'Customization must be an object'
    };
  }

  const data = customization as Record<string, unknown>;
  const sanitized: Record<string, any> = {};

  // Validate mascot type
  const validMascotTypes = ['dragon', 'fairy', 'robot', 'cat', 'owl'];
  if (data.mascotType && typeof data.mascotType === 'string') {
    if (validMascotTypes.includes(data.mascotType)) {
      sanitized.mascotType = data.mascotType;
    } else {
      return {
        isValid: false,
        sanitized: {},
        error: 'Invalid mascot type'
      };
    }
  }

  // Validate emotion
  const validEmotions = ['idle', 'happy', 'thinking', 'celebrating', 'oops'];
  if (data.emotion && typeof data.emotion === 'string') {
    if (validEmotions.includes(data.emotion)) {
      sanitized.emotion = data.emotion;
    } else {
      sanitized.emotion = 'idle'; // Default to safe value
    }
  }

  // Validate equipped items array
  if (data.equippedItems && Array.isArray(data.equippedItems)) {
    const maxItems = 10; // Limit number of equipped items
    sanitized.equippedItems = data.equippedItems
      .filter(item => typeof item === 'string' && item.length < 50)
      .slice(0, maxItems)
      .map(item => sanitizeTextInput(item).sanitizedValue);
  }

  // Validate XP level
  if (data.xpLevel) {
    const xpValidation = validateXPValue(data.xpLevel, 100000);
    if (xpValidation.isValid) {
      sanitized.xpLevel = xpValidation.validatedValue;
    } else {
      return {
        isValid: false,
        sanitized: {},
        error: xpValidation.error
      };
    }
  }

  return {
    isValid: true,
    sanitized
  };
};

// Validate item unlock requirements against user stats
export const validateItemUnlockRequirements = (
  itemId: string,
  userStats: {
    xp: number;
    streak: number;
    exercisesCompleted: number;
    achievementsUnlocked: number;
  }
): { isValid: boolean; error?: string } => {
  // First validate all user stats
  const xpValidation = validateXPValue(userStats.xp);
  const streakValidation = validateXPValue(userStats.streak, 1000);
  const exercisesValidation = validateXPValue(userStats.exercisesCompleted, 100000);
  const achievementsValidation = validateXPValue(userStats.achievementsUnlocked, 1000);

  if (!xpValidation.isValid) {
    return { isValid: false, error: `Invalid XP: ${xpValidation.error}` };
  }
  if (!streakValidation.isValid) {
    return { isValid: false, error: `Invalid streak: ${streakValidation.error}` };
  }
  if (!exercisesValidation.isValid) {
    return { isValid: false, error: `Invalid exercises: ${exercisesValidation.error}` };
  }
  if (!achievementsValidation.isValid) {
    return { isValid: false, error: `Invalid achievements: ${achievementsValidation.error}` };
  }

  // Sanitize item ID
  const itemIdValidation = sanitizeTextInput(itemId, 50);
  if (!itemIdValidation.isValid) {
    return { isValid: false, error: `Invalid item ID: ${itemIdValidation.error}` };
  }

  // Item unlock validation would typically check against a whitelist of valid items
  // For now, we'll validate the format and basic security
  const validItemIdPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validItemIdPattern.test(itemIdValidation.sanitizedValue)) {
    return { isValid: false, error: 'Item ID contains invalid characters' };
  }

  return { isValid: true };
};

// Validate 3D asset paths to prevent directory traversal
export const validateAssetPath = (assetPath: unknown): { isValid: boolean; sanitizedPath: string; error?: string } => {
  if (typeof assetPath !== 'string') {
    return {
      isValid: false,
      sanitizedPath: '',
      error: 'Asset path must be a string'
    };
  }

  // Remove potential directory traversal attempts
  const cleaned = assetPath
    .replace(/\.\./g, '') // Remove ..
    .replace(/\/+/g, '/') // Normalize multiple slashes
    .replace(/^\/+/, '') // Remove leading slashes
    .trim();

  // Validate allowed file extensions for 3D assets
  const allowedExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.dae'];
  const hasValidExtension = allowedExtensions.some(ext => cleaned.toLowerCase().endsWith(ext));

  if (!hasValidExtension && cleaned !== '') {
    return {
      isValid: false,
      sanitizedPath: '',
      error: 'Invalid file extension for 3D asset'
    };
  }

  // Validate path doesn't contain suspicious content
  const suspiciousPatterns = [
    /^\w+:\/\//i, // Protocols like http://, file://
    /[<>"|*?]/g, // Invalid filename characters
    /^\//g // Absolute paths
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(cleaned)) {
      return {
        isValid: false,
        sanitizedPath: '',
        error: 'Asset path contains invalid or suspicious content'
      };
    }
  }

  return {
    isValid: true,
    sanitizedPath: cleaned
  };
};

// Rate limiting for actions to prevent abuse
const actionCounts = new Map<string, { count: number; lastReset: number }>();

export const checkRateLimit = (actionId: string, maxActions: number = 100, timeWindow: number = 60000): boolean => {
  const now = Date.now();
  const actionData = actionCounts.get(actionId);

  if (!actionData || (now - actionData.lastReset) > timeWindow) {
    // Reset or initialize counter
    actionCounts.set(actionId, { count: 1, lastReset: now });
    return true;
  }

  if (actionData.count >= maxActions) {
    return false; // Rate limit exceeded
  }

  actionData.count++;
  return true;
};

// Comprehensive validation for XP system props
export interface XPSystemValidation {
  currentXP: number;
  maxXP: number;
  level: number;
  xpGained: number;
  bonusMultiplier: number;
  isValid: boolean;
  errors: string[];
}

export const validateXPSystemProps = (props: {
  currentXP?: unknown;
  maxXP?: unknown;
  level?: unknown;
  xpGained?: unknown;
  bonusMultiplier?: unknown;
}): XPSystemValidation => {
  const errors: string[] = [];
  let isValid = true;

  // Validate currentXP
  const currentXPValidation = validateXPValue(props.currentXP || 0);
  if (!currentXPValidation.isValid) {
    errors.push(`Current XP: ${currentXPValidation.error}`);
    isValid = false;
  }

  // Validate maxXP
  const maxXPValidation = validateXPValue(props.maxXP || 1000);
  if (!maxXPValidation.isValid) {
    errors.push(`Max XP: ${maxXPValidation.error}`);
    isValid = false;
  }

  // Ensure currentXP <= maxXP
  if (currentXPValidation.isValid && maxXPValidation.isValid && 
      currentXPValidation.validatedValue > maxXPValidation.validatedValue) {
    errors.push('Current XP cannot exceed max XP');
    isValid = false;
  }

  // Validate level
  const levelValidation = validateLevel(props.level || 1, currentXPValidation.validatedValue);
  if (!levelValidation.isValid) {
    errors.push(`Level: ${levelValidation.error}`);
    isValid = false;
  }

  // Validate xpGained
  const xpGainedValidation = validateXPValue(props.xpGained || 0, 10000);
  if (!xpGainedValidation.isValid) {
    errors.push(`XP Gained: ${xpGainedValidation.error}`);
    isValid = false;
  }

  // Validate bonusMultiplier
  const bonusMultiplier = typeof props.bonusMultiplier === 'number' ? props.bonusMultiplier : 1;
  if (isNaN(bonusMultiplier) || bonusMultiplier < 1 || bonusMultiplier > 10) {
    errors.push('Bonus multiplier must be between 1 and 10');
    isValid = false;
  }

  return {
    currentXP: currentXPValidation.validatedValue,
    maxXP: maxXPValidation.validatedValue,
    level: levelValidation.validatedValue,
    xpGained: xpGainedValidation.validatedValue,
    bonusMultiplier: Math.min(Math.max(1, bonusMultiplier), 10),
    isValid,
    errors
  };
};