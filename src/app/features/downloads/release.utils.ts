import { GitHubRelease } from './downloads.model';

/**
 * Whether a GitHub release is a headless build. A release counts as headless if
 * "headless" appears in its tag, its name, or any of its asset names.
 */
export function isHeadlessRelease(release: GitHubRelease): boolean {
  const tag = release.tag_name?.toLowerCase() ?? '';
  const name = release.name?.toLowerCase() ?? '';
  return (
    tag.includes('headless') ||
    name.includes('headless') ||
    !!release.assets?.some((a) => a.name.toLowerCase().includes('headless'))
  );
}
