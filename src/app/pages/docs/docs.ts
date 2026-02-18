import { Component, inject, signal, effect, ElementRef, ViewChild, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import hljs from 'highlight.js';

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
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  docSections = signal<DocSection[]>([]);
  quickLinks = signal<DocItem[]>([]);

  selectedItem = signal<DocItem | null>(null);
  renderedContent = signal<SafeHtml>('');
  loading = signal(false);

  @ViewChild('contentArea') contentArea?: ElementRef;

  constructor() {
    // Re-highlight and attach listeners when content changes
    effect(() => {
      if (this.renderedContent()) {
        setTimeout(() => {
          this.highlightCode();
          this.attachLinkListeners();
        }, 0);
      }
    });

    // Configure marked
    const renderer = new marked.Renderer();
    marked.setOptions({
      renderer,
      highlight: (code: string, lang: string) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
      breaks: true,
      gfm: true,
    } as Parameters<typeof marked.setOptions>[0]);
  }

  ngOnInit(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    this.loading.set(true);
    this.http.get('docs/sidebar.md', { responseType: 'text' }).subscribe({
      next: (content) => {
        const { sections, quickLinks } = this.parseSummary(content);
        this.docSections.set(sections);
        this.quickLinks.set(quickLinks);

        // Auto-select first item (Home)
        if (sections.length > 0 && sections[0].items.length > 0) {
          this.selectItem(sections[0].items[0]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading documentation summary:', err);
        this.loading.set(false);
      },
    });
  }

  private parseSummary(content: string): { sections: DocSection[]; quickLinks: DocItem[] } {
    const sections: DocSection[] = [];
    let currentSection: DocSection | null = null;
    let inQuickLinks = false;
    const quickLinks: DocItem[] = [];

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('# ')) continue;

      if (trimmed.startsWith('## ')) {
        const headerMatch = trimmed.match(/^## (.*?)(?:\s*\{(.*)\})?$/);
        if (headerMatch) {
          const title = headerMatch[1].trim();
          const metadata = this.parseMetadata(headerMatch[2]);

          if (title === 'Quick Links') {
            inQuickLinks = true;
            currentSection = null;
          } else {
            inQuickLinks = false;
            currentSection = {
              title,
              icon: metadata['icon'] || 'folder',
              description: metadata['description'] || '',
              items: [],
            };
            sections.push(currentSection);
          }
        }
        continue;
      }

      if (trimmed.startsWith('- ')) {
        const itemMatch = trimmed.match(/^- \[(.*?)\]\((.*?)\)(?:\s*\{(.*)\})?$/);
        if (itemMatch) {
          const title = itemMatch[1].trim();
          const pathOrUrl = itemMatch[2].trim();
          const metadata = this.parseMetadata(itemMatch[3]);

          const item: DocItem = {
            title,
            icon: metadata['icon'],
            description: metadata['description'],
            isExternal: pathOrUrl.startsWith('http'),
            url: pathOrUrl.startsWith('http') ? pathOrUrl : undefined,
            assetPath: pathOrUrl.startsWith('http') ? undefined : pathOrUrl,
            type: metadata['type'] as 'primary' | 'accent' | 'warn' | 'basic',
          };

          if (inQuickLinks) {
            quickLinks.push(item);
          } else if (currentSection) {
            currentSection.items.push(item);
          }
        }
      }
    }
    return { sections, quickLinks };
  }

  private parseMetadata(metaStr: string | undefined): Record<string, string> {
    const meta: Record<string, string> = {};
    if (!metaStr) return meta;

    const pairs = metaStr.split(',');
    for (const pair of pairs) {
      const parts = pair.split('=');
      const key = parts[0]?.trim();
      const value = parts[1]?.trim();
      if (key && value) {
        meta[key] = value.replace(/^["'](.*)["']$/, '$1');
      }
    }
    return meta;
  }

  selectItem(item: DocItem): void {
    if (item.isExternal) {
      window.open(item.url, '_blank');
      return;
    }

    if (!item.assetPath) return;

    this.selectedItem.set(item);
    this.loadContent(item.assetPath);
  }

  private loadContent(path: string): void {
    this.loading.set(true);
    this.http.get(`docs/${path}`, { responseType: 'text' }).subscribe({
      next: (markdown) => {
        const html = marked.parse(markdown) as string;
        this.renderedContent.set(this.sanitizer.bypassSecurityTrustHtml(html));
        this.loading.set(false);
        this.scrollToTop();
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

  private highlightCode(): void {
    if (this.contentArea) {
      const blocks = this.contentArea.nativeElement.querySelectorAll('pre code');
      blocks.forEach((block: HTMLElement) => hljs.highlightElement(block));
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
      const item = section.items.find((i) => {
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
