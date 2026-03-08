# Configuration: Headless Server

This guide covers how to configure authentication, HTTPS/TLS, ports, and data volumes for **RClone Manager Headless**.

---

## [[icon:list.primary]] Configuration Reference

You can configure the server using **Command Line Arguments** (Systemd/Binary) or **Environment Variables** (Docker).

| Feature       | Flag (Binary/Service) | Environment Variable (Docker) | Default   |
| :------------ | :-------------------- | :---------------------------- | :-------- |
| **Host IP**   | `--host <IP>`         | `RCLONE_MANAGER_HOST`         | `0.0.0.0` |
| **Port**      | `--port <PORT>`       | `RCLONE_MANAGER_PORT`         | `8080`    |
| **Username**  | `--user <NAME>`       | `RCLONE_MANAGER_USER`         | _(None)_  |
| **Password**  | `--pass <PASS>`       | `RCLONE_MANAGER_PASS`         | _(None)_  |
| **TLS Cert**  | `--tls-cert <PATH>`   | `RCLONE_MANAGER_TLS_CERT`     | _(None)_  |
| **TLS Key**   | `--tls-key <PATH>`    | `RCLONE_MANAGER_TLS_KEY`      | _(None)_  |
| **User ID**   | _(N/A)_               | `PUID`                        | `1000`    |
| **Group ID**  | _(N/A)_               | `PGID`                        | `1000`    |
| **Log Level** | _(N/A)_               | `RUST_LOG`                    | `info`    |

---

## [[icon:dns.primary]] Docker Configuration

The official [`docker-compose.yml`](https://raw.githubusercontent.com/Zarestia-Dev/rclone-manager/refs/heads/master/docker-compose.yml) uses **Profiles** to switch between modes easily.

### [[icon:folder.accent]] Volumes

| Volume            | Container Path | Description                                              |
| :---------------- | :------------- | :------------------------------------------------------- |
| **rclone-data**   | `/data`        | Persistent app data and runtime-downloaded rclone binary |
| **rclone-config** | `/config`      | Rclone configuration (`rclone.conf`)                     |
| **Certs**         | `/app/certs`   | _(Optional)_ Read-only mount point for TLS certificates  |

### [[icon:person.accent]] User & Permission Mapping (PUID / PGID)

The container supports `PUID` and `PGID` environment variables to map the internal user to your host user. This prevents permission issues when mounting host directories.

```yaml
environment:
  - PUID=1000
  - PGID=1000
```

### [[icon:downloading.accent]] Rclone Binary

The rclone binary is **not included** in the Docker image. On first startup, the entrypoint script automatically downloads the latest rclone release to the `/data/rclone-bin/` directory on your persistent volume. Updates to rclone can be done through the application's UI without rebuilding the image.

### Profile 1: Default (No Auth)

Standard HTTP setup on port `8080`.

- **Command:** `docker compose up -d`
- **URL:** `http://localhost:8080`

### Profile 2: Authentication (`auth`)

Secures the UI with a Basic Auth username and password.

- **Command:** `docker compose --profile auth up -d`
- **Setup:** Create a `.env` file in the same directory as `docker-compose.yml`:
  ```env
  RCLONE_MANAGER_USER=admin
  RCLONE_MANAGER_PASS=your-secure-password
  ```

### Profile 3: HTTPS / TLS (`tls`)

Runs the server with encryption. This profile listens on port **8443** by default.

- **Command:** `docker compose --profile tls up -d`
- **URL:** `https://localhost:8443`
- **Setup:**
  1. Place your `cert.pem` and `key.pem` files in a `./certs` folder on your host.
  2. The compose file already maps this directory read-only into the container.

### [[icon:lock.accent]] Profile 4: Authentication + HTTPS (`auth-tls`)

Combines both Basic Auth and TLS for maximum security.

- **Command:** `docker compose --profile auth-tls up -d`
- **URL:** `https://localhost:8443`
- **Setup:**
  1. Follow both Authentication and HTTPS setup steps above.
  2. Create a `.env` file with `RCLONE_MANAGER_USER` and `RCLONE_MANAGER_PASS`.
  3. Place certificates in the `./certs` folder.

---

## [[icon:settings.primary]] Systemd Service Configuration

If you installed via the `.deb`, `.rpm`, or script, the service is managed by systemd. Service [file](https://raw.githubusercontent.com/Zarestia-Dev/rclone-manager/master/headless/rclone-manager-headless.service).

**1. Edit the Service:**

```bash
sudo nano /etc/systemd/system/rclone-manager-headless.service

```

**2. Modify the `ExecStart` line:**
Find the `[Service]` section. Add or remove flags to change the configuration.

_Example: Changing port to 3000 and setting a custom password._

```ini
[Service]
# ...
ExecStart=/usr/bin/rclone-manager-headless \
    --host 0.0.0.0 \
    --port 3000 \
    --user admin \
    --pass MySecretPass
# ...

```

**3. Apply Changes:**

```bash
sudo systemctl daemon-reload
sudo systemctl restart rclone-manager-headless

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
