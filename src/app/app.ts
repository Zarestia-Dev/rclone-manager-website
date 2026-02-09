import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { Home } from './pages/home/home';
import { Downloads } from './pages/downloads/downloads';
import { Docs } from './pages/docs/docs';
import { Faq } from './pages/faq/faq';
import { TabService, AppTab } from './services/tab.service';
import { DebugService } from './services/debug.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [Navbar, Footer, Home, Downloads, Docs, Faq],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private tabService = inject(TabService);
  private debugService = inject(DebugService);

  title = 'RClone Manager';
  loaded = true;
  currentTab: AppTab = 'general';
  private sub?: Subscription;

  ngOnInit() {
    // subscribe to tab changes
    this.sub = this.tabService.currentTab$.subscribe((t) => {
      this.currentTab = t;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
