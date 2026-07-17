import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ModeService } from '../../../../core/services/mode.service';
import { HERO_CONTENT } from '../../constants/hero.constants';
import { AnimatedLogoComponent } from '../animated-logo/animated-logo';

@Component({
  selector: 'app-hero',
  imports: [MatButtonModule, MatIconModule, AnimatedLogoComponent, RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  protected modeService = inject(ModeService);
  protected readonly heroContent = HERO_CONTENT;
  protected readonly modes = ['desktop', 'headless'] as const;

  /** Forwarded from Home — increments to replay the logo intro animation. */
  readonly homeNavTrigger = input(0);

  protected scrollToFeatures(): void {
    document.querySelector('app-features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
