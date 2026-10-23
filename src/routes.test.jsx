import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider, normalizeProfile } from './store.jsx';
import App from './App.jsx';

const store = new Map();
const mockLocalStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

describe('URL and Route Rendering Integrity', () => {
  beforeEach(() => {
    store.clear();
  });

  const routes = [
    { title: 'Landing page /', path: '/', role: null },
    { title: 'Job listings /jobs', path: '/jobs', role: null },
    { title: 'Job detail /jobs/j_frontend', path: '/jobs/j_frontend', role: null },
    { title: 'Login page /login', path: '/login', role: null },
    { title: 'Register page /register', path: '/register', role: null },

    // Seeker routes
    { title: 'Seeker dashboard /seeker', path: '/seeker', role: 'u_aarav' },
    { title: 'Seeker profile /seeker/profile', path: '/seeker/profile', role: 'u_aarav' },
    { title: 'Seeker saved /seeker/saved', path: '/seeker/saved', role: 'u_aarav' },
    { title: 'Seeker applications /seeker/applications', path: '/seeker/applications', role: 'u_aarav' },
    { title: 'Seeker resumes /seeker/resumes', path: '/seeker/resumes', role: 'u_aarav' },
    { title: 'Seeker disputes /seeker/reports', path: '/seeker/reports', role: 'u_aarav' },

    // Employer routes
    { title: 'Employer dashboard /employer', path: '/employer', role: 'u_techcorp' },
    { title: 'Employer jobs /employer/jobs', path: '/employer/jobs', role: 'u_techcorp' },
    { title: 'Employer new job /employer/jobs/new', path: '/employer/jobs/new', role: 'u_techcorp' },
    { title: 'Employer applicants /employer/applicants', path: '/employer/applicants', role: 'u_techcorp' },
    { title: 'Employer evidence /employer/evidence', path: '/employer/evidence', role: 'u_techcorp' },
    { title: 'Employer disputes /employer/disputes', path: '/employer/disputes', role: 'u_techcorp' },
    { title: 'Employer verification /employer/verification', path: '/employer/verification', role: 'u_techcorp' },

    // Admin routes
    { title: 'Admin console /admin', path: '/admin', role: 'u_admin' },
  ];

  for (const { title, path, role } of routes) {
    it(`renders ${title} without throwing or returning empty HTML`, () => {
      if (role) {
        mockLocalStorage.setItem('workable_session', role);
      } else {
        mockLocalStorage.removeItem('workable_session');
      }

      const html = renderToString(
        <MemoryRouter initialEntries={[path]}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(100);
      expect(html).not.toContain('TypeError');
    });
  }

  it('normalizes raw database profile with null columns safely', () => {
    const rawSupabaseProfile = {
      phone: null,
      summary: null,
      skills: null,
      education: null,
      experience: null,
      locations: null,
      arrangements: null,
      access_prefs: null,
      resume_name: null,
    };

    const clean = normalizeProfile(rawSupabaseProfile);
    expect(Array.isArray(clean.skills)).toBe(true);
    expect(Array.isArray(clean.locations)).toBe(true);
    expect(Array.isArray(clean.arrangements)).toBe(true);
    expect(Array.isArray(clean.accessPrefs)).toBe(true);
    expect(clean.phone).toBe('');
    expect(clean.resumeName).toBe('');
  });
});
