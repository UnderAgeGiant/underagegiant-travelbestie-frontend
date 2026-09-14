import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NavShellComponent } from '../nav/nav-shell.component';
import { ProfileComponent } from '../profile/profile.component';
import { AboutContentComponent } from './about-content.component';

@Component({
  selector: 'app-about',
  imports: [NavShellComponent, ProfileComponent, AboutContentComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="about-page">
      <app-nav (logoClick)="goHome()" (profileClick)="showProfile.set(true)" />

      @if (showProfile()) {
        <app-profile (close)="showProfile.set(false)" />
      }

      <app-about-content (startPlanning)="goHome()" />
    </div>
  `,
})
export class AboutComponent {
  private readonly router = inject(Router);

  readonly showProfile = signal(false);

  goHome(): void {
    this.router.navigate(['/']);
  }
}
