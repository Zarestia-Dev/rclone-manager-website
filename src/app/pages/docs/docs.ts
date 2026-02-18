import { Component, inject, signal, effect, ElementRef, ViewChild, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { WikiService } from '../../services/wiki.service';

export interface DocItem {
  title: string;
  description?: string;
  url?: string;
  assetPath?: string;
  isExternal?: boolean;
  icon?: string;
  type?: 'primary' | 'accent' | 'warn' | 'basic';
}

export interface DocSection {
  title: string;
  icon: string;
  description: string;
  items: DocItem[];
}

export interface SearchHit {
  item: DocItem;
  sectionTitle: string;
  snippet: SafeHtml;
  matchType: 'title' | 'content' | 'description';
}

@Component({
  selector: 'app-docs',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './docs.html',
  styleUrl: './docs.scss',
})
export class Docs implements OnInit {
  private wikiService = inject(WikiService);
  private sanitizer = inject(DomSanitizer);

  docSections = signal<DocSection[]>([]);
  quickLinks = signal<DocItem[]>([]);

  // Search state
  searchQuery = signal('');
  searchHits = signal<SearchHit[]>([]);
  isIndexing = signal(false);
  private searchIndex = new Map<string, string>(); // assetPath -> content

  selectedItem = signal<DocItem | null>(null);
  renderedContent = signal<SafeHtml>('');
  loading = signal(false);

  @ViewChild('contentArea') contentArea?: ElementRef;

  constructor() {
    // Re-highlight and attach listeners when content changes
    effect(() => {
      if (this.renderedContent()) {
        this.attachLinkListeners();
      }
    });

    // Configure marked
    const renderer = new marked.Renderer();
    marked.setOptions({
      renderer,
      breaks: true,
      gfm: true,
    } as Parameters<typeof marked.setOptions>[0]);
  }

  ngOnInit(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    this.loading.set(true);
    this.wikiService.fetchSidebar().subscribe({
      next: (content) => {
        const { sections, quickLinks } = this.parseSummary(content);
        this.docSections.set(sections);
        this.quickLinks.set(quickLinks);

        // Auto-select first item (Home)
        if (sections.length > 0 && sections[0].items.length > 0) {
          this.selectItem(sections[0].items[0]);
        }
        this.loading.set(false);
        this.startIndexing();
      },
      error: (err) => {
        console.error('Error loading documentation summary:', err);
        this.loading.set(false);
      },
    });
  }

  private parseSummary(content: string): { sections: DocSection[]; quickLinks: DocItem[] } {
    const sections: DocSection[] = [];
    const quickLinks: DocItem[] = [];
    let currentSection: DocSection | null = null;
    let inQuickLinks = false;

    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('# ')) return;

      if (trimmed.startsWith('## ')) {
        const [, title, metaStr] = trimmed.match(/^## (.*?)(?:\s*\{(.*)\})?$/) || [];
        if (!title) return;

        if (title.trim() === 'Quick Links') {
          inQuickLinks = true;
          currentSection = null;
        } else {
          inQuickLinks = false;
          currentSection = {
            title: title.trim(),
            icon: this.parseMetadata(metaStr)['icon'] || 'folder',
            description: this.parseMetadata(metaStr)['description'] || '',
            items: [],
          };
          sections.push(currentSection);
        }
      } else if (trimmed.startsWith('- ')) {
        const [, title, pathOrUrl, metaStr] =
          trimmed.match(/^- \[(.*?)\]\((.*?)\)(?:\s*\{(.*)\})?$/) || [];
        if (!title) return;

        const metadata = this.parseMetadata(metaStr);
        const item: DocItem = {
          title: title.trim(),
          icon: metadata['icon'],
          description: metadata['description'],
          isExternal: pathOrUrl.startsWith('http'),
          url: pathOrUrl.startsWith('http') ? pathOrUrl : undefined,
          assetPath: pathOrUrl.startsWith('http') ? undefined : pathOrUrl,
          type: metadata['type'] as 'primary' | 'accent' | 'warn' | 'basic',
        };

        if (inQuickLinks) quickLinks.push(item);
        else if (currentSection) currentSection.items.push(item);
      }
    });

    return { sections, quickLinks };
  }

  private parseMetadata(metaStr?: string): Record<string, string> {
    const meta: Record<string, string> = {};
    if (!metaStr) return meta;

    metaStr.split(',').forEach((pair) => {
      const [key, value] = pair.split('=').map((s) => s.trim());
      if (key && value) {
        meta[key] = value.replace(/^["'](.*)["']$/, '$1');
      }
    });
    return meta;
  }

  selectItem(item: DocItem, searchTerm?: string): void {
    if (item.isExternal) {
      window.open(item.url, '_blank');
      return;
    }

    if (!item.assetPath) return;

    this.selectedItem.set(item);
    const query = searchTerm || this.searchQuery();
    this.searchQuery.set(''); // Clear search on item selection
    this.loadContent(item.assetPath, query);
  }

  private startIndexing(): void {
    const allItems = this.docSections()
      .flatMap((s) => s.items)
      .filter((i) => i.assetPath);
    if (!allItems.length) return;

    this.isIndexing.set(true);
    let indexed = 0;

    allItems.forEach((item) => {
      this.wikiService.fetchPage(item.assetPath!).subscribe({
        next: (content) => {
          this.searchIndex.set(item.assetPath!, content.toLowerCase());
          if (++indexed === allItems.length) this.isIndexing.set(false);
        },
        error: () => {
          if (++indexed === allItems.length) this.isIndexing.set(false);
        },
      });
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    const q = query.toLowerCase().trim();

    if (q.length < 2) {
      this.searchHits.set([]);
      return;
    }

    const hits: SearchHit[] = [];
    this.docSections().forEach((section) => {
      section.items.forEach((item) => {
        const content = item.assetPath ? this.searchIndex.get(item.assetPath) : '';
        const titleMatch = item.title.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const contentMatch = content?.includes(q);

        if (titleMatch || descMatch || contentMatch) {
          hits.push({
            item,
            sectionTitle: section.title,
            snippet: this.highlightMatch(
              contentMatch ? this.extractSnippet(content!, q) : item.description || '',
              query,
            ),
            matchType: titleMatch ? 'title' : descMatch ? 'description' : 'content',
          });
        }
      });
    });
    this.searchHits.set(hits);
  }

  private extractSnippet(content: string, query: string): string {
    const idx = content.indexOf(query);
    const start = Math.max(0, idx - 40);
    const end = Math.min(content.length, idx + query.length + 60);
    return (
      (start > 0 ? '...' : '') +
      content
        .substring(start, end)
        .replace(/[#*`_]/g, '')
        .replace(/\s+/g, ' ') +
      (end < content.length ? '...' : '')
    );
  }

  private highlightMatch(text: string, query: string): SafeHtml {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const highlighted = text.replace(regex, '<mark>$1</mark>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  private loadContent(path: string, searchTerm?: string): void {
    this.loading.set(true);
    this.wikiService.fetchPage(path).subscribe({
      next: (markdown) => {
        let html = marked.parse(markdown) as string;

        // Highlight search term in the main content if provided
        if (searchTerm && searchTerm.length >= 2) {
          const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(${escaped})`, 'gi');
          html = html
            .split(/(<[^>]*>)/)
            .map((part) =>
              part.startsWith('<')
                ? part
                : part.replace(regex, '<mark class="content-highlight">$1</mark>'),
            )
            .join('');
        }

        this.renderedContent.set(this.sanitizer.bypassSecurityTrustHtml(html));
        this.loading.set(false);

        // Wait for rendering then scroll
        setTimeout(() => {
          this.scrollToMatchOrTop(searchTerm);
        }, 100);
      },
      error: (err) => {
        console.error('Error loading markdown:', err);
        this.renderedContent.set(
          this.sanitizer.bypassSecurityTrustHtml(
            '<p class="error-text">Error loading documentation content.</p>',
          ),
        );
        this.loading.set(false);
      },
    });
  }

  private scrollToMatchOrTop(searchTerm?: string): void {
    let found = false;
    if (searchTerm && this.contentArea) {
      const highlights = this.contentArea.nativeElement.querySelectorAll('.content-highlight');
      if (highlights.length > 0) {
        highlights[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        found = true;
      }
    }

    if (!found) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private attachLinkListeners(): void {
    if (!this.contentArea) return;

    const links = this.contentArea.nativeElement.querySelectorAll('a');
    links.forEach((link: HTMLAnchorElement) => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('#')) {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          this.handleInternalLink(href);
        });
      }
    });
  }

  private handleInternalLink(href: string): void {
    const decodedHref = decodeURIComponent(href).replace(/-/g, ' ');

    for (const section of this.docSections()) {
      const item = section.items.find((i: DocItem) => {
        if (!i.assetPath) return false;
        const filename = i.assetPath.split('/').pop()?.replace('.md', '');
        return (
          i.title.toLowerCase() === decodedHref.toLowerCase() ||
          filename?.toLowerCase() === href.toLowerCase()
        );
      });
      if (item) {
        this.selectItem(item);
        return;
      }
    }
    console.warn('Could not resolve internal link:', href);
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openExternalLink(url: string | undefined): void {
    if (url) window.open(url, '_blank');
  }
}
