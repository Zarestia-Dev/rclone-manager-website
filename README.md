# RClone Manager Website

Official website for RClone Manager – docs, downloads, and project info.

Built with Angular 21 and Angular Material, featuring the same custom Adwaita theme from the desktop application.

## 🚀 Live Site

Visit: [https://zarestia-dev.github.io/rclone-manager/](https://zarestia-dev.github.io/rclone-manager/)

## 📦 Features

- **Modern Angular 21** with standalone components
- **Angular Material** with custom Adwaita theme
- **Fully responsive** design (mobile, tablet, desktop)
- **Smooth animations** and transitions
- **Lazy-loaded routes** for optimal performance
- **GitHub Pages** deployment via GitHub Actions

## 🛠️ Development

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Installation

```bash
npm install
```

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

### Build

```bash
npm run build
```

Build artifacts will be stored in the `dist/` directory.

### Publish to GitHub Pages

```bash
ng deploy --repo=https://github.com/Zarestia-Dev/rclone-manager.git
```

## 📁 Project Structure

```
src/
├── app/
│   ├── components/       # Reusable components (navbar, hero, features, footer)
│   ├── pages/           # Page components (home, docs, downloads, faq, contact)
│   ├── app.routes.ts    # Route configuration
│   └── app.ts           # Root component
├── animations.scss       # Animation utilities
├── custom-theme.scss     # Material theme from desktop app
└── index.html           # HTML template
```

## 🎨 Theme

The website uses the same custom Adwaita theme as the RClone Manager desktop application, including:

- Custom color palette (Green primary, Blue accent)
- Custom spacing and border radius scales
- Light/dark theme support
- Material Design 3 components

## 🚢 Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch via GitHub Actions.

## 🤝 Contributing

We welcome contributions of all kinds! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started, especially regarding documentation and our custom icon system.

## 📝 Adding Content

### Docs Page

Documentation is managed via Markdown files in the `public/docs/` directory.

- Edit existing `.md` files or add new ones.
- Update `public/docs/sidebar.md` to update the navigation menu.
- Use `[[icon:name]]` syntax for inline Material Icons (see [CONTRIBUTING.md](CONTRIBUTING.md) for details).

### Static Pages

For other pages, edit the corresponding components in `src/app/pages/`.

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
