# [[icon:dns.primary]] Configuration: RClone Manager Server

This guide covers how to configure authentication, HTTPS/TLS, ports, and data volumes for **RClone Manager Server**.

---

## [[icon:list.primary]] Configuration Reference

Both the pure server and the native tray-enabled server accept the network and path options below. Command-line arguments and `RCLONE_MANAGER_*` environment variables work with standalone binaries as well as Docker. `PUID`, `PGID`, and `PGIDS` are specific to the container entrypoint. The [CLI reference](../getting-started/cli.md) lists every option and the variables that have no flag.

| Feature                 | Flag (Binary/Service)             | Environment Variable                 | Default     |
| :---------------------- | :-------------------------------- | :----------------------------------- | :---------- |
| **Host IP**             | `--host <IP>`                     | `RCLONE_MANAGER_HOST`                | `0.0.0.0`   |
| **Port**                | `--port <PORT>`                   | `RCLONE_MANAGER_PORT`                | `8080`      |
| **Username**            | `--user <NAME>`                   | `RCLONE_MANAGER_USER`                | _(None)_    |
| **Password**            | `--pass <PASS>`                   | `RCLONE_MANAGER_PASS`                | _(None)_    |
| **TLS Cert**            | `--tls-cert <PATH>`               | `RCLONE_MANAGER_TLS_CERT`            | _(None)_    |
| **TLS Key**             | `--tls-key <PATH>`                | `RCLONE_MANAGER_TLS_KEY`             | _(None)_    |
| **Data Dir**            | `--data-dir <PATH>`               | `RCLONE_MANAGER_DATA_DIR`            | _(Default)_ |
| **Cache Dir**           | `--cache-dir <PATH>`              | `RCLONE_MANAGER_CACHE_DIR`           | _(Default)_ |
| **Log Dir**             | `--logs-dir <PATH>`               | `RCLONE_MANAGER_LOG_DIR`             | _(Default)_ |
| **Tray**                | `--tray` (native tray build only) | _(N/A)_                              | `false`     |
| **Master Secret**       | _(N/A)_                           | `RCLONE_MANAGER_SECRET`              | _(None)_    |
| **Secret Path**         | _(N/A)_                           | `RCLONE_MANAGER_SECRET_PATH`         | _(None)_    |
| **Secret File**         | _(N/A)_                           | `RCLONE_MANAGER_SECRET_FILE`         | _(None)_    |
| **Vault Password**      | _(N/A)_                           | `RCLONE_MANAGER_VAULT_PASSWORD`      | _(None)_    |
| **Vault Password File** | _(N/A)_                           | `RCLONE_MANAGER_VAULT_PASSWORD_FILE` | _(None)_    |
| **User ID**             | _(N/A)_                           | `PUID`                               | `1000`      |
| **Group ID**            | _(N/A)_                           | `PGID`                               | `1000`      |
| **Extra Groups**        | _(N/A)_                           | `PGIDS`                              | _(None)_    |

### Path Resolution Hierarchy

RClone Manager Server follows the same precedence as every build (see the [CLI reference](../getting-started/cli.md)):

1. **CLI Arguments**: `--data-dir`, `--cache-dir`, or `--logs-dir` (highest)
2. **Environment Variables**: `RCLONE_MANAGER_DATA_DIR`, `RCLONE_MANAGER_CACHE_DIR`, or `RCLONE_MANAGER_LOG_DIR`
3. **Application Defaults**: Standard paths (lowest).

The Docker entrypoint also recognizes legacy mounted directories before starting
the application. This container migration behavior is not an extra path resolver
in the standalone server. On Linux, the pure server defaults to
`$XDG_DATA_HOME/com.rclone.manager.headless` and
`$XDG_CACHE_HOME/com.rclone.manager.headless` (normally under `~/.local/share` and
`~/.cache`); logs default to `logs/` inside its cache directory. Preserve explicit
paths when moving an existing installation.

---

## [[icon:help_outline.primary]] Parameter Details

### Network & Authentication

- **Host IP**: `0.0.0.0` listens on all interfaces (remote access); `127.0.0.1` restricts access to the local machine.
- **Username & Password**: Enable Basic Authentication. Both must be set. Give the password through `RCLONE_MANAGER_PASS` (an owner-only file or `.env`), not `--pass`: command-line arguments are visible to every user through `ps`.

