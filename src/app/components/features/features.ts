import { Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ModeService } from '../../services/mode.service';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-features',
  imports: [
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './features.html',
  styleUrl: './features.scss'
})
export class Features {
  private modeService = inject(ModeService);

  private readonly desktopFeatures: Feature[] = [
    {
      icon: 'dns',
      title: 'Mount Control',
      description: 'Mount any cloud storage as a local drive. Access your remote files just like they were on your computer.'
    },
    {
      icon: 'analytics',
      title: 'Job Watcher',
      description: 'Monitor active transfers, sync jobs, and bandwidth usage in real-time with detailed progress tracking.'
    },
    {
      icon: 'router',
      title: 'Serve Control',
      description: 'Serve your remote files via HTTP, WebDAV, FTP, or DLNA to other devices on your network.'
    },
    {
      icon: 'devices',
      title: 'Cross-Platform',
      description: 'Native support for Windows, macOS, and Linux (including ARM64). One consistent experience everywhere.'
    },
    {
      icon: 'cloud_queue',
      title: 'Multi-Cloud Support',
      description: 'Connect to over 70 storage providers including Google Drive, S3, Dropbox, OneDrive, and many more.'
    },
    {
      icon: 'schedule',
      title: 'Task Scheduler',
      description: 'Automate your backups and synchronizations with built-in scheduling tools. Set it and forget it.'
    }
  ];

  private readonly headlessFeatures: Feature[] = [
    {
      icon: 'language',
      title: 'Web Dashboard',
      description: 'Access the full power of RClone Manager from any browser. Perfect for remote management of your NAS or VPS.'
    },
    {
      icon: 'analytics',
      title: 'Server Monitoring',
      description: 'Monitor active transfers, sync jobs, and resource usage on your headless server in real-time.'
    },
    {
      icon: 'router',
      title: 'Network Services',
      description: 'Turn your server into a media hub. Serve files via HTTP, WebDAV, FTP, or DLNA to your local network.'
    },
    {
      icon: 'dns',
      title: 'Remote Mount',
      description: 'Mount cloud storage directly to your server\'s filesystem. seamless integration with other server apps.'
    },
    {
      icon: 'speed',
      title: 'Lightweight',
      description: 'Optimized for performance. Runs efficiently on low-resource devices like Raspberry Pi and small VPS instances.'
    },
    {
      icon: 'settings_suggest',
      title: 'Automated Tasks',
      description: 'Schedule recurring backups and sync jobs to run automatically in the background, 24/7.'
    }
  ];

  features = computed(() => {
    return this.modeService.currentMode() === 'headless' ? this.headlessFeatures : this.desktopFeatures;
  });
}
