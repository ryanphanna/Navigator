# Navigator Strategic Roadmap

This document defines the execution strategy for Navigator, moving from a job analysis tool to a comprehensive AI-powered career co-pilot. Decisions are prioritized based on user impact and technical bridge-building.

## 🎯 Product Vision
To eliminate the "manual labor" of career transitions by automating job monitoring, qualification mapping, and application workflows through high-fidelity AI orchestration.

---

## 🔥 Critical Priority (Now)
*Immediate focus to expand active workflow tools and solidify the platform.*

### 🌐 Browser Extension (Phase 2)
**Goal**: Move Navigator into the user's active workflow on LinkedIn, Indeed, and Greenhouse.
- [ ] **Select-and-Clip**: Save custom job snippets directly from any webpage.
- [ ] **Live Analysis Overlay**: Instant match quality visualizer directly on job boards.

### 🏗️ Technical Foundation & Scaling
**Goal**: Clear the final technical hurdles to support the extension growth and long-term stability.
- [x] **Type Safety**: 100% `any`-free production codebase (Completed Mar 2026).
- [ ] **Centralized Data Layer**: Migrate 20+ direct `localStorage` calls to `StorageService` for unified encryption and sync observability.
- [ ] **Log Sanitation**: Remove or migrate production logs to a unified `Logger`.
- [ ] **Extension Deployment**: Update download links to the official Chrome Web Store URL.

---

## 🚀 Related Initiatives
### 📬 Job Alert Inbox (Spun-off)
*The Intelligent Job Inbox is being developed as a standalone service to handle massive-scale email parsing and automated triage.*
- [ ] Cross-service sync: Pull triaged matches into the Navigator core feed.
- [ ] Shared auth state across the Navigator ecosystem.

---

## ⚡️ High Priority (Next)
*Deepening user value and professional trust.*

### 🔒 Trust & Verification
- [ ] **Account Integrity**: Implementation of Magic Link / Code-based email verification.
- [ ] **Growth Infrastructure**: Stripe Customer Portal for self-service subscription management.

### 🎨 Design System Audit
**Goal**: Resolve remaining `red-*` vs `rose-*` color inconsistencies and standardize premium "Glassmorphism" UI components.

### 🔄 Data & Feedback
- [ ] **AI Feedback Loop**: Allow users to rate match quality (👍/👎) to refine backend prompt engineering.
- [ ] **Data Portability**: Export application history and analyzed job data to CSV/JSON for personal records.
- [ ] **A11y Standards**: Complete WCAG 2.1 accessibility pass for keyboard navigation and screen reader support.

---

## 📈 Platform Strategy (Strategic)
*Moving from a "Tool" to an "Intelligence Layer".*

- [ ] **Universal Professional Bio**: A centralized, encrypted digital identity that serves as the "Source of Truth" for all AI features.
- [ ] **Org Intelligence**: Tracking company-specific hiring patterns over time to predict "Ideal Candidate" profiles.
- [ ] **Credential Mapping**: Automated suggestions for career-specific certifications based on identified skills gaps.
- [ ] **Localization (i18n)**: Preparing the core platform for multi-language support (ES, FR, DE).
- [ ] **Networking Graph**: Tracking alumni or internal contacts at target companies during the application phase.
- [ ] **Modular Pricing**: Transition to "Packs" (Jobs, Coach, Edu) for targeted user entry.

---

## 🌌 Long-Term Vision
*The "North Star" for Navigator.*

- **Autonomous Job Agent**: Navigator applies to high-match jobs on behalf of the user, managing the funnel until an interview is booked.
- **Predictive Trajectory**: ML-based forecasting of salary and title path-modeling over 5–10 years.
- **Global Mobility Engine**: Automating visa eligibility, relocation, and cost-of-living adjustments for international pivots.
- **High-Fidelity Preparation**: Low-latency voice/video simulation for high-stakes interview prep.

---

## 💡 Feature Wishlist
- **Outreach Auto-Pilot**: One-click hyper-personalized LinkedIn/Email recruiter messages.
- **Auto-Fill Assistant**: Chrome extension helper to port resume blocks directly into Greenhouse/Lever forms.
- **Observability**: Centralized error reporting (e.g., Sentry) across all modules.
