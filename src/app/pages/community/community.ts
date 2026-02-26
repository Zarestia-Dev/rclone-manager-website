import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GithubService, Contributor } from '../../services/github.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './community.html',
  styleUrl: './community.scss',
})
export class CommunityPage implements OnInit {
  private githubService = inject(GithubService);

  contributors = signal<Contributor[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  contributorsCount = computed(() => this.contributors().length);

  donateOptions = [
    {
      name: 'GitHub Sponsors',
      url: 'https://github.com/sponsors/Zarestia-Dev',
      icon: 'favorite',
      description: 'Support us directly through GitHub Sponsors program.',
    },
    {
      name: 'Buy Me a Coffee',
      url: 'https://buymeacoffee.com/zarestia',
      icon: 'coffee',
      description: 'A simple way to say thanks and support our work.',
    },
    {
      name: 'Crypto',
      url: 'https://github.com/Zarestia-Dev/rclone-manager#donations',
      icon: 'account_balance_wallet',
      description: 'We also accept various cryptocurrencies.',
    },
  ];

  translationOptions = [
    {
      name: 'Crowdin',
      url: 'https://crowdin.com/project/rclone-manger',
      icon: 'translate',
      description: 'Help us translate the application into your language on Crowdin.',
    },
    {
      name: 'Translation Guide',
      url: 'https://github.com/Zarestia-Dev/rclone-manager/blob/master/CONTRIBUTING.md#adding-translations',
      icon: 'menu_book',
      description: 'Read our guide on how to contribute new translations via GitHub.',
    },
  ];

  ngOnInit(): void {
    this.loadContributors();
  }

  openSourceCode(): void {
    window.open('https://github.com/Zarestia-Dev/rclone-manager', '_blank');
  }

  openIssue(): void {
    window.open('https://github.com/Zarestia-Dev/rclone-manager/issues', '_blank');
  }

  private loadContributors(): void {
    this.isLoading.set(true);
    this.githubService
      .getContributors('Zarestia-Dev/rclone-manager')
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.contributors.set(data);
        },
        error: (err) => {
          console.error('Error loading contributors:', err);
          this.error.set('Could not load contributors.');
        },
      });
  }
}
