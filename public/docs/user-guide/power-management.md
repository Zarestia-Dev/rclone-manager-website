# [[icon:power_settings_new.primary]] Power Management, Sleep Prevention & Safety

RClone Manager includes enterprise-grade OS-level power controls, automatic sleep prevention assertions, and configuration safety mechanisms designed to safeguard long-running cloud transfers and prevent data corruption during unexpected system power events. Hold the `About RClone Manager`.

---

<p align="center">
  <img src="../assets/power-management.png" alt="Power Management Modal" />
</p>

---

## [[icon:security.primary]] OS Power Inhibitor (Sleep & Shutdown Intercept)

When file transfers (Sync, Copy, Move, Bisync) or active FUSE mounts are running, RClone Manager automatically registers an OS-level power assertion to prevent the host operating system from suspending or sleeping mid-operation:

### Platform-Specific Implementations

- **Linux (`systemd-logind`)**:
  - Holds an unprivileged D-Bus idle inhibitor lock (`Inhibit("idle", "RClone Manager", reason, "block")`).
  - Automatically suppresses system idle timers while permitting intentional manual sleep and laptop lid closure without requiring Polkit escalation.
  - Subscribes to `logind`'s `PrepareForShutdown` D-Bus signal to cleanly unmount FUSE mount points and terminate active transfer jobs before system power-off, resolving black-screen shutdown hangs on modern desktop environments (such as KDE Plasma 6 and GNOME).
- **Windows (`kernel32.dll` & `user32.dll`)**:
  - Invokes `SetThreadExecutionState(ES_SYSTEM_REQUIRED | ES_AWAYMODE_REQUIRED | ES_CONTINUOUS)` to prevent system sleep and display timeout during active operations.
  - Registers `ShutdownBlockReasonCreate` with a descriptive reason so Windows presents its native confirmation overlay if a shutdown or restart is attempted mid-transfer.
- **macOS (`NSProcessInfo`)**:
  - Holds an `NSActivityOptions` assertion (`NSActivityIdleSystemSleepDisabled | NSActivityUserInitiated`) to keep the network subsystem and disk active during backups.

Assertions are dynamically released the moment all running jobs complete or are stopped.

---

## [[icon:terminal.primary]] Verifying Active Inhibitors via Terminal

You can confirm that RClone Manager is actively protecting your system using native OS command-line tools:

| Operating System | Terminal Command         | What to Look For                                                      |
| :--------------- | :----------------------- | :-------------------------------------------------------------------- |
| **Linux**        | `systemd-inhibit --list` | Look for `RClone Manager` with `idle` in the `WHAT` column.           |
| **Windows**      | `powercfg /requests`     | Run Command Prompt as Administrator; inspect `SYSTEM` or `EXECUTION`. |
| **macOS**        | `pmset -g assertions`    | Look under `PreventUserIdleSystemSleep` for `rclone-manager`.         |

---

## [[icon:bolt.primary]] Fast Actions & Engine Lifecycle

The **Power & Fast Actions** dialog (accessible from the title bar menu) provides rapid control over the core engine and system power:

### 1. Engine & Connectivity Controls

- **Restart Rclone Engine:** Restarts the underlying `librclone` process or daemon if remote connections become unresponsive.
- **Reload Remotes Cache:** Re-queries the configuration backend and updates directory structures in memory.
- **Kill All Running Jobs:** Instantly sends cancellation signals across all active transfer workers and queues.

### 2. Post-Job System Power Actions

Automate power operations upon completing long-running backup pipelines (also available as nodes in [Visual Workflows](workflows.md)):

- **Suspend / Sleep:** Puts the computer into low-power sleep mode once transfers finish.
- **Screen Lock:** Locks the user session to secure unattended workstations.
- **System Shutdown:** Performs a clean, graceful system shutdown when scheduled tasks conclude.

---

### Related Documentation

- [Keyboard Shortcuts](keyboard-shortcuts.md)
- [Visual Workflows](workflows.md)
- [Template Management](template-management.md)
- [Troubleshooting](../support/troubleshooting.md)
