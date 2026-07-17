import {
  Component,
  inject,
  signal,
  computed,
  ElementRef,
  viewChild,
  effect,
  DestroyRef,
  afterNextRender,
  Injector,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
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
import { marked, Renderer, Token } from 'marked';
import DOMPurify from 'dompurify';
import { DocService, DocItem } from '../../services/doc.service';
import { ViewportService } from '../../../../core/services/viewport.service';
import { DocsNavSheetComponent, NavSheetData } from '../nav-sheet/nav-sheet';
import { HighlightService } from '../../services/highlight.service';

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
  host: {
    '(window:scroll)': 'onWindowScroll()',
    '(window:resize)': 'onWindowResize()',
  },
})
export class Docs {
  public docService = inject(DocService);
  private sanitizer = inject(DomSanitizer);
  private bottomSheet = inject(MatBottomSheet);
  public viewport = inject(ViewportService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);
  private highlight = inject(HighlightService);

  /**
   * Base path baked into <base href> at build time. Used to rewrite relative
   * asset/image paths inside rendered markdown so they resolve against the
   * deployment sub-path (e.g. `/zarestia/rclone-manager/docs/...`).
   */
  private get basePath(): string {
    const href = document.querySelector('base')?.getAttribute('href') ?? '/';
    return href === '/' ? '' : href.replace(/\/$/, '');
  }

  private bottomSheetRef: MatBottomSheetRef<DocsNavSheetComponent> | null = null;
  private pendingScrollTerm: string | undefined;

  private renderCleanup?: AbortController;
  /** Ordered list of heading elements currently rendered in the content area. */
  private headingElements: HTMLElement[] = [];
  /** Non-zero while a scroll-driven active-heading update is scheduled. */
  private scrollSpyRafId = 0;
  /** The current doc slug, mirrored from the route for use in templates/handlers. */
  private currentSlug = '';

  readonly selectedItem = signal<DocItem | null>(null);
  readonly toc = signal<{ id: string; text: string; level: number }[]>([]);
  readonly renderedContent = signal<SafeHtml>('');
  readonly loading = signal(false);
  readonly activeTocId = signal('');
  readonly isSearchFocused = signal(false);
  readonly searchFocusIndex = signal(-1);

  readonly minTocLevel = computed(() => {
    const levels = this.toc().map((item) => item.level);
    return levels.length > 0 ? Math.min(...levels) : 2;
  });

  getTocLinkCoords(index: number): { x1: number; x2: number; relLevel: number } {
    const toc = this.toc();
    const link = toc[index];
    const prevLink = index > 0 ? toc[index - 1] : undefined;
    const minLevel = this.minTocLevel();

    const relLevel = Math.max(0, Math.min(2, link.level - minLevel));
    const prevRelLevel = prevLink
      ? Math.max(0, Math.min(2, prevLink.level - minLevel))
      : relLevel;

    const getX = (level: number) => 8 + level * 16;
    const x2 = getX(relLevel);
    const x1 = getX(prevRelLevel);

    return { x1, x2, relLevel };
  }

  readonly bgPathD = signal<string>('');
  readonly activeDashArray = signal<string>('0, 0');
  readonly activeDashOffset = signal<number>(0);
  readonly markerVisible = signal<boolean>(false);

  // Signal-based view query. Typed as ElementRef<HTMLElement> so the
  // underlying nativeElement is typed (avoids `any` propagation through
  // querySelector/querySelectorAll calls below).
  readonly contentArea = viewChild<ElementRef<HTMLElement>>('contentArea');

