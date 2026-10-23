// DATA + BUSINESS-RULES LAYER. No React here, so it is easy to test and easy to swap for Supabase later.
// Every "mutating" function receives a draft copy of the database `d` and changes it (or throws an Error).
import { seed } from '../data/seed.js';
const KEY = 'workable_db_v1';
export const STATUSES = ['Applied', 'Under Review', 'Interview', 'Hired', 'Rejected'];
export const TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
export const ARRANGEMENTS = ['On-site', 'Hybrid', 'Remote'];

export const reset = () => { const d = structuredClone(seed); localStorage.setItem(KEY, JSON.stringify(d)); return d; };
export const load = () => {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && d.users) {
      if (!d.reports) d.reports = structuredClone(seed.reports || []);
      if (!d.auditLogs) d.auditLogs = structuredClone(seed.auditLogs || []);
      if (!d.resumes) d.resumes = structuredClone(seed.resumes || []);
      if (!d.evidence) d.evidence = structuredClone(seed.evidence || []);
      return d;
    }
  } catch { /* ignore */ }
  return reset();
};
export const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));

const newId = (p) => p + Math.random().toString(36).slice(2, 9);
const fail = (msg, fields) => { throw Object.assign(new Error(msg), { fields }); };

/* ---------- Auth (DEMO ONLY: plain-text passwords, never do this in production) ---------- */
export function registerUser(d, { name, email, password, role, company }) {
  const e = {};
  const cleanEmail = (email || '').trim();
  if (!name?.trim()) e.name = 'Enter your name.';
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) e.email = 'Enter a valid email address.';
  if ((password || '').length < 8) e.password = 'Password must be at least 8 characters.';
  if (!['seeker', 'employer'].includes(role)) e.role = 'Choose Job Seeker or Employer. Admin accounts cannot be self-registered.';
  if (role === 'employer' && !company?.trim()) e.company = 'Enter your company name.';
  if (!e.email && d.users.some((u) => u.email.toLowerCase() === cleanEmail.toLowerCase())) e.email = 'This email is already registered.';
  if (Object.keys(e).length) fail('Please fix the highlighted fields.', e);
  const u = { id: newId('u_'), name: name.trim(), email: cleanEmail, password, role, suspended: false, createdAt: new Date().toISOString(),
    ...(role === 'employer' ? { company: company.trim() } : { profile: { phone: '', summary: '', skills: [], education: '', experience: '', locations: [], arrangements: [], accessPrefs: [], resumeName: '' } }) };
  d.users.push(u);
  return u;
}
export function loginUser(d, email, password) {
  const u = d.users.find((x) => x.email.toLowerCase() === (email || '').trim().toLowerCase());
  if (!u || u.password !== password) throw new Error('Email or password is incorrect.');
  if (u.suspended) throw new Error('This account is suspended. Please contact an administrator.');
  return u;
}
export const canAccess = (user, role) => !!user && user.role === role; // used by route guards

/* ---------- Helpers ---------- */
export const companyOf = (d, empId) => d.users.find((u) => u.id === empId)?.company || 'Unknown company';
export function employerStatus(d, empId) {
  const list = d.verifications.filter((v) => v.employerId === empId);
  return list.length ? list[list.length - 1].status : 'Not Submitted';
}
export const isVerified = (d, job) => employerStatus(d, job.employerId) === 'Verified';

/* ---------- Matching: score = matched required skills / total required skills x 100 ---------- */
export function matchJob(skills = [], job) {
  const safeJobSkills = Array.isArray(job?.skills) ? job.skills : [];
  const safeUserSkills = Array.isArray(skills) ? skills : [];
  const have = new Set(safeUserSkills.map((s) => (s || '').trim().toLowerCase()));
  const matched = safeJobSkills.filter((s) => have.has((s || '').toLowerCase()));
  const missing = safeJobSkills.filter((s) => !have.has((s || '').toLowerCase()));
  return { score: safeJobSkills.length ? Math.round((matched.length / safeJobSkills.length) * 100) : 0, matched, missing };
}

