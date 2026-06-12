# Filters & File Monitoring (Smart Automation)

Synchronizing everything in a folder can be inefficient, noisy, and unnecessary. Sometimes you want to ignore build artifacts, temporary lockfiles, or files that are too large. RClone Manager provides **Filter Profiles** and **Real-time File Monitoring (File Watcher)** to help you control exactly what gets transferred, and automate syncs seamlessly.

Even better, they work together: the file watcher dynamically evaluates your filter rules in real-time, preventing unnecessary sync operations when ignored files are modified.

---

## [[icon:filter_alt.primary]] Filter Profiles

Filter Profiles let you fine-tune which files and directories are included or excluded from a task. They can be attached to any sync, copy, move, or mount operation.

### 1. Patterns and Rules

RClone Manager supports the full range of rclone glob matching syntax. Patterns can be case-sensitive or case-insensitive:

*   **`Exclude Rule`**: Excludes paths matching this pattern (e.g., `*.tmp`, `node_modules/**`).
*   **`Include Rule`**: Only includes paths matching this pattern.
*   **`Filter Rule`**: Defines custom filter rules using prefix symbols (e.g., `+ *.txt` to include, `- *` to exclude).
*   **`Exclude File`**: Specify a filename (like `.rcloneignore`). Any directory containing this file (or files matching the name pattern) will be excluded.

> [!NOTE]
> Glob rules matching folder structures should end with a slash or wildcard (e.g., `temp/` or `temp/**`). A rule starting with `/` matches only at the root of the source directory.

### 2. File Lists and Sources

If you have a large list of patterns or specific files to transfer, you can specify them using file-based inputs:

*   **`Exclude From` / `Include From` / `Filter From`**: Load exclusion/inclusion/filter rules from a local text file.
*   **`Files From` / `Files From Raw`**: Load a precise list of files to transfer from a text file, ignoring all other files.

### 3. File Size & Age Constraints

Instead of patterns, you can filter files by their physical metadata:

*   **`Min Size` / `Max Size`**: Restrict transfers based on size. Suffixes are fully supported:
    *   `100` ➔ 100 Bytes
    *   `10k` ➔ 10 Kilobytes (KiB)
    *   `1.5M` ➔ 1.5 Megabytes (MiB)
    *   `1G` ➔ 1 Gigabyte (GiB)
*   **`Min Age` / `Max Age`**: Filter files based on their last-modified time relative to the current time:
    *   `30s` ➔ 30 seconds
    *   `5m` ➔ 5 minutes
    *   `2h` ➔ 2 hours
    *   `3d` ➔ 3 days
    *   `1w` ➔ 1 week
*   **`Max Depth`**: Restrict directory recursion depth (e.g. set to `1` to only copy files in the root folder without entering subdirectories).

---

## [[icon:visibility.primary]] Real-time File Monitoring

Real-time File Monitoring watches local directories for file additions, modifications, or deletions, and triggers a sync job automatically.

*   **Local paths only**: The file watcher can only monitor directories on the local filesystem — remote cloud paths are never watched, regardless of how many paths your automation has configured. How this applies per operation type:
    *   **Sync, Copy, Move**: All source paths are watched, but only the ones that are local. Remote source paths are silently skipped. The automation requires at least one local source path to enable watching.
    *   **Bisync**: Both source and destination paths are watched, again filtering to local paths only. Either side (or both) can be local — any local path found across both sides will be monitored.
*   **Debounce Delay**: When you edit files, editors often save them using quick, multiple write operations. The **Debounce Delay** (configured in seconds) tells the app to wait until the filesystem has quieted down before launching the sync run, avoiding back-to-back runs.

### Net-Change Tracking

Within each debounce window, the file watcher tracks the **net effect** of all filesystem events rather than reacting to each one individually. The key rule is:

> If a file is **created and then deleted** within the same debounce window, those two events cancel each other out — no sync is triggered.

This elegantly handles the way most editors, compilers, and tools save files. For example:

| Tool behaviour | What the watcher sees | Result |
| :--- | :--- | :--- |
| Editor writes a swap file, then deletes it | Create `file.swp` → Remove `file.swp` | Net zero — ignored |
| Atomic save (write temp, rename to target) | Create `file.tmp` → Remove `file.tmp`, Create `file.txt` | `file.tmp` cancels out; `file.txt` triggers |
| Normal file edit | Modify `file.txt` | Triggers |
| File deleted by user | Remove `file.txt` (pre-existing) | Triggers |

This means common temporary patterns — editor swap files, partial download files, compiler intermediates — are suppressed automatically, without needing explicit exclude rules for every possible temp file name.

---

## [[icon:settings_input_component.primary]] Watcher & Filter Integration

The file watcher and filter profiles are fully integrated. When filesystem events arrive, RClone Manager performs the following steps **before** starting a sync:

