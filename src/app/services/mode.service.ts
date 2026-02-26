import { Injectable, signal, effect, computed } from '@angular/core';

export type AppMode = 'desktop' | 'headless';

@Injectable({
  providedIn: 'root',
})
export class ModeService {
  currentMode = signal<AppMode>(this.getInitialMode());

  modeLabel = computed(() => (this.currentMode() === 'desktop' ? 'Desktop' : 'Headless'));
  modeIcon = computed(() => (this.currentMode() === 'desktop' ? 'monitor' : 'dns'));

  constructor() {
    // Initial apply
    this.applyModeClass(this.currentMode());

    effect(() => {
      const mode = this.currentMode();
      localStorage.setItem('appMode', mode);
      this.applyModeClass(mode);
    });
  }

  private applyModeClass(mode: AppMode) {
    if (typeof document === 'undefined') return;
    const body = document.body;
    if (mode === 'headless') {
      body.classList.add('mode-headless');
    } else {
      body.classList.remove('mode-headless');
    }
  }

  private getInitialMode(): AppMode {
    const savedMode = localStorage.getItem('appMode') as AppMode;
    return savedMode === 'desktop' || savedMode === 'headless' ? savedMode : 'desktop';
  }

  toggleMode() {
    this.currentMode.update((mode) => (mode === 'desktop' ? 'headless' : 'desktop'));
  }

  setMode(mode: AppMode) {
    this.currentMode.set(mode);
  }
}
