export interface DownloadPlatform {
  name: string;
  icon: string;
  description: string;
  downloads: DownloadOption[];
  packageManagers?: PackageManagerOption[];
}

export interface DownloadOption {
  name: string;
  displayName?: string;
  architecture: string;
  size: string;
  url: string;
  type?: string;
  platformIndex?: number;
}

export interface PackageManagerOption {
  name: string;
  command: string;
  icon?: string;
  url?: string;
  actionLabel?: string;
}

export interface ChangelogVersion {
  version: string;
  date: string;
  changes: Record<string, string[]>;
  isLatest?: boolean;
}

// GitHub API Interfaces
export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  assets: GitHubAsset[];
  body: string;
  prerelease: boolean;
  html_url: string;
}

export interface GitHubAsset {
  name: string;
  size: number;
  browser_download_url: string;
}
