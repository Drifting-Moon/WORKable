import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Search,
  MapPin,
  SlidersHorizontal,
  X,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Layers,
  Sparkles,
  Upload,
  Trash2,
  Star,
  Flag,
  ShieldAlert,
  FileDown,
  Clock,
  Check,
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
  JobCard,
  Modal,
  Title,
  VerifyBadge,
  AccountabilityBadge,
  ReportDisputeModal,
  fmtDate,
  fmtSalary,
  inp,
  statusTone,
  cx,
} from '../ui.jsx';
import {
  ARRANGEMENTS,
  STATUSES,
  TYPES,
  applyToJob,
  companyOf,
  employerStatus,
  filterJobs,
  matchJob,
  getAccessibilityTrustBadge,
} from '../services/db';
import { submitApplicationSupabase, getSignedResumeUrl } from '../services/supabase';

export function JobsPage() {
  const { db, user } = useApp();
  const [sp, setSp] = useSearchParams();

  const f = {
    q: sp.get('q') || '',
    location: sp.get('location') || '',
    type: sp.get('type') || '',
    arr: sp.get('arr') || '',
    min: sp.get('min') || '',
    tags: sp.getAll('tag'),
    verified: sp.get('verified') === '1',
    sort: sp.get('sort') || 'new',
  };

  const skills = user?.role === 'seeker' ? (user?.profile?.skills || []) : [];

  const set = (k, v) => {
    const n = new URLSearchParams(sp);
    n.delete(k);
    [].concat(v).filter(Boolean).forEach((x) => n.append(k, x));
    setSp(n, { replace: true });
  };

  const removeFilter = (k, v) => {
    if (k === 'tag') {
      set(
        'tag',
        f.tags.filter((t) => t !== v)
      );
    } else {
      const n = new URLSearchParams(sp);
      n.delete(k);
      setSp(n, { replace: true });
    }
  };

  const results = filterJobs(db, f, skills);

  const sel = (k, label, opts) => (
    <Field label={label}>
      {(p) => (
        <select {...p} className={inp} value={f[k]} onChange={(e) => set(k, e.target.value)}>
          <option value="">Any</option>
          {opts.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
    </Field>
  );

  const hasActiveFilters =
    f.q || f.location || f.type || f.arr || f.min || f.tags.length > 0 || f.verified;

  return (
    <div className="space-y-6">
      <Title sub="Browse jobs with employer-declared accommodations, clear evidence status, and skill compatibility insights.">
        Opportunity Directory
      </Title>

      <div className="grid gap-8 lg:grid-cols-[19rem_1fr] items-start">
        {/* Refined Editorial Filter Sidebar */}
        <aside>
          <form
            role="search"
            aria-label="Job filters"
            className="rounded-xl border border-line bg-white/95 p-5 shadow-[0_1px_3px_rgba(24,34,30,0.03)] space-y-5"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-brand" aria-hidden="true" />
                <h2 className="font-display text-base font-bold text-ink">Refine Directory</h2>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => setSp({}, { replace: true })}
                  className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                >
                  Reset all
                </button>
              )}
            </div>

            <Field label="Keyword Search" hint="Title, skill, or employer">
              {(p) => (
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input
                    {...p}
                    type="search"
                    className={cx(inp, 'pl-9')}
                    value={f.q}
                    onChange={(e) => set('q', e.target.value)}
                    placeholder="e.g. React, Analyst"
                  />
                </div>
              )}
            </Field>

            <Field label="Location">
              {(p) => (
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input
                    {...p}
                    className={cx(inp, 'pl-9')}
                    value={f.location}
                    onChange={(e) => set('location', e.target.value)}
                    placeholder="City or Remote"
                  />
                </div>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-2">
              {sel('type', 'Employment', TYPES)}
              {sel('arr', 'Arrangement', ARRANGEMENTS)}
            </div>

            <Field label="Min. Salary (LPA)">
              {(p) => (
                <input
                  {...p}
                  type="number"
                  min="0"
                  step="0.5"
                  className={inp}
                  value={f.min}
                  onChange={(e) => set('min', e.target.value)}
                  placeholder="e.g. 6.0"
                />
              )}
            </Field>

            {/* Accessibility Accommodations Checklist */}
            <fieldset className="border-t border-line/60 pt-4">
              <legend className="mb-2.5 font-display text-sm font-bold text-ink">
                Accommodations Required
              </legend>
              <div className="space-y-2">
                {db.tags.map((t) => {
                  const checked = f.tags.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={cx(
                        'flex items-start gap-2.5 rounded-lg p-2 text-xs font-medium cursor-pointer transition-colors',
                        checked ? 'bg-soft text-brand font-semibold' : 'text-ink/80 hover:bg-paper'
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 accent-brand shrink-0"
                        checked={checked}
                        onChange={(e) =>
                          set(
                            'tag',
                            e.target.checked ? [...f.tags, t.id] : f.tags.filter((x) => x !== t.id)
                          )
                        }
                      />
                      <span>{t.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Verified Employers Only */}
            <div className="border-t border-line/60 pt-4">
              <label className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-ok/20 bg-okbg/40 p-2.5 text-xs font-bold text-ok transition-all hover:bg-okbg/60">
                <input
                  type="checkbox"
                  className="size-4 accent-ok shrink-0"
                  checked={f.verified}
                  onChange={(e) => set('verified', e.target.checked ? '1' : '')}
                />
                <ShieldCheck size={16} aria-hidden="true" />
                <span>Verified employers only</span>
              </label>
            </div>

            {hasActiveFilters && (
              <Btn v="ghost" className="w-full text-xs !py-2" onClick={() => setSp({}, { replace: true })}>
                Clear all filters
              </Btn>
            )}
          </form>
        </aside>

        {/* Results Main Section */}
        <section aria-label="Job listings" className="space-y-5">
          {/* Header Bar with Sort and Active Filter Chips */}
          <div className="rounded-xl border border-line bg-white/90 p-4 shadow-[0_1px_3px_rgba(24,34,30,0.03)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p role="status" className="font-display text-lg font-bold text-ink">
                  {results.length} {results.length === 1 ? 'position' : 'positions'} found
                </p>
                <p className="text-xs text-muted">
                  Showing active listings with disclosed accommodations
                </p>
              </div>

              <div className="w-48 sm:w-56">
                <Field label="Sort listings">
                  {(p) => (
                    <select
                      {...p}
                      className={cx(inp, 'text-xs py-1.5 min-h-9')}
                      value={f.sort}
                      onChange={(e) => set('sort', e.target.value)}
                    >
                      <option value="new">Newest posted</option>
                      <option value="relevance">Skill relevance (matching)</option>
                    </select>
                  )}
                </Field>
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-line/50 text-xs">
                <span className="text-muted font-medium mr-1">Active filters:</span>
                {f.q && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-0.5 font-medium text-ink">
                    Search: “{f.q}”
                    <button
                      onClick={() => removeFilter('q')}
                      aria-label="Remove search filter"
                      className="hover:text-bad cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {f.location && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-0.5 font-medium text-ink">
                    Location: {f.location}
                    <button
                      onClick={() => removeFilter('location')}
                      aria-label="Remove location filter"
                      className="hover:text-bad cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {f.type && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-0.5 font-medium text-ink">
                    Type: {f.type}
                    <button
                      onClick={() => removeFilter('type')}
                      aria-label="Remove type filter"
                      className="hover:text-bad cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {f.arr && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-0.5 font-medium text-ink">
                    Arrangement: {f.arr}
                    <button
                      onClick={() => removeFilter('arr')}
                      aria-label="Remove arrangement filter"
                      className="hover:text-bad cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {f.min && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-0.5 font-medium text-ink">
                    Min ₹{f.min} LPA
                    <button
                      onClick={() => removeFilter('min')}
                      aria-label="Remove minimum salary filter"
                      className="hover:text-bad cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {f.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-okbg px-2.5 py-0.5 font-bold text-ok">
                    Verified only
                    <button
                      onClick={() => removeFilter('verified')}
                      aria-label="Remove verified filter"
                      className="hover:text-bad cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {f.tags.map((tid) => {
                  const t = db.tags.find((x) => x.id === tid);
                  return (
                    <span
                      key={tid}
                      className="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-0.5 font-medium text-ink"
                    >
                      {t?.label || tid}
                      <button
                        onClick={() => removeFilter('tag', tid)}
                        aria-label={`Remove ${t?.label} filter`}
                        className="hover:text-bad cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Jobs Listing Grid */}
          {results.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {results.map((j) => (
                <JobCard key={j.id} j={j} />
              ))}
            </div>
          ) : (
            <Empty
              title="No opportunities match your criteria"
              text="Try widening your filters or removing salary/location constraints."
            >
              <Btn onClick={() => setSp({}, { replace: true })}>Clear all search filters</Btn>
            </Empty>
          )}
        </section>
      </div>
    </div>
  );
}

export function JobDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { db, user, act, notify, toggleSave, isSupabase } = useApp();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [cover, setCover] = useState('');
  const [selectedResume, setSelectedResume] = useState('');

  const j = db.jobs.find((x) => x.id === id);
  if (!j) {
    return (
      <Empty title="Listing not found" text="This opportunity may have expired or been removed.">
        <Btn as={Link} to="/jobs">
          Return to directory
        </Btn>
      </Empty>
    );
  }

  const seeker = user?.role === 'seeker';
  const applied = seeker && (db.applications || []).find((a) => a.seekerId === user?.id && a.jobId === j.id);
  const saved = seeker && (db.saved || []).some((s) => s.seekerId === user?.id && s.jobId === j.id);
  const m = seeker ? matchJob(user?.profile?.skills || [], j) : null;
  const tags = (j.tags || []).map((t) => (db.tags || []).find((x) => x.id === t)?.label).filter(Boolean);
  const verified = employerStatus(db, j.employerId) === 'Verified';
  const trust = getAccessibilityTrustBadge(db, j.id);
  const verifiedEvidence = (db.evidence || []).filter(
    (ev) => ev.employerId === j.employerId && ev.status === 'Evidence Verified'
  );
  const myResumes = (db.resumes || []).filter((r) => r.seekerId === user?.id);

  const start = () => {
    if (!user) return nav('/login');
    if (!seeker) return notify('Only registered Job Seekers can submit applications.', true);
    setStep(1);
    const prim = myResumes.find((r) => r.isPrimary)?.fileName || myResumes[0]?.fileName || user?.profile?.resumeName || '';
    setSelectedResume(prim);
    setOpen(true);
  };

  const submit = async () => {
    const liveAccount = isSupabase && user?.id && !user.email?.toLowerCase().endsWith('@workable.demo');
    let liveRow = null;
    if (liveAccount) {
      try {
        liveRow = await submitApplicationSupabase({
          seeker_id: user.id,
          job_id: j.id,
          cover: cover.trim(),
          resume: selectedResume || user?.profile?.resumeName || '',
          status: 'Applied',
        });
      } catch (err) {
        notify(`Application was not submitted to the live database: ${err.message}`, true);
        return;
      }
    }
    const a = act((d) => {
      const created = applyToJob(d, user.id, j.id, { cover, resume: selectedResume || user?.profile?.resumeName || '' });
      if (liveRow?.id) {
        created.id = liveRow.id;
        if (liveRow.applied_at) created.appliedAt = liveRow.applied_at;
      }
      return created;
    });
    if (a) {
      notify('Application successfully submitted!');
      setOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Btn v="ghost" onClick={() => nav(-1)} className="!px-3 !py-1 text-xs text-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Back to listings</span>
      </Btn>

      {/* Top Editorial Masthead Card */}
      <Card className="border-line/90 p-6 md:p-8 bg-gradient-to-b from-white to-soft/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              {j.title}
            </h1>
            <p className="text-base text-muted flex items-center gap-2">
              <Briefcase size={16} className="text-brand/80" aria-hidden="true" />
              <span className="font-medium text-ink">{companyOf(db, j.employerId)}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin size={15} aria-hidden="true" />
                {j.location}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AccountabilityBadge trust={trust} />
            {verified && <VerifyBadge status="Verified" />}
          </div>
        </div>

        {/* Quick details pill strip */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-line/60">
          <Badge tone="accent">{fmtSalary(j)}</Badge>
          <Badge tone="info">{j.type}</Badge>
          <Badge tone="info">{j.arrangement}</Badge>
          {!j.active && <Badge tone="bad">Applications Closed</Badge>}
          {j.status === 'Suspended_Fraud_Hold' && (
            <Badge tone="bad" className="animate-pulse">
              Listing on Administrative Freeze (Investigation)
            </Badge>
          )}
        </div>

        {/* Action Button Row */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line/60">
          <div className="flex flex-wrap items-center gap-3">
            {applied ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-okbg px-4 py-2 text-sm font-bold text-ok border border-ok/20">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>You applied · Status: {applied.status}</span>
              </div>
            ) : (
              <Btn onClick={start} disabled={!j.active} className="!px-6 !py-2.5 text-base">
                Apply for this position
              </Btn>
            )}

            <Btn
              v="ghost"
              aria-pressed={!!saved}
              onClick={() => toggleSave(j.id)}
              className="!px-4 !py-2.5 text-sm"
            >
              {saved ? (
                <BookmarkCheck size={18} className="text-ok" aria-hidden="true" />
              ) : (
                <Bookmark size={18} aria-hidden="true" />
              )}
              <span>{saved ? 'Saved in my list' : 'Save opportunity'}</span>
            </Btn>
          </div>

          <Btn
            v="ghost"
            onClick={() => {
              if (!user) return nav('/login');
              setReportOpen(true);
            }}
            className="!px-3 !py-2 text-xs text-muted hover:text-bad border-dashed"
            aria-label="Report misleading accessibility claim"
          >
            <Flag size={14} className="text-bad" />
            <span>Report misleading claim</span>
          </Btn>
        </div>
      </Card>

      {/* Main 2-Column Editorial Grid */}
      <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* About the Role */}
          <Card className="p-6 md:p-7 space-y-4">
            <h2 className="font-display text-xl font-bold text-ink">Role Overview</h2>
            <p className="text-sm sm:text-base text-muted leading-relaxed">{j.desc}</p>

            <h3 className="font-display text-lg font-bold text-ink pt-2 border-t border-line/40">
              Key Responsibilities
            </h3>
            <ul className="space-y-2 text-sm text-muted">
              {j.resp.map((r) => (
                <li key={r} className="flex items-start gap-2.5">
                  <span className="size-1.5 rounded-full bg-accent mt-2 shrink-0" aria-hidden="true" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>

            <h3 className="font-display text-lg font-bold text-ink pt-2 border-t border-line/40">
              Qualifications & Background
            </h3>
            <p className="text-sm text-muted leading-relaxed">{j.qual}</p>

            <h3 className="font-display text-lg font-bold text-ink pt-2 border-t border-line/40">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {j.skills.map((s) => (
                <Badge key={s} tone="info" className="text-xs py-1 px-3">
                  {s}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Accommodations Dossier */}
          <Card className="p-6 md:p-7 space-y-4 border-brand/20 bg-gradient-to-b from-white to-soft/60">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-ink">
                Accommodations Provided
              </h2>
              <AccountabilityBadge trust={trust} />
            </div>

            <p className="text-xs text-muted">
              The employer declares the following physical, technical, and scheduling accommodations for this role:
            </p>

            <ul className="space-y-2.5 text-sm">
              {tags.length ? (
                tags.map((t) => (
                  <li key={t} className="flex items-center gap-2.5 font-medium text-ink">
                    <CheckCircle2 size={16} className="text-ok shrink-0" aria-hidden="true" />
                    <span>{t}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted italic">No specific accommodations listed.</li>
              )}
            </ul>

            {/* Evidence items if verified */}
            {verifiedEvidence.length > 0 && (
              <div className="mt-4 pt-3 border-t border-line/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ok flex items-center gap-1.5 mb-2">
                  <ShieldCheck size={14} /> Independently Documented Facilities ({verifiedEvidence.length})
                </h3>
                <div className="space-y-2">
                  {verifiedEvidence.map((ev) => (
                    <div key={ev.id} className="text-xs p-2.5 rounded-lg border border-ok/20 bg-okbg/40">
                      <div className="font-bold text-ink">{ev.label}</div>
                      <p className="text-muted text-[11px] mt-0.5">{ev.description}</p>
                      <div className="text-[10px] text-ok mt-1 font-mono">
                        Verification Type: {ev.evidenceType} · {ev.documentUrl}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-lg bg-soft p-3.5 text-xs text-muted leading-relaxed border border-line">
              <p>
                <strong>Privacy guarantee:</strong> Your personal accommodation needs and medical disclosures are never requested or shared during application matching.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Sidebar: Skill Match and Employer Summary */}
        <div className="space-y-6">
          {/* Skill Match Analysis */}
          {m && (
            <Card className="p-6 space-y-3 border-line/90">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-ink">Skill Match Analysis</h2>
                <Badge tone={m.score >= 60 ? 'ok' : 'info'}>{m.score}% match</Badge>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-soft overflow-hidden">
                <div
                  className="h-full bg-brand transition-all duration-300"
                  style={{ width: `${m.score}%` }}
                />
              </div>

              <div className="text-xs space-y-2 pt-2 border-t border-line/40">
                <p>
                  <strong className="text-ink">Matching your profile:</strong>{' '}
                  <span className="text-ok font-semibold">{m.matched.join(', ') || 'None matched'}</span>
                </p>
                <p>
                  <strong className="text-ink">Missing from profile:</strong>{' '}
                  <span className="text-muted">{m.missing.join(', ') || 'None — complete match!'}</span>
                </p>
              </div>

              <p className="text-[11px] text-muted italic pt-1 leading-normal">
                Score formula: matched skills ÷ required skills. Used for guidance only.
              </p>
            </Card>
          )}

          {/* Employer Dossier Card */}
          <Card className="p-6 space-y-3">
            <h3 className="font-display text-lg font-bold text-ink">Employer Dossier</h3>
            <p className="text-sm font-semibold text-brand">{companyOf(db, j.employerId)}</p>
            <p className="text-xs text-muted leading-relaxed">
              {trust.tier === 'Evidence Verified'
                ? 'This organization has verified facility documentation and identity confirmation on record.'
                : verified
                ? 'Employer identity confirmed. Facility accommodations are self-reported by hiring managers.'
                : 'Self-reported accommodations. Direct confirmation during interview is encouraged.'}
            </p>
          </Card>
        </div>
      </div>

      {/* Application Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={step === 1 ? `Apply to ${j.title}` : 'Confirm Application Submission'}
      >
        {step === 1 ? (
          <div className="space-y-4">
            {myResumes.length > 0 ? (
              <Field label="Choose Resume / CV Document" hint="Select from your uploaded private CVs.">
                {(p) => (
                  <select
                    {...p}
                    className={inp}
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                  >
                    {myResumes.map((r) => (
                      <option key={r.id} value={r.fileName}>
                        {r.fileName} ({r.fileSize}) {r.isPrimary ? '— Primary' : ''}
                      </option>
                    ))}
                    <option value="">Use Candidate Profile Skills Only</option>
                  </select>
                )}
              </Field>
            ) : (
              <div className="rounded-lg bg-soft p-3.5 text-xs text-muted space-y-1 border border-line">
                <p>
                  Resume on file:{' '}
                  <strong className="text-ink">
                    {user?.profile.resumeName || 'None — profile skills will be shared'}
                  </strong>
                </p>
                <Link to="/seeker/resumes" className="text-xs font-bold text-brand hover:underline block pt-1">
                  + Upload a dedicated CV file in Resume Manager →
                </Link>
              </div>
            )}

            <Field label="Personal Note / Cover Note (Optional)" hint="Add context on your interest or experience.">
              {(p) => (
                <textarea
                  {...p}
                  rows={4}
                  className={inp}
                  value={cover}
                  onChange={(e) => setCover(e.target.value)}
                  placeholder="Share a brief introduction with the hiring team..."
                />
              )}
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Btn v="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Btn>
              <Btn onClick={() => setStep(2)}>Review submission</Btn>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-sm leading-relaxed text-ink">
            <p>
              You are applying for <strong className="text-brand">{j.title}</strong> at{' '}
              <strong>{companyOf(db, j.employerId)}</strong>.
            </p>
            <div className="p-3 bg-soft rounded-lg text-xs space-y-1 border border-line">
              <div><strong>Attached Resume:</strong> {selectedResume || 'Candidate Profile Skills'}</div>
              {cover && <div><strong>Cover Note:</strong> "{cover.slice(0, 100)}{cover.length > 100 ? '...' : ''}"</div>}
            </div>
            <p className="text-xs text-muted">
              The hiring team will review your contact info, background, skills, and cover note. Your accessibility preferences are not requested as medical diagnoses and are not included in the application.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-line/60">
              <Btn v="ghost" onClick={() => setStep(1)}>
                Back
              </Btn>
              <Btn onClick={submit}>Confirm & Submit Application</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Accessibility Dispute Reporting Modal */}
      <ReportDisputeModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        job={j}
        employerName={companyOf(db, j.employerId)}
        availableTags={tags}
      />
    </div>
  );
}

const completion = (p = {}) => {
  const skillsLen = Array.isArray(p?.skills) ? p.skills.length : 0;
  const locsLen = Array.isArray(p?.locations) ? p.locations.length : 0;
  return Math.round(
    ([p?.phone, p?.summary, skillsLen, p?.education, p?.experience, locsLen, p?.resumeName].filter(
      Boolean
    ).length /
      7) *
      100
  );
};

export function SeekerHome() {
  const { db, user } = useApp();
  const mine = (db.applications || []).filter((a) => a.seekerId === user?.id);
  const pc = completion(user?.profile);
  const userSkills = user?.profile?.skills || [];
  const rec = filterJobs(db, { sort: 'relevance' }, userSkills)
    .filter((j) => !mine.some((a) => a.jobId === j.id))
    .slice(0, 3);
  const recent = filterJobs(db, {}).slice(0, 3);

  return (
    <div className="space-y-10">
      <Title sub="Overview of your matched positions, active applications, and profile strength.">
        Candidate Dashboard · Welcome back, {user.name.split(' ')[0]}
      </Title>

      {/* 3 Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Profile Strength</h2>
            <p className="mt-2 font-display text-4xl font-bold text-ink">{pc}%</p>
            <div
              className="my-3 h-2.5 rounded-full bg-soft overflow-hidden"
              role="progressbar"
              aria-valuenow={pc}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completion"
            >
              <div className="h-full bg-brand rounded-full transition-all duration-300" style={{ width: pc + '%' }} />
            </div>
          </div>
          <Link className="text-xs font-bold text-brand hover:underline" to="/seeker/profile">
            Edit profile details →
          </Link>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Saved Opportunities</h2>
            <p className="mt-2 font-display text-4xl font-bold text-ink">
              {db.saved.filter((s) => s.seekerId === user.id).length}
            </p>
            <p className="text-xs text-muted mt-2">Saved roles ready for review and application.</p>
          </div>
          <Link className="text-xs font-bold text-brand hover:underline" to="/seeker/saved">
            View saved listings →
          </Link>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Active Applications</h2>
            <p className="mt-2 font-display text-4xl font-bold text-ink">{mine.length}</p>
            <p className="text-xs text-muted mt-2">
              {STATUSES.map((s) => `${s}: ${mine.filter((a) => a.status === s).length}`).join(' · ')}
            </p>
          </div>
          <Link className="text-xs font-bold text-brand hover:underline" to="/seeker/applications">
            Track application pipeline →
          </Link>
        </Card>
      </div>

      {/* Recommended Jobs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-line/60 pb-2">
          <h2 className="font-display text-2xl font-bold text-ink">Recommended for Your Skillset</h2>
          <Link to="/jobs" className="text-xs font-bold text-brand hover:underline">
            Search all →
          </Link>
        </div>
        {rec.length ? (
          <div className="grid gap-5 md:grid-cols-3">
            {rec.map((j) => (
              <JobCard key={j.id} j={j} />
            ))}
          </div>
        ) : (
          <Empty title="No recommendations available" text="Add skills to your profile to generate matches.">
            <Btn as={Link} to="/seeker/profile">
              Update skills
            </Btn>
          </Empty>
        )}
      </section>

      {/* Recently Posted */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-line/60 pb-2">
          <h2 className="font-display text-2xl font-bold text-ink">Recently Published Openings</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {recent.map((j) => (
            <JobCard key={j.id} j={j} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function Saved() {
  const { db, user } = useApp();
  const jobs = (db.saved || [])
    .filter((s) => s.seekerId === user?.id)
    .map((s) => (db.jobs || []).find((j) => j.id === s.jobId))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <Title sub="Opportunities you bookmarked for later review.">Saved Opportunities</Title>
      {jobs.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {jobs.map((j) => (
            <JobCard key={j.id} j={j} />
          ))}
        </div>
      ) : (
        <Empty title="No saved listings yet" text="Click the Save button on any job card to keep it here.">
          <Btn as={Link} to="/jobs">
            Explore listings
          </Btn>
        </Empty>
      )}
    </div>
  );
}

export function Applications() {
  const { db, user, withdrawApp } = useApp();
  const [withdrawingId, setWithdrawingId] = useState(null);
  const apps = (db.applications || [])
    .filter((a) => a.seekerId === user?.id)
    .sort((a, b) => (b.appliedAt || '').localeCompare(a.appliedAt || ''));
  const steps = ['Applied', 'Under Review', 'Interview', 'Hired'];

  return (
    <div className="space-y-6">
      <Title sub="Follow your status across each hiring milestone in real time.">My Applications</Title>
      {apps.length ? (
        <div className="space-y-4">
          {apps.map((a) => {
            const j = db.jobs.find((x) => x.id === a.jobId);
            const idx = steps.indexOf(a.status);
            const canWithdraw = !['Hired', 'Rejected', 'Withdrawn'].includes(a.status);

            return (
              <Card key={a.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-bold text-ink">
                      <Link to={`/jobs/${a.jobId}`} className="hover:underline">
                        {j?.title || 'Position removed'}
                      </Link>
                    </h2>
                    <p className="text-sm text-muted">
                      {j && companyOf(db, j.employerId)} · Applied {fmtDate(a.appliedAt)}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <FileText size={13} className="text-brand" />
                      <span>Attached CV: <strong>{a.resume || 'Candidate Profile Skills'}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                    {canWithdraw && (
                      <Btn
                        v="ghost"
                        onClick={() => setWithdrawingId(a.id)}
                        className="!px-2.5 !py-1 text-xs text-muted hover:text-bad border-dashed"
                      >
                        Withdraw
                      </Btn>
                    )}
                  </div>
                </div>

                {a.status === 'Withdrawn' ? (
                  <p className="mt-4 rounded-lg bg-soft border border-line p-3 text-xs text-muted italic">
                    You have withdrawn this application.
                  </p>
                ) : a.status === 'Rejected' ? (
                  <p className="mt-4 rounded-lg bg-badbg border border-bad/20 p-3 text-xs font-bold text-bad">
                    This application was not selected for further review.
                  </p>
                ) : (
                  <ol className="mt-5 grid grid-cols-4 gap-2 text-xs" aria-label="Application progress">
                    {steps.map((s, i) => (
                      <li
                        key={s}
                        aria-current={i === idx ? 'step' : undefined}
                        className={cx(
                          'rounded-lg border p-2 text-center transition-all',
                          i <= idx
                            ? 'border-ok bg-okbg font-bold text-ok'
                            : 'border-line text-muted bg-paper/50'
                        )}
                      >
                        {i <= idx ? '✓ ' : ''}
                        {s}
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty title="No applications submitted yet" text="When you apply to an opening, track it here.">
          <Btn as={Link} to="/jobs">
            Explore opportunities
          </Btn>
        </Empty>
      )}

      <Confirm
        open={!!withdrawingId}
        onClose={() => setWithdrawingId(null)}
        onYes={() => withdrawingId && withdrawApp(withdrawingId)}
        title="Withdraw Application"
        text="Are you sure you want to withdraw this application? The employer will be notified that you are no longer in consideration."
        yes="Withdraw"
      />
    </div>
  );
}

export function Resumes() {
  const { db, user, addResume, setPrimaryResume, removeResume, notify } = useApp();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const resumes = (db.resumes || []).filter((r) => r.seekerId === user.id);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileName.trim()) return;
    await addResume({ fileName: fileName.trim(), fileSize: fileSize.trim() || '245 KB', file });
    setFile(null);
    setFileName('');
    setFileSize('');
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Title sub="Manage CV documents and choose which one to attach to an application. Live private storage requires Supabase setup; demo CV records are not real files.">
            My CVs & Documents
          </Title>
        </div>
        <Btn onClick={() => setOpen(true)} className="!px-4 !py-2 text-sm shrink-0">
          <Upload size={16} />
          <span>Upload New CV</span>
        </Btn>
      </div>

      {resumes.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {resumes.map((r) => (
            <Card key={r.id} className="p-5 flex flex-col justify-between border-line/90 hover:border-brand transition-all">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-10 rounded-lg bg-soft flex items-center justify-center text-brand">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-ink break-all">{r.fileName}</h3>
                      <p className="text-xs text-muted">{r.fileSize} · Uploaded {fmtDate(r.uploadedAt)}</p>
                    </div>
                  </div>
                  {r.isPrimary && (
                    <Badge tone="ok">
                      <Star size={11} className="fill-ok text-ok" />
                      <span>Primary</span>
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-line/60 flex items-center justify-between gap-2">
                {!r.isPrimary ? (
                  <button
                    onClick={() => setPrimaryResume(r.id)}
                    className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                  >
                    Set as default
                  </button>
                ) : (
                  <span className="text-xs text-muted">Default for applications</span>
                )}

                <div className="flex items-center gap-2">
                  <Btn
                    v="ghost"
                    onClick={async () => {
                      if (!r.storagePath) {
                        return notify('No storage path found for this document.', true);
                      }
                      notify('Generating secure access link from Supabase Storage...');
                      const url = await getSignedResumeUrl(r.storagePath);
                      if (url) {
                        window.open(url, '_blank', 'noopener,noreferrer');
                      } else {
                        notify('This demo resume is not in your Supabase bucket. Upload a real PDF using "Upload New CV" to view live storage files.', true);
                      }
                    }}
                    className="!px-2.5 !py-1 text-xs text-brand"
                  >
                    View File
                  </Btn>
                  <Btn
                    v="ghost"
                    onClick={() => setConfirmDelete(r.id)}
                    aria-label={`Delete ${r.fileName}`}
                    className="!px-2.5 !py-1 text-xs text-muted hover:text-bad"
                  >
                    <Trash2 size={14} />
                  </Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty title="No resumes uploaded" text="Upload your CV in PDF or DOC format so you can attach it to job applications.">
          <Btn onClick={() => setOpen(true)}>
            <Upload size={16} />
            <span>Upload Your First Resume</span>
          </Btn>
        </Empty>
      )}

      {/* Upload Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Upload Resume / CV Document">
        <form onSubmit={handleUpload} className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            Upload a real CV file when live storage is configured. In demo mode, filename references are for testing only and are not stored as private documents.
          </p>

          <Field label="Select File from Device">
            {(p) => (
              <input
                {...p}
                type="file"
                accept=".pdf,.doc,.docx"
                className={inp}
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) {
                    setFile(f);
                    setFileName(f.name);
                    setFileSize(Math.round(f.size / 1024) + ' KB');
                  }
                }}
              />
            )}
          </Field>

          <Field label="Document Title / File Name">
            {(p) => (
              <input
                {...p}
                type="text"
                required
                className={inp}
                placeholder="e.g. aarav_developer_cv_2026.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            )}
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Btn v="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn type="submit" disabled={!fileName.trim()}>Upload Document</Btn>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Confirm
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onYes={() => confirmDelete && removeResume(confirmDelete)}
        title="Delete Resume"
        text="Are you sure you want to delete this resume? Existing applications submitted with this file will retain their historical record."
        yes="Delete"
      />
    </div>
  );
}

export function MyReports() {
  const { db, user } = useApp();
  const myReports = (db.reports || []).filter((r) => r.reporterId === user.id);

  return (
    <div className="space-y-6">
      <Title sub="Track accessibility disputes and misleading claim investigations submitted under your candidate account.">
        My Accessibility Inquiries & Disputes
      </Title>

      {myReports.length ? (
        <div className="space-y-4">
          {myReports.map((r) => {
            const j = db.jobs.find((x) => x.id === r.jobId);
            return (
              <Card key={r.id} className="p-6 space-y-4 border-line/90">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand bg-soft px-2 py-0.5 rounded">
                        {r.caseNumber}
                      </span>
                      <h3 className="font-display text-lg font-bold text-ink">
                        {r.disputedAccommodation}
                      </h3>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Organization: <strong>{companyOf(db, r.employerId)}</strong> · Incident Date: {r.incidentDate} · Filed {fmtDate(r.createdAt)}
                    </p>
                    {j && (
                      <p className="text-xs text-muted">
                        Listing: <Link to={`/jobs/${j.id}`} className="text-brand hover:underline">{j.title}</Link>
                      </p>
                    )}
                  </div>

                  <Badge
                    tone={
                      r.caseStatus === 'Resolved'
                        ? 'ok'
                        : r.caseStatus === 'Under Review' || r.caseStatus === 'Employer Response Requested'
                        ? 'warn'
                        : 'info'
                    }
                  >
                    {r.caseStatus}
                  </Badge>
                </div>

                <div className="bg-soft/70 p-3.5 rounded-lg text-xs space-y-1.5 border border-line">
                  <div className="font-bold text-ink">Your Narrative:</div>
                  <p className="text-muted leading-relaxed">{r.description}</p>
                  {r.evidenceUrl && (
                    <div className="text-[11px] text-brand pt-1 font-mono">
                      Evidence attached: {r.evidenceUrl}
                    </div>
                  )}
                </div>

                {r.employerResponse && (
                  <div className="bg-amber-500/10 p-3.5 rounded-lg text-xs space-y-1 border border-warn/25">
                    <div className="font-bold text-warn flex items-center gap-1.5">
                      <Clock size={14} /> Formal Employer Response ({fmtDate(r.employerRespondedAt)})
                    </div>
                    <p className="text-ink leading-relaxed">{r.employerResponse}</p>
                  </div>
                )}

                <div className="text-xs text-muted pt-2 border-t border-line/50 flex flex-wrap items-center justify-between gap-2">
                  <span><strong>Case Officer Status:</strong> {r.adminNotes || 'Under administrative intake review.'}</span>
                  <span className="italic">{r.isAnonymous ? 'Confidential filing (identity protected)' : 'Non-anonymous filing'}</span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty
          title="No disputes or reports on record"
          text="When you encounter an employer whose advertised accommodations are not honored or inaccessible, report it directly from any job listing."
        >
          <Btn as={Link} to="/jobs">
            Browse Opportunities
          </Btn>
        </Empty>
      )}
    </div>
  );
}

export function Profile() {
  const { db, user, notify, saveProfile, deleteAccount } = useApp();
  const [confirmDeleteAcc, setConfirmDeleteAcc] = useState(false);
  const [confirmResetProf, setConfirmResetProf] = useState(false);
  const p = user?.profile || {};
  const [f, setF] = useState({
    name: user?.name || '',
    phone: p.phone || '',
    summary: p.summary || '',
    education: p.education || '',
    experience: p.experience || '',
    resumeName: p.resumeName || '',
    arrangements: Array.isArray(p.arrangements) ? p.arrangements : [],
    accessPrefs: Array.isArray(p.accessPrefs)
      ? p.accessPrefs
      : (Array.isArray(p.access_prefs) ? p.access_prefs : []),
    skills: (Array.isArray(p.skills) ? p.skills : []).join(', '),
    locations: (Array.isArray(p.locations) ? p.locations : []).join(', '),
  });

  const list = (s) =>
    (s || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

  const tog = (k, v) =>
    setF({ ...f, [k]: (f[k] || []).includes(v) ? f[k].filter((x) => x !== v) : [...(f[k] || []), v] });

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const handleResetProfile = async () => {
    const blank = {
      name: f.name.trim(),
      phone: '',
      summary: '',
      education: '',
      experience: '',
      arrangements: [],
      accessPrefs: [],
      resumeName: '',
      skills: [],
      locations: [],
    };
    await saveProfile(blank);
    setF({
      name: f.name.trim(),
      phone: '',
      summary: '',
      education: '',
      experience: '',
      resumeName: '',
      arrangements: [],
      accessPrefs: [],
      skills: '',
      locations: '',
    });
    setConfirmResetProf(false);
    notify('Profile details cleared.');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return notify('Full name cannot be blank.', true);
    await saveProfile({
      name: f.name.trim(),
      phone: f.phone || '',
      summary: f.summary || '',
      education: f.education || '',
      experience: f.experience || '',
      arrangements: f.arrangements || [],
      accessPrefs: f.accessPrefs || [],
      resumeName: f.resumeName || '',
      skills: list(f.skills),
      locations: list(f.locations),
    });
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <Title sub="Candidate profile details used for skill-based matching. Accommodations are private.">
        Candidate Profile
      </Title>

      <Card className="space-y-4 p-6 md:p-8">
        <h2 className="font-display text-xl font-bold text-ink">Personal & Professional Info</h2>
        <Field label="Full name">{(x) => <input {...x} className={inp} value={f.name} onChange={set('name')} />}</Field>
        <Field label="Phone number">{(x) => <input {...x} className={inp} value={f.phone} onChange={set('phone')} />}</Field>
        <Field label="Professional Summary">
          {(x) => <textarea {...x} rows={3} className={inp} value={f.summary} onChange={set('summary')} />}
        </Field>
        <Field label="Skills" hint="Comma-separated (e.g. React, SQL, WCAG). Used for match percentage.">
          {(x) => <input {...x} className={inp} value={f.skills} onChange={set('skills')} />}
        </Field>
        <Field label="Education">{(x) => <input {...x} className={inp} value={f.education} onChange={set('education')} />}</Field>
        <Field label="Experience">
          {(x) => <textarea {...x} rows={2} className={inp} value={f.experience} onChange={set('experience')} />}
        </Field>
        <Field label="Preferred Locations" hint="Comma-separated (e.g. Jaipur, Remote).">
          {(x) => <input {...x} className={inp} value={f.locations} onChange={set('locations')} />}
        </Field>

        <fieldset className="border-t border-line/60 pt-4">
          <legend className="font-semibold text-sm text-ink mb-2">Preferred Work Arrangements</legend>
          <div className="flex flex-wrap gap-4">
            {ARRANGEMENTS.map((a) => (
              <label key={a} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                <input
                  type="checkbox"
                  className="size-4 accent-brand"
                  checked={(f.arrangements || []).includes(a)}
                  onChange={() => tog('arrangements', a)}
                />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card className="p-6 md:p-8 space-y-3">
        <fieldset>
          <legend className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <span>Confidential Accommodation Preferences</span>
            <Badge tone="warn">Optional & Private</Badge>
          </legend>
          <p className="text-xs text-muted leading-relaxed my-2">
            You never need to disclose medical conditions or diagnoses. These preferences are private to your account and never visible to prospective employers.
          </p>
          <div className="space-y-2 pt-2">
            {(db?.tags || []).map((t) => (
              <label key={t.id} className="flex items-center gap-2.5 text-xs sm:text-sm text-ink cursor-pointer py-1">
                <input
                  type="checkbox"
                  className="size-4 accent-brand"
                  checked={(f.accessPrefs || []).includes(t.id)}
                  onChange={() => tog('accessPrefs', t.id)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card className="p-6 md:p-8">
        <Field
          label="Resume Document"
          hint={`Current: ${f.resumeName || 'None on file'}. Mock filename stored for demo evaluation.`}
        >
          {(x) => (
            <input
              {...x}
              type="file"
              accept=".pdf,.doc,.docx"
              className={inp}
              onChange={(e) => e.target.files[0] && setF({ ...f, resumeName: e.target.files[0].name })}
            />
          )}
        </Field>
      </Card>

      <div className="flex justify-end">
        <Btn type="submit" className="!px-6 !py-2.5">
          Save Candidate Profile
        </Btn>
      </div>

      {/* Danger Zone: Reset Profile or Delete Candidate Account */}
      <Card className="p-6 md:p-8 border-bad/40 bg-badbg/10 space-y-4">
        <div className="flex items-center gap-2 text-bad">
          <AlertTriangle size={18} />
          <h3 className="font-display text-lg font-bold">Profile & Account Actions</h3>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Clear your candidate profile information if you want to start fresh, or permanently delete your account and all associated documents and applications.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Btn
            type="button"
            v="ghost"
            onClick={() => setConfirmResetProf(true)}
            className="!px-4 !py-2 text-xs border border-line text-muted hover:text-ink"
          >
            Clear Profile Information
          </Btn>
          <Btn
            type="button"
            v="danger"
            onClick={() => setConfirmDeleteAcc(true)}
            className="!px-4 !py-2 text-xs"
          >
            <Trash2 size={14} className="mr-1" />
            Delete Candidate Account
          </Btn>
        </div>
      </Card>

      <Confirm
        open={confirmResetProf}
        onClose={() => setConfirmResetProf(false)}
        title="Clear all profile information?"
        text="This will reset your summary, skills, education, experience, and accommodations to blank. Your account will remain active."
        yes="Clear Profile"
        onYes={handleResetProfile}
      />

      <Confirm
        open={confirmDeleteAcc}
        onClose={() => setConfirmDeleteAcc(false)}
        title="Permanently delete your candidate account?"
        text="This cannot be undone. All your applications, saved jobs, uploaded CVs, and profile data will be permanently deleted."
        yes="Delete Account"
        onYes={async () => {
          setConfirmDeleteAcc(false);
          await deleteAccount();
        }}
      />
    </form>
  );
}
