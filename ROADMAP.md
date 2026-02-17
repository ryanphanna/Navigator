# Navigator Roadmap 🚀

This document tracks future features and strategic pivots for Navigator.

## Upcoming Features

### 📬 Job Alert Email Feed (Live)
**Problem**: Monitoring 27+ different job boards manually is a massive time sink.
**Solution**: Provide a unique Navigator email address for users to redirect their job alerts.
- [x] Unique inbound email tokens per user.
- [x] Supabase Edge Function to handle incoming webhooks (Postmark).
- [x] Gemini-powered parsing of email job alerts.
- [x] Automated triage (Match Score + Apply Now / Future Reference).
- [x] Unified "Job Feed" UI for one-click applications.

### 🛡️ Trust & Safety (In Progress)
**Problem**: Maintaining a high-quality free tier requires preventing abuse and ensuring genuine usage.
**Solution**: Multi-layered verification and anti-abuse systems.
- [x] Browser fingerprinting to detect multi-account abuse.
- [x] Device ID registration during onboarding.
- [ ] Email Verification flow (Magic Links / codes).
- [ ] Gmail alias normalization (e.g. `user+tag@gmail.com` -> `user@gmail.com`).

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
- [ ] **Org Intelligence**: Tracking which companies hire for specific transit roles over time.
- [ ] **Credential Mapping**: Automated suggestions for transit-specific certifications based on job requirements.
- [ ] **Networking Graph**: Tracking alumni or contacts at specific transit agencies.
