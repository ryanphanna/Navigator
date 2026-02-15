# Navigator Roadmap 🚀

This document tracks future features and strategic pivots for Navigator.

## Upcoming Features

### 📬 Job Alert Email Feed (Current Priority)
**Problem**: Monitoring 27+ different job boards manually is a massive time sink.
**Solution**: Provide a unique Navigator email address for users to redirect their job alerts.
- [ ] Unique inbound email tokens per user.
- [ ] Supabase Edge Function to handle incoming webhooks (Postmark).
- [ ] Gemini-powered parsing of email job alerts.
- [ ] Automated triage (Match Score + Apply Now / Future Reference).
- [ ] Unified "Job Feed" UI for one-click applications.

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
