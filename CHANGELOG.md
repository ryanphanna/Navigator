# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [2.21.0] - 2026-02-24

### Architecture & Refactoring
- **Context-Aware URL Navigation**: Integrated the browser URL as the single source of truth. The UI now contextually derives its state from the path, ensuring perfect synchronization and eliminating redundant state management.
- **Autonomous Component Architecture**: Refactored core views (`Header`, `HomePage`, `JobMatchInput`, `JobDetail`, `CoachDashboard`, etc.) to directly consume dependencies from specialized Context hooks, completely eliminating massive amounts of prop drilling across the application shell.
- **Clean Routing Manifest**: Simplified `AppRoutes.tsx` into a lean, declarative manifest, decoupling business logic from the routing layer.

### Visual Excellence & Aesthetics
- **Premium Graphic Identity**: Launched a massive visual upgrade for Skills Bento cards. Replaced repetitive circular motifs with high-fidelity graphics featuring 3D orbiting particles, scanning pulse animations, and "Diamond/Prism" glass aesthetics.
- **3D Glassmorphic Depth**: Implemented a stacked glass tile architecture for skill previews, featuring translucent layered depth, background blurs, and dynamic hover-driven rotation.
- **Platform-Wide Design Standardization**:
    - Unified vertical baselines and "Segmented Control" aesthetics for filters and search bars (standardized to 40px height) across the entire platform.
    - Implemented a comprehensive removal of aggressive all-caps/uppercase styling in favor of a modern, professional sentence-case aesthetic.
    - Standardized global rounding to `rounded-2xl` for interactive elements and implemented high-contrast `font-black` typography for primary buttons.
    - Executed a comprehensive scaling and alignment pass on all dashboard graphics to ensure professional visual hierarchy.

### Resume & Skills Intelligence
- **Resume Preview Modal**: Introduced a high-fidelity modal for instant, print-ready resume visualization within the editor.
- **Interactive Skill Discovery**: Enabled one-click saving of AI-discovered keywords directly to the global database from the resume sidebar.
- **Unified Skill Indicators**: Reimagined the verification system into a single intuitive indicator. Verified skills now use emerald/orange checkmarks, while non-verified skills use proficiency dots.
- **Manual Achievement Control**: Added manual controls for achievement bullet reordering via interactive move buttons on hover.
- **Text Extraction High-Fidelity**: Upgraded the PDF extraction engine to proactively clean whitespace and resolve character artifacts (splitting ligatures like "fi", "fl", "ti") before AI processing.

### Core Enhancements
- **Seamless Authentication**: Overhauled the login experience into a fluid "one-flow" model using intelligent email detection to route users automatically, removing redundant manual toggles between signing in and signing up.
- **Education Module Refinement**: Reverted nomenclature back to standard terms (**Programs** and **Transcript**) and improved the program exploration UX with an expanded discovery container.
- **Resume Editor Streamlining**: Optimized the editor by removing redundant metrics (Strength Score, Pro-Tips, status badges) to prioritize a high-density, document-first writing experience.

### Fixed & Stabilized
- **React Stability**: Resolved "Rules of Hooks" violations in `ProtectedRoute` and fixed critical JSX syntax errors and hook initialization issues in the Resume Editor.
- **UI Logic Fixes**: Corrected cursor behavior on interactive elements, resolved scroll-jitter in the header, fixed card dropdown clipping, and restored missing iconography to status filters.
- **Data Integrity**: Resolved a "data loss" edge case by implementing latest-first recovery for resume records and fixed a malformed `user_skills` database schema.

## [2.20.0] - 2026-02-23

### Added
- **Premium Education Suite**: Launched a re-architected Education Dashboard and Transcript Registry. Includes a database of 60+ Canadian universities, automated credential extraction, and intelligent course reorganization.
- **Academic Autocomplete**: High-fidelity `SearchableInput` for universities, programs, and degrees.
- **Interview "Suggested Topics"**: Context-aware recommendations to ground interview answers in factual evidence from the user's history.
- **Smart Resume Strength Engine**: Real-time evaluation of impact, professional depth, and skill alignment with verifiable evidence tracking.
- **Career Tip Service**: Intelligent engine providing contextually aware career advice based on the current state of a user's resume.
- **Email Verification Flow**: Comprehensive "Trust & Safety" gate with glassmorphic status polling and anti-spam cooldown logic.
- **Automated Feature Badging**: System-wide dynamic "NEW" badges based on `releaseDate` metadata.

### Changed
- **Platform-Wide Aesthetic Refinement**: Executed a comprehensive "Casing Polish" to remove aggressive all-caps/tracking. Standardized button casing, icon sizing, and layout patterns across all modules.
- **Education Module Redesign**: 12-column Bento-style dashboard grid, modular Academic Overview cards, and modernized "Term-and-Course" card architecture.
- **Interview Advisor UX Polish**: Implemented Focused Session Mode and refined action labels for a more professional practitioner experience.
- **Resume Editor Evolution**: Streamlined sidebar architecture, migrated key actions to the global header, and improved multi-word skill extraction.
- **Enhanced Storage Sync**: Implemented a non-destructive merge strategy to prevent data loss during authentication/sync cycles.

### Fixed
- **Skill Persistence & Sync**: Resolved critical race conditions in the storage layer to ensure local data is correctly persisted to the cloud.
- **Bookmarklet Security**: Fixed drag-and-drop registration for the 'Save to Navigator' tool.
- **Interview Advisor Stability**: Synchronized focused mode state to prevent navigation bleed during active sessions.
- **Layout & Typographical Fixes**: Resolved search bar misalignments, button clipping, and missing font weight fallbacks.

### Removed

## [2.19.2] - 2026-02-22

### Changed
- **Footer Update**: Updated repository footer with "Happy Shipping!" and refined branding info.

## [2.19.1] - 2026-02-22

### Changed
- **Changelog Reorganization**: Implemented collapsible `<details>` sections for all historical releases (back to v2.0.0) and archived legacy history (pre-v2.0.0) into `CHANGELOG_ARCHIVE.md` to improve readability and file maintenance.

### Fixed
- **Navigation Consistency**: Resolved a bug where the 'Jobs' tab remained active when viewing the Upgrade page, Settings page, and other top-level landing views.

## [2.19.0] - 2026-02-22

