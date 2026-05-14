# Dynamic Paths & Macros (Digital Time Travel)

Static paths are predictable, reliable, and—let's be honest—a bit boring. Sometimes you want your backups to have a personality, or at least a timestamp so you know exactly which version of your "Very Important Homework" folder you're looking at.

RClone Manager supports **Macro Interpolation**, allowing you to inject dynamic system information and timestamps directly into your destination paths and configuration options.

---

## 🗂️ Supported Syntax

You have two ways to tell RClone Manager that a string is a macro and not just a very strangely named folder:

1.  **Shell Style (Recommended):** `$(macro)`
2.  **Backtick Style:** `` `macro` ``

For example, `Backups/$(date)` and `` Backups/`date` `` will both result in the same glorious, date-stamped folder.

---

## 🛠️ Available Macros

RClone Manager has curated a selection of safe macros that provide the most utility without the messy risks of arbitrary shell execution.

### 1. Date and Time

The most common use case. By default, the `date` macro uses the `YYYY-MM-DD` format.

- **`$(date)`**: Expands to the current date (e.g., `2024-05-13`).
- **`$(date +FORMAT)`**: Allows for custom `strftime` formatting.
  - `$(date +%Y-%m-%d_%H%M)` ➔ `2024-05-13_1430`
  - `$(date +%A)` ➔ `Monday` (Perfect for weekly rotations)
  - `$(date +%Y/%m/%d)` ➔ `2024/05/13` (Creates nested subdirectories)

### 2. System Information

Useful if you are running the same configuration across multiple machines or users.

- **`$(hostname)`**: The name of your computer.
- **`$(user)`** or **`$(whoami)`**: The current system username.
- **`$(os)`**: The operating system (e.g., `linux`, `windows`, `macos`).

---

## 📋 Full List of Supported Macros

| Macro             | Description                        | Example Output |
| :---------------- | :--------------------------------- | :------------- |
| `date`            | Current date (`YYYY-MM-DD`)        | `2024-05-13`   |
| `date +FORMAT`    | Date with custom `strftime` format | `14:30:05`     |
| `hostname`        | System hostname                    | `my-laptop`    |
| `user` / `whoami` | Current username                   | `zarestia`     |
| `os`              | Operating system name              | `linux`        |

---

## 🚀 Practical Examples

### The "Daily Snapshot"

If you want a fresh folder for every sync job to keep your history intact:

- **Destination Path:** `MyCloud:Backups/$(date +%Y-%m-%d)`

### The "Multi-Machine Backup"

Syncing several computers to the same remote account? Prevent them from overwriting each other:

- **Destination Path:** `MyCloud:Archives/$(hostname)/$(user)`

### The "Deep Archive"

Organize your files by year and month automatically:

- **Destination Path:** `MyCloud:History/$(date +%Y)/$(date +%m)/$(date +%d)`

---

## ⚠️ Important Considerations

- **Execution Time:** Macros are resolved at the **exact moment** the command (Sync, Copy, Mount, etc.) is executed.
- **Safe Execution:** These macros are handled internally by RClone Manager's backend. We do not actually spawn a shell process to run `date` or `whoami`, which keeps your system secure.
- **Unknown Macros:** If you type something I don't recognize, like `$(coffee)`, RClone Manager will simply leave it as-is. It will not attempt to brew you a drink, unfortunately.
- **Case Sensitivity:** Macros are generally lowercase. Stick to the list above for the best results.

---

## 💡 Missing a Macro?

If you have a specific use case that requires a new macro, feel free to **[open a GitHub Issue](https://github.com/Zarestia-Dev/rclone-manager/issues)**. I am always looking for ways to make RClone Manager even more flexible for your power-user workflows.

---

### Related Documentation

- [Remote Management](remote-management.md)
- [Mounting Drives](mounting.md)
- [Sync and Transfer](https://github.com/Zarestia-Dev/rclone-manager/wiki/Sync-and-Transfer)
