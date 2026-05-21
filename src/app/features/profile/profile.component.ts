import { Component, inject, signal, computed, output } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { TripService } from '../trip/trip.service';
import { SavedPlansService, SavedPlan } from '../../core/saved-plans/saved-plans.service';
import { HomeAddressService } from '../../core/home-address/home-address.service';
import { SharedTripsService } from '../../core/shared-trips/shared-trips.service';
import { KarmaService } from '../../core/karma/karma.service';
import { VisitedPlacesService } from '../../core/visited-places/visited-places.service';
import { ApiService } from '../../core/api/api.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';
import { TripItineraryComponent } from './trip-itinerary.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [TripItineraryComponent, ToastComponent],
  template: `
    <div class="profile-page">

      <!-- Header bar -->
      <div class="prof-bar">
        <button class="back-btn" (click)="close.emit()" type="button">← Volver</button>
        <div class="prof-bar-title">Mi Perfil</div>
      </div>

      <!-- Scrollable body -->
      <div class="prof-body">

        <!-- Hero -->
        <div class="prof-hero">
          <div class="prof-av">{{ initials() }}</div>
          <div>
            <div class="prof-name">{{ auth.currentUser()?.name }}</div>
            <div class="prof-email">{{ auth.currentUser()?.email }}</div>
          </div>
        </div>

        <!-- Home address -->
        @if (auth.isLoggedIn()) {
          <div class="home-address-row">
            <span class="home-address-icon">🏠</span>
            @if (editingHome()) {
              <input class="form-input home-address-input"
                     [value]="homeInput()"
                     (input)="homeInput.set($any($event.target).value)"
                     placeholder="Ciudad o dirección de inicio…"
                     (keydown.enter)="saveHome()"
                     (keydown.escape)="editingHome.set(false)" />
              <button class="btn-pill btn-primary" style="padding:4px 12px;font-size:11px"
                      (click)="saveHome()">✓</button>
              <button class="btn-pill btn-outline" style="padding:4px 8px;font-size:11px"
                      (click)="editingHome.set(false)">✕</button>
            } @else {
              <span class="home-address-label"
                    (click)="openHomeEdit()">
                {{ homeAddress.address() || 'Agrega tu ciudad de origen…' }}
              </span>
              <button class="home-address-edit" (click)="openHomeEdit()" type="button">✏️</button>
            }
          </div>
        }

        <!-- Trip summary -->
        <section>
          <div class="section-head">Mis planificaciones ✈️</div>
          @if (trip.stops().length === 0) {
            <div class="section-empty">Aún no tienes destinos planificados. ¡Agrega tu primera ciudad!</div>
          } @else {
            <div class="trip-card">
              <div class="trip-card-name">Viaje actual</div>
              <div class="trip-stats">
                <div>
                  <div class="trip-stat-val">{{ trip.stops().length }}</div>
                  <div class="trip-stat-lbl">Ciudades</div>
                </div>
                <div>
                  <div class="trip-stat-val">{{ totalPlanned() }}</div>
                  <div class="trip-stat-lbl">Atracciones</div>
                </div>
                <div>
                  <div class="trip-stat-val">{{ totalAvailable() }}</div>
                  <div class="trip-stat-lbl">Disponibles</div>
                </div>
              </div>
              <div class="city-badges">
                @for (stop of trip.stops(); track stop.cityId) {
                  @let city = cityFor(stop.cityId);
                  @if (city) {
                    <div class="city-badge">
                      <span>{{ city.flag }}</span>
                      <span>{{ city.name }}</span>
                      @if (stop.selectedAttractions.length > 0) {
                        <span class="city-badge-att">{{ stop.selectedAttractions.length }}★</span>
                      }
                    </div>
                  }
                }
              </div>
            </div>
          }
        </section>

        <!-- Saved trips with itinerary -->
        <section>
          <div class="section-head">Viajes guardados 🗺️</div>
          @if (!auth.isLoggedIn()) {
            <div class="section-empty">Inicia sesión para ver tus viajes guardados.</div>
          } @else if (savedPlans.plans().length === 0) {
            <div class="section-empty">Aún no tienes viajes guardados. Usa el botón "Reservar viaje 🎉" para guardar uno.</div>
          } @else {
            @for (plan of savedPlans.plans(); track plan.id) {
              <div class="saved-plan-card">
                <div class="saved-plan-header" (click)="togglePlan(plan.id)">
                  <div class="saved-plan-info">
                    <div class="saved-plan-name">{{ plan.name }}</div>
                    <div class="saved-plan-meta">
                      {{ plan.stops.length }} ciudad{{ plan.stops.length !== 1 ? 'es' : '' }}
                      · {{ fmtDate(plan.savedAt) }}
                    </div>
                  </div>
                  <span class="saved-plan-chevron">{{ selectedPlanId() === plan.id ? '▲' : '▼' }}</span>
                </div>

                <div class="saved-plan-actions">
                  @if (planShareId(plan)) {
                    <button class="btn-pill btn-ghost"
                            style="flex:1;justify-content:center;gap:7px"
                            (click)="sharePlan(plan)" type="button">
                      🔗 Ver viaje compartido
                    </button>
                  } @else {
                    <button class="btn-pill btn-primary"
                            style="flex:1;justify-content:center;gap:7px"
                            (click)="sharePlan(plan)" type="button">
                      📤 Compartir viaje <span class="karma-cost">−1 ✨ karma</span>
                    </button>
                  }
                  <button class="btn-pill btn-outline"
                          style="justify-content:center;gap:6px;white-space:nowrap"
                          [disabled]="exportingPlanId() === plan.id"
                          (click)="downloadItinerary(plan)" type="button">
                    {{ exportingPlanId() === plan.id ? '⏳' : '📥' }} Excel <span class="karma-cost">−1 ✨ karma</span>
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
          }
        </section>

        <!-- World map -->
        <section>
          <div class="section-head">Lugares visitados 🗺</div>
          @if (!auth.isLoggedIn()) {
            <div class="section-empty">Inicia sesión para guardar tus lugares visitados en el mapa.</div>
          } @else {
            <p class="map-hint">
              Haz clic en el mapa para marcar un lugar que ya visitaste.
              Pasa el cursor sobre un pin para eliminarlo.
            </p>

            <div class="map-wrap" (click)="onMapClick($event)">
              <img class="world-map-img" src="world-map.webp" alt="World map" draggable="false" />

              @for (pin of visitedPlaces.pins(); track pin.id) {
                <div class="map-pin"
                     [style.left.%]="pin.x"
                     [style.top.%]="pin.y"
                     (click)="$event.stopPropagation()">
                  <div class="pin-icon">📍</div>
                  <div class="pin-label">{{ pin.label }}</div>
                  <button class="pin-del" (click)="removePin(pin.id)" type="button">✕</button>
                </div>
              }

              @if (pendingPin()) {
                <div class="map-pin pin-pending"
                     [style.left.%]="pendingPin()!.x"
                     [style.top.%]="pendingPin()!.y"
                     (click)="$event.stopPropagation()">
                  <div class="pin-icon">📍</div>
                </div>
              }
            </div>

            @if (pendingPin()) {
              <div class="pin-form" (click)="$event.stopPropagation()">
                <input class="pin-form-input"
                       [value]="pendingLabel()"
                       (input)="pendingLabel.set($any($event.target).value)"
                       placeholder="¿Qué lugar visitaste?"
                       (keydown.enter)="confirmPin()" />
                <button class="btn-pill btn-primary" style="padding:6px 14px;font-size:12px;flex-shrink:0"
                        (click)="confirmPin()" type="button">Agregar</button>
                <button class="btn-pill btn-outline" style="padding:6px 10px;font-size:12px;flex-shrink:0"
                        (click)="cancelPin()" type="button">✕</button>
              </div>
            }

            @if (visitedPlaces.pins().length > 0) {
              <div style="margin-top:12px;font-size:12px;color:var(--t3)">
                {{ visitedPlaces.pins().length }}
                lugar{{ visitedPlaces.pins().length !== 1 ? 'es' : '' }}
                marcado{{ visitedPlaces.pins().length !== 1 ? 's' : '' }}
              </div>
            }
          }
        </section>

      </div>
    </div>

    @if (toast()) {
      <app-toast [message]="toast()!" (done)="toast.set(null)" />
    }
  `,
})
export class ProfileComponent {
  readonly auth          = inject(AuthService);
  readonly trip          = inject(TripService);
  readonly savedPlans    = inject(SavedPlansService);
  readonly homeAddress   = inject(HomeAddressService);
  readonly visitedPlaces = inject(VisitedPlacesService);
  private readonly sharedTrips   = inject(SharedTripsService);
  private readonly karma         = inject(KarmaService);
  private readonly api           = inject(ApiService);