/* ---------- Search & filters (all filters combine with AND) ---------- */
export function filterJobs(d, f = {}, skills = []) {
  const q = (f.q || '').toLowerCase().trim();
  const loc = (f.location || '').toLowerCase().trim();
  let r = (d.jobs || []).filter((j) => {
    const owner = (d.users || []).find((u) => u.id === j.employerId);
    if (!j.active || owner?.suspended) return false;
    if (q && ![j.title || '', companyOf(d, j.employerId) || '', j.desc || '', ...(Array.isArray(j.skills) ? j.skills : [])].join(' ').toLowerCase().includes(q)) return false;
    if (loc && !(j.location || '').toLowerCase().includes(loc)) return false;
    if (f.type && j.type !== f.type) return false;
    const arrangement = f.arr || f.arrangement;
    if (arrangement && j.arrangement !== arrangement) return false;
    if (f.min && j.salaryMax < Number(f.min)) return false;
    if ((f.tags || []).some((t) => !(j.tags || []).includes(t))) return false;
    if ((f.verified || f.verifiedOnly) && !isVerified(d, j)) return false;
    return true;
  });
  const byNew = (a, b) => (b.postedAt || '').localeCompare(a.postedAt || '');
  r = f.sort === 'relevance' && skills.length ? r.sort((a, b) => matchJob(skills, b).score - matchJob(skills, a).score || byNew(a, b)) : r.sort(byNew);
  return r;
}

/* ---------- Job CRUD (employer) ---------- */
export function validateJob(j) {
  const e = {};
  if (!j.title?.trim()) e.title = 'Enter a job title.';
  if (!j.desc?.trim()) e.desc = 'Enter a job description.';
  if (!j.location?.trim()) e.location = 'Enter a location.';
  if (!j.skills?.length) e.skills = 'Add at least one required skill.';
  if (!TYPES.includes(j.type)) e.type = 'Choose an employment type.';
  if (!ARRANGEMENTS.includes(j.arrangement)) e.arrangement = 'Choose a work arrangement.';
  const lo = Number(j.salaryMin), hi = Number(j.salaryMax);
  if (!(lo > 0)) e.salaryMin = 'Enter a minimum salary greater than 0.';
  if (!(hi > 0) || hi < lo) e.salaryMax = 'Maximum salary must be at least the minimum.';
  return e;
}
export function saveJob(d, job, employerId) {
  const employer = d.users.find((u) => u.id === employerId);
  if (!employer || employer.role !== 'employer' || employer.suspended) throw new Error('An active employer account is required to manage jobs.');
  const e = validateJob(job);
  if (Object.keys(e).length) fail('Please fix the highlighted fields.', e);
  const clean = { ...job, title: job.title.trim(), salaryMin: Number(job.salaryMin), salaryMax: Number(job.salaryMax), resp: job.resp || [], qual: job.qual || '' };
  if (job.id) {
    const i = d.jobs.findIndex((j) => j.id === job.id);
    if (i < 0) throw new Error('Job not found.');
    if (d.jobs[i].employerId !== employerId) throw new Error('You can only edit your own listings.');
    d.jobs[i] = { ...d.jobs[i], ...clean };
    return d.jobs[i];
  }
  const j = { ...clean, id: newId('j_'), employerId, active: true, postedAt: new Date().toISOString() };
  d.jobs.push(j);
  return j;
}
export function deleteJob(d, jobId, employerId) {
  const employer = d.users.find((u) => u.id === employerId);
  if (!employer || employer.role !== 'employer' || employer.suspended) throw new Error('An active employer account is required to manage jobs.');
  const j = d.jobs.find((x) => x.id === jobId);
  if (!j || j.employerId !== employerId) throw new Error('You can only delete your own listings.');
  d.jobs = d.jobs.filter((x) => x.id !== jobId);
  d.applications = d.applications.filter((a) => a.jobId !== jobId);
  d.saved = d.saved.filter((s) => s.jobId !== jobId);
}
export function setJobActive(d, jobId, employerId, active) {
  const employer = d.users.find((u) => u.id === employerId);
  if (!employer || employer.role !== 'employer' || employer.suspended) throw new Error('An active employer account is required to manage jobs.');
  const j = d.jobs.find((x) => x.id === jobId);
  if (!j || j.employerId !== employerId) throw new Error('You can only change your own listings.');
  j.active = active;
}

