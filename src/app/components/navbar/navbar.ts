import { Component, HostListener, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { TabService, AppTab } from '../../services/tab.service';
import { ModeService } from '../../services/mode.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-navbar',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSlideToggleModule,
    ThemeToggle
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnDestroy {
  tabService = inject(TabService);
  modeService = inject(ModeService);

  isScrolled = false;
  isMobileMenuOpen = false;
  currentTab: AppTab = 'general';
  private sub?: Subscription;

  constructor() {
    this.sub = this.tabService.currentTab$.subscribe(t => (this.currentTab = t));
  }


  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  setTab(tab: AppTab) {
    this.tabService.setTab(tab);
  }

  toggleMode() {
    this.modeService.toggleMode();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
