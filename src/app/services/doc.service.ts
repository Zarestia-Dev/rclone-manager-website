import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  from,
  map,
  concatMap,
  delay,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { Injectable, inject, signal, computed } from '@angular/core';
import { WikiService } from './wiki.service';
import { HttpClient } from '@angular/common/http';
import { GithubService } from './github.service';
import { GitHubRelease } from '../models/downloads.model';

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
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  private github = inject(GithubService);

  readonly docSections = signal<DocSection[]>([]);
  readonly quickLinks = signal<DocItem[]>([]);
  readonly searchQuery = signal('');
  readonly isIndexing = signal(false);

  private searchIndex = new Map<string, string>();
  private indexingCancel$ = new Subject<void>();
  private searchIndexCache$?: Observable<Record<string, string>>;
  private latestHeadlessRelease$?: Observable<GitHubRelease | undefined>;

  readonly searchHits = computed(() => this.search(this.searchQuery()));

  private readonly summary$ = this.wikiService.fetchSidebar().pipe(
    map((content) => this.parseSummary(content)),
    shareReplay(1),
  );

  loadSummary() {
    return this.summary$;
  }

  fetchPage(path: string) {
    return this.wikiService
      .fetchPage(path)
      .pipe(switchMap((markdown) => this.replaceDocPlaceholders(markdown)));
  }

  private replaceDocPlaceholders(markdown: string): Observable<string> {
    if (!markdown.includes('{{HEADLESS_LATEST_VERSION}}')) {
      return of(markdown);
    }
    return this.getLatestHeadlessRelease().pipe(
      map((release) => {
        const version = release?.tag_name.replace(/^headless-v/i, '') ?? 'latest';
        return markdown.replace(/{{HEADLESS_LATEST_VERSION}}/g, version);
      }),
    );
  }

  private getLatestHeadlessRelease(): Observable<GitHubRelease | undefined> {
    this.latestHeadlessRelease$ ??= this.github
      .get<GitHubRelease[]>('/repos/Zarestia-Dev/rclone-manager/releases')
      .pipe(
        map(
          (releases) =>
            releases
              .filter((r) => this.isHeadlessRelease(r))
              .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())[0],
        ),
        shareReplay(1),
      );
    return this.latestHeadlessRelease$;
  }

  private isHeadlessRelease(release: GitHubRelease): boolean {
    const tag = release.tag_name?.toLowerCase() ?? '';
    const name = release.name?.toLowerCase() ?? '';
    return (
      tag.includes('headless') ||
      name.includes('headless') ||
      !!release.assets?.some((a) => a.name.toLowerCase().includes('headless'))
    );
  }

  loadSearchIndex(forceRefresh = false): Observable<Record<string, string>> {
    if (forceRefresh) this.searchIndexCache$ = undefined;
    this.searchIndexCache$ ??= this.http
      .get<Record<string, string>>('docs/search-index.json')
      .pipe(shareReplay(1));
    return this.searchIndexCache$;
  }

  search(query: string): SearchHit[] {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];

    const hits: SearchHit[] = [];
    for (const section of this.docSections()) {
      for (const item of section.items) {
        const content = item.assetPath ? this.searchIndex.get(item.assetPath) : '';
        const titleMatch = item.title.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const contentMatch = content?.includes(q);

        if (titleMatch || descMatch || contentMatch) {
          hits.push({
            item,
            sectionTitle: section.title,
            snippet: this.highlightMatch(
              contentMatch ? this.extractSnippet(content!, q) : (item.description ?? ''),
              query,
            ),
            matchType: titleMatch ? 'title' : descMatch ? 'description' : 'content',
          });
        }
      }
    }
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

  processCustomIcons(html: string): string {
    return html.replace(/\[\[icon:([a-z0-9_]+)(?:\.([a-z]+))?\]\]/g, (_, name, color) => {
      const cls = color ? ` ${color}` : '';
      return `<span class="material-icons md-icon${cls}">${name}</span>`;
    });
  }

  processAlerts(html: string): string {
    const alertTypes: Record<string, { icon: string; title: string }> = {
      NOTE: { icon: 'info', title: 'Note' },
      TIP: { icon: 'lightbulb', title: 'Tip' },
      IMPORTANT: { icon: 'report_problem', title: 'Important' },
      WARNING: { icon: 'warning', title: 'Warning' },
      CAUTION: { icon: 'dangerous', title: 'Caution' },
    };

    return html.replace(
      /<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]([\s\S]*?)<\/blockquote>/gi,
      (_, type, content) => {
        const upperType = type.toUpperCase();
        const config = alertTypes[upperType];
        return `
          <div class="markdown-alert markdown-alert-${upperType.toLowerCase()}">
            <p class="markdown-alert-title">
              <span class="material-icons">${config.icon}</span>
              ${config.title}
            </p>
            ${content}
          </div>
        `;
      },
    );
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
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return this.sanitizer.bypassSecurityTrustHtml(
      text.replace(regex, '<mark class="search-highlight">$1</mark>'),
    );
  }

  startIndexing(sections: DocSection[]): void {
    if (this.isIndexing()) return;
    this.isIndexing.set(true);

    this.loadSearchIndex().subscribe({
      next: (index) => {
        for (const [key, value] of Object.entries(index)) {
          this.searchIndex.set(key, value);
        }
        this.isIndexing.set(false);
        console.log(`[DocService] Loaded search index: ${Object.keys(index).length} items.`);
      },
      error: (err: unknown) => {
        console.error('[DocService] Failed to load pre-generated search index:', err);
        this.manualIndexing(sections);
      },
    });
  }

  private manualIndexing(sections: DocSection[]): void {
    const allItems = sections.flatMap((s) => s.items).filter((i) => i.assetPath);
    if (!allItems.length) {
      this.isIndexing.set(false);
      return;
    }

    this.indexingCancel$.next();
    let indexed = 0;

    from(allItems)
      .pipe(
        concatMap((item) =>
          this.wikiService.fetchPage(item.assetPath!).pipe(
            map((content) => ({ item, content })),
            delay(100),
          ),
        ),
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

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('# ')) continue;

      if (trimmed.startsWith('## ')) {
        const [, title, metaStr] = trimmed.match(/^## (.*?)(?:\s*\{(.*)\})?$/) || [];
        if (!title) continue;

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
          continue;
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
        else currentSection?.items.push(item);
      }
    }

    return { sections, quickLinks };
  }

  private parseMetadata(metaStr?: string): Record<string, string> {
    const meta: Record<string, string> = {};
    if (!metaStr) return meta;
    for (const pair of metaStr.split(',')) {
      const [key, value] = pair.split('=').map((s) => s.trim());
      if (key && value) meta[key] = value.replace(/^["'](.*)["']$/, '$1');
    }
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

  clearMemoryCache(): void {
    this.searchIndexCache$ = undefined;
    this.searchIndex.clear();
  }
}