### Added
- **Focused Session Mode**: Introduced a distraction-free "Focused Mode" for high-stakes assessments.
- **Interview Feedback Banking**: Enhanced the Interview Advisor with a new "Bank Suggestion" feature. Users can now persistently save AI-generated bullet points to their professional profile, bridging the gap between verbal narrative and their written resume.
- **Discovery Bank**: Integrated a persistent "Discovery Bank" sidebar in the Resume Editor that displays AI-captured suggestions from interview performance, featuring one-click "Apply" and "Dismiss" functionality.
- **Academic Contextual Analysis**: Integrated the user's academic transcript into the core Job Match engine. The AI now cross-references specific courses and grades to strengthen fit analysis, particularly beneficial for entry-level and transitional roles.
- **Cross-Module Communication**: Established a communication bridge between the Resume and Education modules. Transcripts are automatically fetched from local storage to provide deeper context during job analysis without manual input.
- **Academic Grounding Rules**: Updated the Job Fit prompt to leverage academic background as a substitute for or supplement to work experience when analyzing candidate-role alignment.
- **Skills module UI Polish**: Overhauled the "Your Skills" dashboard with a more compact, premium "Tag" design. Indicators (verified checkmark and proficiency dot) are now right-aligned to match the Job Analysis style and improve information density.
- **Design Parity (Skills)**: Aligned skill proficiency colors and "glow" effects with the main Job Match results, ensuring a cohesive visual language across both modules.
- **AI Discoveries Refresh**: Redesigned the Skill Suggestions section to use the new compact tag architecture and updated terminology ("Discoveries" / "AI Found") for better consistency with the platform's AI identity.
- **Prompt Architecture Refactor**: Decentralized the monolithic `analysis.ts` into a modular structure (`jobAnalysis.ts`, `coverLetter.ts`, `career.ts`, `education.ts`) for better maintainability and faster iteration.
- **High-Fidelity Cover Letters**: Overhauled the Cover Letter generation prompts to produce organic, narrative-driven documents that prioritize strategic alignment and professional depth over rigid word counts.

### Changed
- **Bento Grid UI Consistency**:
  - Standardized feature preview heights to a fixed 96px (`h-24`) to ensure perfect vertical alignment across all feature cards in the grid.
  - Resolved a layout discrepancy in the **Job Alerts** and **Feed** previews that previously caused neighboring cards to stretch and create excessive white space.
  - Refined vertical centering and hover scaling logic for system notice previews to maintain absolute design parity across the platform.
- **Premium Admin Dashboard**:
  - Rebranded "Admin Console" to a more professional **Admin** portal with a dedicated "Management Portal" identity.
  - Implemented **Consumption Efficiency** tracking, enabling real-time monitoring of average tokens consumed per network call.
  - Introduced a **System Health** command center with pulse indicators for live infrastructure monitoring.
  - Overhauled the usage table with high-fidelity behavioral flags (Extreme vs. High deviation) and premium typography.
  - Executed a dashboard-wide "Casing Polish," removing all-caps styling from labels, stats, and headers for a modern feel.
  - Standardized the dashboard layout using a premium 4-column grid with glassmorphism cards and responsive scaling.
- **Search & Filter Standardization**:
  - Enforced a consistent **60/40 split** between the search bar and filter controls across the application to ensure professional visual balance.
  - Standardized the layout logic in `StandardSearchBar`, using the `rightElement` prop to host filter groups in `Feed`, `History`, and `Skills` modules for absolute design parity.
  - Improved responsiveness by maintaining horizontal scrolling for filters within their allocated 40% space on desktop.
- **Program Explorer Premium Uplift**:
  - Overhauled the empty state for the Program Explorer with a high-fidelity `AcademicHero` interface, featuring Bento-style benefit cards and interactive glassmorphism design.
  - Integrated the `useAcademicLogic` hook directly into the Program Explorer, enabling users to upload and verify transcripts without navigating away from the discovery flow.
  - Enhanced the `AcademicHero` component with customizable title and description support.
- **Settings UI Optimization**:
  - Upgraded the "Current Focus" selection from a button grid to a premium, styled dropdown for a cleaner interface.
  - Implemented custom `ChevronDown` iconography and refined hover/focus states to align with the application's high-fidelity design language.
- **Header Premium Refinement**:
  - Centralized session branding into a sleek floating island that dynamically displays the active session name and icon.
  - Eliminated redundant branding from the left section of the header during focused sessions to prioritize content clarity.
  - Standardized the "Exit" button with exact horizontal alignment to the "Sign Out" position, featuring a smooth 180-degree rotation animation.
  - Implemented spatial preservation for right-side action icons (Admin, Theme, Settings) to maintain pixel-perfect layout consistency.
- **Skill Assessment & Interview Advisor**: Integrated the "Focused Mode" architecture across assessment modules, removing internal redundant headers for a more immersive experience.
- **Skill Verification Quality Focus**:
  - Implemented a standard cap of 8 skills per interview session to ensure high-fidelity, focused AI scenarios and prevent candidate fatigue.
  - Added a "Quality Focus" badge to the interview setup to clearly communicate the scope adjustment logic.
- **Homepage Bento Grid Optimization**:
  - Normalized card heights across the homepage spotlight grid by standardizing system notice previews to a fixed height.
  - Compacted BentoCard layouts by reducing minimum description heights and optimizing vertical spacing.
- **Global UI State**: Expanded global state management to support application-wide session awareness and synchronized UI focus transitions.
- **Resume Editor UI & Mechanics**:
  - Aligned the sticky sidebar with the top of the Professional Summary section for a balanced, premium layout.
  - Enhanced the sidebar with new interactive modules: **Resume Strength Meter**, **Top Skills Extracted**, and **AI Pro Tips**.
  - Standardized status badges with sentence-case styling for better readability.
