import { Component, signal, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, pairwise } from 'rxjs';
import { Hero } from './components/hero/hero';
import { Features } from './components/features/features';

@Component({
  selector: 'app-home',
  imports: [Hero, Features],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  /**
   * Increments each time the user navigates *to* the home route from elsewhere.
   * Passed to AnimatedLogo to replay the intro animation on re-entry.
   */
  readonly homeNavTrigger = signal(0);

  constructor() {
    // Replay the logo animation whenever we land on Home from another route.
    // pairwise() lets us compare previous vs current URL so we only fire on
    // genuine cross-route arrivals — not on initial load (where the logo's
    // built-in intro already plays).
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        pairwise(),
        filter(([prev, curr]) => {
          const prevUrl = prev.urlAfterRedirects.split('#')[0];
          const currUrl = curr.urlAfterRedirects.split('#')[0];
          return prevUrl !== currUrl && (currUrl === '/' || currUrl === '');
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.homeNavTrigger.update((v) => v + 1));
  }
}
