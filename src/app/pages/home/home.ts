import { Component } from '@angular/core';
import { Hero } from '../../components/hero/hero';
import { Features } from '../../components/features/features';

@Component({
  selector: 'app-home',
  imports: [Hero, Features],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
