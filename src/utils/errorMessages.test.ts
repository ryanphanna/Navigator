import { describe, it, expect } from 'vitest';
import { getUserFriendlyError, getRetryMessage, ERROR_MESSAGES } from './errorMessages';

describe('errorMessages', () => {
  describe('getUserFriendlyError', () => {
    it('should convert daily quota error to friendly message', () => {
      const error = new Error('DAILY_QUOTA_EXCEEDED: PerDay limit reached');
      const result = getUserFriendlyError(error);

      expect(result).toBe(ERROR_MESSAGES.DAILY_QUOTA_EXCEEDED);
      expect(result).toContain('daily API limit');
    });

    it('should convert rate limit error to friendly message', () => {
      const error = new Error('429 quota error');
      const result = getUserFriendlyError(error);

      expect(result).toBe(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
      expect(result).toContain('Too many requests');
    });

    it('should handle RATE_LIMIT_EXCEEDED error', () => {
      const error = new Error('RATE_LIMIT_EXCEEDED: Too busy');
      const result = getUserFriendlyError(error);

      expect(result).toBe(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
    });

    it('should convert network errors to friendly message', () => {
      const error = new Error('Failed to fetch');
      const result = getUserFriendlyError(error);

      expect(result).toBe(ERROR_MESSAGES.NETWORK_ERROR);
    });

    it('should convert timeout errors to friendly message', () => {
      const error = new Error('Request timeout');
      const result = getUserFriendlyError(error);

      expect(result).toBe(ERROR_MESSAGES.TIMEOUT_ERROR);
    });

    it('should convert API key permission errors', () => {
      const error = new Error('403 permission denied');
      const result = getUserFriendlyError(error);

      expect(result).toBe(ERROR_MESSAGES.API_KEY_PERMISSION_DENIED);
    });

    it('should convert invalid API key errors', () => {
      const error = new Error('400 invalid request');
      const result = getUserFriendlyError(error);

      expect(result).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('should handle auth errors', () => {
      const error = new Error('Invalid login credentials');
      const result = getUserFriendlyError(error);

      expect(result).toBe(ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS);
    });

    it('should handle invite code errors', () => {
      const error = new Error('Invalid invite code');
      const result = getUserFriendlyError(error);

      expect(result).toBe(ERROR_MESSAGES.AUTH_INVALID_INVITE);
    });

    it('should return short messages as-is if they look user-friendly', () => {
      const error = new Error('Something went wrong');
      const result = getUserFriendlyError(error);

      // Should not be the generic unknown error since it's short
      expect(result).toBe('Something went wrong');
    });

    it('should convert very long technical errors to generic message', () => {
      const error = new Error('TypeError: Cannot read property "foo" of undefined at Object.bar (file.js:123:45)');
      const result = getUserFriendlyError(error);

      expect(result).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
    });

    it('should handle string errors', () => {
      const result = getUserFriendlyError('DAILY_QUOTA_EXCEEDED');

      expect(result).toBe(ERROR_MESSAGES.DAILY_QUOTA_EXCEEDED);
    });
  });

  describe('getRetryMessage', () => {
    it('should format retry message correctly', () => {
      const result = getRetryMessage(1, 3, 2);

      expect(result).toContain('Retrying');
      expect(result).toContain('(1/3)');
      expect(result).toContain('2s');
    });

    it('should handle different attempt numbers', () => {
      const result = getRetryMessage(2, 3, 4);

      expect(result).toContain('(2/3)');
      expect(result).toContain('4s');
    });
  });
});
