import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Roadmap } from '../../components/roadmap/roadmap';
import { ChangelogService, ChangelogSection } from '../../services/changelog.service';
import { GithubService, GithubIssue } from '../../services/github.service';
import { forkJoin, finalize } from 'rxjs';
import { MatDivider } from '@angular/material/divider';

@Component({
  selector: 'app-roadmap-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    Roadmap,
    MatDivider,
  ],
  templateUrl: './roadmap.html',
  styleUrl: './roadmap.scss',
})
export class RoadmapPage implements OnInit {
  private changelogService = inject(ChangelogService);
  private githubService = inject(GithubService);

  incomingChanges = signal<ChangelogSection[]>([]);
  developmentIssues = signal<GithubIssue[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);

    forkJoin({
      changes: this.changelogService.fetchUnreleasedChanges(),
      issues: this.githubService.getIssues('Zarestia-Dev/rclone-manager'),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.incomingChanges.set(data.changes);
          this.developmentIssues.set(data.issues);
        },
        error: (err) => {
          console.error('Error loading roadmap page data:', err);
          this.error.set('Could not load some data. Please check back later.');
        },
      });
  }

  getRelativeTime(dateStr: string): string {
    return this.changelogService.getRelativeTime(dateStr);
  }
}
