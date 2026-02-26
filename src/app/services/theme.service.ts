import { Injectable, signal, effect, inject, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(this.platformId);

  currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    if (this.isBrowser) {
      // Initial apply
      this.applyTheme(this.currentTheme());

      // Watch for theme changes and persist/apply
      effect(() => {
        const theme = this.currentTheme();
        localStorage.setItem('theme', theme);
        this.applyTheme(theme);
      });

      // Listen for system changes globally once
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        if (this.currentTheme() === 'system') {
          this.updateRootClass(document.documentElement, e.matches ? 'dark' : 'light');
        }
      };

      mediaQuery.addEventListener('change', listener);
      this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', listener));
    }
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
