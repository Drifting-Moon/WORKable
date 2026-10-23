import { describe, it, expect, beforeEach } from 'vitest';
import { seed } from '../data/seed';
import * as S from './db';

let d;
beforeEach(() => { d = structuredClone(seed); });
const goodJob = {
  title: 'Accessibility QA Analyst', desc: 'Test web interfaces using keyboard and screen readers.',
  location: 'Jaipur', type: 'Full-time', arrangement: 'Remote', salaryMin: 3, salaryMax: 5,
  skills: ['WCAG', 'Screen Readers', 'Manual Testing'], tags: ['remote', 'at'], resp: [], qual: '',
};
const userInput = (overrides = {}) => ({
  name: 'Ravi Sharma', email: 'ravi@example.com', password: 'Strong@123', role: 'seeker', ...overrides,
});

describe('TC01–TC07: authentication', () => {
  it('TC01: logs in with valid seeker credentials', () => {
    expect(S.loginUser(d, 'seeker@workable.demo', 'Demo@123').role).toBe('seeker');
  });
  it('TC02: rejects a valid email with a wrong password', () => {
    expect(() => S.loginUser(d, 'seeker@workable.demo', 'wrong123')).toThrow('Email or password is incorrect.');
  });
  it('TC03: rejects an unknown email with a generic credential error', () => {
    expect(() => S.loginUser(d, 'nobody@test.com', 'Demo@123')).toThrow('Email or password is incorrect.');
  });
  it('TC04–TC05: refuses empty email or password', () => {
    expect(() => S.loginUser(d, '', 'Demo@123')).toThrow('Email or password is incorrect.');
    expect(() => S.loginUser(d, 'seeker@workable.demo', '')).toThrow('Email or password is incorrect.');
  });
  it('TC06: refuses suspended accounts', () => {
    d.users.find((u) => u.id === 'u_s2').suspended = true;
    expect(() => S.loginUser(d, 'priya@workable.demo', 'Demo@123')).toThrow(/suspended/i);
  });
  it('TC07: matches email case-insensitively and ignores surrounding whitespace', () => {
    expect(S.loginUser(d, '  SEEKER@Workable.demo  ', 'Demo@123').id).toBe('u_s1');
  });
});

describe('TC08–TC13: registration and validation', () => {
  it('TC08: creates a valid employer and stores its organization', () => {
    const u = S.registerUser(d, userInput({ email: 'ravi@test.com', role: 'employer', company: 'Test Co' }));
    expect(u.role).toBe('employer'); expect(u.company).toBe('Test Co'); expect(d.users).toContain(u);
  });
  it('TC09: rejects duplicate email addresses regardless of case', () => {
    expect(() => S.registerUser(d, userInput({ email: 'SEEKER@WORKABLE.DEMO' }))).toThrow(/highlighted fields/i);
    expect(() => S.registerUser(d, userInput({ email: 'SEEKER@WORKABLE.DEMO' }))).toThrow();
  });
  it('TC10: rejects passwords shorter than eight characters', () => {
    expect(() => S.registerUser(d, userInput({ password: 'abc123' }))).toThrow(/highlighted fields/i);
    expect(() => S.registerUser(d, userInput({ password: 'abc123' }))).toThrow();
  });
  it('TC11: rejects invalid email syntax', () => {
    expect(() => S.registerUser(d, userInput({ email: 'not-an-email' }))).toThrow(/highlighted fields/i);
  });
  it('TC12: blocks self-registration of administrator accounts', () => {
    const count = d.users.length;
    expect(() => S.registerUser(d, userInput({ role: 'admin' }))).toThrow(/highlighted fields/i);
    expect(d.users).toHaveLength(count);
  });
  it('TC13: requires an organization name for employers', () => {
    expect(() => S.registerUser(d, userInput({ role: 'employer', company: '  ' }))).toThrow(/highlighted fields/i);
  });
  it('normalizes surrounding whitespace in registration email', () => {
    const u = S.registerUser(d, userInput({ email: '  ravi@example.com  ' }));
    expect(u.email).toBe('ravi@example.com');
  });
});

