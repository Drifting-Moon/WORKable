import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Accessibility, LogOut, Palette, Check, ChevronDown, Moon, Sun, Sparkles, Flame, Eye } from 'lucide-react';
import { useApp } from './store.jsx';
import { Btn, cx } from './ui.jsx';
import { canAccess } from './services/db';
import { Landing, Login, Register } from './pages/Public.jsx';
import { JobsPage, JobDetail, SeekerHome, Saved, Applications, Profile, Resumes, MyReports } from './pages/Seeker.jsx';
import { EmpHome, EmpJobs, JobForm, Applicants, Verification, EmpEvidence, EmpDisputes } from './pages/Employer.jsx';
import { Admin } from './pages/Admin.jsx';
import { AccessibilityDrawer, AccessibilityOverlays } from './AccessibilitySettings.jsx';

export const THEMES = [
  { id: 'midnight', label: 'Midnight Obsidian', badge: 'Dark', icon: Moon, dot: 'bg-sky-400' },
  { id: 'default', label: 'Clean Slate', badge: 'Light', icon: Sun, dot: 'bg-blue-600' },
  { id: 'emerald', label: 'Nordic Forest', badge: 'Pine', icon: Sparkles, dot: 'bg-emerald-400' },
  { id: 'warm', label: 'Warm Sand', badge: 'Editorial', icon: Flame, dot: 'bg-amber-600' },
  { id: 'oled', label: 'OLED Pure Black', badge: 'High Contrast', icon: Eye, dot: 'bg-yellow-400' },
];

