import { describe, expect, it } from 'vitest';
import { GitHubRelease } from './downloads.model';
import { isServerRelease } from './release.utils';

function release(tag_name: string, name: string, assets: string[]): GitHubRelease {
  return {
    tag_name,
    name,
    published_at: '2026-11-27T00:00:00Z',
    assets: assets.map((asset) => ({
      name: asset,
      size: 1,
      browser_download_url: `https://example.com/${asset}`,
    })),
    body: '',
    prerelease: false,
    html_url: `https://example.com/${tag_name}`,
  } as GitHubRelease;
}

describe('isServerRelease', () => {
  it('counts server-v releases as server releases', () => {
    expect(
      isServerRelease(
        release('server-v0.3.8-beta.1', 'RClone Manager Server v0.3.8-beta.1', [
          'server-linux-x86_64-0.3.8-beta.1.zip',
          'RClone.Manager.Server_0.3.8-beta.1_amd64.deb',
        ]),
      ),
    ).toBe(true);
  });

  it('still counts headless-v releases up to 0.3.7', () => {
    expect(
      isServerRelease(
        release('headless-v0.3.7', 'RClone Manager Server v0.3.7', [
          'server-linux-x86_64-0.3.7.zip',
        ]),
      ),
    ).toBe(true);
    expect(
      isServerRelease(
        release('headless-v0.3.6', 'RClone Manager Headless v0.3.6', [
          'RClone.Manager.Headless_0.3.6_amd64.deb',
        ]),
      ),
    ).toBe(true);
  });

  it('does not count desktop releases', () => {
    expect(
      isServerRelease(
        release('v0.3.7', 'RClone Manager v0.3.7', [
          'RClone.Manager_0.3.7_amd64.deb',
          'portable-linux-x86_64-0.3.7.zip',
        ]),
      ),
    ).toBe(false);
  });
});
