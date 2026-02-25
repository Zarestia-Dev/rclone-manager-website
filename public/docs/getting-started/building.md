# [[icon:build.primary]] Building from Source

This guide explains how to set up your development environment and compile **RClone Manager** from source code. The project is built using a modern stack featuring **Angular v21** and **Tauri v2**.

## [[icon:list.primary]] Prerequisites

Before you begin, ensure you have the following installed:

1.  [[icon:code.primary]] **Node.js (v20+)**: Required for Angular v21. [Download Node.js](https://nodejs.org/)
2.  [[icon:terminal.primary]] **Rust (Latest Stable)**: Required for the Tauri backend.
    ```bash
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    ```
3.  [[icon:settings.primary]] **OS Dependencies**:
    - **Windows**: Microsoft Visual Studio C++ Build Tools.
    - **Linux**: WebKit2GTK and base build tools (`build-essential`, `libwebkit2gtk-4.0-dev`, `libssl-dev`, etc.).
    - **macOS**: Xcode Command Line Tools (`xcode-select --install`).

> [[icon:info.accent]] For a complete list of Tauri prerequisites, see the [Tauri Guides](https://tauri.app/start/prerequisites/).

---

## [[icon:bolt.primary]] Quick Start (Standard Desktop)

If you just want to build the standard desktop application:

### 1. Clone the Repository

```bash
git clone https://github.com/Zarestia-Dev/rclone-manager.git
cd rclone-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run in Development Mode

This starts the Angular frontend and the Tauri backend with hot-reload enabled.

```bash
npm run tauri dev
```

### 4. Production Build

To compile a minimized, optimized binary for your current machine:

```bash
npm run tauri build
```

_Outputs: `src-tauri/target/release/`_

---

## [[icon:construction.primary]] Advanced Build Configurations

RClone Manager supports different "Flavors" (Headless, Portable, Flatpak) using **Cargo Features** and specific configuration files. We have provided shorthand scripts in `package.json` for convenience.

### [[icon:public.primary]] Headless Mode

Builds the server-only version (no GUI window) that runs in a terminal and serves the UI via HTTP/HTTPS.

- **Features**: Enables `web-server` and `updater`.
- **Scripts**:

  ```bash
  # Development
  npm run dev:headless

  # Production Build
  npm run build:headless
  ```

### [[icon:dataset.primary]] Portable Mode (Windows and Linux)

Builds a self-contained executable that stores data locally alongside the executable.

- **Features**: Enables `portable`.
- **Scripts**:

  ```bash
  # Development
  npm run dev:portable

  # Production Build
  npm run build:portable
  ```

### [[icon:terminal.primary]] Flatpak Version (Linux)

Builds with specific adjustments for the Flatpak sandboxed environment.

- **Features**: Enables `flatpak`.
- **Scripts**:

  ```bash
  # Development
  npm run dev:flatpak

  # Production Build
  npm run build:flatpak
  ```

---

## [[icon:bug_report.primary]] Troubleshooting Build Errors

- **Rust Errors**: Run `cargo update` inside the `src-tauri` folder to ensure dependencies are fresh.
- **WebView2 (Windows)**: Ensure you have the WebView2 runtime installed.
- **Pkg-config (Linux)**: If the build fails on Linux, you are likely missing a system library (check for `librsvg`, `libappindicator3`, or `webkit2gtk`).

---

<small>Documentation updated for RClone Manager v0.2.2+ using Angular v21.</small>
