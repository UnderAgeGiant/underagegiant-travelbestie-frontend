import { Component, inject, input, computed, signal, effect } from '@angular/core';
import { SharedTrip, SharedTripsService } from '../../core/shared-trips/shared-trips.service';
import { ApiService } from '../../core/api/api.service';
import { StepCommentsComponent } from './step-comments.component';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { NavComponent } from '../nav/nav.component';
import { ProfileComponent } from '../profile/profile.component';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';
import { TransitLeg, TransitMode, TransitSegment } from '../../core/models/trip.model';

@Component({
  selector: 'app-shared-trip',
  standalone: true,
  imports: [StepCommentsComponent, DurationPipe, NavComponent, ProfileComponent],
  styles: [`
    .step-comments-toggle {
      display: inline-flex; align-items: center; gap: 3px;
      background: none; border: none; cursor: pointer;
      font-size: 13px; padding: 0 4px; margin-left: 6px;
      opacity: 0.35; transition: opacity .15s; vertical-align: middle;
    }
    .step-comments-toggle:hover { opacity: 1; }
    .step-comments-label { font-size: 11px; font-weight: 500; }
  `],
  template: `
    <div class="shared-page">

    <div class="shared-bg"></div>
    <div class="shared-bg-frost"></div>

    <app-nav (logoClick)="goHome()" (profileClick)="showProfile.set(true)" />

    @if (showProfile()) {
      <app-profile (close)="showProfile.set(false)" />
    }

    @if (trip()) {
      <div class="shared-body">

        <!-- Trip header -->
        <div class="shared-header">
          <div class="shared-header-name">{{ trip()!.tripName }}</div>
          <div class="shared-header-owner">Viaje de {{ trip()!.ownerName }}</div>
          <div class="shared-header-stops">
            @for (stop of trip()!.stops; track stop.cityId; let i = $index; let last = $last) {
              @let city = cityFor(stop.cityId);
              @if (city) {
                <span class="shared-header-flag" [title]="city.name">{{ city.flag }}</span>
              }
              @if (!last) {
                @let nextStop = trip()!.stops[i + 1];
                @let leg = legFor(stop.cityId, nextStop.cityId);
                @if (leg && leg.segments.length > 0) {
                  <span class="shared-header-mode" [title]="leg.segments[0].mode">{{ modeIcon(leg.segments[0].mode) }}</span>
                }
              }
            }
          </div>
        </div>

        <!-- Itinerary with per-step comments -->
        <div class="itin">

          <!-- Departure flight -->
          @let dep = legFor('__start__', '__start__');
          @if (dep) {
            <div class="itin-transit itin-edge-transit">
              <span class="itin-transit-tag">Salida 🏠
                @if (!shouldShowComments('transit:__start__')) {
                  <button class="step-comments-toggle" (click)="expandStep('transit:__start__')"><span class="step-comments-label">comment</span> ✍️</button>
                }
              </span>
              @for (seg of dep.segments; track $index; let sl = $last) {
                <span class="itin-seg">{{ fmtSeg(seg) }}</span>
                @if (!sl) { <span class="itin-chain">↓</span> }
              }
              @if (dep.segments.length > 1) {
                <span class="itin-transit-total">Total: {{ fmtDur(totalMins(dep)) }}</span>
              }
            </div>
            @if (shouldShowComments('transit:__start__')) {
              <app-step-comments [tripId]="trip()!.id" stepKey="transit:__start__" [ownerEmail]="trip()!.ownerEmail" (focusLost)="collapseStep('transit:__start__')" />
            }
            <div class="itin-line"></div>
          }

          @for (stop of trip()!.stops; track stop.cityId; let i = $index; let last = $last) {
            @let city = cityFor(stop.cityId);
            @if (city) {
              @let stopKey = 'stop:' + stop.cityId;

              <!-- City card -->
              <div class="itin-city">
                <div class="itin-city-head">
                  <span class="itin-city-flag">{{ city.flag }}</span>
                  <div>
                    <div class="itin-city-name" style="display:flex;align-items:center">{{ city.name }}
                      @if (!shouldShowComments(stopKey)) {
                        <button class="step-comments-toggle" (click)="expandStep(stopKey)"><span class="step-comments-label">comment</span> ✍️</button>
                      }
                    </div>
                    <div class="itin-city-country">{{ city.country }}</div>
                    @if (stop.checkIn) {
                      <div class="itin-city-dates">{{ stop.checkIn }} → {{ stop.checkOut }}</div>
                    }
                  </div>
                </div>

                @if (stop.lodging || stop.selectedAttractions.length > 0) {
                  <div class="itin-items">

                    @if (stop.lodging) {
                      @let lodgeKey = 'lodge:' + stop.cityId;
                      <div class="itin-item itin-item-lodging">
                        <span class="itin-item-icon">🏨</span>
                        <span class="itin-item-label">{{ stop.lodging.name }}</span>
                        @if (!shouldShowComments(lodgeKey)) {
                          <button class="step-comments-toggle" (click)="expandStep(lodgeKey)"><span class="step-comments-label">comment</span> ✍️</button>
                        }
                        @if (stop.lodging.url) {
                          <a class="itin-link" [href]="stop.lodging.url"
                             target="_blank" rel="noopener noreferrer"
                             (click)="$event.stopPropagation()">🔗</a>
                        }
                      </div>
                      @if (shouldShowComments(lodgeKey)) {
                        <app-step-comments [tripId]="trip()!.id" [stepKey]="lodgeKey" [ownerEmail]="trip()!.ownerEmail" (focusLost)="collapseStep(lodgeKey)" />
                      }
                    }

                    @for (planned of stop.selectedAttractions; track planned.attractionId) {
                      @let att = attFor(stop.cityId, planned.attractionId);
                      @if (att) {
                        @let attKey = 'att:' + stop.cityId + ':' + planned.attractionId;
                        @let attDate = planned.date || stop.checkIn;
                        <div class="itin-item">
                          <span class="itin-item-icon">{{ att.icon }}</span>
                          <span class="itin-item-label">{{ att.name }}</span>
                          @if (!shouldShowComments(attKey)) {
                            <button class="step-comments-toggle" (click)="expandStep(attKey)"><span class="step-comments-label">comment</span> ✍️</button>
                          }
                          <span class="itin-item-meta">
                            @if (attDate) { {{ shortDate(attDate) }} · }{{ planned.startTime }} · {{ att.estimatedMinutes | duration }}
                          </span>
                        </div>
                        @if (shouldShowComments(attKey)) {
                          <app-step-comments [tripId]="trip()!.id" [stepKey]="attKey" [ownerEmail]="trip()!.ownerEmail" (focusLost)="collapseStep(attKey)" />
                        }
                      }
                    }

                  </div>
                }
              </div>

              <!-- City-level comments -->
              @if (shouldShowComments(stopKey)) {
                <app-step-comments [tripId]="trip()!.id" [stepKey]="stopKey" [ownerEmail]="trip()!.ownerEmail" (focusLost)="collapseStep(stopKey)" />
              }

              <!-- Transit to next city or return flight -->
              @if (!last) {
                @let nextStop = trip()!.stops[i + 1];
                @let legKey = 'transit:' + stop.cityId + ':' + nextStop.cityId;
                @let leg = legFor(stop.cityId, nextStop.cityId);
                @let nextCity = cityFor(nextStop.cityId);
                <div class="itin-line"></div>
                <div class="itin-transit">
                  @if (leg) {
                    @for (seg of leg.segments; track $index; let sl = $last) {
                      <span class="itin-seg">{{ fmtSeg(seg) }}</span>
                      @if (!sl) { <span class="itin-chain">↓</span> }
                    }
                    @if (leg.segments.length > 1) {
                      <span class="itin-transit-total">Total: {{ fmtDur(totalMins(leg)) }}</span>
                    }
                  } @else {
                    <span class="itin-no-transit">Sin transporte definido</span>
                  }
                  @if (nextCity) {
                    <span class="itin-transit-dest">→ {{ nextCity.flag }} {{ nextCity.name }}
                      @if (!shouldShowComments(legKey)) {
                        <button class="step-comments-toggle" (click)="expandStep(legKey)"><span class="step-comments-label">comment</span> ✍️</button>
                      }
                    </span>
                  }
                </div>
                @if (shouldShowComments(legKey)) {
                  <app-step-comments [tripId]="trip()!.id" [stepKey]="legKey" [ownerEmail]="trip()!.ownerEmail" (focusLost)="collapseStep(legKey)" />
                }
                <div class="itin-line"></div>

              } @else {
                <!-- Return flight -->
                @let ret = legFor('__end__', '__end__');
                @if (ret) {
                  <div class="itin-line"></div>
                  <div class="itin-transit itin-edge-transit">
                    <span class="itin-transit-tag">Vuelta 🏠
                      @if (!shouldShowComments('transit:__end__')) {
                        <button class="step-comments-toggle" (click)="expandStep('transit:__end__')"><span class="step-comments-label">comment</span> ✍️</button>
                      }
                    </span>
                    @for (seg of ret.segments; track $index; let sl = $last) {
                      <span class="itin-seg">{{ fmtSeg(seg) }}</span>
                      @if (!sl) { <span class="itin-chain">↓</span> }
                    }
                    @if (ret.segments.length > 1) {
                      <span class="itin-transit-total">Total: {{ fmtDur(totalMins(ret)) }}</span>
                    }
                  </div>
                  @if (shouldShowComments('transit:__end__')) {
                    <app-step-comments [tripId]="trip()!.id" stepKey="transit:__end__" [ownerEmail]="trip()!.ownerEmail" (focusLost)="collapseStep('transit:__end__')" />
                  }
                }
              }

            }
          }
        </div>

      </div>

    } @else if (loading()) {
      <div class="shared-not-found">
        <img src="/Paper-Plane-Animation.gif" alt="Cargando…"
             style="width:140px;height:140px;object-fit:cover;border-radius:32px;margin-bottom:16px;box-shadow:0 8px 32px rgba(0,0,0,.12)">
        <div style="font-size:18px;font-weight:600;color:var(--t1)">Cargando viaje…</div>
        <div style="font-size:13px;color:var(--t3);margin-top:6px">Un momento por favor.</div>
      </div>
    } @else if (rateLimited()) {
      <div class="shared-not-found">
        <div style="font-size:52px;margin-bottom:12px">⏳</div>
        <div style="font-size:18px;font-weight:600;color:var(--t1)">Demasiadas solicitudes</div>
        <div style="font-size:13px;color:var(--t3);margin-top:6px">Espera un momento e intenta de nuevo.</div>
        <button class="btn-pill btn-primary" style="margin-top:20px" (click)="retry()">Intentar de nuevo</button>
      </div>
    } @else {
      <div class="shared-not-found">
        <div style="font-size:52px;margin-bottom:12px">🗺️</div>
        <div style="font-size:18px;font-weight:600;color:var(--t1)">Viaje no encontrado</div>
        <div style="font-size:13px;color:var(--t3);margin-top:6px">El enlace puede haber expirado o ser incorrecto.</div>
        <button class="btn-pill btn-primary" style="margin-top:20px" (click)="goHome()">Ir al inicio</button>
      </div>
    }

    </div>
  `,
})
export class SharedTripComponent {
  readonly tripId = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly svc = inject(SharedTripsService);

