# [[icon:keyboard.primary]] Centralized Keyboard Shortcuts

RClone Manager features a comprehensive, centralized keyboard shortcut engine across the desktop and web server interfaces. With context-aware shortcut handling, you can control application navigation, remote management, dual-pane file operations in Nautilus, and visual workflow canvas tasks without touching your mouse.

Press **`Ctrl + ?`** (or **`?`**) from anywhere in the application to summon the live interactive **Keyboard Shortcuts** modal.

---

<p align="center">
  <img src="../assets/keyboard-shortcuts.png" alt="Keyboard Shortcuts Modal" />
</p>

---

## [[icon:apps.primary]] Global Application Shortcuts

These shortcuts operate globally across all main views (Dashboard, Remote Overview, Mounts, Serves, and Job Watcher).

| Shortcut               | Action                     | Description                                                            |
| :--------------------- | :------------------------- | :--------------------------------------------------------------------- |
| **`Ctrl + Q`**         | **Quit Application**       | Gracefully shuts down background operations and exits the application. |
| **`Ctrl + ?`**         | **Show Shortcuts**         | Opens this interactive keyboard shortcuts cheat sheet.                 |
| **`Ctrl + ,`**         | **Open Preferences**       | Opens global settings, theme preferences, and system configuration.    |
| **`Ctrl + .`**         | **Open Flags**             | Opens the Rclone global flags and CLI argument manager.                |
| **`Ctrl + Alt + A`**   | **Alerts & Notifications** | Opens the Alert Rules and Notification Channels dashboard.             |
| **`Ctrl + Shift + M`** | **Force Check Mounts**     | Refreshes and validates active mount points and VFS states.            |
| **`Ctrl + Shift + S`** | **Force Check Serves**     | Refreshes active WebDAV, SFTP, HTTP, and FTP server instances.         |
| **`Ctrl + N`**         | **New Remote (Detailed)**  | Launches the comprehensive Detailed Remote creation modal.             |
| **`Ctrl + R`**         | **New Remote (Quick)**     | Launches the streamlined Quick Remote creation wizard.                 |
| **`Ctrl + I`**         | **Import Configuration**   | Opens the configuration import and restore modal.                      |
| **`Ctrl + E`**         | **Export Configuration**   | Opens the configuration backup and export modal.                       |
| **`Ctrl + B`**         | **Toggle File Browser**    | Opens or switches focus to the built-in Nautilus file explorer.        |
| **`Ctrl + Alt + F`**   | **Toggle Flow Workspace**  | Opens the Visual Workflow and Quick Runs automation canvas.            |
| **`Escape`**           | **Close Dialog / Modal**   | Closes the currently focused dialog, modal, or overlay.                |

---

## [[icon:folder_open.primary]] Nautilus File Browser Shortcuts

When working inside the built-in **Nautilus** dual-pane file explorer, the following shortcuts enable rapid cloud file management:

### Navigation & Tabs

| Shortcut                         | Action              | Description                                                            |
| :------------------------------- | :------------------ | :--------------------------------------------------------------------- |
| **`Enter`**                      | **Open Item**       | Opens the selected folder or opens file in the integrated File Viewer. |
| **`Backspace`** / **`Alt + Up`** | **Go Up**           | Navigates to the parent directory.                                     |
| **`Alt + Left`**                 | **History Back**    | Navigates to the previous visited folder in history.                   |
| **`Alt + Right`**                | **History Forward** | Navigates forward in folder navigation history.                        |
| **`Ctrl + L`**                   | **Focus Path Bar**  | Focuses the path breadcrumb bar for direct path entry.                 |
| **`Ctrl + T`**                   | **New Tab**         | Opens a new browsing tab in the active pane.                           |
| **`Ctrl + W`**                   | **Close Tab**       | Closes the currently active tab.                                       |
| **`Ctrl + Tab`**                 | **Next Tab**        | Switches to the next tab on the right.                                 |
| **`Ctrl + Shift + Tab`**         | **Previous Tab**    | Switches to the previous tab on the left.                              |
| **`Ctrl + Shift + T`**           | **Duplicate Tab**   | Clones the current tab and remote path into a new tab.                 |

### Dual-Pane Management

| Shortcut       | Action                 | Description                                                    |
| :------------- | :--------------------- | :------------------------------------------------------------- |
| **`Ctrl + /`** | **Toggle Split View**  | Toggles dual-pane split view for side-by-side remote browsing. |
| **`Ctrl + I`** | **Switch Active Pane** | Switches focus between the left and right file browsing panes. |

### File Operations & Clipboard

| Shortcut                  | Action                | Description                                                          |
| :------------------------ | :-------------------- | :------------------------------------------------------------------- |
| **`Ctrl + C`**            | **Copy**              | Copies selected files or folders to the virtual clipboard.           |
| **`Ctrl + X`**            | **Cut**               | Cuts selected files or folders for moving.                           |
| **`Ctrl + V`**            | **Paste**             | Pastes files from clipboard into the destination directory.          |
| **`Delete`**              | **Delete**            | Deletes or trashes the selected files or directories.                |
| **`Ctrl + A`**            | **Select All**        | Selects all items in the active directory view.                      |
| **`Ctrl + Shift + N`**    | **New Folder**        | Creates a new directory in the active path.                          |
| **`Ctrl + F`**            | **Search**            | Toggles live file search filtering in the current folder.            |
| **`Ctrl + H`**            | **Show Hidden Files** | Toggles visibility of hidden and dotfiles (`.*`).                    |
| **`Alt + Enter`**         | **Properties**        | Opens the detailed metadata and properties dialog for selected item. |
| **`F5`** / **`Ctrl + R`** | **Refresh**           | Reloads the remote directory listing from Rclone API.                |
| **`Escape`**              | **Close Browser**     | Closes the Nautilus file browser window.                             |

---

## [[icon:account_tree.primary]] Visual Workflow Canvas Shortcuts

When working in the visual **Flow** automation workspace:

| Shortcut                       | Action               | Description                                                           |
| :----------------------------- | :------------------- | :-------------------------------------------------------------------- |
| **`Ctrl + S`**                 | **Save Workflow**    | Persists current canvas nodes, triggers, tasks, and connection wires. |
| **`Delete`** / **`Backspace`** | **Delete Selection** | Removes the currently selected node(s) or connection wire(s).         |
| **`Escape`**                   | **Close Flow**       | Exits the flow overlay and returns to the main dashboard.             |

---

### Related Documentation

- [Visual Workflows](workflows.md)
- [Nautilus File Browser](remote-management.md#nautilus-file-browser)
- [Power Management & System Safety](power-management.md)
