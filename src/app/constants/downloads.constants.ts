import { ChangelogVersion, DownloadPlatform, GitHubRelease } from '../models/downloads.model';

export const GITHUB_REPO = 'Zarestia-Dev/rclone-manager';
export const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPO}`;
export const CHANGELOG_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/master/CHANGELOG.md`;

export const DESKTOP_PLATFORMS_CONFIG: DownloadPlatform[] = [
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

export const HEADLESS_PLATFORMS_CONFIG: DownloadPlatform[] = [
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
        command: 'View Guide',
        icon: 'description',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki/Configuration',
        actionLabel: 'View Guide',
      },
    ],
  },
];

export const DOWNLOAD_TYPE_ORDER = [
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

export const CHANGELOG_SECTION_ORDER = ['warning', 'added', 'changed', 'fixed', 'need-fix'];

export const SECTION_ICONS: Record<string, string> = {
  added: 'add_circle',
  changed: 'edit',
  fixed: 'bug_report',
  warning: 'warning',
  'need-fix': 'build',
};

export const FALLBACK_PLATFORMS: DownloadPlatform[] = [
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

export const FALLBACK_CHANGELOG: ChangelogVersion[] = [
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

export const FALLBACK_RELEASE: GitHubRelease = {
  tag_name: 'latest',
  name: 'Latest Release',
  published_at: new Date().toISOString(),
  assets: [],
  body: 'Please visit GitHub for release notes',
  prerelease: false,
  html_url: 'https://github.com/Zarestia-Dev/rclone-manager/releases/latest',
};

export const FALLBACK_RELEASE_BODY_HTML = '<p>Please visit GitHub for release notes</p>';

export const SYSTEM_REQUIREMENTS = [
  {
    icon: 'computer',
    title: 'Windows',
    requirements: ['Windows 10 version 1903 or later', '4 GB RAM minimum', '100 MB disk space'],
  },
  {
    icon: 'laptop_mac',
    title: 'macOS',
    requirements: ['macOS 10.15 (Catalina) or later', '4 GB RAM minimum', '100 MB disk space'],
  },
  {
    icon: 'memory',
    title: 'Linux',
    requirements: ['Modern Linux distribution', '4 GB RAM minimum', '100 MB disk space'],
  },
];

export const ARCHITECTURE_PATTERNS = {
  x64: ['x64', 'amd64', 'x86_64'],
  ARM64: ['arm64', 'aarch64'],
  Universal: ['universal', 'all'],
};

export const ARCHITECTURE_NAMES = {
  x64: 'x64',
  ARM64: 'ARM64',
  Universal: 'Universal',
  Unknown: 'Unknown',
};

export const RELATIVE_TIME_MESSAGES = {
  justNow: 'Just now',
  minutesAgo: (min: number) => `${min} minutes ago`,
  oneHourAgo: '1 hour ago',
  hoursAgo: (hours: number) => `${hours} hours ago`,
  yesterday: 'Yesterday',
  daysAgo: (days: number) => `${days} days ago`,
  oneWeekAgo: '1 week ago',
  weeksAgo: (weeks: number) => `${weeks} weeks ago`,
  oneMonthAgo: '1 month ago',
  monthsAgo: (months: number) => `${months} months ago`,
};

export const FILE_EXTENSION_PATTERNS = [
  {
    pattern: '.msi',
    displayName: 'Windows MSI',
    type: 'MSI Installer',
    platformIndex: 0, // Windows
  },
  {
    pattern: '-setup.exe',
    displayName: 'Windows Setup',
    type: 'EXE Installer',
    platformIndex: 0,
  },
  {
    pattern: '.zip',
    secondaryPattern: 'portable',
    displayName: 'Windows Portable',
    type: 'Windows Portable',
    platformIndex: 0,
  },
  {
    pattern: '.dmg',
    displayName: 'macOS DMG',
    type: 'DMG Installer',
    platformIndex: 1, // macOS
  },
  {
    pattern: '.app.tar.gz',
    displayName: 'macOS App Bundle',
    type: 'macOS App Bundle',
    platformIndex: 1,
  },
  {
    pattern: '.appimage',
    displayName: 'Linux AppImage',
    type: 'AppImage',
    platformIndex: 2, // Linux
  },
  {
    pattern: '.deb',
    displayName: 'Debian Package',
    type: 'DEB Package',
    platformIndex: 2,
  },
  {
    pattern: '.rpm',
    displayName: 'RPM Package',
    type: 'RPM Package',
    platformIndex: 2,
  },
  {
    pattern: '.tar.gz',
    secondaryPattern: 'portable',
    displayName: 'Linux Portable',
    type: 'Linux Portable',
    platformIndex: 2,
  },
  {
    pattern: 'headless',
    secondaryPattern: 'linux',
    displayName: 'Headless Binary',
    type: 'Binary',
    platformIndex: -1, // Special case
  },
];

export const DOWNLOADS_CONFIG = {
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 1000,
  SNACKBAR_DURATION: 3000,
};

export const DOWNLOADS_MESSAGES = {
  ERROR_LOADING:
    'Unable to load the latest release information from GitHub. Please visit our GitHub page for downloads.',
  NO_NOTES_FOUND: '<p>No release notes found for this mode.</p>',
  COPY_SUCCESS: 'Command copied to clipboard',
  COPY_FAILURE: 'Failed to copy command',
  CLOSE_ACTION: 'Close',
};
