import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Hero } from '../../components/hero/hero';
import { Features } from '../../components/features/features';

@Component({
  selector: 'app-home',
  imports: [Hero, Features],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.scss',
})
export class Home {}
