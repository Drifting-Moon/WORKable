import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  BadgeCheck,
  Clock,
  XCircle,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Flag,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';
import { useApp } from './store.jsx';
import { companyOf, isVerified, matchJob, getAccessibilityTrustBadge } from './services/db';

export const cx = (...a) => a.filter(Boolean).join(' ');

const V = {
  primary: 'bg-brand text-white hover:bg-brand-d active:translate-y-px shadow-xs',
  ghost: 'border border-line bg-white/95 text-ink hover:bg-soft hover:border-muted/30 active:translate-y-px',
  subtle: 'bg-soft text-ink hover:bg-line/40 active:translate-y-px',
  accent: 'bg-accent text-white hover:brightness-95 active:translate-y-px shadow-xs',
  danger: 'bg-bad text-white hover:opacity-90 active:translate-y-px',
  ok: 'bg-ok text-white hover:opacity-90 active:translate-y-px',
};

export function Btn({ v = 'primary', as: As = 'button', className, ...p }) {
  return (
    <As
      {...(As === 'button' ? { type: 'button' } : {})}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-sm sm:text-base tracking-tight transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        V[v],
        className
      )}
      {...p}
    />
  );
}

export const Card = ({ as: As = 'div', className, ...p }) => (
  <As
    className={cx(
      'rounded-xl border border-line bg-white/95 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-slate-300 transition-all duration-200',
      className
    )}
    {...p}
  />
);

const T = {
  ok: 'bg-okbg text-ok border border-ok/20',
  warn: 'bg-warnbg text-warn border border-warn/25',
  bad: 'bg-badbg text-bad border border-bad/20',
  info: 'bg-soft text-ink/80 border border-line/70',
  accent: 'bg-accent-soft text-accent border border-accent/25',
};

export const Badge = ({ tone = 'info', className, children }) => (
  <span
    className={cx(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors',
      T[tone],
      className
    )}
  >
    {children}
  </span>
);

export function VerifyBadge({ status }) {
  const m = {
    Verified: ['ok', ShieldCheck, 'Verified accessibility'],
    'Pending Review': ['warn', Clock, 'Pending review'],
    Rejected: ['bad', XCircle, 'Review rejected'],
    'Not Submitted': ['info', Clock, 'Not submitted'],
  }[status] || ['info', Clock, status];
  const I = m[1];
  return (
    <Badge tone={m[0]}>
      <I size={14} className="shrink-0" aria-hidden="true" />
      <span>{m[2]}</span>
    </Badge>
  );
}

export function AccountabilityBadge({ trust }) {
  if (!trust) return null;

  if (trust.tier === 'Under Investigation') {
    return (
      <Badge tone="bad" className="animate-pulse">
        <AlertTriangle size={13} className="shrink-0" aria-hidden="true" />
        <span>Under Investigation</span>
      </Badge>
    );
  }

  if (trust.tier === 'Evidence Verified') {
    return (
      <Badge tone="ok">
        <ShieldCheck size={13} className="shrink-0" aria-hidden="true" />
        <span>Evidence Verified ({trust.evidenceCount})</span>
      </Badge>
    );
  }

  if (trust.isIdVerified) {
    return (
      <Badge tone="warn">
        <BadgeCheck size={13} className="shrink-0" aria-hidden="true" />
        <span>Identity Verified · Self-Reported</span>
      </Badge>
    );
  }

  return (
    <Badge tone="info">
      <span>Self-Reported</span>
    </Badge>
  );
}

export const statusTone = (s) =>
  ({ Applied: 'info', 'Under Review': 'warn', Interview: 'warn', Hired: 'ok', Rejected: 'bad' }[s] || 'info');

export const inp =
  'w-full min-h-11 rounded-lg border border-line bg-white px-3.5 py-2 text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm sm:text-base';

// Field wires label + hint + error to the input for screen readers
export function Field({ label, error, hint, children }) {
  const id = useId();
  const p = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': [error && id + 'e', hint && id + 'h'].filter(Boolean).join(' ') || undefined,
  };
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-semibold text-sm text-ink">
        {label}
      </label>
      {hint && (
        <p id={id + 'h'} className="text-xs text-muted leading-relaxed">
          {hint}
        </p>
      )}
      {children(p)}
      {error && (
        <p id={id + 'e'} role="alert" className="text-xs font-bold text-bad">
          Error: {error}
        </p>
      )}
    </div>
  );
}