- **Inclusive Career Journeys**: Overhauled onboarding journey selection to be more exhaustive and inclusive (Renamed "Grad School" to **Education**, "Career Planning" to **Career Growth**, and introduced **Just Exploring**).
- **Onboarding Personalization**: Refined journey descriptions and tailored headlines across the Welcome Screen and Onboarding flow.
- **Header Minimalist Refresh**: Streamlined header architecture by removing descriptive icons from functional page headers (`PageHeader` and `DetailHeader`).
- **Settings Synchronization**: Updated Account Settings to maintain absolute parity with the new onboarding journey categories and terminology.
- **Card Layout Consistency**: Implemented `mt-auto` alignment for action buttons across all homepage Bento cards, ensuring a uniform visual baseline.
- **Interactive Career Focus**: Upgraded the "Current Focus" setting to be fully interactive within the Account Settings page.
- **Aesthetic Refinement**: Executed a site-wide "Casing Polish," removing all-caps styling from feature previews, headers, and badges.
- **Feed Renaming**: Rebranded "Pro Feed" to simply **"Feed"** throughout the application for a more concise professional tone.
- **Search & Filter Synchronization**: Standardized the height of `StandardSearchBar` and `StandardFilterGroup` (44px / h-11) for perfect horizontal alignment across History, Feed, and Skills.
- **Resume Editor UI**: Redesigned experience blocks for better clarity and consolidated block controls next to the "Add Achievement" button.
- **Resume Editor Aesthetics**: Refined date badges with a full-rounded pill design, improved typography, and removed textured inner shadows.
- **UI Minimalism**: Streamlined the Resume Editor and Interview Advisor by removing redundant decorative icons and simplifying sidebar layouts.
- **Resume Automatic Sorting**: Implemented automatic chronological sorting (newest to oldest) for resume items within each section.
- **Resume Section Migration**: Added a "Move" dropdown to resume blocks, allowing users to transfer items between different sections.
- **Contextual Resume Entry**: Replaced the "Quick Add" sidebar list with contextual "Add" buttons in each section header.
- **Resume Editor Sidebar**: Overhauled sidebar architecture for absolute alignment, centering the "Experience Synced" status badge and refining typography.
- **BentoCard UI Refinement**: Standardized header and title container heights. Increased description line-clamp to 4 lines and optimized spacing.
- **Improved Coming Soon UX**: Relocated "Coming Soon" indicators to a prominent top-right badge and reserved action bar space globally for layout consistency.
- **Casing & Naming Standards**: Standardized feature display names in the registry (e.g., "Role Modeling", "Quality Loop") for better layout fit.
- **Usage Limit Transparency**: Refined the Plans page with explicit usage periods (e.g., "/ day", "/ week") for all limits.
- **Conversion Flow Optimization**: Upgraded the "Try it free" feature on the Features page to trigger authentication for guest users.
- **Vertical Alignment**: Resolved vertical positioning of the sticky sidebar to ensure absolute parity with the main editor header.
- **Footer Architecture**: Redesigned the global footer to centralize system metadata and reposition branding taglines.
- **Settings Clean-up**: Removed redundant Navigator branding and system version info from the Account Settings page.
- **Plans Page UX**: Moved the "Explore all features" link to be beside the monthly/annual switcher for better visibility.
- **Interview Advisor UI**: Standardized typography for buttons, labels, and status messages to align with the global design system.
- **Resume Editor UI**: Optimized the sticky sidebar layout with increased top offset (`top-24`) and standardized button variants.
- **Improved Focus**: Removed secondary placeholder states from the Resume Editor to prioritize a document-first writing experience.
- **Terminology Refinement**: Simplified technical terminology in Job Detail: "Key Skills", "Skill Match", and "Core Responsibilities".
- **Job Detail UI Aesthetics**: Switched headers from All-Caps to Title Case and increased font weights/sizes for a more premium look.
- **Layout Expansion**: Expanded the `JobDetail` container to `max-w-6xl` to better accommodate high-density analysis.
- **Programmatic Casing**: Implemented a global `stringUtils` utility to automatically handle Title Case and Sentence Case for AI-extracted data.
- **Balanced Cover Letter Critique**: Implemented a dual-gate critique system enforcing both technical fidelity and high-quality professional narrative.
- **Evidence Benchmarking**: Refined evidence requirements to prioritize "impactful relevance" over strict achievement tallies.
- **Job Detail Header UX**: Consolidated application status and external link actions into the primary Tab navigation row.
- **Reference Code Extraction**: Updated the AI analysis engine to specifically extract job reference numbers and IDs.
- **Location Context Polish**: Switched the location indicator to a map pin and improved geographical data extraction prompts.
- **Job Detail Header**: Expanded header to include extracted location and reference code with clear dedicated visual indicators.
- **Job Detail UI**: Standardized the Job Description header by removing "(AI CLEANED)" and all-caps styling.
- **UI Architecture**: Enhanced `DetailTabs` with a right-aligned `actions` slot and sticky glassmorphism support.
- **Cover Letter Sidebar**: Re-architected `JobDetail` layout to support a unified floating sidebar across Analysis, Resume, and Cover Letter tabs.
- **Simplified Cover Letter Editor**: Removed redundant internal grids and sidebars to fit parent layout architecture.
- **Module-Wide UI Polish**: Standardized typography and layout patterns across Grad Launchpad, GPA Calculator, Role Model Detail, and Onboarding.
- **Pricing & Plans**: Refined the plan comparison table with improved visual hierarchy and clearer value propositions.
- **Terminology Alignment**: Standardized "Browser Extension" to "Bookmarklet" across the feature registry and UI.
- **Premium Toast Notifications**: Redesigned notification system with a compact glassmorphism aesthetic and reduced dismissal timeout.
- **Bookmarklet UI**: Integrated persistent installation tips into Application History and Job Match pages.

### Fixed
- **Navigation Consistency**: Resolved a long-standing navigation bug where the "Jobs" menu item remained active while viewing the Admin page.
- **Resume Export Reliability**: Fixed the "Download PDF" feature by implementing a dedicated high-fidelity printable preview component.
- **Navigation**: Resolved a critical issue where the Settings button in the header failed to navigate to the Settings page.
- **Resume Editor**: Resolved a bug in the "Quick Add" functionality where secondary experience blocks failed to instantiate correctly.
- **Pro Feed Branding**: Renamed "Job Feed" to "Pro Feed" across the application and updated its primary icon to `Zap` for better consistency.
- **Match Breakdown (Strengths & Weaknesses)**: Restored the detailed Strengths and Weaknesses section to the Job Analysis view.
- **Concise Career Insights**: Optimized the Professional Insight prompt to deliver concise, high-impact reasoning (max 2 sentences).
- **Bookmarklet Integration**: Added support for direct job analysis via the 'Save to Navigator' bookmarklet from any external site.
- **Automatic Job Analysis**: Implemented automatic URL detection for the bookmarklet to pre-fill and trigger analysis instantly.
- **Unified Filter UI**: Compacted filter and search components and refactored the **Job Feed** to use the unified architecture.
- **UI Design Parity (Interviews & Career)**: Unified entry pages for Interview Advisor and Career Models with a consistent "Bento" architecture.
- **Bento Advisor UI**: Standardized Interview Advisor selection screen with compact Bento cards and refined typography.
- **Header Standardization**: Implemented consistent H1/Subtitle hierarchies and standard grid widths across all major modules.
- **Unified Page Architecture**: Standardized vertical alignment and title positioning across all modules using a consistent layout strategy.
- **Interview Advisor Refactor**: Redesigned entry page to use the global `SharedPageLayout` and `PageHeader` architecture.
- **Settings Page**: Replaced the Settings Modal with a dedicated, high-fidelity full-page experience.
- **Job Detail UX**: Refined alignment sections by removing sequential numbering and standardizing title casing.
- **Job Detail UX**: Prevented "blank" skeleton states during analysis by ensuring scanning animations persist until results are ready.
- **Resume UX**: Overhauled the "Resume" tab in Job Detail with a clean, document-inspired aesthetic.
- **Resume UX**: Resolved a layout conflict where floating action controls overlapped date range inputs.
- **Resume UX**: Refined Professional Summary section by removing redundant block counts and hiding duplicate delete icons.
- **Resume Editor**: Fixed a critical text wrapping bug where long professional summaries and achievement bullets were being cut off.
- **Resume Editor Labeling**: Restored descriptive section labels across the editor for better clarity.
- **Improved Sync Feedback**: Refined the "Synced" status indicator by removing the unnecessary timestamp.

### Removed
- **Settings Modal**: Removed the legacy modal-based settings interface to provide more breathing room for account management.
- **Resume Editor Empty States**: Removed redundant "No items found" placeholders and "Initialize Section" buttons.
- **History Page Bookmarklet Tip**: Removed the "Save from anywhere" banner from the Application History page.
- **All-Caps UI Transformation**: Removed `uppercase` text transformation across the entire application for a cleaner aesthetic.
- **Visual High-Intensity Styling**: Softened the visual profile of technical labels to improve readability and user empathy.
- **Resume Editor Pro Tip**: Removed the "Pro Tip" sidebar card to reduce visual noise and documentation clutter.

