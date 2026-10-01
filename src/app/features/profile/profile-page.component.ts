import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProfileComponent } from './profile.component';
import { NavFacadeService } from '../nav/nav-facade.service';

/** Routed /profile (Feature 68). ProfileComponent is unchanged; its `close` only fires from the nav logo,
 *  which NavFacadeService.onLogoClick() already handles, so only openAiPlanning needs wiring. */
@Component({
  selector: 'app-profile-page',
  imports: [ProfileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-profile (openAiPlanning)="facade.openAiPlanning()" />`,
})
export class ProfilePageComponent {
  protected readonly facade = inject(NavFacadeService);
}
