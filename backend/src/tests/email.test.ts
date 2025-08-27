import { describe, it, expect, beforeEach } from 'vitest';
import { emailService } from '../services/email.service';

describe('EmailService', () => {
  describe('Core Functionality', () => {
    it('should have available templates', () => {
      const templates = emailService.getAvailableTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should send basic email', async () => {
      const result = await emailService.sendEmail('test@example.com', 'Test', '<h1>Test</h1>');
      expect(result).toBe(true);
    });

    it('should send password reset email', async () => {
      const result = await emailService.sendPasswordResetEmail('test@example.com', 'token123');
      expect(result).toBe(true);
    });

    it('should send welcome email', async () => {
      const result = await emailService.sendWelcomeEmail('test@example.com', 'Test User');
      expect(result).toBe(true);
    });

    it('should validate template variables', () => {
      const result = emailService.validateTemplateVariables('user-registration-welcome', {
        userName: 'Test', username: 'test', email: 'test@test.com', createdAt: '2023-01-01', loginUrl: 'http://localhost'
      });
      expect(result.isValid).toBe(true);
    });

    it('should get service status', async () => {
      const status = await emailService.getEmailServiceStatus();
      expect(status.status).toBe('healthy');
    });
  });
});