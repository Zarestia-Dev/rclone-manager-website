import { Component, inject } from '@angular/core';
import { TabService, AppTab } from '../../services/tab.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { DOC_SECTIONS, DocItem, QUICK_LINKS } from '../../constants/docs.constants';

@Component({
  selector: 'app-docs',
  imports: [MatIconModule, MatButtonModule, MatCardModule, MatDividerModule],
  templateUrl: './docs.html',
  styleUrl: './docs.scss',
})
export class Docs {
  private tabService = inject(TabService);
  docSections = DOC_SECTIONS;
  quickLinks = QUICK_LINKS;

  openLink(item: DocItem): void {
    if (item.isExternal) {
      window.open(item.url, '_blank');
      return;
    }

    // Internal navigation: map common internal URLs to tabs
    const tab = this.mapUrlToTab(item.url);
    if (tab) {
      this.tabService.setTab(tab);
      return;
    }

    // Fallback: navigate using window.location for other internal paths
    window.location.href = item.url;
  }

  private mapUrlToTab(url: string): AppTab | null {
    if (!url) return null;
    const u = url.toLowerCase();
    if (u === '/' || u === '/home') return 'general';
    if (u.startsWith('/docs')) return 'docs';
    if (u.startsWith('/downloads')) return 'downloads';
    if (u.startsWith('/faq')) return 'faq';
    return null;
  }

  openExternalLink(url: string): void {
    window.open(url, '_blank');
  }
}
