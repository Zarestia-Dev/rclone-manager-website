export interface DocItem {
  title: string;
  description?: string;
  url: string;
  isExternal?: boolean;
  icon?: string;
  type?: 'primary' | 'accent' | 'warn' | 'basic';
}

export interface DocSection {
  title: string;
  icon: string;
  description: string;
  items: DocItem[];
}

export const QUICK_LINKS: DocItem[] = [
  {
    title: 'Latest Releases',
    icon: 'download',
    url: 'https://github.com/Zarestia-Dev/rclone-manager/releases',
    isExternal: true,
    type: 'primary',
  },
  {
    title: 'Wiki',
    icon: 'menu_book',
    url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki',
    isExternal: true,
    type: 'accent',
  },
  {
    title: 'rclone.org',
    icon: 'cloud',
    url: 'https://rclone.org/',
    isExternal: true,
    type: 'basic',
  },
  {
    title: 'Discussions',
    icon: 'forum',
    url: 'https://github.com/Zarestia-Dev/rclone-manager/discussions',
    isExternal: true,
    type: 'basic',
  },
];

export const DOC_SECTIONS: DocSection[] = [
  {
    title: 'Getting Started',
    icon: 'rocket_launch',
    description: 'Everything you need to get up and running',
    items: [
      {
        title: 'Installation',
        description: 'How to install RClone Manager on your system',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki/Installation',
        isExternal: true,
      },
      {
        title: 'Configuration',
        description: 'Initial setup and linking your rclone remotes',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki/Configuration',
        isExternal: true,
      },
      {
        title: 'Building from Source',
        description: 'Instructions for developers and packagers',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki/Building',
        isExternal: true,
      },
    ],
  },
  {
    title: 'User Guide',
    icon: 'menu_book',
    description: 'Learn how to use RClone Manager effectively',
    items: [
      {
        title: 'Usage Guide',
        description: 'Learn how to manage remotes, run sync/copy jobs, and more',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki/Usage',
        isExternal: true,
      },
      {
        title: 'Tips & Tricks',
        description: 'Advanced techniques and best practices',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki/Tips-and-Tricks',
        isExternal: true,
      },
      {
        title: 'Integrations',
        description: 'How to integrate with other tools and services',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki/Integrations',
        isExternal: true,
      },
    ],
  },
  {
    title: 'Platform Specific',
    icon: 'computer',
    description: 'Platform-specific installation and troubleshooting',
    items: [
      {
        title: 'Windows Installation',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki/Installation-Windows',
        isExternal: true,
      },
      {
        title: 'macOS Installation',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki/Installation-macOS',
        isExternal: true,
      },
      {
        title: 'Linux Installation',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki/Installation-Linux',
        isExternal: true,
      },
    ],
  },
  {
    title: 'Support',
    icon: 'help',
    description: 'Get help when you need it',
    items: [
      {
        title: 'Troubleshooting',
        description: 'Fix common problems across platforms',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki/Troubleshooting',
        isExternal: true,
      },
      {
        title: 'FAQ',
        description: 'Frequently asked questions',
        url: '/faq',
      },
      {
        title: 'GitHub Discussions',
        description: 'Community support and discussions',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/discussions',
        isExternal: true,
      },
    ],
  },
  {
    title: 'Development',
    icon: 'code',
    description: 'Resources for contributors and developers',
    items: [
      {
        title: 'Contributing',
        description: 'How to get involved with development',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/blob/master/CONTRIBUTING.md',
        isExternal: true,
      },
      {
        title: 'License',
        description: 'Open-source licensing details',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki/License',
        isExternal: true,
      },
      {
        title: 'GitHub Repository',
        url: 'https://github.com/Zarestia-Dev/rclone-manager',
        isExternal: true,
      },
    ],
  },
];
