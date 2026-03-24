# [[icon:window.primary]] Installation: Windows

RClone Manager supports **Windows 10** and **Windows 11** on both **x64** (Intel/AMD) and **ARM64** architectures.

---

## [[icon:bolt.primary]] Method 1: Package Managers (Recommended)

The easiest way to install and maintain RClone Manager is via a package manager. This handles updates automatically. All package managers are official.

### Winget

```powershell
winget install RClone-Manager.rclone-manager
```

### Chocolatey

```powershell
choco install rclone-manager
```

### Scoop

```powershell
scoop bucket add extras
scoop install rclone-manager
```

---

## [[icon:download.primary]] Method 2: Manual Download

If you prefer a standard installer or a portable version without installation.

### 1. Download the Installer

Visit our **[GitHub Releases](https://github.com/Zarestia-Dev/rclone-manager/releases)** and download the appropriate file:

- **Installer (.msi or .exe):** Recommended for most users.
- **Portable (.zip):** Standalone version for x64 or aarch64.
  - `RClone.Manager_{version}_x86_64_windows_portable.zip`
  - `RClone.Manager_{version}_aarch64_windows_portable.zip`

### 2. Run the Application

- **Installer:** Double-click the `.msi` or `.exe` file to begin the installation.
- **Portable:** Extract the `.zip` archive to a folder of your choice and run `RCloneManager.exe`.

> [!WARNING]
> **Microsoft SmartScreen**  
> Because this is an open-source application, you might see a "Windows protected your PC" popup. Click **More info** and then **Run anyway** to proceed.

---

## [[icon:settings_suggest.primary]] System Requirements

To enable core features like **Mounting Cloud Storage** (viewing files as a local `Z:` drive), your system requires the following:

### **WinFsp**

The "Mount" feature requires the **WinFsp** filesystem driver. RClone Manager is designed to handle this seamlessly:

- **Automatic Detection:** The app will scan for WinFsp on first launch.
- **Guided Setup:** If missing, the setup wizard will offer to install it for you.
- **Auto-Repair:** The app will detect if WinFsp is removed and help you reinstall it via a **Repair Sheet**.

---

## [[icon:build.warn]] Troubleshooting

If you encounter issues during installation or setup on Windows:

### **Application fails to start**

Ensure you have the [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) installed. It is typically pre-installed on Windows 10 and 11, but may be missing on some versions.

### **Mounts not showing up**

Check if the drive letter you are trying to use is already occupied by a USB drive or network mapping.

> [!TIP]
> **Antivirus False Positives**  
> Some antivirus software may flag the app due to its open-source nature. Adding an exclusion for the installation folder can resolve these issues.

> [[icon:open_in_new.accent]] **Detailed Guide:** For more advanced solutions and technical help, please visit our **[Windows Troubleshooting Guide](../support/troubleshooting-windows.md)**.

---

## [[icon:contact_support.primary]] Support & Resources

- [[icon:code.accent]] **Source Code:** [github.com/Zarestia-Dev/rclone-manager](https://github.com/Zarestia-Dev/rclone-manager)
- [[icon:help.primary]] **Issue Tracker:** [Report a bug](https://github.com/Zarestia-Dev/rclone-manager/issues)
- [[icon:update.success]] **Stay Updated:** Follow the repository to get notified of new releases.
