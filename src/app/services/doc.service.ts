import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { from, map, mergeMap, shareReplay, Subject, takeUntil } from 'rxjs';
import { DestroyRef, Injectable, inject, signal, computed } from '@angular/core';
import { WikiService } from './wiki.service';

export interface DocItem {
  title: string;
  description?: string;
  url?: string;
  assetPath?: string;
  isExternal?: boolean;
  icon?: string;
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

@Injectable({
  providedIn: 'root',
})
export class DocService {
  private wikiService = inject(WikiService);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);

  docSections = signal<DocSection[]>([]);
  quickLinks = signal<DocItem[]>([]);
  searchQuery = signal('');
  private indexingCancel$ = new Subject<void>();
  searchIndex = new Map<string, string>(); // assetPath -> content
  isIndexing = signal(false);

  // Computed search hits based on query
  searchHits = computed(() => {
    const query = this.searchQuery();
    return this.search(query);
  });

  // Cache summary to avoid redundant fetches
  private summary$ = this.wikiService.fetchSidebar().pipe(
    map((content) => this.parseSummary(content)),
    shareReplay(1),
  );

  loadSummary() {
    return this.summary$;
  }

  fetchPage(path: string) {
    return this.wikiService.fetchPage(path);
  }

  search(query: string): SearchHit[] {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];

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
    return hits;
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

  /**
   * Replaces custom icon syntax [[icon:name]] or [[icon:name.color]]
   * with Material Icon HTML spans.
   */
  processCustomIcons(html: string): string {
    return html.replace(/\[\[icon:([a-z0-9_]+)(?:\.([a-z]+))?\]\]/g, (_, name, color) => {
      const cls = color ? ` ${color}` : '';
      return `<span class="material-icons md-icon${cls}">${name}</span>`;
    });
  }

  highlightContent(html: string, term: string): string {
    if (!term || term.length < 2) return html;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return html
      .split(/(<[^>]*>)/)
      .map((part) =>
        part.startsWith('<')
          ? part
          : part.replace(regex, '<mark class="content-highlight">$1</mark>'),
      )
      .join('');
  }

  private highlightMatch(text: string, query: string): SafeHtml {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return this.sanitizer.bypassSecurityTrustHtml(
      text.replace(regex, '<mark class="search-highlight">$1</mark>'),
    );
  }

  startIndexing(sections: DocSection[]) {
    const allItems = sections.flatMap((s) => s.items).filter((i) => i.assetPath);
    if (!allItems.length || this.isIndexing()) return;

    this.isIndexing.set(true);
    this.indexingCancel$.next(); // Cancel previous run
    let indexed = 0;

    from(allItems)
      .pipe(
        mergeMap((item) => {
          return this.wikiService
            .fetchPage(item.assetPath!)
            .pipe(map((content) => ({ item, content })));
        }, 4),
        takeUntil(this.indexingCancel$),
      )
      .subscribe({
        next: ({ item, content }) => {
          this.searchIndex.set(item.assetPath!, content.toLowerCase());
          if (++indexed === allItems.length) this.isIndexing.set(false);
        },
        error: () => {
          if (++indexed === allItems.length) this.isIndexing.set(false);
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
        const match = trimmed.match(/^- \[(.*?)\]\((.*?)\)(?:\s*\{(.*)\})?$/);
        if (!match) {
          console.warn(`[DocService] Malformed summary line: "${trimmed}"`);
          return;
        }

        const [, title, pathOrUrl, metaStr] = match;
        const metadata = this.parseMetadata(metaStr);
        const item: DocItem = {
          title: title.trim(),
          icon: metadata['icon'],
          description: metadata['description'],
          isExternal: pathOrUrl.startsWith('http'),
          url: pathOrUrl.startsWith('http') ? pathOrUrl : undefined,
          assetPath: pathOrUrl.startsWith('http') ? undefined : pathOrUrl,
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

  itemSlug(item: DocItem): string {
    if (item.assetPath) {
      return item.assetPath.split('/').pop()?.replace(/\.md$/i, '') ?? this.titleToSlug(item.title);
    }
    return this.titleToSlug(item.title);
  }

  titleToSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  findItemBySlug(sections: DocSection[], slug: string): DocItem | null {
    for (const section of sections) {
      for (const item of section.items) {
        if (this.itemSlug(item) === slug) return item;
      }
    }
    return null;
  }
}
