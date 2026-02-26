import { Injectable, signal } from '@angular/core';

export type AppTab = 'general' | 'downloads' | 'docs' | 'roadmap' | 'community';

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
    if (path.startsWith('/roadmap')) return 'roadmap';
    if (path.startsWith('/community')) return 'community';
    return 'general';
  }

  setTab(tab: AppTab) {
    this.currentTab.set(tab);
    window.scrollTo(0, 0);

    const pathMap: Record<AppTab, string> = {
      general: '',
      downloads: 'downloads',
      docs: 'docs',
      roadmap: 'roadmap',
      community: 'community',
    };

    history.pushState(null, '', `${this.basePath}/${pathMap[tab]}`);
  }
}
