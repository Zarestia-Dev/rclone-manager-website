import { Component, inject } from '@angular/core';
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
})
export class Hero {
  tabService = inject(TabService);
  modeService = inject(ModeService);
  heroContent = HERO_CONTENT;
  modes = ['desktop', 'headless'] as const;

  getModeContent(mode: 'desktop' | 'headless') {
    return this.heroContent[mode];
  }

  scrollToFeatures() {
    const featuresSection = document.querySelector('app-features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  setTab(tab: string) {
    this.tabService.setTab(tab as AppTab);
  }
}
