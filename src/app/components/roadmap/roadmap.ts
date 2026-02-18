import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { marked } from 'marked';
import { RoadmapItem } from '../../constants/roadmap.constants';
import { RoadmapService } from '../../services/roadmap.service';

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule],
  templateUrl: './roadmap.html',
  styleUrl: './roadmap.scss',
})
export class Roadmap implements OnInit {
  private roadmapService = inject(RoadmapService);

  allItems = signal<RoadmapItem[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  lastUpdated = signal<string | null>(null);

  ngOnInit(): void {
    this.loadRoadmap();
  }

  private loadRoadmap(): void {
    this.isLoading.set(true);
    this.roadmapService.fetchRoadmap().subscribe({
      next: (data) => {
        this.allItems.set(data.items);
        this.lastUpdated.set(data.lastUpdated);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading roadmap:', err);
        this.error.set('Could not load roadmap. Please try again later.');
        this.isLoading.set(false);
      },
    });
  }

  renderMarkdown(text: string): string {
    if (!text) return '';
    return marked.parseInline(text) as string;
  }

  get doneItems(): RoadmapItem[] {
    return this.allItems().filter((i) => i.status === 'done');
  }

  get inProgressItems(): RoadmapItem[] {
    return this.allItems().filter((i) => i.status === 'in-progress');
  }

  get todoItems(): RoadmapItem[] {
    return this.allItems().filter((i) => i.status === 'todo');
  }
}
