import { AppTab } from '../services/tab.service';

export interface NavLink {
  label: string;
  tab: AppTab;
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

/** In-app navigation tabs rendered in the navbar and footer. */
export const NAV_LINKS: NavLink[] = [
  { label: 'Home', tab: 'general', icon: 'home' },
  { label: 'Docs', tab: 'docs', icon: 'menu_book' },
  { label: 'Downloads', tab: 'downloads', icon: 'download' },
  { label: 'Roadmap', tab: 'roadmap', icon: 'map' },
  { label: 'Community', tab: 'community', icon: 'groups' },
];

/**
 * External links rendered in the navbar only. These open in a new tab and are
 * not part of the in-app tab navigation.
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
