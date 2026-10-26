# 📦 Packaging & Distribution

This guide covers installers, packages, and Docker images for **RClone Manager**.
Commands run from the application repository root. Outputs are under
`backend/target/release`; explicit target builds use
`backend/target/<target>/release` instead.

> **⚠️ Important Cross-Compilation Note:**
> Tauri **cannot** cross-compile native installers.
>
> - To build a **Windows** (`.exe`) installer, you must be on Windows.
> - To build a **macOS** (`.dmg`) installer, you must be on macOS.
> - To build **Linux** packages (`.deb`, `.rpm`), you must be on Linux.
>
> _For automated cross-platform builds, see the [CI/CD section](#-cicd-automation)._

---

## [[icon:window.primary]] Windows Packaging

### Standard Installer (NSIS & MSI)

Generates a standard setup wizard and a Microsoft Installer.

```bash
npm run tauri build

```

- **Output:** `backend/target/release/bundle/nsis/*.exe`
- **Output:** `backend/target/release/bundle/msi/*.msi`

### Portable Standalone

Generates a single `.exe` that does not require installation and saves config locally.

```bash
npm run tauri build -- --features portable --no-bundle

```

- **Output:** `backend/target/release/rclone-manager.exe`

---

## [[icon:terminal.primary]] Linux Packaging

The Linux bundler uses the assets located in `backend/desktop/linux/` (desktop files, icons) to generate distribution packages.

### Universal Bundles (.deb, .rpm, .AppImage)

By default, running the build command on Linux generates all configured formats in `tauri.conf.json`.

```bash
npm run tauri build

```

- **Output:** `backend/target/release/bundle/deb/*.deb` (Debian/Ubuntu)
- **Output:** `backend/target/release/bundle/rpm/*.rpm` (Fedora/RHEL)
- **Output:** `backend/target/release/bundle/appimage/*.AppImage` (Universal)

### Flatpak

Packaging for Flathub requires a specific manifest and the `flatpak` feature flag to ensure path compliance.

1. **Build Binary:** `npm run tauri build -- --features flatpak`
2. **Builder:** Use `flatpak-builder` with the manifest located in the root (or `backend/desktop/linux`).

### Portable Standalone

Generates a single binary that does not require installation and saves config locally.

```bash
npm run tauri build -- --features portable --no-bundle

```

- **Output:** `backend/target/release/rclone-manager`

---

## [[icon:apple.primary]] macOS Packaging

### DMG & App Bundle

Generates the standard Apple disk image and Application bundle.

```bash
npm run tauri build

```

- **Output:** `backend/target/release/bundle/dmg/*.dmg`
- **Output:** `backend/target/release/bundle/macos/RClone Manager.app`

### Code Signing & Notarization

To avoid "App Damaged" or "Unidentified Developer" warnings, you must sign the app.

- Set `APPLE_SIGNING_IDENTITY` and `APPLE_CERTIFICATE` environment variables.
- The build script will automatically attempt to sign if these are present.

---

## [[icon:dns.primary]] Headless & Docker Packaging

The headless version is packaged differently since it serves a web UI instead of opening a window.

### Pure server

From the application repository root:

```bash
npm run build
npm run build:server
```

The Cargo package is `rclone-manager-server`; its executable is
`backend/target/release/rclone-manager-server` (plus `.exe` on Windows).
The executable embeds the compiled frontend, translations and templates; no
other files need to ship with it.
The core crate is a linked library and does not produce another server process.

### Native server with tray and updater

```bash
npm run build:headless
```

This builds Tauri with `web-server,tray,updater` and uses
`backend/desktop/tauri.conf.headless.json`. The packaged binary is named
`rclone-manager-headless`, but this variant needs native desktop libraries.
A direct Cargo build of the native crate uses its Cargo binary name,
`rclone-manager`; the headless name is applied by Tauri packaging.

### Docker image

The root Dockerfile builds the frontend and pure server in its build stage:

```bash
docker build -t rclone-manager:local .
```


---

## [[icon:smart_toy.primary]] CI/CD Automation

We utilize **GitHub Actions** to automate packaging for all platforms.

### 1. Desktop Releases

- **Workflow:** `.github/workflows/release.yml`
- **Trigger:** Manual (`workflow_dispatch`).
- **Actions:** Builds Windows, macOS, and Linux assets simultaneously and uploads them to the release page.

### 2. Headless Releases

- **Workflow:** `.github/workflows/release-headless.yml`
- **Trigger:** Manual (`workflow_dispatch`).
- **Tag Naming:** Releases are prefixed with `headless-v*`.
- **Architecture:** Builds binaries for both `x86_64` (Intel/AMD) and `aarch64` (ARM/Raspberry Pi) using a matrix strategy.
- **Variant:** Native tray-enabled server packages.
- **Tauri project:** `backend/desktop`, with `tauri.conf.headless.json` and
  `web-server,tray,updater`, using `--no-default-features`.

The action sets `TAURI_APP_PATH` to the native project and `TAURI_FRONTEND_PATH`
to the repository root. These explicit paths replace Tauri's old `src-tauri`
directory convention.

### Standalone Server Releases

- **Workflow:** `.github/workflows/release-server.yml`, triggered manually.
- **Targets:** Linux, Windows, and macOS on x86_64 and aarch64.
- **Assets:** `server-<os>-<arch>-<version>.zip`. Each ZIP contains the executable,
  `LICENSE`, a short `README.txt` and, on Linux, the systemd unit template. The signed
  `updater.json` catalog is published beside the ZIPs.
- **Release:** Uploads to the same `headless-v<version>` draft as the tray workflow,
  without depending on its build jobs. Both workflows serialize release writes.
  Published releases are not overwritten by the server workflow.
- **Future targets:** Tracked in
  [backend/TODO.md](https://github.com/Zarestia-Dev/rclone-manager/blob/master/backend/TODO.md).

### 3. Docker Registry

- **Workflow:** `.github/workflows/docker-build-push.yml`
- **Registry:** `ghcr.io` (GitHub Container Registry).
- **Architectures:** Multi-arch builds for `linux/amd64` and `linux/arm64`.
- **Process:**

1. Builds images for each architecture.
2. Pushes temporary tags (e.g., `:latest-amd64`).
3. Creates a **Manifest List** to merge them under a single tag (`:latest`), allowing users on any architecture to pull the same image name.
