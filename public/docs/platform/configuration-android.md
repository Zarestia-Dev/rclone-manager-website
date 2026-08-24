# [[icon:android.primary]] Android Configuration (Beta)

RClone Manager is currently in **Beta** for mobile platforms (Android and iOS). It runs using an in-process Go library (`librclone`) via FFI bindings instead of executing a standalone binary.

---

## [[icon:visibility.primary]] Overview

The Android version of RClone Manager brings powerful cloud storage management directly to your mobile device. Because Android applications run in a highly sandboxed SELinux environment (`untrusted_app`), there are platform-specific capabilities and limitations compared to the desktop version.

> [!NOTE]
> **Device Testing & Platform Status:**
>
> - **Android**: Tested and verified on a Samsung Galaxy S23 FE model.
> - **iOS**: Status is currently unknown / unverified as an Apple device is not available for testing.

> [!TIP]
> **Android Beta APK Downloads:**
> Architecture-separated APK packages (**arm64-v8a**, **armeabi-v7a**, **x86_64**, **x86**) are available on the [GitHub Releases Page](https://github.com/Zarestia-Dev/rclone-manager/releases/latest).

---

## [[icon:done_all.success]] What Works

### Remote Management

- **Add / Edit / Delete**: Full CRUD support for all remote storage configurations.
- **Seamless OAuth Authentication**: Linking accounts for cloud providers (like Google Drive, OneDrive, Dropbox) works natively. The authentication flow redirects back to the app using the custom deep link scheme `rclone-manager://oauth`.
- **Remote Instance Connections**: You can connect the app to remote Rclone instances running on separate machines, servers, or headless setups to control them dynamically from the interface.

### Operations & Transfers

- **File Transfers**: Sync, Copy, and Move operations run natively in the background.
- **Server Exposure (Serve)**: Exposing remotes via **WebDAV**, **SFTP**, **FTP**, and **HTTP** works completely. You can run local servers inside the app to stream or share files.

### System Sharing & Android Integration

- **Storage Access Framework (SAF) Integration**: Comprehensive SAF support for Android devices.
  - **SAF Remote & Tree Picker**: Allows selecting and authorizing local storage folders, SD cards, and USB OTG drives via native Android SAF tree picker intents (`ACTION_OPEN_DOCUMENT_TREE`).
  - **Android DocumentsProvider**: Added `RcloneDocumentsProvider` to expose mounted Rclone remotes directly to external Android apps and system file pickers as a native storage provider.
  - **SAF VFS Mount Bridge**: In-process virtual filesystem bridge enabling SAF storage provider access without requiring FUSE or root privileges.
  - **Android Background Keep-Alive & Boot Receiver**: Added `RcloneKeepAliveService` for persistent background mounts and `ResumeUploadsBootReceiver` for boot initialization.
- **Share to App (Receive Shared Files & Text)**: Share files, text, or links directly from external Android applications (like Gallery, Files, Chrome, or Telegram) into RClone Manager via the Android system share target (`ACTION_SEND` & `ACTION_SEND_MULTIPLE`). Incoming content is received instantly and ready to upload to any cloud remote.
- **Share from App (Send Content)**: Share remote files directly from the RClone Manager file manager to external Android apps (such as WhatsApp, Telegram, Email, or Google Drive) using the native Android share sheet (`ACTION_SEND` via secure `FileProvider` `content://` URIs).
- **Open in System Default Apps**: Open files directly in external Android media players, PDF readers, or document editors (`ACTION_VIEW`).

---

## [[icon:warning.error]] Limitations & Mount Workarounds

### FUSE Mounting & SAF Bridge

Traditional directory mounting (`mount` syscall to local filesystem directories) is **not supported on non-rooted Android devices** because Android restricts access to `/dev/fuse` for standard user-space apps.

- **Storage Access Framework (SAF) Mount Bridge**: To work around this, RClone Manager provides an in-process SAF VFS Mount Bridge (`RcloneDocumentsProvider`). This allows external Android file managers and apps to read and write directly to your cloud remotes via Android's native Documents UI, without requiring FUSE or root access.
- **Recommended Workaround (Network Servers)**: You can also start a **WebDAV** or **SFTP** server in RClone Manager (e.g. listening on `127.0.0.1:8080`) and connect using third-party Android file managers (such as _Cx File Explorer_ or _Solid Explorer_).

### Updates are Unsupported on Mobile

Checking for and installing **both application updates and Rclone binary updates** is not supported on mobile platforms.

---

## [[icon:code.primary]] Custom rclone patches in FFI (Upstream PRs Pending)

During compilation of the `librclone` C-shared library, RClone Manager dynamically stages and injects custom Go patch files from the [src-tauri/librclone_patches](https://github.com/Zarestia-Dev/rclone-manager/tree/master/src-tauri/librclone_patches) directory to extend standard rclone FFI behavior:

> [!INFO]
> **Upstream Integration & Lifecycle:**
> All patches are located in the [src-tauri/librclone_patches](https://github.com/Zarestia-Dev/rclone-manager/tree/master/src-tauri/librclone_patches) folder. These custom extensions are temporary; once proper native support for these RPC endpoints and features is submitted and merged upstream into official Rclone PRs, these local patches will be removed.

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
