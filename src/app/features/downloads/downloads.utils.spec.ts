import { describe, expect, it } from 'vitest';
import { createDownloadOption } from './downloads.utils';

function parse(name: string) {
  return createDownloadOption({
    name,
    size: 1048576,
    browser_download_url: `https://example.com/${name}`,
  });
}

describe('server and portable ZIP downloads', () => {
  for (const [os, platformIndex] of [
    ['windows', 0],
    ['macos', 1],
    ['linux', 2],
  ] as const) {
    for (const [arch, architecture] of [
      ['x86_64', 'x64'],
      ['aarch64', 'ARM64'],
    ]) {
      it(`maps server ${os}/${arch} to its platform and architecture`, () => {
        const name = `server-${os}-${arch}-0.3.4.zip`;
        expect(parse(name)).toEqual({
          name,
          displayName: `Server (${architecture}, .zip)`,
          architecture,
          size: '1.0 MB',
          url: `https://example.com/${name}`,
          type: 'Server Archive',
          platformIndex,
        });
      });

      it(`maps portable ${os}/${arch} to its own platform`, () => {
        const osName = { windows: 'Windows', macos: 'macOS', linux: 'Linux' }[os];
        expect(parse(`portable-${os}-${arch}-0.3.4.zip`)).toMatchObject({
          displayName: `${osName} Portable (${architecture}, .zip)`,
          architecture,
          type: `${osName} Portable`,
          platformIndex,
        });
      });
    }
  }

  it('accepts prerelease versions', () => {
    expect(parse('server-linux-x86_64-0.4.0-beta.1.zip')?.type).toBe('Server Archive');
    expect(parse('portable-linux-x86_64-0.4.0-beta.1.zip')?.type).toBe('Linux Portable');
  });

  for (const name of [
    '',
    'updater.json',
    'latest.json',
    'server-SHA256SUMS',
    'server-linux-x86_64-0.3.4.zip.sig',
    'server-linux-x86_64-0.3.4.zip.sha256',
    'server-linux-x86_64-0.3.4',
    'server-windows-x86_64-0.3.4.exe',
    'server-linux-x86_64-0.3.4.tar.gz',
    'server-freebsd-x86_64-0.3.4.zip',
    'server-linux-armv7-0.3.4.zip',
    'server-linux-x86_64-invalid.zip',
    'portable-linux-x86_64-0.3.4.tar.gz',
    'rclone-manager-server_0.3.4_linux_x86_64.tar.gz',
  ]) {
    it(`rejects unsupported or non-download asset ${name}`, () => {
      expect(parse(name)).toBeNull();
    });
  }

  it('keeps the pre-0.3.4 portable names working', () => {
    expect(parse('RClone.Manager_0.3.3_x86_64_windows_portable.zip')).toMatchObject({
      type: 'Windows Portable',
      platformIndex: 0,
    });
    expect(parse('RClone.Manager_0.3.3_x86_64_linux_portable.tar.gz')).toMatchObject({
      type: 'Linux Portable',
      platformIndex: 2,
    });
  });

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