<details>
<summary>## [2.18.0] - 2026-02-21</summary>

### Added
- **Career Archetypes**: Launched an AI-powered professional persona system that analyzes application patterns to identify professional archetypes (Technologist, Leader, etc.) with premium interactive badges.
- **System Update Cards**: Implemented a sophisticated notification system with persistent dismissal, snooze logic, and priority-aware filtering for policy and product updates.
- **Resume Export**: Added "Download PDF" functionality with optimized print styles for clean document generation.

### Changed
- **Resume Redesign (Phase 2)**: Major overhaul of the Resume module with a focused centered layout, premium high-fidelity experience cards, real-time sync feedback, and a sticky action sidebar.
- **Premium UI Standardization**:
  - Unified **Skills**, **Job Feed**, and **Cover Letters** under the modern `SharedPageLayout` and `PageHeader` architecture.
  - Standardized all module search and filter components for absolute design parity.
  - Refined the **Settings Modal** with a high-density 3-column layout and improved visual hierarchy.
  - Optimized **UnifiedUploadHero** for better proportions across Education and Career modules.
- **Plans & Upgrade Flow**: Migrated plans to a focused `/upgrade` path with refined aesthetic cards and standardized usage limits.
- **Skills Dashboard**: Refined "Your Skills" dashboard with alphabetical sorting, improved metadata contrast, and streamlined action flows.

### Fixed
- **Stability**: Resolved critical crashes on the `/features` page and standardized `BentoCard` icons.
- **Navigation**: Finalized "Back" button patterns and standardized transition effects across listing pages.
</details>



<details>
<summary>## [2.17.0] - 2026-02-20</summary>

### Added
- **Job Detail UI Overhaul**:
  - Redesigned the "Analyzing" state with a high-fidelity "Scanning" animation, featuring dynamic beams, ambient glows, and interactive security badges.
  - Upgraded all analysis and result cards to the `premium` variant, utilizing glassmorphism and refined drop-shadows.
  - Implemented smooth entry animations for Experience Blocks with indigo pulse indicators.
  - Added a "Copy Full Resume" action with immediate visual feedback.

### Changed
- **UI Architecture**: 
  - Restored main header navigation to the Job Match page for better site-wide consistency.
  - Standardized `JobDetail` layout using `SharedPageLayout`, resolving inconsistent padding and width issues.
  - Refined the `JobDetail` layout to use the `premium` design system consistently across all tabs (Analysis, Job Post, Resume).

### Fixed
- **AI Analysis Robustness**:
  - Improved skill and responsibility extraction logic to prioritize high-fidelity analysis over basic extraction.
  - Refined AI prompts to intelligently infer competencies for brief job descriptions, preventing "empty" result states.
- **Build & Stability**:
  - Fixed corrupted JSX structure and missing `SharedPageLayout` imports in `JobDetail.tsx`.
  - Resolved implicit `any` type and missing `SavedJob` import in `AppRoutes.tsx`.
  - Implemented a `process.env` shim in `vite.config.ts` to resolve the "process is not defined" error encountered during Vercel deployments.
  - Fixed corrupted JSX structure in the Job Detail module to ensure stable rendering across all application states.
  - Resolved missing icon imports for `Search` and `ShieldCheck` in `JobDetail.tsx`.

### Added (Previous)
- **Education Module: Grad School Discovery**:
  - Introduced **Program Explorer** to search and filter curated Master's programs with seamless integration into the Program Fit Analyzer.
  - Added **Application Launchpad**, providing a structured, interactive roadmap for core admission requirements (GRE/GMAT, SOP, LORs).
  - Created **Portfolio Proposer**, an AI-driven tool that transforms academic courses into tangible, resume-ready technical projects.
- **Skill Interview "Professional Audit" Model**:
  - Increased interview depth to **10-12 cross-cutting questions** (approx. 24 interactions) for a more comprehensive assessment.
  - Implemented **Atomic Persistence**: Progress is banked "live" after every question, ensuring no work is lost if a session is interrupted.
  - Added **Historical Awareness**: The AI now recognizes previously verified skills and previous verification evidence to ask more advanced/targeted follow-ups.
  - Improved **Credit Transparency** labels on interview buttons to dynamically display real-time usage (e.g., "1 / 2 credits used" or "Unlimited credits") based on user subscription tiers.
- **Compact Header System**:
  - Introduced a `compact` variant to `SharedHeader` to optimize vertical space on functional sub-pages.
  - Applied the compact header to **LinkedIn Export Guide**, **Program Explorer**, **GPA Calculator**, and **Growth Roadmap**.
  - Refactored custom header implementations in Career and Education modules into the unified `SharedHeader` component for absolute design parity.
- **Tone & Decision Logic**:
  - Introduced a **Professional Decision Spectrum** (`Reject`, `Weak`, `Average`, `Strong`, `Exceptional`) across all AI feedback modules (Interviews & Cover Letters).
  - Updated terminology across Skills to be more neutral and professional (e.g., "Verified & Banked" and "In Development").
- **Job Analysis & Stability**:
  - Implemented **Auto-Reanalysis**: Jobs with missing or "hollow" data are now automatically refreshed in the background when viewed, ensuring data integrity without user effort.
  - Hardened **AI Extraction**: Enforced a strict JSON schema and mandatory validation for all job analysis results, preventing incomplete or malformed data from being saved.
  - Improved **Background Feedback**: Updated `JobDetail` UI to robustly handle auto-refresh states with skeleton loaders and synchronized progress messages.

### Changed
- **UI Consistency**:
  - Unified the "Interview Advisor" page header to use the standard `<PageHeader>` component, resolving alignment and font scale discrepancies with "Application History" and "Resume Editor".
  - Removed lingering focus outlines (blue pills) from navigation sub-items (e.g., "Interviews", "History") that remained stuck after a mouse click, while preserving standard `:focus-visible` accessibility rings for keyboard navigation.
- **Upload Experiences**: Unified the upload interface across the application (`ResumeEditor`, `EduHero`, `AcademicHero`) by introducing a new `UnifiedUploadHero` component. This provides a consistent 3-card "Bento" layout and standardized drag-and-drop functionality for both resumes and academic transcripts.
- **Resume Editor**: Updated the subtitle to be clearer and more literal: "Manage your professional history and accomplishments".
- **Plans & Monetization**:
  - Standardized usage limits to high-value reset cycles: **Weekly** for Job Analyses and **Monthly** for Skills Interviews.
  - Adjusted Skills Interview credits to reflect their increased depth and rarity: **2 / month** for Plus and **5 / month** for Pro.
  - Standardized Job Analysis limits to **100/week** (Plus) and **350/week** (Pro).
  - Removed redundant daily tracking for analyses to simplify user usage perception.
- **UI Architecture**:
  - Restored homepage card width by increasing the main content container from `max-w-4xl` to `max-w-6xl`, resolving issues where cards appeared too skinny in the 5-column grid.
  - Refactored the monolithic `HomeInput` component into two dedicated components: `HomePage` (focused landing experience) and `JobMatchInput` (focused job analysis tool).
  - Implemented a global **Header Strategy** that differentiates between "Explanatory" pages (Hero variant) and "Functional" pages (Simple variant).
  - Integrated the **Coach Mode Toggle** ("Emulate / Destination") directly into the `PageHeader` component's `actions` slot, removing awkward whitespace from the `CoachHero` component layout.
