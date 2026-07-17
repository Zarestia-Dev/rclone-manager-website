import { Component, inject, afterNextRender, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './core/components/navbar/navbar';
import { Footer } from './core/components/footer/footer';
import { DebugService } from './core/services/debug.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private debugService = inject(DebugService);

  title = 'RClone Manager';
  readonly loaded = signal(false);

  constructor() {
    afterNextRender(() => {
      this.loaded.set(true);
    });
  }
}
