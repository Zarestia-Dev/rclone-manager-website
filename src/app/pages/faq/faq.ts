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

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  isExpanded?: boolean;
}

interface FaqCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface HelpLink {
  title: string;
  description: string;
  url: string;
  icon: string;
  type: 'primary' | 'accent' | 'warn';
}

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

  categories: FaqCategory[] = [];

  faqItems: FaqItem[] = [];

  helpLinks: HelpLink[] = [];

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
      this.helpLinks = parsedData.helpLinks;
      this.helpLinks = parsedData.helpLinks;
      console.log(
        'Successfully loaded FAQ data:',
        this.faqItems.length,
        'questions,',
        this.categories.length,
        'categories',
      );
    } catch (error) {
      console.error('Error loading FAQ data:', error);
      this.error =
        'Failed to load FAQ data from GitHub Wiki. Please check your internet connection and try again.';
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
    let helpLinks: HelpLink[] = [];

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
    const categories: FaqCategory[] = [
      {
        id: 'all',
        name: 'All Questions',
        icon: 'help',
        description: 'View all frequently asked questions',
      },
    ];

    // Add categories found in FAQ items
    Array.from(categorySet)
      .sort()
      .forEach((categoryId) => {
        const categoryConfig = this.getCategoryConfig(categoryId);
        categories.push({
          id: categoryId,
          name: categoryConfig.name,
          icon: categoryConfig.icon,
          description: categoryConfig.description,
        });
      });

    // Generate help links from repository info
    helpLinks = this.generateHelpLinks();

    return { items: faqItems, categories, helpLinks };
  }

  private generateId(question: string): string {
    return question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  private getCategoryConfig(categoryId: string): {
    name: string;
    icon: string;
    description: string;
  } {
    const configs: Record<string, { name: string; icon: string; description: string }> = {
      installation: {
        name: 'Installation',
        icon: 'download',
        description: 'Getting RClone Manager installed',
      },
      configuration: {
        name: 'Configuration',
        icon: 'settings',
        description: 'Setting up and configuring remotes',
      },
      usage: {
        name: 'Usage',
        icon: 'play_arrow',
        description: 'Using RClone Manager features',
      },
      troubleshooting: {
        name: 'Troubleshooting',
        icon: 'bug_report',
        description: 'Fixing common issues',
      },
      features: {
        name: 'Features',
        icon: 'star',
        description: 'Understanding available features',
      },
      support: {
        name: 'Support',
        icon: 'support',
        description: 'Getting help and support',
      },
      general: {
        name: 'General',
        icon: 'info',
        description: 'General information',
      },
    };

    return (
      configs[categoryId] || {
        name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
        icon: 'help_outline',
        description: `Questions about ${categoryId}`,
      }
    );
  }

  private generateHelpLinks(): HelpLink[] {
    return [
      {
        title: 'GitHub Discussions',
        description: 'Ask questions, share ideas, and get help from the community',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/discussions',
        icon: 'forum',
        type: 'primary',
      },
      {
        title: 'Report an Issue',
        description: 'Found a bug or problem? Report it on our GitHub issues',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/issues/new',
        icon: 'bug_report',
        type: 'warn',
      },
      {
        title: 'Documentation',
        description: 'Browse our comprehensive documentation and guides',
        url: '/docs',
        icon: 'menu_book',
        type: 'accent',
      },
      {
        title: 'Feature Request',
        description: 'Suggest new features or improvements',
        url: 'https://github.com/Zarestia-Dev/rclone-manager/discussions/categories/ideas',
        icon: 'lightbulb',
        type: 'accent',
      },
    ];
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
      return 'All Questions';
    }
    const category = this.categories.find((c) => c.id === this.selectedCategory);
    return category?.name || 'Questions';
  }
}
