import { describe, it, expect } from 'vitest';
import {
  API_CONFIG,
  CONTENT_VALIDATION,
  TIME_PERIODS,
  STORAGE_KEYS,
  AI_MODELS,
  AI_TEMPERATURE,
} from './constants';

describe('constants', () => {
  describe('API_CONFIG', () => {
    it('should have valid retry configuration', () => {
      expect(API_CONFIG.MAX_RETRIES).toBeGreaterThan(0);
      expect(API_CONFIG.INITIAL_RETRY_DELAY_MS).toBeGreaterThan(0);
      expect(API_CONFIG.RETRY_BACKOFF_MULTIPLIER).toBeGreaterThan(1);
    });

    it('should have reasonable timeout', () => {
      expect(API_CONFIG.REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
      expect(API_CONFIG.REQUEST_TIMEOUT_MS).toBeLessThanOrEqual(600000); // Max 10 min
    });
  });

  describe('CONTENT_VALIDATION', () => {
    it('should have minimum lengths greater than zero', () => {
      expect(CONTENT_VALIDATION.MIN_PDF_TEXT_LENGTH).toBeGreaterThan(0);
      expect(CONTENT_VALIDATION.MIN_SCRAPED_TEXT_LENGTH).toBeGreaterThan(0);
    });

    it('should have reasonable max job description length', () => {
      expect(CONTENT_VALIDATION.MAX_JOB_DESCRIPTION_LENGTH).toBeGreaterThan(1000);
    });
  });

  describe('TIME_PERIODS', () => {
    it('should have valid time periods', () => {
      expect(TIME_PERIODS.NUDGE_THRESHOLD_MS).toBeGreaterThan(0);
      expect(TIME_PERIODS.FEED_CACHE_HOURS).toBeGreaterThan(0);
    });

    it('should have 3 weeks for nudge threshold', () => {
      const threeWeeksInMs = 21 * 24 * 60 * 60 * 1000;
      expect(TIME_PERIODS.NUDGE_THRESHOLD_MS).toBe(threeWeeksInMs);
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have all required storage keys', () => {
      expect(STORAGE_KEYS.RESUMES).toBeTruthy();
      expect(STORAGE_KEYS.JOBS_HISTORY).toBeTruthy();
      expect(STORAGE_KEYS.API_KEY).toBeTruthy();
      expect(STORAGE_KEYS.THEME).toBeTruthy();
    });

    it('should have jobfit prefix for user-facing keys', () => {
      expect(STORAGE_KEYS.RESUMES).toContain('jobfit');
      expect(STORAGE_KEYS.JOBS_HISTORY).toContain('jobfit');
      expect(STORAGE_KEYS.THEME).toContain('jobfit');
    });
  });

  describe('AI_MODELS', () => {
    it('should have valid model names', () => {
      expect(AI_MODELS.EXTRACTION).toBeTruthy();
      expect(AI_MODELS.ANALYSIS_PRO).toBeTruthy();
    });

    it('should have gemini model names', () => {
      expect(AI_MODELS.EXTRACTION).toContain('gemini');
      expect(AI_MODELS.ANALYSIS_PRO).toContain('gemini');
    });
  });

  describe('AI_TEMPERATURE', () => {
    it('should have valid temperature values', () => {
      expect(AI_TEMPERATURE.STRICT).toBeGreaterThanOrEqual(0);
      expect(AI_TEMPERATURE.STRICT).toBeLessThanOrEqual(1);

      expect(AI_TEMPERATURE.BALANCED).toBeGreaterThanOrEqual(0);
      expect(AI_TEMPERATURE.BALANCED).toBeLessThanOrEqual(1);

      expect(AI_TEMPERATURE.CREATIVE).toBeGreaterThanOrEqual(0);
      expect(AI_TEMPERATURE.CREATIVE).toBeLessThanOrEqual(1);
    });

    it('should have increasing creativity levels', () => {
      expect(AI_TEMPERATURE.STRICT).toBeLessThan(AI_TEMPERATURE.BALANCED);
      expect(AI_TEMPERATURE.BALANCED).toBeLessThan(AI_TEMPERATURE.CREATIVE);
    });
  });
});
