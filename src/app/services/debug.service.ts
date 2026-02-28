import { Injectable, inject, DOCUMENT, DestroyRef } from '@angular/core';
import { GithubService } from './github.service';
import { DocService } from './doc.service';

@Injectable({
  providedIn: 'root',
})
export class DebugService {
  private readonly document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private githubService = inject(GithubService);
  private docService = inject(DocService);
  private contextMenu: HTMLElement | null = null;

  constructor() {
    this.setupContextMenu();
  }

  private setupContextMenu(): void {
    const onContextMenu = (event: MouseEvent) => {
      if (event.clientX === undefined || event.clientY === undefined) return;
      event.preventDefault();
      this.createContextMenu(event.clientX, event.clientY);
    };

    const onClick = (event: MouseEvent) => {
      if (
        this.contextMenu &&
        event.target instanceof Node &&
        this.contextMenu.contains(event.target)
      ) {
        return;
      }
      this.closeMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.closeMenu();
      }
    };

    // Attach listeners
    this.document.addEventListener('contextmenu', onContextMenu);
    this.document.addEventListener('click', onClick);
    this.document.addEventListener('keydown', onKeyDown);

    // Ensure pristine cleanup if the service is ever destroyed (e.g., SSR teardown)
    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('contextmenu', onContextMenu);
      this.document.removeEventListener('click', onClick);
      this.document.removeEventListener('keydown', onKeyDown);
      this.closeMenu();
    });
  }

  private createContextMenu(x: number, y: number): void {
    this.closeMenu();

    this.contextMenu = this.document.createElement('div');
    this.contextMenu.className = 'material-context-menu';
    this.contextMenu.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      z-index: 99999;
    `;

    const menuItems = [
      {
        label: 'Refresh UI',
        action: (): void => this.refreshUI(),
      },
      {
        label: 'Clear Cache & Reset',
        action: (): void => this.clearCache(),
      },
    ];

    menuItems.forEach((item) => {
      const menuItem = this.document.createElement('button');
      menuItem.className = 'menu-item';
      menuItem.innerHTML = `<span>${item.label}</span>`;
      menuItem.onclick = (): void => {
        item.action();
        this.closeMenu();
      };
      this.contextMenu?.appendChild(menuItem);
    });

    this.document.body.appendChild(this.contextMenu);

    // Adjust position if menu goes off-screen
    const rect = this.contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.contextMenu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.contextMenu.style.top = `${y - rect.height}px`;
    }
  }

  private closeMenu(): void {
    if (this.contextMenu) {
      this.contextMenu.remove();
      this.contextMenu = null;
    }
  }

  private refreshUI(): void {
    sessionStorage.clear();
    window.location.reload();
  }

  private clearCache(): void {
    const feedback = this.document.createElement('div');
    feedback.textContent = 'Clearing cache...';
    feedback.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--primary-color, #1976d2);
      color: white;
      padding: 16px 32px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      z-index: 99999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: fadeIn 0.2s ease-out;
      pointer-events: none;
    `;
    this.document.body.appendChild(feedback);

    const feedbackCleanup = this.destroyRef.onDestroy(() => feedback.remove());

    // 1. Clear Local/Session Storage
    sessionStorage.clear();
    localStorage.clear();

    // 2. Clear Cookies
    const cookies = this.document.cookie.split(';');
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
      this.document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }

    // 3. Clear Cache API (Service Workers)
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }

    // 4. Clear RxJS Memory Caches
    this.githubService.clearMemoryCache();
    this.docService.clearMemoryCache();

    // Update feedback
    setTimeout(() => {
      feedback.textContent = 'Cache cleared!';
      setTimeout(() => {
        feedback.style.animation = 'fadeOut 0.2s ease-out forwards';
        setTimeout(() => {
          feedback.remove();
          feedbackCleanup();
        }, 300);
      }, 1000);
    }, 500);
  }
}
