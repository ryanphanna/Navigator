# Navigator Strategic Roadmap

This document defines the execution strategy for Navigator, moving from a job analysis tool to a comprehensive AI-powered career co-pilot. Decisions are prioritized based on user impact and technical bridge-building.

## 🎯 Product Vision
To eliminate the "manual labor" of career transitions by automating job monitoring, qualification mapping, and application workflows through high-fidelity AI orchestration.

---

## 🚨 Action Required — Supabase SQL Migrations

Three security fixes have been applied to `supabase_schema.sql` that **must be manually run in the Supabase SQL Editor** before they take effect in production. They are not automatically synced.

### Steps
1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**
2. Run each of the following blocks separately and confirm no errors:

**Fix 1 — Declare `v_email_verified` in `check_analysis_limit`**
```sql
-- Re-create the function with the corrected DECLARE block.
-- Copy the full check_analysis_limit function from supabase_schema.sql and run it.
-- The fix: add  v_email_verified BOOLEAN;  to the DECLARE block before the -- Limits comment.
```
> Without this, the quota limit function throws a runtime error and all callers fail open — meaning **no usage limits are enforced**.

**Fix 2 — Correct role check in `protect_sensitive_profile_fields`**
```sql
-- In the trigger function body, change:
--   IF (current_setting('role') <> 'service_role') THEN
-- to:
--   IF (current_user <> 'service_role') THEN
-- Then re-create the function and re-apply the trigger.
```
> Without this, the Stripe webhook (service role) cannot update `subscription_tier`, `is_admin`, or `is_tester` — **paid plan upgrades do not apply**.

**Fix 3 — Remove duplicate `LANGUAGE` clause in `redeem_invite_code`**
```sql
-- Re-create redeem_invite_code with only one  language plpgsql  line.
-- The duplicate causes a SQL syntax error that can break migrations.
```

- [ ] **Run Fix 1** — `check_analysis_limit` variable declaration
- [ ] **Run Fix 2** — `protect_sensitive_profile_fields` role check
- [ ] **Run Fix 3** — `redeem_invite_code` duplicate language clause
- [ ] Verify a test user's subscription tier updates correctly after a Stripe test-mode checkout

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

## 💳 Trial Conversion Strategy
*Maximizing the 3-job trial window to drive paid subscriptions.*

Explorer is a **3-job trial**, not a forever-free plan. The goal is for users to feel genuine loss when the limit hits — not relief that they got something free. Every design decision in the trial should serve that moment.

### 🎯 Trial Journey Design
- [ ] **Curated trial arc**: Design the 3 analyses as a progression, not 3 identical experiences. Job 1 = "wow, this is accurate." Job 2 = surfaces the gap analysis and teases the fix. Job 3 = user is invested enough that hitting the limit actually hurts.
- [ ] **Visible trial counter**: Show remaining analyses prominently so job 3 feels deliberate — not like a surprise wall.
- [ ] **End mid-momentum**: The trial should expire while the user is actively evaluating a role they care about, not mid-casual-browse.
- [ ] **Full-featured feel**: Avoid visibly locked features during the trial. Users should feel like they *had* access to something great, not that they were always on a lesser version.

### 🚪 Paywall Moment
- [ ] **Personalized upgrade screen**: When the trial ends, reflect back what the user actually did — "You analyzed 3 roles. Your average match score was 71%. Here's what's holding you back across all three." Then show the upgrade path. Not a generic feature list.
- [x] **Show the gap, lock the fix**: Surface missing keywords and specific score gaps in the analysis (even in trial). The *problem* is visible; the *solution* requires upgrading.

### 📊 Outcome Anchoring
- [ ] **Contextual conversion prompts**: Surface outcome-based messaging at the point of maximum motivation — right after a score lands. e.g. *"Users who tailored their resume for roles like this got 2.1× more callbacks."*
- [ ] **Salary as value proof**: Show salary delta for users with verified skills vs. without, tied to the Skills Interview feature. Makes it feel like an ROI decision, not a nice-to-have.

### ⚡️ High-Urgency Entry Points
- [ ] **Interview eve flow**: A "I have an interview tomorrow" mode that fast-tracks mock interview access. This is likely the single highest willingness-to-pay moment in the product.
- [ ] **Loss framing for Feed/Mail-In**: Instead of "get pre-scored alerts," frame it around the job that got away — *"This role closed while you were evaluating it. Set up forwarding and never miss a window again."*

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