- **Secure Storage**:
  - Upgraded encryption key management to use **IndexedDB** for master key storage instead of `localStorage`.
  - Implemented **non-extractable keys** using the Web Crypto API, ensuring raw key material cannot be accessed by JavaScript.
  - Removed browser fingerprinting dependencies for key derivation to improve entropy and resolve security findings.
- **Job Flow Integration**: Unified job status terminology to `saved` across the **Pro Feed** and **Application History**, resolving inconsistencies where some jobs appeared as "analyzed" but were filtered out of core views.
- **Security & Safety**:
  - **Improved Log Sanitization**: Hardened the `gemini-proxy` log sanitization to strip a broader range of control characters (tabs, null bytes, backspaces) and fixed missing sanitization in error/warning paths to prevent potential log injection.
  - **Sensitive Data Exposure**: Prevented accidental exposure of sensitive user profile data (subscription tier, admin/tester status) in client-side debug logs.
### Fixed
- **AI Feedback**:
  - Fixed an issue in the Skills Assessment where the AI interviewer referred to the candidate in the third person instead of addressing them directly ("you").
- **Storage**:
  - Fixed a critical bug where a new user's initial resume upload would fail to persist to the cloud due to a missing `insert` clause in `resumeStorage`.
  - Added robust stringified JSON parsing for incoming cloud resume payloads to prevent data drops caused by schema type mismatches.
- **Match Calculations**: Fixed a UI bug where a literal **0% Match Score** was treated as "missing data", causing jobs to display "Analysis Needed" instead of their correct score.
</details>

<details>
<summary>## [2.16.0] - 2026-02-20</summary>

### Added
- **UI Architecture**:
  - Introduced new global components: `StandardSearchBar` (glassmorphism input), `StandardFilterGroup` (unified filter layouts), and `DropZone` (drag-and-drop file utility).
  - Implemented these components across **History**, **Skills**, **Resume Editor**, and **Transcripts** to ensure absolute design pattern consistency.
- **Job Detail Enhancements**:
  - Automatically extracts and displays the salary range next to the company name.
  - Added graceful fallback empty states for specific data points, preventing "blank box" confusion if AI extraction is incomplete.

### Changed
- **Major UI Polish & Layout Refining**:
  - Redesigned the **Interview Advisor** and **Job Detail** headers into a premium floating capsule design featuring the primary logo.
  - Adjusted global spacing of all hero headers, raising the content block slightly (`1.5cm`) for a more proportional layout.
  - Standardized marketing headlines into Title Case and resolved scrolling/padding issues globally across empty state modules.
- **Skills & Resume Refinements**:
  - Overhauled the **Skills** module with new vibrant Bento cards and a compact, flex-wrap "pill collection" for cleaner data visualization.
  - Simplified the Resume Editor layout by consolidating control buttons and removing bulky section badges from experience entries.
- **Onboarding & Error Handling**:
  - Refined the unauthenticated home header to display clear, distinct **Sign In** and **Sign Up** prompts.
  - Standardized diverse CTA labels across features into clearer, action-oriented verbs (e.g., "Enter Navigator", "Open Feed", "Quick Start").
  - Implemented a "premium empathetic error UI" in Job Details that distinguishes between scraping failures and AI service errors.

### Fixed
- **Critical Stability & Storage**:
  - Resolved a severe "destructive sync" race condition in `JobStorage` that could mistakenly clear local data before merging with the cloud.
  - Optimized data contexts (`ResumeContext`, `useJobManager`) to instantly re-fetch cloud data upon login without requiring a page refresh.
  - Patched persistent "Too many requests" AI limits by isolating the correct billing API keys in the environment setup.
- **Job Analysis State Flow**:
  - Fixed logic bugs preventing background job analysis from auto-starting and corrected manual-input errors trapping the system into fail-states.
  - Cleaned up lingering "AI is busy" alerts, implementing automatic notification clearing during route navigation.
- **UI Glitches & Alignment**:
  - Corrected multiple visual discrepancies including clipped hero gradients, broken dark mode toggles in Tailwind v4, and invisible button text on stark glass backdrops.
  - Corrected overlap issues with the fixed app headers across the History framework.
  - Fixed inconsistent hero header alignment on the Upgrade (`/plans`) page by adopting the standard `SharedPageLayout` component.

### Removed
- **Education**: Removed redundant "Back to Education" headers to streamline screen architecture.
- **Privacy**: Removed outdated policy update badges from the home screen layout.
</details>
<details>
<summary>## [2.15.2] - 2026-02-19</summary>

### Fixed
- **Deployment**: Added `.npmrc` to bypass strict ERESOLVE peer dependencies caused by React 19 (`react-helmet-async`), resolving Vercel deployment failures.
</details>

<details>
<summary>## [2.15.1] - 2026-02-19</summary>

### Fixed
- **Stability**: Fixed a build error causing Vercel deployment failures by correcting deprecated `variant="default"` props on `Card` components.
- **Documentation**: Updated `README.md` to reflect recent feature additions (Interview Advisor) and removed outdated API key instructions.
</details>

<details>
<summary>## [2.15.0] - 2026-02-19</summary>

### Added
- **Security & Safety**:
  - Implemented **Pessimistic Quota Enforcement** and a **Refund Mechanism** for failed AI calls.
  - Added **Strict Email Normalization** and **Device Fingerprinting** to prevent abuse.
  - Integrated an **Email Verification Gate** and a global **Token Safety Ceiling** as emergency fuses.
  - Added automated **"Is-a-Job" Content Validation** with auto-refunds for non-job content.
  - Consolidated background tasks (`inbound-email`, `scrape-jobs`) to use centralized `gemini-proxy` logic.
- **AI & Architecture**:
  - Harmonized model mappings — **Gemini 1.5 Pro** now powers all Pro/Admin features.
  - Created centralized `featureRegistry.ts` as the single source of truth for all feature definitions.
- **UI/UX & Design**:
  - Implemented **3D tilt and 4px lift effects** on homepage Bento cards.
  - Added **micro-animations** (pulsing AI Safety shield, interactive match score) and background glows to the Hero section.
  - Created a reusable **Notification Banner** system and a premium Privacy Policy announcement.
  - Redesigned **Interview Advisor** with a chat-based UI and adaptive personas (e.g., "Senior Engineer").
- **Onboarding & Authentication**:
  - Implemented **delayed authentication**, allowing flow completion (journey, resume upload) before account creation.
  - Added **personalized "delight" snapshots** during parsing and high-fidelity loading states.
  - Integrated inline account creation and improved monthly/annual pricing toggles.
- **Features**:
  - **Skills**: Launched **Unified Skills Interview** (multi-skill assessment) with Proficiency Filtering.
  - **Education**: Added **Dynamic Degree Requirements** checklist and program-based progress tracking.
  - **Interviews**: Enhanced **Tailored Job Interview** mode with role-appropriate technical scenarios.
