import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { GithubService } from './github.service';

const REPO = 'Zarestia-Dev/rclone-manager-website';
const BRANCH = 'main';
const DOCS_PATH = 'public/docs';

@Injectable({
  providedIn: 'root',
})
export class WikiService {
  private github = inject(GithubService);

  fetchSidebar(): Observable<string> {
    return this.github.getRaw(REPO, BRANCH, `${DOCS_PATH}/sidebar.md`).pipe(
      catchError((err) => {
        console.error('Failed to fetch sidebar from GitHub Raw, falling back to local:', err);
        // Fallback to bundled local file
        return this.github.getRaw('', '', '').pipe(catchError(() => of('')));
      }),
    );
  }

  fetchPage(path: string): Observable<string> {
    if (path.startsWith('http')) {
      return of('');
    }

    return this.github.getRaw(REPO, BRANCH, `${DOCS_PATH}/${path}`).pipe(
      catchError((err) => {
        console.error(`Failed to fetch doc page from GitHub Raw: ${path}`, err);
        return of('<p class="error-text">Error loading documentation content.</p>');
      }),
    );
  }
}
