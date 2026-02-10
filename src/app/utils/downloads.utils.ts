import { ChangelogVersion, DownloadOption, GitHubAsset } from '../models/downloads.model';
import {
  CHANGELOG_SECTION_ORDER,
  SECTION_ICONS,
  FILE_EXTENSION_PATTERNS,
  ARCHITECTURE_PATTERNS,
  ARCHITECTURE_NAMES,
  RELATIVE_TIME_MESSAGES,
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

  const displayName = `${matchedPattern.displayName} (${architecture})`;

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

export function getDownloadType(name: string): string {
  // Extract the base type name without architecture (e.g. "Windows MSI (x64)" -> "Windows MSI")
  // Or match against the display names in constants

  // Actually, the sorting in downloads.ts relies on the exact strings in DOWNLOAD_TYPE_ORDER.
  // The 'name' passed here is likely the display name we constructed in createDownloadOption, e.g. "Windows MSI (x64)"
  // So we need to check which pattern's displayName is contained in the input name.

  const matched = FILE_EXTENSION_PATTERNS.find((p) => name.includes(p.displayName));
  return matched ? matched.type : 'Unknown';
}

export function formatMarkdown(text: string): string {
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
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links: [text](url) -> <a href="url" target="_blank">text</a>
  formatted = formatted.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Auto-link loose URLs (starting with http/https) that are NOT already inside an anchor tag
  formatted = formatted.replace(
    /(?<!href="|]\()https?:\/\/[^\s<]+/g,
    (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
  );

  return formatted;
}

export function parseChangelog(changelogText: string): ChangelogVersion[] {
  const changelog: ChangelogVersion[] = [];
  const lines = changelogText.split('\n');
  let currentVersion: ChangelogVersion | null = null;
  let currentSection: string | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

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

    const sectionMatch = line.match(/^###\s+(.+)$/);
    if (sectionMatch) {
      const sectionName = sectionMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
      currentSection = sectionName;

      if (!currentVersion.changes[currentSection]) {
        currentVersion.changes[currentSection] = [];
      }
      continue;
    }

    const isBullet = /^\s*[-*•]\s+/.test(line);

    if (currentSection) {
      if (isBullet) {
        const content = line.replace(/^\s*[-*•]\s*/, '').trim();
        if (content) {
          currentVersion.changes[currentSection].push(formatMarkdown(content));
        }
      } else {
        const currentList = currentVersion.changes[currentSection];
        if (currentList && currentList.length > 0) {
          currentList[currentList.length - 1] += '<br>' + formatMarkdown(trimmedLine);
        }
      }
    }
  }

  if (currentVersion) {
    changelog.push(currentVersion);
  }

  return changelog;
}

export function getSections(version: ChangelogVersion): string[] {
  const order = CHANGELOG_SECTION_ORDER;
  const keys = Object.keys(version.changes);

  return keys.sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
}

export function getSectionIcon(section: string): string {
  if (Object.prototype.hasOwnProperty.call(SECTION_ICONS, section)) {
    return SECTION_ICONS[section];
  }
  return 'info';
}

export function getSectionTitle(section: string): string {
  return section
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
      return diffInMinutes <= 1
        ? RELATIVE_TIME_MESSAGES.justNow
        : RELATIVE_TIME_MESSAGES.minutesAgo(diffInMinutes);
    }
    return diffInHours === 1
      ? RELATIVE_TIME_MESSAGES.oneHourAgo
      : RELATIVE_TIME_MESSAGES.hoursAgo(diffInHours);
  }
  if (diffInDays === 1) {
    return RELATIVE_TIME_MESSAGES.yesterday;
  }
  if (diffInDays < 7) {
    return RELATIVE_TIME_MESSAGES.daysAgo(diffInDays);
  }
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? RELATIVE_TIME_MESSAGES.oneWeekAgo : RELATIVE_TIME_MESSAGES.weeksAgo(weeks);
  }
  const months = Math.floor(diffInDays / 30);
  return months === 1
    ? RELATIVE_TIME_MESSAGES.oneMonthAgo
    : RELATIVE_TIME_MESSAGES.monthsAgo(months);
}