- **Plans & Monetization**:
  - Significantly increased **Pro Limits** (500 analyses/day) and implemented dynamic **Stripe Tier Mapping**.
  - Added **promotion code support** and dynamic **headline cycling** on the Plans page.
- **Legal**: Added **"Key Takeaway" cards** to TOS and expanded the Privacy Policy (Data Retention, User Rights).

### Changed
- **Premium Design Refresh**:
  - Massive UI overhaul of **Skills**, **Settings**, **Resume Editor**, and **Job** modules with a "glassmorphism" aesthetic.
  - Redesigned core `Card.tsx` and `BentoCard.tsx` to use light glass effects and ambient accent glows.
  - Refined **Skill Card** and **Application History** layouts for better visual consistency.
- **Navigation & Layout**:
  - Implemented **cumulative tier filtering** on the Features page (Pro includes all, Plus includes Explorer).
  - Standardized **Header padding** and nav island opacity (80%) to prevent content bleed.
  - Switched Features grid to **CSS Grid** for consistent alignment and centered final rows.
- **Stripe & Checkout**:
  - Migrated from embedded modals to **full-page hosted checkout** for improved reliability.
  - Fixed quota alignment and updated plan badges (e.g., "Recommended" for Pro).
- **Core Improvements**:
  - Migrated feature data into the centralized `featureRegistry.ts` for single-source-of-truth parity.
  - Updated homepage grid to follow a process-driven workflow: **Match → Skills → Resume → Cover Letters → Job Feed**.
- **Performance & Stability**:
  - Implemented build-time **code splitting** (Vite `manualChunks`) and `esbuild` minification.
  - Added `preconnect` and `dns-prefetch` hints for Google Fonts and deferred `pdf.js` loading.

### Fixed
- **UI & Navigation**:
  - Resolved invisible headline text and fixed vertical alignment in Settings and Home sections.
  - Fixed critical navigation bugs where header links/buttons failed to trigger route changes.
  - Resolved a navigation bug where the **"Jobs" tab incorrectly remained highlighted** while on the Home page.
  - Resolved active state highlighting for nested sub-routes and synchronized URL changes with internal state.
- **Stripe & Auth**:
  - Fixed "Invalid API key" and "Invalid JWT" errors by improving error identification and reporting.
  - Resolved `400 Bad Request` in checkout session generation for new users.
  - Synchronized price IDs with confirmed Stripe Test Mode values.
- **Stability**:
  - Resolved critical runtime crashes in `Header.tsx`, `AppRoutes.tsx`, and `OnboardingPage.tsx` caused by missing imports or malformed JSX.
  - Fixed a critical **"useUser" Context error** by implementing robust prop-passing across lazy-loaded module boundaries (`HomeInput`, `FeatureGrid`).
  - Fixed module import errors for `BentoCard`, `interviewAiService`, and `SkillInterviewModal`.
  - Resolved session start bugs in the Interview Advisor.
- **Code Quality**:
  - Cleaned up TypeScript linting errors and removed unused imports/variables across the codebase.

### Removed
- **Redundancy**: Removed "Admin Beta" tags, "Beta Feature" notices, and "Resume parsed successfully" toasts.
- **Legacy Components**: Deleted deprecated `SkillInterviewModal.tsx` and removed redundant Education dashboard cards.
- **Design Clutter**: Removed footer taglines and "Added" dates from skill cards to simplify the interface.
</details>

<details>
<summary>## [2.14.0] - 2026-02-18</summary>

### Added
- **Resume Tailoring Suite**: Implemented suite for Plus/Pro tiers, featuring **Tailored Summary** generation and **Hyper-Tailor** (Bulk & Individual) block rewriting.
- **Diff View**: Added visual before/after comparison (strikethrough vs. new) and per-block **Reset/Undo** functionality.
- **Premium Upload Flow**: Added new 3-card upload flow (Foundation, Intelligence, Upload) as the official empty state.
- **Education Mechanics**: Implemented automatic **GPA Calculator** (4.0 scale), **Program Explorer**, and "Add Term/Course" planning functionality.
- **Smart Onboarding**: Implemented real-time **Student Detection** (from resume) and predictive transcript prompts.
- **Edu Components**: Created state-aware `EduHero` component and **Parsing Snapshot** for real-time skills feedback during onboarding.
- **Mentorship Tools**: Implemented premium 3-card guide for Mentor upload flow (Identify, Distill, Analyze) and high-fidelity `LinkedInExportSteps` modal.
- **Dynamic Role Farming**: Implemented system for automatic job title standardization and `canonical_roles` tracking in Supabase.
- **Industry Personas**: Implemented granular **Job Mapping** system with specialized industry personas (`TRADES`, `HEALTHCARE`, `CREATIVE`, `TECHNICAL`) and role-specific prompt templates.
- **SEO Engine**: Integrated `react-helmet-async` and created centralized `SEO` component for dynamic head management.
- **SEO Assets**: Added standard `robots.txt`, `sitemap.xml`, and Open Graph/Twitter Card support with professional default meta tags.
- **System Constants**: Introduced structural constants in `src/constants.ts` for **Tracking Events**, **Bento Categories**, and **PLAN_LIMITS**.
- **Plans Page**: Created dedicated page featuring premium pricing tiers and feature comparisons.
- **Legal Compliance**: Implemented official high-fidelity **Privacy Policy**, **Terms of Service**, and **Contact** pages.
- **Theme Transitions**: Added "Theme Pulse" transition on onboarding completion.

### Changed
- **Guideline Injection**: Integrated modular injection for job analysis and cover letter generation.
- **Usage Limits**: Implemented **Resume Tailoring Usage Limits** (max 2 attempts per block) and "Dual-Gate" inbound limit system (Emails vs. Jobs).
- **Refactor**: Refactored `SEOLandingPage` to use the new component system.
- **Feed Architecture**: Generalized Job Feed to be strictly user-driven (removed hardcoded scraping targets).
- **Settings UI**: Updated `SettingsModal.tsx` with emerald (Jobs) and indigo (Emails) progress bars, and a 3-column layout (Account, Plan, Integrations).
- **Accessibility**: Improved **Cover Letter Editor** accessibility with ARIA roles and fixed mobile layout issues.
- **Navigation**: Added prominent "Upgrade" button and restored Dark Mode toggle to main navigation.
- **UX Feedback**: Added immediate "Copied!" feedback for tokens/emails and granular rating loops for cover letters.
- **Policies**: Updated transparency disclosures to include **AI Quality Logging** and **PII Redaction** policies.

### Fixed
- **Tests**: Added comprehensive unit tests for architectural constants, upload flows, and usage limits.

### Removed
- **Self-Service Deletion**: Removed to prevent abuse.
</details>

<details>
<summary>## [2.13.0] - 2026-02-17</summary>

