import { Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DocItem, DocSection } from '../../../services/doc.service';

export interface NavSheetData {
  sections: DocSection[];
  quickLinks: DocItem[];
  selectedItem: Signal<DocItem | null>;
  searchQuery: Signal<string>;
  onSelect: (item: DocItem) => void;
  onSearch: (query: string) => void;
}

@Component({
  selector: 'app-docs-nav-sheet',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './nav-sheet.html',
  styleUrl: './nav-sheet.scss',
})
export class DocsNavSheetComponent {
  private bottomSheetRef = inject(MatBottomSheetRef<DocsNavSheetComponent>);
  public data = inject<NavSheetData>(MAT_BOTTOM_SHEET_DATA);

  selectItem(item: DocItem): void {
    this.bottomSheetRef.dismiss(item);
  }
}
