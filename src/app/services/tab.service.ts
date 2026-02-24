import { Injectable, signal } from '@angular/core';

export type AppTab = 'general' | 'downloads' | 'docs';

@Injectable({
  providedIn: 'root',
})
export class TabService {
  currentTab = signal<AppTab>(this.readTabFromPath());

  private readTabFromPath(): AppTab {
    const path = window.location.pathname;
    if (path.startsWith('/docs')) return 'docs';
    if (path.startsWith('/downloads')) return 'downloads';
    return 'general';
  }

  setTab(tab: AppTab) {
    this.currentTab.set(tab);
    window.scrollTo(0, 0);

    if (tab === 'general') {
      history.pushState(null, '', '/');
    } else if (tab === 'downloads') {
      history.pushState(null, '', '/downloads');
    } else if (tab === 'docs') {
      // Docs will update the path itself when a page is selected
      history.pushState(null, '', '/docs');
    }
  }
}
