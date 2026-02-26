import { Injectable, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

/**
 * ViewportService provides reactive signals for different screen breakpoints.
 * Centralizing this logic makes it easier to manage responsive UI states
 * across multiple components (Sidebar, Bottom Sheet, Table of Contents, etc.).
 */
@Injectable({
  providedIn: 'root',
})
export class ViewportService {
  private breakpointObserver = inject(BreakpointObserver);

  // Tablet/Phone breakpoint (matches SCSS $mobile-breakpoint)
  public isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 860px)').pipe(map((res) => res.matches)),
    { initialValue: window.innerWidth <= 860 },
  );

  // Desktop/Wide breakpoint (matches SCSS $wide-breakpoint for TOC)
  public isWide = toSignal(
    this.breakpointObserver.observe('(min-width: 1281px)').pipe(map((res) => res.matches)),
    { initialValue: window.innerWidth > 1280 },
  );

  /**
   * Helper to check if we're currently on a small screen without a signal
   * (e.g., for one-time checks in logic).
   */
  get currentIsMobile(): boolean {
    return this.isMobile();
  }
}
