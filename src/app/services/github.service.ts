import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

@Injectable({
  providedIn: 'root',
})
export class GithubService {
  private http = inject(HttpClient);

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
   * Automatically injects the Authorization header if a token is configured.
   */
  get<T>(path: string): Observable<T> {
    if (this.hasProxy) {
      return this.http.get<T>(`${this.proxyUrl}/api/github${path}`);
    }
    return this.http.get<T>(`${GITHUB_API_BASE}${path}`, {
      headers: this.authHeaders,
    });
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
}
