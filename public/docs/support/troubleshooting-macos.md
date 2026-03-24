# Troubleshooting - macOS [[icon:build.primary]]

This guide provides solutions for common technical challenges encountered by **RClone Manager** users on macOS.

---

## [[icon:report_problem.warn]] Common Issues

### "App is damaged and can't be opened"
This is the most frequent issue on macOS, caused by Apple's Gatekeeper security system flagging unsigned open-source applications.

#### **Why this happens:**
RClone Manager is a community-driven, open-source project. To maintain its free and open-source status, we do not participate in Apple's paid Developer Program, which is required for official "notarization".

#### **Solution:**
Remove the quarantine attribute manually using the Terminal. This safely tells macOS that you trust the application.

```bash
# Clear the quarantine bit for the application
xattr -rd com.apple.quarantine "/Applications/RClone Manager.app"
```

---

### macFUSE & Mounting Issues [[icon:settings_suggest.primary]]
If the **Mount** features are unavailable or fail to activate, it is typically related to system extension permissions.

- **Check Driver:** Ensure you have the latest version of [macFUSE](https://osxfuse.github.io/) installed.
- **Privacy & Security:** Go to **System Settings > Privacy & Security**. Scroll down to find the "Security" section. If you see a message about "System software from developer 'Benjamin Fleischer' was blocked", click **Allow**.
- **Kernel Extensions:** On Apple Silicon Macs, you may need to enable "Reduced Security" in Recovery Mode to allow third-party kernel extensions if macFUSE requires it (refer to macFUSE documentation for the latest macOS versions).

---

## [[icon:bug_report.accent]] Reporting Issues

When submitting a bug report to our [GitHub Issues](https://github.com/Zarestia-Dev/rclone-manager/issues), providing technical context helps us resolve it faster.

### Technical Context Checklist:
1.  **macOS Version:** Run `sw_vers` in terminal.
2.  **Architecture:** Run `uname -m` (x86_64 for Intel, arm64 for Apple Silicon).
3.  **Installation Method:** (e.g., Homebrew Cask vs. DMG Download).
4.  **RClone Version:** The version of the rclone binary you are using.

---

## [[icon:rocket_launch.primary]] Future Roadmap

- **Enhanced Automation:** We are continuously improving the Homebrew tap and automated build processes to reduce installation Friction.
- **Security Research:** We are exploring community-driven ways to bridge the gap with macOS security requirements without compromising our open-source values.

---

## [[icon:info.primary]] Additional Resources

- [[icon:terminal.primary]] **[Installation Guide](Installation-macOS)** - Detailed setup instructions.
- [[icon:help.primary]] **[Discussions](https://github.com/Zarestia-Dev/rclone-manager/discussions)** - Community-powered support.
- [[icon:code.accent]] **[Source Code](https://github.com/Zarestia-Dev/rclone-manager)** - Inspect or build from source.