describe('TC14–TC20: job search and accessibility filters', () => {
  it('TC14: searches job title, description, company, and skills', () => {
    expect(S.filterJobs(d, { q: 'react' }).map((j) => j.id)).toEqual(['j1']);
    expect(S.filterJobs(d, { q: 'brightpath' }).length).toBeGreaterThan(0);
  });
  it('TC15: combines multiple accommodation tags using AND semantics', () => {
    const jobs = S.filterJobs(d, { tags: ['wheel', 'sign'] });
    expect(jobs.map((j) => j.id).sort()).toEqual(['j1', 'j6']);
    expect(jobs.every((j) => j.tags.includes('wheel') && j.tags.includes('sign'))).toBe(true);
  });
  it('TC16: verified-only results include only verified employers', () => {
    const jobs = S.filterJobs(d, { verified: true });
    expect(jobs.map((j) => j.id).sort()).toEqual(['j1', 'j2', 'j3']);
    expect(jobs.every((j) => S.isVerified(d, j))).toBe(true);
  });
  it('TC17: displays no results for an unmatched keyword', () => {
    expect(S.filterJobs(d, { q: 'zzzz' })).toHaveLength(0);
  });
  it('TC18: minimum salary includes jobs whose maximum salary meets the threshold', () => {
    expect(S.filterJobs(d, { min: '12' }).map((j) => j.id).sort()).toEqual(['j1', 'j10', 'j3']);
  });
  it('TC19: combines remote arrangement and flexible-hours accommodation', () => {
    expect(S.filterJobs(d, { arr: 'Remote', tags: ['flex'] }).map((j) => j.id).sort()).toEqual(['j2', 'j5', 'j8', 'j9']);
  });
  it('TC20: hides jobs belonging to a suspended employer', () => {
    d.users.find((u) => u.id === 'u_e1').suspended = true;
    expect(S.filterJobs(d, {}).some((j) => j.employerId === 'u_e1')).toBe(false);
  });
  it('supports location, type, arrangement, and verifiedOnly aliases', () => {
    expect(S.filterJobs(d, { location: 'jaipur', type: 'Full-time', arrangement: 'Hybrid' }).length).toBeGreaterThan(0);
    expect(S.filterJobs(d, { verifiedOnly: true }).every((j) => S.isVerified(d, j))).toBe(true);
  });
  it('does not show inactive jobs', () => {
    S.setJobActive(d, 'j1', 'u_e1', false);
    expect(S.filterJobs(d, {}).some((j) => j.id === 'j1')).toBe(false);
  });
});

describe('TC21–TC25: employer job management', () => {
  it('TC21: saves a valid job for an active employer', () => {
    const j = S.saveJob(d, goodJob, 'u_e1');
    expect(d.jobs.find((x) => x.id === j.id)).toMatchObject({ title: goodJob.title, employerId: 'u_e1', active: true });
  });
  it('TC22: validates required fields and salary range', () => {
    expect(S.validateJob({ ...goodJob, title: '' }).title).toBeTruthy();
    expect(S.validateJob({ ...goodJob, desc: '' }).desc).toBeTruthy();
    expect(S.validateJob({ ...goodJob, salaryMin: 10, salaryMax: 5 }).salaryMax).toBeTruthy();
    expect(S.validateJob({ ...goodJob, skills: [] }).skills).toBeTruthy();
  });
  it('TC23: permits an employer to edit its own job', () => {
    const updated = S.saveJob(d, { ...d.jobs[0], title: 'Updated Frontend Developer' }, 'u_e1');
    expect(updated.title).toBe('Updated Frontend Developer');
  });
  it('TC24: prevents editing or deleting another employer’s job', () => {
    expect(() => S.saveJob(d, { ...goodJob, id: 'j1' }, 'u_e2')).toThrow(/own listings/i);
    expect(() => S.deleteJob(d, 'j1', 'u_e2')).toThrow(/own listings/i);
  });
  it('TC25: can deactivate and reactivate own jobs', () => {
    S.setJobActive(d, 'j1', 'u_e1', false); expect(d.jobs.find((j) => j.id === 'j1').active).toBe(false);
    S.setJobActive(d, 'j1', 'u_e1', true); expect(d.jobs.find((j) => j.id === 'j1').active).toBe(true);
  });
  it('blocks job management by non-employers or suspended employers', () => {
    expect(() => S.saveJob(d, goodJob, 'u_s1')).toThrow(/active employer/i);
    d.users.find((u) => u.id === 'u_e1').suspended = true;
    expect(() => S.saveJob(d, goodJob, 'u_e1')).toThrow(/active employer/i);
  });
});

