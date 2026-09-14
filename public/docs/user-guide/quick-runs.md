# [[icon:bolt.primary]] Quick Runs

**Quick Runs** provides a streamlined workspace in the **Flow** section for creating, organizing, and triggering one-click cloud operations.

While automated schedules and visual workflows handle repetitive or multi-step tasks, Quick Runs gives you an interactive command center for ad-hoc file transfers, directory synchronizations, drive mounts, and network servers that you need to run on demand.

---

## [[icon:dashboard.primary]] The Quick Runs Workspace

<p align="center">
  <img src="../assets/quick-runs.png" alt="Quick Runs Workspace" />
</p>

The Quick Runs interface presents your saved tasks as responsive, status-aware cards organized in an ergonomic grid:

- **Instant Execution:** Click the prominent **Play (Start)** button on any card to run the operation immediately.
- **Real-Time Status Badges:** Cards update live to show current execution state (`Running`, `Idle`, `Success`, `Error`), elapsed execution time, and transfer speed.
- **Priority Sorting:** Running operations automatically float to the top of the grid, ensuring you never lose track of active workloads.
- **Category & Tag Filtering:** Tag your quick runs with labels (e.g., `backup`, `media`, `cloud-sync`, `staging`) and use the search bar to filter cards instantly.
- **Card Actions:** Each card features a context menu with options to **Edit**, **Duplicate**, **Export**, **View Logs**, or **Delete**.

---

## [[icon:add_circle.primary]] Creating a Quick Run

To create a new task, click the **"+ New Quick Run"** button in the workspace toolbar.

### 1. Basic Details

- **Name:** A descriptive title for your task (e.g., _Sync Documents to OneDrive_ or _Serve Photos WebDAV_).
- **Operation Type:** Choose the core action:
  - **Sync:** Replicates source files to destination, removing files on destination that no longer exist on source.
  - **Copy:** Transfers new or modified files without deleting destination contents.
  - **Move:** Moves files to destination and deletes the originals once verified.
  - **Bisync:** Performs bidirectional sync with conflict detection.
  - **Check:** Validates hashes and file sizes between source and target without modifying data.
  - **Mount:** Mounts a remote directory locally as a disk drive.
  - **Serve:** Starts a network server (WebDAV, SFTP, HTTP, FTP).
  - **Script:** Executes a local script or shell command.

### 2. Remotes & Paths

- **Source Remote & Path:** Select your source cloud remote from the dropdown and use the folder picker or enter a path.
- **Destination Remote & Path:** Select your target storage provider and path.
- **Dynamic Path Macros:** Full support for system and timestamp interpolation in path strings using shell syntax (e.g., `Backups/$(date)` or `Archives/$(hostname)/$(user)`). See the canonical guide: **[Dynamic Paths & Macros](dynamic-paths.md)**.

### 3. Advanced Flags & Transfer Tuning

Fine-tune Rclone parameters directly within the editor or load pre-optimized values via **[Template Management](template-management.md)**:

- **Bandwidth Limits:** Set per-job transfer throttles (e.g., `--bwlimit 10M`).
- **Transfers & Checkers:** Adjust concurrency (e.g., `--transfers 8 --checkers 16`).
- **Dry Run:** Test execution without making changes (`--dry-run`).
- **Filter Rules:** Define include/exclude patterns (e.g., `--exclude "*.tmp"`). For pattern syntax and rules, see **[Filters & File Monitoring](filters-and-monitoring.md)**.
- **Custom CLI Arguments:** Inject arbitrary Rclone CLI flags without restrictions.

---

## [[icon:visibility.primary]] Live Monitoring & Output Logs

When a Quick Run executes:

1. The card displays an animated progress spinner, transfer throughput (e.g., `45.2 MB/s`), and running elapsed timer.
2. Clicking **"View Output"** opens a live terminal log stream displaying Rclone standard output, transfer statistics, and error traces.
3. You can click the **Stop / Cancel** button on the card at any moment to gracefully terminate the operation.

---

## [[icon:account_tree.primary]] Integration with Workflows

Every Quick Run you create is automatically registered as a reusable component in the visual **[Workflow Canvas](workflows.md)**:

- Drag a **Quick Run Task Node** onto your workflow canvas.
- Select your saved Quick Run preset from the node inspector.
- Chain it with automated triggers (such as Cron Schedules or Folder Watchers) and alert notifications.

---

## [[icon:file_copy.primary]] Duplication & Preset Sharing

- **Duplication:** Need a similar sync for a different folder? Click the three-dot menu on any card and select **Duplicate**. All remotes, flags, and options will be cloned into a new card ready for minor adjustments.
- **Exporting:** Quick Runs can be exported as standalone JSON presets or backed up through the application's central **Export Settings** modal.

---

### Related Documentation

- [Visual Workflows](workflows.md)
- [Template Management](template-management.md)
- [Dynamic Paths & Macros](dynamic-paths.md)
- [Filters & File Monitoring](filters-and-monitoring.md)
