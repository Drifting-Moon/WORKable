import { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Glasses,
  Eye,
  EyeOff,
  BookOpen,
  Activity,
  User,
  MousePointer2,
  ShieldCheck,
  Keyboard,
  Monitor,
  Contrast,
  Droplet,
  Highlighter,
  PanelLeft,
  PanelRight,
  Minus,
  Plus,
  Power,
  Accessibility
} from 'lucide-react';
import { useApp } from './store.jsx';

// Custom Switch Toggle with stopPropagation
function Switch({ checked, onChange, label, id }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        checked ? 'bg-brand' : 'bg-slate-300'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// Mini Preview illustrations for Radio Cards
// Mini Preview illustrations for Radio Cards
function MiniWindowPreview({ mode }) {
  if (mode === 'midnight' || mode === 'night') {
    return (
      <div className="h-10 w-14 rounded-md border border-slate-700 bg-[#090d16] p-1 flex flex-col justify-between shadow-xs">
        <div className="flex gap-1">
          <div className="h-1 w-1 rounded-full bg-sky-400" />
          <div className="h-1 w-1 rounded-full bg-slate-600" />
        </div>
        <div className="flex gap-1">
          <div className="h-4 flex-1 rounded-xs bg-[#131b2e]" />
          <div className="h-4 flex-1 rounded-xs bg-[#131b2e]" />
        </div>
      </div>
    );
  }
  if (mode === 'emerald') {
    return (
      <div className="h-10 w-14 rounded-md border border-emerald-900 bg-[#051410] p-1 flex flex-col justify-between shadow-xs">
        <div className="flex gap-1">
          <div className="h-1 w-1 rounded-full bg-emerald-400" />
          <div className="h-1 w-1 rounded-full bg-emerald-700" />
        </div>
        <div className="flex gap-1">
          <div className="h-4 flex-1 rounded-xs bg-[#0c2620]" />
          <div className="h-4 flex-1 rounded-xs bg-[#0c2620]" />
        </div>
      </div>
    );
  }
  if (mode === 'warm') {
    return (
      <div className="h-10 w-14 rounded-md border border-amber-200 bg-[#fbf9f4] p-1 flex flex-col justify-between shadow-xs">
        <div className="flex gap-1">
          <div className="h-1 w-1 rounded-full bg-amber-600" />
          <div className="h-1 w-1 rounded-full bg-amber-200" />
        </div>
        <div className="flex gap-1">
          <div className="h-4 flex-1 rounded-xs bg-[#f2eee5]" />
          <div className="h-4 flex-1 rounded-xs bg-[#f2eee5]" />
        </div>
      </div>
    );
  }
  if (mode === 'oled') {
    return (
      <div className="h-10 w-14 rounded-md border border-zinc-800 bg-black p-1 flex flex-col justify-between shadow-xs">
        <div className="flex gap-1">
          <div className="h-1 w-1 rounded-full bg-yellow-400" />
          <div className="h-1 w-1 rounded-full bg-zinc-700" />
        </div>
        <div className="flex gap-1">
          <div className="h-4 flex-1 rounded-xs bg-zinc-900" />
          <div className="h-4 flex-1 rounded-xs bg-zinc-900" />
        </div>
      </div>
    );
  }
  if (mode === 'auto') {
    return (
      <div className="h-10 w-14 rounded-md border border-slate-300 bg-gradient-to-r from-slate-100 from-50% to-[#090d16] to-50% p-1 flex flex-col justify-between shadow-xs">
        <div className="flex gap-1">
          <div className="h-1 w-1 rounded-full bg-slate-400" />
          <div className="h-1 w-1 rounded-full bg-sky-400" />
        </div>
        <div className="flex gap-1">
          <div className="h-4 flex-1 rounded-xs bg-slate-200" />
          <div className="h-4 flex-1 rounded-xs bg-[#131b2e]" />
        </div>
      </div>
    );
  }
  return (
    <div className="h-10 w-14 rounded-md border border-slate-300 bg-slate-50 p-1 flex flex-col justify-between shadow-xs">
      <div className="flex gap-1">
        <div className="h-1 w-1 rounded-full bg-blue-500" />
        <div className="h-1 w-1 rounded-full bg-slate-300" />
      </div>
      <div className="flex gap-1">
        <div className="h-4 flex-1 rounded-xs bg-slate-200" />
        <div className="h-4 flex-1 rounded-xs bg-slate-200" />
      </div>
    </div>
  );
}

function MiniLayoutPreview({ side }) {
  return (
    <div className="h-10 w-14 rounded-md border border-slate-300 bg-white p-1 flex gap-1 items-center shadow-xs">
      {side === 'left' ? (
        <>
          <div className="h-8 w-4 rounded-xs bg-blue-100 border border-blue-400" />
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-1.5 w-full bg-slate-200 rounded-xs" />
            <div className="h-1.5 w-3/4 bg-slate-200 rounded-xs" />
            <div className="h-1.5 w-full bg-slate-200 rounded-xs" />
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-1.5 w-full bg-slate-200 rounded-xs" />
            <div className="h-1.5 w-3/4 bg-slate-200 rounded-xs" />
            <div className="h-1.5 w-full bg-slate-200 rounded-xs" />
          </div>
          <div className="h-8 w-4 rounded-xs bg-blue-100 border border-blue-400" />
        </>
      )}
    </div>
  );
}

function MiniWidthPreview({ full }) {
  return (
    <div className="h-10 w-14 rounded-md border border-slate-300 bg-white p-1 flex items-center justify-center shadow-xs">
      <div className={`h-8 border border-dashed border-slate-400 flex flex-col justify-center gap-1 px-1 ${full ? 'w-full' : 'w-9'}`}>
        <div className="h-1 w-full bg-slate-400 rounded-xs" />
        <div className="h-1 w-full bg-slate-400 rounded-xs" />
        <div className="h-1 w-full bg-slate-400 rounded-xs" />
      </div>
    </div>
  );
}

function MiniAlignPreview({ align }) {
  return (
    <div className="h-10 w-12 rounded-md border border-slate-300 bg-white p-1.5 flex flex-col justify-center gap-1 shadow-xs">
      <div className={`h-1 bg-slate-600 rounded-xs ${align === 'center' ? 'w-full' : align === 'right' ? 'w-full' : 'w-full'}`} />
      <div className={`h-1 bg-slate-600 rounded-xs ${align === 'center' ? 'w-3/4 mx-auto' : align === 'right' ? 'w-3/4 ml-auto' : 'w-3/4'}`} />
      <div className={`h-1 bg-slate-600 rounded-xs ${align === 'center' ? 'w-1/2 mx-auto' : align === 'right' ? 'w-1/2 ml-auto' : 'w-1/2'}`} />
    </div>
  );
}

export function AccessibilityDrawer({ open, onClose }) {
  const { prefs, updatePref, updatePersona, resetAccessibility } = useApp();
  const [search, setSearch] = useState('');
  const [openSection, setOpenSection] = useState('personas');
  const drawerRef = useRef(null);
  const previousFocusRef = useRef(null);

  const personas = prefs.personas || {};
  const asidePos = prefs.asidePosition || 'right';

  const toggleSection = (id) => {
    setOpenSection((cur) => (cur === id ? null : id));
  };

  // Treat the settings drawer as a real modal for keyboard users: move focus in,
  // keep Tab inside while open, close on Escape, then restore focus to the opener.
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement;
    const root = drawerRef.current;
    const getFocusable = () => root?.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) || [];
    const first = getFocusable()[0];
    first?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(getFocusable());
      if (!items.length) { e.preventDefault(); return; }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === firstItem || !root?.contains(document.activeElement))) {
        e.preventDefault(); lastItem.focus();
      } else if (!e.shiftKey && (document.activeElement === lastItem || !root?.contains(document.activeElement))) {
        e.preventDefault(); firstItem.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  const personaList = [
    { id: 'adhd', title: 'ADHD Friendly', desc: 'More focus & fewer distractions', icon: Sparkles },
    { id: 'astigmatism', title: 'Astigmatism', desc: 'Reduce glare and eye strain', icon: Glasses },
    { id: 'blindness', title: 'Blindness', desc: 'Optimize page for screen-readers & keyboard', icon: User },
    { id: 'colorBlindness', title: 'Color Blindness', desc: 'Easier to discern and distinguish colors', icon: Eye },
    { id: 'dyslexia', title: 'Dyslexia Friendly', desc: 'Optimize page for dyslexic users', icon: BookOpen },
    { id: 'epilepsy', title: 'Epilepsy Safe', desc: 'Reduces motion to prevent adverse reactions', icon: Activity },
    { id: 'elderly', title: 'For The Elderly', desc: 'More clear and easy to work without distractions', icon: User },
    { id: 'lowVision', title: 'Low Vision', desc: 'Improve legibility by enhancing visual elements', icon: EyeOff },
    { id: 'motor', title: 'Motor Disabilities', desc: 'Efficient navigation using a keyboard & mouse', icon: MousePointer2 },
    { id: 'seizureSafe', title: 'Seizure Safe', desc: 'Clear flashes & reduces colors', icon: ShieldCheck },
    { id: 'keyboardNav', title: 'Keyboard Navigation (Motor)', desc: 'Navigate page with the keyboard', icon: Keyboard },
  ];

  const q = search.trim().toLowerCase();

  const filteredPersonas = useMemo(() => {
    if (!q) return personaList;
    return personaList.filter(
      (p) => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    );
  }, [q]);

  const matchesSearch = (title, items = []) => {
    if (!q) return true;
    if (title.toLowerCase().includes(q)) return true;
    return items.some((i) => i.toLowerCase().includes(q));
  };

  // Check if any accessibility setting is active
  const hasActiveSettings = useMemo(() => {
    const hasPersona = Object.values(personas).some(Boolean);
    const hasContrast = prefs.contrastMode && prefs.contrastMode !== 'none';
    const hasFontChange = (prefs.fontSize && prefs.fontSize !== 100) || (prefs.textSpacing && prefs.textSpacing !== 100) || (prefs.textAlign && prefs.textAlign !== 'left');
    const hasDisplayChange = (prefs.theme && prefs.theme !== 'default') || prefs.fullWidth || (prefs.contentScaling && prefs.contentScaling !== 100);
    const hasHighlights = prefs.highlightLinks || prefs.highlightHeadings || prefs.focusRing;
    const hasCursor = prefs.cursor && prefs.cursor !== 'default';
    const hasTools = prefs.readingRuler || prefs.readingMask || prefs.textToSpeech;
    return hasPersona || hasContrast || hasFontChange || hasDisplayChange || hasHighlights || hasCursor || hasTools;
  }, [personas, prefs]);

  if (!open) return null;

  return (
    <div
      id="a11y-drawer-container"
      ref={drawerRef}
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-drawer-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 flex max-w-full z-10 ${
          asidePos === 'left' ? 'left-0 pr-10' : 'right-0 pl-10'
        }`}
      >
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-slate-200">
          
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white">
            <h1 id="a11y-drawer-title" className="text-xl font-bold tracking-tight text-slate-900">
              Accessibility Settings
            </h1>
            <div className="flex items-center gap-1">
              {/* Turn Off / Reset All Quick Action */}
              <button
                type="button"
                onClick={resetAccessibility}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                  hasActiveSettings
                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
                title="Turn off all active accessibility settings"
                aria-label="Turn off all accessibility features"
              >
                <Power size={15} />
                <span>Turn Off</span>
              </button>

              {/* Dock Side Toggle */}
              <button
                type="button"
                onClick={() => updatePref('asidePosition', asidePos === 'left' ? 'right' : 'left')}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                title={asidePos === 'left' ? 'Dock to right' : 'Dock to left'}
                aria-label="Toggle sidebar dock position"
              >
                {asidePos === 'left' ? <PanelRight size={20} /> : <PanelLeft size={20} />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                aria-label="Close accessibility settings"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-3 border-b border-slate-100 bg-white">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                aria-label="Search accessibility features"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <Search
                size={18}
                className="pointer-events-none absolute right-3.5 top-3 text-slate-400"
              />
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-white">

            {/* 1. ACCESSIBILITY PERSONAS */}
            {matchesSearch('Accessibility Personas', ['ADHD', 'Astigmatism', 'Blindness', 'Color Blindness', 'Dyslexia', 'Epilepsy', 'Elderly', 'Low Vision', 'Motor', 'Seizure', 'Keyboard']) && (
              <div className="rounded-2xl border border-slate-100 bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('personas')}
                  className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 rounded-2xl cursor-pointer"
                  aria-expanded={openSection === 'personas' || !!q}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Accessibility size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Accessibility Personas</h2>
                      <p className="text-xs text-slate-500">Choose a mode to personalise your experience</p>
                    </div>
                  </div>
                  <span className="text-slate-400">
                    {openSection === 'personas' || !!q ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>

                {(openSection === 'personas' || !!q) && (
                  <div className="border-t border-slate-100 p-3 space-y-2">
                    {filteredPersonas.map((p) => {
                      const Icon = p.icon;
                      const active = !!personas[p.id];
                      return (
                        <div
                          key={p.id}
                          onClick={() => updatePersona(p.id, !active)}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-slate-200 cursor-pointer transition select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-slate-700">
                              <Icon size={20} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-slate-900 truncate">{p.title}</h3>
                              <p className="text-xs text-slate-500">{p.desc}</p>
                            </div>
                          </div>
                          <Switch
                            checked={active}
                            onChange={(val) => updatePersona(p.id, val)}
                            label={p.title}
                            id={`persona-${p.id}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. DISPLAY */}
            {matchesSearch('Display', ['Themes', 'Night Mode', 'Aside Left', 'Full Width', 'Content Scaling']) && (
              <div className="rounded-2xl border border-slate-100 bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('display')}
                  className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 rounded-2xl cursor-pointer"
                  aria-expanded={openSection === 'display' || !!q}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Monitor size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Display</h2>
                      <p className="text-xs text-slate-500">Customize visual appearance</p>
                    </div>
                  </div>
                  <span className="text-slate-400">
                    {openSection === 'display' || !!q ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>

                {(openSection === 'display' || !!q) && (
                  <div className="border-t border-slate-100 p-4 space-y-5">
                    {/* Themes */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Themes</h3>
                      <p className="text-xs text-slate-500 mb-3">Choose the mode in which you want to view</p>
                      <div className="space-y-2">
                        {[
                          { id: 'midnight', label: 'Midnight Obsidian (Dark)', mode: 'midnight', desc: 'Deep cosmic slate with cobalt & cyan accents' },
                          { id: 'default', label: 'Clean Slate (Light)', mode: 'light', desc: 'Modern crisp porcelain with cobalt focus' },
                          { id: 'emerald', label: 'Nordic Forest (Emerald)', mode: 'emerald', desc: 'Calming deep pine with mint highlights' },
                          { id: 'warm', label: 'Warm Sand (Editorial)', mode: 'warm', desc: 'Warm linen paper with terracotta accents' },
                          { id: 'oled', label: 'OLED Pure Black', mode: 'oled', desc: 'High contrast pitch black for maximum visibility' },
                          { id: 'auto', label: 'Auto (System Preference)', mode: 'auto', desc: 'Match your operating system setting' },
                        ].map((t) => {
                          const isSel = (prefs.theme || 'midnight') === t.id;
                          return (
                            <label
                              key={t.id}
                              onClick={() => updatePref('theme', t.id)}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                isSel ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <MiniWindowPreview mode={t.mode} />
                                <div>
                                  <div className="text-sm font-bold text-slate-800">{t.label}</div>
                                  <div className="text-xs text-slate-400">{t.desc}</div>
                                </div>
                              </div>
                              <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${isSel ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                                {isSel && <div className="h-2 w-2 rounded-full bg-white" />}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Aside Section Position */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Aside Position</h3>
                      <p className="text-xs text-slate-500 mb-3">Choose the position of the aside section on the page</p>
                      <div className="space-y-2">
                        {[
                          { id: 'left', label: 'Aside Left' },
                          { id: 'right', label: 'Aside Right' },
                        ].map((pos) => {
                          const isSel = asidePos === pos.id;
                          return (
                            <label
                              key={pos.id}
                              onClick={() => updatePref('asidePosition', pos.id)}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                isSel ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <MiniLayoutPreview side={pos.id} />
                                <span className="text-sm font-bold text-slate-800">{pos.label}</span>
                              </div>
                              <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${isSel ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                                {isSel && <div className="h-2 w-2 rounded-full bg-white" />}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Full Width */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Full Width</h3>
                      <p className="text-xs text-slate-500 mb-3">Choose the page width</p>
                      <div className="space-y-2">
                        {[
                          { val: false, label: 'Default', full: false },
                          { val: true, label: 'Full Width', full: true },
                        ].map((w) => {
                          const isSel = !!prefs.fullWidth === w.val;
                          return (
                            <label
                              key={w.label}
                              onClick={() => updatePref('fullWidth', w.val)}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                isSel ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <MiniWidthPreview full={w.full} />
                                <span className="text-sm font-bold text-slate-800">{w.label}</span>
                              </div>
                              <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${isSel ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                                {isSel && <div className="h-2 w-2 rounded-full bg-white" />}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Content Scaling */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-slate-900">
                          Content Scaling: <span className="text-blue-600">{prefs.contentScaling || 100}%</span>
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Adjust the size of the content to make it easier to read</p>
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <button
                          type="button"
                          onClick={() => updatePref('contentScaling', Math.max(80, (prefs.contentScaling || 100) - 5))}
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                          aria-label="Decrease content scaling"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="range"
                          min="80"
                          max="140"
                          step="5"
                          value={prefs.contentScaling || 100}
                          onChange={(e) => updatePref('contentScaling', Number(e.target.value))}
                          aria-label="Content scaling percentage"
                          className="flex-1 accent-blue-600 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => updatePref('contentScaling', Math.min(140, (prefs.contentScaling || 100) + 5))}
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                          aria-label="Increase content scaling"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* 3. FONT */}
            {matchesSearch('Font', ['Font Size', 'Text Spacing', 'Text Alignment', 'Align Left', 'Align Center', 'Align Right']) && (
              <div className="rounded-2xl border border-slate-100 bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('font')}
                  className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 rounded-2xl cursor-pointer"
                  aria-expanded={openSection === 'font' || !!q}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <span className="font-bold text-base">Aa</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Font</h2>
                      <p className="text-xs text-slate-500">Adjust font size, spacing, and alignment</p>
                    </div>
                  </div>
                  <span className="text-slate-400">
                    {openSection === 'font' || !!q ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>

                {(openSection === 'font' || !!q) && (
                  <div className="border-t border-slate-100 p-4 space-y-5">
                    {/* Font Size */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-slate-900">
                          Font Size: <span className="text-blue-600">{prefs.fontSize || 100}%</span>
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Resize text for better readability</p>
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center font-bold text-xs text-slate-700">
                          A
                        </span>
                        <input
                          type="range"
                          min="85"
                          max="150"
                          step="5"
                          value={prefs.fontSize || 100}
                          onChange={(e) => updatePref('fontSize', Number(e.target.value))}
                          aria-label="Font size percentage"
                          className="flex-1 accent-blue-600 cursor-pointer"
                        />
                        <span className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center font-bold text-lg text-slate-700">
                          A
                        </span>
                      </div>
                    </div>

                    {/* Text Spacing */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-slate-900">
                          Text Spacing: <span className="text-blue-600">{prefs.textSpacing || 100}%</span>
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Slide to adjust the space between each line</p>
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-xs font-bold text-slate-700">
                          &lt;-&gt;
                        </span>
                        <input
                          type="range"
                          min="100"
                          max="160"
                          step="5"
                          value={prefs.textSpacing || 100}
                          onChange={(e) => updatePref('textSpacing', Number(e.target.value))}
                          aria-label="Text line and letter spacing percentage"
                          className="flex-1 accent-blue-600 cursor-pointer"
                        />
                        <span className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-xs font-bold text-slate-700">
                          &lt;--&gt;
                        </span>
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Text Alignment</h3>
                      <p className="text-xs text-slate-500 mb-3">Adjust the text alignment across the page</p>
                      <div className="space-y-2">
                        {[
                          { id: 'left', label: 'Align Left' },
                          { id: 'center', label: 'Align Center' },
                          { id: 'right', label: 'Align Right' },
                        ].map((al) => {
                          const isSel = (prefs.textAlign || 'left') === al.id;
                          return (
                            <label
                              key={al.id}
                              onClick={() => updatePref('textAlign', al.id)}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                isSel ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <MiniAlignPreview align={al.id} />
                                <span className="text-sm font-bold text-slate-800">{al.label}</span>
                              </div>
                              <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${isSel ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                                {isSel && <div className="h-2 w-2 rounded-full bg-white" />}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* 4. CONTRAST */}
            {matchesSearch('Contrast', ['Monochrome', 'Low Saturation', 'High Saturation', 'Low Contrast', 'Medium Contrast', 'High Contrast']) && (
              <div className="rounded-2xl border border-slate-100 bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('contrast')}
                  className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 rounded-2xl cursor-pointer"
                  aria-expanded={openSection === 'contrast' || !!q}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Contrast size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Contrast</h2>
                      <p className="text-xs text-slate-500">Makes easier to read text and enhances color</p>
                    </div>
                  </div>
                  <span className="text-slate-400">
                    {openSection === 'contrast' || !!q ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>

                {(openSection === 'contrast' || !!q) && (
                  <div className="border-t border-slate-100 p-3 space-y-2">
                    {[
                      { id: 'monochrome', title: 'Monochrome', desc: 'Convert to black and white colors', icon: Contrast },
                      { id: 'low-saturation', title: 'Low Saturation', desc: 'Decreases the intensity of colors', icon: Droplet },
                      { id: 'high-saturation', title: 'High Saturation', desc: 'Increases the intensity of colors', icon: Droplet },
                      { id: 'low-contrast', title: 'Low Contrast', desc: 'Softer colors, less difference', icon: Contrast },
                      { id: 'medium-contrast', title: 'Medium Contrast', desc: 'Balanced and clear', icon: Contrast },
                      { id: 'high-contrast', title: 'High Contrast', desc: 'Bold and easy to see', icon: Contrast },
                    ].map((c) => {
                      const Icon = c.icon;
                      const active = prefs.contrastMode === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => updatePref('contrastMode', active ? 'none' : c.id)}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-slate-200 cursor-pointer transition select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-slate-700">
                              <Icon size={20} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-slate-900 truncate">{c.title}</h3>
                              <p className="text-xs text-slate-500">{c.desc}</p>
                            </div>
                          </div>
                          <Switch
                            checked={active}
                            onChange={(val) => updatePref('contrastMode', val ? c.id : 'none')}
                            label={c.title}
                            id={`contrast-${c.id}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 5. HIGHLIGHTS */}
            {matchesSearch('Highlights', ['Highlight Links', 'Highlight Headings', 'Focus Ring']) && (
              <div className="rounded-2xl border border-slate-100 bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('highlights')}
                  className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 rounded-2xl cursor-pointer"
                  aria-expanded={openSection === 'highlights' || !!q}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Highlighter size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Highlights</h2>
                      <p className="text-xs text-slate-500">Choose your highlight style for reading the page</p>
                    </div>
                  </div>
                  <span className="text-slate-400">
                    {openSection === 'highlights' || !!q ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>

                {(openSection === 'highlights' || !!q) && (
                  <div className="border-t border-slate-100 p-3 space-y-2">
                    {[
                      { id: 'highlightLinks', title: 'Highlight Links', desc: 'Makes every link pop with clear underline & tint' },
                      { id: 'highlightHeadings', title: 'Highlight Headings', desc: 'Adds distinct border accents to all section titles' },
                      { id: 'focusRing', title: 'Focus Ring Highlight', desc: 'Displays vivid glowing border around keyboard-focused items' },
                    ].map((h) => {
                      const active = !!prefs[h.id];
                      return (
                        <div
                          key={h.id}
                          onClick={() => updatePref(h.id, !active)}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-slate-200 cursor-pointer transition select-none"
                        >
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 truncate">{h.title}</h3>
                            <p className="text-xs text-slate-500">{h.desc}</p>
                          </div>
                          <Switch
                            checked={active}
                            onChange={(val) => updatePref(h.id, val)}
                            label={h.title}
                            id={`hl-${h.id}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 6. CURSOR */}
            {matchesSearch('Cursor', ['Big Black Cursor', 'Big White Cursor']) && (
              <div className="rounded-2xl border border-slate-100 bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('cursor')}
                  className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 rounded-2xl cursor-pointer"
                  aria-expanded={openSection === 'cursor' || !!q}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <MousePointer2 size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Cursor</h2>
                      <p className="text-xs text-slate-500">Make your cursor bigger and easier to see</p>
                    </div>
                  </div>
                  <span className="text-slate-400">
                    {openSection === 'cursor' || !!q ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>

                {(openSection === 'cursor' || !!q) && (
                  <div className="border-t border-slate-100 p-3 space-y-2">
                    {[
                      { id: 'big-black', title: 'Big Black Cursor', desc: 'Enlarged high-contrast black pointer' },
                      { id: 'big-white', title: 'Big White Cursor', desc: 'Enlarged high-contrast white pointer with dark border' },
                    ].map((cur) => {
                      const active = prefs.cursor === cur.id;
                      return (
                        <div
                          key={cur.id}
                          onClick={() => updatePref('cursor', active ? 'default' : cur.id)}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-slate-200 cursor-pointer transition select-none"
                        >
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 truncate">{cur.title}</h3>
                            <p className="text-xs text-slate-500">{cur.desc}</p>
                          </div>
                          <Switch
                            checked={active}
                            onChange={(val) => updatePref('cursor', val ? cur.id : 'default')}
                            label={cur.title}
                            id={`cursor-${cur.id}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 7. READING TOOLS */}
            {matchesSearch('Reading Tools', ['Reading Ruler', 'Reading Mask', 'Text-to-Speech', 'Read Aloud']) && (
              <div className="rounded-2xl border border-slate-100 bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('readingTools')}
                  className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 rounded-2xl cursor-pointer"
                  aria-expanded={openSection === 'readingTools' || !!q}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Reading Tools</h2>
                      <p className="text-xs text-slate-500">Support tools for easier reading</p>
                    </div>
                  </div>
                  <span className="text-slate-400">
                    {openSection === 'readingTools' || !!q ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>

                {(openSection === 'readingTools' || !!q) && (
                  <div className="border-t border-slate-100 p-3 space-y-2">
                    {[
                      { id: 'readingRuler', title: 'Reading Ruler', desc: 'Guide bar follows your mouse to track reading line' },
                      { id: 'readingMask', title: 'Reading Mask', desc: 'Spotlights the active text row and dims background' },
                      { id: 'textToSpeech', title: 'Text-to-Speech (Read Aloud)', desc: 'Click any paragraph or button to listen aloud' },
                    ].map((tool) => {
                      const active = !!prefs[tool.id];
                      return (
                        <div
                          key={tool.id}
                          onClick={() => updatePref(tool.id, !active)}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-slate-200 cursor-pointer transition select-none"
                        >
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 truncate">{tool.title}</h3>
                            <p className="text-xs text-slate-500">{tool.desc}</p>
                          </div>
                          <Switch
                            checked={active}
                            onChange={(val) => updatePref(tool.id, val)}
                            label={tool.title}
                            id={`reading-${tool.id}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sticky Bottom Footer */}
          <div className="border-t border-slate-100 p-4 text-center bg-white">
            <button
              type="button"
              onClick={resetAccessibility}
              className="inline-flex items-center justify-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition py-2 px-4 rounded-xl hover:bg-blue-50 cursor-pointer"
            >
              <RotateCcw size={16} />
              Reset All Accessibility Settings
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// Interactive Overlays Component (Reading Ruler, Reading Mask, Speech Listener)
export function AccessibilityOverlays() {
  const { prefs } = useApp();
  const [mouseY, setMouseY] = useState(-100);

  const rulerActive = !!prefs.readingRuler || !!prefs.personas?.adhd;
  const maskActive = !!prefs.readingMask;
  const ttsActive = !!prefs.textToSpeech || !!prefs.personas?.blindness;

  // Track mouse for ruler and reading mask
  useEffect(() => {
    if (!rulerActive && !maskActive) return;
    const handleMouseMove = (e) => setMouseY(e.clientY);
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [rulerActive, maskActive]);

  // Text to speech click listener
  useEffect(() => {
    if (!ttsActive) {
      window.speechSynthesis?.cancel();
      return;
    }
    const handleClick = (e) => {
      if (e.target.closest('#a11y-drawer-container')) return;
      const text = window.getSelection()?.toString() || e.target.innerText;
      if (text && text.trim().length > 1) {
        window.speechSynthesis?.cancel();
        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.rate = 1.0;
        window.speechSynthesis?.speak(utterance);
      }
    };
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      window.speechSynthesis?.cancel();
    };
  }, [ttsActive]);

  return (
    <>
      {/* Reading Ruler */}
      {rulerActive && mouseY >= 0 && (
        <div className="reading-ruler" style={{ top: `${mouseY}px` }} aria-hidden="true" />
      )}

      {/* Reading Mask */}
      {maskActive && mouseY >= 0 && (
        <>
          <div
            className="reading-mask-top"
            style={{ top: 0, height: `${Math.max(0, mouseY - 25)}px` }}
            aria-hidden="true"
          />
          <div
            className="reading-mask-bottom"
            style={{ top: `${mouseY + 25}px`, bottom: 0 }}
            aria-hidden="true"
          />
        </>
      )}
    </>
  );
}
