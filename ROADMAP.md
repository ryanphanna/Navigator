# Roadmap


This document tracks future features and strategic pivots for Navigator.

## Upcoming Features

### 📬 Job Alert Email Feed (In Progress)
**Problem**: Monitoring 27+ different job boards manually is a massive time sink.
**Solution**: Provide a unique Navigator email address for users to redirect their job alerts.
- [ ] Unique inbound email tokens per user.
- [ ] Supabase Edge Function to handle incoming webhooks (Postmark).
- [ ] Gemini-powered parsing of email job alerts.
- [ ] Automated triage (Match Score + Apply Now / Future Reference).
- [ ] Unified "Job Feed" UI for one-click applications.


### 🛡️ Trust & Safety (In Progress)
**Problem**: Maintaining a high-quality free tier requires preventing abuse and ensuring genuine usage.
**Solution**: Multi-layered verification and anti-abuse systems.
- [x] Browser fingerprinting to detect multi-account abuse.
- [x] Device ID registration during onboarding.
- [ ] Email Verification flow (Magic Links / codes).
- [x] Gmail alias normalization (e.g. `user+tag@gmail.com` -> `user@gmail.com`).


### 🎓 Education & Career (Live)
**Problem**: Users need more than just job matching; they need a path to qualification.
**Solution**: Dedicated modules for educational planning and career modeling.
- [x] Education Dashboard: GPA tracking, transcript management, program fit.
- [x] Gap Analysis: Skill comparison against target roles.
- [x] Role Model Emulation: Side-by-side career trajectory visualization.

### 🌐 Browser Extension (Phase 2)
**Problem**: Bookmarklet is limited (URL only); manual capture is slow.
**Solution**: A Chrome/Arc extension for deep job clipping.
- [ ] Select-and-save job descriptions.
- [ ] Direct extraction of company/role from the active tab.
- [ ] Instant background analysis status.

## Long-term Vision
- [ ] **Org Intelligence**: Tracking which companies hire for specific professional roles over time.
- [ ] **Credential Mapping**: Automated suggestions for career-specific certifications based on job requirements.
- [ ] **Networking Graph**: Tracking alumni or contacts at specific target companies.

### ✨ Feature Wishlist
- [ ] **AI Interview Simulator**: Interactive mock reporting/feedback loop.
- [ ] **Outreach Drafting**: One-click custom LinkedIn/Email messages for recruiters.
- [ ] **Auto-Fill Assistant**: Chrome extension helper to port modular blocks into application forms.

## Considerations
- **Per-Product Pricing**: Consider migrating from a global tier structure (Plus/Pro) to modular, per-product subscriptions (Jobs, Coach, Education) to lower entry barriers and target specific user needs.

