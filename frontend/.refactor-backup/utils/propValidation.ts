// Comprehensive prop validation system for enhanced components
// This provides runtime type checking and security validation for React props

export interface PropValidationError {
  property: string;
  expected: string;
  received: string;
  value: unknown;
}

export interface PropValidationResult {
  isValid: boolean;
  errors: PropValidationError[];
  sanitizedProps: Record<string, any>;
}

// Base validation functions
export const validators = {
  // String validation with length and content checks
  string: (value: unknown, options?: { 
    minLength?: number; 
    maxLength?: number; 
    allowEmpty?: boolean;
    pattern?: RegExp;
  }): { isValid: boolean; error?: string; sanitizedValue?: string } => {
    if (typeof value !== 'string') {
      return { isValid: false, error: 'Expected string' };
    }

    const str = value as string;
    
    if (!options?.allowEmpty && str.trim().length === 0) {
      return { isValid: false, error: 'String cannot be empty' };
    }

    if (options?.minLength && str.length < options.minLength) {
      return { isValid: false, error: `String must be at least ${options.minLength} characters` };
    }

    if (options?.maxLength && str.length > options.maxLength) {
      return { isValid: false, error: `String must be no more than ${options.maxLength} characters` };
    }

    if (options?.pattern && !options.pattern.test(str)) {
      return { isValid: false, error: 'String does not match required pattern' };
    }

    // Sanitize string - remove potentially dangerous content
    const sanitized = str
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();

    return { isValid: true, sanitizedValue: sanitized };
  },

  // Number validation with range checks
  number: (value: unknown, options?: {
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
  }): { isValid: boolean; error?: string; sanitizedValue?: number } => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return { isValid: false, error: 'Expected finite number' };
    }

    const num = value as number;

    if (options?.positive && num < 0) {
      return { isValid: false, error: 'Number must be positive' };
    }

    if (options?.min !== undefined && num < options.min) {
      return { isValid: false, error: `Number must be at least ${options.min}` };
    }

    if (options?.max !== undefined && num > options.max) {
      return { isValid: false, error: `Number must be no more than ${options.max}` };
    }

    if (options?.integer && num % 1 !== 0) {
      return { isValid: false, error: 'Number must be an integer' };
    }

    return { isValid: true, sanitizedValue: num };
  },

  // Boolean validation
  boolean: (value: unknown): { isValid: boolean; error?: string; sanitizedValue?: boolean } => {
    if (typeof value !== 'boolean') {
      return { isValid: false, error: 'Expected boolean' };
    }
    return { isValid: true, sanitizedValue: value };
  },

  // Array validation with element validation
  array: (value: unknown, options?: {
    minLength?: number;
    maxLength?: number;
    elementValidator?: (item: unknown, index: number) => { isValid: boolean; error?: string; sanitizedValue?: any };
  }): { isValid: boolean; error?: string; sanitizedValue?: any[] } => {
    if (!Array.isArray(value)) {
      return { isValid: false, error: 'Expected array' };
    }

    const arr = value as unknown[];

    if (options?.minLength && arr.length < options.minLength) {
      return { isValid: false, error: `Array must have at least ${options.minLength} elements` };
    }

    if (options?.maxLength && arr.length > options.maxLength) {
      return { isValid: false, error: `Array must have no more than ${options.maxLength} elements` };
    }

    // Validate each element if validator provided
    if (options?.elementValidator) {
      const sanitizedArray: any[] = [];
      for (let i = 0; i < arr.length; i++) {
        const elementResult = options.elementValidator(arr[i], i);
        if (!elementResult.isValid) {
          return { isValid: false, error: `Array element ${i}: ${elementResult.error}` };
        }
        sanitizedArray.push(elementResult.sanitizedValue);
      }
      return { isValid: true, sanitizedValue: sanitizedArray };
    }

    return { isValid: true, sanitizedValue: arr };
  },

  // Object validation with property validation
  object: (value: unknown, options?: {
    properties?: Record<string, (val: unknown) => { isValid: boolean; error?: string; sanitizedValue?: any }>;
    required?: string[];
  }): { isValid: boolean; error?: string; sanitizedValue?: Record<string, any> } => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { isValid: false, error: 'Expected object' };
    }

    const obj = value as Record<string, unknown>;
    const sanitizedObject: Record<string, any> = {};

    // Check required properties
    if (options?.required) {
      for (const prop of options.required) {
        if (!(prop in obj)) {
          return { isValid: false, error: `Missing required property: ${prop}` };
        }
      }
    }

    // Validate properties if validators provided
    if (options?.properties) {
      for (const [prop, validator] of Object.entries(options.properties)) {
        if (prop in obj) {
          const propResult = validator(obj[prop]);
          if (!propResult.isValid) {
            return { isValid: false, error: `Property ${prop}: ${propResult.error}` };
          }
          sanitizedObject[prop] = propResult.sanitizedValue;
        }
      }
    }

    return { isValid: true, sanitizedValue: sanitizedObject };
  },

  // Enum validation (one of specific values)
  oneOf: (value: unknown, allowedValues: readonly unknown[]): { isValid: boolean; error?: string; sanitizedValue?: any } => {
    if (!allowedValues.includes(value)) {
      return { 
        isValid: false, 
        error: `Value must be one of: ${allowedValues.join(', ')}. Received: ${value}` 
      };
    }
    return { isValid: true, sanitizedValue: value };
  }
};

