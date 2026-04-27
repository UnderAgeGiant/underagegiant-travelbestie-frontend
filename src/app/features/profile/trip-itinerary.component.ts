import { Component, input, computed } from '@angular/core';
import { TripStop, TransitLeg, TransitMode, TransitSegment } from '../../core/models/trip.model';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-trip-itinerary',
  standalone: true,
  imports: [DurationPipe],
  template: `
    <div class="itin">

      <!-- Departure flight -->
      @let dep = legFor('__start__', '__start__');
      @if (dep) {
        <div class="itin-transit itin-edge-transit">
          <span class="itin-transit-tag">Salida 🏠</span>
          @for (seg of dep.segments; track $index; let segLast = $last) {
            <span class="itin-seg">{{ fmtSeg(seg) }}</span>
            @if (seg.notes) { <span class="itin-notes">· {{ seg.notes }}</span> }
            @if (!segLast) { <span class="itin-chain">↓</span> }
          }
        </div>
        <div class="itin-line"></div>
      }

      @for (stop of stops(); track stop.cityId; let i = $index; let last = $last) {
        @let city = cityFor(stop.cityId);
        @if (city) {

          <!-- City card -->
          <div class="itin-city">
            <div class="itin-city-head">
              <span class="itin-city-flag">{{ city.flag }}</span>
              <div>
                <div class="itin-city-name">{{ city.name }}</div>
                <div class="itin-city-country">{{ city.country }}</div>
                @if (stop.checkIn) {
                  <div class="itin-city-dates">{{ stop.checkIn }} → {{ stop.checkOut }}</div>
                }
              </div>
            </div>

            @if (stop.lodging || stop.selectedAttractions.length > 0) {
              <div class="itin-items">

                @if (stop.lodging) {
                  <div class="itin-item itin-item-lodging">
                    <span class="itin-item-icon">🏨</span>
                    <span class="itin-item-label">{{ stop.lodging.name }}</span>
                    @if (stop.lodging.url) {
                      <a class="itin-link" [href]="stop.lodging.url"
                         target="_blank" rel="noopener noreferrer"
                         (click)="$event.stopPropagation()"
                         title="Abrir reserva">🔗</a>
                    }
                  </div>
                }

                @for (planned of stop.selectedAttractions; track planned.attractionId) {
                  @let att = attFor(stop.cityId, planned.attractionId);
                  @if (att) {
                    <div class="itin-item">
                      <span class="itin-item-icon">{{ att.icon }}</span>
                      <span class="itin-item-label">{{ att.name }}</span>
                      <span class="itin-item-meta">
                        {{ planned.startTime }} · {{ att.estimatedMinutes | duration }}
                      </span>
                    </div>
                  }
                }

              </div>
            }
          </div>

          <!-- Transit to next city or return flight -->
          @if (!last) {
            @let nextStop = stops()[i + 1];
            @let leg = legFor(stop.cityId, nextStop.cityId);
            @let nextCity = cityFor(nextStop.cityId);
            <div class="itin-line"></div>
            <div class="itin-transit">
              @if (leg) {
                @for (seg of leg.segments; track $index; let segLast = $last) {
                  <span class="itin-seg">{{ fmtSeg(seg) }}</span>
                  @if (seg.notes) { <span class="itin-notes">· {{ seg.notes }}</span> }
                  @if (!segLast) { <span class="itin-chain">↓</span> }
                }
              } @else {
                <span class="itin-no-transit">Sin transporte definido</span>
              }
              @if (nextCity) {
                <span class="itin-transit-dest">→ {{ nextCity.flag }} {{ nextCity.name }}</span>
              }
            </div>
            <div class="itin-line"></div>
          } @else {
            @let ret = legFor('__end__', '__end__');
            @if (ret) {
              <div class="itin-line"></div>
              <div class="itin-transit itin-edge-transit">
                <span class="itin-transit-tag">Vuelta 🏠</span>
                @for (seg of ret.segments; track $index; let segLast = $last) {
                  <span class="itin-seg">{{ fmtSeg(seg) }}</span>
                  @if (seg.notes) { <span class="itin-notes">· {{ seg.notes }}</span> }
                  @if (!segLast) { <span class="itin-chain">↓</span> }
                }
              </div>
            }
          }

        }
      }
    </div>
  `,
})
export class TripItineraryComponent {
  readonly stops    = input<TripStop[]>([]);
  readonly transits = input<TransitLeg[]>([]);

  private readonly transitMap = computed(() => {
    const map = new Map<string, TransitLeg>();
    for (const t of this.transits()) map.set(`${t.fromCityId}|${t.toCityId}`, t);
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

  modeIcon(mode: TransitMode): string {
    const icons: Record<TransitMode, string> = {
      flight: '✈️', train: '🚂', boat: '🚢', bus: '🚌', car: '🚗',
    };
    return icons[mode] ?? '🚀';
  }

  fmtDur(mins: number): string {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    return h > 0 ? `${h}h` : `${m}m`;
  }

  computeMins(seg: TransitSegment): number {
    if (seg.departureDate && seg.departureTime && seg.arrivalDate && seg.arrivalTime) {
      const parse = (d: string, t: string) => {
        const [dd, mm, yyyy] = d.split('/').map(Number);
        const [hh, mi]       = t.split(':').map(Number);
        return new Date(yyyy, mm - 1, dd, hh ?? 0, mi ?? 0).getTime();
      };
      return Math.max(0, Math.round(
        (parse(seg.arrivalDate, seg.arrivalTime) - parse(seg.departureDate, seg.departureTime)) / 60000
      ));
    }
    return seg.durationMinutes ?? 0;
  }

  fmtSeg(seg: TransitSegment): string {
    const icon = this.modeIcon(seg.mode);
    if (seg.departureDate && seg.departureTime && seg.arrivalDate && seg.arrivalTime) {
      const sameDay = seg.departureDate === seg.arrivalDate;
      const arr     = sameDay ? seg.arrivalTime : `${seg.arrivalDate} ${seg.arrivalTime}`;
      return `${icon} ${seg.departureDate} ${seg.departureTime} → ${arr} (${this.fmtDur(this.computeMins(seg))})`;
    }
    return `${icon} ${this.fmtDur(seg.durationMinutes ?? 0)}`;
  }

  totalDuration(leg: TransitLeg): number {
    return leg.segments.reduce((sum, s) => sum + this.computeMins(s), 0);
  }
}
