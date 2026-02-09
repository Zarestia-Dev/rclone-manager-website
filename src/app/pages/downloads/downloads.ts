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

interface DownloadPlatform {
  name: string;
  icon: string;
  description: string;
  downloads: DownloadOption[];
  packageManagers?: PackageManagerOption[];
}

interface DownloadOption {
  name: string;
  architecture: string;
  size: string;
  url: string;
}

interface PackageManagerOption {
  name: string;
  command: string;
  icon?: string;
}

interface ChangelogVersion {
  version: string;
  date: string;
  changes: Record<string, string[]>;
  isLatest?: boolean;
}

// GitHub API Interfaces
interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  assets: GitHubAsset[];
  body: string;
  prerelease: boolean;
  html_url: string;
}

interface GitHubAsset {
  name: string;
  size: number;
  browser_download_url: string;
}

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
  private allReleases: GitHubRelease[] = [];
  isLoading = true;
  error: string | null = null;
  latestRelease: GitHubRelease | null = null;
  latestReleaseBodyHtml = '';

  private readonly GITHUB_API_BASE = 'https://api.github.com/repos/Zarestia-Dev/rclone-manager';
  private readonly CHANGELOG_URL =
    'https://raw.githubusercontent.com/Zarestia-Dev/rclone-manager/master/CHANGELOG.md';

  async ngOnInit() {
    await this.loadData();
  }

  async loadData(retryCount = 0): Promise<void> {
    const maxRetries = 2;

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
        setTimeout(() => this.loadData(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }

      // Final failure - show fallback
      this.error =
        'Unable to load the latest release information from GitHub. Please visit our GitHub page for downloads.';
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
      this.http.get<GitHubRelease[]>(`${this.GITHUB_API_BASE}/releases`),
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
      filteredReleases = releases.filter(r => r.tag_name.includes('headless'));
    } else {
      filteredReleases = releases.filter(r => !r.tag_name.includes('headless'));
    }

    this.latestRelease = filteredReleases.length > 0 ? filteredReleases[0] : null;

    if (this.latestRelease) {
      this.latestReleaseBodyHtml = await marked.parse(this.latestRelease.body || '');
      this.platforms = this.generatePlatformsFromReleases(filteredReleases);
    } else {
       // Fallback if no matching releases found for mode
       this.latestReleaseBodyHtml = '<p>No release notes found for this mode.</p>';
       this.platforms = this.generatePlatformsFromReleases([]);
    }
  }

  private async fetchChangelog(): Promise<void> {
    const changelogText = await firstValueFrom(
      this.http.get(this.CHANGELOG_URL, { responseType: 'text' }),
    );

    this.changelog = this.parseChangelog(changelogText);
  }

  private generatePlatformsFromReleases(releases: GitHubRelease[]): DownloadPlatform[] {
    const mode = this.modeService.currentMode();

    // Headless Mode Logic
    if (mode === 'headless') {
      const headlessPlatforms: DownloadPlatform[] = [
        {
          name: 'Linux (Headless)',
          icon: 'dns',
          description: 'For Linux Servers (Systemd Service). Run as a web server without GUI.',
          downloads: [],
          packageManagers: [
            {
              name: 'Docker',
              command: 'docker pull ghcr.io/zarestia-dev/rclone-manager:headless',
              icon: 'layers',
            },
            {
              name: 'AUR (Stable)',
              command: 'yay -S rclone-manager-headless',
              icon: 'terminal',
            },
            {
              name: 'AUR (Git)',
              command: 'yay -S rclone-manager-headless-git',
              icon: 'terminal',
            },
            {
              name: 'Systemd Setup',
              command: 'Check Documentation for manual setup',
              icon: 'description',
            },
          ],
        },
      ];

      // Add .deb and .rpm downloads if available in headless release assets
      const latestHeadless = releases[0];
      if (latestHeadless && latestHeadless.assets) {
        latestHeadless.assets.forEach((asset) => {
          const downloadOption = this.createDownloadOption(asset);
          if (!downloadOption) return;

          const name = asset.name.toLowerCase();
          // Headless .deb/.rpm usually have 'headless' in name or are just the server binary
          // Check if it's a package and add to downloads
          if (name.includes('.deb') || name.includes('.rpm')) {
             headlessPlatforms[0].downloads.push(downloadOption);
          }
        });
      }
      
      return headlessPlatforms;
    }

    // Desktop Mode Logic (Default)
    const latestRelease = releases[0];
    if (!latestRelease || !latestRelease.assets) return [];

    const platforms: DownloadPlatform[] = [
      {
        name: 'Windows',
        icon: 'computer',
        description: 'For Windows 10/11 (x64 and ARM64)',
        downloads: [],
        packageManagers: [
          {
            name: 'Winget',
            command: 'winget install RClone-Manager.rclone-manager',
            icon: 'terminal',
          },
          {
            name: 'Chocolatey',
            command: 'choco install rclone-manager',
            icon: 'terminal',
          },
          {
            name: 'Scoop',
            command: 'scoop bucket add extras && scoop install rclone-manager',
            icon: 'terminal',
          },
        ],
      },
      {
        name: 'macOS',
        icon: 'laptop_mac',
        description: 'For macOS 10.15+ (Intel and Apple Silicon)',
        downloads: [],
        packageManagers: [],
      },
      {
        name: 'Linux',
        icon: 'memory',
        description: 'For Linux distributions (x64 and ARM64)',
        downloads: [],
        packageManagers: [
          {
            name: 'AUR',
            command: 'yay -S rclone-manager',
            icon: 'terminal',
          },
          {
            name: 'AUR (Git)',
            command: 'yay -S rclone-manager-git',
            icon: 'terminal',
          },
          {
            name: 'Flathub',
            command: 'flatpak install io.github.zarestia_dev.rclone-manager',
            icon: 'terminal',
          },
        ],
      },
    ];

    // Process assets and categorize by platform based on your naming convention
    latestRelease.assets.forEach((asset) => {
      const downloadOption = this.createDownloadOption(asset);
      if (!downloadOption) return;

      const name = asset.name.toLowerCase();

      // Windows files: .msi, -setup.exe, .zip (portable)
      if (name.includes('.msi') || name.includes('-setup.exe') || (name.includes('.zip') && name.includes('portable'))) {
        platforms[0].downloads.push(downloadOption);
      }
      // macOS files: .dmg, .app.tar.gz
      else if (name.includes('.dmg') || name.includes('.app.tar.gz')) {
        platforms[1].downloads.push(downloadOption);
      }
      // Linux files: .appimage, .deb, .rpm, .tar.gz (portable)
      else if (name.includes('.appimage') || name.includes('.deb') || name.includes('.rpm') || (name.includes('.tar.gz') && name.includes('portable'))) {
        platforms[2].downloads.push(downloadOption);
      }
    });

    // Sort downloads within each platform (MSI before EXE, etc.)
    platforms.forEach((platform) => {
      platform.downloads.sort((a, b) => {
        // Prioritize certain file types
        const typeOrder = [
          'MSI Installer',
          'EXE Installer',
          'Windows Portable',
          'DMG Installer',
          'macOS App Bundle',
          'AppImage',
          'Linux Portable',
          'DEB Package',
          'RPM Package',
        ];
        const aType = a.name.includes('MSI')
          ? 'MSI Installer'
          : a.name.includes('Setup')
            ? 'EXE Installer'
            : a.name.includes('Windows Portable')
              ? 'Windows Portable'
              : a.name.includes('DMG')
                ? 'DMG Installer'
                : a.name.includes('App Bundle')
                  ? 'macOS App Bundle'
                  : a.name.includes('AppImage')
                    ? 'AppImage'
                    : a.name.includes('Linux Portable')
                      ? 'Linux Portable'
                      : a.name.includes('Debian')
                        ? 'DEB Package'
                        : 'RPM Package';

        const bType = b.name.includes('MSI')
          ? 'MSI Installer'
          : b.name.includes('Setup')
            ? 'EXE Installer'
            : b.name.includes('Windows Portable')
              ? 'Windows Portable'
              : b.name.includes('DMG')
                ? 'DMG Installer'
                : b.name.includes('App Bundle')
                  ? 'macOS App Bundle'
                  : b.name.includes('AppImage')
                    ? 'AppImage'
                    : b.name.includes('Linux Portable')
                      ? 'Linux Portable'
                      : b.name.includes('Debian')
                        ? 'DEB Package'
                        : 'RPM Package';

        const aIndex = typeOrder.indexOf(aType);
        const bIndex = typeOrder.indexOf(bType);

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

  private createDownloadOption(asset: GitHubAsset): DownloadOption | null {
    const name = asset.name.toLowerCase();

    // Skip signature files and source code
    if (name.includes('.sig') || name.includes('source code') || name === 'latest.json') {
      return null;
    }

    // Extract architecture
    let architecture = 'Unknown';
    if (name.includes('x64') || name.includes('amd64') || name.includes('x86_64')) {
      architecture = 'x64';
    } else if (name.includes('arm64') || name.includes('aarch64')) {
      architecture = 'ARM64';
    } else if (name.includes('universal')) {
      architecture = 'Universal';
    }

    // Determine file type and display name
    // let fileType = 'Download'; // Unused
    let displayName = asset.name;

    if (name.includes('.msi')) {
      displayName = `Windows MSI (${architecture})`;
    } else if (name.includes('-setup.exe')) {
      displayName = `Windows Setup (${architecture})`;
    } else if (name.includes('.zip') && name.includes('portable')) {
      displayName = `Windows Portable (${architecture})`;
    } else if (name.includes('.dmg')) {
      displayName = `macOS DMG (${architecture})`;
    } else if (name.includes('.app.tar.gz')) {
      displayName = `macOS App Bundle (${architecture})`;
    } else if (name.includes('.appimage')) {
      displayName = `Linux AppImage (${architecture})`;
    } else if (name.includes('.deb')) {
      displayName = `Debian Package (${architecture})`;
    } else if (name.includes('.rpm')) {
      displayName = `RPM Package (${architecture})`;
    } else if (name.includes('.tar.gz') && name.includes('portable')) {
      displayName = `Linux Portable (${architecture})`;
    } else if (name.includes('headless')) {
        // Handle headless binary specifically if it's just 'rclone-manager-headless-linux-x64'
        if (name.includes('linux')) {
             displayName = `Headless Binary (${architecture})`;
        }
    } else {
      // Skip unknown file types
      return null;
    }

    // Format file size
    const sizeInMB = (asset.size / (1024 * 1024)).toFixed(1);
    const size = `${sizeInMB} MB`;

    return {
      name: displayName,
      architecture,
      size,
      url: asset.browser_download_url,
    };
  }

  private parseChangelog(changelogText: string): ChangelogVersion[] {
    const changelog: ChangelogVersion[] = [];
    const lines = changelogText.split('\n');
    let currentVersion: ChangelogVersion | null = null;
    let currentSection: string | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Match version headers like "## [v0.2.1] - 2026-02-05" or "## [0.1.3-beta] - 2025-09-30"
      // Regex explanation:
      // ^##\s+       : Starts with ## and whitespace
      // \[?          : Optional opening bracket
      // ([^\]]+)     : Capture version (anything except closing bracket)
      // \]?          : Optional closing bracket
      // \s*-\s*      : Separator
      // (.+)         : Capture date
      const versionMatch = line.match(/^##\s+\[?([^\]]+)\]?\s*-\s*(.+)$/);
      if (versionMatch) {
        if (currentVersion) {
          changelog.push(currentVersion);
        }

        currentVersion = {
          version: versionMatch[1].trim(),
          date: versionMatch[2].trim(),
          changes: {},
          isLatest: changelog.length === 0,
        };
        currentSection = null;
        continue;
      }

      if (!currentVersion) continue;

      // Match section headers like "### Added", "### Need Fix", "### Warning"
      const sectionMatch = line.match(/^###\s+(.+)$/);
      if (sectionMatch) {
        // Normalize section key: lowercase, replace spaces with dashes
        // "Need Fix" -> "need-fix"
        const sectionName = sectionMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
        currentSection = sectionName;

        if (!currentVersion.changes[currentSection]) {
          currentVersion.changes[currentSection] = [];
        }
        continue;
      }

      // Match bullet points (-, *, •)
      // Check for indentation to handle sub-items or simple multiline
      const isBullet = /^\s*[-*•]\s+/.test(line);

      if (currentSection) {
        if (isBullet) {
          const content = line.replace(/^\s*[-*•]\s*/, '').trim();
          if (content) {
            currentVersion.changes[currentSection].push(this.formatMarkdown(content));
          }
        } else {
          // Multiline support or indented continuation
          // If the line is not a bullet but we have a current section and a previous item, append to it.
          const currentList = currentVersion.changes[currentSection];
          if (currentList && currentList.length > 0) {
            // Append with break tag and formatted text
            currentList[currentList.length - 1] += '<br>' + this.formatMarkdown(trimmedLine);
          }
        }
      }
    }

    if (currentVersion) {
      changelog.push(currentVersion);
    }

    return changelog;
  }

  getSections(version: ChangelogVersion): string[] {
    const order = ['warning', 'added', 'changed', 'fixed', 'need-fix'];
    const keys = Object.keys(version.changes);

    return keys.sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);

      // If both are in the known order, sort by index
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // If A is known, it comes first
      if (indexA !== -1) return -1;
      // If B is known, it comes first
      if (indexB !== -1) return 1;
      // Otherwise sort alphabetically
      return a.localeCompare(b);
    });
  }

  getSectionIcon(section: string): string {
    switch (section) {
      case 'added':
        return 'add_circle';
      case 'changed':
        return 'edit';
      case 'fixed':
        return 'bug_report';
      case 'warning':
        return 'warning';
      case 'need-fix':
        return 'build'; // Icon for Need Fix
      default:
        return 'info';
    }
  }

  getSectionTitle(section: string): string {
    // "need-fix" -> "Need Fix"
    return section
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatMarkdown(text: string): string {
    // Escape HTML characters to prevent XSS (basic)
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Bold: **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Code: `text` -> <code>text</code>
    // We need to be careful with greediness.
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links: [text](url) -> <a href="url" target="_blank">text</a>
    formatted = formatted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );

    // Auto-link loose URLs (starting with http/https) that are NOT already inside an anchor tag
    // This is tricky with simple regex, but let's try a basic one for "Repo: https://..."
    // We use a negative lookbehind to ensure it's not preceded by ]( or ="
    formatted = formatted.replace(
      /(?<!href="|]\()https?:\/\/[^\s<]+/g,
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
    );

    return formatted;
  }

  private loadFallbackData(): void {
    // Minimal fallback data that directs users to GitHub - no hardcoded versions
    this.platforms = [
      {
        name: 'Windows',
        icon: 'computer',
        description: 'For Windows 10/11 (x64 and ARM64)',
        downloads: [
          {
            name: 'Download for Windows',
            architecture: 'All',
            size: 'Various',
            url: 'https://github.com/Zarestia-Dev/rclone-manager/releases/latest',
          },
        ],
        packageManagers: [
          {
            name: 'Winget',
            command: 'winget install RClone-Manager.rclone-manager',
            icon: 'terminal',
          },
          {
            name: 'Chocolatey',
            command: 'choco install rclone-manager',
            icon: 'terminal',
          },
          {
            name: 'Scoop',
            command: 'scoop bucket add extras && scoop install rclone-manager',
            icon: 'terminal',
          },
        ],
      },
      {
        name: 'macOS',
        icon: 'laptop_mac',
        description: 'For macOS 10.15+ (Intel and Apple Silicon)',
        downloads: [
          {
            name: 'Download for macOS',
            architecture: 'All',
            size: 'Various',
            url: 'https://github.com/Zarestia-Dev/rclone-manager/releases/latest',
          },
        ],
        packageManagers: [],
      },
      {
        name: 'Linux',
        icon: 'memory',
        description: 'For Linux distributions (x64 and ARM64)',
        downloads: [
          {
            name: 'Download for Linux',
            architecture: 'All',
            size: 'Various',
            url: 'https://github.com/Zarestia-Dev/rclone-manager/releases/latest',
          },
        ],
        packageManagers: [
          {
            name: 'AUR',
            command: 'yay -S rclone-manager',
            icon: 'terminal',
          },
          {
            name: 'AUR (Git)',
            command: 'yay -S rclone-manager-git',
            icon: 'terminal',
          },
          {
            name: 'Flathub',
            command: 'flatpak install io.github.zarestia_dev.rclone-manager',
            icon: 'terminal',
          },
        ],
      },
    ];

    this.changelog = [
      {
        version: 'Unable to Load',
        date: 'Please visit GitHub',
        isLatest: true,
        changes: {
          added: [
            'GitHub API temporarily unavailable',
            'Please visit the GitHub releases page for the latest information',
            'All release data is normally fetched dynamically from GitHub',
          ],
        },
      },
    ];

    // Set a generic latest release for the fallback
    this.latestRelease = {
      tag_name: 'latest',
      name: 'Latest Release',
      published_at: new Date().toISOString(),
      assets: [],
      body: 'Please visit GitHub for release notes',
      prerelease: false,
      html_url: 'https://github.com/Zarestia-Dev/rclone-manager/releases/latest',
    };
    this.latestReleaseBodyHtml = '<p>Please visit GitHub for release notes</p>';
  }

  copyCommand(command: string): void {
    navigator.clipboard.writeText(command).then(
      () => {
        this.snackBar.open('Command copied to clipboard', 'Close', {
          duration: 3000,
        });
      },
      (err) => {
        console.error('Could not copy command: ', err);
        this.snackBar.open('Failed to copy command', 'Close', {
          duration: 3000,
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

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
        return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
      }
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }
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
        releases: `${this.GITHUB_API_BASE}/releases`,
        changelog: this.CHANGELOG_URL,
      },
    };
  }
}
