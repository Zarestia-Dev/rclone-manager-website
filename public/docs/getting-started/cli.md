# [[icon:terminal.primary]] CLI Reference

RClone Manager supports a wide range of command-line arguments and environment variables. These options allow you to customize paths, secure the server, start the application minimized, or trigger remote transfers directly.

---

## [[icon:list.primary]] General Options

The path options are available in both the desktop and server builds. `--tray` is only compiled into native builds with tray support; the pure server does not accept it.

| Argument / Flag      | Environment Variable       | Description                                                                               |
| :------------------- | :------------------------- | :---------------------------------------------------------------------------------------- |
| `--data-dir <PATH>`  | `RCLONE_MANAGER_DATA_DIR`  | Custom path to the application data directory (stores databases, settings, and binaries). |
| `--cache-dir <PATH>` | `RCLONE_MANAGER_CACHE_DIR` | Custom path to the application session cache.                                             |
| `--logs-dir <PATH>`  | `RCLONE_MANAGER_LOG_DIR`   | Custom path to the application runtime logs folder.                                       |
| `--tray`             | _(N/A)_                    | **(Native tray builds only)** Starts or enables the system tray.                          |

### Path Precedence Hierarchy

RClone Manager resolves directories using the following precedence:

1. **CLI Arguments** (highest priority)
2. **Environment Variables**
3. **Application System Defaults** (lowest priority)

---

## [[icon:send.primary]] File Manager / Integration Options

These arguments are used by the file manager integrations that RClone Manager registers on Windows, Linux and macOS (Explorer, Nautilus, Dolphin, Nemo and Finder; see [File Manager Integrations](../user-guide/integrations.md)) to launch background file uploads. You can also run them manually or call them from custom scripts. Android has no command line: shared files arrive through the system **Share** menu instead.

| Argument / Flag             | Description                                                                         | Example / Usage                       |
| :-------------------------- | :---------------------------------------------------------------------------------- | :------------------------------------ |
| `--send-to-remote <REMOTE>` | The name of the target cloud remote.                                                | `--send-to-remote "Dropbox:"`         |
| `--send-to-path <PATH>`     | Subdirectory folder path on the destination remote (optional).                      | `--send-to-path "Backups/Weekly"`     |
| `[sources...]`              | Trailing positional parameters representing one or more files or folders to upload. | `"/path/file1.txt" "/path/file2.zip"` |

### CLI Upload Example

```bash
rclone-manager --send-to-remote "GoogleDrive:" --send-to-path "ServerBackups" "/var/backup.tar.gz"
```

> [!TIP]
> **Single-Instance IPC**  
> For native builds with the single-instance plugin, if RClone Manager is already running in the background, executing this command will automatically forward the parameters to the running instance via local IPC and start the upload immediately without opening a new app window.

> [!NOTE]
> **No window, and the vault stays locked**  
> A send-to command does not open the app window. It waits for the engine, uploads, and shuts down again. If the configuration vault is locked, the transfer is refused instead of bypassing the lock; unlock the app first.

---

## [[icon:dns.primary]] Server Options

These parameters configure network binding, authentication, and TLS encryption, and are **only** compiled into the server (`rclone-manager-server`).

| Argument / Flag     | Environment Variable      | Default   | Description                                            |
| :------------------ | :------------------------ | :-------- | :----------------------------------------------------- |
| `-H, --host <IP>`   | `RCLONE_MANAGER_HOST`     | `0.0.0.0` | Network interface IP address the server binds to.      |
| `-p, --port <PORT>` | `RCLONE_MANAGER_PORT`     | `8080`    | TCP port the server listens on.                        |
| `-u, --user <NAME>` | `RCLONE_MANAGER_USER`     | _(None)_  | Username for Basic Authentication (requires password). |
| `--pass <PASS>`     | `RCLONE_MANAGER_PASS`     | _(None)_  | Password for Basic Authentication (requires username). |
| `--tls-cert <PATH>` | `RCLONE_MANAGER_TLS_CERT` | _(None)_  | Path to the TLS/SSL certificate `.pem` file.           |
| `--tls-key <PATH>`  | `RCLONE_MANAGER_TLS_KEY`  | _(None)_  | Path to the TLS/SSL private key `.pem` file.           |

### Basic Auth Example

```bash
export RCLONE_MANAGER_PASS="$(cat /etc/rclone-manager/pass)"
rclone-manager-server --user admin
```

> [!WARNING]
> **Do not put the password on the command line.**  
> Anything passed with `--pass` is visible to every user on the machine through `ps` and `/proc/<pid>/cmdline`. Give it through `RCLONE_MANAGER_PASS`, preferably from an owner-only file (`chmod 600`) such as the systemd `EnvironmentFile` described in the [server guide](installation-server.md). The same applies to the arguments of an updated app: it is started with the same arguments as the running one (see [Updates](updates.md)).

### Secure HTTPS Example

```bash
rclone-manager-server --tls-cert /certs/fullchain.pem --tls-key /certs/privkey.pem
```

The desktop binary is `rclone-manager` and the server is `rclone-manager-server`
(with `.exe` on Windows). Run `--help` on your installed binary to check its
compiled options. Authentication requires both
username and password; TLS requires both certificate and key.

---

## [[icon:settings.primary]] Environment-Only Variables

These variables have no command-line flag. For the two vault variables, empty values count as unset, so a Compose entry such as `RCLONE_MANAGER_VAULT_PASSWORD=${VAULT_PASSWORD}` does not stop the app when the host variable is missing.

| Environment Variable                                                   | Description                                                                                                                                                                                  |
| :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RCLONE_MANAGER_VAULT_PASSWORD`                                        | Master password that unlocks the configuration vault at startup, so a protected installation starts without anyone typing it.                                                                |
| `RCLONE_MANAGER_VAULT_PASSWORD_FILE`                                   | Path to a file that holds that password (for example a Docker or systemd secret). It is used only when `RCLONE_MANAGER_VAULT_PASSWORD` is unset or empty. Prefer it over the variable above. |
| `RCLONE_MANAGER_SECRET`, `RCLONE_MANAGER_SECRET_PATH`, `…_SECRET_FILE` | Master key or key file for the encrypted credential store of the server. See **Secret Management** in the [server configuration](../platform/configuration-server.md).          |
| `RCLONE_MANAGER_DISABLE_UPDATES`                                       | Set to `1` or `true` to keep release checks but turn off in-app installation. See [Updates](updates.md).                                                                                     |
| `RCLONE_MANAGER_INSTALLATION_TYPE`                                     | Declares how the app is deployed (for example `container`) so it does not try to replace its own executable. Docker and Podman are detected automatically. See [Updates](updates.md).        |