  showProfile    = signal(false);
  rateLimited    = signal(false);
  loading        = signal(true);
  expandedSteps  = signal(new Set<string>());

  shouldShowComments(stepKey: string): boolean {
    const tripId = this.trip()?.id;
    if (!tripId) return false;
    return this.expandedSteps().has(stepKey) ||
           this.svc.getComments(tripId, stepKey).length > 0;
  }

  expandStep(stepKey: string): void {
    this.expandedSteps.update(s => new Set(s).add(stepKey));
  }

  collapseStep(stepKey: string): void {
    this.expandedSteps.update(s => { const n = new Set(s); n.delete(stepKey); return n; });
  }

  private readonly _trip = signal<SharedTrip | null>(null);
  readonly trip = this._trip.asReadonly();

  constructor() {
    effect(() => {
      const id = this.tripId();
      this.rateLimited.set(false);
      this.loading.set(true);
      this.fetchTrip(id);
    }, { allowSignalWrites: true });
  }

  private fetchTrip(id: string): void {
    this.api.getSharedTrip(id).subscribe({
      next: data  => { this._trip.set(data);   this.loading.set(false); },
      error: err  => {
        if (err?.status === 429) this.rateLimited.set(true);
        else this._trip.set(null);
        this.loading.set(false);
      },
    });
  }

