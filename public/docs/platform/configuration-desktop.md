# [[icon:desktop_windows.primary]] Desktop Configuration

RClone Manager is a cross-platform GUI application that provides an intuitive interface for managing Rclone remotes on Linux, Windows, and macOS.

---

## [[icon:visibility.primary]] Overview

The desktop version of RClone Manager runs as a native application on your computer, providing full access to all features through a modern, responsive interface that adapts to your system's theme and preferences.

---

## [[icon:star.primary]] Key Features

### Remote Management
- **Add/Edit/Delete/Clone**: Complete CRUD operations for all your remotes.
- **OAuth Support**: Seamless authentication for cloud providers.
- **Interactive Configuration**: Wizard-based setup for complex remotes.
- **Encrypted Configs**: Automatic detection and handling of encrypted rclone configurations.

### Operations
- **Mount**: Mount remotes as local drives with full VFS support.
- **Serve**: Expose remotes via HTTP, WebDAV, FTP, SFTP, or DLNA.
- **Sync/Copy/Move**: Powerful file operations with real-time feedback.
- **Bisync**: Two-way synchronization with conflict detection.

### Scheduling
- **Cron-like Syntax**: Advanced scheduling with full cron expression support.
- **Flexible Operations**: Schedule any file operation.
- > [!TIP]
  > **Example:** `15,45 8-18/2 * 1,11 1-5` runs every 2 hours at minutes 15 and 45, between 08:00–18:00, on Mondays & Fridays, in January and November.

---

## [[icon:dashboard.primary]] Interface Overview

### Main Window
The interface is designed to be clean and efficient:
- **Remote List**: All configured remotes with colored status indicators.
- **Quick Actions**: Pin up to 3 primary operations per remote for one-tap access.
- **Job Monitor**: Live progress tracking with detailed transfer speeds.

### Settings & Customization
Access comprehensive settings to tailor your experience:
- **Theme**: Automatic switching between light and dark modes.
- **Backend Options**: Configure global mount settings and VFS flags.
- **Memory Optimization**: Experimental options for low-resource environments.

---

## [[icon:terminal.primary]] CLI & Path Resolution

While primarily a GUI application, RClone Manager supports command-line arguments and environment variables for advanced automation.

### Default Directory Locations

| Platform    | Application Data                       | Cache Location                     |
| :---------- | :------------------------------------- | :--------------------------------- |
| **Linux**   | `~/.local/share/rclone-manager/`       | `~/.cache/rclone-manager/`         |
| **macOS**   | `~/Library/Application Support/...`    | `~/Library/Caches/...`             |
| **Windows** | `%APPDATA%\rclone-manager\`            | `%LOCALAPPDATA%\rclone-manager\`   |

> [!NOTE]
> **Precedence Logic**  
> CLI arguments have the highest priority, followed by Environment Variables, and finally System Defaults.

---

## [[icon:security.primary]] Security & Backup

- **Keyring Storage**: Master passwords are stored securely in your system's native keychain.
- **Encrypted Exports**: Configuration backups can be encrypted with a custom password.
- **Rebuilt Backup System**: As of v0.1.7, the backup system was completely rebuilt for better reliability.

---

## [[icon:contact_support.primary]] Support & Resources

- [[icon:code.accent]] **Source Code:** [github.com/Zarestia-Dev/rclone-manager](https://github.com/Zarestia-Dev/rclone-manager)
- [[icon:help.primary]] **Issue Tracker:** [Report a bug](https://github.com/Zarestia-Dev/rclone-manager/issues)
- [[icon:update.success]] **Stay Updated:** Follow the repository to get notified of new releases.
