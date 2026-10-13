import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PreferencesComponent } from './preferences.component';
import { NavFacadeService } from '../nav/nav-facade.service';

/** Routed /profile (Feature 68). PreferencesComponent is unchanged; its `close` only fires from the nav logo,
 *  which NavFacadeService.onLogoClick() already handles, so only openAiPlanning needs wiring. */
@Component({
  selector: 'app-preferences-page',
  imports: [PreferencesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-preferences (openAiPlanning)="facade.openAiPlanning()" />`,
})
export class PreferencesPageComponent {
  protected readonly facade = inject(NavFacadeService);
}