describe('TC26–TC30: applications, saved jobs, and skill matching', () => {
  it('TC26: submits a new application', () => {
    const a = S.applyToJob(d, 'u_s1', 'j12', { cover: 'Interested in the role.' });
    expect(a).toMatchObject({ seekerId: 'u_s1', jobId: 'j12', status: 'Applied', cover: 'Interested in the role.' });
  });
  it('TC27: prevents duplicate applications', () => {
    expect(() => S.applyToJob(d, 'u_s1', 'j1', {})).toThrow(/already applied/i);
  });
  it('TC28: refuses applications to deactivated jobs', () => {
    S.setJobActive(d, 'j5', 'u_e2', false);
    expect(() => S.applyToJob(d, 'u_s1', 'j5', {})).toThrow(/no longer accepting/i);
  });
  it('TC29: saves and unsaves a job', () => {
    expect(S.toggleSaved(d, 'u_s1', 'j5')).toBe(true);
    expect(S.toggleSaved(d, 'u_s1', 'j5')).toBe(false);
  });
  it('allows removing a saved job after the employer deactivates it', () => {
    S.setJobActive(d, 'j2', 'u_e1', false);
    expect(S.toggleSaved(d, 'u_s1', 'j2')).toBe(false);
    expect(d.saved.some((x) => x.seekerId === 'u_s1' && x.jobId === 'j2')).toBe(false);
  });
  it('TC30: calculates skill match and missing skills correctly', () => {
    const m = S.matchJob(['React', 'JavaScript', 'SQL'], d.jobs[0]);
    expect(m.score).toBe(50); expect(m.missing).toEqual(['TypeScript', 'CSS']);
  });
  it('blocks non-seeker application attempts and suspended employers’ jobs', () => {
    expect(() => S.applyToJob(d, 'u_e1', 'j12', {})).toThrow(/job seeker/i);
    d.users.find((u) => u.id === 'u_e1').suspended = true;
    expect(() => S.applyToJob(d, 'u_s1', 'j1', {})).toThrow(/no longer accepting/i);
  });
});

describe('TC31–TC32: applicant tracking', () => {
  it('TC31: lets the owning employer update application status', () => {
    S.setStatus(d, 'a1', 'u_e1', 'Interview');
    expect(d.applications.find((a) => a.id === 'a1').status).toBe('Interview');
  });
  it('TC32: blocks another employer and invalid statuses', () => {
    expect(() => S.setStatus(d, 'a1', 'u_e2', 'Hired')).toThrow(/own listings/i);
    expect(() => S.setStatus(d, 'a1', 'u_e1', 'Unknown')).toThrow(/unknown status/i);
  });
});

