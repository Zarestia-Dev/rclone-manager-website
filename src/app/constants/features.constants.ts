export interface Feature {
  title: string;
  icon: string;
  description: string;
}

export const DESKTOP_FEATURES: Feature[] = [
  {
    title: 'Mount Control',
    icon: 'folder_open',
    description: 'Mount remote storages as local drives. Seamlessly access your cloud files directly from your file explorer.',
  },
  {
    title: 'Job Watcher',
    icon: 'visibility',
    description: 'Monitor ongoing operations in real-time. Track upload/download progress, speeds, and errors instantly.',
  },
  {
    title: 'Serve Control',
    icon: 'share',
    description: 'Easily serve your remotes over HTTP, FTP, WebDAV, or DLNA. Share content on your local network with one click.',
  },
  {
    title: 'Task Scheduler',
    icon: 'schedule',
    description: 'Automate your backups and sync jobs. Create recurring tasks with cron expressions or simple intervals.',
  },
  {
    title: 'Remote Explorer',
    icon: 'cloud',
    description: 'Browse and manage files on your cloud storage without mounting. Upload, download, and organize files directly.',
  },
  {
    title: 'Cross Platform',
    icon: 'devices',
    description: 'Native experience on Windows, macOS, and Linux. Consistent interface and performance across all systems.',
  },
];

export const HEADLESS_FEATURES: Feature[] = [
  {
    title: 'Web Dashboard',
    icon: 'dashboard',
    description: 'Full-featured web interface to manage rclone from any browser. Control your server remotely with ease.',
  },
  {
    title: 'Server Monitoring',
    icon: 'analytics',
    description: 'Keep track of your server status, bandwidth usage, and active connections through detailed charts.',
  },
  {
    title: 'Remote Access',
    icon: 'dns',
    description: 'Access your storage securely from anywhere. Configure remote control with authentication and SSL support.',
  },
  {
    title: 'Background Jobs',
    icon: 'work_history',
    description: 'Run long-running sync and copy operations in the background. Close the browser and let the server do the work.',
  },
  {
    title: 'Docker Ready',
    icon: 'layers',
    description: 'Deploy instantly with our official Docker image. Perfect for NAS, home servers, and cloud deployments.',
  },
  {
    title: 'API Integration',
    icon: 'api',
    description: 'Extensible REST API for custom integrations. Build your own tools or scripts on top of RClone Manager.',
  },
];
