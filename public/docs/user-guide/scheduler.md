# [[icon:schedule.primary]] Scheduler & Automations

Any sync or transfer profile (see [Sync & Transfer Jobs](sync-and-transfer.md)) can run by itself. RClone Manager calls a profile that runs on its own an **automation**. There are three triggers, and a profile can use any combination of them:

| Trigger                       | Runs the profile                                            |
| :---------------------------- | :---------------------------------------------------------- |
| **Auto-start on startup**     | Once, when RClone Manager starts (after an optional delay). |
| **Scheduled (cron)**          | On a recurring timetable.                                   |
| **Real-time file monitoring** | When files change in a local source folder.                 |

All three are set in the profile's operation step of the remote configuration (for example the **Sync** step), below the paths.

> [!IMPORTANT]
> Automations run inside RClone Manager, so the app must be running: the desktop app (closing the window keeps it running in the system tray) or the headless web server. Nothing runs while the app is closed.

---

## [[icon:power_settings_new.primary]] Auto-start on Startup

Turn on **Enable Auto-{Operation} on Startup** (for example _Enable Auto-Sync on Startup_) to run the profile each time the app starts.

Use **Startup Delay** to wait before it launches. This helps when the network, a VPN or another mount is not ready the moment the app starts.

---

## [[icon:event_repeat.primary]] Scheduled Runs (Cron)

Turn on **Enable Scheduled {Operation}** and choose when it runs:

- **Simple**: pick a common schedule (every day, every week, every month or every few hours) and the time. Presets include _Daily at 9 AM_, _Weekdays at 9 AM_, _Weekly on Monday_, _Every 6 hours_ and _First of month_.
- **Advanced**: build each cron field with the **Field Builder**, or type the whole expression.

The **Your Schedule** box shows the schedule in words and the **Next run** time, so you can check it before saving.

Schedules use standard **5-field cron** (minute, hour, day of month, month, day of week). A 6-field expression with seconds is rejected.

| Expression     | Runs                     |
| :------------- | :----------------------- |
| `0 2 * * *`    | Every day at 02:00       |
| `*/30 * * * *` | Every 30 minutes         |
| `0 9 * * 1-5`  | Weekdays at 09:00        |
| `0 3 * * 0`    | Sundays at 03:00         |
| `0 0 1 * *`    | First day of every month |

Times are in your **local timezone**; the app converts them to UTC internally.

---

## [[icon:visibility.primary]] Real-time File Monitoring

Turn on **Enable Real-time File Monitoring** to run the profile when files in a local source folder change.

- **Debounce delay (seconds)**: how long to wait after the last change before running (5 seconds by default). `0` runs immediately; 3 to 5 seconds is better for large files or many edits, so writes can finish first.
- **Sync only changed subdirectories**: when the watcher triggers, only the subdirectories that contain changed files are synced, instead of the whole tree.

Things to know:

- At least one source must be a **local folder** (for **Bisync**, either path). Changes on remote paths do not trigger a run; with mixed sources, only the local ones are watched.
- The watcher respects the profile's **Filter Profile**: changes to excluded files do not trigger a run.
- If a watched folder does not exist yet, the watcher waits for it to appear.

For more about watching folders, see [Filters & File Monitoring](filters-and-monitoring.md).

---

## [[icon:monitor_heart.primary]] Managing Automations

Saving a profile with any trigger creates an automation. You can see and control it in several places:

- **Operations tab**: the profile shows badges for its schedule and watcher, with the **Next Run** time and a button to **Enable automation** or **Disable automation**. Disabling while a run is in progress stops it after that run finishes.
- **General tab** of the remote: an **Automations** panel with a card for each of that remote's automations.
- **General overview** (no remote selected): an **Automations** panel with every automation (remote profiles, Quick Runs and workflows), which you can filter by origin.

Each automation card shows the schedule and cron expression or the watcher settings, the paths, the last and next run, run statistics (total, successful, failed, stopped) and the last error, with **Run now** and **Stop current run** buttons. Starts, completions, failures and stops can send notifications; see [Alerts & Notifications](alerts-and-notifications.md).

> [!NOTE]
> **Backends**: a remote profile's automation belongs to the backend it was created on (for example _Local_ or a _NAS_ backend in the Backend Manager) and only runs while that backend is the active one. Schedules from [Quick Runs](quick-runs.md) and [Visual Workflows](workflows.md) are global and follow whichever backend is active.

---

## [[icon:account_tree.primary]] When to Use a Workflow Instead

A profile automation runs one operation. If you need several steps (for example _sync, then check, then notify_, or _run only if the previous job succeeded_), use a [Visual Workflow](workflows.md) with a **Cron Schedule** or **Folder Watcher** trigger.

---

### Related Documentation

- [Sync & Transfer Jobs](sync-and-transfer.md)
- [Filters & File Monitoring](filters-and-monitoring.md)
- [Visual Workflows](workflows.md)
- [Quick Runs](quick-runs.md)
- [Alerts & Notifications](alerts-and-notifications.md)
- [Power Management & Safety](power-management.md)
