export interface HeroModeContent {
  title: string;
  subtitle: string;
  techStack: string;
}

export interface HeroAction {
  label: string;
  icon: string;
  /** Router path. Use '' for the home route. */
  path: string;
  type: 'primary' | 'accent';
}

export const HERO_CONTENT = {
  desktop: {
    title: 'RClone Manager',
    subtitle: 'A powerful, cross-platform GUI for managing Rclone remotes with style and ease.',
    techStack: 'Built with Angular 21 + Tauri · Linux • Windows • macOS • ARM Support',
  } as HeroModeContent,
  headless: {
    title: 'RClone Manager Headless',
    subtitle: 'Run as a web server on Linux servers without a GUI!',
    techStack: 'Perfect for NAS, VPS, and remote systems. Official Docker support with security profiles.',
  } as HeroModeContent,
  actions: [
    {
      label: 'Download Now',
      icon: 'download',
      path: 'downloads',
      type: 'primary',
    },
    {
      label: 'View Documentation',
      icon: 'description',
      path: 'docs',
      type: 'accent',
    },
  ] as HeroAction[],
  scrollText: 'More Info',
};