### Security (HTTPS/TLS)

- **TLS Cert & Key**: Paths to your `.pem` certificate and private key. Both are required; together they enable HTTPS.

### Persistence (Paths)

- **Data Dir**: Internal database, settings and the downloaded `rclone` binary.
- **Cache Dir**: Temporary session data and the file browser cache.
- **Log Dir**: Application runtime logs. The log level is a developer setting in the application; the shared logger does not read `RUST_LOG`.

### [[icon:lock.primary]] Secrets and the Vault (Advanced)

Two separate passwords protect sensitive data. Do not mix them up:

| Purpose                                                                                                         | Variables                                                                           |
| :-------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| **Credential store**: remote passwords, encryption keys and tokens that the `rcman` library keeps encrypted     | `RCLONE_MANAGER_SECRET`, `RCLONE_MANAGER_SECRET_PATH`, `RCLONE_MANAGER_SECRET_FILE` |
| **Configuration vault**: AES-256-GCM protection of your configuration, unlocked with a master password at start | `RCLONE_MANAGER_VAULT_PASSWORD`, `RCLONE_MANAGER_VAULT_PASSWORD_FILE`               |

#### Credential store

A container has no OS keyring. **Without `RCLONE_MANAGER_SECRET` (or a key file), secrets are kept in memory only and must be entered again after every restart.** Set one of these to persist them:

- **`RCLONE_MANAGER_SECRET`**: Master encryption key string passed directly via environment variable.
  ```bash
  -e RCLONE_MANAGER_SECRET="MyMasterSecretKey123!"
  ```
- **`RCLONE_MANAGER_SECRET_PATH`**: When it points to an existing file and `RCLONE_MANAGER_SECRET` is unset, that file is read as the password. Otherwise it selects the encrypted credential-store path. Use `RCLONE_MANAGER_SECRET_FILE` for an explicit password-file path.

  ```bash
  # 1. Create the key file on host FIRST (avoid Docker creating it as a directory)
  echo "MyMasterSecretKey123!" > ~/rcman/secret.key
  chmod 600 ~/rcman/secret.key

  # 2. Mount it into the container
  -v ~/rcman/secret.key:/data/.secret:ro \
  -e RCLONE_MANAGER_SECRET_PATH=/data/.secret
  ```

- **`RCLONE_MANAGER_SECRET_FILE`**: Explicit password file path for `rcman` encrypted credentials.

> [!WARNING]
> If mounting a secret key file with `-v /host/path/secret.key:/data/.secret:ro`, ensure the file exists on the host **before** running `docker run` or `docker compose up`. If the host file does not exist, Docker will create a directory at that path, preventing `rcman` from reading the key.

#### Configuration vault

A server whose configuration vault is enabled stays locked until the master password is entered. To unlock it automatically at startup, provide the password with one of these:

- **`RCLONE_MANAGER_VAULT_PASSWORD_FILE`**: Path to a file that holds the password, for example a Docker or systemd secret (`chmod 600`). Preferred.
- **`RCLONE_MANAGER_VAULT_PASSWORD`**: The password itself. It is used first when both are set.

Empty values count as unset, so a Compose entry such as `RCLONE_MANAGER_VAULT_PASSWORD=${VAULT_PASSWORD}` does not stop the server when the host variable is missing.

---

## [[icon:dns.primary]] Docker Configuration

The repository’s `docker-compose.yml` provides one service with commented options for authentication, TLS, host networking and mounts. Enable the options you need; it does not define `auth` or `tls` profiles.

### [[icon:folder.accent]] Volumes

| Volume            | Container Path | Description                                              |
| :---------------- | :------------- | :------------------------------------------------------- |
| **rclone-data**   | `/data`        | Persistent app data and runtime-downloaded rclone binary |
| **rclone-config** | `/config`      | Rclone configuration (`rclone.conf`)                     |
| **Certs**         | `/app/certs`   | _(Optional)_ Read-only mount point for TLS certificates  |

The image sets `RCLONE_MANAGER_DATA_DIR=/data`, `RCLONE_MANAGER_LOG_DIR=/data/logs`, `RCLONE_MANAGER_CACHE_DIR=/data/cache` and `RCLONE_MANAGER_INSTALLATION_TYPE=docker`. A container never replaces its own executable: to update, pull the new image and re-create the container (see [Updates](../getting-started/updates.md)).

