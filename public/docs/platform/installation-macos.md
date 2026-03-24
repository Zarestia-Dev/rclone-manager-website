# Installation: macOS

Welcome to the **RClone Manager** macOS installation guide. We support both **Intel (x86_64)** and **Apple Silicon** architectures.

---

## [[icon:terminal.primary]] Method 1: Homebrew (Preferred)

Homebrew is the industry-standard package manager for macOS. It ensures your application is correctly placed and allows for easy updates.

### 1. Tap the repository

Add Zarestia's official tap to your Homebrew installation:

```bash
brew tap Zarestia-Dev/zarestia
```

### 2. Install RClone Manager

Install the cask directly using:

```bash
brew install --cask rclone-manager
```

> [!TIP]
> **Why Homebrew?**  
> Using Homebrew automatically handles the security quarantine flags and makes updating to future versions as simple as running `brew upgrade`.

---

## [[icon:archive.primary]] Method 2: Direct Download

If you prefer not to use a package manager, you can download a standalone installer.

### 1. Download the Latest DMG

Visit our **[GitHub Releases](https://github.com/Zarestia-Dev/rclone-manager/releases)** and download the `.dmg` file for your architecture:

- **Apple Silicon:** `RClone.Manager_{version}_aarch64.dmg`
- **Intel:** `RClone.Manager_{version}_x64.dmg`

### 2. Installation steps

1.  **Open** the downloaded `.dmg` file.
2.  **Drag and drop** the **RClone Manager** icon into your **Applications** folder.

### 3. [[icon:security.warn]] Bypass macOS Security Flags

Because RClone Manager is open-source and not notarized by Apple, you must authorize it manually:

1.  **Right-click** (Control + Click) on the **RClone Manager.app** in your Applications folder.
2.  Select **Open** from the menu.
3.  Click **Open** in the confirmation dialog.

If the app still fails to open with a "damaged" error, run this in your terminal:

```bash
xattr -rd com.apple.quarantine "/Applications/RClone Manager.app"
```

---

## [[icon:settings_suggest.primary]] System Requirements

To enable advanced features like **Mounting Cloud Storage**, you may need additional drivers:

### **macFUSE**

The "Mount" feature allows you to browse cloud files as if they were local disks. This requires the latest version of macFUSE.

- **Download:** [osxfuse.github.io](https://osxfuse.github.io/)
- **Configuration:** Go to **System Settings > Privacy & Security** and allow the system extension after installation. A restart may be required.

---

## [[icon:build.warn]] Troubleshooting

If you encounter issues during installation or setup on macOS, please refer to the following guide:

### **"App is damaged and can't be opened"**
This is a common macOS Gatekeeper issue for unsigned apps.
- **Solution:** Run the `xattr -rd com.apple.quarantine "/Applications/RClone Manager.app"` command mentioned above.

### **Permission Denied for Mounts**
If you cannot mount cloud drives, macFUSE might be blocked.
- **Solution:** Check **System Settings > Privacy & Security** and ensure the "macFUSE" system extension is allowed. You may need to click the "Allow" button and restart.

### **Rclone command not found**
RClone Manager bundled its own rclone, but if you have a custom setup, ensure your path is correct.
- **Solution:** Check the app settings to point to your rclone binary if needed.

> [[icon:open_in_new.accent]] **Detailed Guide:** For more advanced solutions and technical help, please visit our **[macOS Troubleshooting Guide](../support/troubleshooting-macos.md)**.

---

## [[icon:contact_support.primary]] Support & Resources

- [[icon:code.accent]] **Source Code:** [github.com/Zarestia-Dev/rclone-manager](https://github.com/Zarestia-Dev/rclone-manager)
- [[icon:help.primary]] **Issue Tracker:** [Report a bug](https://github.com/Zarestia-Dev/rclone-manager/issues)
- [[icon:update.success]] **Stay Updated:** Follow the repository to get notified of new releases.
