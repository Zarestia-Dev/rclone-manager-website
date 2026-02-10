import { Component, OnInit, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { marked } from 'marked';
import { ModeService } from '../../services/mode.service';
import { DownloadPlatform, ChangelogVersion, GitHubRelease } from '../../models/downloads.model';
import {
  GITHUB_API_BASE,
  CHANGELOG_URL,
  DESKTOP_PLATFORMS_CONFIG,
  HEADLESS_PLATFORMS_CONFIG,
  DOWNLOAD_TYPE_ORDER,
  FALLBACK_PLATFORMS,
  FALLBACK_CHANGELOG,
  FALLBACK_RELEASE,
  FALLBACK_RELEASE_BODY_HTML,
  SYSTEM_REQUIREMENTS,
  FILE_EXTENSION_PATTERNS,
  DOWNLOADS_CONFIG,
  DOWNLOADS_MESSAGES,
} from '../../constants/downloads.constants';
import {
  createDownloadOption,
  getDownloadType,
  getRelativeTime,
  getSectionIcon,
  getSectionTitle,
  getSections,
  parseChangelog,
} from '../../utils/downloads.utils';

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
})
export class Downloads implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  modeService = inject(ModeService);

  platforms: DownloadPlatform[] = [];
  changelog: ChangelogVersion[] = [];
  systemRequirements = SYSTEM_REQUIREMENTS;
  private allReleases: GitHubRelease[] = [];
  isLoading = true;
  error: string | null = null;
  latestRelease: GitHubRelease | null = null;
  latestReleaseBodyHtml = '';

  async ngOnInit() {
    await this.loadData();
  }

  async loadData(retryCount = 0): Promise<void> {
    const maxRetries = DOWNLOADS_CONFIG.MAX_RETRIES;

    try {
      this.isLoading = true;
      this.error = null;

      await Promise.all([this.fetchReleases(), this.fetchChangelog()]);

      this.updateView();

      this.isLoading = false;

      // Log successful load for debugging
      console.log('Successfully loaded release data:', {
        platforms: this.platforms.length,
        changelog: this.changelog.length,
        latestRelease: this.latestRelease?.tag_name,
      });
    } catch (error) {
      console.error(`Error loading data (attempt ${retryCount + 1}):`, error);

      if (retryCount < maxRetries) {
        // Retry after a short delay
        console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
        setTimeout(
          () => this.loadData(retryCount + 1),
          DOWNLOADS_CONFIG.RETRY_DELAY_MS * (retryCount + 1),
        );
        return;
      }

      // Final failure - show fallback
      this.error = DOWNLOADS_MESSAGES.ERROR_LOADING;
      this.isLoading = false;
      this.loadFallbackData();
    }
  }

  // Reload data when mode changes
  constructor() {
    effect(() => {
      // Re-run loadData when mode changes
      void this.modeService.currentMode();
      if (this.allReleases.length > 0) {
        this.updateView();
      } else {
        this.loadData();
      }
    });
  }

  private async fetchReleases(): Promise<void> {
    const releases = await firstValueFrom(
      this.http.get<GitHubRelease[]>(`${GITHUB_API_BASE}/releases`),
    );

    this.allReleases = releases;
  }

  private async updateView(): Promise<void> {
    const mode = this.modeService.currentMode();
    const releases = this.allReleases || [];

    // Safety check
    if (releases.length === 0) {
      // Don't clear data if we have no releases yet (might be initial load)
      // But if we failed to load, error state handles it.
      return;
    }

    let filteredReleases: GitHubRelease[] = [];

    if (mode === 'headless') {
      filteredReleases = releases.filter((r) => r.tag_name.includes('headless'));
    } else {
      filteredReleases = releases.filter((r) => !r.tag_name.includes('headless'));
    }

    this.latestRelease = filteredReleases.length > 0 ? filteredReleases[0] : null;

    if (this.latestRelease) {
      this.latestReleaseBodyHtml = await marked.parse(this.latestRelease.body || '');
      this.platforms = this.generatePlatformsFromReleases(filteredReleases);
    } else {
      // Fallback if no matching releases found for mode
      this.latestReleaseBodyHtml = DOWNLOADS_MESSAGES.NO_NOTES_FOUND;
      this.platforms = this.generatePlatformsFromReleases([]);
    }
  }

  private async fetchChangelog(): Promise<void> {
    const changelogText = await firstValueFrom(
      this.http.get(CHANGELOG_URL, { responseType: 'text' }),
    );

    this.changelog = parseChangelog(changelogText);
  }

  private generatePlatformsFromReleases(releases: GitHubRelease[]): DownloadPlatform[] {
    const mode = this.modeService.currentMode();

    // Headless Mode Logic
    if (mode === 'headless') {
      const headlessPlatforms: DownloadPlatform[] = JSON.parse(
        JSON.stringify(HEADLESS_PLATFORMS_CONFIG),
      );

      // Add .deb and .rpm downloads if available in headless release assets
      const latestHeadless = releases[0];
      if (latestHeadless && latestHeadless.assets) {
        latestHeadless.assets.forEach((asset) => {
          const downloadOption = createDownloadOption(asset);
          if (!downloadOption) return;

          const name = asset.name.toLowerCase();

          // Check if it matches a pattern
          const matchedPattern = FILE_EXTENSION_PATTERNS.find((config) => {
            const primaryMatch = name.includes(config.pattern);
            if (!primaryMatch) return false;
            if (config.secondaryPattern) return name.includes(config.secondaryPattern);
            return true;
          });

          if (
            matchedPattern &&
            (matchedPattern.type === 'DEB Package' || matchedPattern.type === 'RPM Package')
          ) {
            headlessPlatforms[0].downloads.push(downloadOption);
          }
        });
      }

      return headlessPlatforms;
    }

    // Desktop Mode Logic (Default)
    const latestRelease = releases[0];
    if (!latestRelease || !latestRelease.assets) return [];

    const platforms: DownloadPlatform[] = JSON.parse(JSON.stringify(DESKTOP_PLATFORMS_CONFIG));

    // Process assets and categorize by platform based on your naming convention
    latestRelease.assets.forEach((asset) => {
      const downloadOption = createDownloadOption(asset);
      if (!downloadOption) return;

      const name = asset.name.toLowerCase();

      // Find matching pattern
      const matchedPattern = FILE_EXTENSION_PATTERNS.find((config) => {
        const primaryMatch = name.includes(config.pattern);
        if (!primaryMatch) return false;
        if (config.secondaryPattern) return name.includes(config.secondaryPattern);
        return true;
      });

      if (
        matchedPattern &&
        matchedPattern.platformIndex !== undefined &&
        matchedPattern.platformIndex >= 0 &&
        matchedPattern.platformIndex < platforms.length
      ) {
        platforms[matchedPattern.platformIndex].downloads.push(downloadOption);
      }
    });

    // Sort downloads within each platform (MSI before EXE, etc.)
    platforms.forEach((platform) => {
      platform.downloads.sort((a, b) => {
        // Prioritize certain file types
        const aType = getDownloadType(a.name);
        const bType = getDownloadType(b.name);

        const aIndex = DOWNLOAD_TYPE_ORDER.indexOf(aType);
        const bIndex = DOWNLOAD_TYPE_ORDER.indexOf(bType);

        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }

        // Then sort by architecture (x64 first)
        if (a.architecture === 'x64' && b.architecture === 'ARM64') return -1;
        if (a.architecture === 'ARM64' && b.architecture === 'x64') return 1;

        return 0;
      });
    });

    // Filter out platforms with no downloads
    // Update filter to check for downloads OR package managers
    return platforms.filter(
      (platform) => platform.downloads.length > 0 || (platform.packageManagers?.length ?? 0) > 0,
    );
  }

  getSections = getSections;
  getSectionIcon = getSectionIcon;
  getSectionTitle = getSectionTitle;
  getRelativeTime = getRelativeTime;

  private loadFallbackData(): void {
    this.platforms = JSON.parse(JSON.stringify(FALLBACK_PLATFORMS));
    this.changelog = JSON.parse(JSON.stringify(FALLBACK_CHANGELOG));
    this.latestRelease = { ...FALLBACK_RELEASE };
    this.latestReleaseBodyHtml = FALLBACK_RELEASE_BODY_HTML;
  }

  copyCommand(command: string): void {
    navigator.clipboard.writeText(command).then(
      () => {
        this.snackBar.open(DOWNLOADS_MESSAGES.COPY_SUCCESS, DOWNLOADS_MESSAGES.CLOSE_ACTION, {
          duration: DOWNLOADS_CONFIG.SNACKBAR_DURATION,
        });
      },
      (err) => {
        console.error('Could not copy command: ', err);
        this.snackBar.open(DOWNLOADS_MESSAGES.COPY_FAILURE, DOWNLOADS_MESSAGES.CLOSE_ACTION, {
          duration: DOWNLOADS_CONFIG.SNACKBAR_DURATION,
          panelClass: ['error-snackbar'],
        });
      },
    );
  }

  downloadFile(url: string): void {
    window.open(url, '_blank');
  }

  openExternalLink(url: string): void {
    window.open(url, '_blank');
  }

  getAssetCount(): number {
    if (!this.latestRelease || !this.latestRelease.assets) return 0;
    // Count only main download files (excluding signatures and source)
    return this.latestRelease.assets.filter(
      (asset) =>
        !asset.name.toLowerCase().includes('.sig') &&
        !asset.name.toLowerCase().includes('source code') &&
        asset.name !== 'latest.json',
    ).length;
  }

  // Method to refresh data manually
  async refreshData(): Promise<void> {
    await this.loadData();
  }

  // Debug method to check what data is being loaded
  getDebugInfo(): object {
    return {
      isLoading: this.isLoading,
      hasError: !!this.error,
      platformCount: this.platforms.length,
      changelogCount: this.changelog.length,
      latestReleaseTag: this.latestRelease?.tag_name,
      latestReleaseAssets: this.latestRelease?.assets?.length || 0,
      apiUrls: {
        releases: `${GITHUB_API_BASE}/releases`,
        changelog: CHANGELOG_URL,
      },
    };
  }
}
