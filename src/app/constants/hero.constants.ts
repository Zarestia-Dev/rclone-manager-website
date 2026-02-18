import { AppTab } from '../services/tab.service';

export interface HeroModeContent {
  title: string;
  subtitle: string;
  techStack: string;
}

export interface HeroAction {
  label: string;
  icon: string;
  tab: AppTab;
  type: 'primary' | 'accent';
}

export const HERO_CONTENT = {
  desktop: {
    title: 'RClone Manager',
    subtitle: 'A powerful, cross-platform GUI for managing Rclone remotes with style and ease.',
    techStack: 'Built with Angular 20 + Tauri · Linux • Windows • macOS • ARM Support',
  } as HeroModeContent,
  headless: {
    title: 'RClone Manager Headless',
    subtitle: 'Run as a web server on Linux servers without a GUI!',
    techStack: 'Perfect for NAS, VPS, and remote systems. Access from any browser.',
  } as HeroModeContent,
  actions: [
    {
      label: 'Download Now',
      icon: 'download',
      tab: 'downloads',
      type: 'primary',
    },
    {
      label: 'View Documentation',
      icon: 'description',
      tab: 'docs',
      type: 'accent',
    },
  ] as HeroAction[],
  scrollText: 'More Info',
};
