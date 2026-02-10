import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import {
  FaqItem,
  FaqCategory,
  HelpLink,
  FAQ_CATEGORIES,
  HELP_LINKS,
  COMMUNITY_LINKS,
  FAQ_MESSAGES,
} from '../../constants/faq.constants';
import { getCategoryConfig } from '../../utils/faq.utils';

@Component({
  selector: 'app-faq',
  imports: [
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
})
export class Faq implements OnInit {
  private http = inject(HttpClient);

  selectedCategory = 'all';
  isLoading = true;
  error: string | null = null;

  messages = FAQ_MESSAGES;
  categories: FaqCategory[] = [];
  faqItems: FaqItem[] = [];
  helpLinks: HelpLink[] = HELP_LINKS;
  communityLinks: HelpLink[] = COMMUNITY_LINKS;

  ngOnInit(): void {
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loadFaqData();
    }, 0);
  }

  private async loadFaqData(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      // Fetch FAQ data from GitHub Wiki
      const response = await firstValueFrom(
        this.http.get('https://raw.githubusercontent.com/wiki/Zarestia-Dev/rclone-manager/FAQ.md', {
          responseType: 'text',
        }),
      );

      const parsedData = this.parseFaqMarkdown(response);
      this.faqItems = parsedData.items;
      this.categories = parsedData.categories;
      console.log(
        'Successfully loaded FAQ data:',
        this.faqItems.length,
        'questions,',
        this.categories.length,
        'categories',
      );
    } catch (error) {
      console.error('Error loading FAQ data:', error);
      this.error = FAQ_MESSAGES.ERROR_LOADING;
      // No fallback items - keep arrays empty
    } finally {
      this.isLoading = false;
    }
  }

  private parseFaqMarkdown(markdown: string): {
    items: FaqItem[];
    categories: FaqCategory[];
    helpLinks: HelpLink[];
  } {
    const faqItems: FaqItem[] = [];
    const categorySet = new Set<string>();
    const lines = markdown.split('\n');
    let currentQuestion: Partial<FaqItem> = {};
    let answerLines: string[] = [];

    for (const line of lines) {
      // Check for question (### heading)
      if (line.startsWith('### ') && line.length > 4) {
        // Save previous question if exists
        if (currentQuestion.question && answerLines.length > 0) {
          currentQuestion.answer = answerLines.join(' ').trim();
          if (currentQuestion.id && currentQuestion.category) {
            faqItems.push(currentQuestion as FaqItem);
            categorySet.add(currentQuestion.category);
          }
        }

        // Start new question
        currentQuestion = {
          id: this.generateId(line.substring(4)),
          question: line.substring(4),
          category: 'general',
          tags: [],
          isExpanded: false,
        };
        answerLines = [];
      }
      // Check for category
      else if (line.startsWith('**Category:**')) {
        const category = line.replace('**Category:**', '').trim();
        if (currentQuestion) {
          currentQuestion.category = category;
        }
      }
      // Check for tags
      else if (line.startsWith('**Tags:**')) {
        const tagsStr = line.replace('**Tags:**', '').trim();
        if (currentQuestion) {
          currentQuestion.tags = tagsStr.split(',').map((tag) => tag.trim());
        }
      }
      // Start collecting answer after metadata
      else if (line && !line.startsWith('**') && !line.startsWith('---') && !line.startsWith('#')) {
        if (currentQuestion.question) {
          answerLines.push(line);
        }
      }
    }

    // Don't forget the last question
    if (currentQuestion.question && answerLines.length > 0) {
      currentQuestion.answer = answerLines.join(' ').trim();
      if (currentQuestion.id && currentQuestion.category) {
        faqItems.push(currentQuestion as FaqItem);
        categorySet.add(currentQuestion.category);
      }
    }

    // Generate dynamic categories
    const categories: FaqCategory[] = [...FAQ_CATEGORIES];

    // Add categories found in FAQ items
    Array.from(categorySet)
      .sort()
      .forEach((categoryId) => {
        const categoryConfig = getCategoryConfig(categoryId);
        categories.push({
          id: categoryId,
          name: categoryConfig.name,
          icon: categoryConfig.icon,
          description: categoryConfig.description,
        });
      });

    return { items: faqItems, categories, helpLinks: [] };
  }

  private generateId(question: string): string {
    return question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  async retryLoading(): Promise<void> {
    await this.loadFaqData();
  }

  get filteredFaqItems(): FaqItem[] {
    let items = this.faqItems;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      items = items.filter((item) => item.category === this.selectedCategory);
    }

    return items;
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
  }

  openExternalLink(url: string): void {
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      // Internal link - you might want to use router navigation here
      window.location.href = url;
    }
  }

  getCategoryDisplayName(): string {
    if (this.selectedCategory === 'all') {
      return this.messages.ALL_QUESTIONS;
    }
    const category = this.categories.find((c) => c.id === this.selectedCategory);
    return category?.name || this.messages.QUESTIONS;
  }
}
