import { AppTab } from '../services/tab.service';

export interface NavLink {
  label: string;
  tab: AppTab;
  icon?: string;
}

export interface SocialLink {
  label: string;
  url: string;
  icon: string;
  type?: 'primary' | 'accent' | 'warn';
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', tab: 'general', icon: 'home' },
  { label: 'Docs', tab: 'docs', icon: 'menu_book' },
  { label: 'Downloads', tab: 'downloads', icon: 'download' },
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
