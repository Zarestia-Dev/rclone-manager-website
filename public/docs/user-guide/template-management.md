# [[icon:tune.primary]] Template Management

RClone Manager features a unified **Template Management** system that decouples configuration from individual remotes. Instead of manually retyping complex flags for every cloud storage mount or Quick Run task, you can capture, manage, and apply reusable configuration profiles across your entire environment.

The system combines **Built-in Recommended Presets** (optimized for specific cloud protocols and host operating systems) with **Custom User Templates** backed by a visual inspector and CodeMirror JSON editor.

---

## Architecture & Supported Categories

A template in RClone Manager is a structured, multi-category configuration payload (`UserPresetTemplate`) persisted securely through the `rcman` settings engine.

Each template can contain flags spanning across any of the following categories:

| Category       | Description                                                       | Common Parameters                                                                                 |
| :------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| **`vfs`**      | Virtual File System caching, read-ahead, and write buffers.       | `vfs_cache_mode`, `vfs_cache_max_size`, `vfs_read_chunk_streams`, `vfs_write_back`, `vfs_refresh` |
| **`mount`**    | Host filesystem mounting, OS integration, and attribute timeouts. | `network_mode`, `attr_timeout`, `noapplexattr`, `noappledouble`, `mountType`                      |
| **`backend`**  | Global Rclone engine runtime flags and memory ceilings.           | `buffer_size`, `max_buffer_memory`, `transfers`, `log_level`, `disable_http2`                     |
| **`remote`**   | Storage provider-specific connection and transfer overrides.      | `chunk_size`, `upload_concurrency`, `disable_checksum`, `nextcloud_chunk_size`                    |
| **Operations** | Operation-specific profiles for automated execution.              | `sync`, `copy`, `move`, `bisync`, `serve`, `filter`                                               |

---

## Preset & Template Bar

The **Preset & Template Bar** is embedded directly into the sidebar of both the **Remote Configuration Modal** and the **Quick Run Editor**.

```
┌────────────────────────────────────────────────────────┐
│  [Wrench Icon] Presets & Templates                     │
│  ├─ Apply Default Presets                              │
│  ├─ ──────────────────────────────                     │
│  ├─ Saved User Templates:                              │
│  │    ★ High-Throughput S3 Mount                       │
│  │    ★ Low-Memory WebDAV Streaming                    │
│  ├─ ──────────────────────────────                     │
│  ├─ Save Current Settings as Template...               │
│  └─ Manage Templates...                                │
└────────────────────────────────────────────────────────┘
```

From this menu, you can:

- **Apply Default Presets**: Immediately injects RClone Manager's recommended performance flags tailored for the current remote's storage type and your operating system.
- **Select a Saved Template**: Click any template from the list to instantly patch its values into your active configuration.
- **Save Current Settings as Template...**: Opens the Template Manager modal pre-populated with all currently modified options.
- **Manage Templates...**: Opens the management interface to inspect, edit, or delete existing templates.

---

## The Template Manager Modal

The Template Manager modal provides complete lifecycle management for your configuration templates, offering two distinct tabs: **New Template** and **Manage Templates**.

### 1. Creating a New Template (Save Mode)

When opened via **Save Current Settings as Template...** (or configured from scratch):

1. **Selective Key Checkboxes**: All options currently configured in your remote or profile are grouped by category with checkboxes. You can select all, deselect all, or hand-pick only the specific flags you want to include in the template.
2. **Category Counters**: Each category header displays a pill badge indicating how many keys are selected out of the total available (e.g. `9 / 12 selected`).
3. **Inline Key/Value Addition**: Use the inline input fields to quickly add arbitrary custom flags directly into any category without switching views.
4. **Search Filter**: Filter through dozens of configuration parameters in real time using the built-in search bar.

### 2. Managing Saved Templates (Manage Mode)

In the **Manage Templates** tab, you can select any existing template from the dropdown menu to:

- Rename the template or update its description.
- Modify values or remove individual keys from specific categories.
- Review changes with dirty-state detection (the **Save** button activates only when modifications are made).
- Permanently delete outdated templates.

### 3. Dual-View Editing: Visual vs JSON

Both tabs feature a view-mode toggle in the upper-right corner:

