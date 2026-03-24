# Troubleshooting - Windows [[icon:build.primary]]

This guide provides solutions for common technical challenges encountered by **RClone Manager** users on Windows systems.

---

## [[icon:report_problem.warn]] Common Issues

### "Windows protected your PC" (SmartScreen)
Because RClone Manager is an open-source project and not signed with an expensive Microsoft-trusted certificate, Windows SmartScreen may flag the installer.

- **Solution:** Click **"More info"** on the popup, then click **"Run anyway"**. The application is safe and the source code is fully available for inspection on GitHub.

### WebView2 Runtime Not Found
RClone Manager is built on the Tauri framework, which requires the **Microsoft Edge WebView2 Runtime** to display the user interface.

- **Solution:** Typically, this is pre-installed on Windows 10 and 11. If it's missing, download and install it from the official **[Microsoft Developer Website](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)**.

---

## [[icon:settings_suggest.primary]] WinFsp & Mounting Issues

If the **Mount** features are unavailable or fail to activate, it is typically related to the WinFsp driver.

### **Driver Missing or Corrupted**
RClone Manager requires the WinFsp driver to map cloud remotes as local drives (e.g., `Z:`).
- **Solution:** Most users can fix this by clicking **"Repair"** when the app detects the missing driver. If it still fails, download it manually from **[winfsp.dev](https://winfsp.dev/)**.

### **Drive Letter Conflict**
If a mount succeeds but you cannot find the drive in File Explorer, the drive letter might be in use.
- **Solution:** Check your **Disk Management** console to see if the chosen letter (like `Z:`) is already assigned to a network share or USB device.

---

## [[icon:security.primary]] Antivirus & Security Software

Some antivirus programs (like Bitdefender or Norton) may block the app's network activity or its ability to interact with the file system.

- **False Positives:** If the app is suddenly quarantined, add an **Exclusion** for the RClone Manager installation directory (usually `%LOCALAPPDATA%\rclone-manager`).
- **Network Block:** Ensure `rclone.exe` (bundled in the app's data folder) is allowed through your Windows Firewall.

---

## [[icon:bug_report.accent]] Reporting Issues

When submitting a bug report to our [GitHub Issues](https://github.com/Zarestia-Dev/rclone-manager/issues), providing technical context helps us resolve it faster.

### Technical Context Checklist:
1.  **Windows Version:** (e.g., Windows 11 23H2).
2.  **Architecture:** (x64 or ARM64).
3.  **Installation Method:** (Winget, Chocolatey, or MSI).
4.  **Error Logs:** Found in `%LOCALAPPDATA%\rclone-manager\logs`.

---

## [[icon:info.primary]] Additional Resources

- [[icon:terminal.primary]] **[Installation Guide](Installation-Windows)** - Detailed setup instructions.
- [[icon:help.primary]] **[Discussions](https://github.com/Zarestia-Dev/rclone-manager/discussions)** - Community-powered support.
- [[icon:code.accent]] **[Source Code](https://github.com/Zarestia-Dev/rclone-manager)** - Inspect or build from source.