  close = output<void>();

  selectedPlanId  = signal<string | null>(null);
  shareError      = signal<string | null>(null);
  exportingPlanId = signal<string | null>(null);
  toast           = signal<string | null>(null);
  editingHome     = signal(false);
  homeInput       = signal('');
  pendingPin      = signal<{ x: number; y: number } | null>(null);
  pendingLabel    = signal('');

  readonly initials = computed(() => {
    const name = this.auth.currentUser()?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  });

  readonly totalPlanned = computed(() =>
    this.trip.stops().reduce((sum, s) => sum + s.selectedAttractions.length, 0)
  );

  readonly totalAvailable = computed(() =>
    this.trip.stops().reduce((sum, s) => {
      const city = WORLD_CITIES.find(c => c.id === s.cityId);
      return sum + (city ? getAttractions(city).length : 0);
    }, 0)
  );

  openHomeEdit(): void {
    this.homeInput.set(this.homeAddress.address());
    this.editingHome.set(true);
  }

  saveHome(): void {
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.homeAddress.save(email, this.homeInput());
    this.editingHome.set(false);
  }

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
    if (existingShareId) {
      this.copyLink(existingShareId, plan.id);
      return;
    }

    if ((this.karma.karma() ?? 0) < 1) {
      this.shareError.set(plan.id);
      setTimeout(() => this.shareError.set(null), 2000);
      return;
    }

