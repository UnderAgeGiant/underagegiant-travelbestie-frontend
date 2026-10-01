import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MyTripsComponent } from './my-trips.component';
import { NavFacadeService } from '../nav/nav-facade.service';

/** Routed /my-trips (Feature 68). `close` is intentionally unbound: the logo is handled by the facade and
 *  "Modificar mi plan" calls facade.openEditor() itself. */
@Component({
  selector: 'app-my-trips-page',
  imports: [MyTripsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-my-trips (openAiPlanning)="facade.openAiPlanning()" (viewAiPlan)="facade.openAiPlanning($event)" />`,
})
export class MyTripsPageComponent {
  protected readonly facade = inject(NavFacadeService);
}
