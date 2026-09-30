import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { AiPlanningComponent } from './ai-planning.component';
import { AiPlanViewPayload } from '../../core/models/ai.model';
import { ToastService } from '../../core/ui/toast.service';
import { NavFacadeService } from '../nav/nav-facade.service';

/** Routed /ai-planning (Feature 68). A past plan arrives as history state (NavFacadeService.openAiPlanning),
 *  which survives a reload; a fresh open has none and starts at Step 1. */
@Component({
  selector: 'app-ai-planning-page',
  imports: [AiPlanningComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-ai-planning [initialResult]="initialResult"
                     (viewFeaturedTrips)="router.navigate(['/'], { fragment: 'featured' })"
                     (planSaved)="onPlanSaved()" />
  `,
})
export class AiPlanningPageComponent {
  protected readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly facade = inject(NavFacadeService);
  protected readonly initialResult =
    (inject(Location).getState() as { aiPlanResult?: AiPlanViewPayload } | null)?.aiPlanResult ?? null;

  protected onPlanSaved(): void {
    this.toast.show('Plan guardado');
    this.facade.openEditor();
  }
}
