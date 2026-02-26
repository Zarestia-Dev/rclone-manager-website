import { DownloadOption, GitHubAsset } from '../models/downloads.model';
import {
  FILE_EXTENSION_PATTERNS,
  ARCHITECTURE_PATTERNS,
  ARCHITECTURE_NAMES,
} from '../constants/downloads.constants';

export function createDownloadOption(asset: GitHubAsset): DownloadOption | null {
  const name = asset.name.toLowerCase();

  // Skip signature files and source code
  if (name.includes('.sig') || name.includes('source code') || name === 'latest.json') {
    return null;
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
