import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NAV_LINKS, SOCIAL_LINKS, EXTERNAL_NAV_LINKS } from '../../../shared/constants/navigation.constants';

@Component({
  selector: 'app-footer',
  imports: [MatIconModule, MatButtonModule, RouterLink, RouterLinkActive],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Footer {
  currentYear = new Date().getFullYear();
  navLinks = NAV_LINKS;
  socialLinks = SOCIAL_LINKS;
  supportLinks = EXTERNAL_NAV_LINKS;
}
