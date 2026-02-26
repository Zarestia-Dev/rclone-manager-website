import { Component, inject, signal, ElementRef, ViewChild, OnInit, effect } from '@angular/core';
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
import { DocService, DocItem } from '../../services/doc.service';
import { ViewportService } from '../../services/viewport.service';
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
  ],
  templateUrl: './docs.html',
  styleUrl: './docs.scss',
})
export class Docs implements OnInit {
  public docService = inject(DocService);
  private sanitizer = inject(DomSanitizer);
  private bottomSheet = inject(MatBottomSheet);
  public viewport = inject(ViewportService);

  // Auto-close bottom sheet on resize to desktop
  private bottomSheetRef: MatBottomSheetRef<DocsNavSheetComponent> | null = null;
  public isMobile = this.viewport.isMobile;
  public isWide = this.viewport.isWide;

  /** Reads <base href> baked in by Angular build. Returns '' in dev, '/zarestia/rclone-manager' in prod. */
  private get basePath(): string {
    const href = document.querySelector('base')?.getAttribute('href') ?? '/';
    return href === '/' ? '' : href.replace(/\/$/, '');
  }

  // Re-expose signals from service for easier template access if needed,
  // though we can also use public docService.
  docSections = this.docService.docSections;
  quickLinks = this.docService.quickLinks;
  isIndexing = this.docService.isIndexing;

  // Local component state
  selectedItem = signal<DocItem | null>(null);
  toc = signal<{ id: string; text: string; level: number }[]>([]);
  renderedContent = signal<SafeHtml>('');
  loading = signal(false);
  activeTocId = signal('');
  isSearchFocused = signal(false);

  @ViewChild('contentArea') contentArea?: ElementRef;

  constructor() {
    const renderer = new marked.Renderer();
    renderer.heading = (text: string, level: number): string => {
      const id = text
        .toLowerCase()
        .replace(/<[^>]+>/g, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}" aria-label="Link to section">§</a>${text}</h${level}>`;
    };
    marked.setOptions({ renderer, breaks: true, gfm: true } as Parameters<
      typeof marked.setOptions
    >[0]);

    // Auto-close effect
    effect(() => {
      if (!this.isMobile() && this.bottomSheetRef) {
        this.bottomSheetRef.dismiss();
        this.bottomSheetRef = null;
      }
    });
  }

  ngOnInit(): void {
    this.loadDocs();
    this.initScrollListener();
  }

  private initScrollListener(): void {
    window.addEventListener(
      'scroll',
      () => {
        if (!this.contentArea || this.toc().length === 0) return;

        const headings = this.contentArea.nativeElement.querySelectorAll('h1, h2, h3');
        let currentId = '';

        for (const h of headings) {
          const rect = h.getBoundingClientRect();
          if (rect.top < 150) {
            currentId = h.id;
          } else {
            break;
          }
        }

        this.activeTocId.set(currentId || (this.toc()[0]?.id ?? ''));
      },
      { passive: true },
    );
  }

  private loadDocs(): void {
    this.loading.set(true);
    this.docService.loadSummary().subscribe({
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
      onSelect: (item: DocItem) => this.selectItem(item),
      onSearch: (query: string) => this.onSearch(query),
    };

    this.bottomSheetRef = this.bottomSheet.open(DocsNavSheetComponent, {
      data,
      panelClass: 'docs-nav-sheet-panel',
    });

    this.bottomSheetRef.afterDismissed().subscribe(() => {
      this.bottomSheetRef = null;
    });
  }

  onSearch(query: string): void {
    this.docService.searchQuery.set(query);
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.isSearchFocused.set(false);
    }, 200);
  }

  private loadContent(path: string, searchTerm?: string): void {
    this.loading.set(true);
    this.docService.fetchPage(path).subscribe({
      next: (markdown) => {
        let html = marked.parse(markdown) as string;
        const query = searchTerm || this.docService.searchQuery();

        if (query && query.length >= 2) {
          html = this.docService.highlightContent(html, query);
        }

        html = this.docService.processCustomIcons(html);
        this.renderedContent.set(this.sanitizer.bypassSecurityTrustHtml(html));
        this.loading.set(false);
        this.extractToc();
        setTimeout(() => {
          this.attachLinkListeners();
          this.attachCopyButtons();
          this.scrollToMatchOrTop(query);
        }, 100);
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
    // We use a small delay to ensure content is in DOM.
    setTimeout(() => {
      if (!this.contentArea) return;
      const headings = this.contentArea.nativeElement.querySelectorAll('h1, h2, h3');
      const tocItems: { id: string; text: string; level: number }[] = [];
      headings.forEach((h: HTMLElement) => {
        if (h.id) {
          tocItems.push({
            id: h.id,
            text: h.innerText.replace('§', '').trim(),
            level: parseInt(h.tagName.substring(1)),
          });
        }
      });
      this.toc.set(tocItems);
    }, 0);
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
      // Avoid adding twice if content is reloaded
      if (pre.querySelector('.code-copy-btn')) return;

      pre.style.position = 'relative';

      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.title = 'Copy code';
      btn.innerHTML = '<span class="material-icons">content_copy</span>';

      btn.addEventListener('click', async () => {
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
      });

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
        link.addEventListener('click', (event) => this.scrollToSection(href.slice(1), event));
      } else if (!href.startsWith('http') && !href.startsWith('mailto')) {
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
  }

  openExternalLink(url: string | undefined): void {
    if (url) window.open(url, '_blank');
  }
}
