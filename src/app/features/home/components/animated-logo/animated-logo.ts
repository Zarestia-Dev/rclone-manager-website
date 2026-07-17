import { Component, ChangeDetectionStrategy, signal, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

const EXIT_DURATION_MS = 700;

/**
 * Animated RClone logo. Re-runs its intro animation whenever the bound
 * `trigger` input increments — Home uses this to replay the animation each
 * time the user navigates back to the home route.
 */
@Component({
  selector: 'app-animated-logo',
  imports: [CommonModule],
  templateUrl: './animated-logo.html',
  styleUrl: './animated-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimatedLogoComponent {
  /** Monotonically-increasing trigger; each increment replays the intro. */
  readonly trigger = input(0);

  readonly isAnimating = signal(true);
  readonly isLeaving = signal(false);

  constructor() {
    let lastSeen = this.trigger();
    effect(() => {
      const current = this.trigger();
      if (current > lastSeen) {
        lastSeen = current;
        this.retrigger();
      }
    });
  }

  retrigger() {
    if (this.isLeaving()) return;

    this.isLeaving.set(true);

    setTimeout(() => {
      this.isAnimating.set(false);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.isAnimating.set(true);
          this.isLeaving.set(false);
        });
      });
    }, EXIT_DURATION_MS);
  }
}
