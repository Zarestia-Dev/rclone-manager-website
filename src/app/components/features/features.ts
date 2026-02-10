import { Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ModeService } from '../../services/mode.service';
import { DESKTOP_FEATURES, HEADLESS_FEATURES } from '../../constants/features.constants';

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

  features = computed(() => {
    return this.modeService.currentMode() === 'headless' ? HEADLESS_FEATURES : DESKTOP_FEATURES;
  });
}
