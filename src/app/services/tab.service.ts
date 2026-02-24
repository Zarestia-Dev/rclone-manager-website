import { Injectable, inject, signal } from '@angular/core';
import { Location } from '@angular/common';

export type AppTab = 'general' | 'downloads' | 'docs';

@Injectable({
  providedIn: 'root',
})
export class TabService {
  private location = inject(Location);

  currentTab = signal<AppTab>(this.readTabFromPath());

  private readTabFromPath(): AppTab {
    const path = this.location.path();
    if (path.startsWith('/docs')) return 'docs';
    if (path.startsWith('/downloads')) return 'downloads';
    return 'general';
  }

  setTab(tab: AppTab) {
    this.currentTab.set(tab);
    window.scrollTo(0, 0);

    if (tab === 'general') {
      this.location.go('/');
    } else if (tab === 'downloads') {
      this.location.go('/downloads');
    } else if (tab === 'docs') {
      // Docs will update the path itself when a page is selected
      this.location.go('/docs');
    }
  }
}
