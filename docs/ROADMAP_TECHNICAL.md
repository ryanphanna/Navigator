# Navigator Technical Roadmap

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

## 💡 Feature Wishlist
- **Outreach Auto-Pilot**: One-click hyper-personalized LinkedIn/Email recruiter messages.
- **Auto-Fill Assistant**: Chrome extension helper to port resume blocks directly into Greenhouse/Lever forms.
- **Observability**: Centralized error reporting (e.g., Sentry) across all modules.
