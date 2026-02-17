# Changelog
 
All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- **Abuse Prevention**: Implemented browser fingerprinting to detect and limit multi-account abuse (`fingerprint.ts`).
- **Data Integrity**: Added `job_id` tracing to all AI operations (`aiCore.ts`) for debugging.
- **Career**: Implemented a "Quick Add" goal input in the Gap Analysis empty state.
- **Career**: Added functional Drag & Drop support to the Role Models empty state.
- **Education**: Implemented randomized, aspirational headlines for the Education Command Center.
- **UX**: Feature cards are now fully clickable, ensuring a smoother transition to actions like "Analyze" or authentication.
- **UI**: Implemented layout safeguards (`min-height`) in `BentoCard.tsx`.

### Changed
- **Branding**: Rebranded "Navigator Score" to **Match Score** and standardized feature card titles.
- **Onboarding**: Updated `WelcomeScreen` to collect user names and register device IDs during signup.
- **Education**: Complete UI overhaul of the `EducationDashboard` to align with the premium design system.
- **Education**: Refined tools grid with premium card styles (`rounded-[2rem]`) and active scaling.
- **Career**: Redesigned the "GENERAL/TECHNICAL" toggle in `GapAnalysisSection.tsx` with premium glassmorphism.
- **Career**: Redesigned the "Emulate" / "Destination" mode selector in `CoachHero.tsx`.
- **Career**: Refactored Coach architecture to support multi-file processing and added a LinkedIn export guide.
- **History**: Redesigned the Application History screen with premium glassmorphism and lift effects.
- **History**: Implemented dynamic visibility for status filters and overhauled "Analyzing"/"Failed" states.
- **Architecture**: Unified profile management in `UserContext` and added missing route constants.

### Fixed
- **Stability**: Resolved "Failed to fetch dynamically imported module" errors by implementing `lazyWithRetry`.
- **Auth**: Resolved a discrepancy between modal systems that prevented authentication triggers in logged-out states.
- **History**: Resolved logical inconsistencies where failed analyses still displayed "Analyzing..." placeholders.

## [2.12.0] - 2026-02-16
### Added
- **Global UI**: Architecture: Migrated theme state to `GlobalUIContext` for unified state management across the application.
- **Navigation**: Added interactive navigation to the "Profiles" and "Goals" stats cards on the Coach Dashboard.

### Changed
- **Branding**: Officially moved past "Beta" terminology in the UI. Renamed "Join the Beta" to "Create Account" and "Beta" tester tags to "Early Access".
- **Branding**: Simplified header branding to **Navigator**.
- **UX**: Removed the "work email" requirement/nudge from the sign-in modal to be more inclusive.
- **Auth**: Simplified authentication flow titles and removed waitlist references.
- **Navigation**: Updated active state style for main navigation with category-specific colors (Indigo, Emerald, Amber).
- **Settings**: Complete UI overhaul with a 3-column layout (Account, Plan & Usage, Settings).
- **Performance**: Removed ambient background animations to reduce resource usage.

### Fixed
- **Navigation**: Resolved a redirection bug where Career sub-pages (Models, Gap) incorrectly kicked users back to the main Coach view.
- **Routing**: Consolidated view-ID-to-path mappings for improved consistency across `AppRoutes` and `AppLayout`.
- **Navigation**: Fixed the "active pill" shape distortion during tab transitions.
- **Routing**: Fixed a mismatch between the `ROUTES.ANALYZE` constant and the route definition in `AppRoutes.tsx`.
- **Coach**: Resolved issue where Coach sub-pages were redirecting to the Coach Home page.
- **Usage Limits**: Fixed a bug where Admin and Tester users were subject to Free tier analysis limits.
- **Usage Limits**: Fixed a UI bug where admin users initially saw a "0 / 3" limit.
- **Security**: Hardened database functions by setting `search_path = public`.
- **Admin**: Restored full Admin Dashboard functionality and fixed database schema drift.

## [2.11.9] - 2026-02-16
### Added
- **Education module**: Restored the `EducationDashboard` (Overview) as the main entry point for the module.

### Changed
- **Navigation**: Separated "Education" (Overview) and "Academic Record" (Transcript) into distinct routes.
- **Routing**: Updated structure to support `/edu` and `/edu/record`.

### Fixed
- **Stability**: Resolved build-breaking TypeScript errors in `SettingsModal.tsx` and `EducationDashboard.tsx`.

