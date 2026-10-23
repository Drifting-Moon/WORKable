import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  Briefcase,
  Users,
  CheckCircle2,
  FileCheck2,
  Clock,
  ArrowRight,
  Trash2,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../store.jsx';
import {
  Badge,
  Btn,
  Card,
  Confirm,
  Empty,
  Field,
  Modal,
  Title,
  VerifyBadge,
  fmtDate,
  inp,
  statusTone,
  cx,
} from '../ui.jsx';
import {
  ARRANGEMENTS,
  STATUSES,
  TYPES,
  deleteJob,
  employerStatus,
  saveJob,
  setJobActive,
  setStatus,
  submitVerification,
  validateJob,
} from '../services/db';
import { getSignedResumeUrl } from '../services/supabase';

const useMine = () => {
  const { db, user } = useApp();
  const jobs = (db.jobs || []).filter((j) => j.employerId === user?.id);
  const apps = (db.applications || []).filter(
    (a) => jobs.some((j) => j.id === a.jobId) || (a.jobs && a.jobs.employer_id === user?.id)
  );
  return { db, user, jobs, apps };
};

export function EmpHome() {
  const { db, user, jobs, apps } = useMine();
  const { deleteAccount } = useApp();
  const [confirmDeleteAcc, setConfirmDeleteAcc] = useState(false);
  const st = employerStatus(db, user?.id);

  const StatTile = ({ n, l, desc }) => (
    <Card className="flex flex-col justify-between p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{l}</p>
        <p className="mt-2 font-display text-4xl font-bold text-ink">{n}</p>
      </div>
      {desc && <p className="mt-2 text-xs text-muted">{desc}</p>}
    </Card>
  );

  return (
    <div className="space-y-8">
      <Title sub={`Employer workspace for ${user?.company || 'your organization'}. Manage listings and review applicant profiles.`}>
        Employer Control Center
      </Title>

      {/* Metric Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile n={jobs.length} l="Total Openings" desc="Positions listed under your organization." />
        <StatTile n={jobs.filter((j) => j.active).length} l="Active Listings" desc="Currently accepting candidate applications." />
        <StatTile n={apps.length} l="Total Candidates" desc="All received candidate submissions." />
        <StatTile
          n={apps.filter((a) => a.status === 'Applied').length}
          l="Awaiting Review"
          desc="Applications ready for review."
        />
      </div>

      {/* Verification Status Banner */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6 border-brand/20 bg-gradient-to-r from-white via-soft/50 to-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold text-ink">Accessibility Verification</h2>
            <VerifyBadge status={st} />
          </div>
          <p className="text-xs sm:text-sm text-muted max-w-xl">
            Verified employers gain trust badges on all listings by submitting independent facility audits or accessibility documentation.
          </p>
        </div>
        <Btn v="ghost" as={Link} to="/employer/verification" className="shrink-0">
          Manage audit dossier →
        </Btn>
      </Card>

      {/* Action Shortcut Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Btn as={Link} to="/employer/jobs/new" className="!px-5 !py-2.5">
          <Plus size={16} aria-hidden="true" />
          <span>Publish new opening</span>
        </Btn>
        <Btn v="ghost" as={Link} to="/employer/jobs" className="!px-5 !py-2.5">
          <span>Manage listings ({jobs.length})</span>
        </Btn>
        <Btn v="ghost" as={Link} to="/employer/applicants" className="!px-5 !py-2.5">
          <span>Candidate pipeline ({apps.length})</span>
        </Btn>
      </div>

      {/* Danger Zone: Employer Account Deletion */}
      <Card className="p-6 border-bad/30 bg-badbg/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-bold text-bad flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>Employer Account Actions</span>
          </h3>
          <p className="text-xs text-muted mt-1">
            Permanently delete your employer account. All your organization's job listings, applicant submissions, and evidence will be removed.
          </p>
        </div>
        <Btn
          type="button"
          v="danger"
          onClick={() => setConfirmDeleteAcc(true)}
          className="!px-4 !py-2 text-xs shrink-0"
        >
          <Trash2 size={14} className="mr-1" />
          Delete Employer Account
        </Btn>
      </Card>

      <Confirm
        open={confirmDeleteAcc}
        onClose={() => setConfirmDeleteAcc(false)}
        title="Permanently delete your employer account?"
        text="This cannot be undone. All positions, candidate application records, and facility evidence for your company will be permanently deleted."
        yes="Delete Account"
        onYes={async () => {
          setConfirmDeleteAcc(false);
          await deleteAccount();
        }}
      />
    </div>
  );
}

export function EmpJobs() {
  const { user, act, notify, deleteJobListing } = useApp();
  const { db, jobs } = useMine();
  const [del, setDel] = useState(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Organization Job Listings</h1>
          <p className="text-sm text-muted mt-1">Review, edit, activate, or archive your published positions.</p>
        </div>
        <Btn as={Link} to="/employer/jobs/new">
          <Plus size={16} aria-hidden="true" />
          <span>Post new job</span>
        </Btn>
      </div>

      {jobs.length ? (
        <div className="space-y-4">
          {jobs.map((j) => (
            <Card key={j.id} className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-display text-xl font-bold text-ink">{j.title}</h2>
                  <Badge tone={j.active ? 'ok' : 'warn'}>{j.active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted">
                  {j.location} · {j.arrangement} · {(db.applications || []).filter((a) => a.jobId === j.id).length}{' '}
                  applications received
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(j.tags || []).map((tid) => {
                    const t = (db.tags || []).find((x) => x.id === tid);
                    return (
                      <Badge key={tid} tone="info" className="text-[11px] py-0.5">
                        {t?.label || tid}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Btn
                  v="ghost"
                  className="!px-3 !py-1.5 text-xs min-h-9"
                  onClick={() => {
                    act((d) => setJobActive(d, j.id, user.id, !j.active));
                    notify(j.active ? 'Listing deactivated.' : 'Listing activated.');
                  }}
                >
                  {j.active ? 'Deactivate' : 'Activate'}
                </Btn>
                <Btn
                  v="ghost"
                  as={Link}
                  to={`/employer/jobs/${j.id}/edit`}
                  aria-label={`Edit ${j.title}`}
                  className="!px-3 !py-1.5 text-xs min-h-9"
                >
                  <Edit3 size={14} aria-hidden="true" />
                  <span>Edit</span>
                </Btn>
                <Btn
                  v="danger"
                  onClick={() => setDel(j)}
                  aria-label={`Delete ${j.title}`}
                  className="!px-3 !py-1.5 text-xs min-h-9"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  <span>Delete</span>
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty
          title="No job listings created yet"
          text="Publish your first job and declare the accommodations you provide."
        >
          <Btn as={Link} to="/employer/jobs/new">
            Publish first opening
          </Btn>
        </Empty>
      )}

      <Confirm
        open={!!del}
        onClose={() => setDel(null)}
        title="Delete this listing permanently?"
        text={`“${del?.title}” and all related applicant submissions will be permanently removed.`}
        yes="Delete listing"
        onYes={async () => {
          const toDelete = del;
          setDel(null);
          await deleteJobListing(toDelete.id);
        }}
      />
    </div>
  );
}

export function JobForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { db, user, act, notify, saveRealJob } = useApp();
  const old = id && (db.jobs || []).find((j) => j.id === id && j.employerId === user?.id);

  const [f, setF] = useState(
    old
      ? {
          ...old,
          skills: (Array.isArray(old.skills) ? old.skills : []).join(', '),
          tags: Array.isArray(old.tags) ? old.tags : [],
        }
      : {
          title: '',
          desc: '',
          location: '',
          type: 'Full-time',
          arrangement: 'Hybrid',
          salaryMin: '',
          salaryMax: '',
          skills: '',
          tags: [],
          qual: '',
        }
  );
  const [errs, setErrs] = useState({});

  if (id && !old) {
    return (
      <Empty title="Listing not found" text="You can only edit listings published by your organization.">
        <Btn as={Link} to="/employer/jobs">
          Return to listings
        </Btn>
      </Empty>
    );
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const job = () => ({
    ...f,
    skills: f.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  });

  const submit = async (e) => {
    e.preventDefault();
    const v = validateJob(job());
    setErrs(v);
    if (Object.keys(v).length) return notify('Please resolve the highlighted fields.', true);
    const ok = await saveRealJob(job());
    if (ok) {
      notify(old ? 'Job listing updated.' : 'Job listing published to live database.');
      nav('/employer/jobs');
    }
  };

  const sel = (k, label, opts) => (
    <Field label={label} error={errs[k]}>
      {(p) => (
        <select {...p} className={inp} value={f[k]} onChange={set(k)}>
          {opts.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
    </Field>
  );

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-3xl space-y-6">
      <Title sub="Specify transparent role expectations and confirmed workplace accommodations.">
        {old ? 'Edit Job Listing' : 'Publish New Opportunity'}
      </Title>

      <Card className="space-y-4 p-6 md:p-8">
        <h2 className="font-display text-xl font-bold text-ink">Core Specifications</h2>
        <Field label="Job Title" error={errs.title}>
          {(p) => <input {...p} className={inp} value={f.title} onChange={set('title')} placeholder="e.g. Senior Frontend Engineer" />}
        </Field>
        <Field label="Role Description & Mandate" error={errs.desc}>
          {(p) => (
            <textarea
              {...p}
              rows={4}
              className={inp}
              value={f.desc}
              onChange={set('desc')}
              placeholder="Outline the responsibilities and scope of the role..."
            />
          )}
        </Field>
        <Field label="Required Skills" hint="Comma-separated list (e.g. React, TypeScript, WCAG)" error={errs.skills}>
          {(p) => <input {...p} className={inp} value={f.skills} onChange={set('skills')} />}
        </Field>
        <Field label="Minimum Qualifications & Experience">
          {(p) => <input {...p} className={inp} value={f.qual} onChange={set('qual')} placeholder="e.g. 2+ years of web development" />}
        </Field>
        <Field label="Work Location" error={errs.location}>
          {(p) => <input {...p} className={inp} value={f.location} onChange={set('location')} placeholder="City or 'Remote'" />}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-line/60">
          {sel('type', 'Employment Type', TYPES)}
          {sel('arrangement', 'Work Arrangement', ARRANGEMENTS)}
          <Field label="Minimum Salary (LPA)" error={errs.salaryMin}>
            {(p) => <input {...p} type="number" step="0.5" className={inp} value={f.salaryMin} onChange={set('salaryMin')} placeholder="e.g. 8.0" />}
          </Field>
          <Field label="Maximum Salary (LPA)" error={errs.salaryMax}>
            {(p) => <input {...p} type="number" step="0.5" className={inp} value={f.salaryMax} onChange={set('salaryMax')} placeholder="e.g. 12.0" />}
          </Field>
        </div>
      </Card>

      <Card className="p-6 md:p-8 space-y-3">
        <fieldset>
          <legend className="font-display text-xl font-bold text-ink mb-1">
            Confirmed Accommodations Offered
          </legend>
          <p className="text-xs text-muted mb-4 leading-relaxed">
            Select only accommodations your workplace genuinely supports. Candidates rely on accurate, specific disclosures.
          </p>
          <div className="space-y-2">
            {(db.tags || []).map((t) => (
              <label key={t.id} className="flex items-center gap-2.5 text-xs sm:text-sm text-ink cursor-pointer py-1">
                <input
                  type="checkbox"
                  className="size-4 accent-brand"
                  checked={(f.tags || []).includes(t.id)}
                  onChange={() =>
                    setF({
                      ...f,
                      tags: (f.tags || []).includes(t.id) ? (f.tags || []).filter((x) => x !== t.id) : [...(f.tags || []), t.id],
                    })
                  }
                />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <div className="flex gap-3">
        <Btn type="submit" className="!px-6 !py-2.5">
          {old ? 'Save changes' : 'Publish job'}
        </Btn>
        <Btn v="ghost" as={Link} to="/employer/jobs" className="!px-5 !py-2.5">
          Cancel
        </Btn>
      </div>
    </form>
  );
}

export function Applicants() {
  const { user, notify, updateAppStatus } = useApp();
  const { db, apps } = useMine();
  const [flt, setFlt] = useState('');
  const [view, setView] = useState(null);

  const list = apps.filter((a) => !flt || a.status === flt);

  return (
    <div className="space-y-6">
      <Title sub="Review incoming candidate submissions without seeing private diagnostic disclosures.">
        Candidate Review Pipeline
      </Title>

      <div className="w-64">
        <Field label="Filter by Status">
          {(p) => (
            <select {...p} className={cx(inp, 'text-xs min-h-9 py-1.5')} value={flt} onChange={(e) => setFlt(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      {list.length ? (
        <div className="space-y-4">
          {list.map((a) => {
            const c = db.users.find((u) => u.id === a.seekerId) || {
              id: a.seekerId,
              name: a.profiles?.name || 'Applicant',
              email: a.profiles?.email || '',
              role: 'seeker',
              profile: {
                skills: a.profiles?.skills || [],
                phone: a.profiles?.phone || '',
                summary: a.profiles?.summary || '',
                education: a.profiles?.education || '',
                experience: a.profiles?.experience || '',
                locations: a.profiles?.locations || [],
                arrangements: a.profiles?.arrangements || [],
                accessPrefs: a.profiles?.access_prefs || [],
                resumeName: a.resume || a.profiles?.resume_name || '',
              },
            };
            const j = db.jobs.find((x) => x.id === a.jobId) || {
              title: a.jobs?.title || 'Job Listing',
            };
            return (
              <Card key={a.id} className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display text-lg font-bold text-ink">{c.name}</h2>
                    <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                  </div>
                  <p className="text-xs text-muted">
                    Applied for <strong className="text-ink">{j.title}</strong> · {fmtDate(a.appliedAt)}
                  </p>
                  <p className="text-xs text-ink/80 pt-1">
                    Skills: {c.profile?.skills?.join(', ') || 'None declared'}
                  </p>
                </div>

                <div className="flex flex-wrap items-end gap-2.5">
                  <Btn v="ghost" onClick={() => setView({ a, c })} className="!px-3 !py-1 text-xs min-h-9">
                    View full profile
                  </Btn>
                  <div className="w-36">
                    <Field label="Update status">
                      {(p) => (
                        <select
                          {...p}
                          className={cx(inp, 'text-xs min-h-9 py-1')}
                          value={a.status}
                          onChange={(e) => updateAppStatus(a.id, e.target.value)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty title="No applications in this category" text="Candidate submissions will appear here as they apply." />
      )}

      {/* Candidate Profile Dossier Modal */}
      <Modal open={!!view} onClose={() => setView(null)} title={view?.c.name}>
        {view && (
          <div className="space-y-4 text-xs sm:text-sm text-ink leading-relaxed">
            <div>
              <p className="font-bold text-brand uppercase tracking-wider text-[11px]">Professional Summary</p>
              <p className="text-muted mt-0.5">{view.c?.profile?.summary || 'No summary provided.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line/60">
              <div>
                <p className="font-bold text-muted text-[11px] uppercase">Declared Skills</p>
                <p className="font-semibold text-ink mt-0.5">{(Array.isArray(view.c?.profile?.skills) ? view.c.profile.skills : []).join(', ') || '—'}</p>
              </div>
              <div>
                <p className="font-bold text-muted text-[11px] uppercase">Education</p>
                <p className="text-ink mt-0.5">{view.c?.profile?.education || '—'}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-line/60">
              <p className="font-bold text-muted text-[11px] uppercase">Experience</p>
              <p className="text-ink mt-0.5">{view.c?.profile?.experience || '—'}</p>
            </div>
            <div className="pt-2 border-t border-line/60">
              <p className="font-bold text-muted text-[11px] uppercase">Personal Cover Note</p>
              <p className="text-ink mt-0.5 whitespace-pre-wrap">{view.a.cover || 'None submitted.'}</p>
            </div>
            <div className="pt-2 border-t border-line/60">
              <p className="font-bold text-muted text-[11px] uppercase">Candidate Resume / CV</p>
              <div className="flex items-center justify-between gap-3 mt-1.5 p-3 rounded-xl bg-soft/70 border border-line">
                <span className="font-semibold text-xs text-ink truncate">{view.a.resume || 'None on file'}</span>
                {view.a.resume && (
                  <Btn
                    v="ghost"
                    className="!px-3 !py-1 text-xs shrink-0 text-brand"
                    onClick={async () => {
                      const resumeDoc = (db.resumes || []).find(
                        (r) => r.seekerId === view.a.seekerId && r.fileName === view.a.resume
                      );
                      if (resumeDoc?.storagePath) {
                        const url = await getSignedResumeUrl(resumeDoc.storagePath);
                        if (url) return window.open(url, '_blank');
                      }
                      notify('Opening document reference: ' + view.a.resume);
                    }}
                  >
                    View / Download PDF
                  </Btn>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function Verification() {
  const { db, user, act, notify } = useApp();
  const [f, setF] = useState({ description: '', evidence: '' });
  const [errs, setErrs] = useState({});

  const mine = (db.verifications || []).filter((v) => v.employerId === user?.id);
  const st = employerStatus(db, user?.id);
  const last = mine[mine.length - 1];

  const submit = (e) => {
    e.preventDefault();
    try {
      act((d) => submitVerification(d, user.id, f), true);
      notify('Verification audit submitted for administrative review.');
      setF({ description: '', evidence: '' });
      setErrs({});
    } catch (x) {
      setErrs(x.fields || {});
      notify(x.message, true);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Title sub="Submit facility declarations and supporting documentation for review. Evidence status is separate from company identity verification.">
        Accessibility Verification
      </Title>

      {/* Current Status Card */}
      <Card className="p-6 md:p-8 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-ink">Audit Status</h2>
          <VerifyBadge status={st} />
        </div>

        {last?.status === 'Rejected' && (
          <p className="rounded-lg bg-badbg border border-bad/20 p-3 text-xs font-bold text-bad">
            Administrative feedback: {last.reason}
          </p>
        )}

        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          An administrator evaluates your physical facility audits, remote accommodations policies, and interpreter arrangements. Verified status grants trusted badges across all your active listings.
        </p>
      </Card>

      {/* Submission Form (when not pending or verified) */}
      {st !== 'Pending Review' && st !== 'Verified' && (
        <form onSubmit={submit} noValidate>
          <Card className="space-y-4 p-6 md:p-8">
            <h2 className="font-display text-xl font-bold text-ink">Submit Evidence for Review</h2>
            <Field label="Describe your accessibility accommodations & facilities" error={errs.description}>
              {(p) => (
                <textarea
                  {...p}
                  rows={4}
                  className={inp}
                  value={f.description}
                  onChange={(e) => setF({ ...f, description: e.target.value })}
                  placeholder="Detail step-free access, assistive tech licenses, ergonomic setups, or interpreter partnerships..."
                />
              )}
            </Field>
            <Field
              label="Evidence Reference / Audit Document"
              hint="e.g. Doc name: 'Access_Audit_2026.pdf' or 'Remote_Accommodation_Charter.pdf'"
              error={errs.evidence}
            >
              {(p) => <input {...p} className={inp} value={f.evidence} onChange={(e) => setF({ ...f, evidence: e.target.value })} />}
            </Field>
            <Btn type="submit" className="!px-6 !py-2.5">
              Submit for Administrative Audit
            </Btn>
          </Card>
        </form>
      )}

      {/* History Timeline */}
      {mine.length > 0 && (
        <Card className="p-6 md:p-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-ink">Submission History</h2>
          <ul className="space-y-3">
            {mine.map((v) => (
              <li key={v.id} className="border-t border-line/60 pt-3 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <VerifyBadge status={v.status} />
                  <span className="text-muted">{fmtDate(v.submittedAt)}</span>
                </div>
                <p className="text-ink font-medium mt-1">{v.description}</p>
                <p className="text-muted text-[11px]">Evidence reference: {v.evidence}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export function EmpEvidence() {
  const { db, user, addEvidence, deleteEvidenceDeclaration } = useApp();
  const [open, setOpen] = useState(false);
  const [delEvidence, setDelEvidence] = useState(null);
  const [f, setF] = useState({
    facilityType: 'wheel',
    label: '',
    description: '',
    evidenceType: 'Access Audit Certificate',
    documentUrl: '',
    notes: '',
  });

  const evidenceList = (db.evidence || []).filter((e) => e.employerId === user?.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!f.label.trim() || f.description.trim().length < 20) return;
    addEvidence(f);
    setF({
      facilityType: 'wheel',
      label: '',
      description: '',
      evidenceType: 'Access Audit Certificate',
      documentUrl: '',
      notes: '',
    });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Title sub="Declare specific accessibility facilities with independent audit certificates, architectural documentation, or policy evidence.">
            Accessibility Facility Evidence
          </Title>
        </div>
        <Btn onClick={() => setOpen(true)} className="!px-4 !py-2 text-sm shrink-0">
          <Plus size={16} />
          <span>Declare Facility with Evidence</span>
        </Btn>
      </div>

      <div className="rounded-xl border border-line bg-soft/60 p-4 text-xs text-muted leading-relaxed">
        <strong>Trust Rule:</strong> Company identity review and accessibility evidence review are separate. A reviewed document supports a specific claim; it does not automatically certify every site or job.
      </div>

      {evidenceList.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {evidenceList.map((ev) => (
            <Card key={ev.id} className="p-5 flex flex-col justify-between border-line/90">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-ink">{ev.label}</h3>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      tone={
                        ev.status === 'Evidence Verified'
                          ? 'ok'
                          : ev.status === 'Pending Review'
                          ? 'warn'
                          : 'info'
                      }
                    >
                      {ev.status}
                    </Badge>
                    <Btn
                      v="ghost"
                      onClick={() => setDelEvidence(ev)}
                      aria-label={`Delete ${ev.label}`}
                      className="!px-2 !py-1 text-xs text-muted hover:text-bad"
                    >
                      <Trash2 size={13} />
                    </Btn>
                  </div>
                </div>
                <p className="text-xs text-muted leading-relaxed">{ev.description}</p>
                <div className="text-[11px] font-mono bg-paper p-2 rounded border border-line/60 text-ink/80 space-y-0.5">
                  <div><strong>Evidence Type:</strong> {ev.evidenceType}</div>
                  <div><strong>Document:</strong> {ev.documentUrl || 'Self-Reported (No document attached)'}</div>
                  {ev.notes && <div><strong>Review Note:</strong> {ev.notes}</div>}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 text-[11px] text-muted flex items-center justify-between">
                <span>Category: {ev.facilityType}</span>
                <span>{fmtDate(ev.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty
          title="No facility evidence declarations"
          text="Provide supporting evidence for specific accessibility declarations. In this version, the form stores a document reference; actual evidence-file upload still needs integration."
        >
          <Btn onClick={() => setOpen(true)}>
            <Plus size={16} />
            <span>Submit Your First Facility Evidence</span>
          </Btn>
        </Empty>
      )}

      {/* Facility Declaration Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Declare Accessibility Facility & Evidence">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Accommodation Category">
            {(p) => (
              <select
                {...p}
                className={inp}
                value={f.facilityType}
                onChange={(e) => setF({ ...f, facilityType: e.target.value })}
              >
                {db.tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Facility Title" hint="e.g. 'ADA Step-free Ramp & Braille Lift' or 'NVDA / JAWS Workstation Licenses'">
            {(p) => (
              <input
                {...p}
                type="text"
                required
                className={inp}
                placeholder="Specific facility name..."
                value={f.label}
                onChange={(e) => setF({ ...f, label: e.target.value })}
              />
            )}
          </Field>

          <Field label="Detailed Facility Description" hint="Explain the physical or digital specifications (minimum 20 characters).">
            {(p) => (
              <textarea
                {...p}
                rows={3}
                required
                minLength={20}
                className={cx(inp, 'resize-y')}
                placeholder="Detailed specifications, measurements, software versions, or protocols..."
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
              />
            )}
          </Field>

          <Field label="Evidence Documentation Type">
            {(p) => (
              <select
                {...p}
                className={inp}
                value={f.evidenceType}
                onChange={(e) => setF({ ...f, evidenceType: e.target.value })}
              >
                <option value="Access Audit Certificate">Access Audit Certificate (Architect / Certified Assessor)</option>
                <option value="Policy Document">Official Organization Policy / HR Charter</option>
                <option value="Architectural Photo">Architectural Photos with scale</option>
                <option value="Employee Attestation">Employee Attestation / SLA Agreement</option>
              </select>
            )}
          </Field>

          <Field label="Document File Name / Reference" hint="e.g. 'Audit_Certificate_2026.pdf'">
            {(p) => (
              <input
                {...p}
                type="text"
                className={inp}
                placeholder="Document reference or file name..."
                value={f.documentUrl}
                onChange={(e) => setF({ ...f, documentUrl: e.target.value })}
              />
            )}
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Btn v="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn type="submit" disabled={!f.label.trim() || f.description.trim().length < 20}>
              Submit for Verification
            </Btn>
          </div>
        </form>
      </Modal>

      <Confirm
        open={!!delEvidence}
        onClose={() => setDelEvidence(null)}
        title="Delete facility evidence declaration?"
        text={`“${delEvidence?.label}” will be removed from your organization's accessibility evidence declarations.`}
        yes="Delete evidence"
        onYes={async () => {
          const toDel = delEvidence;
          setDelEvidence(null);
          await deleteEvidenceDeclaration(toDel.id);
        }}
      />
    </div>
  );
}

export function EmpDisputes() {
  const { db, user, respondToReport } = useApp();
  const [respondingId, setRespondingId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [evidenceAttachment, setEvidenceAttachment] = useState('');

  const reports = (db.reports || []).filter((r) => r.employerId === user?.id);

  const handleRespond = (e) => {
    e.preventDefault();
    if (!respondingId || responseText.trim().length < 20) return;
    respondToReport(respondingId, responseText, evidenceAttachment);
    setRespondingId(null);
    setResponseText('');
    setEvidenceAttachment('');
  };

  return (
    <div className="space-y-6">
      <Title sub="Review and respond to candidate reports regarding disputed accommodation claims. Formal responses are audited by case officers.">
        Accessibility Dispute Inquiries & Responses
      </Title>

      {reports.length ? (
        <div className="space-y-4">
          {reports.map((r) => {
            const j = (db.jobs || []).find((x) => x.id === r.jobId);
            const needsResponse = r.caseStatus === 'Employer Response Requested';

            return (
              <Card key={r.id} className="p-6 space-y-4 border-line/90">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand bg-soft px-2 py-0.5 rounded">
                        {r.caseNumber}
                      </span>
                      <h3 className="font-display text-lg font-bold text-ink">
                        Dispute: {r.disputedAccommodation}
                      </h3>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Category: <strong>{r.claimType}</strong> · Incident Date: {r.incidentDate} · Logged {fmtDate(r.createdAt)}
                    </p>
                    {j && (
                      <p className="text-xs text-muted">
                        Listing in question: <Link to={`/jobs/${j.id}`} className="text-brand hover:underline">{j.title}</Link>
                      </p>
                    )}
                  </div>

                  <Badge
                    tone={
                      r.caseStatus === 'Employer Response Requested'
                        ? 'bad'
                        : r.caseStatus === 'Resolved'
                        ? 'ok'
                        : 'warn'
                    }
                  >
                    {r.caseStatus}
                  </Badge>
                </div>

                <div className="bg-soft/70 p-3.5 rounded-lg text-xs space-y-1.5 border border-line">
                  <div className="font-bold text-ink">Report Narrative:</div>
                  <p className="text-muted leading-relaxed">{r.description}</p>
                  {r.evidenceUrl && (
                    <div className="text-[11px] text-brand pt-1 font-mono">
                      Candidate evidence provided: {r.evidenceUrl}
                    </div>
                  )}
                </div>

                {r.adminNotes && (
                  <div className="text-xs text-ink/80 bg-paper p-3 rounded border border-line space-y-0.5">
                    <strong>Case Officer Instructions:</strong>
                    <p className="text-muted">{r.adminNotes}</p>
                  </div>
                )}

                {r.employerResponse ? (
                  <div className="bg-okbg/30 p-3.5 rounded-lg text-xs space-y-1 border border-ok/20">
                    <div className="font-bold text-ok flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Your Formal Response Submitted ({fmtDate(r.employerRespondedAt)})
                    </div>
                    <p className="text-ink leading-relaxed">{r.employerResponse}</p>
                  </div>
                ) : needsResponse ? (
                  <div className="pt-2 flex justify-end">
                    <Btn onClick={() => { setRespondingId(r.id); setResponseText(''); }}>
                      Submit Formal Rebuttal / Corrective Plan
                    </Btn>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty
          title="No dispute inquiries"
          text="Your organization has zero active accessibility fraud reports or dispute inquiries."
        />
      )}

      {/* Response Modal */}
      <Modal open={!!respondingId} onClose={() => setRespondingId(null)} title="Submit Formal Employer Response">
        <form onSubmit={handleRespond} className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            Please submit an objective response addressing the reported accommodation barrier. You may provide corrective plans or attach documentary evidence.
          </p>

          <Field label="Formal Organization Response" hint="Explain the physical layout, remediation taken, or factual context (minimum 20 characters).">
            {(p) => (
              <textarea
                {...p}
                rows={4}
                required
                minLength={20}
                className={cx(inp, 'resize-y')}
                placeholder="Detail corrective actions or factual clarification..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
            )}
          </Field>

          <Field label="Evidence Reference (Optional)" hint="e.g. 'Corrective_Ramp_Invoice.pdf' or 'Interpreter_Contract.pdf'">
            {(p) => (
              <input
                {...p}
                type="text"
                className={inp}
                placeholder="Document reference name..."
                value={evidenceAttachment}
                onChange={(e) => setEvidenceAttachment(e.target.value)}
              />
            )}
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Btn v="ghost" onClick={() => setRespondingId(null)}>Cancel</Btn>
            <Btn type="submit" disabled={responseText.trim().length < 20}>Submit to Review Team</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
