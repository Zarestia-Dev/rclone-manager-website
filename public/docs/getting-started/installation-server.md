# Installation: RClone Manager Server

Run RClone Manager in your browser while transfers, mounts, and automations run
on your server, NAS or desktop.

## [[icon:help_outline.primary]] Choose a package

| Package                                    | Intended use                                                  |
| ------------------------------------------ | ------------------------------------------------------------- |
| **Server ZIP / Docker**                    | Background services, containers, servers and NAS devices      |
| **Server packages (DEB, RPM, setup, MSI)** | A desktop machine: menu entry, start at login, in-app updates |

Both are the same program, `rclone-manager-server` (add `.exe` on Windows). It
needs no Tauri, GTK, WebKit or Xvfb, and shows a system tray on Linux and Windows
whenever a desktop session is there to show it; macOS builds have none. The
regular desktop application is `rclone-manager`.

RClone Manager Server replaces the RClone Manager Headless app (0.3.6 and older).
See **Moving from RClone Manager Headless** below.

`release-server.yml` builds the ZIP archives and the packages of each
`server-v<version>` release. Releases up to 0.3.7 are tagged `headless-v<version>`.

## [[icon:download.primary]] Download the standalone server

Choose a **Server** archive from [Downloads](https://hakanismail.info/zarestia/rclone-manager/downloads)
with Server mode selected, or from the
[server releases](https://github.com/Zarestia-Dev/rclone-manager/releases) (tagged `server-v<version>`, `headless-v<version>` up to 0.3.7).

| OS      | Architectures   | Archive                               |
| ------- | --------------- | ------------------------------------- |
| Linux   | x86_64, aarch64 | `server-linux-<arch>-<version>.zip`   |
| Windows | x86_64, aarch64 | `server-windows-<arch>-<version>.zip` |
| macOS   | x86_64, aarch64 | `server-macos-<arch>-<version>.zip`   |

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

## [[icon:inventory_2.primary]] Arch Linux (AUR)

```bash
yay -S rclone-manager-server
```

`rclone-manager-server` installs the server from the release's DEB. It depends
only on `glibc`, `gcc-libs` and `dbus`, so it needs no GTK, WebKit or Xvfb. The
package installs `/usr/bin/rclone-manager-server` with its menu entry, the
`rclone-manager-server` systemd unit and the `rclone-manager` service user, whose
home is `/var/lib/rclone-manager`. On a desktop, start it from the menu; on a
server, set up the service as below.

The unit listens on `0.0.0.0:8080` and reads credentials from
`/etc/rclone-manager/server.env`. Set them before starting the service:

```bash
sudo install -d /etc/rclone-manager
sudo install -m 600 /dev/null /etc/rclone-manager/server.env
sudoedit /etc/rclone-manager/server.env   # RCLONE_MANAGER_USER=... and RCLONE_MANAGER_PASS=...
sudo systemctl enable --now rclone-manager-server
```

To change the address or port, override the command with
`sudo systemctl edit rclone-manager-server`:

```ini
[Service]
ExecStart=
ExecStart=/usr/bin/rclone-manager-server --host 127.0.0.1 --port 8080
```

Pacman owns `/usr/bin/rclone-manager-server`, so the application only announces new
versions; update it with `yay -Syu rclone-manager-server`.

`rclone-manager-server` replaces the `rclone-manager-headless` AUR package. The
AUR also has `rclone-manager-git`, the desktop app built from source, which needs
GTK and WebKit.

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
      - '127.0.0.1:8080:8080'
    volumes:
      - rclone-config:/config
      - rclone-data:/data
volumes:
  rclone-config:
  rclone-data:
```

Start with `docker compose up -d`. Preserve both volumes across updates.
See [configuration](../platform/configuration-server.md) for authentication,
TLS, OAuth, user mapping and FUSE mounts.

## [[icon:storage.primary]] Unraid (Community Applications)

RClone Manager is available in Unraid's Community Applications. Search for
**RClone Manager** in the **Apps** tab, or open its
[Community Applications page](https://ca.unraid.net/apps/rclone-manager-1wrkqwm0tcyixe).
The template runs the official `ghcr.io/zarestia-dev/rclone-manager:latest`
image and sets:

- `PUID=99` and `PGID=100` (`nobody:users`), the owner of Unraid shares.
- `/config` and `/data` in `/mnt/user/appdata/rclone-manager`.
- The Unraid shares at `/mnt/user`, for the local sources and destinations of
  your jobs.
- Port `8080` for the web UI. Pick another host port if 8080 is already in use
  on your server.

Set **Web UI username** and **Web UI password** (`RCLONE_MANAGER_USER` and
`RCLONE_MANAGER_PASS`). Without both, the web UI has no login, so anyone who can
reach the port can control the app and read your stored cloud credentials. Leave
them empty only behind a reverse proxy that requires its own login.

Keep your shares out of `/home/rclone-manager`: the container changes the owner
of that folder, `/config` and `/data` at every start. Set **Master secret**
(`RCLONE_MANAGER_SECRET`) so saved remote credentials survive restarts. For FUSE
mounts, add `--device /dev/fuse --cap-add SYS_ADMIN --security-opt apparmor:unconfined`
to **Extra Parameters**.

The template is maintained in
[repires/unraid-templates](https://github.com/repires/unraid-templates); report
template problems there.

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

The server has no Tauri updater. When its executable is in a
location your user owns and can write, the application can update itself;
otherwise replace the executable. Rclone itself must be available or installed
through the application's engine setup.

## [[icon:download.primary]] Server packages

Each release also has the server as packages for desktop machines:

| Package       | File                                                      | Installs for     |
| ------------- | --------------------------------------------------------- | ---------------- |
| DEB           | `RClone.Manager.Server_<version>_<amd64\|arm64>.deb`      | All users        |
| RPM           | `RClone.Manager.Server-<version>-1.<x86_64\|aarch64>.rpm` | All users        |
| Windows setup | `RClone.Manager.Server_<version>_<x64\|arm64>-setup.exe`  | The current user |
| Windows MSI   | `RClone.Manager.Server_<version>_<x64\|arm64>_en-US.msi`  | All users        |

They add a menu entry and update from inside the app: the DEB and RPM through
`pkexec`, which asks for the administrator password in the desktop session; the
setup without administrator rights; the MSI with administrator approval each time.

### Moving from RClone Manager Headless

The server keeps the headless app's settings, remotes and data folder
(`com.rclone.manager.headless`), and on its first start moves the app's
start-at-login and file manager (Send To) entries to its own name.

- **DEB and RPM:** the in-app update installs `rclone-manager-server`, which
  removes `r-clone-manager-headless`. The old `rclone-manager-headless` command
  still starts the server.
- **Windows setup:** the in-app update removes the old installation, keeping its
  settings, and starts the server.
- **Windows MSI:** the in-app update replaces the old MSI. Start
  **RClone Manager Server** once from the Start menu; until then, starting at
  login does not work.
- **AUR:** run `yay -S rclone-manager-server` once and let pacman remove
  `rclone-manager-headless`.

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

After a self-update the service keeps its main PID: the original process stays as
the parent of the updated server until the service stops, so `systemctl status`
lists two processes. A small hidden `.rcman-update-…` folder next to the
executable goes away when the service stops. See [Updates](updates.md) for how
the automatic rollback works.

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
you want it to manage. This service needs no
display. Its directories are examples; retain your existing paths when
migrating an installation.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now rclone-manager-server
journalctl -u rclone-manager-server -f
```

## [[icon:sync.primary]] Updating

- **Docker Compose:** run `docker compose pull` and `docker compose up -d`.
- **Arch Linux (AUR):** run `yay -Syu rclone-manager-server`.
- **Server ZIP:** the app updates itself when its executable and folder belong to
  your user; otherwise stop the service, replace the executable with the one from
  the new ZIP, then start it again.
- **Server packages:** update from inside the app, or install the new package.

Keep application data, Rclone configuration, and credential files. Updating
RClone Manager and updating the Rclone engine are separate operations.