function ThemeMenu() {
  const { prefs, updatePref } = useApp();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const currentTheme = prefs.theme || 'midnight';
  const active = THEMES.find((t) => t.id === currentTheme) || THEMES[0];
  const Icon = active.icon;

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-line bg-soft/80 px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:bg-soft transition shadow-2xs cursor-pointer"
        aria-label="Change color mode"
        aria-expanded={open}
      >
        <span className={`h-2 w-2 rounded-full ${active.dot} animate-pulse`} />
        <Icon size={14} className="text-muted" />
        <span className="hidden sm:inline">{active.label}</span>
        <ChevronDown size={13} className="text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-xl z-50 backdrop-blur-md">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted border-b border-line/60">
            Color Themes
          </div>
          <div className="py-1 space-y-0.5">
            {THEMES.map((t) => {
              const isSel = currentTheme === t.id;
              const TIcon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    updatePref('theme', t.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    isSel ? 'bg-soft text-brand font-bold' : 'text-ink hover:bg-soft/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} />
                    <TIcon size={14} className={isSel ? 'text-brand' : 'text-muted'} />
                    <span>{t.label}</span>
                  </div>
                  {isSel && <Check size={14} className="text-brand shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const homeOf = (u) => (u ? '/' + u.role : '/');
const NAV = {
  seeker: [
    ['/seeker', 'Dashboard'],
    ['/jobs', 'Find jobs'],
    ['/seeker/resumes', 'My CVs'],
    ['/seeker/saved', 'Saved'],
    ['/seeker/applications', 'Applications'],
    ['/seeker/reports', 'Disputes'],
    ['/seeker/profile', 'Profile'],
  ],
  employer: [
    ['/employer', 'Dashboard'],
    ['/employer/jobs', 'My jobs'],
    ['/employer/applicants', 'Applicants'],
    ['/employer/evidence', 'Evidence'],
    ['/employer/disputes', 'Disputes'],
    ['/employer/verification', 'Verification'],
  ],
  admin: [
    ['/admin', 'Admin Console'],
    ['/jobs', 'Browse jobs'],
  ],
};

// Route guard: wrong role or logged out => redirected, even if the URL is typed by hand.
function Guard({ role }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return canAccess(user, role) ? <Outlet /> : <Navigate to={homeOf(user)} replace />;
}

// Signed-in users should not accidentally land back on login/registration pages.
function GuestOnly() {
  const { user } = useApp();
  return user ? <Navigate to={homeOf(user)} replace /> : <Outlet />;
}

function Layout() {
  const { user, logout, toast, prefs } = useApp();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const links = user ? NAV[user.role] : [['/jobs', 'Find jobs'], ['/register?role=employer', 'For employers']];
  // Keep the desktop header focused on the three most-used destinations.
  const primaryLinks = links.slice(0, 3);
  const secondaryLinks = links.slice(3);
  const moreIsActive = secondaryLinks.some(([to]) => location.pathname === to || (to !== '/' && location.pathname.startsWith(to + '/')));
  const lc = ({ isActive }) =>
    cx(
      'rounded-md px-3 py-1.5 text-sm font-semibold transition-all duration-150',
      isActive
        ? 'bg-soft text-brand shadow-xs'
        : 'text-muted hover:text-ink hover:bg-soft/60'
    );
  const asidePos = prefs.asidePosition || 'right';

  return (
    <div className="flex min-h-screen flex-col relative bg-paper selection:bg-accent-soft selection:text-ink">
      <a
        href="#main"
        className="absolute -top-20 left-4 z-50 rounded-lg bg-brand px-4 py-2 font-bold text-white shadow-lg focus:top-3 transition-all"
      >
        Skip to main content
      </a>

      {/* Top Editorial Header */}
      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex items-center gap-6">
            <Link to={homeOf(user)} className="group flex items-baseline gap-1.5 focus-visible:rounded-md">
              <span className="font-display text-2xl font-bold tracking-tight text-brand">
                Work<span className="font-normal italic text-accent group-hover:underline">Able</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest text-muted/70 border-l border-line pl-2 ml-1">
                Inclusive Careers
              </span>
            </Link>
          </div>

          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
            {primaryLinks.map(([to, l]) => (
              <NavLink key={l} to={to} end className={lc}>
                {l}
              </NavLink>
            ))}
            {secondaryLinks.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  className={cx('topnav-more', moreIsActive && 'topnav-more-active')}
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  onClick={() => setMoreOpen((value) => !value)}
                  onKeyDown={(event) => { if (event.key === 'Escape') setMoreOpen(false); }}
                >
                  More <ChevronDown size={14} aria-hidden="true" />
                </button>
                {moreOpen && (
                  <>
                    <button className="fixed inset-0 z-40 cursor-default" aria-label="Close navigation menu" onClick={() => setMoreOpen(false)} tabIndex={-1} />
                    <div className="topnav-menu" role="menu" aria-label="More destinations">
                      {secondaryLinks.map(([to, label]) => (
                        <NavLink key={label} to={to} end className={({ isActive }) => cx('topnav-menu-link', isActive && 'topnav-menu-link-active')} role="menuitem" onClick={() => setMoreOpen(false)}>
                          {label}
                        </NavLink>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeMenu />

            <Btn
              v="ghost"
              onClick={() => setOpen(true)}
              className="!px-3 !py-1.5 text-xs sm:text-sm min-h-9 border-line/90"
              aria-label="Open accessibility preferences drawer"
            >
              <Accessibility size={16} className="text-brand" aria-hidden="true" />
              <span className="hidden sm:inline">Accessibility</span>
            </Btn>

            {user ? (
              <Btn
                v="ghost"
                onClick={logout}
                className="!px-3 !py-1.5 text-xs sm:text-sm min-h-9 text-muted hover:text-bad"
                aria-label="Log out"
              >
                <LogOut size={15} aria-hidden="true" />
                <span className="hidden sm:inline">Log out</span>
              </Btn>
            ) : (
              <>
                <Btn
                  v="ghost"
                  as={Link}
                  to="/login"
                  className="!px-3 !py-1.5 text-xs sm:text-sm min-h-9 border-line/90"
                >
                  Log in
                </Btn>
                <Btn
                  as={Link}
                  to="/register"
                  className="!px-3.5 !py-1.5 text-xs sm:text-sm min-h-9 shadow-xs"
                >
                  Sign up
                </Btn>
              </>
            )}
          </div>
        </div>

        {/* Mobile secondary navigation strip */}
        <nav aria-label="Mobile navigation" className="lg:hidden border-t border-line/50 px-4 py-2.5 flex items-center gap-2 overflow-x-auto text-xs">
          {primaryLinks.map(([to, label]) => (
            <NavLink key={label} to={to} end className={lc}>
              {label}
            </NavLink>
          ))}
          {secondaryLinks.length > 0 && (
            <div className="relative shrink-0">
              <button type="button" className={cx('topnav-more', moreIsActive && 'topnav-more-active')} aria-expanded={moreOpen} aria-haspopup="menu" onClick={() => setMoreOpen((value) => !value)} onKeyDown={(event) => { if (event.key === 'Escape') setMoreOpen(false); }}>
                More <ChevronDown size={14} aria-hidden="true" />
              </button>
              {moreOpen && (
                <>
                <button className="fixed inset-0 z-40 cursor-default" aria-label="Close navigation menu" onClick={() => setMoreOpen(false)} tabIndex={-1} />
                <div className="topnav-menu topnav-menu-mobile" role="menu" aria-label="More destinations">
                  {secondaryLinks.map(([to, label]) => (
                    <NavLink key={label} to={to} end className={({ isActive }) => cx('topnav-menu-link', isActive && 'topnav-menu-link-active')} role="menuitem" onClick={() => setMoreOpen(false)}>
                      {label}
                    </NavLink>
                  ))}
                </div>
                </>
              )}
            </div>
          )}
        </nav>
      </header>

      {/* Main Content Area */}
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-10">
        <Outlet />
      </main>

      {/* Editorial Colophon / Footer */}
      <footer className="border-t border-line bg-soft/50 text-ink">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2 space-y-3">
              <Link to="/" className="font-display text-2xl font-bold tracking-tight text-brand">
                Work<span className="font-normal italic text-accent">Able</span>
              </Link>
              <p className="text-sm text-muted max-w-md leading-relaxed">
                A clearer job search experience with employer-declared accommodations, visible evidence status, and a way for candidates to report misleading accessibility claims.
              </p>
              <div className="pt-2 text-xs font-semibold text-brand/80">
                CSE3132 Software Engineering Lab Academic Demonstration
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="font-display text-sm font-bold uppercase tracking-wider text-ink">Navigation</p>
              <ul className="space-y-2 text-sm text-muted">
                <li>
                  <Link to="/jobs" className="hover:text-brand hover:underline">
                    Browse All Opportunities
                  </Link>
                </li>
                <li>
                  <Link to="/register?role=employer" className="hover:text-brand hover:underline">
                    Employer Partnerships
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-brand hover:underline">
                    Demo Sign In
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="font-display text-sm font-bold uppercase tracking-wider text-ink">Accessibility</p>
              <ul className="space-y-2 text-sm text-muted">
                <li>
                  <button
                    onClick={() => setOpen(true)}
                    className="text-left hover:text-brand hover:underline cursor-pointer"
                  >
                    Display & Font Controls
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setOpen(true)}
                    className="text-left hover:text-brand hover:underline cursor-pointer"
                  >
                    High Contrast & Screen Tools
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-line/60 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
            <p>© 2026 WorkAble. Fictional demo dataset for academic evaluation. Not a certified auditing body.</p>
            <p className="italic">Designed for clarity, dignified disclosure, and human warmth.</p>
          </div>
        </div>
      </footer>

      {/* Floating Quick-Access Launcher Button - Cohesive with Editorial Palette */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Accessibility Settings"
        className={`fixed bottom-6 z-40 flex items-center gap-2.5 rounded-full bg-brand px-4 py-2.5 text-paper shadow-lg hover:bg-brand-d hover:shadow-xl active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 font-semibold border border-white/10 ${
          asidePos === 'left' ? 'left-6' : 'right-6'
        }`}
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-paper/15 text-accent-soft">
          <Accessibility size={15} aria-hidden="true" />
        </span>
        <span className="text-xs sm:text-sm tracking-tight">Accessibility</span>
      </button>

      {/* Full Accessibility Settings Drawer & Overlays */}
      <AccessibilityDrawer open={open} onClose={() => setOpen(false)} />
      <AccessibilityOverlays />

      {/* Toast Notification */}
      <div role="status" aria-live="polite" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        {toast && (
          <div
            key={toast.k}
            className={cx(
              'rounded-xl px-5 py-3 font-semibold text-sm shadow-xl border transition-all animate-bounce-short',
              toast.err
                ? 'bg-bad text-white border-bad'
                : 'bg-brand text-[#fbf9f5] border-brand-d'
            )}
          >
            {toast.err ? 'Error: ' : '✓ '}
            {toast.m}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route path="/jobs" element={<JobsPage />} /><Route path="/jobs/:id" element={<JobDetail />} />
        <Route element={<Guard role="seeker" />}>
          <Route path="/seeker" element={<SeekerHome />} />
          <Route path="/seeker/saved" element={<Saved />} />
          <Route path="/seeker/applications" element={<Applications />} />
          <Route path="/seeker/resumes" element={<Resumes />} />
          <Route path="/seeker/reports" element={<MyReports />} />
          <Route path="/seeker/profile" element={<Profile />} />
        </Route>
        <Route element={<Guard role="employer" />}>
          <Route path="/employer" element={<EmpHome />} />
          <Route path="/employer/jobs" element={<EmpJobs />} />
          <Route path="/employer/jobs/new" element={<JobForm />} />
          <Route path="/employer/jobs/:id/edit" element={<JobForm />} />
          <Route path="/employer/applicants" element={<Applicants />} />
          <Route path="/employer/evidence" element={<EmpEvidence />} />
          <Route path="/employer/disputes" element={<EmpDisputes />} />
          <Route path="/employer/verification" element={<Verification />} />
        </Route>
        <Route element={<Guard role="admin" />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
