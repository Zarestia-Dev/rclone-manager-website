import { Component, inject, Signal, ChangeDetectionStrategy } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DocItem, DocSection, SearchHit } from '../../../services/doc.service';

export interface NavSheetData {
  sections: DocSection[];
  quickLinks: DocItem[];
  selectedItem: Signal<DocItem | null>;
  searchQuery: Signal<string>;
  searchHits: Signal<SearchHit[]>;
  isIndexing: Signal<boolean>;
  onSelect: (item: DocItem, searchTerm?: string) => void;
  onSearch: (query: string) => void;
}

@Component({
  selector: 'app-docs-nav-sheet',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './nav-sheet.html',
  styleUrl: './nav-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsNavSheetComponent {
  private bottomSheetRef = inject(MatBottomSheetRef<DocsNavSheetComponent>);
  public data = inject<NavSheetData>(MAT_BOTTOM_SHEET_DATA);

  selectItem(item: DocItem, searchTerm?: string): void {
    this.data.onSelect(item, searchTerm);
    this.bottomSheetRef.dismiss(item);
  }
}
