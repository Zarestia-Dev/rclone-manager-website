# [[icon:android.primary]] Android Configuration (Beta)

RClone Manager is currently in **Beta** for mobile platforms (Android and iOS). It runs using an in-process Go library (`librclone`) via FFI bindings instead of executing a standalone binary.

---

## [[icon:visibility.primary]] Overview

The Android version of RClone Manager brings powerful cloud storage management directly to your mobile device. Because Android applications run in a highly sandboxed SELinux environment (`untrusted_app`), there are platform-specific capabilities and limitations compared to the desktop version.

---

## [[icon:done_all.success]] What Works

### Remote Management

- **Add / Edit / Delete**: Full CRUD support for all remote storage configurations.
- **Seamless OAuth Authentication**: Linking accounts for cloud providers (like Google Drive, OneDrive, Dropbox) works natively. The authentication flow redirects back to the app using the custom deep link scheme `rclone-manager://oauth`.
- **Remote Instance Connections**: You can connect the app to remote Rclone instances running on separate machines, servers, or headless setups to control them dynamically from the interface.

### Operations & Transfers

- **File Transfers**: Sync, Copy, and Move operations run natively in the background.
- **Server Exposure (Serve)**: Exposing remotes via **WebDAV**, **SFTP**, **FTP**, and **HTTP** works completely. You can run local servers inside the app to stream or share files.

---

## [[icon:warning.error]] Limitations & Mount Workarounds

### FUSE Mounting is Not Supported

Traditional directory mounting (e.g., mapping a cloud drive to a local directory) is **not supported on non-rooted Android devices**.

- **Reason:** Android blocks the mount syscall and restricts access to `/dev/fuse` for standard user-space apps due to SELinux permissions. Additionally, utilities like `fusermount` or `fusermount3` do not exist in the Android environment.

### Recommended Workaround: Serve WebDAV

To browse your cloud storage files in other Android apps or file managers:

1. In RClone Manager, select your remote and click **Serve**.
2. Start a **WebDAV** or **SFTP** server (e.g., listening on `127.0.0.1:8080`).
3. Open any Android file manager that supports network locations (such as _Cx File Explorer_, _Solid Explorer_, or _FX File Explorer_).
4. Add a new network storage location using the WebDAV/SFTP address and credentials provided by RClone Manager.

### Updates are Unsupported on Mobile

Checking for and installing **both application updates and Rclone binary updates** is not supported on mobile platforms.

---

## [[icon:code.primary]] Custom rclone patches in FFI (These are gonna be open PR to Rclone in future)

During compilation of the `librclone` C-shared library, RClone Manager dynamically injects a custom Go file ([imports.go](file:///home/hakan/Documents/GitHub/rclone-manager/src-tauri/build.rs#L226-L408)) to patch or extend standard rclone FFI behavior:

- **Config Encryption Detection (`config/isencrypted` RPC):** Registers a custom endpoint to allow the GUI to query if the local configuration is encrypted before accessing it.
- **Config Encryption (`config/encrypt` RPC):** Registers a custom endpoint to encrypt the configuration in-process.
- **Config Decryption (`config/decrypt` RPC):** Registers a custom endpoint to remove password protection and decrypt the configuration in-process.
- **Config Password Validation (`config/validatepassword` RPC):** Registers a custom endpoint to safely validate a candidate password against the encrypted config file. Unlike the built-in `config/unlock` — which only hashes and stores the password in-memory without ever checking if it is correct — this endpoint reads the config file directly, derives the key via `SHA256("[password][rclone-config]")`, and attempts a real `secretbox.Open` decryption. It returns a structured error (`"wrong password: decryption failed"`) on failure rather than silently succeeding and causing a panic later when `LoadedData()` tries to decrypt the file inside an RC job context. On success it also activates the key in-memory, so no separate `config/unlock` call is required afterwards.
- **Native In-Process Archive Endpoint (`operations/archive` RPC):** Registers a custom endpoint to perform `create`, `extract`, and `list` operations directly in Go using rclone's internal archive packages (`cmd/archive/create`, `cmd/archive/extract`, `cmd/archive/list`). This bypasses Cobra CLI parsing, avoids process-level stdout hijacking, and automatically excludes target archive files created inside source directories to eliminate infinite self-archiving loops.
- **Native In-Process CryptCheck Endpoint (`operations/cryptcheck` RPC):** Registers a custom endpoint to verify the integrity of encrypted remotes directly in-process via Go FFI.
- **Native In-Process Cat Endpoint (`operations/cat` RPC):** Registers a custom endpoint to read remote file contents directly in-process without executing subprocesses or redirecting stdout.
- **Automatic Confirmation & Passwords:** Sets global options (`AskPassword = false` and `AutoConfirm = true`) to prevent Go FFI calls from locking/hanging on interactive terminal prompts.
- **Environment Sync (`RcloneSyncEnv`):** Exports a C function to synchronize environment variables between Rust/Tauri and the Go runtime.
- **DNS-over-HTTPS (DoH) Injection:** Specifically on Android, overrides the default net resolver to route all hostname lookups securely via HTTPS, bypassing system socket blocks on port 53.

---

## [[icon:settings.primary]] Technical Details (Under the Hood)

### 1. DNS-over-HTTPS (DoH) Resolver

On Android, apps are prevented from sending raw UDP packets to external DNS servers on port 53. To ensure network requests do not fail with `lookup: no such host` or `operation not permitted`, RClone Manager dynamically overrides Go's default network resolver with a built-in **DNS-over-HTTPS (DoH)** proxy.

- All DNS queries are transparently tunnelled as standard HTTPS POST requests (port 443) to secure DoH endpoints at `https://1.1.1.1/dns-query` (Cloudflare) and `https://8.8.8.8/dns-query` (Google).

### 2. Deep Link Registration

Tauri automatically configures the custom scheme intent-filters for Android and iOS using the scheme definitions in `tauri.conf.json`:

```json
"deep-link": {
  "mobile": [
    {
      "scheme": ["rclone-manager"],
      "appLink": false
    }
  ]
}
```

Tapping the **"Open RClone Manager"** button on the authentication success page opens `rclone-manager://oauth?status=success`, bringing the app back to the foreground to complete account creation.

---

## [[icon:build.primary]] Building from Source

To compile the Android application locally, your development machine must be configured for mobile cross-compilation.

### Prerequisites

1. **Go Compiler (1.20+):** Required to build the `librclone` FFI shared library.
2. **Android SDK & NDK:**
   - Ensure the Android SDK and NDK are installed (NDK version 26.x or newer is recommended).
   - Set the `ANDROID_HOME` environment variable to your Android SDK path.
   - Set the `NDK_HOME` environment variable to your Android NDK path (e.g., `/home/user/Android/Sdk/ndk/26.1.10909125`).
3. **Rust Targets:** Install the required Android targets using rustup:
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
   ```

### Compile Commands

To run the application in development mode with hot-reloading on a connected Android device or emulator:

```bash
npm run tauri android dev -- --features librclone -- --no-default-features
```

To build the debug APK package:

```bash
npm run tauri android build -- --debug --features librclone -- --no-default-features
```

Once built, the installer package will be generated at:
`src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk`
