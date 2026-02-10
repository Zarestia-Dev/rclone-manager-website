export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  isExpanded?: boolean;
}

export interface FaqCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface HelpLink {
  title: string;
  description: string;
  url: string;
  icon: string;
  type: 'primary' | 'accent' | 'warn';
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'all',
    name: 'All Questions',
    icon: 'help',
    description: 'View all frequently asked questions',
  },
  // Dynamic categories will be added at runtime
];

export const CATEGORY_CONFIGS: Record<string, Omit<FaqCategory, 'id'>> = {
  general: {
    name: 'General',
    icon: 'info',
    description: 'Basic questions about RClone Manager',
  },
  installation: {
    name: 'Installation',
    icon: 'download',
    description: 'Setup and installation guides',
  },
  configuration: {
    name: 'Configuration',
    icon: 'settings',
    description: 'Managing remotes and settings',
  },
  troubleshooting: {
    name: 'Troubleshooting',
    icon: 'build',
    description: 'Fixing common issues and errors',
  },
  features: {
    name: 'Features',
    icon: 'stars',
    description: 'Questions about specific features',
  },
  headless: {
    name: 'Headless Mode',
    icon: 'dns',
    description: 'Running RClone Manager on servers',
  },
};

export const HELP_LINKS: HelpLink[] = [
  {
    title: 'Documentation',
    description: 'Detailed guides and references',
    url: 'https://github.com/Zarestia-Dev/rclone-manager/wiki',
    icon: 'menu_book',
    type: 'primary',
  },
  {
    title: 'GitHub Issues',
    description: 'Report bugs or request features',
    url: 'https://github.com/Zarestia-Dev/rclone-manager/issues',
    icon: 'bug_report',
    type: 'warn',
  },
  {
    title: 'Discussions',
    description: 'Ask questions and share ideas',
    url: 'https://github.com/Zarestia-Dev/rclone-manager/discussions',
    icon: 'forum',
    type: 'accent',
  },
  {
    title: 'RClone Forum',
    description: 'Official RClone community support',
    url: 'https://forum.rclone.org/',
    icon: 'question_answer',
    type: 'primary',
  },
];

export const COMMUNITY_LINKS: HelpLink[] = [
  {
    title: 'Source Code',
    description: 'View the source code, star the project, and track development progress',
    url: 'https://github.com/Zarestia-Dev/rclone-manager',
    icon: 'code',
    type: 'primary',
  },
  {
    title: 'Contributing Guide',
    description: 'Learn how to contribute code, documentation, or translations',
    url: 'https://github.com/Zarestia-Dev/rclone-manager/main/CONTRIBUTING.md',
    icon: 'handshake',
    type: 'accent',
  },
  {
    title: 'Security',
    description: 'Report security vulnerabilities responsibly through GitHub',
    url: 'https://github.com/Zarestia-Dev/rclone-manager/security/advisories',
    icon: 'security',
    type: 'warn',
  },
  {
    title: 'Releases',
    description: 'View release notes, changelog, and download previous versions',
    url: 'https://github.com/Zarestia-Dev/rclone-manager/releases',
    icon: 'rocket_launch',
    type: 'primary',
  },
];

export const FAQ_MESSAGES = {
  ERROR_LOADING:
    'Failed to load FAQ data from GitHub Wiki. Please check your internet connection and try again.',
  LOADING_TITLE: 'Loading FAQ...',
  LOADING_DESC: 'Fetching the latest questions and answers from GitHub Wiki',
  NO_RESULTS_TITLE: 'No questions found',
  NO_RESULTS_DESC:
    'No questions match the selected category. Try selecting a different category or check our help links below.',
  ALL_QUESTIONS: 'All Questions',
  QUESTIONS: 'Questions',
};