### [[icon:favorite.accent]] Healthcheck

The server answers `GET /health` without authentication. The image checks it every 30 seconds: over `http`, or over `https` (accepting a self-signed certificate) when `RCLONE_MANAGER_TLS_CERT` is set, on `RCLONE_MANAGER_PORT` (default `8080`).

> [!WARNING]
> The sample `docker-compose.yml` defines its own `healthcheck`, which replaces the image's and always requests `http://localhost:8080/health`. If you enable TLS or change `RCLONE_MANAGER_PORT`, update or remove that block, otherwise the container is reported as `unhealthy`.

### [[icon:link.primary]] Remote Authentication (OAuth & Port 53682)

When setting up cloud providers that require browser-based OAuth authentication (e.g. Google Drive, OneDrive, Dropbox), Rclone launches a temporary web server on `127.0.0.1:53682` to receive the authorization token callback.

> [!WARNING]
> **Why Bridge Mode Fails with `NS_ERROR_NET_EMPTY_RESPONSE`:**
> Rclone strictly binds its temporary OAuth server to the container's internal loopback (`127.0.0.1:53682`). When using standard Docker bridge port mapping (`-p 53682:53682`), incoming connections arrive at the container's virtual ethernet interface (`eth0`), where the kernel refuses the connection.

#### Recommended Solutions for OAuth:

1. **Host Network Mode (Recommended on Linux)**:
   Run the container with `network_mode: host` (or `--net=host`). The container directly shares the host network, making `http://127.0.0.1:53682` accessible directly in your host browser:

   ```yaml
   services:
     rclone-manager:
       image: ghcr.io/zarestia-dev/rclone-manager:latest
       network_mode: host
       volumes:
         - rclone-data:/data
         - rclone-config:/config
   ```

2. **SSH Port Forwarding (For Remote VPS / Servers)**:
   If RClone Manager is running on a remote VPS or NAS and you access the Web UI from your local computer, forward port `53682` via SSH tunnel from your local terminal:

   ```bash
   ssh -L 53682:127.0.0.1:53682 user@your-server-ip
   ```

   With this tunnel open, the local browser callback reaches the remote host. For Docker, this assumes host networking as above; the host loopback does not reach a bridge-mode container’s private loopback.

3. **Manual Token (`rclone authorize`)**:
   Run `rclone authorize "<provider>"` on your local computer to generate an OAuth token JSON, then paste the resulting token directly into the manual remote configuration fields in RClone Manager Web UI.

### [[icon:person.accent]] User & Group Mapping (PUID / PGID / PGIDS)

The container entrypoint drops root privileges safely using Linux `setpriv` and supports `PUID`, `PGID`, and comma-separated supplementary group IDs `PGIDS` to map the internal container user to your host environment.

```yaml
environment:
  - PUID=1000
  - PGID=1000
  - PGIDS=1001,1002
```

> [!NOTE]
> **PUID, PGID & PGIDS:**
>
> - **PUID & PGID**: Ensure that files created by the application (like downloads or logs) have the same ownership as your host user, preventing permission errors when mounting host directories.
> - **PGIDS (Supplementary Groups)**: Optional comma-separated group IDs passed to `setpriv --supp-groups`. Useful for resolving permission denied errors (`EACCES`) when accessing ZFS datasets or directories formatted with NFSv4 ACLs in Docker environments.

### [[icon:folder.accent]] FUSE Mounts & `--allow-other` in Docker

When mounting cloud remotes inside the Docker container:

- **Automatic `user_allow_other`**: The container entrypoint automatically enables `user_allow_other` in `/etc/fuse.conf` at startup. When using custom `PUID` and `PGID` values, non-root mount operations configured with `--allow-other` work seamlessly out of the box.
- **Mounting to Host Filesystem**: To mount remotes directly to folders on your host system:
  1. Pass the `/dev/fuse` device: `devices: - /dev/fuse`
  2. Grant the `SYS_ADMIN` capability: `cap_add: - SYS_ADMIN`
  3. _(Optional)_ Set `security_opt: - apparmor:unconfined` if your host enforces AppArmor restrictions.
  4. Use a bind mount with `rshared` propagation (e.g. `- /mnt/remotes:/mnt/remotes:rshared`) so mounts created inside the container propagate to the host.

