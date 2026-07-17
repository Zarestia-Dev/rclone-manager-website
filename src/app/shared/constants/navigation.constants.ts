export interface NavLink {
  label: string;
  /** Router path. Use '' for the home route. */
  path: string;
  icon?: string;
}

export interface ExternalLink {
  label: string;
  url: string;
  icon: string;
}

export interface SocialLink {
  label: string;
  url: string;
  icon: string;
  type?: 'primary' | 'accent' | 'warn';
}

/** In-app navigation links rendered in the navbar and footer. Map to Router paths. */
export const NAV_LINKS: NavLink[] = [
  { label: 'Home', path: '', icon: 'home' },
  { label: 'Docs', path: 'docs', icon: 'menu_book' },
  { label: 'Downloads', path: 'downloads', icon: 'download' },
  { label: 'Roadmap', path: 'roadmap', icon: 'map' },
  { label: 'Community', path: 'community', icon: 'groups' },
];

/**
 * External links rendered in the navbar only. These open in a new tab and are
 * not part of the in-app router navigation.
 */
export const EXTERNAL_NAV_LINKS: ExternalLink[] = [
  {
    label: 'Support Us',
    url: 'https://hakanismail.info/zarestia/support',
    icon: 'volunteer_activism',
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'GitHub',
    url: 'https://github.com/Zarestia-Dev/rclone-manager',
    icon: 'code',
    type: 'primary',
  },
  {
    label: 'Report Issue',
    url: 'https://github.com/Zarestia-Dev/rclone-manager/issues',
    icon: 'bug_report',
    type: 'warn',
  },
];