describe('TC33–TC38: employer verification and administration', () => {
  it('TC33: submits a valid verification request', () => {
    S.submitVerification(d, 'u_e4', { description: 'Step-free offices and screen-reader support are available.', evidence: 'DEMO-DOC.pdf' });
    expect(S.employerStatus(d, 'u_e4')).toBe('Pending Review');
  });
  it('TC34: rejects a verification description shorter than 20 characters', () => {
    expect(() => S.submitVerification(d, 'u_e4', { description: 'Ramps', evidence: 'DEMO-DOC.pdf' })).toThrow(/highlighted fields/i);
  });
  it('TC35: prevents duplicate pending verification requests', () => {
    expect(() => S.submitVerification(d, 'u_e2', { description: 'Step-free offices and assistive technology.', evidence: 'DEMO-DOC.pdf' })).toThrow(/already have a request pending/i);
  });
  it('TC36: lets the admin review a pending request as verified', () => {
    S.reviewVerification(d, 'v2', true);
    expect(S.employerStatus(d, 'u_e2')).toBe('Verified');
    expect(S.filterJobs(d, { verified: true }).some((j) => j.employerId === 'u_e2')).toBe(true);
  });
  it('TC37: requires a reason when rejecting a verification request', () => {
    expect(() => S.reviewVerification(d, 'v2', false, '  ')).toThrow(/reason/i);
  });
  it('TC38: saves rejection reason and removes verified status', () => {
    S.reviewVerification(d, 'v2', false, 'Evidence is unclear');
    expect(S.employerStatus(d, 'u_e2')).toBe('Rejected');
    expect(d.verifications.find((v) => v.id === 'v2').reason).toBe('Evidence is unclear');
    expect(S.isVerified(d, d.jobs.find((j) => j.id === 'j4'))).toBe(false);
  });
  it('does not allow suspending admin accounts and rejects duplicate tags', () => {
    expect(() => S.setSuspended(d, 'u_admin', true)).toThrow(/admin accounts/i);
    expect(() => S.addTag(d, 'Remote or hybrid work')).toThrow(/already exists/i);
  });
});

describe('TC39–TC43: access control and accessibility preferences', () => {
  it('TC39: a seeker cannot access admin-only routes', () => {
    const seeker = S.loginUser(d, 'seeker@workable.demo', 'Demo@123');
    expect(S.canAccess(seeker, 'admin')).toBe(false); expect(S.canAccess(seeker, 'seeker')).toBe(true);
  });
  it('TC40: a logged-out user has no protected-role access', () => {
    expect(S.canAccess(null, 'employer')).toBe(false); expect(S.canAccess(null, 'admin')).toBe(false);
  });
  it('TC41: show/hide password control is represented by an accessible UI button', async () => {
    const { readFile } = await import('node:fs/promises');
    const publicPage = await readFile(new URL('../pages/Public.jsx', import.meta.url), 'utf8');
    expect(publicPage).toContain("aria-label={show ? 'Hide password' : 'Show password'}");
    expect(publicPage).toContain("type={show ? 'text' : 'password'}");
  });
  it('TC42: accessibility preferences are persisted and applied through the app store', async () => {
    const { readFile } = await import('node:fs/promises');
    const store = await readFile(new URL('../store.jsx', import.meta.url), 'utf8');
    expect(store).toContain("localStorage.setItem('workable_prefs', JSON.stringify(updated))");
    expect(store).toContain('setProperty');
  });
  it('TC43: the app provides skip navigation, semantic main content, and visible focus styling', async () => {
    const { readFile } = await import('node:fs/promises');
    const app = await readFile(new URL('../App.jsx', import.meta.url), 'utf8');
    const css = await readFile(new URL('../index.css', import.meta.url), 'utf8');
    expect(app).toContain('Skip to main content'); expect(app).toContain('<main id="main"');
    expect(css).toMatch(/focus-visible|focus:ring|outline/);
  });
});

