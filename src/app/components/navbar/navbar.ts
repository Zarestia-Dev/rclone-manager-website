import { Component, HostListener, inject, signal, effect } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { TabService, AppTab } from '../../services/tab.service';
import { ModeService } from '../../services/mode.service';
import { ViewportService } from '../../services/viewport.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NAV_LINKS } from '../../constants/navigation.constants';

@Component({
  selector: 'app-navbar',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSlideToggleModule,
    ThemeToggle,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  tabService = inject(TabService);
  modeService = inject(ModeService);
  viewport = inject(ViewportService);
  navLinks = NAV_LINKS;

  isScrolled = false;
  isMobileMenuOpen = signal(false);

  constructor() {
    // Auto-close mobile menu when scaling up to desktop
    effect(() => {
      if (!this.viewport.isMobile()) {
        this.isMobileMenuOpen.set(false);
      }
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update((val) => !val);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  setTab(tab: AppTab) {
    this.tabService.setTab(tab);
    this.closeMobileMenu();
  }

  toggleMode() {
    this.modeService.toggleMode();
  }
}