/* ---------- Saved jobs & applications (job seeker) ---------- */
export function toggleSaved(d, seekerId, jobId) {
  const seeker = d.users.find((u) => u.id === seekerId);
  if (!seeker || seeker.role !== 'seeker' || seeker.suspended) throw new Error('An active job seeker account is required to save jobs.');
  const i = d.saved.findIndex((s) => s.seekerId === seekerId && s.jobId === jobId);
  // Removing a bookmark must remain possible even if the listing has since closed.
  if (i >= 0) { d.saved.splice(i, 1); return false; }
  const job = d.jobs.find((j) => j.id === jobId);
  if (!job || !job.active) throw new Error('This job is no longer available.');
  d.saved.push({ seekerId, jobId });
  return true;
}
export function applyToJob(d, seekerId, jobId, { cover = '', resume = '' } = {}) {
  const seeker = d.users.find((u) => u.id === seekerId);
  if (!seeker || seeker.role !== 'seeker' || seeker.suspended) throw new Error('An active job seeker account is required to apply.');
  const job = d.jobs.find((j) => j.id === jobId);
  const owner = job && d.users.find((u) => u.id === job.employerId);
  if (!job || !job.active || owner?.suspended) throw new Error('This job is no longer accepting applications.');
  if (d.applications.some((a) => a.seekerId === seekerId && a.jobId === jobId)) throw new Error('You have already applied to this job.');
  const a = { id: newId('a_'), seekerId, jobId, cover: cover.trim(), resume, status: 'Applied', appliedAt: new Date().toISOString() };
  d.applications.push(a);
  return a;
}
export function setStatus(d, appId, employerId, status) {
  const employer = d.users.find((u) => u.id === employerId);
  if (!employer || employer.role !== 'employer' || employer.suspended) throw new Error('An active employer account is required to manage applicants.');
  const a = d.applications.find((x) => x.id === appId);
  const job = a && d.jobs.find((j) => j.id === a.jobId);
  if (!job || job.employerId !== employerId) throw new Error('You can only update applications for your own listings.');
  if (!STATUSES.includes(status)) throw new Error('Unknown status.');
  a.status = status;
}

/* ---------- Verification workflow ---------- */
export function submitVerification(d, employerId, { description, evidence }) {
  const e = {};
  if ((description || '').trim().length < 20) e.description = 'Describe your accessibility features in at least 20 characters.';
  if (!evidence?.trim()) e.evidence = 'Add an evidence reference (for example a document name).';
  if (Object.keys(e).length) fail('Please fix the highlighted fields.', e);
  if (employerStatus(d, employerId) === 'Pending Review') throw new Error('You already have a request pending review.');
  d.verifications.push({ id: newId('v_'), employerId, description: description.trim(), evidence: evidence.trim(), status: 'Pending Review', reason: '', submittedAt: new Date().toISOString() });
}
export function reviewVerification(d, id, approve, reason = '') {
  const v = d.verifications.find((x) => x.id === id);
  if (!v || v.status !== 'Pending Review') throw new Error('This request is not pending.');
  if (!approve && !reason.trim()) throw new Error('Please record a reason for rejection.');
  v.status = approve ? 'Verified' : 'Rejected';
  v.reason = approve ? '' : reason.trim();
}

/* ---------- Admin ---------- */
export function setSuspended(d, userId, value) {
  const u = d.users.find((x) => x.id === userId);
  if (!u || u.role === 'admin') throw new Error('Admin accounts cannot be suspended.');
  u.suspended = value;
}
export function addTag(d, label) {
  const l = (label || '').trim();
  if (!l) throw new Error('Enter a tag name.');
  if (d.tags.some((t) => t.label.toLowerCase() === l.toLowerCase())) throw new Error('That tag already exists.');
  d.tags.push({ id: newId('t_'), label: l });
}
export function removeTag(d, id) {
  d.tags = d.tags.filter((t) => t.id !== id);
  d.jobs.forEach((j) => { j.tags = j.tags.filter((t) => t !== id); });
}

/* ---------- Accessibility Trust & Accountability Layer ---------- */

