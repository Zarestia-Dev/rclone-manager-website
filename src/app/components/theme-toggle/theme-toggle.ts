import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  private themeService = inject(ThemeService);

  setTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  getCurrentTheme(): Theme {
    return this.themeService.currentTheme();
  }

  getThemeIcon(): string {
    switch (this.getCurrentTheme()) {
      case 'light':
        return 'light_mode';
      case 'dark':
        return 'dark_mode';
      case 'system':
        return 'brightness_auto';
      default:
        return 'brightness_auto';
    }
  }
}
