/**
 * Feature Registry
 * Single source of truth for all feature definitions across the app.
 *
 * Consumed by:
 *   - Homepage FeatureGrid (spotlight cards)
 *   - /features page (full catalog)
 *   - /education dashboard (tool cards)
 *   - /plans page (plan feature lists)
 */

// ─── Types ─────────────────────────────────────────────────────────────

export interface FeatureColor {
    bg: string;
    text: string;
    accent: string;
    iconBg: string;
    preview: string;
    glow: string;
}

export interface FeatureDefinition {
    /** Unique identifier */
    id: string;
    /** Registry key (used for lookups, e.g. 'JOBFIT') */
    key: string;
    /** Canonical display name (e.g. "AI Job Analysis") */
    name: string;
    /** Compact name for tight spaces (e.g. "Match") */
    shortName: string;
    /** Context-specific descriptions */
    description: {
        /** 5-8 words, punchy — for logged-in homepage cards */
        short: string;
        /** 1-2 sentences — for logged-out homepage, features page */
        full: string;
        /** Brief blurb for plan cards */
        plan: string;
    };
    /** Context-specific action labels */
    action: {
        /** Short action verb for logged-in users */
        short: string;
        /** Marketing-style CTA for logged-out / features page */
        full: string;
    };
    /** Lucide icon name (string) */
    iconName: string;
    /** Key into FEATURE_COLORS */
    colorKey: string;
    /** Feature category */
    category: 'JOB' | 'COACH' | 'EDUCATION';
    /** Minimum plan tier that includes this feature without limits */
    tier: 'explorer' | 'plus' | 'pro';
    /** View identifier for homepage onNavigate() system */
    targetView: string;
    /** Route path for react-router navigate() */
    link: string;
    /** Default ordering rank (lower = higher priority) */
    rank: number;
    /** Only visible to admin/tester users */
    requiresAdmin?: boolean;
    /** Eligible for display in homepage spotlight grid */
    showOnHomepage?: boolean;
    /** Hand-picked to appear on plan cards */
    planHighlight?: boolean;
    /** Feature is currently in development and restricted */
    isComingSoon?: boolean;
}

// ─── Shared Color Palette ──────────────────────────────────────────────