## [2.11.1] - 2026-02-15
### Fixed
- **Navigation**: Resolved a layout issue where the navigation pill appeared below the header elements. Aligned it vertically to the center.
- **Stability**: Resolved a merge conflict in `Header.tsx` to ensure type safety.

### Added
- **Quality Assurance**: Added automated tests for `Header` layout integrity to prevent regressions.
- **Workflow**: Introduced a UI Quality Checklist for future interface updates.

## [2.11.0] - 2026-02-15
### Added
- **Navigation**: Integrated `framer-motion` for a premium, smooth transition experience. Includes a "sliding puck" active indicator and fluid layout resizing for the central navigation island.

### Fixed
- **Stability**: Resolved several build-breaking TypeScript errors caused by unused imports and variables in `SettingsModal.tsx`, `CoachContext.tsx`, and `storageCore.ts`.

## [2.10.0] - 2026-02-15
### Added
- **Architecture**: Established a "Single Source of Truth" for spacing using semantic categories (`hero`, `compact`, `none`) in `SharedPageLayout` and `PageLayout`. This ensures pixel-perfect vertical alignment across the entire app.

### Changed
- **Branding**: Simplified header branding from "Job Navigator" to just **Navigator** for a unified identity.
- **UI Refinement**: Standardized all pages with hero headers (Home, Job Detail, Coach, Grad) to a consistent `pt-24` top offset.
- **Honest Design**: Removed misleading grey circle placeholders and redundant copy from the Hero section.
- **Header**: Reverted the "Sign In" button to a clean text-only style for a more minimal aesthetic.
- **Cleanup**: Stripped all ad-hoc layout wrappers and paddings from `AppRoutes.tsx`.

## [2.9.0] - 2026-02-15
### Changed
- **Architecture**: Completed a major 3-phase refactor to improve modularity and maintainability.
  - **App Shell**: Extracted routing into `AppRoutes.tsx` and layout into `AppLayout.tsx`, reducing `App.tsx` from 400+ lines to 35.
  - **Context Logic**: Extracted heavy business logic from `JobContext` and `CoachContext` into dedicated "Manager" hooks (`useJobManager`, `useCoachManager`).
  - **Global Modal System**: Implemented a centralized `ModalContext` to eliminate prop-drilling for all global modals (Auth, Settings, etc.).
- **Visuals**: Cleaned up the application shell and improved background transitions.

### Added
- **Job Alert Email Feed**: Implemented an AI-powered system that captures job alerts from inbound emails (Postmark) and triages them automatically in a new "Job Feed" view.
- **Inbound Email Tokens**: Unique Navigator email addresses generated per user for private job alert redirection.
- **Gemini Ingestion Engine**: Supabase Edge Function using Gemini to extract job data, calculate match scores, and provide triage reasoning from raw email bodies.
- **Auto-Cleanup**: Automated 7-day TTL (Time-To-Live) for feed items to keep the stream fresh and self-cleaning.
- **Monetization**: Restrictive access to Job Automation features for Pro-tier users with integrated upgrade nudges.
- **Save to History**: One-click bookmarking to move jobs from the transient Feed to permanent application History.

## [2.8.3] - 2026-02-14
### Changed
- **Premium Design**: Redesigned the Bento feature grid with a unique, muted color palette (Sky, Violet, Rose, Indigo, Teal) for a more sophisticated and professional aesthetic.
- **Visual Consistency**: Ensured color uniqueness across all 10+ feature variants in both logged-in and logged-out states.

### Fixed
- **Navigation**: Resolved a critical issue where the header menu buttons updated the UI state but failed to trigger actual URL changes, causing the app to feel "broken" when navigating between modules.
- **Routing**: Implemented a bidirectional sync between the Global UI state and React Router URLs to ensure consistency across the application.

## [2.8.2] - 2026-02-13
### Changed
- **UI Refinement**: Reduced top padding and improved hero card spacing in `HomeInput` for a more balanced layout.
- **Layout**: Simplified route wrappers in `App.tsx` by delegating spacing to the `SharedPageLayout` component.

## [2.8.1] - 2026-02-13
### Fixed
- **Deployment**: Resolved a Vercel build failure caused by an unused `React` import in `LandingContent.tsx` which triggered a TypeScript error.

 
## [2.8.0] - 2026-02-13
### Added
- **Genuine Usage Tracking**: Implemented a two-tier tracking system distinguishing between user "Interest" (clicks) and actual "Usage" (feature actions) across all modules (JobFit, Coach, Keywords, Resumes, Cover Letters).
- **Admin Conversion Dashboard**: Added a comprehensive "Feature Usage" breakdown in Settings for Admins, showing curiosity (CLK) vs action (ACT) with real-time conversion rates.