- **Visual Inspector (`tune`)**: An intuitive, accordion-based interface powered by Angular Material expansion panels and styled badges. Ideal for rapid flag toggling and visual audits.
- **JSON Editor (`code`)**: An integrated **CodeMirror 6** editor featuring:
  - Real-time syntax highlighting and JSON format validation.
  - Interactive syntax error linter (`jsonParseLinter`) with gutter indicators.
  - Bracket matching, active line highlighting, and tab-indentation support.
  - Direct copy/paste compatibility for sharing template snippets with team members or backup scripts.

```json
{
  "vfs": {
    "vfs_cache_mode": "full",
    "vfs_cache_max_size": "250G",
    "vfs_read_chunk_streams": 16,
    "vfs_write_back": "15s"
  },
  "backend": {
    "buffer_size": "64M",
    "transfers": 8,
    "disable_http2": true
  },
  "remote": {
    "chunk_size": "32M",
    "upload_concurrency": 8
  }
}
```

---

## Built-in Recommended Performance Presets

To bridge the gap between slow cloud API latency and fast, local filesystem access speeds, RClone Manager ships with an integrated preset resolution engine (`RemotePresetsService`).

Rather than relying on Rclone's conservative defaults (which stream files linearly over a single socket and trigger redundant cryptographic checks), RClone Manager resolves optimal parameters across three vectors:

1. **The Base Default Set** (applied universally to all remotes)
2. **The Remote Storage Family** (e.g., S3, B2, WebDAV, GCS)
3. **The Target Operating System** (Windows, macOS, Linux, Android)

> [!TIP]
> When creating a brand-new remote, RClone Manager automatically applies these recommended presets into the default profile. You can also re-apply them at any time using the **Apply Default Presets** button.

### 1. Universal Base Presets

Applied universally to all remotes to configure aggressive local disk caching, fast metadata responses, and network parallelization:

#### Virtual File System (VFS)

| Parameter                  | Value  | Rationale                                                                                                                          |
| :------------------------- | :----- | :--------------------------------------------------------------------------------------------------------------------------------- |
| `vfs_cache_mode`           | `full` | Buffers all read and write requests locally, enabling full random seek operations and unaligned database writes on virtual drives. |
| `vfs_cache_max_size`       | `250G` | Ceiling allocated for the local cache directory. Evicts cold data via Least Recently Used (LRU) logic.                             |
| `vfs_cache_max_age`        | `48h`  | Files not accessed within 48 hours are automatically purged from the local cache storage.                                          |
| `vfs_cache_min_free_space` | `10G`  | Ensures the host drive never runs out of disk space during heavy cache writes.                                                     |
| `vfs_write_back`           | `15s`  | Buffers application writes on local disk for 15 seconds before asynchronously starting the network upload.                         |
| `vfs_read_chunk_size`      | `16M`  | Segment chunk range requests used for streaming media and large files.                                                             |
| `vfs_read_chunk_streams`   | `8`    | Initiates 8 concurrent TCP download sockets for range requests, fully saturating high-bandwidth networks.                          |
| `vfs_read_ahead`           | `128M` | Aggressively pre-fetches data ahead of the current read pointer to avoid video buffering.                                          |
| `vfs_refresh`              | `true` | Recursively crawls and warms up directory metadata cache in the background upon mounting.                                          |

#### Mount Settings

| Parameter      | Value | Rationale                                                                                                                      |
| :------------- | :---- | :----------------------------------------------------------------------------------------------------------------------------- |
| `attr_timeout` | `10s` | Retains file attributes (permissions, timestamps, sizes) in the kernel cache for 10 seconds to eliminate redundant stat calls. |

#### Global Backend Settings

| Parameter           | Value  | Rationale                                                                                  |
| :------------------ | :----- | :----------------------------------------------------------------------------------------- |
| `buffer_size`       | `32M`  | Read-ahead buffer size allocated per open file to smooth out playback.                     |
| `max_buffer_memory` | `2G`   | Hard RAM ceiling allocated for read-ahead buffers to prevent Out-Of-Memory (OOM) failures. |
| `transfers`         | `8`    | Concurrency limit allowing 8 parallel file transfers simultaneously.                       |
| `log_level`         | `INFO` | Standard tracing verbosity, capturing cache evictions and backend statuses.                |

---

### 2. Storage Family Overrides