export const FEATURE_COLORS: Record<string, FeatureColor> = {
    indigo: {
        bg: 'bg-indigo-50/50 dark:bg-indigo-500/5',
        text: 'text-indigo-500 dark:text-indigo-400',
        accent: 'border-indigo-500/10 dark:border-indigo-500/20',
        iconBg: 'bg-indigo-500',
        preview: 'from-indigo-500/5',
        glow: 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
    },
    'indigo-dark': {
        bg: 'bg-indigo-50/50 dark:bg-indigo-500/5',
        text: 'text-indigo-600 dark:text-indigo-400',
        accent: 'border-indigo-500/10 dark:border-indigo-500/20',
        iconBg: 'bg-indigo-600',
        preview: 'from-indigo-600/5',
        glow: 'bg-indigo-600/10 group-hover:bg-indigo-600/20',
    },
    violet: {
        bg: 'bg-violet-50/50 dark:bg-violet-500/5',
        text: 'text-violet-500 dark:text-violet-400',
        accent: 'border-violet-500/10 dark:border-violet-500/20',
        iconBg: 'bg-violet-500',
        preview: 'from-violet-500/5',
        glow: 'bg-violet-500/10 group-hover:bg-violet-500/20',
    },
    sky: {
        bg: 'bg-sky-50/50 dark:bg-sky-500/5',
        text: 'text-sky-500 dark:text-sky-400',
        accent: 'border-sky-500/10 dark:border-sky-500/20',
        iconBg: 'bg-sky-500',
        preview: 'from-sky-500/5',
        glow: 'bg-sky-500/10 group-hover:bg-sky-500/20',
    },
    emerald: {
        bg: 'bg-emerald-50/50 dark:bg-emerald-500/5',
        text: 'text-emerald-500 dark:text-emerald-400',
        accent: 'border-emerald-500/10 dark:border-emerald-500/20',
        iconBg: 'bg-emerald-500',
        preview: 'from-emerald-500/5',
        glow: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    },
    amber: {
        bg: 'bg-amber-50/50 dark:bg-amber-500/5',
        text: 'text-amber-500 dark:text-amber-400',
        accent: 'border-amber-500/10 dark:border-amber-500/20',
        iconBg: 'bg-amber-500',
        preview: 'from-amber-500/5',
        glow: 'bg-amber-500/10 group-hover:bg-amber-500/20',
    },
    'amber-dark': {
        bg: 'bg-amber-50/50 dark:bg-amber-500/5',
        text: 'text-amber-600 dark:text-amber-400',
        accent: 'border-amber-500/10 dark:border-amber-500/20',
        iconBg: 'bg-amber-600',
        preview: 'from-amber-600/5',
        glow: 'bg-amber-600/10 group-hover:bg-amber-600/20',
    },
    rose: {
        bg: 'bg-rose-50/50 dark:bg-rose-500/5',
        text: 'text-rose-500 dark:text-rose-400',
        accent: 'border-rose-500/10 dark:border-rose-500/20',
        iconBg: 'bg-rose-500',
        preview: 'from-rose-500/5',
        glow: 'bg-rose-500/10 group-hover:bg-rose-500/20',
    },
    teal: {
        bg: 'bg-teal-50/50 dark:bg-teal-500/5',
        text: 'text-teal-500 dark:text-teal-400',
        accent: 'border-teal-500/10 dark:border-teal-500/20',
        iconBg: 'bg-teal-500',
        preview: 'from-teal-500/5',
        glow: 'bg-teal-500/10 group-hover:bg-teal-500/20',
    },
    blue: {
        bg: 'bg-blue-50/50 dark:bg-blue-500/5',
        text: 'text-blue-500 dark:text-blue-400',
        accent: 'border-blue-500/10 dark:border-blue-500/20',
        iconBg: 'bg-blue-500',
        preview: 'from-blue-500/5',
        glow: 'bg-blue-500/10 group-hover:bg-blue-500/20',
    },
} as const;

// ─── Feature Registry ──────────────────────────────────────────────────

