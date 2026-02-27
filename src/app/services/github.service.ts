import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

export interface GithubIssue {
  title: string;
  html_url: string;
  number: number;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: {
    name: string;
    color: string;
  }[];
  updated_at: string;
}

export interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

@Injectable({
  providedIn: 'root',
})
export class GithubService {
  private http = inject(HttpClient);
  private cache = new Map<string, Observable<unknown>>();

  private get proxyUrl(): string {
    return (environment.githubProxyUrl || '').replace(/\/$/, '');
  }

  private get token(): string {
    return environment.githubReadToken || '';
  }

  private get hasProxy(): boolean {
    return this.proxyUrl.length > 0;
  }

  private get hasClientToken(): boolean {
    const token = this.token;
    return !!token && token !== 'GITHUB_READ_TOKEN_PLACEHOLDER';
  }

  hasGraphqlAccess(): boolean {
    return this.hasProxy || this.hasClientToken;
  }

  private get authHeaders(): HttpHeaders {
    const token = this.token;
    if (!token || token === 'GITHUB_READ_TOKEN_PLACEHOLDER') {
      return new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Make a REST GET request to the GitHub API.
   * Caches the response in memory. Use forceRefresh to bypass the cache.
   */
  get<T>(path: string, forceRefresh = false): Observable<T> {
    if (forceRefresh) {
      this.cache.delete(path);
    }

    if (!this.cache.has(path)) {
      let request$: Observable<T>;

      if (this.hasProxy) {
        request$ = this.http.get<T>(`${this.proxyUrl}/api/github${path}`);
      } else {
        request$ = this.http.get<T>(`${GITHUB_API_BASE}${path}`, {
          headers: this.authHeaders,
        });
      }

      const cachedRequest$ = request$.pipe(shareReplay(1));
      this.cache.set(path, cachedRequest$);
    }

    return this.cache.get(path)! as Observable<T>;
  }

  /**
   * Make a GraphQL POST request to the GitHub API.
   * Uses a secure proxy endpoint when configured, otherwise falls back to direct GitHub API.
   */
  graphql<T>(query: string, variables: Record<string, unknown> = {}): Observable<T> {
    if (this.hasProxy) {
      return this.http.post<T>(`${this.proxyUrl}/api/github/graphql`, { query, variables });
    }

    return this.http.post<T>(
      `${GITHUB_API_BASE}/graphql`,
      { query, variables },
      { headers: this.authHeaders },
    );
  }

  /**
   * Fetch raw file content from a GitHub repository.
   * Does NOT use the token (raw.githubusercontent.com is public and doesn't need auth).
   * Falls back gracefully if the file is not found.
   */
  getRaw(repo: string, branch: string, filePath: string): Observable<string> {
    return this.http.get(`${GITHUB_RAW_BASE}/${repo}/${branch}/${filePath}`, {
      responseType: 'text',
    });
  }

  /**
   * Fetch open issues from a repository.
   */
  getIssues(repo: string, labels: string[] = [], forceRefresh = false): Observable<GithubIssue[]> {
    let path = `/repos/${repo}/issues?state=open&sort=updated`;
    if (labels.length > 0) {
      path += `&labels=${labels.join(',')}`;
    }
    return this.get<GithubIssue[]>(path, forceRefresh);
  }

  /**
   * Fetch contributors for a repository.
   */
  getContributors(repo: string, forceRefresh = false): Observable<Contributor[]> {
    return this.get<Contributor[]>(`/repos/${repo}/contributors`, forceRefresh);
  }

  /**
   * Clear the in-memory cache of API responses.
   */
  clearMemoryCache(): void {
    this.cache.clear();
  }
}
