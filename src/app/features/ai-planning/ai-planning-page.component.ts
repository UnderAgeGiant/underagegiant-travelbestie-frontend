import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { WORLD_CITIES } from '../../data/cities.data';
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
    <app-ai-planning [initialResult]="initialResult" [initialCityIds]="initialCityIds"
                     (viewFeaturedTrips)="onViewFeatured()"
                     (planSaved)="onPlanSaved()" />
  `,
})
export class AiPlanningPageComponent {
  protected readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly facade = inject(NavFacadeService);
  private readonly auth = inject(AuthService);
  /** `?city=paris,rome` → known ids only. */
  protected readonly initialCityIds = (inject(ActivatedRoute).snapshot.queryParamMap.get('city') ?? '')
    .split(',').filter(id => WORLD_CITIES.some(c => c.id === id));
  protected readonly initialResult =
    (inject(Location).getState() as { aiPlanResult?: AiPlanViewPayload } | null)?.aiPlanResult ?? null;

  /** While the gift is available the "ready-made plans" path is /first-plan (F79), else the landing's featured section. */
  protected onViewFeatured(): void {
    if (this.auth.firstPlanAvailable()) void this.router.navigateByUrl('/first-plan');
    else void this.router.navigate(['/'], { fragment: 'featured' });
  }

  protected onPlanSaved(): void {
    this.toast.show('Plan guardado');
    this.facade.openEditor();
  }
}