### Added
- **Homepage Visuals**: Redesigned all bento cards with premium, interactive graphics, high-fidelity SVG animations, and ambient glows.
- **Education Graphics**: Complete overhaul of `EducationDashboard` graphics, including high-fidelity interactive previews for Academic Record, Program Explorer, and GPA Calculator.
- **Browser Extension Alpha**: Initial release of the Navigator Chrome Extension with job description capture and direct save functionality.
- **Email Alerts Usage**: Added visual progress bar in Settings to track daily email job alert limits.
- **Abuse Prevention**: Implemented browser fingerprinting to detect and limit multi-account abuse.
- **Data Integrity**: Added `job_id` tracing to all AI operations for improved debugging.
- **Career Planning**: Implemented "Quick Add" goal input and functional Drag & Drop support to the Role Models section.
- **Education Content**: Implemented randomized, aspirational headlines for the Education Command Center.
- **Feature Interaction**: Made feature cards fully clickable for smoother transitions.

### Changed
- **Visual Distinction**: Differentiated Match (circular) and GPA (vertical pillar) graphics for better module separation.
- **Micro-Animations**: Added hover-triggered state changes to all feature cards.
- **Branding Polish**: Updated dual taglines ("Building For Your Career" and "Privacy-First AI") and footer copyright to Title Case.
- **Navigation Terminology**: Renamed "Job" to **"Jobs"** (encompassing Feed, Match, History).
- **Standardized Naming**: Consistently singularized "Resumes" to **"Resume"** across the platform.
- **Transcript Identity**: Standardized "Academic Record" to **"Transcript"** for clearer module identity.
- **Module Architecture**: Refactored Education page to use the unified `BentoCard` system.
- **Routing Structure**: Refactored to use nested paths (`/jobs`, `/career`, `/education`) for better organization.
- **Score Branding**: Rebranded "Navigator Score" to **Match Score**.
- **Onboarding Refresh**: Updated `WelcomeScreen` to collect user names and register device IDs.
- **Career UI**: Redesigned toggles and mode selectors with premium glassmorphism.
- **History UI**: Redesigned Application History with premium glassmorphism and lift effects.
- **Profile Management**: Unified profile management in `UserContext`.

### Fixed
- **Navigation Bugs**: Resolved issues where header links (Career, Education) failed to navigate or highlight correctly.
- **Authentication**: Replaced token copy-paste in extension with standard Email/Password login.
- **Stability**: Resolved "Failed to fetch" errors by implementing `lazyWithRetry`.
- **UI Consistency**: Aligned Education card dimensions and centering with the Home page grid.
- **Clean-up**: Removed redundant "Cover Letters" and "Coach" sub-links.
- **Build & Tests**: Resolved post-refactor build failures and regression in `History` and `GapAnalysis` tests.
</details>

### Verified
- **Navigation**: Verified functionality of all 20+ Header and Footer links via automated browser testing.

<details>
<summary>## [2.12.0] - 2026-02-16</summary>

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
</details>

<details>
<summary>## [2.11.9] - 2026-02-16</summary>

### Added
- **Education module**: Restored the `EducationDashboard` (Overview) as the main entry point for the module.

### Changed
- **Navigation**: Separated "Education" (Overview) and "Academic Record" (Transcript) into distinct routes.
- **Routing**: Updated structure to support `/edu` and `/edu/record`.

### Fixed
- **Stability**: Resolved build-breaking TypeScript errors in `SettingsModal.tsx` and `EducationDashboard.tsx`.
</details>

<details>
<summary>## [2.11.1] - 2026-02-15</summary>

### Fixed
- **Navigation**: Resolved a layout issue where the navigation pill appeared below the header elements. Aligned it vertically to the center.
- **Stability**: Resolved a merge conflict in `Header.tsx` to ensure type safety.

### Added
- **Quality Assurance**: Added automated tests for `Header` layout integrity to prevent regressions.
- **Workflow**: Introduced a UI Quality Checklist for future interface updates.
</details>

<details>
<summary>## [2.11.0] - 2026-02-15</summary>

### Added
- **Navigation**: Integrated `framer-motion` for a premium, smooth transition experience. Includes a "sliding puck" active indicator and fluid layout resizing for the central navigation island.

### Fixed
- **Stability**: Resolved several build-breaking TypeScript errors caused by unused imports and variables in `SettingsModal.tsx`, `CoachContext.tsx`, and `storageCore.ts`.
</details>

<details>
<summary>## [2.10.0] - 2026-02-15</summary>

### Added
- **Architecture**: Established a "Single Source of Truth" for spacing using semantic categories (`hero`, `compact`, `none`) in `SharedPageLayout` and `PageLayout`. This ensures pixel-perfect vertical alignment across the entire app.

### Changed
- **Branding**: Simplified header branding from "Job Navigator" to just **Navigator** for a unified identity.
- **UI Refinement**: Standardized all pages with hero headers (Home, Job Detail, Coach, Grad) to a consistent `pt-24` top offset.
- **Honest Design**: Removed misleading grey circle placeholders and redundant copy from the Hero section.
- **Header**: Reverted the "Sign In" button to a clean text-only style for a more minimal aesthetic.
- **Cleanup**: Stripped all ad-hoc layout wrappers and paddings from `AppRoutes.tsx`.
</details>

<details>
<summary>## [2.9.0] - 2026-02-15</summary>

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
</details>

<details>
<summary>## [2.8.3] - 2026-02-14</summary>

### Changed
- **Premium Design**: Redesigned the Bento feature grid with a unique, muted color palette (Sky, Violet, Rose, Indigo, Teal) for a more sophisticated and professional aesthetic.
- **Visual Consistency**: Ensured color uniqueness across all 10+ feature variants in both logged-in and logged-out states.

### Fixed
- **Navigation**: Resolved a critical issue where the header menu buttons updated the UI state but failed to trigger actual URL changes, causing the app to feel "broken" when navigating between modules.
- **Routing**: Implemented a bidirectional sync between the Global UI state and React Router URLs to ensure consistency across the application.
</details>

<details>
<summary>## [2.8.2] - 2026-02-13</summary>

### Changed
- **UI Refinement**: Reduced top padding and improved hero card spacing in `HomeInput` for a more balanced layout.
- **Layout**: Simplified route wrappers in `App.tsx` by delegating spacing to the `SharedPageLayout` component.
</details>

<details>
<summary>## [2.8.1] - 2026-02-13</summary>

### Fixed
- **Deployment**: Resolved a Vercel build failure caused by an unused `React` import in `LandingContent.tsx` which triggered a TypeScript error.
</details>

 
<details>
<summary>## [2.8.0] - 2026-02-13</summary>

### Added
- **Genuine Usage Tracking**: Implemented a two-tier tracking system distinguishing between user "Interest" (clicks) and actual "Usage" (feature actions) across all modules (JobFit, Coach, Keywords, Resumes, Cover Letters).
- **Admin Conversion Dashboard**: Added a comprehensive "Feature Usage" breakdown in Settings for Admins, showing curiosity (CLK) vs action (ACT) with real-time conversion rates.

### Changed
- **Centralized UI**: Unified `FeatureGrid.tsx` for a consistent 5-column layout across both logged-in and logged-out views.
- **UI Refinement**: Removed inaccurate "1,200+ analysis" badge from the landing page.

