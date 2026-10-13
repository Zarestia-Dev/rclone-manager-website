# [[icon:build.primary]] Building from Source

The Angular frontend is shared by the desktop application and browser interface.
Rust code lives in one workspace under `backend/`.

## [[icon:list.primary]] Prerequisites

- Node.js compatible with the Angular version in `package.json`, plus npm.
- Rust and Cargo compatible with the locked dependencies.
- Your platform's compiler and native dependencies. Native Tauri builds need its
  [platform prerequisites](https://tauri.app/start/prerequisites/), including
  WebKitGTK 4.1 on Linux. Pure server builds do not need Tauri, GTK or WebKit;
  they still need native dependencies used by shared Rust libraries. The root
  `Dockerfile` lists the Linux server build packages used by this project.
- For mobile, the platform SDK/toolchain and the Go toolchain used for librclone.

Clone the application and install JavaScript dependencies:

```bash
git clone https://github.com/Zarestia-Dev/rclone-manager.git
cd rclone-manager
npm ci
```

## [[icon:folder.primary]] Rust layout

| Directory         | Responsibility                                                   | Cargo package           |
| ----------------- | ---------------------------------------------------------------- | ----------------------- |
| `backend/core`    | Shared settings, Rclone services, workflows and command contract | `rclone-manager-core`   |
| `backend/server`  | Tokio/Axum server and process startup                            | `rclone-manager-server` |
| `backend/desktop` | Tauri application, native integrations, mobile and packaging     | `rclone-manager`        |

`backend/Cargo.toml` defines the workspace and `backend/Cargo.lock` locks its
dependencies. The core package is a library, not an executable.

## [[icon:window.primary]] Desktop

```bash
npm run tauri dev
npm run tauri build
```

The development command starts Angular and Tauri. The build command prepares the
frontend and native packages. The executable is `rclone-manager` (`.exe` on Windows).

The npm wrapper sets the native project path to `backend/desktop` and the frontend
path to the repository root. You can keep invoking it from the repository root.

## [[icon:dns.primary]] Pure server

```bash
npm run build
npm run dev:server -- --host 127.0.0.1 --port 8080
```

This serves the built frontend at `http://127.0.0.1:8080`. `dev:server` runs Cargo;
it does not start Angular's development server or watch frontend changes.

For a release binary:

```bash
npm run build:server
# Equivalent:
cargo build --manifest-path backend/Cargo.toml -p rclone-manager-server --release
```

The executable and Cargo package are both named `rclone-manager-server`.
There is no need to run the core library separately.

The Rust build does not bundle the frontend. When deploying away from the source
tree, copy `dist/rclone-manager/browser/` as `browser/` and `resources/i18n/` as
`i18n/` beside the executable. See [server installation](installation-headless.md).

## [[icon:public.primary]] Server with native tray

```bash
npm run dev:headless
npm run build:headless
```

These select the native Tauri package with `web-server,tray,updater` and disabled
default features. They provide HTTP access plus native integrations and still
require native GUI dependencies. Tauri packages the executable as
`rclone-manager-headless` using `backend/desktop/tauri.conf.headless.json`.

## [[icon:construction.primary]] Other native variants

| Variant             | Development            | Build                                                                       |
| ------------------- | ---------------------- | --------------------------------------------------------------------------- |
| Portable            | `npm run dev:portable` | `npm run build:portable`                                                    |
| Flatpak integration | `npm run dev:flatpak`  | `npm run build:flatpak`                                                     |
| Android             | `npm run dev:android`  | `npm run tauri android build -- --features mobile -- --no-default-features` |

Flatpak integration enables the application adjustments; distribution packaging
still needs its own manifest and build process. The Android project remains under
`backend/desktop/gen/android` because desktop and mobile share the Tauri host.

## Outputs and build scripts

Outputs normally live in `backend/target/release/`. With `--target <triple>`, use
`backend/target/<triple>/release/`. Native installers are under `release/bundle/`.

- `core/build.rs` prepares and links librclone when enabled, and declares platform
  configuration flags.
- `desktop/build.rs` runs Tauri build setup and packages the Android shared library.
- The server needs no separate `build.rs`; Cargo builds its core dependency.

## Static checks

From the repository root:

```bash
cargo fmt --manifest-path backend/Cargo.toml --all -- --check
cargo clippy --manifest-path backend/Cargo.toml -p rclone-manager-server -- -D warnings
cargo clippy --manifest-path backend/Cargo.toml -p rclone-manager -- -D warnings
```

Use `LIBRCLONE_SKIP_LINK_CHECK=1` for static mobile checks when the Go library is
unavailable. This does not validate linking, packaging or device behavior.
Do not run `cargo update` merely to resolve a moved-directory error; use the
workspace manifest path and check the reported dependency or toolchain problem.
