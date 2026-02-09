import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Theme detection: apply `.dark` or `.light` class to the document root
// Behavior:
// - If user has an explicit preference in localStorage key `theme` with value
//   'light' | 'dark' | 'system', honor it. If 'system' or not set, follow
//   the OS/browser `prefers-color-scheme` media query and listen for changes.
// - If user preference is explicit 'light' or 'dark', we do not attach a
//   listener so the app preserves the user's choice.
const THEME_STORAGE_KEY = 'theme';

function setThemeClass(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(theme === 'dark' ? 'light' : 'dark');
  root.classList.add(theme);
}

function getStoredTheme(): 'light' | 'dark' | 'system' | null {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // localStorage access can fail in some environments; ignore and fallback to system
  }
  return null;
}

function initThemeDetection() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const stored = getStoredTheme();

  const mql = window.matchMedia('(prefers-color-scheme: dark)');

  // If user explicitly chose light/dark, respect it and don't auto-switch.
  if (stored === 'light' || stored === 'dark') {
    setThemeClass(stored);
    return;
  }

  // Otherwise follow system
  setThemeClass(mql.matches ? 'dark' : 'light');

  const listener = (e: MediaQueryListEvent | MediaQueryList) => {
    // Some older browsers call listener with MediaQueryList; handle both
    const matches = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
    setThemeClass(matches ? 'dark' : 'light');
  };

  // Modern API
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', listener);
  } else if (typeof mql.addListener === 'function') {
    // Fallback for older browsers
    mql.addListener(listener);
  }
}

// Run theme init as early as possible to avoid flicker
initThemeDetection();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
