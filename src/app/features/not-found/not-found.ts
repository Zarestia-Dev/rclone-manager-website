import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * 404 / "Not Found" page.
 *
 * Rendered when the Router matches the `**` wildcard route (any URL that
 * doesn't match a real feature route). Replaces the previous silent
 * `redirectTo: ''` behaviour so visitors see a clear, branded message and
 * can navigate back to a real page instead of being confused by a silent
 * redirect that looks like the URL they typed "worked".
 *
 * The page keeps a low information density (icon + headline + supporting
 * copy + a primary CTA back to home + a secondary link to docs) because a
 * 404 page is a moment of friction and the goal is to recover, not to
 * present options.
 */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {}
