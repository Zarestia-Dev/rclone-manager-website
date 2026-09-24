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
- **Power Inhibitor**: OS-level sleep prevention on Linux (`systemd logind`), Windows (`SetThreadExecutionState`), and macOS (`NSProcessInfo`) while transfer operations or mounts are active. See **[Power Management & Safety](../user-guide/power-management.md)**.

### Scheduling & Automation

- **Cron-like Syntax**: Advanced scheduling with full cron expression support.
- **Flexible Operations**: Schedule any file operation.
- **Filesystem Watchers**: Local directory monitoring for automated sync runs. For debounce delays and net-change rules, see **[Filters & File Monitoring](../user-guide/filters-and-monitoring.md)**.
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
- **Backend Options**: Configure global mount settings, buffers, and VFS flags. Default configurations can be pre-optimized or customized using **[Template Management](../user-guide/template-management.md)**.
- **Memory Optimization**: Built-in options for low-resource environments.
- **Keyboard Navigation**: Global, Nautilus, and Flow shortcuts. See **[Keyboard Shortcuts](../user-guide/keyboard-shortcuts.md)**.

### System Tray & Window Management

RClone Manager is designed to run seamlessly in the background:

- **Minimize to Tray**: Closing the main window hides the interface to the system tray by default, keeping your mounts, file operations, schedules and file watchers running smoothly in the background.
- **Memory Optimization Option**: When you enable 'Destroy Window on Close' in the settings (Default enabled after V0.2.0), closing the main window will natively destroy the view to free up RAM. The core app process remains safely running in the background.
- **Secondary Windows**: Dialogs, file pickers, and other secondary modals are strictly managed by your OS. They are natively destroyed when closed to ensure optimal memory efficiency without impacting background tasks.

### OS Power Inhibitor (Automatic Sleep Prevention)

When file transfers, sync operations, or active mounts are running, RClone Manager automatically registers an OS-level power inhibitor assertion (`systemd logind` on Linux, `SetThreadExecutionState` on Windows, `NSProcessInfo` on macOS) to prevent the computer from going into idle sleep mid-transfer. It also listens for OS shutdown and termination signals to cleanly unmount FUSE drives and stop active tasks.

For full technical specifications, Linux D-Bus details, and terminal verification commands (`systemd-inhibit`, `powercfg`, `pmset`), see the dedicated guide: **[Power Management & Safety](../user-guide/power-management.md)**.

---

## [[icon:terminal.primary]] CLI & Path Resolution

While primarily a GUI application, RClone Manager supports command-line arguments and environment variables for external automation and shell scripts.

For complete flag specifications and environment variables, see the **[CLI Reference](../getting-started/cli.md)**.

### Example Usage

To initiate a background upload from the command-line or external scripts:

```bash
rclone-manager --send-to-remote "Dropbox:" --send-to-path "Backups" "/local/path/to/backup.tar.gz"
```

If another instance of RClone Manager is already running, the parameters will be forwarded to it automatically via single-instance IPC, starting the upload in the background of the running application.

### Default Directory Locations

| Platform    | Application Data                         | Cache Location                                                                     |
| :---------- | :--------------------------------------- | :--------------------------------------------------------------------------------- |
| **Linux**   | `~/.local/share/rclone-manager/`         | `~/.cache/rclone-manager/`                                                         |
| **macOS**   | `~/Library/Application Support/...`      | `~/Library/Caches/...`                                                             |
| **Windows** | `%APPDATA%\rclone-manager\`              | `%LOCALAPPDATA%\rclone-manager\`                                                   |
| **Android** | `/data/user/0/com.rclone.manager/files/` | `/data/user/0/com.rclone.manager/cache/` (resources copied to `/cache/resources/`) |

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
