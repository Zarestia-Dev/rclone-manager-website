import { Component, inject } from '@angular/core';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { Home } from './pages/home/home';
import { Downloads } from './pages/downloads/downloads';
import { Docs } from './pages/docs/docs';
import { TabService } from './services/tab.service';
import { DebugService } from './services/debug.service';

@Component({
  selector: 'app-root',
  imports: [Navbar, Footer, Home, Downloads, Docs],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  tabService = inject(TabService);
  private debugService = inject(DebugService);

  title = 'RClone Manager';
  loaded = true;
}
