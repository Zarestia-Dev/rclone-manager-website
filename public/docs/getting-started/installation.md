# Installation Overview

RClone Manager is available in three variants: the **Desktop Client** for personal computers, the **Server** for remote access (NAS, VPS, Docker), and the **Mobile App (Android Beta)** for mobile devices.

Select your preferred method below.

---

## [[icon:desktop_windows.primary]] Desktop Client

Designed for personal use on **Windows**, **Linux**, and **macOS**.

### Platform Guides

- **[Installation Windows](../platform/installation-windows.md)** (Includes Portable `.zip`)
- **[Installation Linux](../platform/installation-linux.md)** (Includes Portable `.zip`)
- **[Installation macOS](../platform/installation-macos.md)**

### Fast Download

You can always find the latest binaries, installers, and **portable versions** (Windows/Linux) for all platforms on our **[GitHub Releases Page](https://github.com/Zarestia-Dev/rclone-manager/releases)**.

---

## [[icon:android.primary]] Mobile App (Android Beta)

Designed for Android devices running ARM64, ARMv7, x86_64, or x86 architectures. Uses an in-process Go engine (`librclone`) via FFI bindings.

### Platform Guides

- **[Android Support (Beta)](../platform/configuration-android.md)** (Capabilities, FFI engine details, & WebDAV workaround)

### Fast Download

Download standalone architecture-separated APKs (`arm64-v8a`, `armeabi-v7a`, `x86_64`, `x86`) directly from our **[GitHub Releases Page](https://github.com/Zarestia-Dev/rclone-manager/releases)**.

---

## [[icon:dns.primary]] Server & Docker

Designed for servers, NAS, or running as a web service. Access the full UI via any web browser.

### 🐳 Docker (Recommended)

The official Docker image is available via the GitHub Container Registry.

- **[Docker Installation Guide](installation-server.md#docker-quick-start)**
- **Image:** `ghcr.io/zarestia-dev/rclone-manager`
- **Registry:** [View on GitHub Packages](https://github.com/Zarestia-Dev/rclone-manager/pkgs/container/rclone-manager)

### 🐧 Manual Server Setup

Run directly on Linux/Node.js environments without Docker.

- **[Server Setup Guide](installation-server.md)**
- **Versions:** Server versions follow their own tags (`server-v<version>`; up to 0.3.7 `headless-v<version>`, e.g. [`headless-v0.3.7`](https://github.com/Zarestia-Dev/rclone-manager/tree/headless-v0.3.7)).

---

## [[icon:list.primary]] System Requirements

### 1. Rclone Binary (Core)

The application acts as a GUI for **[Rclone](https://rclone.org/)**.

- **Desktop:** The app acts as a setup wizard and will automatically download, validate, or update Rclone on initial startup.
- **Server/Docker:** The Docker entrypoint automatically downloads/updates the Rclone binary on container startup.
- **Mobile (Android):** Runs natively using an in-process Go library (`librclone`) via FFI bindings.

### 2. Mounting Drivers (Required for Mount features)

To mount your cloud storage as a local disk drive, you must have the filesystem driver installed for the host OS.

| Platform    | Requirement | Official Source                                 |
| :---------- | :---------- | :---------------------------------------------- |
| **Windows** | **WinFsp**  | [winfsp.dev](https://winfsp.dev/rel/)           |
| **macOS**   | **macFUSE** | [osxfuse.github.io](https://osxfuse.github.io/) |
| **Linux**   | **fuse3**   | Usually pre-installed                           |

> **Note:** If these drivers are missing, the Desktop app will prompt you to install them. For Docker/Server, the host system must support FUSE and the container needs privileged access.
