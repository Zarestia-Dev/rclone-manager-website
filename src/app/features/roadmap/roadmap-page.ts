import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoadmapBoard } from './roadmap-board';
import { ChangelogService } from '../downloads/changelog.service';
import { GithubService } from '../../shared/services/github.service';

@Component({
  selector: 'app-roadmap-page',
  imports: [CommonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule, RoadmapBoard],
  templateUrl: './roadmap-page.html',
  styleUrl: './roadmap-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoadmapPage {
  private changelogService = inject(ChangelogService);
  private githubService = inject(GithubService);

  changesResource = rxResource({
    stream: () => this.changelogService.fetchUnreleasedChanges(),
  });

  issuesResource = rxResource({
    stream: () => this.githubService.getIssues('Zarestia-Dev/rclone-manager'),
  });

  readonly incomingChanges = computed(() => this.changesResource.value() ?? []);
  readonly developmentIssues = computed(() => this.issuesResource.value() ?? []);
  readonly isLoading = computed(() => this.changesResource.isLoading() || this.issuesResource.isLoading());
  readonly error = computed(() =>
    this.changesResource.error() || this.issuesResource.error()
      ? 'Could not load roadmap data.'
      : null,
  );

  getRelativeTime(dateStr: string): string {
    return this.changelogService.getRelativeTime(dateStr);
  }
}