### Fixed
- **Stability**: Resolved "Failed to fetch" errors with `SettingsModal` dynamic imports.
- **Code Quality**: Fixed over 30 linting errors and resolved unused import warnings across the codebase.
</details>

<details>
<summary>## [2.7.0] - 2026-02-12</summary>

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
</details>

<details>
<summary>## [2.6.0] - 2026-02-12</summary>

### Security
- **Backend AI Selection**: Migrated model resolution and Gemini API calls to a secure Supabase Edge Function to prevent client-side tampering and enforce subscription tiers.
- **JWT Verification**: Implemented mandatory authentication for all AI requests via the backend proxy.

### Changed
- Refactored `jobAiService`, `resumeAiService`, and `eduAiService` to use task-based model selection.
- Removed `TIER_MODELS` configuration from frontend to better hide backend logic.
</details>

<details>
<summary>## [2.5.0] - 2026-02-12</summary>

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
</details>

<details>
<summary>## [2.4.0] - 2026-02-12</summary>

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
</details>

<details>
<summary>## [2.3.4] - 2026-02-11</summary>

### Changed
- **Header**: Refactored `HeroHeader` into a reusable component for consistent branding across Job, Coach, and Grad pages.
- **Performance**: Removed expensive ambient background animations to reduce system resource usage.

### Fixed
- **Layout**: Fixed vertical alignment offset in `HomeInput` (Analyze page) by standardizing top padding.
- **Stability**: Resolved syntax errors and conditional rendering logic in `CoachDashboard` that caused white screens.
</details>

<details>
<summary>## [2.3.3] - 2026-02-11</summary>

### Fixed
- **Deployment**: Removed `/Navigator` base path configuration to support root domain deployment on Vercel.
</details>

<details>
<summary>## [2.3.2] - 2026-02-11</summary>

### Fixed
- **Routing**: Fixed a routing configuration mismatch (`base` vs `basename`) that caused a blank screen on deployment.
</details>

<details>
<summary>## [2.3.1] - 2026-02-11</summary>

### Fixed
- **Design System**: Restored clean `neutral` palette, removing the inadvertent blue tint from both theme modes.
- **Dark Mode**: Refined dark mode back to core black (`#0a0a0a`).
- **Layout**: Corrected the `History` view width to match the standard site container (`max-w-7xl`).
- **Visibility**: Fixed legibility of animated headlines ("Ace the...") that was impacted by theme changes.

### Removed
- **Marketing**: Removed the "ATS Comparison" and "Analyzing JD" preview graphics based on feedback.
</details>

<details>
<summary>## [2.3.0] - 2026-02-07</summary>

### Added
- **Programmatic SEO**: Implemented a dynamic SEO landing page engine at `/resume-for/:role` with a universal master template.
- **Canonical Routing**: Added a `CanonicalService` to map diverse job titles to standard high-quality SEO buckets.

### Changed
- **Architecture**: Refactored application state to distinguish between `activeSubmissionId` (specific user action) and `roleId` (canonical job role).
- **Architecture**: Updated all navigation and state logic to use the new "Submission ID" terminology for better clarity.
- **Routing**: Integrated `react-router-dom` more deeply to handle persistent SEO URLs and history navigation.
</details>

<details>
<summary>## [2.2.1] - 2026-02-07</summary>

### Changed
- **UI**: Narrowed Bento grid containers (`max-w-7xl`) to align perfectly with the header's navigation boundaries.
- **UI**: Reordered header buttons to a more logical flow: Log Out → Admin → Settings.
- **UI**: Optimized the `ActionGrid` to display 5 cards in a single row on XL screens for better balance.

### Fixed
- **UI**: Resolved a race condition where the "Sign In" button and navigation pill would flicker or appear together during authentication loading.
- **Build**: Fixed an unused `TrendingUp` icon import in `MarketingGrid` that was causing Vercel deployment failures.
</details>

<details>
<summary>## [2.2.0] - 2026-02-05</summary>

### Added
- **Role Model Emulation**: Comparison mode to bridge the gap between user profile and specific Role Models (`analyzeRoleModelGap`).
- **Token Usage Tracking**: Granular, per-user tracking of AI token consumption in `daily_usage`.
- **Admin Insights**: `usage_outliers` SQL view to detect abusive token usage per subscription tier.

### Security
- **Hardening**: Explicitly set `search_path = public` on all PL/PGSQL functions to prevent hijacking.
- **Privacy**: Restricted `daily_usage` table visibility to Admins only via RLS.
- **Reliability**: Enforced `application/json` on AI responses and implemented manual input sanitization.
</details>

<details>
<summary>## [2.1.4] - 2026-02-02</summary>

### Changed
- **UI**: Removed "Role Model Synthesis" card from logged-out marketing grid. Kept 8 cards for a perfect 2x4 layout: JobFit Score, Keyword Targeting, Private Vault, Smart Cover Letters, Tailored Summaries, Bookmarklet, AI Career Coach, and 12-Month Roadmap.
- **UI**: Updated `WelcomeScreen` feature cards to use `rounded-[2.5rem]` border radius for consistency with the glassmorphism design system.
</details>

<details>
<summary>## [2.1.3] - 2026-02-01</summary>

### Changed
- **UI**: Removed the "Bookmarklet" card from the marketing grid to create a perfect 8-card layout (2 rows of 4).
</details>

<details>
<summary>## [2.1.2] - 2026-02-01</summary>

### Changed
- **UI**: Aligned logged-out marketing card dimensions with logged-in action cards. Updated to 4-column grid, `p-6` padding, and `1920px` max-width.
</details>

<details>
<summary>## [2.1.1] - 2026-02-01</summary>

### Fixed
- **UI**: Fixed a bug where both marketing cards and action cards would render simultaneously for logged-out users. Added strict user session checks to the action card grid.
</details>

<details>
<summary>## [2.1.0] - 2026-02-01</summary>

### Changed
- **UI**: Unified design system between logged-in and logged-out states. All cards now use the premium glassmorphism aesthetic (`rounded-[2.5rem]`, backdrop blur).
- **Welcome**: Refined `WelcomeScreen` features with glassmorphism style for a better first impression.
</details>

<details>
<summary>## [2.0.1] - 2026-02-01</summary>

### Fixed
- **Build**: Fixed syntax error and unused variable in `CoachDashboard` that caused Vercel deployment failure.
</details>

<details>
<summary>## [2.0.0] - 2026-02-01</summary>

### Added
- **AI Career Coach**: New dashboard for career path analysis and role model tracking.
- **Role Model Support**: Capability to upload and distill patterns from LinkedIn profile PDFs.
- **Gap Analysis**: Detailed skill gap comparison between user profile and target roles.
- **12-Month Trajectory**: Automated professional roadmap generation.

### Fixed
- **Performance**: Resolved an infinite render loop in `HomeInput` component that caused high CPU usage.
- **Cleanup**: Terminated orphaned background processes during initialization.
</details>

---

## Older Releases
Historical changes prior to version 2.0.0 can be found in the [Changelog Archive](./CHANGELOG_ARCHIVE.md).