  retry(): void {
    this.rateLimited.set(false);
    this.loading.set(true);
    this.fetchTrip(this.tripId());
  }

  private readonly transitMap = computed(() => {
    const map = new Map<string, TransitLeg>();
    for (const t of this.trip()?.transits ?? []) map.set(`${t.fromCityId}|${t.toCityId}`, t);
    return map;
  });

  legFor(from: string, to: string): TransitLeg | null {
    return this.transitMap().get(`${from}|${to}`) ?? null;
  }

  cityFor(cityId: string) {
    return WORLD_CITIES.find(c => c.id === cityId) ?? null;
  }

  attFor(cityId: string, attractionId: string) {
    const city = this.cityFor(cityId);
    if (!city) return null;
    return getAttractions(city).find(a => a.id === attractionId) ?? null;
  }

  goHome(): void { window.location.href = '/'; }

  shortDate(s: string): string {
    const p = s.split('/');
    return p.length >= 2 ? `${p[0]}/${p[1]}` : s;
  }

  fmtDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return iso; }
  }

  computeMins(seg: TransitSegment): number {
    if (seg.departureDate && seg.departureTime && seg.arrivalDate && seg.arrivalTime) {
      const parse = (d: string, t: string) => {
        const [dd, mm, yyyy] = d.split('/').map(Number);
        const [hh, mi]       = t.split(':').map(Number);
        return new Date(yyyy, mm - 1, dd, hh ?? 0, mi ?? 0).getTime();
      };
      return Math.max(0, Math.round((parse(seg.arrivalDate, seg.arrivalTime) - parse(seg.departureDate, seg.departureTime)) / 60000));
    }
    return seg.durationMinutes ?? 0;
  }

  fmtDur(mins: number): string {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    return h > 0 ? `${h}h` : `${m}m`;
  }

  modeIcon(mode: TransitMode): string {
    const icons: Record<TransitMode, string> = { flight: '✈️', train: '🚂', boat: '🚢', bus: '🚌', car: '🚗' };
    return icons[mode] ?? '→';
  }

  fmtSeg(seg: TransitSegment): string {
    const icons: Record<TransitMode, string> = { flight: '✈️', train: '🚂', boat: '🚢', bus: '🚌', car: '🚗' };
    const icon = icons[seg.mode] ?? '🚀';
    let display: string;
    if (seg.departureDate && seg.departureTime && seg.arrivalDate && seg.arrivalTime) {
      const sameDay = seg.departureDate === seg.arrivalDate;
      const arr     = sameDay ? seg.arrivalTime : `${seg.arrivalDate} ${seg.arrivalTime}`;
      display = `${icon} ${seg.departureDate} ${seg.departureTime} → ${arr} (${this.fmtDur(this.computeMins(seg))})`;
    } else {
      display = `${icon} ${this.fmtDur(seg.durationMinutes ?? 0)}`;
    }
    return seg.notes ? `${display} · ${seg.notes}` : display;
  }

  totalMins(leg: TransitLeg): number {
    return leg.segments.reduce((sum, s) => sum + this.computeMins(s), 0);
  }
}
