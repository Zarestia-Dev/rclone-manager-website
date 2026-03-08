# Desktop Configuration

RClone Manager is a cross-platform GUI application that provides an intuitive interface for managing Rclone remotes on Linux, Windows, and macOS.

## Overview

The desktop version of RClone Manager runs as a native application on your computer, providing full access to all features through a modern, responsive interface that adapts to your system's theme and preferences.

## Key Features

### Remote Management

- **Add/Edit/Delete/Clone**: Complete CRUD operations for all your remotes
- **OAuth Support**: Seamless authentication for cloud providers
- **Interactive Configuration**: Wizard-based setup for complex remotes (iCloud, OneDrive, etc.)
- **Encrypted Configs**: Automatic detection and handling of encrypted rclone configurations
- **Quick Add**: Fast remote setup with smart provider detection

### Cloud Provider Support

Works with all major cloud storage providers:

- Google Drive, OneDrive, Dropbox
- Amazon S3, Wasabi, Backblaze B2
- iCloud Drive
- And many more...

### Operations

- **Mount**: Mount remotes as local drives with full VFS support
- **Serve**: Expose remotes via HTTP, WebDAV, FTP, SFTP, or DLNA
- **Sync**: One-way synchronization between locations
- **Copy**: Copy files without modifying source
- **Move**: Move files between locations
- **Bisync**: Two-way synchronization with conflict detection

### Scheduling

- **Cron-like Syntax**: Advanced scheduling with full cron expression support
- **Flexible Operations**: Schedule sync, copy, move, and bisync operations
- **Example**: `15,45 8-18/2 * 1,11 1-5` runs every 2 hours at minutes 15 and 45, between 08:00–18:00, on Mondays & Fridays, in January and November

### Customization

- **Primary Actions**: Pin up to 3 actions per remote for quick access
- **Adaptive Themes**: Automatic light/dark mode switching based on system preferences
- **Tray Controls**: System tray integration with quick actions menu
- **Smart Notifications**: Real-time job status updates
- **Backend Settings**: Global and per-remote backend flag configuration

## Interface Overview

### Main Window

The main interface consists of:

- **Remote List**: All configured remotes with status indicators
- **Quick Actions**: One-tap access to primary operations for each remote
- **Job Monitor**: Live progress tracking with transfer speeds
- **Navigation Menu**: Access to settings, scheduler, and other features

### Settings

Access comprehensive settings through the menu:

- **Theme**: Choose system, light, or dark mode
- **Backend Options**: Configure global mount settings, VFS flags, and cache options
- **Auto-updates**: Enable automatic updates (with rollback support)
- **Memory Optimization**: Experimental option to reduce RAM usage (Developer settings)
- **User Preferences**: Customize your workflow

### Global Backend Settings

Configure default backend options that apply to all remotes:

- Mount settings
- VFS flags and cache options
- Buffer sizes and timeouts
- Default behavior for all operations

These settings can be overridden on a per-remote basis for maximum flexibility. You can also import/export global settings for backup or sharing.

### Per-Remote Configuration

Each remote can have its own specific configuration:

- **Backend Flags**: Set provider-specific flags
- **Mount Filters**: Apply rclone filter options to control which files appear
- **VFS Options**: Override global VFS settings
- **Primary Actions**: Choose up to 3 quick-access operations

## Advanced Features

### Interactive Remote Setup

For providers requiring multi-step authentication (iCloud, OneDrive, etc.), use the interactive mode toggle in the "Quick Add Remote" modal. This provides:

- Step-by-step guidance
- Automatic OAuth handling
- Device authorization flows
- Custom configuration prompts

### Remote Terminal

Open any remote directly in your system's terminal application:

```bash
# Quick access to rclone CLI for the selected remote
rclone ls myremote:path
```

### Backup & Restore

The backup system provides:

- Complete configuration backup
- Encrypted backup files
- One-click restore
- Migration between systems

**Important**: As of v0.1.7, the backup system was completely rebuilt. Old backups are not compatible. Create a new backup after updating.

### File Manager Integration

**Nautilus Component** (v0.1.8+):

- Built-in file browser (Ctrl+B)
- Image, text, and PDF previews
- Basic navigation and folder creation
- Right-click operations

### VFS Control Panel

Monitor and manage Virtual File System instances:

- Real-time statistics
- Cache management
- Connection monitoring
- Performance metrics

## [[icon:terminal.primary]] CLI Reference

_(v0.2.2+)_

While primarily a GUI application, RClone Manager supports command-line arguments for advanced path overrides and debugging.

