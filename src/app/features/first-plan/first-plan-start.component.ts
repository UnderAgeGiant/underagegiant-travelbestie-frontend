import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { KarmaModalService } from '../../core/karma/karma-modal.service';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';
import { ToastService } from '../../core/ui/toast.service';
import { FeaturedTrip } from '../../core/models/featured-trip.model';
import { TripStop, TransitLeg } from '../../core/models/trip.model';
import { stayLength } from '../../core/utils/event-datetime.util';
import { WORLD_CITIES } from '../../data/cities.data';
import { FlagIconComponent } from '../../shared/flag-icon/flag-icon.component';
import { NavShellComponent } from '../nav/nav-shell.component';
import { NavFacadeService } from '../nav/nav-facade.service';
import { TripService } from '../trip/trip.service';

interface ReadyPlanCard {
  id: string;
  name: string;
  days: number;
  cities: number;
  places: number;
  flags: { flag: string; name: string }[];
}

/** /first-plan (F79 Path 2): copy a ready-made plan for free while the first-plan gift is available. */
@Component({
  selector: 'app-first-plan-start',
  imports: [NavShellComponent, RouterLink, FlagIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ai-plan-page">
      <div class="shared-bg"></div>
      <div class="shared-bg-frost"></div>
      <app-nav (logoClick)="router.navigateByUrl('/')" />

      <div class="shared-body">
        <main class="fp-wrap">
          <h1 class="fp-title" i18n="@@firstplan.readyTitle">Empieza con un plan ya hecho</h1>
          <p class="fp-sub" i18n="@@firstplan.readySub">Cópialo gratis y cámbialo a tu gusto.</p>

          @if (cards().length > 0) {
            <ul class="fp-list">
              @for (p of cards(); track p.id) {
                <li class="fp-card">
                  <div class="fp-card-flags">
                    @for (f of p.flags; track f.name) {
                      <app-flag-icon [flag]="f.flag" [alt]="f.name" [size]="20" />
                    }
                  </div>
                  <h2 class="fp-card-name">{{ p.name }}</h2>
                  <p class="fp-card-meta">
                    <span i18n="@@firstplan.metaDays">{p.days, plural, =1 {1 día} other {{{p.days}} días}}</span>
                    <span aria-hidden="true">·</span>
                    <span i18n="@@firstplan.metaCities">{p.cities, plural, =1 {1 ciudad} other {{{p.cities}} ciudades}}</span>
                    <span aria-hidden="true">·</span>
                    <span i18n="@@firstplan.metaPlaces">{p.places, plural, =1 {1 lugar} other {{{p.places}} lugares}}</span>
                  </p>
                  <button type="button" class="btn-pill btn-primary" [disabled]="usingId() !== null" (click)="use(p)">
                    @if (usingId() === p.id) { ⏳ }
                    <span i18n="@@firstplan.useFree">Usar gratis</span>
                  </button>
                </li>
              }
            </ul>
          }

          <div class="fp-actions">
            <a class="btn-pill btn-primary fp-ai" routerLink="/ai-planning" i18n="@@firstplan.backToAi">Crear mi plan gratis con IA</a>
            <a class="fp-scratch" routerLink="/" i18n="@@firstplan.fromScratch">Prefiero empezar desde cero</a>
          </div>
        </main>
      </div>
    </div>
  `,
})
export class FirstPlanStartComponent implements OnInit {
  protected readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly savedPlans = inject(SavedPlansService);
  private readonly trip = inject(TripService);
  private readonly facade = inject(NavFacadeService);
  private readonly karmaModal = inject(KarmaModalService);
  private readonly toast = inject(ToastService);

  private readonly featured = signal<FeaturedTrip[]>([]);
  /** The card whose "Usar gratis" is in flight; disables every card's button meanwhile. */
  protected readonly usingId = signal<string | null>(null);

  protected readonly cards = computed<ReadyPlanCard[]>(() => this.featured().map(f => {
    const cityIds = [...new Set(f.stops.map(s => s.cityId))];
    return {
      id: f.id,
      name: f.tripName,
      days: stayLength(f.stops)?.days ?? 0,
      cities: cityIds.length,
      places: f.stops.reduce((n, s) => n + s.selectedAttractions.length, 0),
      flags: cityIds.slice(0, 4).map(id => WORLD_CITIES.find(c => c.id === id)).filter(c => !!c).map(c => ({ flag: c!.flag, name: c!.name })),
    };
  }));

  ngOnInit(): void {
    if (!this.auth.firstPlanAvailable()) {
      void this.router.navigateByUrl('/', { replaceUrl: true });
      return;
    }
    this.api.getFeatured().subscribe({ next: list => this.featured.set(list), error: () => this.featured.set([]) });
  }

  /** FeaturedTrip.id is the shareId (contracts §8.1), so the shared-plan clone accepts it as is. */
  protected use(p: ReadyPlanCard): void {
    if (this.usingId()) return;
    this.usingId.set(p.id);
    this.api.cloneSharedTrip(p.id, 'featured').subscribe({
      next: copy => {
        const stops = copy.stops as TripStop[], transits = (copy.transits ?? []) as TransitLeg[];
        this.savedPlans.register({ id: copy.id!, name: copy.title, savedAt: new Date().toISOString(), stops, transits });
        this.trip.restoreStops(stops, copy.id!, transits);
        this.auth.setFirstPlanAvailable(false);
        this.facade.openEditor();
      },
      error: err => {
        this.usingId.set(null);
        if (this.karmaModal.handleKarmaError(err)) this.auth.setFirstPlanAvailable(false);
        else this.toast.show($localize`:@@firstplan.copyFailed:No pudimos copiar el plan. Inténtalo de nuevo.`);
      },
    });
  }
}
