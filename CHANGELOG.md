# Changelog

All notable changes to this project will be documented in this file.

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
