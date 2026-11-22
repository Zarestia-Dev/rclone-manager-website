# [[icon:sync.primary]] Sync & Transfer Jobs

The **Operations** tab of a remote is where you run file transfers against it: Sync, Copy, Move and Bisync, plus Check, Crypt Check, Delete, Copy URL and Archive. Each operation is saved as one or more **profiles**, so a remote can carry several ready-to-run jobs (for example _Photos backup_ and _Documents mirror_) that you start with one click, on a schedule or when local files change.

---

## [[icon:compare_arrows.primary]] Choosing an Operation

| Operation       | What it does                                                                                             |
| :-------------- | :------------------------------------------------------------------------------------------------------- |
| **Sync**        | Makes the destination identical to the source. Files that exist only on the destination are **deleted**. |
| **Copy**        | Copies new and changed files to the destination. Nothing on the destination is deleted.                  |
| **Move**        | Copies files to the destination, then deletes them from the source.                                      |
| **Bisync**      | Two-way sync between two paths: changes on either side are applied to the other.                         |
| **Check**       | Compares source and destination (sizes and hashes) without changing anything.                            |
| **Crypt Check** | Like Check, for a `crypt` remote against its unencrypted source.                                         |
| **Delete**      | Deletes the files in a path (respecting your filters).                                                   |
| **Copy URL**    | Downloads one or more URLs straight into the remote.                                                     |
| **Archive**     | Creates an archive of a path.                                                                            |

> [!WARNING]
> **Sync and Move remove files.** If you are not sure, start with **Copy**, or run the profile once with the **Dry Run** option enabled and review the File Report first.

> [!NOTE]
> A **Bisync** profile needs one initial run with **Resync** enabled, so rclone can record the starting state of both paths. Turn Resync off again after that first run. See the [rclone bisync documentation](https://rclone.org/bisync/) for details.

---

## [[icon:tune.primary]] Creating a Profile

1. Select the remote in the sidebar and open the **Operations** tab.
2. Pick the operation in **Operation Mode**.
3. Use **Add Profile** (or edit the existing **Default** profile). The remote configuration opens on that operation's step.
4. Fill in the paths:
   - **Source Paths**: one or more folders. Use **Add Source** for more than one; with several sources, rclone checks each of them against the destination.
   - **Destination Path**: a path on this remote, a local folder, or a path on one of your **Other Remotes**.
   - Paths support [Dynamic Paths & Macros](dynamic-paths.md), such as `Backups/$(date)`.
5. Adjust the rclone options if needed (transfers, checkers, Dry Run, and so on), and optionally link the shared **Filter**, **Backend** or **Runtime Remote** profiles under **Advanced Profiles** (see [Filters & File Monitoring](filters-and-monitoring.md) and [Template Management](template-management.md)).
6. Optionally set when the profile runs on its own: on startup, on a schedule or when local files change. See [Scheduler & Automations](scheduler.md).
7. Save. The profile appears in the **Profiles** list of the Operations tab.

Profiles can be renamed, duplicated and deleted from the same profile menu. A profile that is in use by a running job cannot be deleted until the job stops.

---

## [[icon:play_circle.primary]] Running and Monitoring a Job

- Select a profile under **Selected Profile** and click **Start** (for example **Start Sync**). Click **Stop** to cancel it.
- Progress shows in the transfer activity panel: **Active** transfers, **Recent** files, a **File Report** (Missing on destination, Differ, Missing on source, Match, Errors) and **Conflicts** for bisync.
- Up to three operations can be pinned as **Quick Actions** (by default Mount, Sync and Bisync). They appear at the top of the remote details page and in the system tray menu, so you can start them without opening the Operations tab. See [Remote Management](remote-management.md).
- Finished, failed and stopped jobs can raise notifications and alerts; see [Alerts & Notifications](alerts-and-notifications.md).

---

## [[icon:hub.primary]] Profiles, Quick Runs and Workflows

All three can run the same rclone operations. Pick by what you need:

| Use                                                              | Best fit                             |
| :--------------------------------------------------------------- | :----------------------------------- |
| A job that belongs to one remote, run on demand or on a schedule | **Remote profile** (this page)       |
| A one-click task that is not tied to a remote card               | **[Quick Runs](quick-runs.md)**      |
| Several steps chained together with conditions                   | **[Visual Workflows](workflows.md)** |

---

### Related Documentation

- [Scheduler & Automations](scheduler.md)
- [Remote Management](remote-management.md)
- [Filters & File Monitoring](filters-and-monitoring.md)
- [Dynamic Paths & Macros](dynamic-paths.md)
- [Quick Runs](quick-runs.md)
- [Visual Workflows](workflows.md)
