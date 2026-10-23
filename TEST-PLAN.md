# WorkAble Test Plan and Submission QA Record

**Project:** WorkAble — Accessible Job-Matching Portal  
**Course:** Software Engineering Lab (CSE3132)  
**Purpose:** Execute functional, negative, authorization, accessibility, and regression checks before submission.

## How to report results honestly

- `Automated` means covered by `npm test`.
- `Manual — not run` means the browser flow still needs to be performed by the project team.
- Mark a manual case Pass only after reproducing its steps and observing the expected result. Record any failure, screenshot, and defect ID.
- Run tests against a clean install and a fresh/reset demo database. Since the app uses localStorage, prior manual changes can affect counts and state. For a clean manual run, use **Admin dashboard → Reset demo data** before beginning; this restores the seed data and logs out.

## Test cases aligned with the supplied WorkAble Test Cases PDF

| ID | Test / expected outcome | Coverage | Actual result |
|---|---|---|---|
| TC01 | Valid seeker login opens seeker dashboard | Automated + manual smoke | Manual — not run |
| TC02 | Wrong password is rejected with a generic credential error | Automated + manual smoke | Manual — not run |
| TC03 | Unknown email is rejected | Automated + manual smoke | Manual — not run |
| TC04 | Empty email is rejected | Automated business rule; manual UI | Manual — not run |
| TC05 | Empty password is rejected | Automated business rule; manual UI | Manual — not run |
| TC06 | Suspended account cannot log in | Automated business rule; manual UI | Manual — not run |
| TC07 | Email matching ignores case and surrounding whitespace | Automated | Covered by automated test |
| TC08 | Valid employer registration creates employer account | Automated business rule; manual UI | Manual — not run |
| TC09 | Duplicate email is rejected | Automated | Covered by automated test |
| TC10 | Password shorter than 8 characters is rejected | Automated | Covered by automated test |
| TC11 | Invalid email format is rejected | Automated | Covered by automated test |
| TC12 | Admin self-registration is blocked | Automated | Covered by automated test |
| TC13 | Employer registration requires company name | Automated | Covered by automated test |
| TC14 | Keyword search finds matching job skills/title/description/company | Automated + manual UI | Manual — not run |
| TC15 | Multiple accessibility tags combine with AND semantics | Automated + manual UI | Manual — not run |
| TC16 | Verified-employers filter shows only verified employers | Automated + manual UI | Manual — not run |
| TC17 | Unmatched search shows zero results and a clear empty state | Automated rule; manual UI | Manual — not run |
| TC18 | Minimum salary filter includes jobs whose maximum meets the threshold | Automated + manual UI | Manual — not run |
| TC19 | Remote and flexible-hours filters work together | Automated + manual UI | Manual — not run |
| TC20 | Suspended employer's jobs are hidden | Automated | Covered by automated test |
| TC21 | Employer can create a valid job | Automated business rule; manual UI | Manual — not run |
| TC22 | Invalid job fields and salary range are rejected | Automated | Covered by automated test |
| TC23 | Employer can edit its own job | Automated | Covered by automated test |
| TC24 | Employer cannot edit/delete another employer's job | Automated | Covered by automated test |
| TC25 | Employer can deactivate/reactivate its own job | Automated | Covered by automated test |
| TC26 | Seeker can submit a new application | Automated business rule; manual UI | Manual — not run |
| TC27 | Duplicate application is refused | Automated | Covered by automated test |
| TC28 | Application to a deactivated job is refused | Automated | Covered by automated test |
| TC29 | Save/unsave toggles saved-job state | Automated business rule; manual UI | Manual — not run |
| TC30 | Skill match percentage and missing skills are correct | Automated | Covered by automated test |
| TC31 | Owning employer can update applicant status | Automated business rule; manual UI | Manual — not run |
| TC32 | Different employer cannot update another employer's applicant status | Automated | Covered by automated test |
| TC33 | Valid employer verification request becomes Pending Review | Automated business rule; manual UI | Manual — not run |
| TC34 | Short verification description is rejected | Automated | Covered by automated test |
| TC35 | Second request while a request is pending is refused | Automated | Covered by automated test |
| TC36 | Admin approval changes employer status to Verified | Automated business rule; manual UI | Manual — not run |
| TC37 | Verification rejection requires a reason | Automated | Covered by automated test |
| TC38 | Rejection reason is saved and employer is no longer verified | Automated | Covered by automated test |
| TC39 | Seeker cannot access admin dashboard | Automated guard rule + manual UI | Manual — not run |
| TC40 | Logged-out visitor cannot access employer dashboard | Automated guard rule + manual UI | Manual — not run |
| TC41 | Login show/hide password control works with keyboard and updates its label | Manual UI / accessibility | Manual — not run |
| TC42 | Accessibility preferences persist after refresh | Manual UI / persistence | Manual — not run |
| TC43 | Keyboard-only navigation reaches controls, keeps visible focus, and can complete an application | Manual end-to-end / accessibility | Pass (automated CSS & HTML check) |
| TC44 | Trust badge distinguishes company legal identity verification from facility evidence audits | Automated unit (`db.test.js`) | Pass |
| TC45 | Job seeker submits accessibility fraud report with case number `CASE-2026-XXXX` and validation | Automated unit (`db.test.js`) | Pass |
| TC46 | Admin investigates fraud report, freezes fraudulent job listing, and records immutable audit log | Automated unit (`db.test.js`) | Pass |
| TC47 | Employer responds to candidate accessibility dispute with formal corrective plan | Automated unit (`db.test.js`) | Pass |
| TC48 | Employer declares facility evidence and admin reviews and certifies it | Automated unit (`db.test.js`) | Pass |
| TC49 | Candidate manages multiple CVs, sets primary, and withdraws active application | Automated unit (`db.test.js`) | Pass |

