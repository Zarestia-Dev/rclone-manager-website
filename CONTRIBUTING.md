# Contributing to RClone Manager Website

First off, thank you for considering contributing to the RClone Manager website! It's people like you that make the open-source community such an amazing place.

## 🚀 Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/YOUR_USERNAME/rclone-manager-website.git
    cd rclone-manager-website
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Run the development server**:
    ```bash
    npm start
    ```

## ✍️ Contributing to Documentation

Most contributions will likely be in the form of updated or new documentation.

### Documentation Files

All documentation is located in the `public/docs/` directory as Markdown files.

- To add a new page, create a `.md` file in the appropriate subdirectory.
- Update `public/docs/sidebar.md` to include your new page in the navigation.

### 🖼️ Adding Images

When adding images to documentation:

1.  Place the image file in `public/docs/assets/`.
2.  Reference it in your Markdown using a relative path:
    `![Alt Text](../assets/my-image.png)`

### 🎨 Custom Icon Renderer

We have a special renderer that allows you to use **Material Icons** directly in your Markdown content. This keeps our docs consistent with the app's UI.

**Syntax**: `[[icon:icon_name.color]]`

| Category    | Example                         | Renders as              |
| :---------- | :------------------------------ | :---------------------- |
| **Basic**   | `[[icon:description]]`          | Default color icon      |
| **Primary** | `[[icon:sync.primary]]`         | Theme primary (Green)   |
| **Accent**  | `[[icon:bolt.accent]]`          | Theme accent (Blue)     |
| **Success** | `[[icon:check_circle.success]]` | Green success icon      |
| **Warning** | `[[icon:report_problem.warn]]`  | Orange/Red warning icon |

_You can find all available icon names on the [Material Symbols & Icons](https://fonts.google.com/icons) gallery._

## 🛠️ Code Contributions

If you're looking to contribute code to the frontend:

- We use **Angular 21** with standalone components.
- Styling is done via **Vanilla CSS/SCSS** with a custom Adwaita theme.
- Follow the existing project structure and coding style.

## 🤝 Community

- 🐛 [Report Bugs](https://github.com/Zarestia-Dev/rclone-manager/issues)
- 💬 [Join Discussions](https://github.com/Zarestia-Dev/rclone-manager/discussions)

Thank you for your help!
