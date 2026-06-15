# [[icon:update.primary]] Updates & Upgrades

This guide explains how updates are checked, downloaded, and applied in RClone Manager for both the application itself and the core **Rclone** engine.

---

## [[icon:apps.primary]] Application Updates

RClone Manager distributes updates through different channels and mechanisms depending on the platform and package format you use.

### 1. Auto-Updates (Tauri Updater)

For native desktop builds (**Windows installer, macOS app, Debian/Ubuntu `.deb`, and Fedora `.rpm`**), the app uses the built-in Tauri Updater to check for updates against the GitHub Releases API.

- **Channels**: In **Settings → About**, you can choose between the **Stable** and **Beta** update channels.
- **Authentication on Linux**: Standard Linux systems require root privileges to install packages. The updater attempts privilege escalation using the following sequence:
  1.  **`pkexec`**: A graphical authentication dialog prompts for your password to install the package using the system's package manager (`dpkg` or `rpm`).
  2.  **Graphical Dialog (Zenity/KDialog)**: If `pkexec` is not available, the app falls back to using `zenity` or `kdialog` to prompt for a password, executing `sudo -S dpkg -i <package>` under the hood.
  3.  **Terminal Fallback**: Runs a standard `sudo` command. _Note: This fallback only succeeds if RClone Manager was originally launched from a terminal. If the app was launched via a desktop environment's application menu/shortcut, this step will fail since there is no terminal attached to prompt for or receive your password._

---

### 2. [[icon:warning.warn]] Arch Linux & AUR Installation

If you installed RClone Manager via the **Arch User Repository (AUR)**, the in-app updater **should not be used**.

> [!WARNING]
> **AUR Packaging Conflicts**
>
> - **Dependency Errors**: The native Tauri updater attempts to execute `dpkg` (Debian Package Manager) to install updates. On Arch Linux, this will fail with `dpkg: command not found` unless you have custom compatibility layers.
> - **Package Name Collisions**: If you have `dpkg` installed and run the update, it installs the Debian package. The AUR package is registered as `rclone-manager`, but the `.deb` package registers as `r-clone-manager` (with an extra hyphen). This creates a packaging collision, registers duplicate menu entries, and breaks the system tray integration.

#### Resolving a Package Collision

If the updater has corrupted your installation or left a conflicting package:

1.  Uninstall the `.deb` package manually:
    ```bash
    sudo dpkg --remove r-clone-manager
    ```
2.  Clean build and update the official AUR package using your AUR helper or via a manual build:

    **Using `yay`:**
    ```bash
    yay -Syu rclone-manager
    ```

    **Using `paru`:**
    ```bash
    paru -Syu rclone-manager
    ```

    **Manual Build (Git):**
    ```bash
    git clone https://aur.archlinux.org/rclone-manager.git
    cd rclone-manager
    makepkg -si
    ```

---

### 3. Flatpak, Docker, and Portable Updates

Environments that lack Tauri Updater support due to sandboxing or containment must be updated manually.

- **Flatpak**: The updater is compiled out to respect sandbox isolation. Update via Flatpak:
  ```bash
  flatpak update io.github.zarestia_dev.rclone-manager
  ```
- **Docker Container**: The container runs a headless server variant that checks only for `headless-` tags. Pull the latest image and re-create your container:
  ```bash
  docker pull ghcr.io/zarestia-dev/rclone-manager:latest
  ```
- **Portable Binary**: Download the latest `.tar.gz` (Linux) or `.zip` (Windows) archive from the [Downloads Page](https://hakanismail.info/zarestia/rclone-manager/downloads) or [GitHub Releases](https://github.com/Zarestia-Dev/rclone-manager/releases) and replace the existing binaries.

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
