import { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Briefcase,
  FileCheck2,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  AlertTriangle,
  ShieldAlert,
  FileText,
  History,
  Lock,
  Unlock,
  Eye,
  Check,
  Search,
} from 'lucide-react';
import { useApp } from '../store.jsx';
import {
  Badge,
  Btn,
  Card,
  Confirm,
  Empty,
  Field,
  Title,
  VerifyBadge,
  AccountabilityBadge,
  fmtDate,
  inp,
  cx,
} from '../ui.jsx';
import { addTag, companyOf, removeTag, reviewVerification, setSuspended } from '../services/db';

export function Admin() {
  const { db, act, notify, resetDemo, updateCase, evaluateEvidence, toggleUserSuspension } = useApp();
  const [tab, setTab] = useState('disputes');
  const [reason, setReason] = useState({});
  const [tag, setTag] = useState('');
  const [rm, setRm] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Dispute moderation state
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseNotes, setCaseNotes] = useState('');
  const [filterCaseStatus, setFilterCaseStatus] = useState('all');

  // Evidence audit state
  const [evidenceNotes, setEvidenceNotes] = useState({});

  // Audit log search
  const [auditQuery, setAuditQuery] = useState('');

  const pendingVerifications = (db.verifications || []).filter((v) => v.status === 'Pending Review');
  const activeDisputes = (db.reports || []).filter(
    (r) => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'Employer Response Requested'
  );
  const pendingEvidence = (db.evidence || []).filter((e) => e.status === 'Under Review');

  const StatTile = ({ n, l, icon: Icon, tone }) => (
    <Card className="flex flex-col justify-between p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{l}</p>
        {Icon && (
          <Icon
            size={18}
            className={
              tone === 'danger'
                ? 'text-bad'
                : tone === 'warn'
                ? 'text-accent'
                : 'text-brand/70'
            }
            aria-hidden="true"
          />
        )}
      </div>
      <p className="mt-2 font-display text-4xl font-bold text-ink">{n}</p>
    </Card>
  );

  const reviewCompanyVerification = (v, ok) => {
    if (act((d) => reviewVerification(d, v.id, ok, reason[v.id] || ''))) {
      notify(ok ? 'Company legal identity verified.' : 'Verification request rejected.');
    }
  };

  const handleUpdateCaseStatus = (reportId, status, freezeJob = false) => {
    const success = updateCase(reportId, { status, freezeJob }, caseNotes);
    if (success) {
      setCaseNotes('');
      setSelectedCase(null);
    }
  };

  const handleReviewEvidence = (evId, approve) => {
    const note = evidenceNotes[evId] || '';
    evaluateEvidence(evId, approve, note);
    setEvidenceNotes((prev) => ({ ...prev, [evId]: '' }));
  };

  const filteredReports = (db.reports || []).filter((r) => {
    if (filterCaseStatus === 'all') return true;
    return r.status === filterCaseStatus;
  });

  const filteredAuditLogs = (db.auditLogs || []).filter((log) => {
    if (!auditQuery) return true;
    const q = auditQuery.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(q) ||
      (log.targetType || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q)
    );
  });

  const tabs = [
    ['disputes', `Fraud & Disputes (${activeDisputes.length})`],
    ['evidence', `Facility Evidence (${pendingEvidence.length})`],
    ['verify', `Company Identity (${pendingVerifications.length})`],
    ['audit', `Audit Trail (${(db.auditLogs || []).length})`],
    ['users', 'User Directory'],
    ['jobs', 'All Job Listings'],
    ['tags', 'Accommodation Taxonomy'],
  ];

  return (
    <div className="space-y-8">
      {/* Header and Reset Action */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Title sub="System governance, accessibility fraud investigations, facility evidence audits, and immutable audit logs.">
            Administrative Governance Console
          </Title>
        </div>
        <Btn v="danger" onClick={() => setResetConfirm(true)} className="shrink-0 text-xs">
          Reset demo data
        </Btn>
      </div>

      <Confirm
        open={resetConfirm}
        onClose={() => setResetConfirm(false)}
        onYes={resetDemo}
        title="Reset all demo data?"
        text="This restores the original fictional users, jobs, applications, accessibility reports, and audit logs. Your current session will end. This cannot be undone."
        yes="Reset and log out"
      />

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile n={activeDisputes.length} l="Active Investigations" icon={ShieldAlert} tone="danger" />
        <StatTile n={pendingEvidence.length} l="Evidence Verifications" icon={FileText} tone="warn" />
        <StatTile n={pendingVerifications.length} l="Company Audits" icon={ShieldCheck} />
        <StatTile n={db.jobs.length} l="Monitored Listings" icon={Briefcase} />
      </div>

      {/* Primary Section Tabs */}
      <div
        role="tablist"
        aria-label="Admin console navigation"
        className="flex flex-wrap gap-2 border-b border-line/60 pb-3"
      >
        {tabs.map(([k, l]) => (
          <Btn
            key={k}
            v={tab === k ? 'primary' : 'ghost'}
            aria-selected={tab === k}
            role="tab"
            onClick={() => setTab(k)}
            className="!px-3.5 !py-1.5 text-xs sm:text-sm font-semibold min-h-9"
          >
            {l}
          </Btn>
        ))}
      </div>

      {/* TAB 1: ACCESSIBILITY FRAUD & DISPUTES */}
      {tab === 'disputes' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-soft/40 p-3 rounded-xl border border-line/50">
            <div>
              <p className="font-semibold text-ink text-sm">Dispute Case Inquiries</p>
              <p className="text-xs text-muted">
                Candidate reports regarding misleading accommodations or discriminatory practices.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted">Filter status:</span>
              <select
                className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink focus:border-brand focus:outline-none"
                value={filterCaseStatus}
                onChange={(e) => setFilterCaseStatus(e.target.value)}
              >
                <option value="all">All Cases ({db.reports?.length || 0})</option>
                <option value="Submitted">Submitted (New)</option>
                <option value="Under Review">Under Review</option>
                <option value="Employer Response Requested">Response Requested</option>
                <option value="Resolved">Resolved</option>
                <option value="Unsubstantiated">Unsubstantiated</option>
              </select>
            </div>
          </div>

          {filteredReports.length ? (
            <div className="space-y-4">
              {filteredReports.map((r) => {
                const job = db.jobs.find((j) => j.id === r.jobId);
                const isFrozen = job?.status === 'Suspended_Fraud_Hold' || !job?.active;
                const isSelected = selectedCase?.id === r.id;

                return (
                  <Card key={r.id} className="p-6 space-y-4 border border-line">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-brand bg-brand/10 px-2.5 py-1 rounded-md">
                          {r.caseNumber || r.id}
                        </span>
                        <h3 className="font-display text-base font-bold text-ink">
                          {r.jobTitle}
                        </h3>
                        <span className="text-xs text-muted">at {r.companyName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          tone={
                            r.status === 'Resolved'
                              ? 'ok'
                              : r.status === 'Submitted'
                              ? 'bad'
                              : r.status === 'Employer Response Requested'
                              ? 'warn'
                              : 'info'
                          }
                        >
                          {r.status}
                        </Badge>
                        {isFrozen && <Badge tone="bad">Listing Frozen</Badge>}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 text-xs text-ink/90">
                      <div className="space-y-1.5 bg-paper/60 p-3 rounded-lg border border-line/40">
                        <p className="font-bold uppercase tracking-wider text-muted text-[10px]">
                          Case Metadata
                        </p>
                        <p>
                          <strong>Category:</strong> {r.category}
                        </p>
                        <p>
                          <strong>Date Filed:</strong> {fmtDate(r.createdAt)}
                        </p>
                        <p>
                          <strong>Reporter:</strong>{' '}
                          {r.isAnonymous ? 'Confidential (Anonymous to Employer)' : r.reporterName || 'Candidate'}
                        </p>
                        {r.evidenceLink && (
                          <p className="truncate">
                            <strong>Evidence URL:</strong>{' '}
                            <a
                              href={r.evidenceLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand underline"
                            >
                              {r.evidenceLink}
                            </a>
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 bg-paper/60 p-3 rounded-lg border border-line/40">
                        <p className="font-bold uppercase tracking-wider text-muted text-[10px]">
                          Employer Response
                        </p>
                        {r.employerResponse ? (
                          <div className="space-y-1">
                            <p className="text-ink leading-relaxed">"{r.employerResponse}"</p>
                            <p className="text-[11px] text-muted">
                              Responded on: {fmtDate(r.employerRespondedAt)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted italic">No employer response submitted yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 bg-surface p-3 rounded-lg border border-line/30">
                      <p className="font-semibold text-xs text-ink">Candidate Narrative:</p>
                      <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{r.narrative}</p>
                    </div>

                    {r.resolutionNotes && (
                      <div className="p-3 rounded-lg bg-soft text-xs text-ink border border-line/60">
                        <span className="font-bold text-brand">Investigator Notes:</span>{' '}
                        {r.resolutionNotes}
                      </div>
                    )}

                    {/* Action Controls */}
                    <div className="pt-3 border-t border-line/60 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {r.status !== 'Employer Response Requested' && (
                          <Btn
                            v="ghost"
                            className="!px-3 !py-1 text-xs"
                            onClick={() => handleUpdateCaseStatus(r.id, 'Employer Response Requested')}
                          >
                            Request Employer Response
                          </Btn>
                        )}
                        {!isFrozen && (
                          <Btn
                            v="danger"
                            className="!px-3 !py-1 text-xs"
                            onClick={() => {
                              setSelectedCase(r);
                              handleUpdateCaseStatus(r.id, 'Under Review', true);
                            }}
                          >
                            <Lock size={13} className="mr-1" />
                            Freeze Listing (Fraud Hold)
                          </Btn>
                        )}
                        {isFrozen && (
                          <Btn
                            v="ghost"
                            className="!px-3 !py-1 text-xs text-ok"
                            onClick={() => handleUpdateCaseStatus(r.id, 'Under Review', false)}
                          >
                            <Unlock size={13} className="mr-1" />
                            Reinstate Listing
                          </Btn>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Btn
                          v={isSelected ? 'secondary' : 'ghost'}
                          className="!px-3 !py-1 text-xs"
                          onClick={() => setSelectedCase(isSelected ? null : r)}
                        >
                          {isSelected ? 'Close Resolution Panel' : 'Record Final Decision'}
                        </Btn>
                      </div>
                    </div>

                    {/* Expandable Decision Panel */}
                    {isSelected && (
                      <div className="mt-3 p-4 rounded-xl bg-soft/70 border border-brand/30 space-y-3">
                        <p className="font-bold text-xs text-ink uppercase tracking-wider">
                          Record Administrative Finding for {r.caseNumber}
                        </p>
                        <Field label="Investigative Rationale & Audit Findings">
                          {(p) => (
                            <textarea
                              {...p}
                              className={cx(inp, 'h-20 text-xs')}
                              placeholder="Detail the verified facts, whether employer rectified the facility, or why the report is substantiated/unsubstantiated..."
                              value={caseNotes}
                              onChange={(e) => setCaseNotes(e.target.value)}
                            />
                          )}
                        </Field>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Btn
                            v="ghost"
                            className="!px-3 !py-1.5 text-xs text-muted"
                            onClick={() => setSelectedCase(null)}
                          >
                            Cancel
                          </Btn>
                          <Btn
                            v="ghost"
                            className="!px-3 !py-1.5 text-xs"
                            onClick={() => handleUpdateCaseStatus(r.id, 'Unsubstantiated')}
                          >
                            Mark Unsubstantiated
                          </Btn>
                          <Btn
                            v="ok"
                            className="!px-3 !py-1.5 text-xs"
                            onClick={() => handleUpdateCaseStatus(r.id, 'Resolved')}
                          >
                            Resolve Dispute
                          </Btn>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Empty
              title="No dispute cases match the filter"
              text="No candidate accessibility complaints filed under this category."
            />
          )}
        </div>
      )}

      {/* TAB 2: FACILITY EVIDENCE AUDITS */}
      {tab === 'evidence' && (
        <div className="space-y-6">
          <div className="bg-soft/40 p-3 rounded-xl border border-line/50">
            <p className="font-semibold text-ink text-sm">Physical & Digital Facility Declarations</p>
            <p className="text-xs text-muted">
              Review submitted documentation and record a decision. Evidence review is not a substitute for a professional accessibility audit.
            </p>
          </div>

          {db.evidence?.length ? (
            <div className="space-y-4">
              {[...db.evidence].reverse().map((ev) => {
                const employer = db.users.find((u) => u.id === ev.employerId);
                const comp = employer?.company || 'Employer';

                return (
                  <Card key={ev.id} className="p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                      <div>
                        <h3 className="font-display text-base font-bold text-ink">{comp}</h3>
                        <p className="text-xs text-brand font-semibold">{ev.category}</p>
                      </div>
                      <Badge
                        tone={
                          ev.status === 'Approved'
                            ? 'ok'
                            : ev.status === 'Rejected'
                            ? 'bad'
                            : 'warn'
                        }
                      >
                        {ev.status}
                      </Badge>
                    </div>

                    <div className="text-xs space-y-2">
                      <p className="text-muted leading-relaxed">
                        <strong className="text-ink">Facility Description:</strong> {ev.description}
                      </p>
                      {ev.documentUrl && (
                        <p>
                          <strong className="text-ink">Submitted Document:</strong>{' '}
                          <a
                            href={ev.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand underline font-medium"
                          >
                            {ev.documentUrl}
                          </a>
                        </p>
                      )}
                      <p className="text-[11px] text-muted">
                        Declared on: {fmtDate(ev.submittedAt)}
                        {ev.reviewedAt && ` · Reviewed on: ${fmtDate(ev.reviewedAt)}`}
                      </p>
                    </div>

                    {ev.reviewNotes && (
                      <div className="p-2.5 rounded-lg bg-soft text-xs text-ink border border-line/50">
                        <strong>Auditor Note:</strong> {ev.reviewNotes}
                      </div>
                    )}

                    {ev.status === 'Under Review' && (
                      <div className="pt-3 border-t border-line/60 flex flex-wrap items-end gap-3">
                        <div className="min-w-60 flex-1">
                          <Field label="Auditor Assessment Notes">
                            {(p) => (
                              <input
                                {...p}
                                className={inp}
                                placeholder="Verification rationale or deficiency note..."
                                value={evidenceNotes[ev.id] || ''}
                                onChange={(e) =>
                                  setEvidenceNotes({ ...evidenceNotes, [ev.id]: e.target.value })
                                }
                              />
                            )}
                          </Field>
                        </div>
                        <Btn v="ok" onClick={() => handleReviewEvidence(ev.id, true)}>
                          <CheckCircle2 size={16} aria-hidden="true" />
                          <span>Approve evidence review</span>
                        </Btn>
                        <Btn v="danger" onClick={() => handleReviewEvidence(ev.id, false)}>
                          <XCircle size={16} aria-hidden="true" />
                          <span>Reject Evidence</span>
                        </Btn>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Empty
              title="No facility evidence submitted"
              text="Employers have not yet submitted third-party audits or facility documentation."
            />
          )}
        </div>
      )}

      {/* TAB 3: COMPANY LEGAL IDENTITY VERIFICATION QUEUE */}
      {tab === 'verify' &&
        (db.verifications.length ? (
          <div className="space-y-4">
            <div className="bg-soft/40 p-3 rounded-xl border border-line/50 text-xs text-muted">
              <strong>Accountability Rule:</strong> Approving company legal identity certifies that the employer exists as an entity. It does <em>not</em> automatically certify their workplace accessibility.
            </div>

            {[...db.verifications].reverse().map((v) => (
              <Card key={v.id} className="p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2">
                  <h3 className="font-display text-xl font-bold text-ink">
                    {companyOf(db, v.employerId)}
                  </h3>
                  <VerifyBadge status={v.status} />
                </div>
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-ink">Declared Accommodations:</p>
                  <p className="text-muted leading-relaxed">{v.description}</p>
                </div>
                <p className="text-xs text-muted">
                  <strong>Evidence document:</strong> {v.evidence} · Submitted {fmtDate(v.submittedAt)}
                </p>
                {v.reason && (
                  <p className="rounded-lg bg-badbg border border-bad/20 p-2.5 text-xs font-bold text-bad">
                    Rejection note: {v.reason}
                  </p>
                )}

                {v.status === 'Pending Review' && (
                  <div className="mt-4 pt-3 border-t border-line/60 flex flex-wrap items-end gap-3">
                    <div className="min-w-60 flex-1">
                      <Field label="Administrative Rationale (Required to reject)">
                        {(p) => (
                          <input
                            {...p}
                            className={inp}
                            placeholder="State reason if rejecting or requesting more proof..."
                            value={reason[v.id] || ''}
                            onChange={(e) => setReason({ ...reason, [v.id]: e.target.value })}
                          />
                        )}
                      </Field>
                    </div>
                    <Btn v="ok" onClick={() => reviewCompanyVerification(v, true)}>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>Approve Legal Identity</span>
                    </Btn>
                    <Btn v="danger" onClick={() => reviewCompanyVerification(v, false)}>
                      <XCircle size={16} aria-hidden="true" />
                      <span>Reject Request</span>
                    </Btn>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Empty title="Verification queue is empty" text="All employer verification audits have been resolved." />
        ))}

      {/* TAB 4: IMMUTABLE AUDIT TRAIL */}
      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-soft/40 p-3 rounded-xl border border-line/50">
            <div>
              <p className="font-semibold text-ink text-sm">Regulatory Compliance & Audit Trail</p>
              <p className="text-xs text-muted">
                Immutable records of verification decisions, fraud investigations, and status changes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Search size={14} className="text-muted" />
              <input
                className="rounded-lg border border-line bg-surface px-3 py-1 text-xs text-ink placeholder:text-muted focus:border-brand focus:outline-none"
                placeholder="Search audit events..."
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredAuditLogs.length ? (
            <Card className="p-0 overflow-hidden border border-line">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-ink">
                  <thead className="bg-soft/70 border-b border-line text-[11px] font-bold uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Target</th>
                      <th className="px-4 py-3">Performed By</th>
                      <th className="px-4 py-3">Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/40">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-soft/30 transition">
                        <td className="px-4 py-3 font-mono text-[11px] text-muted whitespace-nowrap">
                          {fmtDate(log.timestamp)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-brand whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-[11px] bg-paper px-2 py-0.5 rounded border border-line/40">
                            {log.targetType}:{log.targetId}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap">
                          {log.adminId || 'System'}
                        </td>
                        <td className="px-4 py-3 text-ink/80 leading-relaxed">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Empty title="No audit events found" text="No system audit logs match your search criteria." />
          )}
        </div>
      )}

      {/* TAB 5: USERS DIRECTORY */}
      {tab === 'users' && (
        <div className="space-y-3">
          {db.users.map((u) => (
            <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <strong className="text-base font-bold text-ink">{u.name}</strong>
                  <Badge tone="info">{u.role}</Badge>
                  {u.suspended && <Badge tone="bad">Account Suspended</Badge>}
                </div>
                <p className="text-xs text-muted">
                  {u.email} {u.company ? `· ${u.company}` : ''}
                </p>
              </div>

              {u.role !== 'admin' && (
                <Btn
                  v="ghost"
                  aria-label={`${u.suspended ? 'Reactivate' : 'Suspend'} ${u.name}`}
                  onClick={() => toggleUserSuspension(u.id, !u.suspended)}
                  className="!px-3 !py-1 text-xs"
                >
                  {u.suspended ? 'Reactivate account' : 'Suspend account'}
                </Btn>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* TAB 6: JOBS DIRECTORY */}
      {tab === 'jobs' && (
        <div className="space-y-3">
          {db.jobs.map((j) => (
            <Card key={j.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-ink">{j.title}</h3>
                  <AccountabilityBadge jobId={j.id} />
                </div>
                <p className="text-xs text-muted mt-1">
                  {companyOf(db, j.employerId)} · {j.location} · {j.arrangement}
                </p>
              </div>
              <Badge tone={j.active ? 'ok' : 'warn'}>{j.active ? 'Active' : 'Inactive / Held'}</Badge>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 7: ACCESSIBILITY TAGS TAXONOMY */}
      {tab === 'tags' && (
        <Card className="p-6 space-y-4">
          <form
            className="flex items-end gap-3 pb-4 border-b border-line/60"
            onSubmit={(e) => {
              e.preventDefault();
              if (act((d) => addTag(d, tag))) {
                notify('New accommodation tag added to taxonomy.');
                setTag('');
              }
            }}
          >
            <div className="flex-1">
              <Field label="Add New Standardized Accommodation Tag">
                {(p) => (
                  <input
                    {...p}
                    className={inp}
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="e.g. Quiet sensory space, Screen reader optimized"
                  />
                )}
              </Field>
            </div>
            <Btn type="submit">
              <Plus size={16} aria-hidden="true" />
              <span>Add tag</span>
            </Btn>
          </form>

          <ul className="divide-y divide-line/40">
            {db.tags.map((t) => (
              <li key={t.id} className="py-2.5 flex items-center justify-between text-sm text-ink">
                <span className="font-medium">{t.label}</span>
                <Btn
                  v="ghost"
                  onClick={() => setRm(t)}
                  aria-label={`Remove tag ${t.label}`}
                  className="!px-2.5 !py-1 text-xs text-muted hover:text-bad"
                >
                  Remove
                </Btn>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Confirm
        open={!!rm}
        onClose={() => setRm(null)}
        title="Remove this accommodation tag?"
        text={`“${rm?.label}” will be permanently removed from all active and past job postings.`}
        yes="Remove tag"
        onYes={() => {
          act((d) => removeTag(d, rm.id));
          notify('Tag removed from taxonomy.');
        }}
      />
    </div>
  );
}
