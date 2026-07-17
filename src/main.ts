import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

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

  mql.addEventListener('change', (e: MediaQueryListEvent) => {
    setThemeClass(e.matches ? 'dark' : 'light');
  });
}

// Run theme init as early as possible to avoid flicker
initThemeDetection();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