describe('TC44–TC50: Accessibility Accountability, Evidence Audits, and Resumes', () => {
  it('TC44: calculates accessibility trust badges distinguishing identity from facility audit', () => {
    // j7 is Kinetic Retail: has active investigation CASE-2026-1001 -> 'Under Investigation'
    const b7 = S.getAccessibilityTrustBadge(d, 'j7');
    expect(b7.tier).toBe('Under Investigation');
    expect(b7.tone).toBe('bad');

    // j1 is BrightPath: employer is verified AND has approved evidence ev_1 -> 'Evidence Verified'
    const b1 = S.getAccessibilityTrustBadge(d, 'j1');
    expect(b1.tier).toBe('Evidence Verified');
    expect(b1.tone).toBe('good');
  });

  it('TC45: submits accessibility fraud report with case number and validation', () => {
    const rep = S.submitAccessibilityReport(d, 'u_s1', {
      jobId: 'j2',
      employerId: 'u_e1',
      claimType: 'Physical Access Barrier',
      disputedAccommodation: 'Wheelchair ramp',
      description: 'The second floor entrance has three steep steps and no motorized ramp available anywhere on site.',
      evidenceUrl: 'https://storage.example.com/photo1.jpg',
      isAnonymous: true,
    });
    expect(rep.caseNumber).toMatch(/^CASE-2026-\d{4}$/);
    expect(rep.caseStatus).toBe('Submitted');
    expect(rep.isAnonymous).toBe(true);
    expect(d.reports.some((r) => r.id === rep.id)).toBe(true);

    // Rejects short narrative (< 25 characters)
    try {
      S.submitAccessibilityReport(d, 'u_s1', {
        jobId: 'j2',
        employerId: 'u_e1',
        claimType: 'Physical Access Barrier',
        disputedAccommodation: 'Wheelchair ramp',
        description: 'Too short context',
      });
      expect.fail('Should have thrown validation error');
    } catch (err) {
      expect(err.message).toMatch(/required dispute information/i);
      expect(err.fields?.description).toMatch(/minimum 25 characters/i);
    }
  });

  it('TC46: admin investigates report, freezes fraudulent job listing, and records audit trail', () => {
    const jobBefore = d.jobs.find((j) => j.id === 'j7');
    expect(jobBefore.active).toBe(true);

    // Freeze listing under fraud hold
    S.updateReportStatus(d, 'rep_1', 'u_admin', {
      caseStatus: 'Under Review',
      adminNotes: 'Multiple independent reports of inaccessible stairs.',
      freezeListing: true,
    });

    const jobAfter = d.jobs.find((j) => j.id === 'j7');
    expect(jobAfter.active).toBe(false);
    expect(jobAfter.status).toBe('Suspended_Fraud_Hold');

    // Check audit log
    const log = d.auditLogs.find((l) => l.entityId === 'rep_1' && l.actionType === 'case_status_updated');
    expect(log).toBeDefined();
    expect(log.actorId).toBe('u_admin');
  });

  it('TC47: employer responds to candidate dispute with corrective plan', () => {
    const updated = S.submitEmployerDisputeResponse(d, 'rep_1', 'u_e3', {
      responseText: 'We have contracted an accessibility contractor to install a temporary modular ramp by next Monday.',
    });
    expect(updated.employerResponse).toContain('modular ramp');
    expect(updated.caseStatus).toBe('Under Review');
  });

  it('TC48: employer declares facility evidence and admin certifies it', () => {
    const ev = S.submitAccessibilityEvidence(d, 'u_e1', {
      facilityType: 'Screen Reader & Assistive Tools',
      label: 'Screen Reader Optimization',
      description: 'Internal testing completed with NVDA and JAWS across all web platforms.',
      documentUrl: 'https://example.com/audit.pdf',
    });
    expect(ev.status).toBe('Pending Review');

    // Admin reviews and approves
    const approved = S.reviewAccessibilityEvidence(
      d,
      ev.id,
      'u_admin',
      true,
      'Full compliance audit verified by certified IAAP specialist.'
    );
    expect(approved.status).toBe('Evidence Verified');
    expect(approved.notes).toContain('IAAP specialist');
  });

  it('TC49: candidate manages multiple CVs, sets primary, and withdraws application', () => {
    // Add resume
    const res = S.manageResume(d, 'u_s1', 'upload', {
      fileName: 'Senior_Engineer_2026.pdf',
      fileSize: '182 KB',
    });
    expect(res.fileName).toBe('Senior_Engineer_2026.pdf');

    // Set primary
    S.manageResume(d, 'u_s1', 'set_primary', { resumeId: res.id });
    const userResumes = d.resumes.filter((r) => r.seekerId === 'u_s1');
    expect(userResumes.find((r) => r.id === res.id).isPrimary).toBe(true);

    // Withdraw application
    const app = d.applications.find((a) => a.seekerId === 'u_s1');
    const withdrawn = S.withdrawApplication(d, app.id, 'u_s1');
    expect(withdrawn.status).toBe('Withdrawn');
  });
});

