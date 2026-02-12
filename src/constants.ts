/**
 * Application Constants
 * All magic numbers and configuration values in one place
 */
import { version } from '../package.json';

export const APP_VERSION = version;

// API & Retry Configuration
export const API_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY_MS: 2000,
  RETRY_BACKOFF_MULTIPLIER: 2,
  REQUEST_TIMEOUT_MS: 120000, // 2 minutes
} as const;

export const AGENT_LOOP = {
  MAX_RETRIES: 2,           // Maximum times the agent can self-correct
  QUALITY_THRESHOLD: 70,    // Score below which the agent triggers a rewrite
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

// AI Model Configuration - Task-based mapping
export const AI_MODELS = {
  EXTRACTION: 'gemini-2.0-flash', // Fast & Cheap
  ANALYSIS_BASIC: 'gemini-2.0-flash',
  ANALYSIS_PRO: 'gemini-2.5-pro',    // High Reasoning (Standard Pro)
  ANALYSIS_ULTRA: 'gemini-3-pro',   // State of the Art (Premium)
} as const;

// Tier-to-Model mapping to control costs and access
export const TIER_MODELS: Record<string, { extraction: string; analysis: string }> = {
  free: {
    extraction: AI_MODELS.EXTRACTION,
    analysis: AI_MODELS.ANALYSIS_BASIC,
  },
  plus: {
    extraction: AI_MODELS.EXTRACTION,
    analysis: AI_MODELS.ANALYSIS_BASIC,
  },
  pro: {
    extraction: AI_MODELS.EXTRACTION,
    analysis: AI_MODELS.ANALYSIS_PRO,
  },
  admin: {
    extraction: AI_MODELS.EXTRACTION,
    analysis: AI_MODELS.ANALYSIS_ULTRA,
  },
  tester: {
    extraction: AI_MODELS.EXTRACTION,
    analysis: AI_MODELS.ANALYSIS_ULTRA,
  }
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
  SKILLS: 'jobfit_user_skills',
  ROLE_MODELS: 'jobcoach_role_models',
  TARGET_JOBS: 'jobfit_target_jobs',
  VAULT_SEED: 'jobfit_vault_seed',
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
  TRANSCRIPT_CACHE: 'NAVIGATOR_TRANSCRIPT_CACHE',
  FEED_CACHE: 'jobfit_feed_cache',
  FEED_CACHE_TIMESTAMP: 'jobfit_feed_timestamp',
} as const;

// Application Routes
export const ROUTES = {
  HOME: '/',
  ANALYZE: '/analyze',
  HISTORY: '/history',
  RESUMES: '/resumes',
  SKILLS: '/skills',
  PRO_FEED: '/pro',
  FEED: '/feed',
  COACH_HOME: '/coach',
  COACH_GAP: '/coach/gap-analysis',
  COACH_ROLE_MODELS: '/coach/role-models',
  GRAD: '/grad',
  JOB_DETAIL: '/job/:id',
  SEO_LANDING: '/resume-for/:role',
  ADMIN: '/admin',
  COVER_LETTERS: '/cover-letters',
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
// Bento Grid Configuration
export const BENTO_CARDS = {
  JOBFIT: {
    id: 'jobfit',
    iconName: 'Sparkles',
    targetView: 'job-fit',
    title: { marketing: 'JobFit Score', action: 'Analyze' },
    description: {
      marketing: 'Instant 0-100 compatibility rating.',
      action: 'Get an instant match score and detailed fit analysis. We break down exactly how well you align with any job description in seconds.'
    },
    action: { marketing: 'Get started', action: 'Analyze' },
    colors: {
      bg: 'bg-indigo-50/50 dark:bg-indigo-500/5',
      text: 'text-indigo-600 dark:text-indigo-400',
      accent: 'border-indigo-500/10 dark:border-indigo-500/20',
      iconBg: 'bg-indigo-500',
      preview: 'from-indigo-500/5',
      glow: 'bg-indigo-500/10 group-hover:bg-indigo-500/20'
    }
  },
  KEYWORDS: {
    id: 'keywords',
    iconName: 'Zap',
    targetView: 'skills',
    title: { marketing: 'Keyword Targeting', action: 'Skills' },
    description: {
      marketing: 'Identify missing skills to beat the ATS.',
      action: 'Identify and bridge your skill gaps with AI. We scan descriptions for missing keywords so you can optimize your profile for every role.'
    },
    action: { marketing: 'Optimize now', action: 'Audit gaps' },
    colors: {
      bg: 'bg-violet-50/50 dark:bg-violet-500/5',
      text: 'text-violet-600 dark:text-violet-400',
      accent: 'border-violet-500/10 dark:border-violet-500/20',
      iconBg: 'bg-violet-500',
      preview: 'from-violet-500/5',
      glow: 'bg-violet-500/10 group-hover:bg-violet-500/20'
    }
  },
  RESUMES: {
    id: 'resumes',
    iconName: 'FileText',
    targetView: 'resumes',
    title: { marketing: 'Tailored Summaries', action: 'Resumes' },
    description: {
      marketing: 'Tailored summaries for every application.',
      action: 'Store and edit your resume profiles. We help you maintain multiple versions of your experience to target different industries effectively.'
    },
    action: { marketing: 'Try it', action: 'Manage' },
    colors: {
      bg: 'bg-rose-50/50 dark:bg-rose-500/5',
      text: 'text-rose-600 dark:text-rose-400',
      accent: 'border-rose-500/10 dark:border-rose-500/20',
      iconBg: 'bg-rose-500',
      preview: 'from-rose-500/5',
      glow: 'bg-rose-500/10 group-hover:bg-rose-500/20'
    }
  },
  COACH: {
    id: 'coach',
    iconName: 'TrendingUp',
    targetView: 'coach-home',
    title: { marketing: 'Career Coach', action: 'Roadmap' },
    description: {
      marketing: 'AI mentorship for your career transition.',
      action: 'Build your roadmap to land major target roles. Get personalized advice on how to transition into higher-paying career paths.'
    },
    action: { marketing: 'Learn more', action: 'Scale up' },
    colors: {
      bg: 'bg-emerald-50/50 dark:bg-emerald-500/5',
      text: 'text-emerald-600 dark:text-emerald-400',
      accent: 'border-emerald-500/10 dark:border-emerald-500/20',
      iconBg: 'bg-emerald-500',
      preview: 'from-emerald-500/5',
      glow: 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
    }
  },
  HISTORY: {
    id: 'history',
    iconName: 'Bookmark',
    targetView: 'history',
    title: { marketing: 'Save from Anywhere', action: 'History' },
    description: {
      marketing: 'Save jobs from any site with one click.',
      action: 'Review your analyzed jobs and insights. Keep track of every application and see how your compatibility scores evolve over time.'
    },
    action: { marketing: 'Install', action: 'View all' },
    colors: {
      bg: 'bg-blue-50/50 dark:bg-blue-500/5',
      text: 'text-blue-600 dark:text-blue-400',
      accent: 'border-blue-500/10 dark:border-blue-500/20',
      iconBg: 'bg-blue-500',
      preview: 'from-blue-500/5',
      glow: 'bg-blue-500/10 group-hover:bg-blue-500/20'
    }
  },
  COVER_LETTERS: {
    id: 'cover_letters',
    iconName: 'PenTool',
    targetView: 'cover-letters',
    title: { marketing: 'Smart Cover Letters', action: 'Cover Letters' },
    description: {
      marketing: 'Generate persuasive cover letters instantly.',
      action: 'Generate AI-tailored cover letters. Our engine synthesizes your experience and the job description to write unique, persuasive applications.'
    },
    action: { marketing: 'Start writing', action: 'Create new' },
    colors: {
      bg: 'bg-purple-50/50 dark:bg-purple-500/5',
      text: 'text-purple-600 dark:text-purple-400',
      accent: 'border-purple-500/10 dark:border-purple-500/20',
      iconBg: 'bg-purple-500',
      preview: 'from-purple-500/5',
      glow: 'bg-purple-500/10 group-hover:bg-purple-500/20'
    }
  },

  EDU: {
    id: 'edu',
    iconName: 'GraduationCap',
    targetView: 'grad',
    title: { marketing: 'Edu HQ', action: 'Edu' },
    description: {
      marketing: 'High-fidelity academic pathfinding.',
      action: 'Explore degree programs and certifications. We match your career goals with the precise educational paths needed to achieve them.'
    },
    action: { marketing: 'Scout Programs', action: 'Scout Programs' },
    colors: {
      bg: 'bg-amber-50/50 dark:bg-amber-500/5',
      text: 'text-amber-600 dark:text-amber-400',
      accent: 'border-amber-500/10 dark:border-amber-500/20',
      iconBg: 'bg-amber-500',
      preview: 'from-amber-500/5',
      glow: 'bg-amber-500/10 group-hover:bg-amber-500/20'
    }
  }
} as const;
