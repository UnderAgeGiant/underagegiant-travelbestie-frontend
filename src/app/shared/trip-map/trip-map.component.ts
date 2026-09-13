import { AfterViewInit, ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CITY_COORDS } from '../../data/city-coords.data';
import { WORLD_CITIES } from '../../data/cities.data';
import { WORLD_MAP_LAND_D } from '../../data/world-map-outline.data';
import { WORLD_MAP_COUNTRIES } from '../../data/world-map-countries.data';
import { latLngToSvgPoint } from '../../core/maps/latlng-projection.util';
import { computeTripMapViewBox } from '../../core/maps/trip-map-viewbox.util';

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
      <svg class="trip-map-svg" [attr.viewBox]="viewBoxAttr()" preserveAspectRatio="none">
        @if (showCountryBorders()) {
          @for (country of worldMapCountries; track country.id) {
            <path [attr.d]="country.d" class="trip-map-country" [attr.aria-label]="country.name" />
          }
        } @else {
          <defs>
            <filter [attr.id]="landFilterId" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.18" result="tm-land-blur" />
              <feColorMatrix in="tm-land-blur" mode="matrix"
                              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
            </filter>
          </defs>
          <path [attr.d]="worldMapLandD" class="trip-map-land" [attr.filter]="'url(#' + landFilterId + ')'" />
        }

        @if (showFlightPath() && routeD(); as d) {
          <path [attr.d]="d" pathLength="100" stroke-dasharray="1 5" [attr.stroke-width]="routeStrokeWidth()" class="trip-map-route" />
          <svg class="trip-map-plane" viewBox="0 0 24 24"
               [attr.width]="planeSize()" [attr.height]="planeSize()" [attr.x]="-planeSize() / 2" [attr.y]="-planeSize() / 2"
               [style.offset-path]="planeOffsetPath()" aria-hidden="true">
            <path [attr.d]="planeIconPath" fill="currentColor"></path>
          </svg>
        }

        @for (pin of pins(); track pin.stopId ?? (pin.cityId + '_' + $index)) {
          <g class="trip-map-pin"
             [class.trip-map-pin-clickable]="interactive() && !!pin.stopId"
             [attr.transform]="pinTransform(pin)"
             [attr.aria-label]="pin.name"
             [attr.role]="interactive() && pin.stopId ? 'button' : null"
             [attr.tabindex]="interactive() && pin.stopId ? 0 : null"
             (click)="onPinClick(pin)"
             (keydown.enter)="onPinClick(pin)"
             (keydown.space)="onPinClick(pin)">
            <path class="trip-map-pin-body" [attr.d]="pinIconPath" />
          </g>
        }
      </svg>
    </div>
  `,
})
export class TripMapComponent implements AfterViewInit {
  readonly cities = input.required<TripMapCity[]>();
  readonly interactive = input(true);
  readonly showFlightPath = input(true);
  /**
   * `true` (default): draw real per-country borders (`WORLD_MAP_COUNTRIES`,
   * from Natural Earth's admin-0-countries dataset) — used by the two
   * interactive fullscreen modal hosts, where there's only ever one
   * instance on screen and the detail is worth it. `false`: fall back to
   * the single simplified silhouette (`WORLD_MAP_LAND_D`) with its
   * smoothing filter — used by MyTripsComponent's thumbnails, where
   * dozens of instances can render at once and 177 extra country paths
   * each would be wasted DOM weight nobody can see at 120px wide anyway.
   */
  readonly showCountryBorders = input(true);
  readonly pinClick = output<string>();

  protected readonly worldMapLandD = WORLD_MAP_LAND_D;
  protected readonly worldMapCountries = WORLD_MAP_COUNTRIES;
  protected readonly planeIconPath = 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z';
  /**
   * Same silhouette as MapsPinIconComponent's "place" glyph (24x24 space,
   * tip at ~(12, 21.2)) — reused here only for shape consistency with the
   * rest of the app's pin iconography. Not that component's "view on maps"
   * meaning: this marks a location on our own map, closer in spirit to
   * VisitedPlacesService's pins (see MapsPinIconComponent's own doc-comment
   * on keeping those two meanings distinct).
   */
  protected readonly pinIconPath =
    'M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.25 6.44 11.44 6.72 11.7a1.13 1.13 0 0 0 1.56 0c.28-.26 6.72-6.45 6.72-11.7C19.5 5.36 16.14 2 12 2zm0 10.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5z';
  /** Unique per instance so multiple `<app-trip-map>`s on one page (e.g. every My Trips card's thumbnail) never share — or collide on — an SVG filter id. */
  protected readonly landFilterId = `tm-land-smooth-${crypto.randomUUID()}`;
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

  /** Frames the trip's actual pins instead of always showing the whole world — see trip-map-viewbox.util.ts. */
  protected readonly viewBox = computed(() => computeTripMapViewBox(this.pins()));
  protected readonly viewBoxAttr = computed(() => {
    const { x, y, width, height } = this.viewBox();
    return `${x} ${y} ${width} ${height}`;
  });

  /**
   * Pins stay a roughly constant SCREEN size across zoom levels, like any
   * normal map's markers — scaling inversely with the current viewBox
   * width. A fixed SVG-unit pin size would otherwise visually balloon as
   * `viewBox` zooms in on a tight cluster of nearby stops.
   */
  protected readonly pinScale = computed(() => (this.viewBox().width / 100) * 0.1);

  /**
   * The flying plane, like the pins, must shrink proportionally with the
   * current viewBox zoom — its old fixed `width="4" height="4"` was sized
   * for the always-full-world viewBox this component used before
   * computeTripMapViewBox() existed, and would otherwise balloon to
   * dominate the frame once zoomed in on a tight cluster of nearby stops.
   */
  protected readonly planeSize = computed(() => (this.viewBox().width / 100) * 4);

  /**
   * Matches AboutComponent's `.about-path-bg path` (viewBox 0 0 640 120,
   * stroke-width 2.5 → 2.5/640 ≈ 0.39% of width) proportionally, then keeps
   * that same proportion at any zoom level the same way pinScale/planeSize
   * do — a fixed absolute stroke-width would otherwise thicken as the
   * viewBox zooms in. The dash pattern itself (`stroke-dasharray="1 5"`,
   * set directly in the template) doesn't need this treatment: `pathLength
   *="100"` already normalizes dash values to a fraction of the path's own
   * length, independent of viewBox size — the exact same technique
   * AboutComponent's connector path uses, so "1 5" there and here produce
   * an identical dash rhythm.
   */
  protected readonly routeStrokeWidth = computed(() => (this.viewBox().width / 100) * 0.39);

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

  /** Translates the pin's icon (tip at local (12, 21.2)) so its tip lands exactly on the pin's projected map coordinate, then scales it per pinScale(). */
  protected pinTransform(pin: TripMapPin): string {
    return `translate(${pin.x},${pin.y}) scale(${this.pinScale()}) translate(-12,-21.2)`;
  }

  protected onPinClick(pin: TripMapPin): void {
    if (this.interactive() && pin.stopId) this.pinClick.emit(pin.stopId);
  }
}
