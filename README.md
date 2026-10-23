# WorkAble — Accessible Job-Matching Portal

WorkAble is an academic accessible job-matching portal built with React, React Router, Vite, Tailwind CSS, and an optional Supabase integration.

> **Important status note:** WorkAble currently supports a local demonstration mode and has a partial Supabase integration. The demo mode uses fictional seed data and browser `localStorage`; it is not secure production authentication. Several live multi-user workflows still require end-to-end integration and testing before real applicants or employers should rely on the service.

## 1. Requirements

- Node.js 20 or newer (Node.js 22 recommended)
- npm 10 or newer
- A modern browser

## 2. Setup from a clean checkout

Open Terminal in the folder containing `package.json`:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173/`). Keep the terminal running while using the app. Stop it with `Ctrl+C`.

If dependencies were copied from another operating system, remove `node_modules` and reinstall them on your own machine:

```bash
rm -rf node_modules
npm install
```

Do not copy `node_modules` between macOS, Windows, and Linux. Native build tools have platform-specific files.

## 3. Demo accounts

| Role | Email | Password |
|---|---|---|
| Job seeker | `seeker@workable.demo` | `Demo@123` |
| Verified employer — BrightPath Software | `employer@workable.demo` | `Demo@123` |
| Employer — Lumen Health Analytics (verification pending) | `lumen@workable.demo` | `Demo@123` |
| Employer — GreenLeaf Retail | `greenleaf@workable.demo` | `Demo@123` |
| Employer — Nova Learning | `nova@workable.demo` | `Demo@123` |
| Administrator | `admin@workable.demo` | `Admin@123` |

The login page also provides demo sign-in shortcuts. Administrator accounts cannot be created through public registration.

## 4. Application areas

- **Public:** landing page, job search, job details, login, registration.
- **Job seeker:** `/seeker`, `/seeker/saved`, `/seeker/applications`, `/seeker/profile`.
- **Employer:** `/employer`, `/employer/jobs`, `/employer/jobs/new`, `/employer/applicants`, `/employer/verification`.
- **Administrator:** `/admin`.

Protected routes redirect logged-out visitors to login and redirect users with the wrong role to their own dashboard. Signed-in users visiting login or registration are sent to their role dashboard.

## 5. Useful commands

```bash
npm run dev       # Start local development server
npm test          # Run automated business-rule and regression tests
npm run test:watch # Re-run tests while editing
npm run build     # Create a production build in dist/
npm run preview   # Preview the production build locally
npm run check     # Run tests and then production build
```

## 6. Test and quality workflow

1. Start from a clean install (`rm -rf node_modules && npm install`).
2. Run `npm test`; resolve all failures before continuing.
3. Run `npm run build`; the command must finish without compilation errors.
4. Run the manual checklist in `TEST-PLAN.md` using a fresh browser profile or reset the demo data from the app if that feature is available.
5. Check each role independently. Also test with a narrow/mobile viewport, keyboard only, browser zoom, and at least one screen reader where available.
6. Record the actual result and Pass/Fail for each manual case only after performing it. Automated unit tests do not replace manual UI or accessibility checks.

The automated suite covers authentication and registration rules, search and combined accommodation filters, employer job CRUD/ownership, applications, saved jobs, skill matching, verification workflows, and access-control guardrails.

## 7. Architecture

```text
src/
  App.jsx                    Routes, role guards, shared navigation and layout
  main.jsx                   React application entry point
  store.jsx                  App state, localStorage session, preferences and actions
  AccessibilitySettings.jsx  Accessibility drawer and display tools
  data/seed.js               Fictional demo accounts, jobs and applications
  services/db.js             Data access and business rules (testable module)
  services/db.test.js        Automated regression tests
  pages/Public.jsx            Landing, login and registration
  pages/Seeker.jsx            Search, job detail, applications, saved jobs and profile
  pages/Employer.jsx          Employer dashboard, job management and applicants
  pages/Admin.jsx             Verification review and administration
  ui.jsx                      Shared UI primitives
  index.css                   Design tokens, themes, responsive and accessibility styles
```

## 8. Known limitations

- `localStorage` is local to one browser and is not a shared database; clearing browser data resets the demo state. The administrator dashboard also has a confirmation-protected “Reset demo data” action that restores the seed data and logs out.
- The demo authentication layer validates seeded/local records in the browser. It is not secure production authentication.
- Evidence and resume references are demonstration metadata, not secure file uploads.
- The accessibility panel provides user-facing adjustments, but it is not a substitute for a WCAG audit with assistive technologies and representative users.
- The application does not claim that an employer's accessibility information is independently certified merely because the demo marks it as verified.
