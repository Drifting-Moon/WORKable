import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Search,
  ShieldCheck,
  Accessibility,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Lock,
  Building2,
  Sparkles,
  MapPin,
  HelpCircle,
  FileText,
  Clock,
  Compass,
  ArrowUpRight,
  XCircle,
  Sliders,
  ShieldAlert,
  UserCheck,
  HeartHandshake,

} from 'lucide-react';
import { useApp } from '../store.jsx';
import { Btn, Card, Badge, Field, inp, Title, JobCard, cx } from '../ui.jsx';
import { registerUser } from '../services/db';

export function Landing() {
  const { db } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState('');

  // Sample curated jobs for the editorial showcase
  const featuredJobs = (db.jobs || []).slice(0, 3);

  // Detailed accommodation taxonomy explanations
  const taxonomyDetails = {
    wheel: 'Step-free access, automatic doors, accessible elevators, and height-adjustable desks.',
    remote: 'Location-independent roles, asynchronous communications, and ergonomic equipment stipends.',
    sign: 'Qualified sign-language interpreters for interviews and company meetings, plus live captions.',
    at: 'Dedicated support for screen readers (NVDA/VoiceOver), switch devices, and speech-to-text.',
    flex: 'Autonomous scheduling, core-hour windows, and protected time for therapy or medical appointments.',
    int: 'Advance question previews, alternative assessment methods, and sensory-calm interview formats.',
  };

  const [roleMode, setRoleMode] = useState('seeker');
  const [selectedTags, setSelectedTags] = useState([]);

  const toggleTag = (id) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const matchingJobsCount = (db.jobs || []).filter((j) => {
    if (selectedTags.length > 0 && !selectedTags.every((t) => (j.tags || []).includes(t))) {
      return false;
    }
    if (q.trim()) {
      const term = q.toLowerCase();
      const matchTitle = (j.title || '').toLowerCase().includes(term);
      const matchSkill = (j.skills || []).some((s) => s.toLowerCase().includes(term));
      const matchLoc = (j.location || '').toLowerCase().includes(term);
      if (!matchTitle && !matchSkill && !matchLoc) return false;
    }
    return true;
  }).length;

  const handleSeekerSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    selectedTags.forEach((t) => params.append('tag', t));
    nav('/jobs?' + params.toString());
  };

  return (
    <div className="space-y-32 md:space-y-48">
      {/* 1. HERO SECTION & MASTHEAD */}
      <section
        className="relative w-screen left-1/2 -translate-x-1/2 -mt-8 md:-mt-10 min-h-[100vh] flex items-center justify-center pt-6 md:pt-10 pb-8 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(/images/backgrnd.webp)` }}
      >
        <div className="mx-auto max-w-4xl w-full text-center space-y-6">
          {/* Large editorial serif headline */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-ink leading-[1.12]">
            A workplace where your abilities can thrive
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-ink leading-relaxed font-light">
            Explore jobs with clearly labelled employer accessibility declarations, visible evidence status, and practical filters for the accommodations that matter to you.
          </p>

          {/* 1. Clear Choice: Job Seeker vs Employer */}
          <div className="mx-auto mt-4 max-w-xl">
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-white/70 backdrop-blur-md border border-line shadow-sm">
              <button
                type="button"
                onClick={() => setRoleMode('seeker')}
                className={cx(
                  'flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer',
                  roleMode === 'seeker'
                    ? 'bg-brand text-white shadow-md'
                    : 'text-ink hover:bg-white/60'
                )}
              >
                <Search size={16} />
                <span>I am looking for a job</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleMode('employer')}
                className={cx(
                  'flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer',
                  roleMode === 'employer'
                    ? 'bg-brand text-white shadow-md'
                    : 'text-ink hover:bg-white/60'
                )}
              >
                <Building2 size={16} />
                <span>I am an employer</span>
              </button>
            </div>
          </div>

          {/* 2A. If Job Seeker: Ask Before Searching */}
          {roleMode === 'seeker' ? (
            <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-line bg-white/95 p-6 shadow-xl backdrop-blur-md text-left space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand">Step 1: Tell us what you need</p>
                <h3 className="text-lg font-bold text-ink mt-0.5">What accommodations do you need at work?</h3>
                <p className="text-xs text-muted">Select all that apply. We will filter out jobs that do not support your choices.</p>
              </div>

              {/* Accommodation Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {db.tags.map((t) => {
                  const isSel = selectedTags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={cx(
                        'flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer',
                        isSel
                          ? 'border-brand bg-soft text-brand shadow-2xs font-bold'
                          : 'border-line/70 bg-white/80 text-ink hover:border-brand/50 hover:bg-soft/40'
                      )}
                    >
                      <span className={cx(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]',
                        isSel ? 'border-brand bg-brand text-white' : 'border-line text-transparent'
                      )}>
                        ✓
                      </span>
                      <span className="leading-tight">{t.label.replace(' workplace', '').replace(' work', '')}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search keyword input and button */}
              <form onSubmit={handleSeekerSearch} className="pt-2 space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    className="w-full min-h-12 rounded-xl border border-line bg-soft/50 pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Role, skill, or keyword (optional, e.g. React, Analyst)..."
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-xs font-semibold text-brand">
                    {matchingJobsCount === 1 ? '1 job matches' : `${matchingJobsCount} jobs match your choices`}
                  </span>
                  <Btn type="submit" className="!px-6 !py-2.5 shadow-sm">
                    <span>Show matching jobs</span>
                    <ArrowRight size={16} />
                  </Btn>
                </div>
              </form>
            </div>
          ) : (
            /* 2B. If Employer: Direct Employer Entrance */
            <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-line bg-white/95 p-6 sm:p-8 shadow-xl backdrop-blur-md text-left space-y-5">
              <div className="space-y-1.5">
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
                  Employer Hub
                </span>
                <h3 className="font-display text-2xl font-bold text-ink">Hire with Accessibility First</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Post positions with transparent physical, sensory, and scheduling accommodations. Connect directly with skilled, dedicated professionals.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs text-ink/90 pt-1">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-soft/60">
                  <CheckCircle2 size={15} className="text-ok shrink-0" />
                  <span>Verified Accessibility Audits</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-soft/60">
                  <CheckCircle2 size={15} className="text-ok shrink-0" />
                  <span>Live Candidate Applications</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Btn as={Link} to="/register?role=employer" className="!px-6 !py-3">
                  <Building2 size={16} />
                  <span>Register Company & Post Job</span>
                </Btn>
                <Btn v="ghost" as={Link} to="/login?role=employer" className="!px-5 !py-3 border border-line bg-white">
                  <span>Demo Sign In as Employer</span>
                </Btn>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* WHY WORKABLE IS BETTER - SIMPLE & PLAIN ENGLISH */}
      <section aria-labelledby="why-better-heading" className="space-y-20"
      >
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-soft px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-brand">
            <HeartHandshake size={14} className="text-accent" aria-hidden="true" />
            <span>Made For Everyone</span>
          </div>
          <h2 id="why-better-heading" className="font-display text-3xl sm:text-4xl font-bold text-ink">
            Why WorkAble is Actually Helpful
          </h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            Most job websites make job hunting stressful for disabled people. Here is how WorkAble does things differently.
          </p>
        </div>

        {/* 1. Comparison */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Other Job Boards */}
          <div className="rounded-2xl border border-line/80 bg-soft/40 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-bad font-bold text-sm tracking-wide uppercase">
              <XCircle size={18} />
              <span>Other Job Websites</span>
            </div>
            <h3 className="font-display text-xl font-bold text-ink">You have to guess and hope</h3>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2.5">
                <span className="text-bad font-bold text-base leading-none">✕</span>
                <span><strong>Stressful guessing:</strong> You don't know if the building has elevators, ramps, or quiet rooms until you show up.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-bad font-bold text-base leading-none">✕</span>
                <span><strong>Empty promises:</strong> Companies say "we are inclusive", but don't explain what help they actually provide.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-bad font-bold text-base leading-none">✕</span>
                <span><strong>Hard to read:</strong> Tiny text, poor colors, and clunky layouts that don't work well with screen readers.</span>
              </li>
            </ul>
          </div>

          {/* WorkAble */}
          <div className="rounded-2xl border-2 border-brand/40 bg-surface p-6 sm:p-8 space-y-4 shadow-md">
            <div className="flex items-center gap-2 text-ok font-bold text-sm tracking-wide uppercase">
              <CheckCircle2 size={18} />
              <span>On WorkAble</span>
            </div>
            <h3 className="font-display text-xl font-bold text-ink">Everything is clear upfront</h3>
            <ul className="space-y-3 text-sm text-ink">
              <li className="flex items-start gap-2.5">
                <span className="text-ok font-bold text-base leading-none">✓</span>
                <span><strong>Clear details first:</strong> You see confirmed wheelchair access, work-from-home options, or sign interpreters before you apply.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-ok font-bold text-base leading-none">✓</span>
                <span><strong>Total privacy:</strong> You never have to share medical information or explain your personal situation to anyone.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-ok font-bold text-base leading-none">✓</span>
                <span><strong>Comfortable to use:</strong> Easily change text size, switch to high-contrast dark mode, and use reading guides.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 2. Three simple points */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-surface p-5 space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-soft text-brand font-bold">
              <ShieldCheck size={20} />
            </div>
            <h4 className="font-display font-bold text-ink text-base">Evidence status is explicit</h4>
            <p className="text-xs text-muted leading-relaxed">
              An “Evidence Verified” badge means supporting documentation has been reviewed. A company identity badge alone does not certify accessibility.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-soft text-brand font-bold">
              <Sliders size={20} />
            </div>
            <h4 className="font-display font-bold text-ink text-base">Easy on Your Eyes</h4>
            <p className="text-xs text-muted leading-relaxed">
              Make the text bigger, switch color themes, or turn on reading lines at any time from the top of the screen.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-soft text-brand font-bold">
              <UserCheck size={20} />
            </div>
            <h4 className="font-display font-bold text-ink text-base">Matched on Your Skills</h4>
            <p className="text-xs text-muted leading-relaxed">
              You are judged on what you can do. See how well your professional skills fit each job automatically.
            </p>
          </div>
        </div>
      </section>



      {/* 5. EDITORIAL DOSSIER: THE VERIFICATION STANDARD */}
      <section aria-labelledby="ver-heading">
        <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-[#0f3b4c] via-[#092b38] to-[#061e27] p-6 sm:p-10 text-white shadow-xl">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-accent-soft border border-white/10">
                <ShieldCheck size={14} className="text-accent" aria-hidden="true" />
                <span>Peer-Audited Trust Framework</span>
              </div>
              <h2 id="ver-heading" className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white leading-snug">
                What “Verified Accessibility” Actually Means
              </h2>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                A verification badge on WorkAble is not a generic marketing slogan. When an employer applies for verification, our administration inspects physical audits, documented workplace policies, and external reviews before granting the badge.
              </p>
              <div className="pt-2">
                <Link
                  to="/jobs?verified=1"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 active:translate-y-px transition-all shadow-sm"
                >
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>Browse verified employers only</span>
                </Link>
              </div>
            </div>

            {/* Dossier Card breakdown */}
            <div className="rounded-xl border border-white/15 bg-white/5 p-6 backdrop-blur-xs space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-white font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Evidence Submission</h3>
                  <p className="text-slate-300 mt-0.5">
                    Employers submit structural facility audits, ergonomics policies, and interpreter contracts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-white/10 pt-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-white font-bold text-xs">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Human Administrative Audit</h3>
                  <p className="text-slate-300 mt-0.5">
                    Trained admins inspect evidence. Unsubstantiated claims are rejected with written feedback.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-white/10 pt-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-white font-bold text-xs">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Zero Disclosure Pressure</h3>
                  <p className="text-slate-300 mt-0.5">
                    Job seekers never need to share a diagnosis. Matching and applying is based strictly on your skills.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW WORKABLE WORKS: 3-ACT EDITORIAL NARRATIVE */}
      <section aria-labelledby="how-heading" className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-brand">The Protocol</div>
          <h2 id="how-heading" className="font-display text-3xl font-bold text-ink">
            A More Dignified Hiring Experience
          </h2>
          <p className="text-sm text-muted">
            Three straightforward steps designed to eliminate uncertainty and protect privacy.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Curate your profile privately',
              desc: 'List your skills and background. Accommodations you may prefer remain strictly confidential and are never revealed to employers.',
            },
            {
              step: '02',
              title: 'Filter with total precision',
              desc: 'Combine domain requirements with specific accessibility features. See skill match percentages and confirmed accommodations side-by-side.',
            },
            {
              step: '03',
              title: 'Apply in one confident step',
              desc: 'Submit your resume and cover note directly. Follow real-time application milestones from review through to interviews.',
            },
          ].map((item) => (
            <Card key={item.step} className="relative flex flex-col justify-between border-line/90 p-6">
              <div>
                <span className="font-display text-3xl font-bold text-accent/80">{item.step}</span>
                <h3 className="mt-3 font-display text-xl font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-line/40 text-xs font-semibold text-brand flex items-center gap-1">
                <CheckCircle2 size={14} className="text-ok" aria-hidden="true" />
                <span>Transparent by design</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 7. DEMO CALL TO ACTION & GET STARTED */}
      <section className="rounded-2xl border border-line bg-gradient-to-b from-white to-soft/80 p-8 md:p-12 text-center space-y-4 shadow-xs">
        <h2 className="font-display text-3xl font-bold text-ink">Ready to explore WorkAble?</h2>
        <p className="mx-auto max-w-lg text-sm sm:text-base text-muted leading-relaxed">
          Create an account to save jobs and submit applications, or jump directly into any persona using our interactive demo system.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Btn as={Link} to="/register" className="!px-6 !py-3">
            Create an account
          </Btn>
          <Btn v="ghost" as={Link} to="/login" className="!px-5 !py-3">
            <Compass size={17} className="text-brand" aria-hidden="true" />
            <span>Try demo accounts</span>
          </Btn>
        </div>
      </section>
    </div>
  );
}

