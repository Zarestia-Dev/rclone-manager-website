# Installation: Headless Server

Run RClone Manager in your browser while transfers, mounts, and automations run
on your server or NAS.

## [[icon:help_outline.primary]] Choose a deployment

| Variant                     | Intended use                                                   | Desktop runtime required?     |
| --------------------------- | -------------------------------------------------------------- | ----------------------------- |
| **Pure server / Docker**    | Background services, containers, servers and NAS devices       | No Tauri, GTK, WebKit or Xvfb |
| **Server with native tray** | Web access plus a tray and native updater on a desktop machine | Yes                           |

The pure server executable is `rclone-manager-server`; the tray-enabled native
server remains `rclone-manager-headless` (add `.exe` on Windows).
The regular desktop application is `rclone-manager`.

Two independent workflows upload to the same `headless-v<version>` release:
`release-server.yml` builds standalone ZIP archives, while `release-headless.yml`
builds native tray installers.

## [[icon:download.primary]] Download the standalone server

Choose a **Server** archive from [Downloads](https://hakanismail.info/zarestia/rclone-manager/downloads)
with Headless mode selected, or from the
[headless releases](https://github.com/Zarestia-Dev/rclone-manager/releases).

| OS | Architectures | Archive |
| --- | --- | --- |
| Linux | x86_64, aarch64 | `server-linux-<arch>-<version>.zip` |
| Windows | x86_64, aarch64 | `server-windows-<arch>-<version>.zip` |
| macOS | x86_64, aarch64 | `server-macos-<arch>-<version>.zip` |

Each ZIP contains a `rclone-manager-server/` folder with the executable, `LICENSE`,
a short `README.txt` and, on Linux, a systemd unit template. The executable embeds
the web UI and translations, so it runs on its own.
Extract the archive, then run `./rclone-manager-server --host 127.0.0.1 --port 8080`
on Linux/macOS, or
`.\rclone-manager-server.exe --host 127.0.0.1 --port 8080` in Windows PowerShell.
Then open `http://localhost:8080`.

Linux archives require glibc 2.35+ and the D-Bus runtime library (for example,
`libdbus-1-3` on Debian/Ubuntu). Mounting requires FUSE. These archives are not
static Alpine/musl builds. Other Rclone platforms remain planned work in
[backend/TODO.md](https://github.com/Zarestia-Dev/rclone-manager/blob/master/backend/TODO.md).
Only assets actually published in a release appear on the download page.

## [[icon:dns.primary]] Docker

```bash
docker run -d \
  --name rclone-manager \
  --restart=unless-stopped \
  -p 127.0.0.1:8080:8080 \
  -v rclone-config:/config \
  -v rclone-data:/data \
  ghcr.io/zarestia-dev/rclone-manager:latest
```

Open `http://localhost:8080` on the host. For a remote host, keep this binding and
connect with `ssh -L 8080:127.0.0.1:8080 user@your-server`, then open that address
locally. To expose the service directly on your network, change the mapping to
`8080:8080` and configure authentication and HTTPS.

A minimal `compose.yaml`:

```yaml
services:
  rclone-manager:
    image: ghcr.io/zarestia-dev/rclone-manager:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:8080"
    volumes:
      - rclone-config:/config
      - rclone-data:/data
volumes:
  rclone-config:
  rclone-data:
```

Start with `docker compose up -d`. Preserve both volumes across updates.
See [configuration](../platform/configuration-headless.md) for authentication,
TLS, OAuth, user mapping and FUSE mounts.

## [[icon:terminal.primary]] Pure server from source

Follow the [build guide](building.md) for toolchain and dependency setup.
From the application repository:

```bash
npm ci
npm run build
npm run build:server
```

The output is `backend/target/release/rclone-manager-server`, with `.exe` on
Windows. Building with an explicit `--target` inserts that target before `release`.

The executable embeds the web UI, translations and templates. For deployment,
copy it to its destination, for example `/opt/rclone-manager/rclone-manager-server`,
and start it:

```bash
/opt/rclone-manager/rclone-manager-server --host 127.0.0.1 --port 8080
```

The pure server has no tray and no Tauri updater. When its executable is in a
location your user owns and can write, the application can update itself;
otherwise replace the executable. Rclone itself must be available or installed
through the application's engine setup.

## [[icon:download.primary]] Native server packages

The [headless releases](https://github.com/Zarestia-Dev/rclone-manager/releases)
provide the assets listed in each release. The current native release workflow
uses Tauri with `web-server,tray,updater`; these packages still need the appropriate
GUI libraries and a display environment on Linux.

Install the package for your operating system following its release instructions.
Use the pure server or Docker for machines without a desktop session.
You can build native server packages yourself with `npm run build:headless`.

## [[icon:settings.primary]] Systemd service for the pure server

Create a dedicated user and install the pure server executable in
`/opt/rclone-manager`, owned by that user:

```bash
sudo useradd --system --create-home --home-dir /var/lib/rclone-manager --shell /usr/sbin/nologin rclone-manager
sudo install -d -o rclone-manager -g rclone-manager /opt/rclone-manager
sudo install -o rclone-manager -g rclone-manager -m 755 rclone-manager-server /opt/rclone-manager/
```

Because the service user owns the executable and its directory, the application
can update itself. An executable owned by root (for example in `/usr/bin`)
disables in-app updates; replace it manually instead.

Create `/etc/systemd/system/rclone-manager-server.service`:

```ini
[Unit]
Description=RClone Manager web server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=rclone-manager
Group=rclone-manager
StateDirectory=rclone-manager
CacheDirectory=rclone-manager
LogsDirectory=rclone-manager
ExecStart=/opt/rclone-manager/rclone-manager-server --host 127.0.0.1 --port 8080 --data-dir /var/lib/rclone-manager --cache-dir /var/cache/rclone-manager --logs-dir /var/log/rclone-manager
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

The service user must be able to read the executable and access any local files
you want it to manage. This service does not use
`DISPLAY` or Xvfb. Its directories are examples; retain your existing paths when
migrating an installation.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now rclone-manager-server
journalctl -u rclone-manager-server -f
```

## [[icon:sync.primary]] Updating

- **Docker Compose:** run `docker compose pull` and `docker compose up -d`.
- **Pure server:** stop the service, replace the executable with the one from the
  new ZIP, then start it again.
- **Native packages:** use the native updater where available, or install the
  replacement package.

Keep application data, Rclone configuration, and credential files. Updating
RClone Manager and updating the Rclone engine are separate operations.
