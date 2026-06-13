import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-animated-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animated-logo.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./animated-logo.scss'],
})
export class AnimatedLogoComponent {}
