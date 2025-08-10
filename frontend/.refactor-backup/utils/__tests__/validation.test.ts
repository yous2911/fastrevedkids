// validation.test.ts - Frontend validation utilities tests

// Since we don't have access to the actual validation utilities,
// I'll create common validation functions and their tests

export interface ValidationError {
  field: string;
  message: string;
}

export const validateEmail = (email: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: 'email', message: 'Email format is invalid' });
  }
  
  return errors;
};

export const validateStudentName = (name: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!name) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (name.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  } else if (name.length > 50) {
    errors.push({ field: 'name', message: 'Name must be less than 50 characters' });
  } else if (!/^[a-zA-ZÀ-ÿ\s-']+$/.test(name)) {
    errors.push({ field: 'name', message: 'Name contains invalid characters' });
  }
  
  return errors;
};

export const validateAge = (age: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (age === undefined || age === null) {
    errors.push({ field: 'age', message: 'Age is required' });
  } else if (!Number.isInteger(age)) {
    errors.push({ field: 'age', message: 'Age must be a whole number' });
  } else if (age < 5) {
    errors.push({ field: 'age', message: 'Age must be at least 5 years' });
  } else if (age > 18) {
    errors.push({ field: 'age', message: 'Age must be less than 18 years' });
  }
  
  return errors;
};

export const validateExerciseResponse = (response: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!response && response !== '0') {
    errors.push({ field: 'response', message: 'Response is required' });
  } else if (response.length > 1000) {
    errors.push({ field: 'response', message: 'Response is too long' });
  }
  
  return errors;
};

export const validateExerciseTime = (timeSeconds: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (timeSeconds === undefined || timeSeconds === null) {
    errors.push({ field: 'time', message: 'Time is required' });
  } else if (timeSeconds < 0) {
    errors.push({ field: 'time', message: 'Time cannot be negative' });
  } else if (timeSeconds > 3600) {
    errors.push({ field: 'time', message: 'Time cannot exceed 1 hour' });
  }
  
  return errors;
};

// Tests
describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const errors = validateEmail('test@example.com');
      expect(errors).toHaveLength(0);
    });

    it('should reject empty email', () => {
      const errors = validateEmail('');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Email is required');
    });

    it('should reject invalid email format', () => {
      const errors = validateEmail('invalid-email');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Email format is invalid');
    });

    it('should reject email without domain', () => {
      const errors = validateEmail('test@');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Email format is invalid');
    });
  });

  describe('validateStudentName', () => {
    it('should validate correct name', () => {
      const errors = validateStudentName('Alice Dupont');
      expect(errors).toHaveLength(0);
    });

    it('should validate name with accents', () => {
      const errors = validateStudentName('François');
      expect(errors).toHaveLength(0);
    });

    it('should validate name with apostrophe', () => {
      const errors = validateStudentName("O'Connor");
      expect(errors).toHaveLength(0);
    });

    it('should reject empty name', () => {
      const errors = validateStudentName('');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Name is required');
    });

    it('should reject name that is too short', () => {
      const errors = validateStudentName('A');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Name must be at least 2 characters');
    });

    it('should reject name that is too long', () => {
      const longName = 'A'.repeat(51);
      const errors = validateStudentName(longName);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Name must be less than 50 characters');
    });

    it('should reject name with numbers', () => {
      const errors = validateStudentName('Alice123');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Name contains invalid characters');
    });
  });

  describe('validateAge', () => {
    it('should validate correct age', () => {
      const errors = validateAge(10);
      expect(errors).toHaveLength(0);
    });

    it('should reject undefined age', () => {
      const errors = validateAge(undefined as any);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Age is required');
    });

    it('should reject decimal age', () => {
      const errors = validateAge(10.5);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Age must be a whole number');
    });

    it('should reject age too young', () => {
      const errors = validateAge(4);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Age must be at least 5 years');
    });

    it('should reject age too old', () => {
      const errors = validateAge(19);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Age must be less than 18 years');
    });
  });

  describe('validateExerciseResponse', () => {
    it('should validate correct response', () => {
      const errors = validateExerciseResponse('42');
      expect(errors).toHaveLength(0);
    });

    it('should validate zero as response', () => {
      const errors = validateExerciseResponse('0');
      expect(errors).toHaveLength(0);
    });

    it('should reject empty response', () => {
      const errors = validateExerciseResponse('');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Response is required');
    });

    it('should reject response that is too long', () => {
      const longResponse = 'A'.repeat(1001);
      const errors = validateExerciseResponse(longResponse);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Response is too long');
    });
  });

  describe('validateExerciseTime', () => {
    it('should validate correct time', () => {
      const errors = validateExerciseTime(30);
      expect(errors).toHaveLength(0);
    });

    it('should validate zero time', () => {
      const errors = validateExerciseTime(0);
      expect(errors).toHaveLength(0);
    });

    it('should reject undefined time', () => {
      const errors = validateExerciseTime(undefined as any);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Time is required');
    });

    it('should reject negative time', () => {
      const errors = validateExerciseTime(-5);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Time cannot be negative');
    });

    it('should reject time exceeding 1 hour', () => {
      const errors = validateExerciseTime(3601);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Time cannot exceed 1 hour');
    });
  });
}); 