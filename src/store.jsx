import { createContext, useContext, useEffect, useState } from 'react';
import {
  load,
  save,
  reset,
  loginUser,
  toggleSaved,
  submitAccessibilityReport,
  updateReportStatus,
  submitEmployerDisputeResponse,
  submitAccessibilityEvidence,
  reviewAccessibilityEvidence,
  manageResume,
  withdrawApplication,
  getAccessibilityTrustBadge,
  saveJob,
  deleteJob,
  deleteUserAccount,
  deleteAccessibilityEvidence,
} from './services/db';
import {
  isSupabaseConfigured,
  supabase,
  signInWithSupabase,
  signUpWithSupabase,
  signOutWithSupabase,
  fetchUserProfile,
  updateUserProfile,
  fetchJobsSupabase,
  createJobSupabase,
  updateJobSupabase,
  deleteJobSupabase,
  uploadResumeStorage,
  getSignedResumeUrl,
  deleteResumeSupabase,
  submitAccessibilityReportSupabase,
  fetchAccessibilityReportsSupabase,
  updateAccessibilityReportSupabase,
  fetchEvidenceSupabase,
  submitEvidenceSupabase,
  updateEvidenceSupabase,
  deleteAccessibilityEvidenceSupabase,
  fetchApplicationsSupabase,
  updateApplicationStatusSupabase,
  withdrawApplicationSupabase,
  fetchSavedJobsSupabase,
  toggleSavedJobSupabase,
  deleteUserAccountSupabase,
} from './services/supabase';

const Ctx = createContext();
export const useApp = () => useContext(Ctx);

export const DEFAULT_PREFS = {
  theme: 'midnight',
  asidePosition: 'right',
  fullWidth: false,
  contentScaling: 100,
  fontSize: 100,
  textSpacing: 100,
  textAlign: 'left',
  contrastMode: 'none',
  highlightLinks: false,
  highlightHeadings: false,
  focusRing: false,
  cursor: 'default',
  readingRuler: false,
  readingMask: false,
  textToSpeech: false,
  dyslexicFont: false,
  still: false,
  personas: {},
};

export const normalizeProfile = (prof = {}) => ({
  phone: prof?.phone || '',
  summary: prof?.summary || '',
  education: prof?.education || '',
  experience: prof?.experience || '',
  skills: Array.isArray(prof?.skills) ? prof.skills : [],
  locations: Array.isArray(prof?.locations) ? prof.locations : [],
  arrangements: Array.isArray(prof?.arrangements) ? prof.arrangements : [],
  accessPrefs: Array.isArray(prof?.accessPrefs)
    ? prof.accessPrefs
    : (Array.isArray(prof?.access_prefs) ? prof.access_prefs : []),
  resumeName: prof?.resumeName || prof?.resume_name || '',
});

export const resolveRole = (prof, su) => {
  const profRole = (prof?.role || '').toLowerCase().trim();
  const metaRole = (su?.user_metadata?.role || su?.app_metadata?.role || '').toLowerCase().trim();
  const hasCompany = !!(prof?.company || su?.user_metadata?.company);

  if (profRole === 'admin' || metaRole === 'admin') return 'admin';
  if (profRole === 'employer' || metaRole === 'employer' || hasCompany) return 'employer';
  if (profRole === 'seeker' || metaRole === 'seeker') return 'seeker';
  return 'seeker';
};

export const buildFullUser = (su, prof) => {
  const resolvedRole = resolveRole(prof, su);
  const resolvedCompany = prof?.company || su?.user_metadata?.company || null;
  return {
    id: su.id,
    name: prof?.name || su.user_metadata?.name || su.email.split('@')[0],
    email: su.email,
    role: resolvedRole,
    company: resolvedCompany,
    suspended: prof?.suspended || false,
    profile: normalizeProfile(prof),
  };
};