export const FEATURE_REGISTRY: Record<string, FeatureDefinition> = {
    JOBFIT: {
        id: 'jobfit',
        key: 'JOBFIT',
        name: 'AI Job Analysis',
        shortName: 'Match',
        description: {
            short: 'Instant 0–100 compatibility rating.',
            full: 'Paste any job posting and instantly see how well you match. You get a 0–100 score plus a full breakdown of where you stand.',
            plan: 'Simple match quality ratings for every role',
        },
        action: { short: 'View Match', full: 'View Match' },
        iconName: 'Sparkles',
        colorKey: 'indigo',
        category: 'JOB',
        tier: 'explorer',
        targetView: 'job-home',
        link: '/jobs',
        rank: 1,
        showOnHomepage: true,
        planHighlight: true,
    },
    AI_SAFETY: {
        id: 'ai-safety',
        key: 'AI_SAFETY',
        name: 'AI Safety Scan',
        shortName: 'Safety',
        description: {
            short: 'Flags AI-banned postings automatically.',
            full: 'Some employers ban AI-assisted applications. Navigator flags those postings automatically so you know before you submit.',
            plan: 'Automatic AI-ban detection on job postings',
        },
        action: { short: 'Scan', full: 'Scan' },
        iconName: 'Shield',
        colorKey: 'amber',
        category: 'JOB',
        tier: 'plus',
        targetView: 'job-home',
        link: '/jobs',
        rank: 15,
    },
    RESUME_TAILORING: {
        id: 'resume-tailoring',
        key: 'RESUME_TAILORING',
        name: 'Resume Tailoring',
        shortName: 'Tailor',
        description: {
            short: 'One-click bullet rewrites for any job.',
            full: "Rewrite your resume bullets to match a job's exact keywords and requirements. Just pick a block and tailor it in one click.",
            plan: 'AI-powered resume bullet rewrites per job',
        },
        action: { short: 'Tailor', full: 'Tailor' },
        iconName: 'RefreshCw',
        colorKey: 'rose',
        category: 'JOB',
        tier: 'plus',
        targetView: 'resumes',
        link: '/jobs/resumes',
        rank: 14,
    },
    KEYWORDS: {
        id: 'keywords',
        key: 'KEYWORDS',
        name: 'Skills Gap Analysis',
        shortName: 'Skills',
        description: {
            short: 'Identify missing skills to beat the ATS.',
            full: 'Find out which keywords and skills your profile is missing for a specific role, so you can close the gap before you apply.',
            plan: 'Identify and bridge missing keywords',
        },
        action: { short: 'Audit gaps', full: 'Audit' },
        iconName: 'Zap',
        colorKey: 'sky',
        category: 'COACH',
        tier: 'plus',
        targetView: 'skills',
        link: '/career/skills',
        rank: 3,
        showOnHomepage: true,
        planHighlight: true,
    },
    RESUMES: {
        id: 'resumes',
        key: 'RESUMES',
        name: 'Resume Profiles',
        shortName: 'Resume',
        description: {
            short: 'Tailored summaries for every application.',
            full: 'Manage multiple versions of your resume, each tailored to a different role or industry. Switch between them whenever you need.',
            plan: 'Multiple resume versions for different roles',
        },
        action: { short: 'Manage', full: 'Manage' },
        iconName: 'FileText',
        colorKey: 'rose',
        category: 'JOB',
        tier: 'explorer',
        targetView: 'resumes',
        link: '/jobs/resumes',
        rank: 5,
        showOnHomepage: true,
    },
    COVER_LETTERS: {
        id: 'cover_letters',
        key: 'COVER_LETTERS',
        name: 'Cover Letters',
        shortName: 'Cover Letters',
        description: {
            short: 'Generate persuasive cover letters instantly.',
            full: 'Generate a polished cover letter for any role, built from your actual experience and what the job is asking for.',
            plan: 'AI-generated cover letters from your experience',
        },
        action: { short: 'Create', full: 'Write' },
        iconName: 'PenTool',
        colorKey: 'violet',
        category: 'JOB',
        tier: 'plus',
        targetView: 'cover-letters',
        link: '/jobs/cover-letters',
        rank: 2,
        showOnHomepage: true,
        planHighlight: true,
    },
    QUALITY_LOOP: {
        id: 'quality-loop',
        key: 'QUALITY_LOOP',
        name: 'Cover Letter Quality Loop',
        shortName: 'Quality Loop',
        description: {
            short: 'Multi-pass cover letter refinement.',
            full: "A simulated hiring manager reads, scores, and rewrites your cover letter — running up to 3 revision passes until it's ready to send.",
            plan: 'Multi-pass cover letter revision engine',
        },
        action: { short: 'Refine', full: 'Refine' },
        iconName: 'RefreshCw',
        colorKey: 'violet',
        category: 'JOB',
        tier: 'pro',
        targetView: 'cover-letters',
        link: '/jobs/cover-letters',
        rank: 16,
    },
    HISTORY: {
        id: 'history',
        key: 'HISTORY',
        name: 'Application Tracker',
        shortName: 'History',
        description: {
            short: 'Save jobs from any site with one click.',
            full: "Keep tabs on every job you've analyzed. Track your application status, review past results, and watch your scores over time.",
            plan: 'Unlimited saving & tracking of roles',
        },
        action: { short: 'View all', full: 'View all' },
        iconName: 'Bookmark',
        colorKey: 'blue',
        category: 'JOB',
        tier: 'explorer',
        targetView: 'history',
        link: '/jobs/history',
        rank: 6,
        showOnHomepage: true,
        planHighlight: true,
    },
    FEED: {
        id: 'feed',
        key: 'FEED',
        name: 'Job Feed',
        shortName: 'Job Feed',
        description: {
            short: 'Pre-scored matches from your alerts.',
            full: 'A live feed of pre-scored job matches, automatically triaged from the alerts you forward. Your best opportunities, ranked and ready.',
            plan: 'Live feed of ranked job matches',
        },
        action: { short: 'View feed', full: 'Open Feed' },
        iconName: 'Zap',
        colorKey: 'indigo-dark',
        category: 'JOB',
        tier: 'plus',
        targetView: 'feed',
        link: '/jobs/feed',
        rank: 4,
        showOnHomepage: true,
        planHighlight: true,
    },
    MAIL_IN: {
        id: 'mail-in',
        key: 'MAIL_IN',
        name: 'Email Job Alerts',
        shortName: 'Inbound',
        description: {
            short: 'Forward jobs to analysis via email.',
            full: 'Forward your job board alerts to a unique Navigator email. Every listing gets analyzed and scored automatically in your feed.',
            plan: 'Auto-analyze jobs forwarded via email',
        },
        action: { short: 'View token', full: 'Set up' },
        iconName: 'Mail',
        colorKey: 'amber-dark',
        category: 'JOB',
        tier: 'plus',
        targetView: 'feed',
        link: '/jobs/feed',
        rank: 9,
        showOnHomepage: true,
        isComingSoon: true,
    },
    SKILLS_INTERVIEW: {
        id: 'skills-verify',
        key: 'SKILLS_INTERVIEW',
        name: 'Skills Interview',
        shortName: 'Interview',
        description: {
            short: 'Prove your skills with AI interviews.',
            full: 'Prove your skills with a live AI-powered interview. Answer real questions, get instant feedback, and earn verified proficiency badges.',
            plan: 'AI skill verification interviews',
        },
        action: { short: 'Start', full: 'Start' },
        iconName: 'Shield',
        colorKey: 'emerald',
        category: 'COACH',
        tier: 'plus',
        targetView: 'skills',
        link: '/career/skills',
        rank: 17,
    },
    INTERVIEW_ADVISOR: {
        id: 'interview-advisor',
        key: 'INTERVIEW_ADVISOR',
        name: 'Interview Advisor',
        shortName: 'Mock Interview',
        description: {
            short: 'Realistic mock interviews with scoring.',
            full: 'Run realistic mock interviews for a specific job or general prep. Get scored in real time with smart, adaptive follow-up questions.',
            plan: 'AI-powered mock interviews with scoring',
        },
        action: { short: 'Practice', full: 'Practice' },
        iconName: 'MessageSquare',
        colorKey: 'sky',
        category: 'JOB',
        tier: 'plus',
        targetView: 'interviews',
        link: '/jobs/interviews',
        rank: 18,
        isComingSoon: true,
    },
    COACH: {
        id: 'coach',
        key: 'COACH',
        name: 'Career Roadmaps',
        shortName: 'Roadmap',
        description: {
            short: 'Analyze skill gaps for any role.',
            full: "See exactly what's between where you are now and where you want to be. Get a concrete, step-by-step plan to close the gap.",
            plan: 'Step-by-step navigation to your goal role',
        },
        action: { short: 'Scale up', full: 'Learn more' },
        iconName: 'TrendingUp',
        colorKey: 'teal',
        category: 'COACH',
        tier: 'pro',
        targetView: 'career-home',
        link: '/career/growth',
        rank: 7,
        showOnHomepage: true,
        planHighlight: true,
    },
    ROLE_MODELS: {
        id: 'role-modeling',
        key: 'ROLE_MODELS',
        name: 'LinkedIn Role Modeling',
        shortName: 'Role Models',
        description: {
            short: 'Compare your path to industry leaders.',
            full: "Upload a mentor's LinkedIn profile and see a side-by-side comparison of your skills, experience, and credentials against theirs.",
            plan: 'Compare your path to industry leaders',
        },
        action: { short: 'Compare', full: 'Compare' },
        iconName: 'Users',
        colorKey: 'teal',
        category: 'COACH',
        tier: 'pro',
        targetView: 'career-home',
        link: '/career/models',
        rank: 19,
        planHighlight: true,
    },
    BOOKMARKLET: {
        id: 'bookmarklet',
        key: 'BOOKMARKLET',
        name: 'Browser Extension',
        shortName: 'Extension',
        description: {
            short: 'Save jobs from any website instantly.',
            full: "Save job postings from any website with a single click. No more copying and pasting descriptions — just click and it's captured.",
            plan: 'One-click job saving from any site',
        },
        action: { short: 'Install', full: 'Install' },
        iconName: 'Globe',
        colorKey: 'blue',
        category: 'JOB',
        tier: 'explorer',
        targetView: 'history',
        link: '/jobs/history',
        rank: 20,
    },
    EDU: {
        id: 'edu',
        key: 'EDU',
        name: 'Transcript',
        shortName: 'Edu',
        description: {
            short: 'High-fidelity academic pathfinding.',
            full: 'Explore degree programs and certifications. We match your career goals with the precise educational paths needed to achieve them.',
            plan: 'AI-powered tools for degree & program planning',
        },
        action: { short: 'Scout', full: 'Scout' },
        iconName: 'GraduationCap',
        colorKey: 'amber',
        category: 'EDUCATION',
        tier: 'pro',
        targetView: 'edu-home',
        link: '/education',
        rank: 8,
        showOnHomepage: true,
        planHighlight: true,
    },
    EDU_TRANSCRIPT: {
        id: 'edu-transcript',
        key: 'EDU_TRANSCRIPT',
        name: 'Academic Transcript',
        shortName: 'Transcript',
        description: {
            short: 'Manage coursework and monitor progress.',
            full: 'Track your coursework, credits, and degree progress all in one place. See a clear picture of where you stand academically.',
            plan: 'Coursework and degree progress tracking',
        },
        action: { short: 'View', full: 'Open' },
        iconName: 'GraduationCap',
        colorKey: 'amber',
        category: 'EDUCATION',
        tier: 'explorer',
        targetView: 'edu-transcript',
        link: '/education/transcript',
        rank: 10,
    },
    EDU_EXPLORER: {
        id: 'edu-explorer',
        key: 'EDU_EXPLORER',
        name: 'Program Explorer',
        shortName: 'Programs',
        description: {
            short: "Explore master's degrees and certs.",
            full: 'Get personalized recommendations for degrees, certifications, and bootcamps that align with where you want your career to go.',
            plan: 'Personalized degree & certification recommendations',
        },
        action: { short: 'Scout', full: 'Explore' },
        iconName: 'School',
        colorKey: 'emerald',
        category: 'EDUCATION',
        tier: 'pro',
        targetView: 'edu-programs',
        link: '/education/programs',
        rank: 11,
    },
    EDU_GPA: {
        id: 'edu-gpa',
        key: 'EDU_GPA',
        name: 'GPA Calculator',
        shortName: 'GPA',
        description: {
            short: 'Calculate targets and track performance.',
            full: 'Calculate your current GPA and play out different grade scenarios. See exactly what it takes to reach your target number.',
            plan: 'GPA calculation and scenario planning',
        },
        action: { short: 'Calculate', full: 'Calculate' },
        iconName: 'Calculator',
        colorKey: 'blue',
        category: 'EDUCATION',
        tier: 'explorer',
        targetView: 'edu-gpa',
        link: '/education/gpa',
        rank: 12,
    },
} as const;