export function getAccessibilityTrustBadge(d, jobId) {
  const job = d.jobs.find((j) => j.id === jobId);
  if (!job) return { tier: 'Unknown', label: 'Listing not found', color: 'neutral' };

  const isIdVerified = isVerified(d, job);
  const activeReports = (d.reports || []).filter(
    (r) =>
      (r.jobId === jobId || r.employerId === job.employerId) &&
      ['Under Review', 'Employer Response Requested'].includes(r.caseStatus)
  );

  const verifiedEvidence = (d.evidence || []).filter(
    (ev) => ev.employerId === job.employerId && ev.status === 'Evidence Verified'
  );

  if (activeReports.length > 0) {
    return {
      tier: 'Under Investigation',
      label: '⚠️ Accessibility Claim Under Formal Review',
      badge: 'Under Review',
      tone: 'bad',
      isIdVerified,
      evidenceCount: verifiedEvidence.length,
      activeReportsCount: activeReports.length,
    };
  }

  if (verifiedEvidence.length > 0) {
    return {
      tier: 'Evidence Verified',
      label: `Verified Accessibility (${verifiedEvidence.length} facility audit${verifiedEvidence.length > 1 ? 's' : ''})`,
      badge: 'Evidence Verified',
      tone: 'good',
      isIdVerified,
      evidenceCount: verifiedEvidence.length,
    };
  }

  if (isIdVerified) {
    return {
      tier: 'Self-Reported',
      label: 'Employer Verified • Accessibility Self-Reported',
      badge: 'Self-Reported',
      tone: 'warn',
      isIdVerified,
      evidenceCount: 0,
    };
  }

  return {
    tier: 'Unverified',
    label: 'Self-Reported (Unverified Employer)',
    badge: 'Self-Reported',
    tone: 'neutral',
    isIdVerified: false,
    evidenceCount: 0,
  };
}