export function AppProvider({ children }) {
  const [db, setDb] = useState(load);
  const [uid, setUid] = useState(() => localStorage.getItem('workable_session'));
  const [realUser, setRealUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => isSupabaseConfigured());
  const [toast, setToast] = useState(null);
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('workable_prefs'));
      return saved ? { ...DEFAULT_PREFS, ...saved } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  const rawUser = realUser || db.users.find((u) => u.id === uid && !u.suspended) || null;
  const user = rawUser
    ? {
        ...rawUser,
        profile: normalizeProfile(rawUser.profile),
      }
    : null;

  // Supabase Auth listener
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setAuthLoading(false);
      return;
    }

    const syncSupabaseSession = async (session) => {
      // If current stored session is a demo persona (e.g. u_e1, u_admin), don't let background Supabase overwrite it
      const currentStoredUid = localStorage.getItem('workable_session');
      const isDemoSession = currentStoredUid && currentStoredUid.startsWith('u_');

      if (session?.user && !isDemoSession) {
        const su = session.user;
        const prof = await fetchUserProfile(su.id);
        const fullUser = buildFullUser(su, prof);

        // Sync missing profile or role back to Supabase profiles table
        if (supabase && (!prof || prof.role !== fullUser.role)) {
          try {
            await supabase.from('profiles').upsert({
              id: su.id,
              name: fullUser.name,
              email: su.email,
              role: fullUser.role,
              company: fullUser.company,
              updated_at: new Date().toISOString(),
            });
          } catch {
            /* ignore */
          }
        }

        setDb((prev) => {
          const idx = prev.users.findIndex((x) => x.id === fullUser.id);
          const nextUsers = idx >= 0
            ? prev.users.map((x) => (x.id === fullUser.id ? { ...x, ...fullUser } : x))
            : [...prev.users, fullUser];
          const next = { ...prev, users: nextUsers };
          save(next);
          return next;
        });

        setRealUser(fullUser);
        setUid(fullUser.id);

        if (fullUser.role === 'seeker') {
          fetchSavedJobsSupabase(fullUser.id).then((savedIds) => {
            if (savedIds && savedIds.length > 0) {
              setDb((prev) => {
                const currentSaved = prev.saved || [];
                const otherUsersSaved = currentSaved.filter((s) => s.seekerId !== fullUser.id);
                const userSaved = savedIds.map((jobId) => ({ seekerId: fullUser.id, jobId }));
                const next = { ...prev, saved: [...otherUsersSaved, ...userSaved] };
                save(next);
                return next;
              });
            }
          });
        }
      } else if (!isDemoSession) {
        setRealUser(null);
      }
      setAuthLoading(false);
      syncAppsFromSupabase();
    };

    const syncAppsFromSupabase = async () => {
      try {
        const suApps = await fetchApplicationsSupabase();
        if (suApps && suApps.length > 0) {
          setDb((prev) => {
            const formattedApps = suApps.map((a) => ({
              id: a.id,
              seekerId: a.seeker_id,
              jobId: a.job_id,
              resumeId: a.resume_id,
              cover: a.cover || '',
              resume: a.resume || '',
              status: a.status || 'Applied',
              appliedAt: a.applied_at,
              updatedAt: a.updated_at,
              profiles: a.profiles,
              jobs: a.jobs,
            }));

            const existingUserIds = new Set(prev.users.map((u) => u.id));
            const newUsers = [];
            for (const a of suApps) {
              if (a.profiles && !existingUserIds.has(a.profiles.id)) {
                existingUserIds.add(a.profiles.id);
                newUsers.push({
                  id: a.profiles.id,
                  name: a.profiles.name || 'Applicant',
                  email: a.profiles.email || '',
                  role: a.profiles.role || 'seeker',
                  suspended: false,
                  profile: {
                    phone: a.profiles.phone || '',
                    summary: a.profiles.summary || '',
                    skills: a.profiles.skills || [],
                    education: a.profiles.education || '',
                    experience: a.profiles.experience || '',
                    locations: a.profiles.locations || [],
                    arrangements: a.profiles.arrangements || [],
                    accessPrefs: a.profiles.access_prefs || [],
                    resumeName: a.resume || a.profiles.resume_name || '',
                  },
                });
              }
            }

            const appIds = new Set(formattedApps.map((a) => a.id));
            const retained = (prev.applications || []).filter((a) => !appIds.has(a.id));
            const next = {
              ...prev,
              applications: [...formattedApps, ...retained],
              users: [...prev.users, ...newUsers],
            };
            save(next);
            return next;
          });
        }
      } catch (err) {
        console.warn('Failed to sync applications from Supabase:', err);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSupabaseSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSupabaseSession(session);
    });

    fetchJobsSupabase().then((suJobs) => {
      if (suJobs && suJobs.length > 0) {
        setDb((prev) => {
          const formatted = suJobs.map((j) => ({
            id: j.id,
            employerId: j.employer_id,
            companyId: j.company_id,
            title: j.title,
            desc: j.desc,
            location: j.location,
            type: j.type,
            arrangement: j.arrangement,
            salaryMin: j.salary_min,
            salaryMax: j.salary_max,
            skills: j.skills || [],
            tags: j.tags || [],
            resp: j.resp || [],
            qual: j.qual || '',
            active: j.active !== false,
            status: j.status || 'Published',
            postedAt: j.posted_at,
          }));
          return { ...prev, jobs: formatted };
        });
      }
    });

    fetchAccessibilityReportsSupabase().then((suReports) => {
      if (suReports && suReports.length > 0) {
        setDb((prev) => {
          const formatted = suReports.map((r) => ({
            id: r.id,
            caseNumber: r.case_number,
            reporterId: r.reporter_id,
            isAnonymous: r.is_anonymous,
            jobId: r.job_id,
            companyId: r.company_id,
            employerId: r.employer_id,
            claimType: r.claim_type,
            disputedAccommodation: r.disputed_accommodation,
            description: r.description,
            evidenceUrl: r.evidence_url,
            status: r.case_status,
            employerResponse: r.employer_response,
            adminNotes: r.admin_notes,
            resolutionAction: r.resolution_action,
            createdAt: r.created_at,
          }));
          const existingIds = new Set(formatted.map((x) => x.id));
          const retained = (prev.reports || []).filter((x) => !existingIds.has(x.id));
          const next = { ...prev, reports: [...formatted, ...retained] };
          save(next);
          return next;
        });
      }
    });

    fetchEvidenceSupabase().then((suEv) => {
      if (suEv && suEv.length > 0) {
        setDb((prev) => {
          const formatted = suEv.map((e) => ({
            id: e.id,
            companyId: e.company_id,
            facilityType: e.facility_type,
            label: e.label,
            description: e.description,
            evidenceType: e.evidence_type,
            documentUrl: e.document_url,
            status: e.verification_status,
            reviewerNotes: e.reviewer_notes,
            verifiedBy: e.verified_by,
            reviewedAt: e.verified_at,
            submittedAt: e.created_at,
          }));
          const existingIds = new Set(formatted.map((x) => x.id));
          const retained = (prev.evidence || []).filter((x) => !existingIds.has(x.id));
          const next = { ...prev, evidence: [...formatted, ...retained] };
          save(next);
          return next;
        });
      }
    });

    syncAppsFromSupabase();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const h = document.documentElement;
    const personas = prefs.personas || {};

    // 1. Calculate effective Font Size
    let effectiveFontSize = prefs.fontSize || 100;
    if (personas.elderly && effectiveFontSize < 120) effectiveFontSize = 120;
    if (personas.lowVision && effectiveFontSize < 125) effectiveFontSize = 125;
    h.style.fontSize = `${effectiveFontSize}%`;

    // 2. Calculate effective Text Spacing
    let effectiveSpacing = prefs.textSpacing || 100;
    if (personas.dyslexia && effectiveSpacing < 125) effectiveSpacing = 125;
    if (personas.astigmatism && effectiveSpacing < 120) effectiveSpacing = 120;
    const factor = effectiveSpacing / 100;
    h.style.setProperty('--a11y-line-height', `${1.6 * factor}`);
    h.style.setProperty('--a11y-letter-spacing', `${(effectiveSpacing - 100) * 0.0025}em`);
    h.style.setProperty('--a11y-word-spacing', `${(effectiveSpacing - 100) * 0.006}em`);

    // 3. Content Scaling on #main. CSS zoom participates in layout; transform:scale()
    // only paints larger pixels and can overlap/clamp adjacent content at high zoom.
    let effectiveScale = (prefs.contentScaling || 100) / 100;
    if (personas.lowVision && effectiveScale < 1.15) effectiveScale = 1.15;
    const mainEl = document.getElementById('main');
    if (mainEl) {
      mainEl.style.zoom = String(effectiveScale);
      mainEl.style.transform = 'none';
    }

    // 4. Remove all accessibility classes first so turning OFF an option cleanly removes it
    h.classList.remove(
      'dark',
      'hc',
      'a11y-fullwidth',
      'a11y-align-left',
      'a11y-align-center',
      'a11y-align-right',
      'a11y-monochrome',
      'a11y-low-sat',
      'a11y-high-sat',
      'a11y-low-contrast',
      'a11y-high-contrast',
      'a11y-inverted',
      'a11y-hl-links',
      'a11y-hl-headings',
      'a11y-focus-ring',
      'a11y-dyslexia',
      'a11y-cursor-big-black',
      'a11y-cursor-big-white',
      'still',
      'a11y-no-motion',
      'ul',
      'readable'
    );

    // 5. Theme / Color Modes
    h.classList.remove('dark', 'theme-midnight', 'theme-emerald', 'theme-warm', 'theme-oled', 'theme-default');
    const t = prefs.theme || 'default';
    if (t === 'midnight' || t === 'dark') {
      h.classList.add('dark', 'theme-midnight');
    } else if (t === 'emerald') {
      h.classList.add('dark', 'theme-emerald');
    } else if (t === 'warm') {
      h.classList.add('theme-warm');
    } else if (t === 'oled') {
      h.classList.add('dark', 'theme-oled');
    } else if (t === 'default') {
      h.classList.add('theme-default');
    } else if (t === 'auto') {
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        h.classList.add('dark', 'theme-midnight');
      } else {
        h.classList.add('theme-default');
      }
    }

    // 6. Full Width
    if (prefs.fullWidth) h.classList.add('a11y-fullwidth');

    // 7. Text Alignment
    const align = prefs.textAlign || (personas.dyslexia ? 'left' : 'left');
    if (align === 'center') h.classList.add('a11y-align-center');
    else if (align === 'right') h.classList.add('a11y-align-right');
    else if (align === 'left' && prefs.textAlign) h.classList.add('a11y-align-left');

    // 8. Contrast mode
    let cMode = prefs.contrastMode && prefs.contrastMode !== 'none' ? prefs.contrastMode : null;
    if (!cMode) {
      if (personas.colorBlindness || personas.lowVision) cMode = 'high-contrast';
      else if (personas.astigmatism) cMode = 'low-contrast';
    }
    if (cMode === 'monochrome') h.classList.add('a11y-monochrome');
    else if (cMode === 'low-saturation') h.classList.add('a11y-low-sat');
    else if (cMode === 'high-saturation') h.classList.add('a11y-high-sat');
    else if (cMode === 'low-contrast') h.classList.add('a11y-low-contrast');
    else if (cMode === 'high-contrast') {
      h.classList.add('a11y-high-contrast');
      h.classList.add('hc');
    } else if (cMode === 'inverted') h.classList.add('a11y-inverted');

    // 9. Highlights
    const hlLinks = !!prefs.highlightLinks || !!personas.elderly;
    if (hlLinks) h.classList.add('a11y-hl-links');

    const hlHeadings = !!prefs.highlightHeadings || !!personas.adhd;
    if (hlHeadings) h.classList.add('a11y-hl-headings');

    const focusRing =
      !!prefs.focusRing ||
      !!personas.keyboardNav ||
      !!personas.motor ||
      !!personas.blindness;
    if (focusRing) h.classList.add('a11y-focus-ring');

    // 10. Dyslexia font
    const dyslexia = !!prefs.dyslexicFont || !!personas.dyslexia;
    if (dyslexia) h.classList.add('a11y-dyslexia');

    // 11. Cursor
    if (prefs.cursor === 'big-black') h.classList.add('a11y-cursor-big-black');
    else if (prefs.cursor === 'big-white') h.classList.add('a11y-cursor-big-white');

    // 12. Motion reduction
    const noMotion = !!prefs.still || !!personas.epilepsy || !!personas.seizureSafe;
    if (noMotion) {
      h.classList.add('still');
      h.classList.add('a11y-no-motion');
    }

    // Save cleaned preferences
    localStorage.setItem('workable_prefs', JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = (m, err = false) => setToast({ m, err, k: Date.now() });

  const resetAccessibility = () => {
    const fresh = {
      theme: 'default',
      asidePosition: 'right',
      fullWidth: false,
      contentScaling: 100,
      fontSize: 100,
      textSpacing: 100,
      textAlign: 'left',
      contrastMode: 'none',
      highlightLinks: false,
      highlightHeadings: false,
      focusRing: false,
      cursor: 'default',
      readingRuler: false,
      readingMask: false,
      textToSpeech: false,
      dyslexicFont: false,
      still: false,
      personas: {},
    };
    setPrefs(fresh);
    localStorage.setItem('workable_prefs', JSON.stringify(fresh));
    // Ensure all styles/classes reset immediately on DOM
    const h = document.documentElement;
    h.style.fontSize = '100%';
    h.style.removeProperty('--a11y-line-height');
    h.style.removeProperty('--a11y-letter-spacing');
    h.style.removeProperty('--a11y-word-spacing');
    const mainEl = document.getElementById('main');
    if (mainEl) { mainEl.style.transform = 'none'; mainEl.style.zoom = '1'; }
    h.classList.remove(
      'dark',
      'hc',
      'a11y-fullwidth',
      'a11y-align-left',
      'a11y-align-center',
      'a11y-align-right',
      'a11y-monochrome',
      'a11y-low-sat',
      'a11y-high-sat',
      'a11y-low-contrast',
      'a11y-high-contrast',
      'a11y-inverted',
      'a11y-hl-links',
      'a11y-hl-headings',
      'a11y-focus-ring',
      'a11y-dyslexia',
      'a11y-cursor-big-black',
      'a11y-cursor-big-white',
      'still',
      'a11y-no-motion',
      'ul',
      'readable'
    );
    window.speechSynthesis?.cancel();
    notify('All accessibility features turned off.');
  };

  // act(): run a business rule on a copy of the DB, then save.
  const act = (fn, raw = false) => {
    const d = structuredClone(db);
    try {
      const r = fn(d);
      save(d);
      setDb(d);
      return r;
    } catch (e) {
      if (raw) throw e;
      notify(e.message, true);
    }
  };

  const login = async (email, pw) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // If Supabase is configured and it's NOT an academic demo account, use Supabase Auth
    if (isSupabaseConfigured() && !cleanEmail.endsWith('@workable.demo')) {
      const data = await signInWithSupabase(cleanEmail, pw);
      const su = data.user;
      const prof = await fetchUserProfile(su.id);
      const fullUser = buildFullUser(su, prof);

      // Ensure Supabase profiles table has the role matching user_metadata/profile
      if (supabase && (!prof || prof.role !== fullUser.role)) {
        try {
          await supabase.from('profiles').upsert({
            id: su.id,
            name: fullUser.name,
            email: su.email,
            role: fullUser.role,
            company: fullUser.company,
            updated_at: new Date().toISOString(),
          });
        } catch {
          /* ignore */
        }
      }

      setDb((prev) => {
        const idx = prev.users.findIndex((x) => x.id === fullUser.id);
        const nextUsers = idx >= 0
          ? prev.users.map((x) => (x.id === fullUser.id ? { ...x, ...fullUser } : x))
          : [...prev.users, fullUser];
        const next = { ...prev, users: nextUsers };
        save(next);
        return next;
      });
      localStorage.setItem('workable_session', fullUser.id);
      setRealUser(fullUser);
      setUid(fullUser.id);
      return fullUser;
    }

    // Demo account or Supabase not configured fallback
    try {
      if (isSupabaseConfigured() && supabase) {
        try {
          await signOutWithSupabase();
        } catch {
          /* ignore */
        }
      }
      const u = loginUser(db, cleanEmail, pw);
      localStorage.setItem('workable_session', u.id);
      setRealUser(u);
      setUid(u.id);
      return u;
    } catch (err) {
      // If demo login fails but Supabase is configured, try Supabase as well
      if (isSupabaseConfigured()) {
        const data = await signInWithSupabase(cleanEmail, pw);
        const su = data.user;
        const prof = await fetchUserProfile(su.id);
        const fullUser = buildFullUser(su, prof);
        setDb((prev) => {
          const idx = prev.users.findIndex((x) => x.id === fullUser.id);
          const nextUsers = idx >= 0
            ? prev.users.map((x) => (x.id === fullUser.id ? { ...x, ...fullUser } : x))
            : [...prev.users, fullUser];
          const next = { ...prev, users: nextUsers };
          save(next);
          return next;
        });
        localStorage.setItem('workable_session', fullUser.id);
        setRealUser(fullUser);
        setUid(fullUser.id);
        return fullUser;
      }
      throw err;
    }
  };

  const register = async (formData) => {
    if (isSupabaseConfigured()) {
      const data = await signUpWithSupabase(formData);
      const su = data.user;
      if (!su) throw new Error('Failed to create account.');

      const fullUser = {
        id: su.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        company: formData.role === 'employer' ? formData.company?.trim() : null,
        suspended: false,
        profile: normalizeProfile({}),
      };

      setDb((prev) => {
        const next = { ...prev, users: [...prev.users, fullUser] };
        save(next);
        return next;
      });

      if (data.session) {
        setRealUser(fullUser);
        setUid(fullUser.id);
      }

      return { user: fullUser, session: data.session };
    } else {
      const { registerUser } = await import('./services/db');
      const u = act((d) => registerUser(d, formData), true);
      loginAs(u);
      return { user: u, session: true };
    }
  };

  const loginAs = (u) => {
    localStorage.setItem('workable_session', u.id);
    setRealUser(u);
    setUid(u.id);
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await signOutWithSupabase();
    }
    localStorage.removeItem('workable_session');
    setRealUser(null);
    setUid(null);
    notify('You have been logged out.');
  };

  const toggleSave = async (jobId) => {
    if (user?.role !== 'seeker') return notify('Log in as a Job Seeker to save jobs.', true);
    const liveAccount = isSupabaseConfigured() && user?.id && !user.email?.toLowerCase().endsWith('@workable.demo');
    if (liveAccount) {
      try {
        const isNowSaved = await toggleSavedJobSupabase(user.id, jobId);
        setDb((prev) => {
          const list = prev.saved || [];
          const nextSaved = isNowSaved
            ? [...list.filter((s) => !(s.seekerId === user.id && s.jobId === jobId)), { seekerId: user.id, jobId }]
            : list.filter((s) => !(s.seekerId === user.id && s.jobId === jobId));
          const next = { ...prev, saved: nextSaved };
          save(next);
          return next;
        });
        notify(isNowSaved ? 'Job saved.' : 'Job removed from saved.');
        return;
      } catch (err) {
        notify(`Could not update saved job in cloud: ${err.message}`, true);
        return;
      }
    }
    const on = act((d) => toggleSaved(d, user.id, jobId));
    if (on !== undefined) notify(on ? 'Job saved.' : 'Job removed from saved.');
  };

  const saveProfile = async (profileData) => {
    if (!user) return notify('Please sign in to save your profile.', true);
    const liveAccount = isSupabaseConfigured() && user?.id && !user.email?.toLowerCase().endsWith('@workable.demo');
    if (liveAccount) {
      try {
        await updateUserProfile(user.id, {
          name: profileData.name.trim(),
          phone: profileData.phone || '',
          summary: profileData.summary || '',
          education: profileData.education || '',
          experience: profileData.experience || '',
          arrangements: profileData.arrangements || [],
          access_prefs: profileData.accessPrefs || [],
          resume_name: profileData.resumeName || '',
          skills: profileData.skills || [],
          locations: profileData.locations || [],
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        notify(`Failed to save profile to database: ${err.message}`, true);
        return;
      }
    }

    act((d) => {
      const u = d.users.find((x) => x.id === user.id);
      if (u) {
        u.name = profileData.name.trim();
        u.profile = {
          phone: profileData.phone || '',
          summary: profileData.summary || '',
          education: profileData.education || '',
          experience: profileData.experience || '',
          arrangements: profileData.arrangements || [],
          accessPrefs: profileData.accessPrefs || [],
          resumeName: profileData.resumeName || '',
          skills: profileData.skills || [],
          locations: profileData.locations || [],
        };
      }
    });

    setRealUser((prev) =>
      prev
        ? {
            ...prev,
            name: profileData.name.trim(),
            profile: {
              ...(prev.profile || {}),
              phone: profileData.phone || '',
              summary: profileData.summary || '',
              education: profileData.education || '',
              experience: profileData.experience || '',
              arrangements: profileData.arrangements || [],
              accessPrefs: profileData.accessPrefs || [],
              resumeName: profileData.resumeName || '',
              skills: profileData.skills || [],
              locations: profileData.locations || [],
            },
          }
        : prev
    );

    notify('Profile successfully saved.');
  };

  const fileReport = async (report) => {
    if (!user) return notify('Please sign in to submit an accessibility dispute.', true);
    try {
      const liveAccount = isSupabaseConfigured() && user?.id && !user.email?.toLowerCase().endsWith('@workable.demo');
      if (liveAccount) {
        const row = await submitAccessibilityReportSupabase({
          reporter_id: report.isAnonymous ? null : user.id,
          is_anonymous: !!report.isAnonymous,
          job_id: report.jobId || null,
          employer_id: report.employerId || null,
          claim_type: report.claimType,
          disputed_accommodation: report.disputedAccommodation,
          description: report.description,
          evidence_url: report.evidenceUrl || '',
          case_status: 'Submitted',
        });
        const res = {
          id: row.id, caseNumber: row.case_number, reporterId: row.reporter_id,
          isAnonymous: row.is_anonymous, jobId: row.job_id, employerId: row.employer_id,
          claimType: row.claim_type, disputedAccommodation: row.disputed_accommodation,
          description: row.description, evidenceUrl: row.evidence_url,
          caseStatus: row.case_status, createdAt: row.created_at,
        };
        setDb((prev) => {
          const next = { ...prev, reports: [res, ...(prev.reports || []).filter((item) => item.id !== res.id)] };
          save(next);
          return next;
        });
        notify(`Dispute case ${res.caseNumber} submitted to review team.`);
        return res;
      }
      const res = act((d) => submitAccessibilityReport(d, user.id, report), true);
      notify(`Dispute case ${res.caseNumber} submitted to review team.`);
      return res;
    } catch (e) {
      notify(e.message, true);
      throw e;
    }
  };

  const updateCase = async (reportId, updates, adminNotes = '') => {
    if (user?.role !== 'admin') return notify('Admin permissions required.', true);
    try {
      const isLive = isSupabaseConfigured() && /^[0-9a-f-]{36}$/i.test(reportId);
      if (isLive) {
        await updateAccessibilityReportSupabase(reportId, {
          case_status: updates.status,
          admin_notes: adminNotes || updates.adminNotes || '',
          resolution_action: updates.freezeJob ? 'listing_suspended' : (updates.resolutionAction || 'none'),
          updated_at: new Date().toISOString(),
        });
        if (updates.freezeJob && updates.jobId) {
          await updateJobSupabase(updates.jobId, { status: 'Suspended_Fraud_Hold', active: false });
        }
      }
      const res = act((d) => updateReportStatus(d, reportId, user.id, updates), true);
      notify(`Case ${res.caseNumber || reportId} updated to: ${res.caseStatus || updates.status}`);
      return res;
    } catch (e) {
      notify(e.message, true);
      throw e;
    }
  };

  const respondToReport = async (reportId, responseText, evidenceAttachment = '') => {
    if (user?.role !== 'employer') return notify('Employer credentials required.', true);
    try {
      const isLive = isSupabaseConfigured() && /^[0-9a-f-]{36}$/i.test(reportId);
      if (isLive) {
        await updateAccessibilityReportSupabase(reportId, {
          employer_response: responseText,
          case_status: 'Under Review',
          employer_responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      const res = act((d) => submitEmployerDisputeResponse(d, reportId, user.id, { responseText, evidenceAttachment }), true);
      notify(`Formal response submitted for ${res.caseNumber}. Case moved to Under Review.`);
      return res;
    } catch (e) {
      notify(e.message, true);
      throw e;
    }
  };

  const addEvidence = async (evidenceData) => {
    if (user?.role !== 'employer') return notify('Employer permissions required.', true);
    try {
      const liveAccount = isSupabaseConfigured() && user?.id && !user.email?.toLowerCase().endsWith('@workable.demo');
      let liveRow = null;
      if (liveAccount) {
        liveRow = await submitEvidenceSupabase({
          company_id: user.companyId || null,
          facility_type: evidenceData.facilityType || 'Physical Facility',
          label: evidenceData.label || 'Accessibility Provision',
          description: evidenceData.description || '',
          evidence_type: evidenceData.evidenceType || 'Self-Reported',
          document_url: evidenceData.documentUrl || '',
          verification_status: 'Pending Review',
        });
      }
      const res = act((d) => {
        const item = submitAccessibilityEvidence(d, user.id, evidenceData);
        if (liveRow?.id) item.id = liveRow.id;
        return item;
      }, true);
      notify('Accessibility facility declaration recorded.');
      return res;
    } catch (e) {
      notify(e.message, true);
      throw e;
    }
  };

  const evaluateEvidence = async (evidenceId, approve, notes = '') => {
    if (user?.role !== 'admin') return notify('Admin permissions required.', true);
    try {
      const isLive = isSupabaseConfigured() && /^[0-9a-f-]{36}$/i.test(evidenceId);
      if (isLive) {
        await updateEvidenceSupabase(evidenceId, {
          verification_status: approve ? 'Evidence Verified' : 'Flagged',
          reviewer_notes: notes || '',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        });
      }
      const res = act((d) => reviewAccessibilityEvidence(d, evidenceId, user.id, approve, notes), true);
      notify(approve ? 'Facility evidence verified.' : 'Evidence rejected / unverified.');
      return res;
    } catch (e) {
      notify(e.message, true);
      throw e;
    }
  };

  const toggleUserSuspension = async (targetUserId, nextSuspended) => {
    if (user?.role !== 'admin') return notify('Admin permissions required.', true);
    try {
      const isLive = isSupabaseConfigured() && /^[0-9a-f-]{36}$/i.test(targetUserId);
      if (isLive) {
        await updateUserProfile(targetUserId, { suspended: nextSuspended });
      }
      const { setSuspended } = await import('./services/db');
      act((d) => setSuspended(d, targetUserId, nextSuspended));
      notify(nextSuspended ? 'Account suspended.' : 'Account access restored.');
    } catch (e) {
      notify(e.message, true);
      throw e;
    }
  };

  const addResume = async (payload) => {
    if (user?.role !== 'seeker') return notify('Job Seeker access required.', true);
    try {
      const liveAccount = isSupabaseConfigured() && user?.id && !user.email?.toLowerCase().endsWith('@workable.demo');
      if (liveAccount) {
        if (!payload.file) throw new Error('Choose a real CV file before uploading. A filename alone is not a file upload.');
        const row = await uploadResumeStorage(user.id, payload.file);
        if (!row?.id || !row?.storage_path) throw new Error('The CV upload did not return a saved storage record. Please try again.');
        payload.id = row.id;
        payload.storagePath = row.storage_path;
      }
      const res = act((d) => manageResume(d, user.id, 'upload', payload), true);
      notify('CV / Resume successfully added.');
      return res;
    } catch (e) {
      notify(e.message, true);
      throw e;
    }
  };

  const setPrimaryResume = (resumeId) => {
    if (user?.role !== 'seeker') return notify('Job Seeker access required.', true);
    act((d) => manageResume(d, user.id, 'set_primary', { resumeId }));
    notify('Primary resume updated.');
  };

  const removeResume = async (resumeId) => {
    if (user?.role !== 'seeker') return notify('Job Seeker access required.', true);
    const liveAccount = isSupabaseConfigured() && user?.id && !user.email?.toLowerCase().endsWith('@workable.demo');
    if (liveAccount) {
      try {
        await deleteResumeSupabase(resumeId);
      } catch (err) {
        notify(`Could not delete CV from cloud storage: ${err.message}`, true);
        return false;
      }
    }
    act((d) => manageResume(d, user.id, 'delete', { resumeId }));
    notify('Resume deleted.');
    return true;
  };

  const deleteJobListing = async (jobId) => {
    if (user?.role !== 'employer' && user?.role !== 'admin') {
      return notify('Employer or admin access required.', true);
    }
    const liveAccount = isSupabaseConfigured() && user?.id && !user.email?.toLowerCase().endsWith('@workable.demo');
    if (liveAccount) {
      try {
        await deleteJobSupabase(jobId, user.role === 'admin' ? null : user.id);
      } catch (err) {
        notify(`Could not delete listing from cloud: ${err.message}`, true);
        return false;
      }
    }
    act((d) => deleteJob(d, jobId, user.role === 'admin' ? (d.jobs.find((j) => j.id === jobId)?.employerId || user.id) : user.id));
    notify('Job listing permanently deleted.');
    return true;
  };

  const deleteEvidenceDeclaration = async (evidenceId) => {
    if (user?.role !== 'employer' && user?.role !== 'admin') {
      return notify('Employer or admin access required.', true);
    }
    const liveAccount = isSupabaseConfigured() && user?.id && !user.email?.toLowerCase().endsWith('@workable.demo');
    if (liveAccount) {
      try {
        await deleteAccessibilityEvidenceSupabase(evidenceId);
      } catch (err) {
        notify(`Could not delete facility evidence from cloud: ${err.message}`, true);
        return false;
      }
    }
    act((d) => deleteAccessibilityEvidence(d, evidenceId, user.role === 'admin' ? null : user.id));
    notify('Facility evidence declaration deleted.');
    return true;
  };

  const deleteAccount = async (targetUserId = null) => {
    const uidToDelete = targetUserId || user?.id;
    if (!uidToDelete) return notify('No account to delete.', true);
    const isSelf = !targetUserId || targetUserId === user?.id;
    if (isSelf && user?.role === 'admin') return notify('Administrator accounts cannot be deleted.', true);

    const targetUser = db.users.find((u) => u.id === uidToDelete);
    if (!targetUser) return notify('Account not found.', true);
    if (targetUser.role === 'admin') return notify('Administrator accounts cannot be deleted.', true);

    const liveAccount = isSupabaseConfigured() && uidToDelete && !targetUser.email?.toLowerCase().endsWith('@workable.demo');
    if (liveAccount) {
      try {
        await deleteUserAccountSupabase(uidToDelete);
      } catch (err) {
        notify(`Could not delete cloud account: ${err.message}`, true);
        return false;
      }
    }

    act((d) => deleteUserAccount(d, uidToDelete));

    if (isSelf) {
      localStorage.removeItem('workable_session');
      setRealUser(null);
      setUid(null);
      notify('Your account and profile have been permanently deleted.');
    } else {
      notify(`Account for ${targetUser.name} has been permanently deleted.`);
    }
    return true;
  };

  const withdrawApp = async (appId) => {
    if (user?.role !== 'seeker') return notify('Job Seeker access required.', true);
    try {
      const liveAccount = isSupabaseConfigured() && user?.id && !user.email?.toLowerCase().endsWith('@workable.demo');
      if (liveAccount) {
        await withdrawApplicationSupabase(appId);
        setDb((prev) => {
          const next = {
            ...prev,
            applications: (prev.applications || []).map((a) =>
              a.id === appId ? { ...a, status: 'Withdrawn', updatedAt: new Date().toISOString() } : a
            ),
          };
          save(next);
          return next;
        });
        notify('Application withdrawn.');
        return;
      }
      act((d) => withdrawApplication(d, appId, user.id), true);
      notify('Application withdrawn.');
    } catch (e) {
      notify(e.message, true);
      throw e;
    }
  };

  const updateAppStatus = async (appId, newStatus) => {
    try {
      const liveAccount = isSupabaseConfigured() && user?.id && !user.email?.toLowerCase().endsWith('@workable.demo');
      if (liveAccount) {
        await updateApplicationStatusSupabase(appId, newStatus);
        setDb((prev) => {
          const next = {
            ...prev,
            applications: (prev.applications || []).map((a) =>
              a.id === appId ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a
            ),
          };
          save(next);
          return next;
        });
        notify(`Candidate status set to ${newStatus}.`);
        return;
      }
      const { setStatus } = await import('./services/db');
      act((d) => setStatus(d, appId, user.id, newStatus));
      notify(`Candidate status set to ${newStatus}.`);
    } catch (e) {
      notify(e.message, true);
      throw e;
    }
  };

  const getTrustBadge = (jobId) => {
    return getAccessibilityTrustBadge(db, jobId);
  };

  const saveRealJob = async (jobData) => {
    const liveAccount = isSupabaseConfigured() && user?.id && !user.email?.toLowerCase().endsWith('@workable.demo');
    if (liveAccount) {
      try {
        // Ensure employer profile exists in public.profiles so foreign key and RLS pass
        if (supabase) {
          try {
            await supabase.from('profiles').upsert({
              id: user.id,
              name: user.name || 'Employer',
              email: user.email,
              role: 'employer',
              company: user.company || 'Company',
              updated_at: new Date().toISOString(),
            });
          } catch {
            /* ignore */
          }
        }

        const payload = {
          employer_id: user.id,
          title: jobData.title.trim(),
          desc: jobData.desc.trim(),
          location: jobData.location.trim(),
          type: jobData.type,
          arrangement: jobData.arrangement,
          salary_min: parseInt(jobData.salaryMin, 10) || 0,
          salary_max: parseInt(jobData.salaryMax, 10) || 0,
          skills: jobData.skills || [],
          tags: jobData.tags || [],
          resp: jobData.resp || [],
          qual: jobData.qual || '',
          active: jobData.active !== false,
          status: jobData.status || 'Published',
        };
        const row = jobData.id ? await updateJobSupabase(jobData.id, payload) : await createJobSupabase(payload);
        const mapped = {
          id: row.id,
          employerId: row.employer_id,
          companyId: row.company_id,
          title: row.title,
          desc: row.desc,
          location: row.location,
          type: row.type,
          arrangement: row.arrangement,
          salaryMin: row.salary_min,
          salaryMax: row.salary_max,
          skills: row.skills || [],
          tags: row.tags || [],
          resp: row.resp || [],
          qual: row.qual || '',
          active: row.active !== false,
          status: row.status || 'Published',
          postedAt: row.posted_at,
        };
        setDb((prev) => {
          const exists = prev.jobs.some((job) => job.id === mapped.id);
          const next = {
            ...prev,
            jobs: exists
              ? prev.jobs.map((job) => (job.id === mapped.id ? mapped : job))
              : [mapped, ...prev.jobs],
          };
          save(next);
          return next;
        });
        return mapped;
      } catch (err) {
        console.warn('Live Supabase job creation failed, falling back to local storage:', err);
        const localSaved = act((d) => saveJob(d, jobData, user.id));
        if (localSaved) {
          notify('Saved listing locally (cloud: ' + (err.message || 'offline') + ')');
          return localSaved;
        }
        throw err;
      }
    }
    return act((d) => saveJob(d, jobData, user.id));
  };

  const resetDemo = () => {
    setDb(reset());
    localStorage.removeItem('workable_session');
    setRealUser(null);
    setUid(null);
    notify('Demo data has been reset.');
  };

  const updatePref = (key, val) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: val };
      localStorage.setItem('workable_prefs', JSON.stringify(updated));
      return updated;
    });
  };

  const updatePersona = (key, checked) => {
    setPrefs((prev) => {
      const nextPersonas = { ...(prev.personas || {}), [key]: checked };
      const updated = { ...prev, personas: nextPersonas };
      localStorage.setItem('workable_prefs', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <Ctx.Provider
      value={{
        db,
        user,
        act,
        notify,
        toast,
        prefs,
        setPrefs,
        updatePref,
        updatePersona,
        resetAccessibility,
        login,
        register,
        loginAs,
        logout,
        toggleSave,
        fileReport,
        updateCase,
        respondToReport,
        addEvidence,
        evaluateEvidence,
        addResume,
        setPrimaryResume,
        removeResume,
        withdrawApp,
        updateAppStatus,
        saveProfile,
        toggleUserSuspension,
        getTrustBadge,
        saveRealJob,
        deleteJobListing,
        deleteEvidenceDeclaration,
        deleteAccount,
        resetDemo,
        isSupabase: isSupabaseConfigured(),
        authLoading,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