// ─── Categories ────────────────────────────────────────────────────────

export const FEATURE_CATEGORIES = {
    JOB: 'JOB',
    COACH: 'COACH',
    EDUCATION: 'EDUCATION',
} as const;

// ─── Journey-based Rankings ────────────────────────────────────────────

export const FEATURE_RANKINGS: Record<string, string[]> = {
    'job-hunter': [
        'JOBFIT', 'KEYWORDS', 'RESUMES', 'COVER_LETTERS',
        'FEED', 'HISTORY', 'MAIL_IN', 'COACH', 'EDU',
    ],
    'student': [
        'EDU', 'JOBFIT', 'KEYWORDS', 'RESUMES', 'COVER_LETTERS',
        'FEED', 'HISTORY', 'MAIL_IN', 'COACH',
    ],
    'employed': [
        'COACH', 'KEYWORDS', 'ROLE_MODELS', 'RESUMES', 'COVER_LETTERS',
        'JOBFIT', 'FEED', 'HISTORY', 'MAIL_IN',
    ],
    'career-changer': [
        'COACH', 'JOBFIT', 'KEYWORDS', 'RESUMES', 'COVER_LETTERS',
        'FEED', 'HISTORY', 'MAIL_IN',
    ],
    'pro': [
        'JOBFIT', 'COACH', 'EDU', 'KEYWORDS', 'RESUMES',
        'COVER_LETTERS', 'FEED', 'HISTORY', 'MAIL_IN',
    ],
    'admin': [
        'JOBFIT', 'COACH', 'EDU', 'KEYWORDS', 'RESUMES',
        'COVER_LETTERS', 'FEED', 'HISTORY', 'MAIL_IN',
    ],
};

