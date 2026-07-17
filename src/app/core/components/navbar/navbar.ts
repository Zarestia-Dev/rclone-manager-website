import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { ModeService } from '../../services/mode.service';
import { ViewportService } from '../../services/viewport.service';
import { NAV_LINKS, EXTERNAL_NAV_LINKS } from '../../../shared/constants/navigation.constants';

@Component({
  selector: 'app-navbar',
  imports: [MatButtonModule, MatIconModule, ThemeToggle, MatTooltip, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onWindowScroll()',
  },
})
export class Navbar {
  modeService = inject(ModeService);
  viewport = inject(ViewportService);
  navLinks = NAV_LINKS;
  externalLinks = EXTERNAL_NAV_LINKS;

  isScrolled = false;
  readonly isMobileMenuOpen = signal(false);

  constructor() {
    // Auto-close mobile menu when scaling up to desktop
    effect(() => {
      if (!this.viewport.isMobile()) {
        this.isMobileMenuOpen.set(false);
      }
    });
  }

  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update((val) => !val);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  toggleMode() {
    this.modeService.toggleMode();
  }
}