// Uses native dialog element
export function Modal({ open, onClose, title, children, side }) {
  const r = useRef();
  useEffect(() => {
    const d = r.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={r}
      onClose={onClose}
      onClick={(e) => e.target === r.current && onClose()}
      aria-labelledby="modal-title"
      className={cx(
        'p-0 backdrop:bg-ink/40 backdrop:backdrop-blur-xs',
        side
          ? 'ml-auto mr-0 my-0 h-full max-h-none w-[min(100vw,24rem)] bg-paper'
          : 'm-auto w-[min(92vw,36rem)] rounded-2xl border border-line bg-white shadow-xl'
      )}
    >
      {open && (
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
            <h2 id="modal-title" className="font-display text-2xl font-bold text-ink">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-muted hover:bg-soft hover:text-ink transition-colors cursor-pointer"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}

export function Confirm({ open, onClose, onYes, title, text, yes = 'Confirm' }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-muted leading-relaxed">{text}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Btn v="ghost" onClick={onClose}>
          Cancel
        </Btn>
        <Btn
          v="danger"
          onClick={() => {
            onYes();
            onClose();
          }}
        >
          {yes}
        </Btn>
      </div>
    </Modal>
  );
}

export const Empty = ({ title, text, children }) => (
  <Card className="py-12 text-center border-dashed">
    <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">{text}</p>
    {children && <div className="mt-5">{children}</div>}
  </Card>
);

export const Title = ({ children, sub }) => (
  <div className="mb-6 border-b border-line/60 pb-4">
    <h1 className="font-display text-3xl md:text-4xl font-bold text-ink tracking-tight">{children}</h1>
    {sub && <p className="mt-1.5 text-base text-muted max-w-2xl leading-relaxed">{sub}</p>}
  </div>
);

export const fmtSalary = (j) => `₹${j.salaryMin}–${j.salaryMax} LPA`;
export const fmtDate = (s) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export function JobCard({ j, featured = false }) {
  const { db, user, toggleSave } = useApp();
  const saved = user && db.saved.some((s) => s.seekerId === user.id && s.jobId === j.id);
  const m = user?.role === 'seeker' && user.profile.skills?.length ? matchJob(user.profile.skills, j) : null;
  const tags = j.tags.map((t) => db.tags.find((x) => x.id === t)?.label).filter(Boolean);
  const verified = isVerified(db, j);

  return (
    <Card
      as="article"
      className={cx(
        'group flex flex-col justify-between transition-all duration-200',
        featured && 'border-brand/30 bg-gradient-to-b from-white to-[#faf8f4]'
      )}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-display text-xl font-bold text-ink group-hover:text-brand transition-colors">
              <Link to={`/jobs/${j.id}`} className="hover:underline inline-flex items-center gap-1.5">
                {j.title}
                <ArrowUpRight
                  size={16}
                  className="opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-150 text-brand"
                  aria-hidden="true"
                />
              </Link>
            </h3>
            <p className="text-sm font-medium text-muted flex items-center gap-1.5">
              <Briefcase size={14} className="shrink-0 text-brand/70" aria-hidden="true" />
              <span>{companyOf(db, j.employerId)}</span>
            </p>
          </div>
          {m && (
            <Badge tone={m.score >= 60 ? 'ok' : 'info'} className="shrink-0">
              {m.score}% match
            </Badge>
          )}
        </div>

        {/* Details Row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-muted">
          <span className="flex items-center gap-1">
            <MapPin size={13} className="shrink-0 text-muted/80" aria-hidden="true" />
            {j.location}
          </span>
          <span className="inline-block size-1 rounded-full bg-line" aria-hidden="true" />
          <span className="font-semibold text-ink">{fmtSalary(j)}</span>
          <span className="inline-block size-1 rounded-full bg-line" aria-hidden="true" />
          <span>{j.arrangement}</span>
          <span className="inline-block size-1 rounded-full bg-line" aria-hidden="true" />
          <span>{j.type}</span>
        </div>

        {/* Accommodations section */}
        <div className="mt-4 pt-3 border-t border-line/40">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted/70 mb-2">
            Accommodations offered:
          </p>
          <ul className="flex flex-wrap gap-1.5" aria-label="Accessibility features">
            {tags.slice(0, 3).map((t) => (
              <li key={t}>
                <Badge tone="info" className="text-xs py-0.5">
                  {t}
                </Badge>
              </li>
            ))}
            {tags.length > 3 && (
              <li>
                <Badge tone="info" className="text-xs py-0.5 bg-soft/60">
                  +{tags.length - 3} more
                </Badge>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer Row */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">
        <div>
          <AccountabilityBadge trust={getAccessibilityTrustBadge(db, j.id)} />
        </div>
        <div className="flex items-center gap-2">
          <Btn
            v="ghost"
            onClick={() => toggleSave(j.id)}
            aria-pressed={!!saved}
            aria-label={`${saved ? 'Unsave' : 'Save'} ${j.title}`}
            className="!px-3 !py-1.5 text-xs min-h-9"
          >
            {saved ? (
              <BookmarkCheck size={15} className="text-ok" aria-hidden="true" />
            ) : (
              <Bookmark size={15} aria-hidden="true" />
            )}
            <span>{saved ? 'Saved' : 'Save'}</span>
          </Btn>
          <Btn as={Link} to={`/jobs/${j.id}`} className="!px-3.5 !py-1.5 text-xs min-h-9">
            Details
          </Btn>
        </div>
      </div>
    </Card>
  );
}

export function ReportDisputeModal({ open, onClose, job, employerName, availableTags = [] }) {
  const { fileReport, user } = useApp();
  const [claimType, setClaimType] = useState('Physical Barrier / Facility Inaccessible');
  const [disputedAccommodation, setDisputedAccommodation] = useState(availableTags[0] || 'General Accessibility Claim');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedCase, setSubmittedCase] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = fileReport({
        jobId: job?.id,
        employerId: job?.employerId,
        claimType,
        disputedAccommodation,
        incidentDate,
        description,
        evidenceUrl,
        isAnonymous,
      });
      setSubmittedCase(res);
    } catch {
      // toast handled in store
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSubmittedCase(null);
    setDescription('');
    setEvidenceUrl('');
    onClose();
  };

  return (
    <Modal open={open} onClose={resetAndClose} title="Report Misleading Accessibility Claim">
      {submittedCase ? (
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-ok/30 bg-okbg/50 p-4 text-ink space-y-2">
            <div className="flex items-center gap-2 text-ok font-bold text-base">
              <ShieldAlert size={20} />
              <span>Case Registered: {submittedCase.caseNumber}</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Your report has been logged in the audit registry and routed to the WorkAble investigation team.
            </p>
            <div className="text-xs font-mono bg-white/80 p-2.5 rounded border border-line space-y-1">
              <div><strong>Status:</strong> {submittedCase.caseStatus}</div>
              <div><strong>Confidentiality:</strong> {submittedCase.isAnonymous ? 'Anonymous (Identity hidden from employer)' : 'Non-Anonymous'}</div>
              <div><strong>Target Organization:</strong> {employerName}</div>
            </div>
          </div>
          <Btn onClick={resetAndClose} className="w-full">
            Done
          </Btn>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            WorkAble enforces rigorous accountability. When an employer publishes an accommodation that is not provided or inaccessible in practice, our investigation team requests verified evidence or freezes the listing.
          </p>

          <Field label="Disputed Accommodation Claim">
            {(p) => (
              <select
                {...p}
                className={inp}
                value={disputedAccommodation}
                onChange={(e) => setDisputedAccommodation(e.target.value)}
              >
                {availableTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="Accessible Interview Barrier">Accessible interview accommodation refused</option>
                <option value="General Workplace Inaccessibility">General workplace accommodation barrier</option>
              </select>
            )}
          </Field>

          <Field label="Dispute Category">
            {(p) => (
              <select
                {...p}
                className={inp}
                value={claimType}
                onChange={(e) => setClaimType(e.target.value)}
              >
                <option value="Physical Barrier / Facility Inaccessible">Physical barrier present (e.g. stairs, no ramp, no accessible lift/toilet)</option>
                <option value="Software / Assistive Tech Incompatibility">Assistive software / screen reader inaccessible</option>
                <option value="Accommodation Refused in Interview">Requested accommodation refused for interview</option>
                <option value="Flexible Hours / Policy Not Honored">Flexible or remote hours refused</option>
                <option value="Discriminatory Interview Conduct">Hostile or discriminatory conduct regarding disability</option>
              </select>
            )}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Date of Occurrence">
              {(p) => (
                <input
                  {...p}
                  type="date"
                  className={inp}
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  required
                />
              )}
            </Field>

            <Field label="Evidence Reference (Optional)" hint="e.g. photo of stairs, email thread PDF">
              {(p) => (
                <input
                  {...p}
                  type="text"
                  placeholder="Doc / photo reference name"
                  className={inp}
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                />
              )}
            </Field>
          </div>

          <Field
            label="What happened? (Detailed factual narrative)"
            hint="Please include objective details: locations, communication with staff, or barriers encountered (min 25 characters)."
          >
            {(p) => (
              <textarea
                {...p}
                rows={3}
                required
                minLength={25}
                className={cx(inp, 'min-h-[84px] resize-y')}
                placeholder="Describe specifically what occurred during your application, interview, or site visit..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            )}
          </Field>

          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-line bg-soft/50 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mt-0.5 accent-brand"
            />
            <div className="text-xs">
              <span className="font-bold text-ink">Submit with identity protection (Recommended)</span>
              <p className="text-muted text-[11px] mt-0.5">
                Your name and email will be hidden from the employer. Only WorkAble administrative case officers can view your profile.
              </p>
            </div>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Btn v="ghost" onClick={resetAndClose}>
              Cancel
            </Btn>
            <Btn type="submit" disabled={submitting || description.trim().length < 25} v="danger">
              <Flag size={15} />
              <span>{submitting ? 'Submitting dispute...' : 'Submit Formal Report'}</span>
            </Btn>
          </div>
        </form>
      )}
    </Modal>
  );
}
