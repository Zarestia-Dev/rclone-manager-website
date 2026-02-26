import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GithubService } from './github.service';
import { ChangelogVersion } from '../models/downloads.model';
import { CHANGELOG_SECTION_ORDER, SECTION_ICONS } from '../constants/downloads.constants';

export interface ChangelogSection {
  title: string;
  items: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ChangelogService {
  private github = inject(GithubService);

  fetchUnreleasedChanges(): Observable<ChangelogSection[]> {
    return this.github
      .getRaw('Zarestia-Dev/rclone-manager', 'master', 'CHANGELOG.md')
      .pipe(map((content: string) => this.parseUnreleased(content)));
  }

  fetchFullChangelog(): Observable<ChangelogVersion[]> {
    return this.github
      .getRaw('Zarestia-Dev/rclone-manager', 'master', 'CHANGELOG.md')
      .pipe(map((content: string) => this.parseFullChangelog(content)));
  }

  getSections(version: ChangelogVersion): string[] {
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

  getSectionIcon(section: string): string {
    if (Object.prototype.hasOwnProperty.call(SECTION_ICONS, section)) {
      return SECTION_ICONS[section];
    }
    return 'info';
  }

  getSectionTitle(section: string): string {
    return section
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 84600) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 84600)}d ago`;
  }

  private formatMarkdown(text: string): string {
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    formatted = formatted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
    formatted = formatted.replace(
      /(?<!href="|]\()https?:\/\/[^\s<]+/g,
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
    );

    return formatted;
  }

  private parseFullChangelog(changelogText: string): ChangelogVersion[] {
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
            currentVersion.changes[currentSection].push(this.formatMarkdown(content));
          }
        } else {
          const currentList = currentVersion.changes[currentSection];
          if (currentList && currentList.length > 0) {
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

  private parseUnreleased(content: string): ChangelogSection[] {
    const unreleasedMatch = content.match(/## Unreleased\n\n([\s\S]*?)(?=\n## \[|$)/);
    if (!unreleasedMatch) return [];

    const unreleasedContent = unreleasedMatch[1];
    const sections: ChangelogSection[] = [];

    // Split by ### headers
    const rawSections = unreleasedContent.split(/\n### /);

    for (const rawSection of rawSections) {
      if (!rawSection.trim()) continue;

      const lines = rawSection.split('\n');
      const title = lines[0].trim();
      const items = lines
        .slice(1)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '))
        .map((line) => line.substring(2));

      if (items.length > 0) {
        sections.push({ title, items });
      }
    }

    return sections;
  }
}