Different storage protocols present distinct bottlenecks. Family-specific presets are layered dynamically on top of the base defaults:

#### S3-Compatible & Object Storage (`s3`, `b2`, `gcs`)

- **`backend.disable_http2` (`true`)**: Disables HTTP/2 in favor of HTTP/1.1. This bypasses stream multiplexing queue constraints, permitting modern object storage backends (MinIO, Ceph, AWS) to process concurrent transfers across fully independent TCP sockets.
- **`backend.use_server_modtime` (`true`)**: Uses the remote server's modification timestamp rather than attempting costly client-side metadata patching.
- **`vfs.vfs_fast_fingerprint` (`true`)**: Skips slow cryptographic checksum calculations during validation, using file size and fast modtime comparison.

#### WebDAV Family (`webdav`, `nextcloud`, `owncloud`)

- **`vfs.vfs_write_back` (`20s`)**: Extends the write-back delay to 20 seconds. This intercepts temporary lock files generated by office suites (e.g. Microsoft Office, LibreOffice) and uploads only the final saved document.
- **Vendor Specific (`nextcloud`, `owncloud`)**:
  - `remote.nextcloud_chunk_size` (`64M`): Uses 64 MiB upload chunks tailored for Nextcloud server chunking endpoints.

---

### 3. Provider-Specific Remote Configs

Written directly into the remote's configuration section inside `rclone.conf`:

#### Amazon S3 & Google Cloud Storage

- **`disable_checksum` (`true`)**: Bypasses client-side MD5 metadata generation during multipart uploads, minimizing CPU overhead.
- **`upload_concurrency` (`8`)**: Allocates 8 parallel worker threads to upload multipart file parts.
- **`chunk_size` (`32M`)**: Partitions uploads into 32 MiB parts, significantly decreasing total HTTP transaction counts.

#### Backblaze B2

- **`disable_checksum` (`true`)**: Skips computing large file SHA1 sums before starting uploads.
- **`upload_concurrency` (`8`)**: Uploads 8 multipart parts concurrently.
- **`chunk_size` (`32M`)**: Multi-part upload chunk size.

---

### 4. Operating System (OS) Specific Overrides

RClone Manager adapts mount parameters to avoid host file manager locking and clutter:

#### Microsoft Windows

- **`mount.network_mode` (`true`)**: Mounts the drive as a WinFSP SMB Network Share (UNC path) instead of a fixed disk. This signals Windows Explorer to avoid generating recursive file icons and thumbnail caches that cause Explorer hanging.

#### Apple macOS

- **`mount.noapplexattr` (`true`)**: Instructs the FUSE layer to drop Finder metadata extended attributes (`com.apple.*`).
- **`mount.noappledouble` (`true`)**: Prevents Finder from creating `._*` AppleDouble resource fork clutter files on cloud remotes.

#### Android

- **`mount.mountType` (`"saf"`)**: Configures Storage Access Framework (SAF) integration.
- **Optimized Caching**: Allocates a conservative `50G` cache ceiling and `2G` min free space threshold tailored for mobile NAND flash storage.

---

## How Templates Are Applied

When you apply a template or default preset to a remote configuration, RClone Manager executes a non-destructive patch (`RemoteConfigStateService.applyTemplate`):

1. **Targeted Profile Patching**: Only the categories present in the template (`vfs`, `mount`, `backend`, `filter`, `sync`, `copy`, `move`, `bisync`, `serve`, `remote`) are updated.
2. **Preservation of Untouched Keys**: Any existing settings not explicitly overridden by the template remain untouched.
3. **Mount Type Awareness**: For mount profiles, internal options such as `mountType` and custom CLI parameters are safely merged without corrupting the active profile structure.

---

## Persistent Storage & Backup

All user-created templates are stored in RClone Manager's internal `rcman` configuration database. Because templates are fully decoupled from remotes:

- Deleting a remote **never** deletes the templates applied to it.
- Templates are included automatically in your configuration backups (**Settings > Backup & Restore**).
- Exporting or importing templates between machines is as simple as copying the JSON snippet from the **JSON Editor** tab.

---

### Related Documentation

- [Mounting Drives](mounting.md)
- [Remote Management](remote-management.md)
- [Quick Runs](quick-runs.md)
- [Visual Workflows](workflows.md)
- [Power Management & Safety](power-management.md)
