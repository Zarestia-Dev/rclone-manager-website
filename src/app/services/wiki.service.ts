import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { GithubService } from './github.service';
import { environment } from '../../environments/environment';

const REPO = 'Zarestia-Dev/rclone-manager-website';
const BRANCH = 'main';
const DOCS_PATH = 'public/docs';

const USE_LOCAL = !environment.production;

@Injectable({
  providedIn: 'root',
})
export class WikiService {
  private github = inject(GithubService);
  private http = inject(HttpClient);

  fetchSidebar(): Observable<string> {
    if (USE_LOCAL) {
      return this.http.get('docs/sidebar.md', { responseType: 'text' }).pipe(
        catchError((err) => {
          console.error('Failed to fetch local sidebar, falling back to GitHub:', err);
          return this.fetchSidebarFromGithub();
        }),
      );
    }
    return this.fetchSidebarFromGithub();
  }

  private fetchSidebarFromGithub(): Observable<string> {
    return this.github.getRaw(REPO, BRANCH, `${DOCS_PATH}/sidebar.md`).pipe(
      catchError((err) => {
        console.error('Failed to fetch sidebar from GitHub Raw, falling back to local asset:', err);
        // Fallback to bundled local file in assets/docs if necessary, but here we just try empty string or console error
        return of('');
      }),
    );
  }

  fetchPage(path: string): Observable<string> {
    if (path.startsWith('http')) {
      return of('');
    }

    if (USE_LOCAL) {
      return this.http.get(`docs/${path}`, { responseType: 'text' }).pipe(
        catchError((err) => {
          console.error(`Failed to fetch local doc page: ${path}, falling back to GitHub:`, err);
          return this.fetchPageFromGithub(path);
        }),
      );
    }

    return this.fetchPageFromGithub(path);
  }

  private fetchPageFromGithub(path: string): Observable<string> {
    return this.github.getRaw(REPO, BRANCH, `${DOCS_PATH}/${path}`).pipe(
      catchError((err) => {
        console.error(`Failed to fetch doc page from GitHub Raw: ${path}`, err);
        return of('<p class="error-text">Error loading documentation content.</p>');
      }),
    );
  }
}
