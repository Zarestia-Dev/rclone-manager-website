import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { marked } from 'marked';
import { RoadmapItem } from './roadmap.constants';
import { RoadmapService } from './roadmap.service';

@Component({
  selector: 'app-roadmap',
  imports: [CommonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule],
  templateUrl: './roadmap-board.html',
  styleUrl: './roadmap-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoadmapBoard implements OnInit {
  private roadmapService = inject(RoadmapService);

  readonly allItems = signal<RoadmapItem[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly lastUpdated = signal<string | null>(null);

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

  readonly doneItems = computed(() => this.allItems().filter((i) => i.status === 'done'));
  readonly inProgressItems = computed(() => this.allItems().filter((i) => i.status === 'in-progress'));
  readonly todoItems = computed(() => this.allItems().filter((i) => i.status === 'todo'));
}
