import { Injectable, signal } from '@angular/core';

export type AppTab = 'general' | 'downloads' | 'docs' | 'faq';

@Injectable({
  providedIn: 'root'
})
export class TabService {
  currentTab = signal<AppTab>('general');

  setTab(tab: AppTab) {
    this.currentTab.set(tab);
    // Scroll to top when changing tabs
    window.scrollTo(0, 0);
  }
}
