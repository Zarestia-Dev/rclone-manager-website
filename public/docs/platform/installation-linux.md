# [[icon:terminal.primary]] Installation: Linux

Welcome to the **RClone Manager** Linux installation guide. Our application supports all major distributions, including Ubuntu, Fedora, Arch, and Debian, across both **x64 (AMD/Intel)** and **ARM64** architectures.

---

## [[icon:auto_awesome.primary]] Method 1: AppImage (Recommended)

The AppImage is a universal, standalone package that works on almost any Linux distribution without needing to install dependencies.

### 1. Download the AppImage

Visit our **[GitHub Releases](https://github.com/Zarestia-Dev/rclone-manager/releases)** and download the latest `.AppImage` file for your architecture.

### 2. Make it executable

Open your terminal in the directory where you downloaded the file and run:

```bash
chmod +x RClone.Manager-*.AppImage
```

### 3. Launch

You can now run the application directly:

```bash
./RClone.Manager-*.AppImage
```

> [!TIP]
> **Desktop Integration**  
> We recommend using [Gear Lever](https://github.com/mijorus/gearlever) or [AppImageLauncher](https://github.com/TheAlexBaden/AppImageLauncher) to automatically integrate the AppImage into your system's application menu.

---

## [[icon:inventory_2.primary]] Method 2: Native Packages

If you prefer using your system's built-in package manager for better integration and automatic updates.

### Debian / Ubuntu / Mint (`.deb`)

1. Download the `.deb` file from **[Releases](https://github.com/Zarestia-Dev/rclone-manager/releases)**.
2. Install via terminal:

```bash
sudo dpkg -i RClone.Manager-*.deb
sudo apt-get install -f  # Fixes any missing dependencies
```

### Fedora / RHEL / openSUSE (`.rpm`)

1. Download the `.rpm` file from **[Releases](https://github.com/Zarestia-Dev/rclone-manager/releases)**.
2. Install via terminal:

```bash
# Fedora/RHEL
sudo dnf install ./RClone.Manager-*.rpm

# openSUSE
sudo zypper install ./RClone.Manager-*.rpm
```

### Arch Linux (AUR)

Install using an AUR helper like `yay`:

```bash
# Stable Version
yay -S rclone-manager

# Git Version (Bleeding Edge)
yay -S rclone-manager-git
```

---

## [[icon:layers.primary]] Method 3: Flatpak

Ideal for immutable systems like Fedora Silverblue, SteamOS, or users who prefer sandboxed applications.

```bash
flatpak install flathub io.github.zarestia_dev.rclone-manager
```

> [!NOTE]
> **Sandboxing & Permissions**  
> Flatpak apps are isolated from the system. If you need to mount cloud storage or access specific local folders, you may need to use [Flatseal](https://flathub.org/apps/com.github.tchx84.Flatseal) to manage permissions.

---

## [[icon:shopping_bag.primary]] Method 4: Snap Store

The Snap package is a self-contained application that works across many Linux distributions. It is easy to install and stays updated automatically.

```bash
sudo snap install rclone-manager
```

> [!IMPORTANT]
> **Classic Confinement**  
> This snap uses classic confinement to allow Rclone to access your files and configuration. This is necessary for the app to function correctly as a file manager and mount tool.

---

## [[icon:archive.primary]] Method 5: Portable (.tar.gz)

For users who prefer a standalone binary without AppImage or system-wide installation.

### 1. Download

Visit our **[GitHub Releases](https://github.com/Zarestia-Dev/rclone-manager/releases)** and download the `.tar.gz` archive for your architecture:

- **x86_64:** `RClone.Manager_{version}_x86_64_linux_portable.tar.gz`
- **ARM64:** `RClone.Manager_{version}_aarch64_linux_portable.tar.gz`

### 2. Dependencies

Unlike AppImage or Flatpak, the portable binary relies on system libraries. Ensure you have the following installed:

- **WebKit2GTK**: Required for the user interface (`libwebkit2gtk-4.1`).
- **AppIndicator**: Required for the system tray icon (`libayatana-appindicator3` or `libappindicator3`).

### 3. Extract and Run

Open your terminal in the download folder and run:

```bash
tar -xzf RClone.Manager_*.tar.gz
cd RClone.Manager_*
./RCloneManager
```

---

## [[icon:settings_suggest.primary]] System Requirements

To ensure the application runs correctly, your system must meet the following requirements:

### **GUI Dependencies**

RClone Manager requires the following libraries to display the user interface and the system tray icon:

- **WebKit2GTK**: `libwebkit2gtk-4.1` (Required for the UI)
- **AppIndicator**: `libayatana-appindicator3` or `libappindicator3` (Required for the Tray)

### **FUSE 3**

The "Mount" feature allows you to browse cloud files as if they were local disks. This requires `fuse3` to be installed on your system.

- **Ubuntu/Debian:** `sudo apt install fuse3`
- **Fedora:** `sudo dnf install fuse3`
- **Arch:** `sudo pacman -S fuse3`

> [!IMPORTANT]
> **Mount Permissions**  
> On some distributions, you may need to add your user to the `fuse` group and restart:  
> `sudo usermod -aG fuse $USER`

---

## [[icon:build.warn]] Troubleshooting

If you encounter issues during installation or setup on Linux:

### **Application fails to start**

Try running the AppImage or binary from the terminal to see the debug logs. Common issues include missing `libfuse2` on newer Ubuntu versions (you should use FUSE 3).

### **Mounting permissions denied**

Ensure `fuse3` is installed and the `user_allow_other` option is allowed in `/etc/fuse.conf` if you need multi-user access.

### **Wayland vs X11**

RClone Manager supports both, but if you experience graphical glitches, try forcing a backend via environment variables.

> [[icon:open_in_new.accent]] **Detailed Guide:** For more advanced solutions and technical help, please visit our **[Linux Troubleshooting Guide](../support/troubleshooting-linux.md)**.

---

## [[icon:contact_support.primary]] Support & Resources

- [[icon:code.accent]] **Source Code:** [github.com/Zarestia-Dev/rclone-manager](https://github.com/Zarestia-Dev/rclone-manager)
- [[icon:help.primary]] **Issue Tracker:** [Report a bug](https://github.com/Zarestia-Dev/rclone-manager/issues)
- [[icon:update.success]] **Stay Updated:** Follow the repository to get notified of new releases.
