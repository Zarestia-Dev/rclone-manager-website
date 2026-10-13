# [[icon:dns.primary]] Configuration: Headless Server

This guide covers how to configure authentication, HTTPS/TLS, ports, and data volumes for **RClone Manager Headless**.

---

## [[icon:list.primary]] Configuration Reference

Both the pure server and the native tray-enabled server accept the network and path options below. Command-line arguments and `RCLONE_MANAGER_*` environment variables work with standalone binaries as well as Docker. `PUID`, `PGID`, and `PGIDS` are specific to the container entrypoint.

| Feature           | Flag (Binary/Service)             | Environment Variable         | Default     |
| :---------------- | :-------------------------------- | :--------------------------- | :---------- |
| **Host IP**       | `--host <IP>`                     | `RCLONE_MANAGER_HOST`        | `0.0.0.0`   |
| **Port**          | `--port <PORT>`                   | `RCLONE_MANAGER_PORT`        | `8080`      |
| **Username**      | `--user <NAME>`                   | `RCLONE_MANAGER_USER`        | _(None)_    |
| **Password**      | `--pass <PASS>`                   | `RCLONE_MANAGER_PASS`        | _(None)_    |
| **TLS Cert**      | `--tls-cert <PATH>`               | `RCLONE_MANAGER_TLS_CERT`    | _(None)_    |
| **TLS Key**       | `--tls-key <PATH>`                | `RCLONE_MANAGER_TLS_KEY`     | _(None)_    |
| **Data Dir**      | `--data-dir <PATH>`               | `RCLONE_MANAGER_DATA_DIR`    | _(Default)_ |
| **Cache Dir**     | `--cache-dir <PATH>`              | `RCLONE_MANAGER_CACHE_DIR`   | _(Default)_ |
| **Log Dir**       | `--logs-dir <PATH>`               | `RCLONE_MANAGER_LOG_DIR`     | _(Default)_ |
| **Tray**          | `--tray` (native tray build only) | _(N/A)_                      | `false`     |
| **Master Secret** | _(N/A)_                           | `RCLONE_MANAGER_SECRET`      | _(None)_    |
| **Secret Path**   | _(N/A)_                           | `RCLONE_MANAGER_SECRET_PATH` | _(None)_    |
| **Secret File**   | _(N/A)_                           | `RCLONE_MANAGER_SECRET_FILE` | _(None)_    |
| **User ID**       | _(N/A)_                           | `PUID`                       | `1000`      |
| **Group ID**      | _(N/A)_                           | `PGID`                       | `1000`      |
| **Extra Groups**  | _(N/A)_                           | `PGIDS`                      | _(None)_    |

### Path Resolution Hierarchy

RClone Manager Headless follows a strict precedence when resolving directory paths:

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

- **Host IP**: The network interface the server binds to.
  - `0.0.0.0`: Listens on all interfaces (public/remote access).
  - `127.0.0.1`: Restricts access to the local machine only.
- **Port**: The TCP port for the web interface.
- **Username & Password**: Enables Basic Authentication. Both must be set to secure the interface.

### Security (HTTPS/TLS)

- **TLS Cert & Key**: Paths to your `.pem` certificate and private key files. Enables encrypted HTTPS access.

### Persistence (Paths)

- **Data Dir**: Stores the internal database, settings, and the downloaded `rclone` binary.
- **Cache Dir**: Stores temporary session data and file browser cache.
- **Log Dir**: Stores application runtime logs.

### [[icon:lock.primary]] Secret Management (Advanced)

RClone Manager uses the `rcman` library to securely store sensitive configuration and connection credentials (like remote passwords, encryption keys, and tokens).

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

### Docker-Specific

- **User ID (PUID)** & **Group ID (PGID)**: Maps the internal container user to your host user. This is essential for preventing permission issues on mounted volumes.
- **Application log level**: Configure the developer log-level setting in the application. The shared logger does not read `RUST_LOG`.

---

## [[icon:dns.primary]] Docker Configuration

The repository’s `docker-compose.yml` provides one service with commented options for authentication, TLS, host networking and mounts. Enable the options you need; it does not define `auth` or `tls` profiles.

### [[icon:folder.accent]] Volumes

| Volume            | Container Path | Description                                              |
| :---------------- | :------------- | :------------------------------------------------------- |
| **rclone-data**   | `/data`        | Persistent app data and runtime-downloaded rclone binary |
| **rclone-config** | `/config`      | Rclone configuration (`rclone.conf`)                     |
| **Certs**         | `/app/certs`   | _(Optional)_ Read-only mount point for TLS certificates  |

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

2. **SSH Port Forwarding (For Remote VPS / Headless Servers)**:
   If RClone Manager is running on a remote VPS or NAS and you access the Web UI from your local computer, forward port `53682` via SSH tunnel from your local terminal:

   ```bash
   ssh -L 53682:127.0.0.1:53682 user@your-server-ip
   ```

   With this tunnel open, the local browser callback reaches the remote host. For Docker, this assumes host networking as above; the host loopback does not reach a bridge-mode container’s private loopback.

3. **Headless Manual Token (`rclone authorize`)**:
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
default); it does not automatically switch to 8443. Restart with
`docker compose up -d` and access the server using `https://` when TLS is enabled.

---

## [[icon:settings.primary]] Systemd Service Configuration

For the pure server, create the service described in the [installation guide](../getting-started/installation-headless.md). Installing a package does not necessarily create or enable that service. Tray-enabled native packages still require a GUI runtime.

**1. Edit the Service:**

```bash
sudo nano /etc/systemd/system/rclone-manager-server.service

```

**2. Modify the `ExecStart` line:**
Find the `[Service]` section. Add or remove flags to change the configuration.

_Example: Changing port to 3000 and setting a custom password._

```ini
[Service]
# ...
ExecStart=/opt/rclone-manager/rclone-manager-server \
    --host 0.0.0.0 \
    --port 3000 \
    --user admin \
    --pass MySecretPass
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

## [[icon:report_problem.warn]] Important: OAuth Port 53682

When adding remotes that require browser authentication (like Google Drive, OneDrive, or Dropbox), Rclone needs to receive a callback token.

- **Docker Users:** You **must** expose port `53682` (it is included in our default `docker-compose.yml`).
- **Firewall:** Ensure your firewall (UFW/IPTables) allows incoming traffic on port `53682`.

If this port is blocked, the authentication tab in your browser will hang or show "Connection Refused."

---

## [[icon:build.primary]] Troubleshooting

<details>
<summary><b>Docker Healthcheck Failing?</b></summary>

The Docker container includes a healthcheck.

- **Default Profile:** Checks `http://localhost:8080/health`
- **Auth Profile:** Checks using `curl -u user:pass ...`
- **TLS Profile:** Checks `https://...` with `-k` (insecure) to support self-signed certs.

If the container shows `unhealthy`, check the logs:

```bash
docker logs rclone-manager

```

</details>

<details>
<summary><b>Systemd Service Won't Start?</b></summary>

Because RClone Manager uses Tauri/GTK, it requires a virtual display.

1. Ensure `Xvfb` is installed on your system.
2. Ensure the service file includes:

```ini
Environment="DISPLAY=:99"

```

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
