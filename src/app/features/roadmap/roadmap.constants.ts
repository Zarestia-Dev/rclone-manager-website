export interface RoadmapItem {
  title: string;
  description: string;
  status: 'done' | 'in-progress' | 'todo';
  priority: 'low' | 'medium' | 'high';
  category: string;
  timeline?: string;
  link?: string;
}

export interface RoadmapData {
  items: RoadmapItem[];
  lastUpdated: string;
}
