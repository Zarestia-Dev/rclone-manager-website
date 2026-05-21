import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TabService, AppTab } from '../../services/tab.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ModeService } from '../../services/mode.service';
import { HERO_CONTENT } from '../../constants/hero.constants';
import { AnimatedLogoComponent } from '../animated-logo/animated-logo';

@Component({
  selector: 'app-hero',
  imports: [MatButtonModule, MatIconModule, AnimatedLogoComponent],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  private tabService = inject(TabService);
  protected modeService = inject(ModeService);
  protected readonly heroContent = HERO_CONTENT;
  protected readonly modes = ['desktop', 'headless'] as const;

  protected scrollToFeatures(): void {
    document.querySelector('app-features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected setTab(tab: string): void {
    this.tabService.setTab(tab as AppTab);
  }
}