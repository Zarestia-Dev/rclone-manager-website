import { Component, ChangeDetectionStrategy, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabService } from '../../services/tab.service';

const EXIT_DURATION_MS = 700;

@Component({
  selector: 'app-animated-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animated-logo.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./animated-logo.scss'],
})
export class AnimatedLogoComponent {
  private tabService = inject(TabService);

  isAnimating = signal(true);
  isLeaving = signal(false);

  constructor() {
    const initialTrigger = this.tabService.triggerHomeAnimation();
    effect(() => {
      const trigger = this.tabService.triggerHomeAnimation();
      if (trigger > initialTrigger) {
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