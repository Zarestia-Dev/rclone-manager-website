import { DownloadOption, GitHubAsset } from './downloads.model';
import {
  FILE_EXTENSION_PATTERNS,
  ARCHITECTURE_PATTERNS,
  ARCHITECTURE_NAMES,
} from './downloads.constants';

export function createDownloadOption(asset: GitHubAsset): DownloadOption | null {
  const name = asset.name.toLowerCase();

  // Skip signature files and source code
  if (
    name.includes('.sig') ||
    name.includes('source code') ||
    name === 'latest.json' ||
    /(?:sha256|checksums)/.test(name)
  ) {
    return null;
  }

  // Server archives have a strict OS/architecture contract with release-server.yml.
  if (name.startsWith('rclone-manager-server_')) {
    const match =
      /^rclone-manager-server_[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z0-9.-]+)?_(linux|windows|macos)_(x86_64|aarch64)\.(tar\.gz|zip)$/.exec(
        name,
      );
    if (!match) return null;
    const [, os, arch, extension] = match;
    if (extension !== (os === 'windows' ? 'zip' : 'tar.gz')) return null;
    const architecture = arch === 'x86_64' ? ARCHITECTURE_NAMES.x64 : ARCHITECTURE_NAMES.ARM64;
    return {
      name: asset.name,
      displayName: `Server (${architecture}, .${extension})`,
      architecture,
      size: `${(asset.size / (1024 * 1024)).toFixed(1)} MB`,
      url: asset.browser_download_url,
      type: 'Server Archive',
      platformIndex: os === 'windows' ? 0 : os === 'macos' ? 1 : 2,
    };
  }

  // Match the APK names emitted by release-android.yml, including 32-bit ABIs.
  if (name.endsWith('.apk')) {
    const match =
      /^rclone[ ._-]manager_[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z0-9.-]+)?_(arm64-v8a|armeabi-v7a|x86_64|x86)\.apk$/.exec(
        name,
      );
    if (!match) return null;
    const architectures: Record<string, string> = {
      'arm64-v8a': 'ARM64',
      'armeabi-v7a': 'ARMv7',
      x86_64: 'x64',
      x86: 'x86',
    };
    const architecture = architectures[match[1]];
    return {
      name: asset.name,
      displayName: `Android APK (${architecture})`,
      architecture,
      size: `${(asset.size / (1024 * 1024)).toFixed(1)} MB`,
      url: asset.browser_download_url,
      type: 'Android APK',
      platformIndex: 3,
    };
  }

  // Extract architecture
  let architecture = ARCHITECTURE_NAMES.Unknown;
  if (ARCHITECTURE_PATTERNS.x64.some((p) => name.includes(p))) {
    architecture = ARCHITECTURE_NAMES.x64;
  } else if (ARCHITECTURE_PATTERNS.ARM64.some((p) => name.includes(p))) {
    architecture = ARCHITECTURE_NAMES.ARM64;
  } else if (ARCHITECTURE_PATTERNS.Universal.some((p) => name.includes(p))) {
    architecture = ARCHITECTURE_NAMES.Universal;
  }

  // Determine file type and display name
  const matchedPattern = FILE_EXTENSION_PATTERNS.find((config) => {
    const primaryMatch = name.includes(config.pattern);
    if (!primaryMatch) return false;

    if (config.secondaryPattern) {
      return name.includes(config.secondaryPattern);
    }
    return true;
  });

  if (!matchedPattern) {
    return null;
  }

  // Format file size
  const sizeInMB = (asset.size / (1024 * 1024)).toFixed(1);
  const size = `${sizeInMB} MB`;

  return {
    name: asset.name,
    displayName: `${matchedPattern.displayName} (${architecture})`,
    architecture,
    size,
    url: asset.browser_download_url,
    type: matchedPattern.type,
    platformIndex: matchedPattern.platformIndex,
  };
}

export function getDownloadType(name: string): string {
  const matched = FILE_EXTENSION_PATTERNS.find((p) => name.includes(p.displayName));
  return matched ? matched.type : 'Unknown';
}