const DEMOS = [
  {
    role: 'Job Seeker',
    name: 'Aarav Mehta',
    desc: 'Frontend developer with hybrid & flexible accommodation preferences.',
    email: 'seeker@workable.demo',
    pw: 'Demo@123',
  },
  {
    role: 'Employer',
    name: 'BrightPath Software HR',
    desc: 'Verified inclusive tech firm with active listings and applicants.',
    email: 'employer@workable.demo',
    pw: 'Demo@123',
  },
  {
    role: 'Administrator',
    name: 'Site Admin',
    desc: 'Reviews employer evidence, audits verifications, and moderates tags.',
    email: 'admin@workable.demo',
    pw: 'Admin@123',
  },
];

export function Login() {
  const { login, isSupabase } = useApp();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const roleParam = sp.get('role');
  const [f, setF] = useState(() => ({
    email: roleParam === 'employer' ? 'employer@workable.demo' : '',
    pw: roleParam === 'employer' ? 'Demo@123' : '',
  }));
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const go = async (email, pw) => {
    setErr('');
    setLoading(true);
    try {
      const u = await login(email, pw);
      nav('/' + u.role);
    } catch (e) {
      setErr(e.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Title sub={roleParam === 'employer' ? 'Sign in to your Employer workspace or launch the BrightPath Software HR demo persona below.' : 'Sign in to your account or launch one of our preconfigured academic demo personas.'}>
        {roleParam === 'employer' ? 'Employer Portal Sign In' : 'Welcome to WorkAble'}
      </Title>

      <div className="grid gap-6 md:grid-cols-[1.1fr_1.2fr]">
        {/* Traditional login form */}
        <Card className="border-line/90 p-6 md:p-8">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="font-display text-2xl font-bold text-ink">Sign in</h2>
            {isSupabase ? (
              <Badge tone="good">Supabase Auth Connected</Badge>
            ) : (
              <Badge tone="neutral">Local Mode</Badge>
            )}
          </div>
          <p className="text-xs text-muted mb-5">
            {isSupabase
              ? 'Real authentication powered by Supabase Auth.'
              : 'Enter your email and password to access your dashboard.'}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              go(f.email, f.pw);
            }}
            className="space-y-4"
            noValidate
          >
            {err && (
              <p role="alert" className="rounded-lg bg-badbg border border-bad/20 p-3 text-xs font-bold text-bad">
                Error: {err}
              </p>
            )}

            <Field label="Email address">
              {(p) => (
                <input
                  {...p}
                  type="email"
                  autoComplete="email"
                  className={inp}
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                  placeholder={roleParam === 'employer' ? 'e.g. employer@workable.demo' : 'e.g. seeker@workable.demo'}
                />
              )}
            </Field>

            <Field label="Password">
              {(p) => (
                <div className="flex gap-2">
                  <input
                    {...p}
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={inp}
                    value={f.pw}
                    onChange={(e) => setF({ ...f, pw: e.target.value })}
                    placeholder="Enter password"
                  />
                  <Btn
                    v="ghost"
                    onClick={() => setShow(!show)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    aria-pressed={show}
                    className="!px-3"
                  >
                    {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </Btn>
                </div>
              )}
            </Field>

            <Btn type="submit" disabled={loading} className="w-full !py-2.5">
              {loading ? 'Signing in...' : 'Log in to account'}
            </Btn>

            <p className="text-center text-xs text-muted pt-2">
              Don’t have an account yet?{' '}
              <Link className="font-bold text-brand underline decoration-accent/60" to="/register">
                Register as candidate or employer
              </Link>
            </p>
          </form>
        </Card>

        {/* Demo Personas Card */}
        <Card className="border-line/90 bg-soft/70 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-display text-lg font-bold text-ink">Academic Demo Personas</span>
              <Badge tone="warn">Instant Access</Badge>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-4">
              Explore the system from any stakeholder perspective without creating an account.
            </p>

            <div className="space-y-3">
              {DEMOS.map((d) => {
                const isTarget = (roleParam === 'employer' && d.role === 'Employer') || (roleParam === 'seeker' && d.role === 'Job Seeker');
                return (
                  <div
                    key={d.role}
                    className={cx(
                      'rounded-lg border p-3.5 transition-all',
                      isTarget
                        ? 'border-brand ring-2 ring-brand/30 bg-soft/50 shadow-xs'
                        : 'border-line bg-white/90 hover:border-brand'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-ink">{d.role}</h3>
                          {isTarget && <Badge tone="good">Target Persona</Badge>}
                        </div>
                        <p className="text-xs font-semibold text-brand">{d.name}</p>
                        <p className="text-[11px] text-muted mt-1 leading-normal">{d.desc}</p>
                      </div>
                      <Btn
                        v={isTarget ? 'solid' : 'ghost'}
                        className="!px-3 !py-1 text-xs shrink-0"
                        onClick={() => go(d.email, d.pw)}
                      >
                        Login as {d.role.split(' ')[0]}
                      </Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-line/60 text-[11px] text-muted">
            <em>Credentials persist in browser localStorage for this demo session.</em>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function Register() {
  const { register, isSupabase, notify } = useApp();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    role: sp.get('role') === 'employer' ? 'employer' : 'seeker',
  });
  const [errs, setErrs] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErrs({});

    // Client-side quick validation
    const errObj = {};
    if (!f.name.trim()) errObj.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test((f.email || '').trim())) errObj.email = 'Enter a valid email address.';
    if ((f.password || '').length < 8) errObj.password = 'Password must be at least 8 characters.';
    if (f.role === 'employer' && !f.company.trim()) errObj.company = 'Enter your company name.';
    if (Object.keys(errObj).length > 0) {
      setErrs(errObj);
      return;
    }

    setLoading(true);
    try {
      const res = await register(f);
      if (res?.session) {
        notify('Account created. Welcome to WorkAble!');
        nav('/' + res.user.role);
      } else {
        notify('Account created! Please check your email to confirm or sign in now.');
        nav('/login');
      }
    } catch (x) {
      setErrs(x.fields || { form: x.message || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const isEmployerParam = sp.get('role') === 'employer';
  const isSeekerParam = sp.get('role') === 'seeker';

  return (
    <Card className="mx-auto max-w-xl border-line/90 p-6 md:p-8">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-muted">
          {isSupabase ? 'Supabase Auth' : 'Local Demo'}
        </span>
        {isSupabase ? (
          <Badge tone="good">Real Auth Active</Badge>
        ) : (
          <Badge tone="neutral">Demo Mode</Badge>
        )}
      </div>
      <Title
        sub={
          isEmployerParam
            ? 'Create your organization account to publish verified accommodations and post jobs.'
            : isSeekerParam
            ? 'Create your candidate profile to find inclusive opportunities with confirmed support.'
            : 'Admin accounts are preconfigured. Choose candidate or employer to begin.'
        }
      >
        {isEmployerParam ? 'Register as an Employer' : isSeekerParam ? 'Register as a Job Seeker' : 'Create your WorkAble account'}
      </Title>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {errs.form && (
          <p role="alert" className="rounded-lg bg-badbg border border-bad/20 p-3 text-xs font-bold text-bad">
            Error: {errs.form}
          </p>
        )}

        {/* Only show role selection if not already chosen via URL */}
        {!isEmployerParam && !isSeekerParam && (
          <fieldset className="space-y-1.5">
            <legend className="font-semibold text-sm text-ink mb-1">I am registering as:</legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['seeker', 'Job Seeker', 'Looking for inclusive opportunities'],
                ['employer', 'Employer', 'Hiring and publishing accommodation data'],
              ].map(([v, l, d]) => (
                <label
                  key={v}
                  className={cx(
                    'flex flex-col cursor-pointer rounded-xl border p-3.5 transition-all',
                    f.role === v
                      ? 'border-brand bg-soft text-brand font-bold shadow-xs'
                      : 'border-line bg-white/90 text-ink hover:bg-paper'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="role"
                      className="size-4 accent-brand"
                      checked={f.role === v}
                      onChange={() => setF({ ...f, role: v })}
                    />
                    <span className="text-sm font-semibold">{l}</span>
                  </div>
                  <span className="text-[11px] font-normal text-muted mt-1 pl-6">{d}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <Field label="Full name" error={errs.name}>
          {(p) => <input {...p} className={inp} value={f.name} onChange={set('name')} autoComplete="name" />}
        </Field>

        {f.role === 'employer' && (
          <Field label="Company / Organization name" error={errs.company}>
            {(p) => <input {...p} className={inp} value={f.company} onChange={set('company')} />}
          </Field>
        )}

        <Field label="Email address" error={errs.email}>
          {(p) => <input {...p} type="email" className={inp} value={f.email} onChange={set('email')} autoComplete="email" />}
        </Field>

        <Field label="Password" hint="At least 8 characters required." error={errs.password}>
          {(p) => (
            <div className="flex gap-2">
              <input
                {...p}
                type={show ? 'text' : 'password'}
                className={inp}
                value={f.password}
                onChange={set('password')}
                autoComplete="new-password"
              />
              <Btn
                v="ghost"
                onClick={() => setShow(!show)}
                aria-label={show ? 'Hide password' : 'Show password'}
                aria-pressed={show}
                className="!px-3"
              >
                {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </Btn>
            </div>
          )}
        </Field>

        <Btn type="submit" disabled={loading} className="w-full !py-2.5">
          {loading ? 'Creating account...' : 'Complete registration'}
        </Btn>

        <p className="text-center text-xs text-muted pt-2">
          Already registered?{' '}
          <Link className="font-bold text-brand underline decoration-accent/60" to="/login">
            Log in to existing account
          </Link>
        </p>
      </form>
    </Card>
  );
}
