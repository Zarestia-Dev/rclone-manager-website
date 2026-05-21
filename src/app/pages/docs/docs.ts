import {
  Component,
  inject,
  signal,
  ElementRef,
  ViewChild,
  effect,
  DestroyRef,
  afterNextRender,
  Injector,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked, Renderer } from 'marked';
import DOMPurify from 'dompurify';
import { DocService, DocItem } from '../../services/doc.service';
import { ViewportService } from '../../services/viewport.service';
import { TabService } from '../../services/tab.service';
import { DocsNavSheetComponent, NavSheetData } from './nav-sheet/nav-sheet';

@Component({
  selector: 'app-docs',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBottomSheetModule,
  ],
  templateUrl: './docs.html',
  styleUrl: './docs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Docs {
  public docService = inject(DocService);
  private sanitizer = inject(DomSanitizer);
  private bottomSheet = inject(MatBottomSheet);
  public viewport = inject(ViewportService);
  private tabService = inject(TabService);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);

  private get basePath(): string {
    return this.tabService.basePath;
  }

  private bottomSheetRef: MatBottomSheetRef<DocsNavSheetComponent> | null = null;
  private pendingScrollTerm: string | undefined;

  private renderCleanup?: AbortController;
  private tocObserver: IntersectionObserver | null = null;
  private visibleHeadings = new Map<string, IntersectionObserverEntry>();

  readonly selectedItem = signal<DocItem | null>(null);
  readonly toc = signal<{ id: string; text: string; level: number }[]>([]);
  readonly renderedContent = signal<SafeHtml>('');
  readonly loading = signal(false);
  readonly activeTocId = signal('');
  readonly isSearchFocused = signal(false);
  readonly searchFocusIndex = signal(-1);

  @ViewChild('contentArea') contentArea?: ElementRef;

  constructor() {
    marked.use({ breaks: true, gfm: true });
    history.scrollRestoration = 'manual';

    this.initIntersectionObserver();
    this.loadDocs();

    // Close the bottom sheet when the viewport leaves mobile
    effect(() => {
      if (!this.viewport.isMobile() && this.bottomSheetRef) {
        this.bottomSheetRef.dismiss();
        this.bottomSheetRef = null;
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.tocObserver?.disconnect();
      this.renderCleanup?.abort();
    });
  }

  // ─── Intersection Observer ──────────────────────────────────────────────────

  private initIntersectionObserver(): void {
    this.tocObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.visibleHeadings.set(entry.target.id, entry);
          } else {
            this.visibleHeadings.delete(entry.target.id);
          }
        }
        this.updateActiveTocId();
      },
      { rootMargin: '-100px 0px -70% 0px', threshold: 0 },
    );
  }

  private updateActiveTocId(): void {
    if (this.visibleHeadings.size === 0) return;
    const activeId = this.toc().map((t) => t.id).find((id) => this.visibleHeadings.has(id));
    if (activeId) this.activeTocId.set(activeId);
  }

  // ─── Data loading ───────────────────────────────────────────────────────────

  private loadDocs(): void {
    this.loading.set(true);
    this.docService
      .loadSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.docService.docSections.set(data.sections);
          this.docService.quickLinks.set(data.quickLinks);

          const pathParts = window.location.pathname
            .replace(this.basePath, '')
            .split('/')
            .filter(Boolean);
const       pageSlug = (pathParts.length >= 2 ? (pathParts.at(-1) ?? '') : '').toLowerCase();          const restoredItem = pageSlug
            ? this.docService.findItemBySlug(data.sections, pageSlug)
            : null;

          const itemToSelect = restoredItem ?? data.sections[0]?.items[0] ?? null;

          if (itemToSelect) {
            // loadContent owns the loading state from here
            this.selectItem(itemToSelect);
          } else {
            this.loading.set(false);
          }

          this.docService.startIndexing(data.sections);
        },
        error: () => this.loading.set(false),
      });
  }

  // ─── Item selection ─────────────────────────────────────────────────────────

  selectItem(item: DocItem, searchTerm?: string): void {
    if (item.isExternal) {
      window.open(item.url, '_blank');
      return;
    }
    if (!item.assetPath) return;

    this.selectedItem.set(item);
    const query = searchTerm ?? this.docService.searchQuery();
    this.docService.searchQuery.set('');
    this.loadContent(item.assetPath, query);
    this.updateDeepLink(item);
  }

  private updateDeepLink(item: DocItem): void {
    const slug = this.docService.itemSlug(item);
    const pathParts = window.location.pathname.replace(this.basePath, '').split('/');
    const currentSlug = pathParts.length >= 3 ? pathParts[2] : '';
    const hash = slug === currentSlug ? window.location.hash : '';
    history.pushState(null, '', `${this.basePath}/docs/${slug}${hash}`);
  }

  // ─── Nav sheet ──────────────────────────────────────────────────────────────

  openNavSheet(): void {
    const data: NavSheetData = {
      sections: this.docService.docSections(),
      quickLinks: this.docService.quickLinks(),
      selectedItem: this.selectedItem,
      searchQuery: this.docService.searchQuery,
      searchHits: this.docService.searchHits,
      isIndexing: this.docService.isIndexing,
      onSelect: (item, searchTerm) => this.selectItem(item, searchTerm),
      onSearch: (query) => this.onSearch(query),
    };

    this.bottomSheetRef = this.bottomSheet.open(DocsNavSheetComponent, {
      data,
      panelClass: 'docs-nav-sheet-panel',
    });

    // afterDismissed() completes on dismiss — no manual unsubscribe needed
    this.bottomSheetRef.afterDismissed().subscribe(() => {
      this.bottomSheetRef = null;
      if (this.pendingScrollTerm !== undefined) {
        this.scrollToMatchOrTop(this.pendingScrollTerm);
        this.pendingScrollTerm = undefined;
      }
    });
  }

  // ─── Search ─────────────────────────────────────────────────────────────────

  onSearch(query: string): void {
    this.docService.searchQuery.set(query);
    this.searchFocusIndex.set(-1);
  }

  onSearchBlur(): void {
    // Delay so click events on results fire before the overlay hides
    setTimeout(() => this.isSearchFocused.set(false), 200);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const hits = this.docService.searchHits();
    if (hits.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.searchFocusIndex.update((i) => (i + 1) % hits.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.searchFocusIndex.update((i) => (i - 1 + hits.length) % hits.length);
        break;
      case 'Enter':
        if (this.searchFocusIndex() >= 0) {
          event.preventDefault();
          this.selectItem(hits[this.searchFocusIndex()].item, this.docService.searchQuery());
        }
        break;
    }

    requestAnimationFrame(() => {
      document.querySelector('.search-hit.focused')?.scrollIntoView({ block: 'nearest' });
    });
  }

  // ─── Content rendering ──────────────────────────────────────────────────────

  private loadContent(path: string, searchTerm?: string): void {
    this.renderCleanup?.abort();
    this.renderCleanup = new AbortController();

    this.loading.set(true);
    this.docService
      .fetchPage(path)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (markdown) => {
          const docDir = path.split('/').slice(0, -1).join('/');
          const renderer = this.createRenderer(path);
          let html = marked.parse(markdown, { renderer }) as string;

          const query = searchTerm ?? this.docService.searchQuery();
          if (query.length >= 2) {
            html = this.docService.highlightContent(html, query);
          }

          html = this.docService.processCustomIcons(html);
          html = this.docService.processAlerts(html);

          // Resolve relative image src paths
          html = html.replace(
            /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
            (_, p1, src, p3) => `<img ${p1}src="${this.resolveAssetPath(docDir, src)}"${p3}>`,
          );

          const sanitizedHtml = DOMPurify.sanitize(html);
          this.renderedContent.set(this.sanitizer.bypassSecurityTrustHtml(sanitizedHtml));
          this.loading.set(false);

          // Single afterNextRender: DOM is ready — wire up everything that needs it
          afterNextRender(
            () => {
              this.attachLinkListeners();
              this.attachCopyButtons();
              this.extractAndSetToc();

              if (this.contentArea && this.tocObserver) {
                this.tocObserver.disconnect();
                this.visibleHeadings.clear();
                this.contentArea.nativeElement
                  .querySelectorAll('h1, h2, h3')
                  .forEach((h: Element) => this.tocObserver!.observe(h));
              }

              if (this.bottomSheetRef) {
                this.pendingScrollTerm = query;
              } else {
                this.scrollToMatchOrTop(query);
              }
            },
            { injector: this.injector },
          );
        },
        error: () => {
          this.renderedContent.set(
            this.sanitizer.bypassSecurityTrustHtml('<p class="error-text">Error loading content.</p>'),
          );
          this.loading.set(false);
        },
      });
  }

  private extractAndSetToc(): void {
    if (!this.contentArea) return;
    const tocItems: { id: string; text: string; level: number }[] = [];
    this.contentArea.nativeElement.querySelectorAll('h1, h2, h3').forEach((h: HTMLElement) => {
      if (!h.id) return;
      const clone = h.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.material-icons, .heading-anchor').forEach((el) => el.remove());
      tocItems.push({ id: h.id, text: clone.innerText.trim(), level: parseInt(h.tagName[1]) });
    });
    this.toc.set(tocItems);
  }

  private scrollToMatchOrTop(searchTerm?: string): void {
    if (searchTerm && this.contentArea) {
      const highlight = this.contentArea.nativeElement.querySelector('.content-highlight');
      if (highlight) {
        highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    if (window.location.hash && this.contentArea) {
      const target = this.contentArea.nativeElement.querySelector(window.location.hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToSection(id: string, event?: Event): void {
    event?.preventDefault();
    const target = this.contentArea?.nativeElement.querySelector(`#${CSS.escape(id)}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', `${window.location.pathname}#${id}`);
    }
  }

  // ─── DOM attachment ─────────────────────────────────────────────────────────

  private attachCopyButtons(): void {
    if (!this.contentArea) return;
    this.contentArea.nativeElement.querySelectorAll('pre').forEach((pre: HTMLElement) => {
      if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.title = 'Copy code';
      btn.innerHTML = '<span class="material-icons">content_copy</span>';
      btn.addEventListener(
        'click',
        async () => {
          const text = pre.querySelector('code')?.innerText ?? pre.innerText;
          try {
            await navigator.clipboard.writeText(text);
            btn.innerHTML = '<span class="material-icons">check</span>';
            btn.classList.add('copied');
            setTimeout(() => {
              btn.innerHTML = '<span class="material-icons">content_copy</span>';
              btn.classList.remove('copied');
            }, 2000);
          } catch {
            console.error('Failed to copy code to clipboard');
          }
        },
        { signal: this.renderCleanup?.signal },
      );

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.replaceWith(wrapper);
      wrapper.append(pre, btn);
    });
  }

  private attachLinkListeners(): void {
    if (!this.contentArea) return;
    this.contentArea.nativeElement.querySelectorAll('a').forEach((link: HTMLAnchorElement) => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#')) {
        link.addEventListener('click', (e) => this.scrollToSection(href.slice(1), e), {
          signal: this.renderCleanup?.signal,
        });
      } else if (!href.startsWith('http') && !href.startsWith('mailto')) {
        link.addEventListener(
          'click',
          (e) => {
            e.preventDefault();
            this.handleInternalLink(href);
          },
          { signal: this.renderCleanup?.signal },
        );
      }
    });
  }

  private handleInternalLink(href: string): void {
    const slug = href.split('/').pop()?.replace(/\.md$/i, '') ?? '';
    const item = this.docService.findItemBySlug(this.docService.docSections(), slug);
    if (item) this.selectItem(item);
  }

  openExternalLink(url: string | undefined): void {
    if (url) window.open(url, '_blank');
  }

  // ─── Markdown renderer ──────────────────────────────────────────────────────

  private createRenderer(path: string): Renderer {
    const renderer = new marked.Renderer();
    const usedIds = new Set<string>();
    const docDir = path.split('/').slice(0, -1).join('/');

    renderer.heading = ({ tokens, depth: level }: { tokens: any[]; depth: number }): string => {
      let text = marked.Parser.parseInline(tokens);
      let id: string | null = null;
      const idMatch = text.match(/\{#(.*?)\}/);
      if (idMatch) {
        id = idMatch[1];
        text = text.replace(/\{#.*?\}/, '').trim();
      }
      if (!id) {
        id = text
          .replace(/\[\[icon:.*?\]\]/gi, '')
          .replace(/icon:[a-z0-9_.-]+/gi, '')
          .toLowerCase()
          .replace(/<[^>]+>/g, '')
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
      }
      let uniqueId = id;
      let counter = 1;
      while (usedIds.has(uniqueId)) uniqueId = `${id}-${counter++}`;
      usedIds.add(uniqueId);
      return `<h${level} id="${uniqueId}">${text}<a class="heading-anchor" href="#${uniqueId}" aria-label="Link to section">§</a></h${level}>`;
    };

    renderer.image = ({ href, title, text }: { href: string; title: string | null; text: string }): string => {
      const resolvedHref = this.resolveAssetPath(docDir, href);
      return `<img src="${resolvedHref}" alt="${text}"${title ? ` title="${title}"` : ''}>`;
    };

    renderer.link = ({ href, title, tokens }: { href: string; title?: string | null; tokens: any[] }): string => {
      const text = marked.Parser.parseInline(tokens);
      if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto')) {
        const slug = href.split('/').pop()?.replace(/\.md$/i, '').toLowerCase() ?? '';
        href = `${this.basePath}/docs/${slug}`;
      }
      return `<a href="${href}"${title ? ` title="${title}"` : ''}>${text}</a>`;
    };

    return renderer;
  }

  private resolveAssetPath(docDir: string, href: string): string {
    if (!href || href.startsWith('http') || href.startsWith('/') || href.startsWith('data:')) {
      return href;
    }
    const parts = ['docs', ...docDir.split('/'), ...href.split('/')].filter((p) => p && p !== '.');
    const resolved: string[] = [];
    for (const p of parts) {
      if (p === '..') resolved.pop();
      else resolved.push(p);
    }
    return `${this.basePath}/${resolved.join('/')}`;
  }
}