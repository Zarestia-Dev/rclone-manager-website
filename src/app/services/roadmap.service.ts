import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { RoadmapItem, RoadmapData } from '../constants/roadmap.constants';
import { GithubService } from './github.service';

interface GraphQLFieldValue {
  name?: string;
  text?: string;
  field?: { name: string };
}

interface GraphQLItemContent {
  title?: string;
  body?: string;
  url?: string;
}

interface GraphQLProjectItem {
  fieldValues: { nodes: GraphQLFieldValue[] };
  content: GraphQLItemContent;
}

interface GraphQLResponse {
  data: {
    organization: {
      projectV2: {
        items: { nodes: GraphQLProjectItem[] };
      };
    };
  };
}

const ORG_NAME = 'Zarestia-Dev';
const PROJECT_NUMBER = 2;

const FALLBACK_ITEMS: RoadmapItem[] = [
  {
    title: 'Enhanced Remote Management',
    description: 'Improving the interface for creating, editing, and organizing remotes.',
    status: 'in-progress',
    priority: 'medium',
    category: 'Feature',
    timeline: 'Short-Term',
  },
  {
    title: 'Performance Optimization',
    description: 'Streamlining backend communication and reducing resource usage.',
    status: 'in-progress',
    priority: 'high',
    category: 'Backend',
    timeline: 'Long-Term',
  },
  {
    title: 'UI Enhancements',
    description: 'Refining layout, icons, and theming for a smoother experience.',
    status: 'in-progress',
    priority: 'medium',
    category: 'Design',
    timeline: 'Short-Term',
  },
  {
    title: 'Advanced Rclone Features',
    description: 'Implementing filters, Bisync, bandwidth limits, and scheduling.',
    status: 'in-progress',
    priority: 'high',
    category: 'Feature',
    timeline: 'Long-Term',
  },
  {
    title: 'Localization',
    description: 'Added multi-language support (Internationalization #70).',
    status: 'done',
    priority: 'high',
    category: 'Feature',
  },
  {
    title: 'Docker & Web UI',
    description: 'Support for RClone Manager Web UI and Docker environments (#10).',
    status: 'done',
    priority: 'high',
    category: 'Feature',
  },
];

const PROJECT_QUERY = `
  query($org: String!, $number: Int!) {
    organization(login: $org) {
      projectV2(number: $number) {
        items(first: 100) {
          nodes {
            fieldValues(first: 20) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field { ... on ProjectV2FieldCommon { name } }
                }
                ... on ProjectV2ItemFieldTextValue {
                  text
                  field { ... on ProjectV2FieldCommon { name } }
                }
              }
            }
            content {
              ... on Issue {
                title
                body
                url
              }
              ... on DraftIssue {
                title
                body
              }
            }
          }
        }
      }
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class RoadmapService {
  private github = inject(GithubService);

  fetchRoadmap(): Observable<RoadmapData> {
    if (!this.github.hasGraphqlAccess()) {
      console.log('No GitHub GraphQL access configured — using fallback roadmap data.');
      return of({
        lastUpdated: new Date().toISOString(),
        items: FALLBACK_ITEMS,
      });
    }

    return this.github
      .graphql<GraphQLResponse>(PROJECT_QUERY, { org: ORG_NAME, number: PROJECT_NUMBER })
      .pipe(
        map((response) => this.parseResponse(response)),
        catchError((err) => {
          console.error('Failed to fetch roadmap from GitHub:', err);
          return of({ lastUpdated: new Date().toISOString(), items: FALLBACK_ITEMS });
        }),
      );
  }

  private parseResponse(response: GraphQLResponse): RoadmapData {
    const nodes = response?.data?.organization?.projectV2?.items?.nodes || [];
    const items: RoadmapItem[] = [];

    for (const node of nodes) {
      const fieldValues = node.fieldValues?.nodes || [];
      const getField = (fieldName: string): GraphQLFieldValue | undefined =>
        fieldValues.find((f: GraphQLFieldValue) => f.field?.name === fieldName);

      // Only include items where "Show on Web" is "Yes"
      const showOnWeb = getField('Show on Web');
      if (showOnWeb?.name !== 'Yes') continue;

      const statusRaw = (getField('Status')?.name || 'Todo').toLowerCase();
      let status: RoadmapItem['status'] = 'todo';
      if (statusRaw.includes('progress')) status = 'in-progress';
      else if (statusRaw.includes('done')) status = 'done';

      const priorityRaw = (getField('Priority')?.name || 'Medium').toLowerCase();
      let priority: RoadmapItem['priority'] = 'medium';
      if (priorityRaw.includes('high')) priority = 'high';
      else if (priorityRaw.includes('low')) priority = 'low';

      items.push({
        title: node.content?.title || 'Untitled',
        description: this.cleanDescription(
          getField('Description')?.text || node.content?.body || '',
        ),
        status,
        priority,
        category: getField('Category')?.name || 'Feature',
        timeline: getField('Timeline')?.name || undefined,
        link: node.content?.url,
      });
    }

    return {
      lastUpdated: new Date().toISOString(),
      items,
    };
  }

  private cleanDescription(text: string): string {
    if (!text) return '';
    const headingsRemoved = text.replace(/^#{1,6}\s+.*/gm, '');
    const bulletsRemoved = headingsRemoved.replace(/^[-*+]\s+/gm, '');
    const numbersRemoved = bulletsRemoved.replace(/^\d+\.\s+/gm, '');
    const checkboxesRemoved = numbersRemoved.replace(/\[[ x]\]\s*/gi, '');
    const linksSimplified = checkboxesRemoved.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1');
    const collapsed = linksSimplified.replace(/\n+/g, ' ').replace(/\s+/g, ' ');
    return collapsed.trim().substring(0, 200);
  }
}