// ─── Helper Functions ──────────────────────────────────────────────────

/** Get the color config for a feature */
export const getFeatureColor = (feature: FeatureDefinition): FeatureColor => {
    return FEATURE_COLORS[feature.colorKey] || FEATURE_COLORS.indigo;
};

/** Get all features as an array, optionally filtered */
export const getAllFeatures = (): FeatureDefinition[] => {
    return Object.values(FEATURE_REGISTRY);
};

/** Get features eligible for the homepage grid */
export const getHomepageFeatures = (): FeatureDefinition[] => {
    return getAllFeatures().filter(f => f.showOnHomepage);
};

/** Get features by tier (cumulative — includes lower tiers) */
export const getFeaturesByTier = (tier: 'explorer' | 'plus' | 'pro'): FeatureDefinition[] => {
    const tierLevel: Record<string, number> = { explorer: 0, plus: 1, pro: 2 };
    const level = tierLevel[tier];
    return getAllFeatures().filter(f => tierLevel[f.tier] <= level);
};

/** Get hand-picked features to highlight on plan cards */
export const getFeaturesForPlan = (tier: 'explorer' | 'plus' | 'pro'): FeatureDefinition[] => {
    return getAllFeatures().filter(f => f.planHighlight && f.tier === tier);
};

// ─── Backward Compatibility ────────────────────────────────────────────
// These re-exports allow gradual migration from the old BENTO_CARDS API.
// Consumers can switch to FEATURE_REGISTRY at their own pace.

/** @deprecated Use FEATURE_REGISTRY instead */
export const BENTO_CARDS_COMPAT = Object.fromEntries(
    Object.entries(FEATURE_REGISTRY).map(([key, feature]) => [
        key,
        {
            id: feature.id,
            rank: feature.rank,
            category: feature.category,
            iconName: feature.iconName,
            targetView: feature.targetView,
            title: { marketing: feature.shortName, action: feature.shortName },
            description: { marketing: feature.description.short, action: feature.description.full },
            action: { marketing: feature.action.full, action: feature.action.short },
            colors: getFeatureColor(feature),
        },
    ])
);

/** @deprecated Use FEATURE_CATEGORIES instead */
export const BENTO_CATEGORIES_COMPAT = FEATURE_CATEGORIES;

/** @deprecated Use FEATURE_RANKINGS instead */
export const BENTO_RANKINGS_COMPAT = FEATURE_RANKINGS;