  constructor() {
    marked.use({ breaks: true, gfm: true });

    this.loadDocs();

    // React to in-app navigation between doc slugs (and to back/forward
    // popstates, which the Router surfaces as param changes). When the route
    // changes we pick the corresponding item and render it; the URL is the
    // single source of truth, so we never push history manually.
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) return;
      this.currentSlug = slug;
      // Only load if the slug actually differs from the currently-selected item
      const current = this.selectedItem();
      if (current && this.docService.itemSlug(current) === slug) return;
      const item = this.docService.findItemBySlug(this.docService.docSections(), slug);
      if (item) {
        this.selectedItem.set(item);
        this.loadContent(item.assetPath!);
      }
    });

    // React to fragment changes (in-page anchor navigation via back/forward).
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fragment) => {
      if (!fragment) return;
      // Defer until the rendered content has headings in place.
      afterNextRender(
        () => {
          this.scrollToAnchor(fragment);
        },
        { injector: this.injector },
      );
    });

    // Update active sliding marker position when active heading changes
    effect(() => {
      this.activeTocId();
      requestAnimationFrame(() => {
        this.updateActiveMarker();
      });
    });

    // Close the bottom sheet when the viewport leaves mobile
    effect(() => {
      if (!this.viewport.isMobile() && this.bottomSheetRef) {
        this.bottomSheetRef.dismiss();
        this.bottomSheetRef = null;
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.scrollSpyRafId) cancelAnimationFrame(this.scrollSpyRafId);
      this.renderCleanup?.abort();
    });
  }

  // ─── Scroll spy (active TOC highlighting) ──────────────────────────────────

  onWindowScroll(): void {
    if (this.scrollSpyRafId) return;
    this.scrollSpyRafId = requestAnimationFrame(() => {
      this.scrollSpyRafId = 0;
      this.updateActiveFromScroll();
    });
  }

  onWindowResize(): void {
    this.updateActiveMarker();
  }

  private updateActiveFromScroll(): void {
    if (this.headingElements.length === 0) return;
    const triggerLine = 120;
    let active = this.headingElements[0];
    for (const heading of this.headingElements) {
      if (heading.getBoundingClientRect().top <= triggerLine) {
        active = heading;
      } else {
        break;
      }
    }
    if (active.id && this.activeTocId() !== active.id) {
      this.activeTocId.set(active.id);
    }
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

          // Read the initial slug from the route (covers deep-link/refresh).
          const slug = this.route.snapshot.paramMap.get('slug') ?? '';
          this.currentSlug = slug;
          const restoredItem = slug
            ? this.docService.findItemBySlug(data.sections, slug)
            : null;

          const itemToSelect = restoredItem ?? data.sections[0]?.items[0] ?? null;

          if (itemToSelect) {
            this.selectedItem.set(itemToSelect);
            // If we landed on /docs without a slug, normalize the URL so the
            // first item is deep-linkable from the start.
            if (!slug) {
              void this.router.navigate(['/docs', this.docService.itemSlug(itemToSelect)], {
                replaceUrl: true,
              });
            }
            this.loadContent(itemToSelect.assetPath!);
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

    const slug = this.docService.itemSlug(item);
    this.selectedItem.set(item);
    const query = searchTerm ?? this.docService.searchQuery();
    this.docService.searchQuery.set('');

    // Only navigate (and create a history entry) if this is a different slug.
    if (slug !== this.currentSlug) {
      this.currentSlug = slug;
      void this.router.navigate(['/docs', slug]);
    } else {
      // Same page — just reload content (e.g. search-triggered re-render).
      this.loadContent(item.assetPath, query);
      return;
    }

    // Defer content load until the route change settles — this way the
    // NavigationEnd handler in the route subscription doesn't double-load.
    this.loadContent(item.assetPath, query);
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
            (_match, p1: string, src: string, p3: string) =>
              `<img ${p1}src="${this.resolveAssetPath(docDir, src)}"${p3}>`,
          );

          const sanitizedHtml = DOMPurify.sanitize(html);
          this.renderedContent.set(this.sanitizer.bypassSecurityTrustHtml(sanitizedHtml));
          this.loading.set(false);

          // Single afterNextRender: DOM is ready — wire up everything that needs it
          afterNextRender(
            () => {
              this.attachLinkListeners();
              this.attachCopyButtons();
              this.highlightCodeBlocks();
              this.extractAndSetToc();
              this.updateActiveFromScroll();

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
    const contentEl = this.contentArea()?.nativeElement;
    if (!contentEl) return;
    const tocItems: { id: string; text: string; level: number }[] = [];
    const headings: HTMLElement[] = [];
    contentEl.querySelectorAll<HTMLElement>('h1, h2, h3, h4').forEach((h) => {
      if (!h.id) return;
      headings.push(h);
      const clone = h.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.material-icons, .heading-anchor').forEach((el) => el.remove());
      tocItems.push({ id: h.id, text: clone.innerText.trim(), level: parseInt(h.tagName[1]) });
    });
    this.headingElements = headings;
    this.toc.set(tocItems);
  }

  private scrollToMatchOrTop(searchTerm?: string): void {
    const contentEl = this.contentArea()?.nativeElement;
    if (searchTerm && contentEl) {
      const highlight = contentEl.querySelector<HTMLElement>('.content-highlight');
      if (highlight) {
        highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    const fragment = this.route.snapshot.fragment;
    if (fragment && contentEl) {
      this.scrollToAnchor(fragment);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private scrollToAnchor(fragment: string): void {
    const contentEl = this.contentArea()?.nativeElement;
    if (!contentEl || !fragment) return;
    const target = contentEl.querySelector<HTMLElement>(`#${CSS.escape(fragment)}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Smooth-scroll to a heading and update the URL fragment via the Router so
   * back/forward navigation works (the previous scroll position is restored
   * by withInMemoryScrolling's scrollPositionRestoration).
   */
  scrollToSection(id: string, event?: Event): void {
    event?.preventDefault();
    const target = this.contentArea()?.nativeElement.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update the fragment through the Router so a history entry is created.
      void this.router.navigate(['/docs', this.currentSlug], { fragment: id });
    }
  }

  // ─── DOM attachment ─────────────────────────────────────────────────────────

  private attachCopyButtons(): void {
    const contentEl = this.contentArea()?.nativeElement;
    if (!contentEl) return;
    contentEl.querySelectorAll<HTMLPreElement>('pre').forEach((pre) => {
      if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.title = 'Copy code';
      btn.type = 'button';
      btn.innerHTML = '<span class="material-icons">content_copy</span>';
      btn.addEventListener(
        'click',
        () => void this.copyCodeToClipboard(pre, btn),
        { signal: this.renderCleanup?.signal },
      );

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.replaceWith(wrapper);
      wrapper.append(pre, btn);
    });
  }

  /**
   * Extracted async body of the copy-button click handler. Returns a Promise
   * but the caller wraps it with `void` so the click handler itself returns
   * void (avoids `no-misused-promises` and `no-floating-promises`).
   */
  private async copyCodeToClipboard(pre: HTMLElement, btn: HTMLButtonElement): Promise<void> {
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
  }

  /**
   * Attach delegated click handling on rendered markdown links:
   * - `#anchor` → smooth scroll + Router fragment update (creates history entry)
   * - internal `.md` link (already rewritten to `<basePath>/docs/<slug>` by
   *   the renderer) → Router.navigate (full deep-linkable navigation)
   * - `http(s)://`, `mailto:`, `tel:` → left untouched, browser handles them
   *   normally with `target="_blank" rel="noopener noreferrer"`
   *
   * This replaces the old history.pushState hack and makes back/forward work.
   */
  private attachLinkListeners(): void {
    const contentEl = this.contentArea()?.nativeElement;
    if (!contentEl) return;
    contentEl.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;

      if (href.startsWith('#')) {
        link.addEventListener(
          'click',
          (e) => this.scrollToSection(href.slice(1), e),
          { signal: this.renderCleanup?.signal },
        );
      } else if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        // Internal doc links are rewritten by the renderer to
        // `<basePath>/docs/<slug>` — detect the `/docs/<slug>` segment
        // anywhere in the path so this works in both dev (basePath='') and
        // prod (basePath='/zarestia/rclone-manager'). External links (http,
        // mailto, tel) are explicitly excluded so a URL like
        // `https://github.com/foo/docs/bar` is not intercepted.
        const match = href.match(/\/docs\/([^/?#]+)/);
        if (match) {
          const slug = decodeURIComponent(match[1]);
          link.addEventListener(
            'click',
            (e) => {
              e.preventDefault();
              if (slug && slug !== this.currentSlug) {
                void this.router.navigate(['/docs', slug]);
              }
            },
            { signal: this.renderCleanup?.signal },
          );
        }
      }
      // External (http/https/mailto/tel) and other links are left to the browser.
    });
  }

  /**
   * Apply syntax highlighting to every fenced code block in the rendered
   * content. The HighlightService is lazy-loaded on first use so it doesn't
   * bloat the initial bundle for visitors who never open a docs page.
   */
  private highlightCodeBlocks(): void {
    const contentEl = this.contentArea()?.nativeElement;
    if (!contentEl) return;
    const blocks = Array.from(
      contentEl.querySelectorAll<HTMLElement>('pre code'),
    );
    if (blocks.length === 0) return;
    void this.highlight.highlightAll(blocks);
  }

  openExternalLink(url: string | undefined): void {
    if (url) window.open(url, '_blank');
  }

  // ─── Markdown renderer ──────────────────────────────────────────────────────

  private createRenderer(path: string): Renderer {
    const renderer = new marked.Renderer();
    const usedIds = new Set<string>();
    const docDir = path.split('/').slice(0, -1).join('/');

    renderer.heading = ({ tokens, depth: level }: { tokens: Token[]; depth: number }): string => {
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

    renderer.link = ({ href, title, tokens }: { href: string; title?: string | null; tokens: Token[] }): string => {
      const text = marked.Parser.parseInline(tokens);
      if (!href) return text;

      // External links: open in new tab, never intercepted.
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer"${title ? ` title="${title}"` : ''}>${text}</a>`;
      }
      // Same-page anchor: leave href as-is, click handler smooth-scrolls.
      if (href.startsWith('#')) {
        return `<a href="${href}"${title ? ` title="${title}"` : ''}>${text}</a>`;
      }
      // Internal .md link: rewrite to /docs/<slug>. Click handler routes via Router.
      const slug = href.split('/').pop()?.replace(/\.md$/i, '').toLowerCase() ?? '';
      const url = `${this.basePath}/docs/${slug}`;
      return `<a href="${url}"${title ? ` title="${title}"` : ''}>${text}</a>`;
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

  private updateActiveMarker(): void {
    if (!this.contentArea()) {
      this.markerVisible.set(false);
      return;
    }

    const container = document.querySelector<HTMLElement>('.toc-nav');
    if (!container) return;

    const links = Array.from(container.querySelectorAll<HTMLElement>('.toc-link'));
    if (links.length === 0) {
      this.markerVisible.set(false);
      return;
    }

    const activeEl = container.querySelector<HTMLElement>('.toc-link.active');

    // Construct the continuous path
    let pathD = '';
    let cumulative = 0;
    const itemSegments: { start: number; length: number }[] = [];

    for (let i = 0; i < links.length; i++) {
      const linkEl = links[i];
      const coords = this.getTocLinkCoords(i);
      const y = linkEl.offsetTop;
      const h = linkEl.offsetHeight;

      let segmentLength: number;
      if (i === 0) {
        pathD = `M ${coords.x2} ${y} L ${coords.x2} ${y + h}`;
        segmentLength = h;
      } else {
        const prevCoords = this.getTocLinkCoords(i - 1);
        if (coords.x1 !== coords.x2) {
          // It jogs
          const diag = Math.sqrt(Math.pow(coords.x2 - coords.x1, 2) + 64); // 8px height
          pathD += ` L ${prevCoords.x2} ${y} L ${coords.x2} ${y + 8} L ${coords.x2} ${y + h}`;
          segmentLength = (y - (links[i - 1].offsetTop + links[i - 1].offsetHeight)) + diag + (h - 8);
        } else {
          // Straight line
          pathD += ` L ${coords.x2} ${y + h}`;
          segmentLength = h + (y - (links[i - 1].offsetTop + links[i - 1].offsetHeight));
        }
      }

      itemSegments.push({
        start: cumulative,
        length: segmentLength
      });
      cumulative += segmentLength;
    }

    this.bgPathD.set(pathD);

    if (activeEl) {
      const index = links.indexOf(activeEl);
      if (index !== -1) {
        const segment = itemSegments[index];
        this.activeDashArray.set(`${segment.length}, ${cumulative}`);
        this.activeDashOffset.set(-segment.start);
        this.markerVisible.set(true);
      } else {
        this.markerVisible.set(false);
      }
    } else {
      this.markerVisible.set(false);
    }
  }
}
