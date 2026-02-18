import { Component } from '@angular/core';
import { Hero } from '../../components/hero/hero';
import { Features } from '../../components/features/features';
import { Roadmap } from '../../components/roadmap/roadmap';

@Component({
  selector: 'app-home',
  imports: [Hero, Features, Roadmap],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
