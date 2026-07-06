# [[icon:terminal.primary]] CLI Reference

RClone Manager supports a wide range of command-line arguments and environment variables. These options allow you to customize paths, secure the headless server, start the application minimized, or trigger remote transfers directly.

---

## [[icon:list.primary]] General Options

These parameters are available in **both** the Desktop GUI and the Headless Web Server builds.

| Argument / Flag | Environment Variable | Description |
| :--- | :--- | :--- |
| `--data-dir <PATH>` | `RCLONE_MANAGER_DATA_DIR` | Custom path to the application data directory (stores databases, settings, and binaries). |
| `--cache-dir <PATH>` | `RCLONE_MANAGER_CACHE_DIR` | Custom path to the application session cache. |
| `--logs-dir <PATH>` | `RCLONE_MANAGER_LOG_DIR` | Custom path to the application runtime logs folder. |
| `--tray` | _(N/A)_ | **(Desktop Only)** Starts the application minimized directly in the system tray. |

### Path Precedence Hierarchy
RClone Manager resolves directories using the following precedence:
1. **CLI Arguments** (highest priority)
2. **Environment Variables**
3. **Application System Defaults** (lowest priority)

---

## [[icon:send.primary]] File Manager / Integration Options

These arguments are used by RClone Manager's context menu integrations to launch background file uploads. You can also run them manually or call them from custom scripts.

| Argument / Flag | Description | Example / Usage |
| :--- | :--- | :--- |
| `--send-to-remote <REMOTE>` | The name of the target cloud remote. | `--send-to-remote "Dropbox:"` |
| `--send-to-path <PATH>` | Subdirectory folder path on the destination remote (optional). | `--send-to-path "Backups/Weekly"` |
| `[sources...]` | Trailing positional parameters representing one or more files or folders to upload. | `"/path/file1.txt" "/path/file2.zip"` |

### CLI Upload Example
```bash
rclone-manager --send-to-remote "GoogleDrive:" --send-to-path "ServerBackups" "/var/backup.tar.gz"
```
> [!TIP]
> **Single-Instance IPC**  
> If RClone Manager is already running in the background, executing this command will automatically forward the parameters to the running instance via local IPC and start the upload immediately without opening a new app window.

---

## [[icon:dns.primary]] Headless Server Options

These parameters configure network binding, authentication, and TLS encryption, and are **only** compiled into the Headless Web Server build.

| Argument / Flag | Environment Variable | Default | Description |
| :--- | :--- | :--- | :--- |
| `-H, --host <IP>` | `RCLONE_MANAGER_HOST` | `0.0.0.0` | Network interface IP address the server binds to. |
| `-p, --port <PORT>`| `RCLONE_MANAGER_PORT` | `8080` | TCP port the server listens on. |
| `-u, --user <NAME>`| `RCLONE_MANAGER_USER` | _(None)_ | Username for Basic Authentication (requires password). |
| `--pass <PASS>` | `RCLONE_MANAGER_PASS` | _(None)_ | Password for Basic Authentication (requires username). |
| `--tls-cert <PATH>`| `RCLONE_MANAGER_TLS_CERT`| _(None)_ | Path to the TLS/SSL certificate `.pem` file. |
| `--tls-key <PATH>` | `RCLONE_MANAGER_TLS_KEY` | _(None)_ | Path to the TLS/SSL private key `.pem` file. |

### Basic Auth Example
```bash
rclone-manager-headless --user admin --pass MySecretPassword123
```

### Secure HTTPS Example
```bash
rclone-manager-headless --tls-cert /certs/fullchain.pem --tls-key /certs/privkey.pem
```
