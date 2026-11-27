import { Injectable, signal, effect, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AppMode = 'desktop' | 'server';

@Injectable({
  providedIn: 'root',
})
export class ModeService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  readonly currentMode = signal<AppMode>(this.getInitialMode());

  readonly modeLabel = computed(() => (this.currentMode() === 'desktop' ? 'Desktop' : 'Server'));
  readonly modeIcon = computed(() => (this.currentMode() === 'desktop' ? 'monitor' : 'dns'));

  constructor() {
    if (this.isBrowser) {
      // Initial apply
      this.applyModeClass(this.currentMode());

      effect(() => {
        const mode = this.currentMode();
        localStorage.setItem('appMode', mode);
        this.applyModeClass(mode);
      });
    }
  }

  private applyModeClass(mode: AppMode) {
    if (typeof document === 'undefined') return;
    const body = document.body;
    if (mode === 'server') {
      body.classList.add('mode-server');
    } else {
      body.classList.remove('mode-server');
    }
  }

  private getInitialMode(): AppMode {
    if (!this.isBrowser) return 'desktop';
    const savedMode = localStorage.getItem('appMode') as AppMode;
    return savedMode === 'desktop' || savedMode === 'server' ? savedMode : 'desktop';
  }

  toggleMode() {
    this.currentMode.update((mode) => (mode === 'desktop' ? 'server' : 'desktop'));
  }

  setMode(mode: AppMode) {
    this.currentMode.set(mode);
  }
}
