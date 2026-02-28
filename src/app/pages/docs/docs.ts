import {
  Component,
  inject,
  signal,
  ElementRef,
  ViewChild,
  OnInit,
  effect,
  DestroyRef,
  afterNextRender,
  Injector,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { DocService, DocItem } from '../../services/doc.service';
import { ViewportService } from '../../services/viewport.service';
import { TabService } from '../../services/tab.service';
import { A11yModule } from '@angular/cdk/a11y';
import { DocsNavSheetComponent, NavSheetData } from './nav-sheet/nav-sheet';

@Component({
  selector: 'app-docs',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBottomSheetModule,
    A11yModule,
  ],
  templateUrl: './docs.html',
  styleUrl: './docs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Docs implements OnInit {
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
  public isMobile = this.viewport.isMobile;
  public isWide = this.viewport.isWide;

  private renderCleanup?: AbortController;

  // IntersectionObserver for optimized TOC tracking
  private tocObserver: IntersectionObserver | null = null;
  private visibleHeadings = new Map<string, IntersectionObserverEntry>();

  docSections = this.docService.docSections;
  quickLinks = this.docService.quickLinks;
  isIndexing = this.docService.isIndexing;

  selectedItem = signal<DocItem | null>(null);
  toc = signal<{ id: string; text: string; level: number }[]>([]);
  renderedContent = signal<SafeHtml>('');
  loading = signal(false);
  activeTocId = signal('');
  isSearchFocused = signal(false);
  searchFocusIndex = signal(-1);

  @ViewChild('contentArea') contentArea?: ElementRef;

  constructor() {
    const renderer = new marked.Renderer();
    renderer.heading = (text: string, level: number): string => {
      const id = text
        .replace(/\[\[icon:.*?\]\]/gi, '')
        .replace(/icon:[a-z0-9_.-]+/gi, '')
        .toLowerCase()
        .replace(/<[^>]+>/g, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}" aria-label="Link to section">§</a>${text}</h${level}>`;
    };
    marked.use({ renderer, breaks: true, gfm: true });

    effect(() => {
      if (!this.isMobile() && this.bottomSheetRef) {
        this.bottomSheetRef.dismiss();
        this.bottomSheetRef = null;
      }
    });

    // Cleanup Observer when component is destroyed
    this.destroyRef.onDestroy(() => {
      if (this.tocObserver) {
        this.tocObserver.disconnect();
      }
    });
  }

  ngOnInit(): void {
    history.scrollRestoration = 'manual';
    this.loadDocs();
    this.initIntersectionObserver();
  }

  private initIntersectionObserver(): void {
    this.tocObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.visibleHeadings.set(entry.target.id, entry);
          } else {
            this.visibleHeadings.delete(entry.target.id);
          }
        });

        this.updateActiveTocId();
      },
      {
        rootMargin: '-100px 0px -70% 0px',
        threshold: 0,
      },
    );
  }

  private updateActiveTocId(): void {
    if (this.visibleHeadings.size === 0) return;
    const tocIds = this.toc().map((t) => t.id);
    const activeId = tocIds.find((id) => this.visibleHeadings.has(id));
    if (activeId) {
      this.activeTocId.set(activeId);
    }
  }

  private loadDocs(): void {
    this.loading.set(true);
    this.docService
      .loadSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.docService.docSections.set(data.sections);
          this.docService.quickLinks.set(data.quickLinks);

          const pathParts = window.location.pathname.replace(this.basePath, '').split('/');
          const pageSlug = pathParts.length >= 3 ? pathParts[2] : '';
          const restoredItem = pageSlug
            ? this.docService.findItemBySlug(data.sections, pageSlug)
            : null;

          const itemToSelect = restoredItem ?? (data.sections[0]?.items[0] || null);

          if (itemToSelect) this.selectItem(itemToSelect);

          this.loading.set(false);
          this.docService.startIndexing(data.sections);
        },
        error: () => this.loading.set(false),
      });
  }

  selectItem(item: DocItem, searchTerm?: string): void {
    if (item.isExternal) {
      window.open(item.url, '_blank');
      return;
    }
    if (!item.assetPath) return;

    this.selectedItem.set(item);
    const query = searchTerm || this.docService.searchQuery();
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

  openNavSheet(): void {
    const data: NavSheetData = {
      sections: this.docSections(),
      quickLinks: this.quickLinks(),
      selectedItem: this.selectedItem,
      searchQuery: this.docService.searchQuery,
      searchHits: this.docService.searchHits,
      isIndexing: this.isIndexing,
      onSelect: (item: DocItem, searchTerm?: string) => this.selectItem(item, searchTerm),
      onSearch: (query: string) => this.onSearch(query),
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

  onSearch(query: string): void {
    this.docService.searchQuery.set(query);
    this.searchFocusIndex.set(-1);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const hits = this.docService.searchHits();
    if (hits.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.searchFocusIndex.update((i) => (i + 1) % hits.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.searchFocusIndex.update((i) => (i - 1 + hits.length) % hits.length);
    } else if (event.key === 'Enter' && this.searchFocusIndex() >= 0) {
      event.preventDefault();
      this.selectItem(hits[this.searchFocusIndex()].item, this.docService.searchQuery());
    }

    requestAnimationFrame(() => {
      const focused = document.querySelector('.search-hit.focused');
      focused?.scrollIntoView({ block: 'nearest' });
    });
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.isSearchFocused.set(false);
    }, 200);
  }

  private loadContent(path: string, searchTerm?: string): void {
    this.renderCleanup?.abort();
    this.renderCleanup = new AbortController();

    this.loading.set(true);
    this.docService.fetchPage(path).subscribe({
      next: (markdown) => {
        let html = marked.parse(markdown) as string;
        const query = searchTerm || this.docService.searchQuery();

        if (query && query.length >= 2) {
          html = this.docService.highlightContent(html, query);
        }

        html = this.docService.processCustomIcons(html);
        const sanitizedHtml = DOMPurify.sanitize(html);
        this.renderedContent.set(this.sanitizer.bypassSecurityTrustHtml(sanitizedHtml));
        this.loading.set(false);
        this.extractToc();

        afterNextRender(
          () => {
            this.attachLinkListeners();
            this.attachCopyButtons();

            // Re-attach IntersectionObserver directly onto the elements
            if (this.contentArea && this.tocObserver) {
              this.tocObserver.disconnect();
              this.visibleHeadings.clear();
              const domHeadings = this.contentArea.nativeElement.querySelectorAll('h1, h2, h3');
              domHeadings.forEach((h: Element) => this.tocObserver?.observe(h));
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
          this.sanitizer.bypassSecurityTrustHtml(
            '<p class="error-text">Error loading content.</p>',
          ),
        );
        this.loading.set(false);
      },
    });
  }

  private extractToc(): void {
    afterNextRender(
      () => {
        if (!this.contentArea) return;
        const headings = this.contentArea.nativeElement.querySelectorAll('h1, h2, h3');
        const tocItems: { id: string; text: string; level: number }[] = [];
        headings.forEach((h: HTMLElement) => {
          if (h.id) {
            const clone = h.cloneNode(true) as HTMLElement;
            clone.querySelectorAll('.material-icons, .heading-anchor').forEach((el) => el.remove());

            tocItems.push({
              id: h.id,
              text: clone.innerText.trim(),
              level: parseInt(h.tagName.substring(1)),
            });
          }
        });
        this.toc.set(tocItems);
      },
      { injector: this.injector },
    );
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
    if (!found && window.location.hash && this.contentArea) {
      const target = this.contentArea.nativeElement.querySelector(window.location.hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        found = true;
      }
    }
    if (!found) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToSection(id: string, event?: Event): void {
    if (event) event.preventDefault();
    const target = this.contentArea?.nativeElement.querySelector(`#${CSS.escape(id)}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const pathWithoutHash = window.location.pathname;
      history.pushState(null, '', `${pathWithoutHash}#${id}`);
    }
  }

  private attachCopyButtons(): void {
    if (!this.contentArea) return;
    const preBlocks = this.contentArea.nativeElement.querySelectorAll('pre');
    preBlocks.forEach((pre: HTMLElement) => {
      if (pre.querySelector('.code-copy-btn')) return;

      pre.style.position = 'relative';

      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.title = 'Copy code';
      btn.innerHTML = '<span class="material-icons">content_copy</span>';

      btn.addEventListener(
        'click',
        async () => {
          const code = pre.querySelector('code');
          const text = code?.innerText ?? pre.innerText;
          try {
            await navigator.clipboard.writeText(text);
            btn.innerHTML = '<span class="material-icons">check</span>';
            btn.classList.add('copied');
            setTimeout(() => {
              btn.innerHTML = '<span class="material-icons">content_copy</span>';
              btn.classList.remove('copied');
            }, 2000);
          } catch {
            // clipboard not available (non-https)
          }
        },
        { signal: this.renderCleanup?.signal },
      );

      pre.appendChild(btn);
    });
  }

  private attachLinkListeners(): void {
    if (!this.contentArea) return;
    const links = this.contentArea.nativeElement.querySelectorAll('a');
    links.forEach((link: HTMLAnchorElement) => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#')) {
        link.addEventListener('click', (event) => this.scrollToSection(href.slice(1), event), {
          signal: this.renderCleanup?.signal,
        });
      } else if (!href.startsWith('http') && !href.startsWith('mailto')) {
        link.addEventListener(
          'click',
          (event) => {
            event.preventDefault();
            this.handleInternalLink(href);
          },
          { signal: this.renderCleanup?.signal },
        );
      }
    });
  }

  private handleInternalLink(href: string): void {
    const slug = href.split('/').pop()?.replace(/\.md$/i, '') ?? '';
    const item = this.docService.findItemBySlug(this.docSections(), slug);

    if (item) {
      this.selectItem(item);
    }
  }

  openExternalLink(url: string | undefined): void {
    if (url) window.open(url, '_blank');
  }
}
