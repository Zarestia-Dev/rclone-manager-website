import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { GithubService } from '../../shared/services/github.service';
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
} from './downloads.model';
import { ChangelogService } from './changelog.service';
import { ModeService } from '../../core/services/mode.service';
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
} from './downloads.constants';
import { createDownloadOption, getDownloadType } from './downloads.utils';
import { isHeadlessRelease } from './release.utils';
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

  // Releases and changelog load independently - keep their states separate.
  readonly releasesLoading = computed(() => this.releasesResource.isLoading());
  readonly changelogLoading = computed(() => this.changelogResource.isLoading());

  // The main loading card is only for the releases fetch (platform grid depends on it).
  readonly isLoading = computed(() => this.releasesLoading());

  // Error only when releases fail - changelog falling back is handled silently via FALLBACK_CHANGELOG.
  readonly error = computed(() =>
    this.releasesResource.error() ? DOWNLOADS_MESSAGES.ERROR_LOADING : null,
  );

  readonly mode = computed(() => this.modeService.currentMode());

  readonly allReleases = computed(() => this.releasesResource.value() ?? []);

  readonly changelog = computed(
    () =>
      this.changelogResource.value() ?? (this.changelogResource.error() ? FALLBACK_CHANGELOG : []),
  );

  readonly filteredReleases = computed(() => {
    const mode = this.mode();
    const releases = this.allReleases();
    const filtered =
      mode === 'headless'
        ? releases.filter((r) => isHeadlessRelease(r))
        : releases.filter((r) => this.isDesktopRelease(r));

    return [...filtered].sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );
  });

  readonly latestRelease = computed(() => {
    const filtered = this.filteredReleases();
    return filtered.length > 0 ? filtered[0] : this.error() ? FALLBACK_RELEASE : null;
  });

  readonly latestReleaseBodyHtml = computed(() => {
    if (this.error()) return FALLBACK_RELEASE_BODY_HTML;
    const release = this.latestRelease();
    if (!release) return '';
    // Sanitize before binding to innerHTML - marked output comes from the GitHub API.
    return DOMPurify.sanitize(marked.parse(release.body || '') as string);
  });

  // platforms only falls back when *releases* fail, not if changelog fails.
  readonly platforms = computed(() => {
    if (this.releasesResource.error()) {
      return this.mode() === 'headless'
        ? structuredClone(HEADLESS_PLATFORMS_CONFIG).filter((p) => p.packageManagers?.length)
        : FALLBACK_PLATFORMS;
    }
    return this.generatePlatformsFromReleases(this.filteredReleases());
  });

  systemRequirements = SYSTEM_REQUIREMENTS;

  readonly getAssetCount = computed(() => {
    const assets = this.latestRelease()?.assets;
    if (!assets) return 0;
    return assets.filter((asset) => createDownloadOption(asset) !== null).length;
  });

  // Delegated changelog helpers
  getSections = (v: ChangelogVersion) => this.changelogService.getSections(v);
  getSectionIcon = (s: string) => this.changelogService.getSectionIcon(s);
  getSectionTitle = (s: string) => this.changelogService.getSectionTitle(s);
  getRelativeTime = (d: string) => this.changelogService.getRelativeTime(d);

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

  private isDesktopRelease(release: GitHubRelease): boolean {
    return !isHeadlessRelease(release);
  }

  private generatePlatformsFromReleases(releases: GitHubRelease[]): DownloadPlatform[] {
    const mode = this.mode();
    const config = mode === 'headless' ? HEADLESS_PLATFORMS_CONFIG : DESKTOP_PLATFORMS_CONFIG;
    const platforms: DownloadPlatform[] = structuredClone(config);

    if (releases.length === 0) return platforms.filter((p) => p.packageManagers?.length);

    for (const asset of releases[0].assets ?? []) {
      const option = createDownloadOption(asset);
      if (!option) continue;

      if (mode === 'headless' && option.type !== 'Server Archive') {
        option.displayName = `Server + Tray - ${option.displayName || option.name}`;
      }
      if (option.platformIndex !== undefined) {
        platforms[option.platformIndex]?.downloads.push(option);
      }
    }

    if (mode === 'desktop') {
      const androidPlatform = platforms.find((p) => p.name === 'Android');
      if (androidPlatform && androidPlatform.downloads.length === 0) {
        for (const rel of releases.slice(1)) {
          for (const asset of rel.assets ?? []) {
            const option = createDownloadOption(asset);
            if (option && option.type === 'Android APK') {
              androidPlatform.downloads.push(option);
            }
          }
          if (androidPlatform.downloads.length > 0) break;
        }

        if (androidPlatform.downloads.length === 0) {
          androidPlatform.downloads.push({
            name: 'View Android releases',
            displayName: 'View Android releases',
            architecture: 'ARM64, ARMv7, x64, x86',
            size: 'GitHub',
            url: `https://github.com/${GITHUB_REPO}/releases`,
            type: 'Android APK',
            platformIndex: 3,
          });
        }
      }
    }

    platforms.forEach((p) => p.downloads.sort(this.sortDownloads));
    return platforms.filter((p) => p.downloads.length > 0 || (p.packageManagers?.length ?? 0) > 0);
  }

  // Arrow function property - preserves `this` binding automatically when
  // passed as a comparator to Array.prototype.sort, avoiding the unbound-method
  // pitfall of passing a regular method reference.
  private sortDownloads = (a: DownloadOption, b: DownloadOption): number => {
    const aType = a.type ?? getDownloadType(a.displayName || a.name);
    const bType = b.type ?? getDownloadType(b.displayName || b.name);
    const aIndex = DOWNLOAD_TYPE_ORDER.indexOf(aType);
    const bIndex = DOWNLOAD_TYPE_ORDER.indexOf(bType);

    if (aIndex !== bIndex) return aIndex - bIndex;
    if (aType === 'Android APK' && bType === 'Android APK') {
      const androidOrder = ['ARM64', 'ARMv7', 'x64', 'x86'];
      const aRank = androidOrder.indexOf(a.architecture);
      const bRank = androidOrder.indexOf(b.architecture);
      const safeARank = aRank === -1 ? Number.MAX_SAFE_INTEGER : aRank;
      const safeBRank = bRank === -1 ? Number.MAX_SAFE_INTEGER : bRank;
      return safeARank - safeBRank;
    }
    if (a.architecture === 'x64' && b.architecture === 'ARM64') return -1;
    if (a.architecture === 'ARM64' && b.architecture === 'x64') return 1;
    return 0;
  };
}
