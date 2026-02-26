import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Roadmap } from '../../components/roadmap/roadmap';
import { ChangelogService } from '../../services/changelog.service';
import { GithubService } from '../../services/github.service';

@Component({
  selector: 'app-roadmap-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule, Roadmap],
  templateUrl: './roadmap.html',
  styleUrl: './roadmap.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoadmapPage {
  private changelogService = inject(ChangelogService);
  private githubService = inject(GithubService);

  // Resources
  changesResource = rxResource({
    stream: () => this.changelogService.fetchUnreleasedChanges(),
  });

  issuesResource = rxResource({
    stream: () => this.githubService.getIssues('Zarestia-Dev/rclone-manager'),
  });

  // Derived signals
  incomingChanges = computed(() => this.changesResource.value() ?? []);
  developmentIssues = computed(() => this.issuesResource.value() ?? []);
  isLoading = computed(() => this.changesResource.isLoading() || this.issuesResource.isLoading());
  error = computed(() =>
    this.changesResource.error() || this.issuesResource.error()
      ? 'Could not load roadmap data.'
      : null,
  );

  getRelativeTime(dateStr: string): string {
    return this.changelogService.getRelativeTime(dateStr);
  }
}
