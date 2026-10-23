# WorkAble QA Report (2026-10-23)

## Checks performed in this environment

- Parsed all 13 JavaScript/JSX source files with Babel's parser: **13/13 syntax checks passed**.
- Ran the existing 55 business-rule/regression tests through a temporary Node-compatible harness: **55/55 passed**. This exercises the test assertions but is not the project's official Vitest runner.
- Attempted `npm test`: **blocked before tests started** because the included `node_modules` is copied from macOS and lacks `@rollup/rollup-linux-x64-gnu` for this Linux environment.
- Attempted dependency installation to repair the platform mismatch; it timed out in this environment.
- Production Vite build: **not verified**. Do not claim a successful production build based on this audit.
- Live Supabase: **not verified**. No authenticated browser workflows or remote SQL execution were available in this audit.

## Changes made during this audit

- Simplified the desktop/mobile header navigation: first three destinations remain visible; less-used destinations are grouped under a clear “More” menu.
- Added clearer active navigation, menu focus behavior, consistent focus rings, and more visible primary action styling.
- Hardened the Supabase schema against public profile email exposure and client-side role escalation via signup metadata/profile updates.
- Added private Supabase Storage buckets and object policies for CVs and company evidence.
- Removed silent success behavior for live CV uploads, job writes, accessibility reports, and applications where a live database write fails.
- Updated documentation so it no longer describes the partial Supabase integration as production-ready.

## Still not production-ready / needs verification

1. Complete live data synchronization for applications, candidate profiles, CV lists/deletion/primary selection, saved jobs, employer evidence, dispute responses, admin moderation and audit history.
2. Confirm storage policies and schema execute successfully in a clean Supabase project; test cross-user access denial, including CV signed URLs.
3. Validate profile and company setup for new employers, including company membership and company/job relationships.
4. Add end-to-end browser tests against the live backend: signup/email confirmation/password reset, seeker application, employer sees only their applicants, CV access, report lifecycle, admin freeze/reinstate, logout and refresh.
5. Run official `npm test`, `npm run build`, and keyboard/screen-reader/mobile/zoom/contrast audits on a clean install.
6. Review SQL policies for least privilege and legal/privacy requirements before any public launch.

## Important interpretation

A passing local business-rule test proves the tested function behaves as expected against the seed data. It does not prove that the UI workflow, hosted database, storage permissions, email delivery, or cross-device behavior works. Demo records remain placeholders unless a corresponding live record and workflow are verified.
