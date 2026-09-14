import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Docs } from './features/docs/components/docs/docs';
import { Downloads } from './features/downloads/downloads';
import { RoadmapPage } from './features/roadmap/roadmap-page';
import { CommunityPage } from './features/community/community';

export const routes: Routes = [
  { path: '', component: Home, title: 'RClone Manager' },
  { path: 'architecture', redirectTo: 'docs/architecture', pathMatch: 'full' },
  { path: 'docs', component: Docs, title: 'Docs · RClone Manager' },
  { path: 'docs/:slug', component: Docs, title: 'Docs · RClone Manager' },
  { path: 'downloads', component: Downloads, title: 'Downloads · RClone Manager' },
  { path: 'roadmap', component: RoadmapPage, title: 'Roadmap · RClone Manager' },
  { path: 'community', component: CommunityPage, title: 'Community · RClone Manager' },
  { path: '**', redirectTo: '' },
];
