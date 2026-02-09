import { Component, inject } from '@angular/core';
import { TabService, AppTab } from '../../services/tab.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ModeService } from '../../services/mode.service';

@Component({
  selector: 'app-hero',
  imports: [
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero {
  tabService = inject(TabService);
  modeService = inject(ModeService);

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