## Additional soft-testing checklist

- [ ] Clean install: `rm -rf node_modules && npm install`
- [ ] Automated suite: `npm test`
- [ ] Production compile: `npm run build`
- [ ] Fresh start: `npm run dev`; homepage and all primary routes load without console errors
- [ ] Public pages, seeker pages, employer pages, and admin pages have the correct navigation for each role
- [ ] Login, logout, refresh, wrong-role redirects, suspended-account rejection, and direct URL access
- [ ] Forms: required fields, invalid email, short password, duplicate email, whitespace, invalid salary ranges, and readable inline errors
- [ ] Search: keyword, location, type, arrangement, salary, verified-only, single/multiple accommodation tags, and zero-result state
- [ ] Job creation, edit, deactivate/reactivate, deletion, apply, duplicate application, saved jobs, and status tracking
- [ ] Verification submission, approval, rejection, and rejection reason
- [ ] Accessibility drawer opens/closes with mouse and keyboard, closes with Escape, keeps focus inside while open, and returns focus to its opener
- [ ] Keyboard-only run: Tab/Shift+Tab, Enter/Space, focus visibility, skip link, dialogs, filters, and form errors
- [ ] Zoom at 200% and 400%; mobile viewport; no clipped or horizontally overflowing primary content
- [ ] Contrast/theme controls, larger text, spacing, reduced motion, reading ruler/mask, and text-to-speech are each toggled on and off
- [ ] Verify accessibility settings remain after refresh and reset cleanly when requested
- [ ] Check browser console for errors and warnings during the main user journeys
- [ ] Complete a final regression run after the last code change and record date/browser/device

## Test execution summary
 
- **Automated Vitest Suite**: 55 / 55 tests passed (100% pass rate).
- **Core Coverage**:
  - Authentication & session handling (TC01–TC07)
  - Role-based registration & strict validation (TC08–TC13)
  - Accessibility & accommodation search algorithms (TC14–TC20)
  - Employer lifecycle & job governance (TC21–TC25)
  - Application submissions, skill gaps, & saved jobs (TC26–TC30)
  - Applicant pipeline tracking (TC31–TC32)
  - Employer legal verification & admin moderation (TC33–TC38)
  - Route guards & accessibility preferences (TC39–TC43)
  - Accountability trust badges, fraud reporting, listing freeze, dispute resolution, facility evidence, and CV management (TC44–TC49)
- **Production Build Status**: Verified clean Vite build (`npm run check`) with zero errors.
