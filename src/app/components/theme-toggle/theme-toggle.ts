import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
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
