import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavShellComponent } from '../nav/nav-shell.component';
import { AboutContentComponent } from './about-content.component';

@Component({
  selector: 'app-about',
  imports: [NavShellComponent, AboutContentComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="about-page">
      <app-nav (logoClick)="goHome()" />

      <app-about-content (startPlanning)="goHome()" />
    </div>
  `,
})
export class AboutComponent {
  private readonly router = inject(Router);

  goHome(): void {
    this.router.navigate(['/']);
  }
}
