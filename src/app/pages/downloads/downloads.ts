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
import DOMPurify from 'dompurify';
import {
  DownloadPlatform,
  ChangelogVersion,
  GitHubRelease,
  DownloadOption,
  GitHubAsset,
} from '../../models/downloads.model';
import { ChangelogService } from '../../services/changelog.service';
import { ModeService } from '../../services/mode.service';
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
  private modeService = inject(ModeService);
  private snackBar = inject(MatSnackBar);

  releasesResource = rxResource({
    stream: () => this.github.get<GitHubRelease[]>(`/repos/${GITHUB_REPO}/releases`),
  });

  changelogResource = rxResource({
    stream: () => this.changelogService.fetchFullChangelog(),
  });

  // Releases and changelog load independently — keep their states separate.
  releasesLoading = computed(() => this.releasesResource.isLoading());
  changelogLoading = computed(() => this.changelogResource.isLoading());

  // The main loading card is only for the releases fetch (platform grid depends on it).
  isLoading = computed(() => this.releasesLoading());

  // Error only when releases fail — changelog falling back is handled silently via FALLBACK_CHANGELOG.
  error = computed(() => (this.releasesResource.error() ? DOWNLOADS_MESSAGES.ERROR_LOADING : null));

  private mode = computed(() => this.modeService.currentMode());

  allReleases = computed(() => this.releasesResource.value() ?? []);

  changelog = computed(
    () =>
      this.changelogResource.value() ?? (this.changelogResource.error() ? FALLBACK_CHANGELOG : []),
  );

  filteredReleases = computed(() => {
    const mode = this.mode();
    const releases = this.allReleases();
    const filtered =
      mode === 'headless'
        ? releases.filter((r) => this.isHeadlessRelease(r))
        : releases.filter((r) => this.isDesktopRelease(r));

    return [...filtered].sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );
  });

  latestRelease = computed(() => {
    const filtered = this.filteredReleases();
    return filtered.length > 0 ? filtered[0] : this.error() ? FALLBACK_RELEASE : null;
  });

  latestReleaseBodyHtml = computed(() => {
    if (this.error()) return FALLBACK_RELEASE_BODY_HTML;
    const release = this.latestRelease();
    if (!release) return '';
    // Sanitize before binding to innerHTML — marked output comes from the GitHub API.
    return DOMPurify.sanitize(marked.parse(release.body || '') as string);
  });

  // platforms only falls back when *releases* fail, not if changelog fails.
  platforms = computed(() => {
    if (this.releasesResource.error()) return FALLBACK_PLATFORMS;
    return this.generatePlatformsFromReleases(this.filteredReleases());
  });

  systemRequirements = SYSTEM_REQUIREMENTS;

  getAssetCount = computed(() => {
    const assets = this.latestRelease()?.assets as GitHubAsset[] | undefined;
    if (!assets) return 0;
    return assets.filter(
      (a) =>
        !a.name.toLowerCase().includes('.sig') &&
        !a.name.toLowerCase().includes('source code') &&
        a.name !== 'latest.json',
    ).length;
  });

  // Delegated changelog helpers
  getSections = (v: ChangelogVersion) => this.changelogService.getSections(v);
  getSectionIcon = (s: string) => this.changelogService.getSectionIcon(s);
  getSectionTitle = (s: string) => this.changelogService.getSectionTitle(s);
  getRelativeTime = (d: string) => this.changelogService.getRelativeTime(d);

  downloadFile = (url: string) => window.open(url, '_blank');
  openExternalLink = (url: string) => window.open(url, '_blank');

  loadData(): void {
    this.releasesResource.reload();
    this.changelogResource.reload();
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

  private isHeadlessRelease(release: GitHubRelease): boolean {
    const tag = release.tag_name?.toLowerCase() ?? '';
    const name = release.name?.toLowerCase() ?? '';
    return (
      tag.includes('headless') ||
      name.includes('headless') ||
      !!release.assets?.some((a) => a.name.toLowerCase().includes('headless'))
    );
  }

  private isDesktopRelease(release: GitHubRelease): boolean {
    const tag = release.tag_name?.toLowerCase() ?? '';
    const name = release.name?.toLowerCase() ?? '';
    return !tag.includes('headless') && !name.includes('headless');
  }

  private generatePlatformsFromReleases(releases: GitHubRelease[]): DownloadPlatform[] {
    const mode = this.mode();
    const config = mode === 'headless' ? HEADLESS_PLATFORMS_CONFIG : DESKTOP_PLATFORMS_CONFIG;
    const platforms: DownloadPlatform[] = structuredClone(config);

    if (releases.length === 0) return platforms;

    for (const asset of releases[0].assets ?? []) {
      const option = createDownloadOption(asset);
      if (!option) continue;

      if (mode === 'headless') {
        if (
          option.type === 'Windows Headless' ||
          option.type === 'MSI Installer' ||
          option.type === 'EXE Installer' ||
          option.type === 'Windows Portable'
        ) {
          platforms[0]?.downloads.push(option);
        } else if (
          option.type === 'Linux Headless' ||
          option.type === 'DEB Package' ||
          option.type === 'RPM Package' ||
          option.type === 'Linux Portable' ||
          option.type === 'AppImage'
        ) {
          platforms[1]?.downloads.push(option);
        }
      } else if (option.platformIndex !== undefined) {
        platforms[option.platformIndex]?.downloads.push(option);
      }
    }

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
}
