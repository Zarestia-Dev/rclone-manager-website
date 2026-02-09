import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Initial apply
    this.applyTheme(this.currentTheme());
    
    // Watch for theme changes and persist/apply
    effect(() => {
      const theme = this.currentTheme();
      localStorage.setItem('theme', theme);
      this.applyTheme(theme);
    });

    // Listen for system changes globally once
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (this.currentTheme() === 'system') {
        this.updateRootClass(document.documentElement, e.matches ? 'dark' : 'light');
      }
    });
  }

  setTheme(theme: Theme) {
    this.currentTheme.set(theme);
  }

  private getInitialTheme(): Theme {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        return saved;
      }
    }
    return 'system';
  }

  private applyTheme(theme: Theme) {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;

    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.updateRootClass(root, isDark ? 'dark' : 'light');
    } else {
      this.updateRootClass(root, theme);
    }
  }

  private updateRootClass(root: HTMLElement, theme: 'light' | 'dark') {
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }
}
