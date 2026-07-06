import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GithubService, Contributor } from '../../services/github.service';
import { finalize } from 'rxjs';

interface InfoOption {
  name: string;
  url: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './community.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './community.scss',
})
export class CommunityPage implements OnInit {
  private githubService = inject(GithubService);

  contributors = signal<Contributor[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  contributorsCount = computed(() => this.contributors().length);

  translationOptions: InfoOption[] = [
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
