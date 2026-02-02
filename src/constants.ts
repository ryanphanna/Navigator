/**
 * Application Constants
 * All magic numbers and configuration values in one place
 */

// API & Retry Configuration
export const API_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY_MS: 2000,
  RETRY_BACKOFF_MULTIPLIER: 2,
  REQUEST_TIMEOUT_MS: 120000, // 2 minutes
} as const;

// Content Validation
export const CONTENT_VALIDATION = {
  MIN_PDF_TEXT_LENGTH: 50,
  MIN_SCRAPED_TEXT_LENGTH: 50,
  MAX_JOB_DESCRIPTION_LENGTH: 15000,
} as const;

// Job Analysis Thresholds
export const JOB_ANALYSIS = {
  MIN_MATCH_SCORE: 0,
  MAX_MATCH_SCORE: 100,
  HIGH_QUALITY_THRESHOLD: 80,
  REJECTION_THRESHOLD: 50,
} as const;

// Time Periods
export const TIME_PERIODS = {
  NUDGE_THRESHOLD_MS: 21 * 24 * 60 * 60 * 1000, // 3 weeks in milliseconds
  FEED_CACHE_HOURS: 24,
  SUCCESS_MESSAGE_DURATION_MS: 3000,
  NUDGE_DELAY_MS: 1500,
} as const;

// UI Configuration
export const UI_CONFIG = {
  DEBOUNCE_DELAY_MS: 500,
  ANIMATION_DURATION_MS: 300,
  TOAST_DURATION_MS: 3000,
} as const;

// AI Model Configuration
export const AI_MODELS = {
  FLASH: 'gemini-2.0-flash',
  PRO: 'gemini-2.0-flash', // Using Flash for both stages until Pro is available via proxy
} as const;

// Temperature Settings for AI
export const AI_TEMPERATURE = {
  STRICT: 0.0,        // For structured data extraction
  BALANCED: 0.3,      // For tailoring with some creativity
  CREATIVE: 0.7,      // For cover letter generation
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  RESUMES: 'jobfit_resumes_v2',
  JOBS_HISTORY: 'jobfit_jobs_history',
  API_KEY: 'api_key', // Encrypted via secureStorage
  THEME: 'jobfit_theme',
  PRIVACY_ACCEPTED: 'jobfit_privacy_accepted',
  WELCOME_SEEN: 'jobfit_welcome_seen',
  DAILY_USAGE: 'jobfit_daily_usage',
  QUOTA_STATUS: 'jobfit_quota_status',
  CURRENT_VIEW: 'jobfit_current_view',
  ACTIVE_TAB: 'jobfit_active_tab',
  BOOKMARKLET_TIP_DISMISSED: 'jobfit_bookmarklet_tip_dismissed',
  SKILL_SUGGESTIONS: 'jobfit_skill_suggestions',
} as const;

// User Tiers
export const USER_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ADMIN: 'admin',
} as const;

// Job Status Types
export const JOB_STATUS = {
  SAVED: 'saved',
  APPLIED: 'applied',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  REJECTED: 'rejected',
  GHOSTED: 'ghosted',
  ANALYZING: 'analyzing',
  ERROR: 'error',
} as const;

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  SEARCH_HISTORY: 'k',
  HISTORY: 'h',
  RESUMES: 'r',
  NEW_ANALYSIS: 'n',
  PRO_FEED: 'p',
} as const;

// Feature Flags
export const FEATURES = {
  ENABLE_BOOKMARKLET: true,
  ENABLE_DARK_MODE: true,
  ENABLE_KEYBOARD_SHORTCUTS: true,
  ENABLE_RETRY_MESSAGES: true,
} as const;
