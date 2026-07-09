import { Component, computed, inject, signal, output, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TripService } from '../trip/trip.service';
import { SavedPlansService, SavedPlan } from '../../core/saved-plans/saved-plans.service';
import { FavoritesService } from '../../core/favorites/favorites.service';
import { FavoritedTrip } from '../../core/models/trip.model';
import { SharedTripsService } from '../../core/shared-trips/shared-trips.service';
import { KarmaService } from '../../core/karma/karma.service';
import { KarmaModalService } from '../../core/karma/karma-modal.service';
import { ApiService } from '../../core/api/api.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';
import { TripItineraryComponent } from '../profile/trip-itinerary.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { shareTrip, buildShareLink } from '../../core/share/share-url.util';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-my-trips',
  imports: [TripItineraryComponent, ToastComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="profile-page">

      <!-- Header bar -->
      <div class="prof-bar">
        <button class="back-btn" (click)="close.emit()" type="button">← Volver</button>
        <div class="prof-bar-title">Mis viajes</div>
      </div>

      <div class="prof-body">

        <!-- Saved trips with itinerary -->
        <section>
          <div class="section-head">Viajes guardados 🗺️</div>
          @if (!auth.isLoggedIn()) {
            <div class="section-empty">Inicia sesión para ver tus viajes guardados.</div>
          } @else {
            <!-- Tab switcher -->
            <div class="profile-tabs">
              <button class="profile-tab" [class.active]="favTab() === 'trips'"
                      (click)="favTab.set('trips')"
                      i18n="@@profile.tabTrips">Mis viajes</button>
              <button class="profile-tab" [class.active]="favTab() === 'favorites'"
                      (click)="openFavTab()"
                      i18n="@@profile.tabFavorites">Mis favoritos</button>
            </div>

            @if (favTab() === 'trips') {
              @if (savedPlans.plans().length === 0) {
                <div class="section-empty">Aún no tienes viajes guardados. Usa el botón "Guardar viaje 🎉" para guardar uno.</div>
              } @else {
                <div class="saved-plan-filter-row">
                  <input class="form-input"
                         type="search"
                         style="font-size:12px;padding:7px 10px"
                         placeholder="Buscar viaje guardado…"
                         [value]="planSearch()"
                         (input)="planSearch.set($any($event.target).value)" />
                  <label class="saved-plan-filter-check">
                    <input type="checkbox"
                           [checked]="publishedOnly()"
                           (change)="publishedOnly.set($any($event.target).checked)" />
                    <span i18n="@@myTrips.publishedFilter">Viaje publicado</span>
                  </label>
                </div>
                @for (plan of filteredPlans(); track plan.id) {
                  <div class="saved-plan-card">
                    <div class="saved-plan-header" (click)="togglePlan(plan.id)">
                      <div class="saved-plan-info">
                        <div class="saved-plan-name">
                          {{ plan.name }}
                          @if (planShareId(plan)) {
                            <span class="saved-plan-published" i18n="@@myTrips.publishedBadge">✓ Viaje Publicado</span>
                          }
                        </div>
                        <div class="saved-plan-meta">
                          {{ plan.stops.length }} ciudad{{ plan.stops.length !== 1 ? 'es' : '' }}
                          · {{ fmtDate(plan.savedAt) }}
                        </div>
                      </div>
                      <div style="display:flex;align-items:center;gap:4px;margin-left:auto">
                        <button class="saved-plan-act-btn"
                                [disabled]="cloningId() === plan.id"
                                (click)="$event.stopPropagation(); confirmCloneId.set(plan.id)"
                                title="Clonar viaje">
                          {{ cloningId() === plan.id ? '⏳' : '📋' }} <span i18n="@@myTrips.cloneBtn">Clonar</span>
                        </button>
                        <button class="saved-plan-act-btn"
                                (click)="$event.stopPropagation(); confirmDeleteId.set(plan.id)"
                                title="Eliminar viaje">
                          🗑️ <span i18n="@@myTrips.deleteBtn">Eliminar</span>
                        </button>
                        <span class="saved-plan-chevron">{{ selectedPlanId() === plan.id ? '▲' : '▼' }}</span>
                      </div>
                    </div>

                    <div class="saved-plan-actions">
                      <button class="btn-pill btn-primary"
                              style="flex:1;justify-content:center;gap:7px"
                              (click)="loadAndModify(plan)" type="button"
                              i18n="@@myTrips.modifyPlanBtn">
                        ✏️ Modificar mi plan
                      </button>
                      @if (planShareId(plan)) {
                        <button class="btn-pill btn-ghost"
                                style="justify-content:center;gap:7px"
                                (click)="sharePlan(plan)" type="button"
                                i18n="@@myTrips.viewPublishedBtn">
                          🔗 Ver viaje publicado
                        </button>
                        <button class="btn-pill btn-outline"
                                style="justify-content:center;gap:6px"
                                (click)="shareNative(plan)" type="button"
                                i18n="@@share.shareBtn">📤 Compartir</button>
                      } @else {
                        <button class="btn-pill btn-outline"
                                style="justify-content:center;gap:6px"
                                (click)="sharePlan(plan)" type="button"
                                i18n="@@myTrips.publishBtn">
                          📤 Publicar
                        </button>
                      }
                      <button class="btn-pill btn-outline"
                              style="justify-content:center;gap:6px;white-space:nowrap"
                              [disabled]="exportingPlanId() === plan.id"
                              (click)="downloadItinerary(plan)" type="button">
                        {{ exportingPlanId() === plan.id ? '⏳' : '📥' }} Excel
                        @if (!plan.exportedAt) {
                          <span class="karma-cost">−1 ✨ karma</span>
                        }
                      </button>
                      @if (shareError() === plan.id) {
                        <span class="share-error">Karma insuficiente</span>
                      }
                    </div>

                    @if (selectedPlanId() === plan.id) {
                      <div class="saved-plan-itin">
                        <app-trip-itinerary [stops]="plan.stops" [transits]="plan.transits ?? []" />
                      </div>
                    }
                  </div>
                }
                @if (filteredPlans().length === 0) {
                  <div class="section-empty">Sin resultados para "{{ planSearch() }}" 🔍</div>
                }
              }
            }

            @if (favTab() === 'favorites') {
              @if (favorites.loading()) {
                <div class="fav-loading" i18n="@@profile.favLoading">Cargando favoritos…</div>
              } @else if (favorites.favoritedTrips().length === 0) {
                <div class="fav-empty">
                  <span class="fav-empty-icon">🤍</span>
                  <p i18n="@@profile.favEmpty">Todavía no guardaste ningún plan como favorito.</p>
                  <p i18n="@@profile.favEmptyHint">Explorá planes compartidos y presioná ❤️ para guardarlos aquí.</p>
                </div>
              } @else {
                <div class="fav-list">
                  @for (trip of favorites.favoritedTrips(); track trip.shareId) {
                    <div class="fav-card">
                      <div class="fav-card-header">
                        <span class="fav-card-name">{{ trip.tripName }}</span>
                        <span class="fav-card-owner" i18n="@@profile.favCardBy">por {{ trip.ownerName }}</span>
                      </div>
                      <div class="fav-card-meta">
                        <span class="fav-card-count">❤️ {{ trip.favoriteCount }}</span>
                        <span class="fav-card-date">{{ fmtDate(trip.favoritedAt) }}</span>
                      </div>
                      <div class="fav-card-actions">
                        <a class="btn-pill btn-outline" [routerLink]="['/shared', trip.shareId]"
                           i18n="@@profile.favCardOpen">Ver plan</a>
                        <button class="btn-pill btn-ghost fav-remove-btn"
                                (click)="removeFavorite(trip)"
                                i18n="@@profile.favCardRemove">Quitar de favoritos</button>
                      </div>
                    </div>
                  }
                </div>
              }
            }
          }
        </section>

        <!-- Also link to AI planning -->
        <section>
          <div style="padding:0 0 8px">
            <button class="btn-pill btn-outline" style="font-size:12px;padding:5px 14px"
                    (click)="openAiPlanning.emit()" type="button"
                    i18n="@@profile.aiBtn">✨ Nuevo viaje con IA</button>
          </div>
        </section>

      </div>
    </div>

    @if (toast()) {
      <app-toast [message]="toast()!" (done)="toast.set(null)" />
    }

    <!-- Clone confirmation modal -->
    @if (confirmCloneId()) {
      <div class="modal-backdrop" (click)="confirmCloneId.set(null)">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width:340px">
          <div class="modal-head" style="background:linear-gradient(135deg,var(--lav),var(--peach))">
            <div class="modal-title">📋 Clonar viaje</div>
            <div class="modal-sub">{{ planName(confirmCloneId()!) }}</div>
          </div>
          <div class="modal-body" style="padding:20px 24px">
            <p style="font-size:13px;color:var(--t2);margin:0;line-height:1.6">
              Se creará una copia de este viaje en tu lista de guardados.<br>
              Costo: <strong>−1 ✨ karma</strong>.
            </p>
          </div>
          <div class="modal-foot" style="gap:8px">
            <button class="btn-pill btn-outline" style="flex:1" (click)="confirmCloneId.set(null)" type="button">Cancelar</button>
            <button class="btn-pill btn-primary" style="flex:1" (click)="confirmClonePlan()" type="button">📋 Clonar</button>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirmation modal -->
    @if (confirmDeleteId()) {
      <div class="modal-backdrop" (click)="confirmDeleteId.set(null)">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width:340px">
          <div class="modal-head" style="background:linear-gradient(135deg,oklch(58% 0.2 25),oklch(46% 0.16 25))">
            <div class="modal-title">🗑️ Eliminar viaje</div>
            <div class="modal-sub">Esta acción no se puede deshacer</div>
          </div>
          <div class="modal-body" style="padding:20px 24px">
            <p style="font-size:13px;color:var(--t2);margin:0;line-height:1.6">
              ¿Eliminar <strong>"{{ planName(confirmDeleteId()!) }}"</strong>?<br>
              Perderás este viaje permanentemente.
            </p>
          </div>
          <div class="modal-foot" style="gap:8px">
            <button class="btn-pill btn-outline" style="flex:1" (click)="confirmDeleteId.set(null)" type="button">Cancelar</button>
            <button class="btn-pill btn-primary" style="flex:1;background:oklch(48% 0.18 25);border-color:oklch(48% 0.18 25)"
                    (click)="confirmDeletePlan()" type="button">🗑️ Eliminar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class MyTripsComponent {
  readonly auth       = inject(AuthService);
  readonly trip       = inject(TripService);
  readonly savedPlans = inject(SavedPlansService);
  readonly favorites  = inject(FavoritesService);
  private readonly sharedTrips = inject(SharedTripsService);
  private readonly karma       = inject(KarmaService);
  private readonly karmaModal  = inject(KarmaModalService);
  private readonly api         = inject(ApiService);
  private readonly router      = inject(Router);

  close          = output<void>();
  openAiPlanning = output<void>();

  // ── Favorites tab ──
  favTab = signal<'trips' | 'favorites'>('trips');

  openFavTab(): void {
    this.favTab.set('favorites');
    this.favorites.loadFavorites();
  }

  removeFavorite(trip: FavoritedTrip): void {
    this.favorites.toggle(trip.shareId, () => {}, () => {});
  }

  // ── Saved plans ──
  selectedPlanId  = signal<string | null>(null);
  planSearch      = signal('');
  publishedOnly   = signal(false);
  shareError      = signal<string | null>(null);
  exportingPlanId = signal<string | null>(null);
  toast           = signal<string | null>(null);
  confirmCloneId  = signal<string | null>(null);
  confirmDeleteId = signal<string | null>(null);
  cloningId       = signal<string | null>(null);

  readonly filteredPlans = computed(() => {
    const q = this.planSearch().toLowerCase().trim();
    let plans = this.savedPlans.plans();
    if (this.publishedOnly()) plans = plans.filter(p => !!this.planShareId(p));
    if (!q) return plans;
    return plans.filter(p => p.name.toLowerCase().includes(q));
  });

  planShareId(plan: SavedPlan): string | undefined {
    if (plan.shareId) return plan.shareId;
    const email = this.auth.currentUser()?.email;
    if (!email) return undefined;
    return this.sharedTrips.getMyTrips(email).find(t => t.planId === plan.id)?.id;
  }

  sharePlan(plan: SavedPlan): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const existingShareId = this.planShareId(plan);
    if (existingShareId) { this.copyLink(existingShareId, plan.id); return; }

    if (environment.useMocks) {
      const shareId = this.sharedTrips.createShare({
        ownerEmail: user.email, ownerName: user.name, tripName: plan.name,
        stops: plan.stops, transits: plan.transits ?? [], planId: plan.id,
      });
      this.savedPlans.setShareId(user.email, plan.id, shareId);
      this.copyLink(shareId, plan.id);
    } else {
      this.api.shareTrip(plan.id).subscribe({
        next: ({ shareId }) => {
          this.savedPlans.setShareId(user.email, plan.id, shareId);
          this.copyLink(shareId, plan.id);
        },
        error: err => { this.karmaModal.handleKarmaError(err); },
      });
    }
  }

  shareNative(plan: SavedPlan): void {
    const sid = this.planShareId(plan);
    if (sid) void shareTrip(plan.name, sid);
  }

  downloadItinerary(plan: SavedPlan): void {
    if (environment.useMocks) {
      if (!plan.exportedAt && (this.karma.karma() ?? 0) < 1) {
        this.karmaModal.openInsufficient(1, this.karma.karma() ?? 0);
        return;
      }
      const user = this.auth.currentUser();
      if (!plan.exportedAt && user) {
        this.karma.spend();
        this.savedPlans.markExported(user.email, plan.id);
      }
      this.toast.set('La exportación Excel requiere el backend activo');
      return;
    }

    const cityNames: Record<string, string> = {};
    const attractionNames: Record<string, string> = {};
    for (const stop of plan.stops) {
      const city = WORLD_CITIES.find(c => c.id === stop.cityId);
      if (!city) continue;
      cityNames[stop.cityId] = city.name;
      for (const att of getAttractions(city)) attractionNames[att.id] = att.name;
    }

    this.exportingPlanId.set(plan.id);
    this.api.exportItinerary(plan.id, cityNames, attractionNames).subscribe({
      next: (blob) => {
        const slug = plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `itinerario-${slug}.xlsx`; a.click();
        URL.revokeObjectURL(url);
        this.exportingPlanId.set(null);
        this.toast.set('Itinerario descargado');
        if (!plan.exportedAt) {
          const user = this.auth.currentUser();
          if (user) { this.karma.spend(); this.savedPlans.markExported(user.email, plan.id); }
        }
      },
      error: (err) => {
        this.exportingPlanId.set(null);
        if (!this.karmaModal.handleKarmaError(err)) this.toast.set('Error al descargar el itinerario');
      },
    });
  }

  private copyLink(shareId: string, _planId: string): void {
    // Clipboard needs a real absolute URL (it leaves the app); the follow-up
    // "view it" navigation stays in-app via the Router so the in-memory
    // access token survives instead of a full reload blanking it.
    navigator.clipboard.writeText(buildShareLink(shareId)).catch(() => {});
    this.router.navigate(['/shared', shareId]);
  }

  togglePlan(id: string): void {
    this.selectedPlanId.update(cur => cur === id ? null : id);
  }

  loadAndModify(plan: SavedPlan): void {
    this.trip.restoreStops(plan.stops, plan.id, plan.transits ?? []);
    this.close.emit();
  }

  planName(id: string): string {
    return this.savedPlans.plans().find(p => p.id === id)?.name ?? '';
  }

  confirmClonePlan(): void {
    const id = this.confirmCloneId();
    if (!id) return;
    this.confirmCloneId.set(null);
    this.cloningId.set(id);
    this.api.cloneOwnTrip(id).subscribe({
      next: cloned => {
        this.cloningId.set(null);
        this.savedPlans.register({
          id: cloned.id!, name: cloned.title,
          savedAt: cloned.createdAt ?? new Date().toISOString(),
          stops: cloned.stops, transits: cloned.transits ?? [],
        });
        this.toast.set(`"${cloned.title}" guardado`);
      },
      error: err => { this.cloningId.set(null); this.karmaModal.handleKarmaError(err); },
    });
  }

  confirmDeletePlan(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.savedPlans.remove(email, id);
    if (this.selectedPlanId() === id) this.selectedPlanId.set(null);
    this.confirmDeleteId.set(null);
  }

  fmtDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return iso; }
  }
}
