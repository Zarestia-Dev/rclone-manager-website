# [[icon:update.primary]] Updates & Upgrades

This guide explains how updates are checked, downloaded, and applied in RClone Manager for both the application itself and the core **Rclone** engine.

---

## [[icon:apps.primary]] Application Updates

RClone Manager distributes updates through different channels and mechanisms depending on the platform and package format you use.

### 1. In-App Updates

How an update is installed depends on how RClone Manager was installed. The app checks the GitHub Releases for a build that matches your platform and only announces an update when a matching package exists.

| Installation                                 | How it updates                                                                                                    |
| :------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| Windows installer, macOS app, Linux AppImage | The built-in Tauri updater downloads and installs the signed release (the AppImage must be in a writable folder). |
| Portable (Windows, Linux, macOS)             | The app downloads the signed portable `.zip`, verifies it and replaces its own executable.                        |
| Standalone server (`rclone-manager-server`)  | The same signed `.zip` mechanism, when the executable and its folder belong to the user running the server.       |
| Android (direct APK)                         | The app verifies the APK, then Android's installer asks for your confirmation.                                    |
| AUR, `.deb`, `.rpm`, Flatpak, Docker         | Not installed by the app. It only announces the new version; update with your package manager (see below).        |

- **Channels**: In **Settings → About**, you can choose between the **Stable** and **Beta** update channels. A beta build can switch to the latest stable release right away, even when its version number is lower; it does not have to wait for the next stable version.
- **No administrator password**: The app never asks for a root or administrator password. If the executable or its folder is read-only or owned by another user, installation is disabled and the reason is shown; update it with your deployment tooling instead.
- **Automatic rollback**: After a portable or server update, the new version must report a successful start within 90 seconds and stay running for 10 more seconds. Otherwise the previous executable is restored and the failed version is hidden from the update list. Only the executable is rolled back, not your settings.
- **Turning updates off**: Set `RCLONE_MANAGER_DISABLE_UPDATES=1` to keep release checks but disable in-app installation.

---

### 2. [[icon:inventory_2.primary]] Package-Managed Installations

When a package manager owns the installation, the in-app updater does not install anything. The app still shows when a new version exists; update it the way you installed it.

- **Arch Linux (AUR)**:

  **Using `yay`:**

  ```bash
  yay -Syu rclone-manager
  ```

  **Using `paru`:**

  ```bash
  paru -Syu rclone-manager
  ```

  The server packages update the same way; use `rclone-manager-server` (pure server) or `rclone-manager-headless` (server with tray) instead of `rclone-manager`.

  **Manual Build (Git):**

  ```bash
  git clone https://aur.archlinux.org/rclone-manager.git
  cd rclone-manager
  makepkg -si
  ```

- **Debian/Ubuntu (`.deb`) and Fedora (`.rpm`)**: Download the new package from [GitHub Releases](https://github.com/Zarestia-Dev/rclone-manager/releases) and install it with your package manager (for example `sudo apt install ./package.deb` or `sudo dnf install ./package.rpm`).
- **Flatpak**:
  ```bash
  flatpak update io.github.zarestia_dev.rclone-manager
  ```
- **Docker Container**: The container announces a new `headless-` release once its matching server package is published. Pull the latest image and re-create your container:
  ```bash
  docker pull ghcr.io/zarestia-dev/rclone-manager:latest
  ```
  Docker and Podman containers are detected automatically. On other container runtimes, set `RCLONE_MANAGER_INSTALLATION_TYPE=container` so the app does not try to replace its executable inside the container.

#### Resolving a Package Collision on Arch

If an older release replaced your AUR installation with the Debian package, the AUR package (`rclone-manager`) and the `.deb` (`r-clone-manager`, with an extra hyphen) can both be registered. Remove the `.deb` and reinstall the AUR package:

```bash
sudo dpkg --remove r-clone-manager
yay -Syu rclone-manager
```

---

## [[icon:settings_suggest.primary]] Rclone Engine Updates

RClone Manager can update the core **Rclone** binary independently of the GUI application using Rclone's built-in `selfupdate` API.

### 1. Execution Flow

Go to **Settings → About Rclone** to toggle auto-checks, select channels (**Stable** vs **Beta**), and trigger updates.
The manager selects an update strategy dynamically based on folder write permissions.

### 2. Update Strategies

| Strategy              | When it applies                                                         | Action taken                                                                                                                                                                                                 |
| :-------------------- | :---------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **In-Place Swap**     | Configured Rclone path is in a writable directory.                      | Overwrites the current Rclone binary file directly.                                                                                                                                                          |
| **Download-to-Local** | Active Rclone is system-wide (e.g. `/usr/bin/rclone`) and is read-only. | Downloads the binary to the RClone Manager config directory (e.g., `~/.config/rclone-manager/rclone.new`) and registers a pending update. The swap is safely completed on next application restart/shutdown. |
| **Remote Instances**  | Active backend is remote (e.g. running on a VPS or remote NAS).         | Triggers `selfupdate` on the remote server via the RC API. **Requires a manual restart of the remote Rclone process/service to apply.**                                                                      |

> [!TIP]
> **Check Current Settings**  
> You can view or change the active Rclone binary path in **Settings → Core → Rclone Binary**. If you are using the Flatpak version and want to use your system's Rclone binary, ensure it points to the host prefix path: `/var/run/host/usr/bin/rclone` as explained in the [Linux Troubleshooting Guide](../support/troubleshooting-linux.md#issue-5).
