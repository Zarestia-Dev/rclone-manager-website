# Predefined Performance Presets

To bridge the gap between slow cloud API latency and fast, local filesystem access speeds, RClone Manager automatically applies curated, cross-platform performance configurations whenever you create a new remote.

Rather than relying on Rclone's highly conservative defaults (which stream files linearly over a single network socket, perform repetitive cryptographic checks, and cause directory-traversal lag), RClone Manager organizes optimal parameters into a multi-tiered preset system.

---

## How Presets are Applied

Presets are resolved dynamically based on three vectors:

1. **The Remote Storage Type** (e.g., S3, WebDAV, etc.)
2. **The Target Operating System** (Windows, macOS, Linux)
3. **The Base Default Set** (applied universally to all remotes)

When creating a new remote, the resolved values are merged and automatically populated into the default profile settings, ensuring a performant, out-of-the-box mounting experience without manual flag-typing.

> [!IMPORTANT]
> Preset configurations are **only** applied during new remote creation. Existing remotes and cloned profiles are protected and will never have their options modified by these presets.

---

## 1. Universal Base Presets

These options are applied universally to all new remotes to configure aggressive local disk caching, fast metadata responses, and network parallelization.

### Virtual File System (VFS)

| Parameter         | Value   | Rationale                                                                                                                          |
| :---------------- | :------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| `CacheMode`       | `full`  | Buffers all read and write requests locally, enabling full random seek operations and unaligned database writes on virtual drives. |
| `CacheMaxSize`    | `250G`  | Ceiling allocated for the local cache directory. Evicts cold data via Least Recently Used (LRU) logic.                             |
| `CacheMaxAge`     | `48h`   | Files not accessed within 48 hours are automatically purged from the local cache storage.                                          |
| `NoModTime`       | `true`  | Bypasses writing and fetching modification times, eliminating thousands of HTTP HEAD transactions during traversal.                |
| `WriteBack`       | `15s`   | Buffers application writes on local NVMe disk for 15 seconds before asynchronously starting the network upload.                    |
| `FastFingerprint` | `true`  | Skips slow, heavy cryptographic checksum comparisons (MD5/SHA1) when validating files, utilizing size and time cues.               |
| `ChunkSize`       | `32M`   | segment chunk range requests used for streaming files.                                                                             |
| `ChunkStreams`    | `16`    | Initiates 16 concurrent TCP download sockets for range requests, fully saturating high-bandwidth networks.                         |
| `DirCacheTime`    | `1000h` | Retains directory tree structures in RAM for ultra-fast directory browsing.                                                        |
| `Refresh`         | `true`  | Warms up the metadata cache by recursively crawling the remote filesystems in the background on startup.                           |

### Mount Settings

| Parameter     | Value | Rationale                                                                                    |
| :------------ | :---- | :------------------------------------------------------------------------------------------- |
| `AttrTimeout` | `10s` | Retains file attributes (permissions, timestamps, sizes) in the kernel cache for 10 seconds. |

### Global Backend Settings

| Parameter         | Value  | Rationale                                                                                  |
| :---------------- | :----- | :----------------------------------------------------------------------------------------- |
| `BufferSize`      | `128M` | Read-ahead buffer size allocated per open file to smooth out playback.                     |
| `MaxBufferMemory` | `2G`   | Hard RAM ceiling allocated for read-ahead buffers to prevent Out-Of-Memory (OOM) failures. |
| `LogLevel`        | `INFO` | Standard tracing verbosity, capturing cache evictions and backend statuses.                |

---

## 2. Storage Family Overrides

Different protocols present distinct bottlenecks. Family-specific presets are layered on top of the base defaults.

### S3-Compatible & Ceph Family (`s3`, `b2`, `gcs`)

- **`backend.DisableHTTP2` (`true`)**: Disables HTTP/2 in favor of HTTP/1.1. This bypasses stream multiplexing queue constraints, permitting modern servers (like MinIO or Ceph) to run concurrent transfers across fully independent TCP paths.

### WebDAV Family (`webdav`, `nextcloud`, `owncloud`, `sharepoint`)

- **`backend.EtagHash` (`"auto"`)**: Parses the HTTP ETag returned by the WebDAV daemon for instant file integrity checks.
- **`vfs.WriteBack` (`"20s"`)**: Extends the write-back window to 20 seconds. This intercepts temporary/lock file loops generated by Microsoft Office and Adobe suites, uploading only the final, saved document.

---

## 3. Provider-Specific Remote Configs

These settings are written directly to the remote's configuration section inside `rclone.conf`:

### Amazon S3 / Google Cloud Storage

- **`disable_checksum` (`true`)**: Bypasses generating client-side MD5 metadata values during large multipart uploads, optimizing processing overhead.
- **`upload_concurrency` (`8`)**: Allocates 8 parallel worker threads to upload multipart file segments.
- **`chunk_size` (`"32M"`)**: Partitions uploads into 32 MiB parts, decreasing transaction count and API request costs.

### Backblaze B2

- **`disable_checksum` (`true`)**: Skips computing large file SHA1 sums before starting uploads.
- **`upload_concurrency` (`8`)**: Uploads 8 multipart chunks concurrently.
- **`chunk_size` (`"32M"`)**: Multi-part upload segment size.

---

## 4. Operating System (OS) Specific Overrides

RClone Manager adjusts its mount configurations to comply with desktop file manager behaviors:

### Microsoft Windows

- **`mount.NetworkMode` (`true`)**: WinFSP mounts the virtual storage as an SMB Network Share (UNC path) instead of a fixed disk. This tells Windows Explorer to scale back recursive tag and icon generation, preventing Explorer freezes.

### Apple macOS

- **`mount.NoAppleXattr` (`true`)**: Instructs the FUSE translation layer to drop Finder metadata extended attributes (e.g. `com.apple.*`). This stops Finder from uploading clutter files (like `.DS_Store` and `._*` resource forks) to your remote.
