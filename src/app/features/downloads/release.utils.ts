import { GitHubRelease } from './downloads.model';

/**
 * Whether a GitHub release is a server build. Server releases are tagged
 * `server-v<version>`; up to 0.3.7 they were `headless-v<version>`, so a release also
 * counts when "headless" appears in its tag, its name, or any of its asset names.
 */
export function isHeadlessRelease(release: GitHubRelease): boolean {
  const tag = release.tag_name?.toLowerCase() ?? '';
  const name = release.name?.toLowerCase() ?? '';
  return (
    tag.startsWith('server-v') ||
    tag.includes('headless') ||
    name.includes('headless') ||
    !!release.assets?.some((a) => a.name.toLowerCase().includes('headless'))
  );
}
