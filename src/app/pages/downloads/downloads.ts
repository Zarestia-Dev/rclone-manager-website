import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { GithubService } from '../../services/github.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { marked } from 'marked';
import { ModeService } from '../../services/mode.service';
import {
  DownloadPlatform,
  ChangelogVersion,
  GitHubRelease,
  DownloadOption,
  GitHubAsset,
} from '../../models/downloads.model';
import { ChangelogService } from '../../services/changelog.service';
import {
  GITHUB_REPO,
  DESKTOP_PLATFORMS_CONFIG,
  HEADLESS_PLATFORMS_CONFIG,
  DOWNLOAD_TYPE_ORDER,
  FALLBACK_PLATFORMS,
  FALLBACK_CHANGELOG,
  FALLBACK_RELEASE,
  FALLBACK_RELEASE_BODY_HTML,
  SYSTEM_REQUIREMENTS,
  DOWNLOADS_CONFIG,
  DOWNLOADS_MESSAGES,
} from '../../constants/downloads.constants';
import { createDownloadOption, getDownloadType } from '../../utils/downloads.utils';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-downloads',
  imports: [
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DatePipe,
  ],
  templateUrl: './downloads.html',
  styleUrl: './downloads.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Downloads {
  private github = inject(GithubService);
  private changelogService = inject(ChangelogService);
  private snackBar = inject(MatSnackBar);
  modeService = inject(ModeService);

  // Resources
  releasesResource = rxResource({
    stream: () => this.github.get<GitHubRelease[]>(`/repos/${GITHUB_REPO}/releases`),
  });

  changelogResource = rxResource({
    stream: () => this.changelogService.fetchFullChangelog(),
  });

  // Derived signals
  allReleases = computed(() => this.releasesResource.value() ?? []);
  changelog = computed(
    () =>
      this.changelogResource.value() ?? (this.changelogResource.error() ? FALLBACK_CHANGELOG : []),
  );
  isLoading = computed(
    () => this.releasesResource.isLoading() || this.changelogResource.isLoading(),
  );
  error = computed(() =>
    this.releasesResource.error() || this.changelogResource.error()
      ? DOWNLOADS_MESSAGES.ERROR_LOADING
      : null,
  );

  // Computed
  mode = computed(() => this.modeService.currentMode());

  filteredReleases = computed(() => {
    const mode = this.mode();
    const releases = this.allReleases();
    if (mode === 'headless') {
      return releases.filter((r: GitHubRelease) => r.tag_name.includes('headless'));
    }
    return releases.filter((r: GitHubRelease) => !r.tag_name.includes('headless'));
  });

  latestRelease = computed(() => {
    const filtered = this.filteredReleases();
    return filtered.length > 0 ? filtered[0] : this.error() ? FALLBACK_RELEASE : null;
  });

  latestReleaseBodyHtml = computed(() => {
    const release = this.latestRelease();
    if (this.error()) return FALLBACK_RELEASE_BODY_HTML;
    if (!release) return '';
    return marked.parse(release.body || '') as string;
  });

  platforms = computed(() => {
    if (this.error()) return FALLBACK_PLATFORMS;
    return this.generatePlatformsFromReleases(this.filteredReleases());
  });

  systemRequirements = SYSTEM_REQUIREMENTS;

  private generatePlatformsFromReleases(releases: GitHubRelease[]): DownloadPlatform[] {
    const mode = this.mode();
    const config = mode === 'headless' ? HEADLESS_PLATFORMS_CONFIG : DESKTOP_PLATFORMS_CONFIG;
    const platforms: DownloadPlatform[] = JSON.parse(JSON.stringify(config));

    if (releases.length === 0) return platforms;

    const assets = releases[0].assets || [];
    assets.forEach((asset) => {
      const option = createDownloadOption(asset);
      if (!option) return;

      if (mode === 'headless') {
        if (option.type === 'DEB Package' || option.type === 'RPM Package') {
          platforms[0].downloads.push(option);
        }
      } else if (option.platformIndex !== undefined && platforms[option.platformIndex]) {
        platforms[option.platformIndex].downloads.push(option);
      }
    });

    platforms.forEach((p) => p.downloads.sort(this.sortDownloads));
    return platforms.filter((p) => p.downloads.length > 0 || (p.packageManagers?.length ?? 0) > 0);
  }

  private sortDownloads(a: DownloadOption, b: DownloadOption): number {
    const aType = getDownloadType(a.displayName || a.name);
    const bType = getDownloadType(b.displayName || b.name);
    const aIndex = DOWNLOAD_TYPE_ORDER.indexOf(aType);
    const bIndex = DOWNLOAD_TYPE_ORDER.indexOf(bType);

    if (aIndex !== bIndex) return aIndex - bIndex;
    if (a.architecture === 'x64' && b.architecture === 'ARM64') return -1;
    if (a.architecture === 'ARM64' && b.architecture === 'x64') return 1;
    return 0;
  }

  copyCommand(command: string): void {
    navigator.clipboard.writeText(command).then(
      () => this.showSnackBar(DOWNLOADS_MESSAGES.COPY_SUCCESS),
      () => this.showSnackBar(DOWNLOADS_MESSAGES.COPY_FAILURE, true),
    );
  }

  private showSnackBar(message: string, isError = false): void {
    this.snackBar.open(message, DOWNLOADS_MESSAGES.CLOSE_ACTION, {
      duration: DOWNLOADS_CONFIG.SNACKBAR_DURATION,
      panelClass: isError ? ['error-snackbar'] : [],
    });
  }

  getAssetCount = computed(() => {
    const release = this.latestRelease();
    if (!release?.assets) return 0;
    return (release.assets as GitHubAsset[]).filter(
      (a: GitHubAsset) =>
        !a.name.toLowerCase().includes('.sig') &&
        !a.name.toLowerCase().includes('source code') &&
        a.name !== 'latest.json',
    ).length;
  });

  // Delegated changelog methods
  getSections = (v: ChangelogVersion) => this.changelogService.getSections(v);
  getSectionIcon = (s: string) => this.changelogService.getSectionIcon(s);
  getSectionTitle = (s: string) => this.changelogService.getSectionTitle(s);
  getRelativeTime = (d: string) => this.changelogService.getRelativeTime(d);

  downloadFile = (url: string) => window.open(url, '_blank');
  openExternalLink = (url: string) => window.open(url, '_blank');

  loadData(): void {
    // Reload resources
    this.releasesResource.reload();
    this.changelogResource.reload();
  }
}