### Changed
- **Centralized UI**: Unified `FeatureGrid.tsx` for a consistent 5-column layout across both logged-in and logged-out views.
- **UI Refinement**: Removed inaccurate "1,200+ analysis" badge from the landing page.

### Fixed
- **Stability**: Resolved "Failed to fetch" errors with `SettingsModal` dynamic imports.
- **Code Quality**: Fixed over 30 linting errors and resolved unused import warnings across the codebase.

## [2.7.0] - 2026-02-12
### Added
- **Education Module**: Reimagined `MAEligibility` as a **Targeted Program Fit** analyzer. Features include specific Match % scores, side-by-side GPA benchmarking, and traffic-light course mapping.
- **Career Module**: Implemented **Trajectory Comparison** overlay for side-by-side visualization of user journey vs. role model history (Point A to Point B).
- **Career Module**: Added **Evidence Quick-Copy** feature to Gap Analysis, providing AI-tailored resume bullets ready for one-click use.
- **AI Infrastructure**: Upgraded `analyzeMAEligibility` prompt to act as a "Program Architect," reverse-engineering school-specific admission requirements.

### Fixed
- **History**: Resolved a bug where jobs in "Analyzing" or "Failed" states were hidden from the "Saved" filter view.
- **History**: Added distinct status labels and visual styles (including pulse animations) for "Analyzing" and "Failed" job states.
- **Storage**: Implemented a "Sync Fallback" to ensure jobs with "Analyzing" or "Failed" statuses are compatible with the backend database constraints.
- **History**: Resolved a filtering bug where jobs without a status (implicitly "Saved") were hidden from the "Saved" view.
- **History**: Fixed a React linting error by moving the `StatusTab` component out of the render cycle.
- **Tests**: Resolved failing tests in `jobStorage.test.ts` by correcting the Supabase mock path and updating test data to use valid UUIDs.
- **Tests**: Updated `History.test.tsx` to align with the current empty-state UI text.
- **Code Quality**: Fixed a critical "access before declaration" error in `ToastContext.tsx` and resolved over 30 linting errors across `App.tsx`, `AuthModal.tsx`, `JobDetail.tsx`, and AI service files.

### Changed
- **Coach Dashboard**: Refactored `CoachDashboard.tsx` by extracting logic into atomic components (`CoachHero`, `RoleModelSection`, `GapAnalysisSection`) to improve maintainability.
- **Edu Module**: Refactored `AcademicHQ.tsx` by extracting logic into atomic components (`AcademicHero`, `AcademicProfileSummary`, etc.).
- **Testing & Stability**: Implemented a comprehensive test suite (23 new tests) for Career and Edu modules.
- **Code Quality**: Refined type definitions in `storageCore.ts` and improved error handling in Edge Functions.
- **State Management**: Resolved a nested state mutation bug in `useAcademicLogic` that affected credit calculations.
- **Test Infrastructure**: Fixed global state leakage in `localStorage` by ensuring mock stores are cleared.

## [2.6.0] - 2026-02-12

### Security
- **Backend AI Selection**: Migrated model resolution and Gemini API calls to a secure Supabase Edge Function to prevent client-side tampering and enforce subscription tiers.
- **JWT Verification**: Implemented mandatory authentication for all AI requests via the backend proxy.

### Changed
- Refactored `jobAiService`, `resumeAiService`, and `eduAiService` to use task-based model selection.
- Removed `TIER_MODELS` configuration from frontend to better hide backend logic.

## [2.5.0] - 2026-02-12

### Added
- **AI Infrastructure**: Implemented a **Tiered AI Model Strategy** that dynamically resolves models based on user subscription tiers (`free`, `pro`, `admin`, `tester`).
- **AI Infrastructure**: Added support for **Gemini 2.5 Pro** (Standard Pro) and **Gemini 3 Pro** (State of the Art Reasoning) for professional and admin tiers.
- **UX**: Added interactive status filter tabs (Applied, Interview, Offer, Rejected) to the `History` page for faster navigation.