// XP System props validation schema
export const validateXPSystemProps = (props: Record<string, unknown>): PropValidationResult => {
  const errors: PropValidationError[] = [];
  const sanitizedProps: Record<string, any> = {};

  // Define validation schema for XP System
  const schema = {
    currentXP: (value: unknown) => validators.number(value, { min: 0, max: 1000000, integer: true }),
    maxXP: (value: unknown) => validators.number(value, { min: 1, max: 1000000, integer: true }),
    level: (value: unknown) => validators.number(value, { min: 1, max: 1000, integer: true }),
    xpGained: (value: unknown) => validators.number(value, { min: 0, max: 10000, integer: true }),
    bonusMultiplier: (value: unknown) => validators.number(value, { min: 1, max: 10 }),
    streakActive: (value: unknown) => validators.boolean(value),
    size: (value: unknown) => validators.oneOf(value, ['compact', 'normal', 'large', 'massive']),
    theme: (value: unknown) => validators.oneOf(value, ['default', 'magic', 'fire', 'water', 'crystal', 'rainbow']),
    enablePhysics: (value: unknown) => validators.boolean(value),
    interactive: (value: unknown) => validators.boolean(value),
    recentAchievements: (value: unknown) => validators.array(value, {
      maxLength: 10,
      elementValidator: (item) => validators.string(item, { maxLength: 100 })
    })
  };

  // Validate each prop
  for (const [propName, validator] of Object.entries(schema)) {
    if (propName in props) {
      const result = validator(props[propName]);
      if (!result.isValid) {
        errors.push({
          property: propName,
          expected: 'Valid value according to schema',
          received: typeof props[propName],
          value: props[propName]
        });
      } else {
        sanitizedProps[propName] = result.sanitizedValue;
      }
    }
  }

  // Cross-validation: currentXP should not exceed maxXP
  if (sanitizedProps.currentXP && sanitizedProps.maxXP && 
      sanitizedProps.currentXP > sanitizedProps.maxXP) {
    errors.push({
      property: 'currentXP',
      expected: `Value <= ${sanitizedProps.maxXP}`,
      received: `${sanitizedProps.currentXP}`,
      value: sanitizedProps.currentXP
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedProps
  };
};

// Mascot Wardrobe 3D props validation schema
export const validateMascotWardrobe3DProps = (props: Record<string, unknown>): PropValidationResult => {
  const errors: PropValidationError[] = [];
  const sanitizedProps: Record<string, any> = {};

  const schema = {
    mascotType: (value: unknown) => validators.oneOf(value, ['dragon', 'fairy', 'robot', 'cat', 'owl']),
    emotion: (value: unknown) => validators.oneOf(value, ['idle', 'happy', 'thinking', 'celebrating', 'oops']),
    equippedItems: (value: unknown) => validators.array(value, {
      maxLength: 20,
      elementValidator: (item) => validators.string(item, { 
        maxLength: 50, 
        pattern: /^[a-zA-Z0-9_-]+$/ 
      })
    }),
    xpLevel: (value: unknown) => validators.number(value, { min: 1, max: 1000, integer: true }),
    size: (value: unknown) => validators.oneOf(value, ['small', 'medium', 'large']),
    enableInteraction: (value: unknown) => validators.boolean(value),
    studentStats: (value: unknown) => validators.object(value, {
      properties: {
        xp: (val) => validators.number(val, { min: 0, max: 1000000, integer: true }),
        streak: (val) => validators.number(val, { min: 0, max: 1000, integer: true }),
        exercisesCompleted: (val) => validators.number(val, { min: 0, max: 100000, integer: true }),
        achievementsUnlocked: (val) => validators.number(val, { min: 0, max: 1000, integer: true })
      },
      required: ['xp', 'streak', 'exercisesCompleted', 'achievementsUnlocked']
    })
  };

  // Validate each prop
  for (const [propName, validator] of Object.entries(schema)) {
    if (propName in props) {
      const result = validator(props[propName]);
      if (!result.isValid) {
        errors.push({
          property: propName,
          expected: 'Valid value according to schema',
          received: typeof props[propName],
          value: props[propName]
        });
      } else {
        sanitizedProps[propName] = result.sanitizedValue;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedProps
  };
};

// Wardrobe System props validation
export const validateWardrobeSystemProps = (props: Record<string, unknown>): PropValidationResult => {
  const errors: PropValidationError[] = [];
  const sanitizedProps: Record<string, any> = {};

  const schema = {
    studentStats: (value: unknown) => validators.object(value, {
      properties: {
        xp: (val) => validators.number(val, { min: 0, max: 1000000, integer: true }),
        streak: (val) => validators.number(val, { min: 0, max: 1000, integer: true }),
        exercisesCompleted: (val) => validators.number(val, { min: 0, max: 100000, integer: true }),
        achievementsUnlocked: (val) => validators.number(val, { min: 0, max: 1000, integer: true })
      },
      required: ['xp', 'streak', 'exercisesCompleted', 'achievementsUnlocked']
    }),
    mascotType: (value: unknown) => validators.oneOf(value, ['dragon', 'fairy', 'robot', 'cat', 'owl']),
    equippedItems: (value: unknown) => validators.array(value, {
      maxLength: 20,
      elementValidator: (item) => validators.string(item, { 
        maxLength: 50, 
        pattern: /^[a-zA-Z0-9_-]+$/ 
      })
    })
  };

  // Validate each prop
  for (const [propName, validator] of Object.entries(schema)) {
    if (propName in props) {
      const result = validator(props[propName]);
      if (!result.isValid) {
        errors.push({
          property: propName,
          expected: 'Valid value according to schema',
          received: typeof props[propName],
          value: props[propName]
        });
      } else {
        sanitizedProps[propName] = result.sanitizedValue;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedProps
  };
};

// Generic prop validation function
export const validateProps = <T extends Record<string, unknown>>(
  props: T,
  schema: Record<string, (value: unknown) => { isValid: boolean; error?: string; sanitizedValue?: any }>
): PropValidationResult => {
  const errors: PropValidationError[] = [];
  const sanitizedProps: Record<string, any> = {};

  for (const [propName, validator] of Object.entries(schema)) {
    if (propName in props) {
      const result = validator(props[propName]);
      if (!result.isValid) {
        errors.push({
          property: propName,
          expected: 'Valid value according to schema',
          received: typeof props[propName],
          value: props[propName]
        });
      } else {
        sanitizedProps[propName] = result.sanitizedValue;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedProps
  };
};

// Custom hook for prop validation
export const useValidatedProps = <T extends Record<string, unknown>>(
  props: T,
  validationFn: (props: Record<string, unknown>) => PropValidationResult
): { validatedProps: T; isValid: boolean; errors: PropValidationError[] } => {
  const validation = validationFn(props);
  
  if (!validation.isValid) {
    console.warn('Prop validation errors:', validation.errors);
  }
  
  return {
    validatedProps: { ...props, ...validation.sanitizedProps } as T,
    isValid: validation.isValid,
    errors: validation.errors
  };
};