    this.karma.spend();
    const shareId = this.sharedTrips.createShare({
      ownerEmail: user.email,
      ownerName:  user.name,
      tripName:   plan.name,
      stops:      plan.stops,
      transits:   plan.transits ?? [],
      planId:     plan.id,
    });
    this.savedPlans.setShareId(user.email, plan.id, shareId);
    this.copyLink(shareId, plan.id);
  }

  downloadItinerary(plan: SavedPlan): void {
    if (environment.useMocks) {
      this.toast.set('La exportación Excel requiere el backend activo');
      return;
    }

    const cityNames: Record<string, string> = {};
    const attractionNames: Record<string, string> = {};

    for (const stop of plan.stops) {
      const city = WORLD_CITIES.find(c => c.id === stop.cityId);
      if (!city) continue;
      cityNames[stop.cityId] = city.name;
      for (const att of getAttractions(city)) {
        attractionNames[att.id] = att.name;
      }
    }

    this.exportingPlanId.set(plan.id);
    this.api.exportItinerary(plan.id, cityNames, attractionNames).subscribe({
      next: (blob) => {
        const slug = plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `itinerario-${slug}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportingPlanId.set(null);
        this.toast.set('Itinerario descargado');
      },
      error: () => {
        this.exportingPlanId.set(null);
        this.toast.set('Error al descargar el itinerario');
      },
    });
  }

  private copyLink(shareId: string, _planId: string): void {
    const url = `${window.location.origin}/?share=${shareId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    window.location.href = url;
  }

  togglePlan(id: string): void {
    this.selectedPlanId.update(cur => cur === id ? null : id);
  }

  fmtDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return iso; }
  }

  cityFor(cityId: string) {
    return WORLD_CITIES.find(c => c.id === cityId) ?? null;
  }

  onMapClick(event: MouseEvent): void {
    if (this.pendingPin()) { this.cancelPin(); return; }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = +((event.clientX - rect.left) / rect.width * 100).toFixed(2);
    const y = +((event.clientY - rect.top)  / rect.height * 100).toFixed(2);
    this.pendingPin.set({ x, y });
    this.pendingLabel.set('');
  }

  confirmPin(): void {
    const label = this.pendingLabel().trim();
    if (!label) return;
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.visitedPlaces.addPin(email, { ...this.pendingPin()!, label });
    this.pendingPin.set(null);
    this.pendingLabel.set('');
  }

  cancelPin(): void {
    this.pendingPin.set(null);
    this.pendingLabel.set('');
  }

  removePin(id: string): void {
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.visitedPlaces.removePin(email, id);
  }
}