### Changed
- **Architecture**: Refactored `aiCore.ts`, `jobAiService.ts`, `resumeAiService.ts`, and `eduAiService.ts` to support multi-model orchestration and task-based model selection.
- **Improved**: Enhanced developer visibility into AI API errors with explicit logging in `aiCore.ts`, surfacing specific error codes (like 404s) before generalization.
- **UI**: Redesigned the `History` page using the `PageLayout` component to match the premium aesthetic of the Job Feed.
- **UI**: Replaced the `History` grid with a detailed vertical list view, surfacing key metadata like Match Score and Application Status.
- **UI**: Removed "Save from anywhere" bookmarklet from the homepage to reduce clutter. It now only appears on job pages.
- **UX**: Job analysis now runs in the background, allowing users to read the job description or navigate the app while the AI processes the role. Replaces the blocking full-screen loader with non-intrusive skeleton states.

### Fixed
- **AI**: Resolved "404 Not Found" errors and application-wide "Connection issue" messages caused by the retirement of the `gemini-1.5-pro` model.
- **Tests**: Updated `constants.test.ts` to align with the new task-based model constants (`EXTRACTION`, `ANALYSIS_PRO`).

## [2.4.0] - 2026-02-12

### Added
- **Safety**: Automated detection of "No AI" policies in job descriptions. Warnings are displayed in the Cover Letter Editor to protect users from disqualification.
- **Agentic Workflow**: "Auto-Iterate" agent for Pro users that critiques and refines cover letters in a feedback loop until quality thresholds are met.
- **UX**: New "Job Post" tab in `JobDetail` that displays a clean, AI-distilled version of the job description, removing navigation and footer clutter.
- **Architecture**: Shared "Gradient Header" and "Page Layout" components to unify the design across Job, Coach, and Grad modules.
- **Stability**: Global Error Boundary to prevent application crashes from isolated component errors.

### Changed
- **Performance**: Increased job extraction limit to 15,000 characters to support full-page "Ctrl+A" pastes without data loss.
- **Code Quality**: Enforced strict `import type` usage across all services for better tree-shaking and smaller bundle sizes.
- **Refactor**: Centralized `extractJobInfo` logic to return structured `DistilledJob` data including new safety flags (`isAiBanned`).

### Fixed
- **UI**: Fixed card separator misalignment by enforcing consistent height for preview sections in `BentoCard`.
- **UI**: Reduced the height of dashboard cards in `ActionGrid` and `BentoCard` to improve visual density and reduce scrolling.
- **UI**: Fixed Dark Mode toggle by adding missing Tailwind v4 `@custom-variant` configuration.

## [2.3.4] - 2026-02-11

### Changed
- **Header**: Refactored `HeroHeader` into a reusable component for consistent branding across Job, Coach, and Grad pages.
- **Performance**: Removed expensive ambient background animations to reduce system resource usage.

### Fixed
- **Layout**: Fixed vertical alignment offset in `HomeInput` (Analyze page) by standardizing top padding.
- **Stability**: Resolved syntax errors and conditional rendering logic in `CoachDashboard` that caused white screens.

## [2.3.3] - 2026-02-11

### Fixed
- **Deployment**: Removed `/Navigator` base path configuration to support root domain deployment on Vercel.

## [2.3.2] - 2026-02-11

### Fixed
- **Routing**: Fixed a routing configuration mismatch (`base` vs `basename`) that caused a blank screen on deployment.

## [2.3.1] - 2026-02-11

### Fixed
- **Design System**: Restored clean `neutral` palette, removing the inadvertent blue tint from both theme modes.
- **Dark Mode**: Refined dark mode back to core black (`#0a0a0a`).
- **Layout**: Corrected the `History` view width to match the standard site container (`max-w-7xl`).
- **Visibility**: Fixed legibility of animated headlines ("Ace the...") that was impacted by theme changes.

### Removed
- **Marketing**: Removed the "ATS Comparison" and "Analyzing JD" preview graphics based on feedback.

## [2.3.0] - 2026-02-07

### Added
- **Programmatic SEO**: Implemented a dynamic SEO landing page engine at `/resume-for/:role` with a universal master template.
- **Canonical Routing**: Added a `CanonicalService` to map diverse job titles to standard high-quality SEO buckets.

### Changed
- **Architecture**: Refactored application state to distinguish between `activeSubmissionId` (specific user action) and `roleId` (canonical job role).
- **Architecture**: Updated all navigation and state logic to use the new "Submission ID" terminology for better clarity.
- **Routing**: Integrated `react-router-dom` more deeply to handle persistent SEO URLs and history navigation.