export function submitAccessibilityReport(d, reporterId, report) {
  const e = {};
  if (!report.claimType?.trim()) e.claimType = 'Select a category for the dispute.';
  if (!report.disputedAccommodation?.trim()) e.disputedAccommodation = 'Specify which declared facility is disputed.';
  if ((report.description || '').trim().length < 25)
    e.description = 'Please provide detailed context (minimum 25 characters) to help the investigation team.';

  if (Object.keys(e).length) fail('Please complete the required dispute information.', e);

  if (!d.reports) d.reports = [];
  if (!d.auditLogs) d.auditLogs = [];

  const caseNum = `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const newReport = {
    id: newId('rep_'),
    caseNumber: caseNum,
    reporterId: report.isAnonymous ? null : reporterId,
    isAnonymous: !!report.isAnonymous,
    jobId: report.jobId || null,
    employerId: report.employerId,
    claimType: report.claimType.trim(),
    disputedAccommodation: report.disputedAccommodation.trim(),
    incidentDate: report.incidentDate || new Date().toISOString().slice(0, 10),
    description: report.description.trim(),
    evidenceUrl: (report.evidenceUrl || '').trim(),
    caseStatus: 'Submitted',
    employerResponse: '',
    employerRespondedAt: null,
    adminNotes: 'Initial report received. Awaiting case officer intake.',
    resolutionAction: 'none',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  d.reports.unshift(newReport);

  d.auditLogs.unshift({
    id: newId('log_'),
    actorId: reporterId,
    actionType: 'report_submitted',
    entityType: 'accessibility_report',
    entityId: newReport.id,
    metadata: { caseNumber: caseNum, employerId: report.employerId, isAnonymous: report.isAnonymous },
    createdAt: new Date().toISOString(),
  });

  return newReport;
}

export function updateReportStatus(d, reportId, adminId, { caseStatus, adminNotes, resolutionAction, freezeListing = false }) {
  const r = (d.reports || []).find((x) => x.id === reportId);
  if (!r) throw new Error('Report case not found.');

  const oldStatus = r.caseStatus;
  if (caseStatus) r.caseStatus = caseStatus;
  if (adminNotes !== undefined) r.adminNotes = adminNotes.trim();
  if (resolutionAction) r.resolutionAction = resolutionAction;
  r.updatedAt = new Date().toISOString();

  if (freezeListing && r.jobId) {
    const job = d.jobs.find((j) => j.id === r.jobId);
    if (job) {
      job.active = false;
      job.status = 'Suspended_Fraud_Hold';
    }
  }

  if (!d.auditLogs) d.auditLogs = [];
  d.auditLogs.unshift({
    id: newId('log_'),
    actorId: adminId,
    actionType: 'case_status_updated',
    entityType: 'accessibility_report',
    entityId: reportId,
    metadata: { caseNumber: r.caseNumber, oldStatus, newStatus: r.caseStatus, resolutionAction: r.resolutionAction, freezeListing },
    createdAt: new Date().toISOString(),
  });

  return r;
}

export function submitEmployerDisputeResponse(d, reportId, employerId, { responseText, evidenceAttachment = '' }) {
  const r = (d.reports || []).find((x) => x.id === reportId);
  if (!r || r.employerId !== employerId) throw new Error('Unauthorized or report case not found.');

  if (!responseText?.trim() || responseText.trim().length < 20) {
    throw new Error('Please submit a substantive formal response (at least 20 characters).');
  }

  r.employerResponse = responseText.trim();
  if (evidenceAttachment) r.evidenceUrl = evidenceAttachment.trim();
  r.employerRespondedAt = new Date().toISOString();
  r.caseStatus = 'Under Review';
  r.updatedAt = new Date().toISOString();

  if (!d.auditLogs) d.auditLogs = [];
  d.auditLogs.unshift({
    id: newId('log_'),
    actorId: employerId,
    actionType: 'employer_response_submitted',
    entityType: 'accessibility_report',
    entityId: reportId,
    metadata: { caseNumber: r.caseNumber },
    createdAt: new Date().toISOString(),
  });

  return r;
}

export function submitAccessibilityEvidence(d, employerId, evidence) {
  if (!evidence.facilityType?.trim()) throw new Error('Choose an accommodation category.');
  if (!evidence.label?.trim()) throw new Error('Enter a specific facility title.');
  if ((evidence.description || '').trim().length < 20) throw new Error('Describe your accessibility facility in detail (min 20 chars).');

  if (!d.evidence) d.evidence = [];

  const item = {
    id: newId('ev_'),
    employerId,
    facilityType: evidence.facilityType.trim(),
    label: evidence.label.trim(),
    description: evidence.description.trim(),
    evidenceType: evidence.evidenceType || 'Policy Document',
    documentUrl: evidence.documentUrl?.trim() || '',
    status: evidence.documentUrl?.trim() ? 'Pending Review' : 'Self-Reported',
    verifiedBy: null,
    verifiedAt: null,
    notes: evidence.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  d.evidence.push(item);
  return item;
}

export function reviewAccessibilityEvidence(d, evidenceId, adminId, approve, notes = '') {
  const ev = (d.evidence || []).find((x) => x.id === evidenceId);
  if (!ev) throw new Error('Evidence item not found.');

  ev.status = approve ? 'Evidence Verified' : 'Self-Reported';
  ev.verifiedBy = approve ? adminId : null;
  ev.verifiedAt = approve ? new Date().toISOString() : null;
  ev.notes = notes.trim();
  ev.updatedAt = new Date().toISOString();

  if (!d.auditLogs) d.auditLogs = [];
  d.auditLogs.unshift({
    id: newId('log_'),
    actorId: adminId,
    actionType: approve ? 'evidence_verified' : 'evidence_rejected',
    entityType: 'accessibility_evidence',
    entityId: evidenceId,
    metadata: { facilityType: ev.facilityType, status: ev.status, notes },
    createdAt: new Date().toISOString(),
  });

  return ev;
}

export function manageResume(d, seekerId, action, payload = {}) {
  if (!d.resumes) d.resumes = [];

  if (action === 'upload') {
    const isPrimary = d.resumes.filter((r) => r.seekerId === seekerId).length === 0;
    const item = {
      id: payload.id || newId('res_'),
      seekerId,
      fileName: payload.fileName || 'resume.pdf',
      fileSize: payload.fileSize || '250 KB',
      storagePath: payload.storagePath || `resumes/${seekerId}/${payload.fileName}`,
      isPrimary,
      uploadedAt: new Date().toISOString(),
    };
    d.resumes.push(item);
    return item;
  }

  if (action === 'set_primary') {
    d.resumes.forEach((r) => {
      if (r.seekerId === seekerId) {
        r.isPrimary = r.id === payload.resumeId;
      }
    });
    return true;
  }

  if (action === 'delete') {
    d.resumes = d.resumes.filter((r) => !(r.id === payload.resumeId && r.seekerId === seekerId));
    return true;
  }
}

export function withdrawApplication(d, appId, seekerId) {
  const a = d.applications.find((x) => x.id === appId && x.seekerId === seekerId);
  if (!a) throw new Error('Application not found.');
  if (['Hired', 'Rejected'].includes(a.status)) {
    throw new Error('Completed applications cannot be withdrawn.');
  }
  a.status = 'Withdrawn';
  a.withdrawnAt = new Date().toISOString();
  return a;
}

