import { Injectable } from '@angular/core';

/**
 * Lazy-loaded syntax-highlighting wrapper around highlight.js.
 *
 * The full highlight.js bundle includes ~190 languages and would add ~1MB to
 * the initial bundle. Instead, we register only the languages actually used
 * in the docs (bash, ini, json, powershell, plaintext, yaml) and only on first
 * use — visitors who never open a docs page never pay the JS cost.
 *
 * The highlight.js CSS theme is loaded globally via angular.json (it's ~3KB
 * and applies only to `.hljs` elements, so it has no cost on non-docs pages).
 */
@Injectable({ providedIn: 'root' })
export class HighlightService {
  private hljsPromise: Promise<typeof import('highlight.js')['default']> | null = null;

  /**
   * The languages actually used by docs markdown fences:
   *   bash, ini, json, powershell, plaintext, yaml.
   * Listed here for discoverability — the actual registration happens in
   * `loadHljs()` below via explicit imports so bundlers can statically split
   * each language into its own lazy chunk.
   */
  /** Highlight all `<pre><code>` elements in the given list. */
  async highlightAll(blocks: HTMLElement[]): Promise<void> {
    if (blocks.length === 0) return;
    const hljs = await this.load();
    for (const block of blocks) {
      if (block.dataset['highlighted'] === 'yes') continue;
      const lang = this.detectLanguage(block);
      try {
        if (lang && hljs.getLanguage(lang)) {
          const result = hljs.highlight(block.textContent ?? '', { language: lang });
          block.innerHTML = result.value;
        } else {
          const result = hljs.highlightAuto(block.textContent ?? '');
          block.innerHTML = result.value;
        }
        block.dataset['highlighted'] = 'yes';
      } catch {
        // If highlight fails for any reason, leave the block as plain text.
      }
    }
  }

  private detectLanguage(block: HTMLElement): string | null {
    for (const cls of block.classList) {
      if (cls.startsWith('language-')) {
        return cls.slice('language-'.length).toLowerCase();
      }
    }
    return null;
  }

  private load(): Promise<typeof import('highlight.js')['default']> {
    this.hljsPromise ??= this.loadHljs();
    return this.hljsPromise;
  }

  private async loadHljs(): Promise<typeof import('highlight.js')['default']> {
    const hljs = (await import('highlight.js')).default;
    const [bash, ini, json, powershell, plaintext, yaml] = await Promise.all([
      import('highlight.js/lib/languages/bash'),
      import('highlight.js/lib/languages/ini'),
      import('highlight.js/lib/languages/json'),
      import('highlight.js/lib/languages/powershell'),
      import('highlight.js/lib/languages/plaintext'),
      import('highlight.js/lib/languages/yaml'),
    ]);
    hljs.registerLanguage('bash', bash.default);
    hljs.registerLanguage('ini', ini.default);
    hljs.registerLanguage('json', json.default);
    hljs.registerLanguage('powershell', powershell.default);
    hljs.registerLanguage('plaintext', plaintext.default);
    hljs.registerLanguage('yaml', yaml.default);
    return hljs;
  }
}