## [2.2.1] - 2026-02-07

### Changed
- **UI**: Narrowed Bento grid containers (`max-w-7xl`) to align perfectly with the header's navigation boundaries.
- **UI**: Reordered header buttons to a more logical flow: Log Out → Admin → Settings.
- **UI**: Optimized the `ActionGrid` to display 5 cards in a single row on XL screens for better balance.

### Fixed
- **UI**: Resolved a race condition where the "Sign In" button and navigation pill would flicker or appear together during authentication loading.
- **Build**: Fixed an unused `TrendingUp` icon import in `MarketingGrid` that was causing Vercel deployment failures.

## [2.2.0] - 2026-02-05

### Added
- **Role Model Emulation**: Comparison mode to bridge the gap between user profile and specific Role Models (`analyzeRoleModelGap`).
- **Token Usage Tracking**: Granular, per-user tracking of AI token consumption in `daily_usage`.
- **Admin Insights**: `usage_outliers` SQL view to detect abusive token usage per subscription tier.

### Security
- **Hardening**: Explicitly set `search_path = public` on all PL/PGSQL functions to prevent hijacking.
- **Privacy**: Restricted `daily_usage` table visibility to Admins only via RLS.
- **Reliability**: Enforced `application/json` on AI responses and implemented manual input sanitization.

## [2.1.4] - 2026-02-02

### Changed
- **UI**: Removed "Role Model Synthesis" card from logged-out marketing grid. Kept 8 cards for a perfect 2x4 layout: JobFit Score, Keyword Targeting, Private Vault, Smart Cover Letters, Tailored Summaries, Bookmarklet, AI Career Coach, and 12-Month Roadmap.
- **UI**: Updated `WelcomeScreen` feature cards to use `rounded-[2.5rem]` border radius for consistency with the glassmorphism design system.

## [2.1.3] - 2026-02-01

### Changed
- **UI**: Removed the "Bookmarklet" card from the marketing grid to create a perfect 8-card layout (2 rows of 4).

## [2.1.2] - 2026-02-01

### Changed
- **UI**: Aligned logged-out marketing card dimensions with logged-in action cards. Updated to 4-column grid, `p-6` padding, and `1920px` max-width.

## [2.1.1] - 2026-02-01

### Fixed
- **UI**: Fixed a bug where both marketing cards and action cards would render simultaneously for logged-out users. Added strict user session checks to the action card grid.

## [2.1.0] - 2026-02-01

### Changed
- **UI**: Unified design system between logged-in and logged-out states. All cards now use the premium glassmorphism aesthetic (`rounded-[2.5rem]`, backdrop blur).
- **Welcome**: Refined `WelcomeScreen` features with glassmorphism style for a better first impression.

## [2.0.1] - 2026-02-01

### Fixed
- **Build**: Fixed syntax error and unused variable in `CoachDashboard` that caused Vercel deployment failure.

## [2.0.0] - 2026-02-01

### Added
- **AI Career Coach**: New dashboard for career path analysis and role model tracking.
- **Role Model Support**: Capability to upload and distill patterns from LinkedIn profile PDFs.
- **Gap Analysis**: Detailed skill gap comparison between user profile and target roles.
- **12-Month Trajectory**: Automated professional roadmap generation.

### Fixed
- **Performance**: Resolved an infinite render loop in `HomeInput` component that caused high CPU usage.
- **Cleanup**: Terminated orphaned background processes during initialization.

## [1.1.0] - 2026-01-25

### Fixed
- **Security**: Removed hardcoded admin email from client code; admin status is now checked server-side via Supabase profiles.
- **Security**: Removed hardcoded invite code bypass; invite codes are now validated exclusively via server-side RPC.
- **Security**: Implemented AES-GCM encryption for API keys stored in `localStorage` using the Web Crypto API.
- **Security**: Eliminated third-party proxy dependency (`corsproxy.io`) for web scraping; all scraping is now handled via Supabase Edge Functions.

### Added
- Standardized documentation format including `SECURITY.md` and `LICENSE`.
- Secure storage utility for client-side encryption.

---

## [1.0.0] - 2026-01-24

### Added
- Initial release of JobFit.
- Job analysis with Google Gemini.
- Resume "Blocks" system.
- Cover letter generation.
- Local-first data storage.
