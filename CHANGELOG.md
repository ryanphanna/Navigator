# Changelog

All notable changes to this project will be documented in this file.

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