### [[icon:downloading.accent]] Rclone Binary

The rclone binary is **not included** in the Docker image. On first startup, the entrypoint script automatically downloads the latest rclone release to the `/data/rclone-bin/` directory on your persistent volume. Updates to rclone can be done through the application's UI without rebuilding the image.

### Authentication and TLS in Compose

Add these environment variables to the existing service for authentication:

```yaml
environment:
  RCLONE_MANAGER_USER: admin
  RCLONE_MANAGER_PASS: ${RCLONE_MANAGER_PASS}
```

Set `RCLONE_MANAGER_PASS` in the shell or a local `.env` file. Both username and
password are required together. To add TLS, also mount your certificates and set:

```yaml
environment:
  RCLONE_MANAGER_TLS_CERT: /app/certs/cert.pem
  RCLONE_MANAGER_TLS_KEY: /app/certs/key.pem
volumes:
  - ./certs:/app/certs:ro
```

Merge these entries with existing environment variables and volumes. Do not
replace `/data` or `/config` mounts. TLS uses the configured server port (8080 by
default); it does not automatically switch to 8443.

Update or remove the compose `healthcheck` block as well (see Healthcheck above).
Restart with `docker compose up -d` and access the server using `https://` when TLS
is enabled.

---

## [[icon:settings.primary]] Systemd Service Configuration

For the pure server, create the service described in the [installation guide](../getting-started/installation-server.md), which also covers the service user and file ownership. Installing a package does not necessarily create or enable that service. Tray-enabled native packages still require a GUI runtime.

**1. Put credentials in the environment file** (owner-only, never in `ExecStart`, because unit files and command lines are readable by every user):

```bash
sudo install -m 600 /dev/null /etc/rclone-manager/server.env
sudoedit /etc/rclone-manager/server.env
# RCLONE_MANAGER_USER=admin
# RCLONE_MANAGER_PASS=<long random password>
```

**2. Change network options in `ExecStart`** (`sudoedit /etc/systemd/system/rclone-manager-server.service`):

_Example: changing the port to 3000._

```ini
[Service]
# ...
ExecStart=/opt/rclone-manager/rclone-manager-server \
    --host 0.0.0.0 \
    --port 3000
# ...
```

**3. Apply Changes:**

```bash
sudo systemctl daemon-reload
sudo systemctl restart rclone-manager-server
```

---

## [[icon:terminal.primary]] Manual (Windows / PowerShell)

If running the `.exe` directly in PowerShell, use the `$env:` prefix:

**Temporary (Session-wide):**

```powershell
$env:RCLONE_MANAGER_PORT="3000"
$env:RCLONE_MANAGER_USER="admin"
$env:RCLONE_MANAGER_PASS="MySecretPass"
.\rclone-manager-server.exe
```

**One-liner (Command-only scope):**

```powershell
& { $env:RCLONE_MANAGER_PORT="3000"; .\rclone-manager-server.exe }
```

---

## [[icon:build.primary]] Troubleshooting

<details>
<summary><b>Docker Healthcheck Failing?</b></summary>

The container reports `unhealthy` when `GET /health` does not answer. The endpoint needs no authentication, so a wrong password is not the cause.

- If you use the sample `docker-compose.yml` with TLS or a custom `RCLONE_MANAGER_PORT`, its `healthcheck` still requests `http://localhost:8080/health`. Update or remove it (see the Healthcheck section above).
- Check the logs:

```bash
docker logs rclone-manager
```

</details>

<details>
<summary><b>Systemd Service Won't Start?</b></summary>

Read the service log first:

```bash
journalctl -u rclone-manager-server -e
```

The server refuses to start in these cases:

- A username without a password, or the other way round.
- A TLS certificate without a key, or the other way round.
- The port is already in use. Change `--port`.

The server needs no display. Without a desktop session it runs without its tray.

</details>

<details>
<summary><b>Volume Permission Issues?</b></summary>

If the container can't read or write to mounted volumes, ensure your `PUID` and `PGID` values match the owner of the host directories:

```bash
# Check your host user/group ID
id

# Set matching values in docker-compose.yml or .env
PUID=1000
PGID=1000
```

</details>
