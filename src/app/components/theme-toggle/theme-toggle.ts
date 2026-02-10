import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  themeService = inject(ThemeService);

  setTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  getCurrentTheme(): Theme {
    return this.themeService.currentTheme();
  }
}
