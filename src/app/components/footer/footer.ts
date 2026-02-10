import { Component, inject } from '@angular/core';
import { TabService, AppTab } from '../../services/tab.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NAV_LINKS, SOCIAL_LINKS } from '../../constants/navigation.constants';

@Component({
  selector: 'app-footer',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  tabService = inject(TabService);
  currentYear = new Date().getFullYear();
  navLinks = NAV_LINKS;
  socialLinks = SOCIAL_LINKS;

  setTab(tab: string) {
    this.tabService.setTab(tab as AppTab);
  }
}
