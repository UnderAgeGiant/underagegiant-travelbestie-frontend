import { AfterViewInit, ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CITY_COORDS } from '../../data/city-coords.data';
import { WORLD_CITIES } from '../../data/cities.data';
import { WORLD_MAP_LAND_D } from '../../data/world-map-outline.data';
import { latLngToSvgPoint } from '../../core/maps/latlng-projection.util';

export interface TripMapCity {
  cityId: string;
  /** Present when the host can act on a click (planning/shared views); absent for a thumbnail or a not-yet-a-real-stop context. */
  stopId?: string;
}

interface TripMapPin {
  cityId: string;
  stopId?: string;
  name: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-trip-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="trip-map" [class.tm-played]="played()">
      <svg class="trip-map-svg" viewBox="0 0 100 50" preserveAspectRatio="none">
        <path [attr.d]="worldMapLandD" class="trip-map-land" />

        @if (showFlightPath() && routeD(); as d) {
          <path [attr.d]="d" pathLength="100" class="trip-map-route" />
          <svg class="trip-map-plane" viewBox="0 0 24 24" width="4" height="4" x="-2" y="-2"
               [style.offset-path]="planeOffsetPath()" aria-hidden="true">
            <path [attr.d]="planeIconPath" fill="currentColor"></path>
          </svg>
        }

        @for (pin of pins(); track pin.stopId ?? (pin.cityId + '_' + $index)) {
          <circle class="trip-map-pin"
                  [class.trip-map-pin-clickable]="interactive() && !!pin.stopId"
                  [attr.cx]="pin.x" [attr.cy]="pin.y" r="1.3"
                  [attr.aria-label]="pin.name"
                  [attr.role]="interactive() && pin.stopId ? 'button' : null"
                  [attr.tabindex]="interactive() && pin.stopId ? 0 : null"
                  (click)="onPinClick(pin)"
                  (keydown.enter)="onPinClick(pin)" />
        }
      </svg>
    </div>
  `,
})
export class TripMapComponent implements AfterViewInit {
  readonly cities = input.required<TripMapCity[]>();
  readonly interactive = input(true);
  readonly showFlightPath = input(true);
  readonly pinClick = output<string>();

  protected readonly worldMapLandD = WORLD_MAP_LAND_D;
  protected readonly planeIconPath = 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z';
  protected readonly played = signal(false);

  protected readonly pins = computed<TripMapPin[]>(() =>
    this.cities()
      .map((c): TripMapPin | null => {
        const coords = CITY_COORDS[c.cityId];
        if (!coords) return null;
        const { x, y } = latLngToSvgPoint(coords.lat, coords.lng);
        const city = WORLD_CITIES.find((w) => w.id === c.cityId);
        return { cityId: c.cityId, stopId: c.stopId, name: city?.name ?? c.cityId, x, y };
      })
      .filter((p): p is TripMapPin => p !== null),
  );

  protected readonly routeD = computed<string | null>(() => {
    const pts = this.pins();
    if (pts.length < 2) return null;
    const [first, ...rest] = pts;
    return `M${first.x},${first.y} ` + rest.map((p) => `L${p.x},${p.y}`).join(' ');
  });

  protected readonly planeOffsetPath = computed(() => {
    const d = this.routeD();
    return d ? `path('${d}')` : 'none';
  });

  ngAfterViewInit(): void {
    if (this.showFlightPath()) {
      setTimeout(() => this.played.set(true));
    }
  }

  protected onPinClick(pin: TripMapPin): void {
    if (this.interactive() && pin.stopId) this.pinClick.emit(pin.stopId);
  }
}
