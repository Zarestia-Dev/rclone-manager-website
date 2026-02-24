import { Injectable, signal } from '@angular/core';

export type AppTab = 'general' | 'downloads' | 'docs';

@Injectable({
  providedIn: 'root',
})
export class TabService {
  /** Reads <base href> baked in by Angular build. Returns '' in dev, '/zarestia/rclone-manager' in prod. */
  private get basePath(): string {
    const href = document.querySelector('base')?.getAttribute('href') ?? '/';
    return href === '/' ? '' : href.replace(/\/$/, '');
  }

  currentTab = signal<AppTab>(this.readTabFromPath());

  private readTabFromPath(): AppTab {
    const path = window.location.pathname.replace(this.basePath, '');
    if (path.startsWith('/docs')) return 'docs';
    if (path.startsWith('/downloads')) return 'downloads';
    return 'general';
  }

  setTab(tab: AppTab) {
    this.currentTab.set(tab);
    window.scrollTo(0, 0);

    if (tab === 'general') {
      history.pushState(null, '', `${this.basePath}/`);
    } else if (tab === 'downloads') {
      history.pushState(null, '', `${this.basePath}/downloads`);
    } else if (tab === 'docs') {
      history.pushState(null, '', `${this.basePath}/docs`);
    }
  }
}
