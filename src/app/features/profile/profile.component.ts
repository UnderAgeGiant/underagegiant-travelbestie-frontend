import { Component, inject, signal, computed, output } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { TripService } from '../trip/trip.service';
import { VisitedPlacesService } from '../../core/visited-places/visited-places.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';

@Component({
  selector: 'app-profile',
  standalone: true,
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
                  <div class="trip-stat-lbl">Planificadas</div>
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
  `,
})
export class ProfileComponent {
  readonly auth          = inject(AuthService);
  readonly trip          = inject(TripService);
  readonly visitedPlaces = inject(VisitedPlacesService);

  close = output<void>();

  pendingPin   = signal<{ x: number; y: number } | null>(null);
  pendingLabel = signal('');

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