| Feature       | Flag                 | Environment Variable       | Description                   |
| :------------ | :------------------- | :------------------------- | :---------------------------- |
| **Data Dir**  | `--data-dir <PATH>`  | `RCLONE_MANAGER_DATA_DIR`  | App settings and logs         |
| **Cache Dir** | `--cache-dir <PATH>` | `RCLONE_MANAGER_CACHE_DIR` | Job cache and temporary files |
| **Logs Dir**  | `--logs-dir <PATH>`  | `RCLONE_MANAGER_LOG_DIR`   | Application and Rclone logs   |

### Example Usage

```bash
# Run with a custom data, cache, and logs directory
rclone-manager --data-dir /path/to/data --cache-dir /path/to/cache --logs-dir /path/to/logs
```

## [[icon:directory.primary]] Path Resolution & Precedence

RClone Manager follows a strict hierarchy when determining which directories to use for settings and cache. This allows for maximum flexibility, from standard installation to custom "portable" setups.

### 1. Precedence Logic

The application checks for paths in this specific order:

1. **CLI Arguments**: `--data-dir`, `--cache-dir`, or `--logs-dir` (Highest)
2. **Environment Variables**: `RCLONE_MANAGER_DATA_DIR`, `RCLONE_MANAGER_CACHE_DIR`, or `RCLONE_MANAGER_LOG_DIR`
3. **System Defaults**: OS-specific standard directories (Lowest)

### 2. Default Directory Locations

| Platform    | Application Data (Config, Remote Configs)       | Cache                      | Logs                       |
| :---------- | :---------------------------------------------- | :------------------------- | :------------------------- |
| **Linux**   | `~/.local/share/rclone-manager/`                | `~/.cache/rclone-manager/` | `~/.cache/rclone-manager/logs/` |
| **macOS**   | `~/Library/Application Support/rclone-manager/` | `~/Library/Caches/rclone-manager/` | `~/Library/Logs/rclone-manager/` |
| **Windows** | `%APPDATA%\rclone-manager\`                     | `%LOCALAPPDATA%\rclone-manager\` | `%LOCALAPPDATA%\rclone-manager\logs\` |

---

## [[icon:folder.primary]] Configuration Files

RClone Manager stores its internal settings and Rclone's configuration in the following locations by default:

### 1. Application Data (RClone Manager)

This directory contains your application settings and logs.

- **Linux**: `~/.local/share/rclone-manager/`
- **macOS**: `~/Library/Application Support/rclone-manager/`
- **Windows**: `%APPDATA%\rclone-manager\`

### 2. Rclone Configuration

This is the standard `rclone.conf` file used by the Rclone backend.

- **Linux/macOS**: `~/.config/rclone/rclone.conf`
- **Windows**: `%USERPROFILE%\.config\rclone\rclone.conf`

## Security

- **Keyring Storage**: Passwords stored securely in system keychain
- **Encrypted Exports**: Configuration backups can be encrypted
- **OAuth Tokens**: Secure handling of authentication tokens
- **No Plain-text Passwords**: All sensitive data is encrypted at rest

## Keyboard Shortcuts

- **Ctrl+B**: Open file browser (Nautilus component)
- **Ctrl+Q**: Quit application (Peacefully Shutdown)
- Platform-specific shortcuts for common operations

### Missing Dependencies

The app will prompt you to install missing dependencies on first run. Follow the on-screen instructions for your platform.

## Updates

### Automatic Updates (v0.1.3+)

RClone Manager includes a built-in update system:

- Automatic update checks
- Optional automatic downloads
- User confirmation before installation
- Rollback support if something goes wrong
- Faster delivery of fixes and features

Enable in Settings → Auto-updates.

### Manual Updates

Download the latest release from the [releases page](https://github.com/Zarestia-Dev/rclone-manager/releases) and install over your existing version.

## Additional Configuration

For specific configuration scenarios:

- **Remote-specific Settings**: See individual cloud provider guides
- **Advanced VFS Options**: Consult the [Rclone documentation](https://rclone.org/commands/rclone_mount/#vfs-file-caching)
- **Backend Flags**: Refer to [Rclone backend documentation](https://rclone.org/)
- **Mount Options**: Check [Rclone mount documentation](https://rclone.org/commands/rclone_mount/)

## Getting Help

- 📚 [Wiki Home](https://github.com/Zarestia-Dev/rclone-manager/wiki)
- 🐛 [Report Issues](https://github.com/Zarestia-Dev/rclone-manager/issues)
- 💬 [Discussions](https://github.com/Zarestia-Dev/rclone-manager/discussions)
- ⭐ [Star the Project](https://github.com/Zarestia-Dev/rclone-manager)

## Related Pages

- [Configuration](Configuration) - General configuration overview
- [Headless Configuration](Headless-Configuration) - Web server setup for NAS/VPS
- [Installation - Linux](Installation-Linux) - Linux-specific installation guide
- [Installation - macOS](Installation-macOS) - macOS-specific installation guide
