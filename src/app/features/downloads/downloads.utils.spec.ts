import { describe, expect, it } from 'vitest';
import { createDownloadOption } from './downloads.utils';

function parse(name: string) {
  return createDownloadOption({
    name,
    size: 1048576,
    browser_download_url: `https://example.com/${name}`,
  });
}

describe('server download archives', () => {
  for (const [os, platformIndex, extension] of [
    ['windows', 0, 'zip'],
    ['macos', 1, 'tar.gz'],
    ['linux', 2, 'tar.gz'],
  ] as const) {
    for (const [arch, architecture] of [
      ['x86_64', 'x64'],
      ['aarch64', 'ARM64'],
    ]) {
      it(`maps ${os}/${arch} to its platform and architecture`, () => {
        const name = `rclone-manager-server_0.3.3_${os}_${arch}.${extension}`;
        expect(parse(name)).toEqual({
          name,
          displayName: `Server (${architecture}, .${extension})`,
          architecture,
          size: '1.0 MB',
          url: `https://example.com/${name}`,
          type: 'Server Archive',
          platformIndex,
        });
      });
    }
  }

  it('accepts prerelease versions', () => {
    expect(parse('rclone-manager-server_0.4.0-beta.1_linux_x86_64.tar.gz')?.type).toBe(
      'Server Archive',
    );
  });

  for (const name of [
    '',
    'server-SHA256SUMS',
    'latest.json',
    'rclone-manager-server_0.3.3_linux_x86_64.tar.gz.sig',
    'rclone-manager-server_0.3.3_linux_x86_64.tar.gz.sha256',
    'rclone-manager-server_0.3.3_linux_x86_64.zip',
    'rclone-manager-server_0.3.3_windows_aarch64.tar.gz',
    'rclone-manager-server_0.3.3_freebsd_x86_64.tar.gz',
    'rclone-manager-server_0.3.3_linux_armv7.tar.gz',
    'rclone-manager-server_invalid_linux_x86_64.tar.gz',
  ]) {
    it(`rejects unsupported or non-download asset ${name}`, () => {
      expect(parse(name)).toBeNull();
    });
  }

  it('keeps existing tray installer mapping', () => {
    expect(parse('rclone-manager-headless_0.3.3_x64-setup.exe')).toMatchObject({
      type: 'EXE Installer',
      architecture: 'x64',
      platformIndex: 0,
    });
    expect(parse('rclone-manager-headless_0.3.3_aarch64.deb')).toMatchObject({
      type: 'DEB Package',
      platformIndex: 2,
    });
  });
});

describe('Android APK downloads', () => {
  for (const separator of ['.', ' ', '-']) {
    for (const [abi, architecture] of [
      ['arm64-v8a', 'ARM64'],
      ['armeabi-v7a', 'ARMv7'],
      ['x86_64', 'x64'],
      ['x86', 'x86'],
    ]) {
      it(`maps ${abi} with "${separator}" separator to the Android card`, () => {
        const name = `RClone${separator}Manager_0.3.3_${abi}.apk`;
        expect(parse(name)).toEqual({
          name,
          displayName: `Android APK (${architecture})`,
          architecture,
          size: '1.0 MB',
          url: `https://example.com/${name}`,
          type: 'Android APK',
          platformIndex: 3,
        });
      });
    }
  }

  it('accepts prerelease APK versions', () => {
    expect(parse('RClone.Manager_0.4.0-beta.1_arm64-v8a.apk')?.architecture).toBe('ARM64');
    expect(parse('RClone Manager_0.4.0-beta.1_arm64-v8a.apk')?.architecture).toBe('ARM64');
  });

  for (const name of [
    'RClone Manager_0.3.3_arm64-v8a.apk.sig',
    'RClone Manager_0.3.3_arm64-v8a.apk.sha256',
    'RClone Manager_0.3.3_mips.apk',
    'RClone Manager_invalid_arm64-v8a.apk',
    'RClone Manager_0.3.3_arm64-v8a.aab',
    'unrelated.apk',
  ]) {
    it(`rejects unsupported APK asset ${name}`, () => {
      expect(parse(name)).toBeNull();
    });
  }
});