1.  **Net-Change Accumulation**: Incoming events are accumulated within the debounce window. Create/delete pairs on the same path cancel each other out. Only paths with a net real change (a file that was modified, newly created and kept, or deleted without being recreated) are carried forward.
2.  **Filter Evaluation**: Each remaining path is translated to a path relative to your source directory and matched against the attached Filter Profile:
    *   It checks glob exclusions (`ExcludeRule`, `ExcludeFrom`, etc.).
    *   It inspects file size limits (`MinSize`, `MaxSize`).
    *   It inspects file modification age limits (`MinAge`, `MaxAge`).
    *   It checks the folder depth against `MaxDepth`.
3.  **Smart Ignorance**: If the net-change set is empty (all events cancelled out or all remaining paths match your exclusions), the debounce timer is not started and no sync is triggered.
4.  **Execution**: Once the debounce timer expires and at least one changed path is not filtered out, the sync run is launched.

---

## [[icon:rocket_launch.primary]] Common Filtering Recipes

Here are some helpful filtering setups you can use to optimize your real-time syncs:

### 1. The Developer's Exclusion
Prevent heavy build artifacts and dependency folders from triggering syncs:
*   **Exclude Rules:**
    *   `node_modules/**`
    *   `target/**`
    *   `.git/**`
    *   `dist/**`

### 2. Ignore OS Junk and Office Files
Avoid syncing hidden OS metadata and Microsoft Office temporary lock files. Note that most editor temp files (swap files, partial writes) are already suppressed by the net-change tracker — these rules cover files that may persist on disk:
*   **Exclude Rules:**
    *   `.DS_Store`
    *   `Thumbs.db`
    *   `~$*` (Microsoft Office open-file locks)
    *   `*.tmp`

### 3. Media Only Sync
Only sync audio/video files and ignore document formats:
*   **Include Rules:**
    *   `*.mp3`
    *   `*.mp4`
    *   `*.mkv`
    *   `*.wav`

### 4. Small Files Only (Fast Sync)
Prevent large files from clogging your bandwidth during real-time sync:
*   **Max Size:** `50M` (Only sync files smaller than 50 Megabytes)

---

## [[icon:list.primary]] Supported Rclone RC Filter Keys

The table below lists all Rclone RC filter configuration keys that are supported and processed by RClone Manager's real-time file watcher:

| Key (PascalCase) | Rclone Option | Type | Description | Watcher Support |
| :--- | :--- | :--- | :--- | :--- |
| `ExcludeRule` | `--exclude` | Array / String | Excludes files and directories matching the pattern(s). | **Yes**, matched against modified paths. |
| `ExcludeFile` | `--exclude-from` | Array / String | Excludes files and directories matching the pattern(s). | **Yes**, matched against modified paths. |
| `ExcludeFrom` | `--exclude-from` | Array / String | Path to file(s) containing exclusion patterns. | **Yes**, reads the file and matches rules. |
| `IncludeRule` | `--include` | Array / String | Only includes files and directories matching the pattern(s). | **Yes**, matched against modified paths. |
| `IncludeFrom` | `--include-from` | Array / String | Path to file(s) containing inclusion patterns. | **Yes**, reads the file and matches rules. |
| `FilterRule` | `--filter` | Array / String | Custom filter rules prefixed with `+` (include) or `-` (exclude). | **Yes**, evaluated in order. |
| `FilterFrom` | `--filter-from` | Array / String | Path to file(s) containing custom filter rules. | **Yes**, evaluated in order. |
| `FilesFrom` | `--files-from` | Array / String | Limits operations to files specified in the file(s). | **Yes**, only allows files from the list. |
| `FilesFromRaw` | `--files-from-raw` | Array / String | Similar to `FilesFrom` but preserves trailing whitespace. | **Yes**, matches file list as-is. |
| `MinSize` | `--min-size` | String / Integer | Restricts transfers to files equal to or larger than this size. | **Yes**, files smaller are ignored. |
| `MaxSize` | `--max-size` | String / Integer | Restricts transfers to files equal to or smaller than this size. | **Yes**, files larger are ignored. |
| `MinAge` | `--min-age` | String | Restricts transfers to files older than the specified duration. | **Yes**, checks file modification time. |
| `MaxAge` | `--max-age` | String | Restricts transfers to files younger than the specified duration. | **Yes**, checks file modification time. |
| `MaxDepth` | `--max-depth` | Integer | Limits directory recursion depth. | **Yes**, limits watched subfolder depth. |
| `IgnoreCase` | `--ignore-case` | Boolean | Enables case-insensitive pattern matching. | **Yes**, overrides case-sensitivity. |

---

### Related Documentation

- [Remote Management](remote-management.md)
- [Dynamic Paths & Macros](dynamic-paths.md)
- [Mounting Drives](mounting.md)