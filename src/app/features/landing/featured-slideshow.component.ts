import {
  ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { FeaturedTrip } from '../../core/models/featured-trip.model';
import { ApiService } from '../../core/api/api.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';

const Q = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1920&q=80`;

// Verified direct Unsplash CDN photo IDs — stable, no API key needed.
// source.unsplash.com (the old random-by-keyword endpoint) is deprecated; these direct URLs are not.
const CITY_COVER_PHOTOS: Record<string, string> = {
  // Europe
  paris:          Q('1502602898657-3e91760cbb34'),
  london:         Q('1513635269975-59663e0ac1ad'),
  rome:           Q('1552832230-c0197dd311b5'),
  barcelona:      Q('1583422409516-2895a77efded'),
  amsterdam:      Q('1512470876302-972faa2aa9a4'),
  berlin:         Q('1528360983277-13d401cdc186'), // fallback: general Europe feel
  madrid:         Q('1539037116277-4db20889f2d4'),
  vienna:         Q('1516550135-5571cdac0edb'),
  prague:         Q('1541849546-216549ae216d'),
  lisbon:         Q('1513735492246-483525079686'),
  athens:         Q('1555993539-1732b0258235'),
  budapest:       Q('1568683254765-9bc96ca7e56a'),
  santorini:      Q('1570077188670-e3a8d69ac5ff'),
  venice:         Q('1514890547357-a9ee288728f0'),
  florence:       Q('1541331622-1d8f73c6ba80'),
  // Asia / Middle East
  tokyo:          Q('1540959733332-eab4deabeeaf'),
  kyoto:          Q('1528360983277-13d401cdc186'),
  osaka:          Q('1590559899731-a382839e5549'),
  seoul:          Q('1517154421773-0529f29ea451'),
  singapore:      Q('1525625293386-3f8f99389edd'),
  bangkok:        Q('1508009603885-50cf7c579365'),
  bali:           Q('1537996194471-e657df975ab4'),
  dubai:          Q('1512453979798-5ea266f8880c'),
  istanbul:       Q('1524231757912-21f4fe3a7200'),
  mumbai:         Q('1529253355930-ddbe423a2ac7'),
  cappadocia:     Q('1506905925346-21bda4d32df4'),
  // Americas
  newyork:        Q('1485871981521-5b1fd3805eee'),
  losangeles:     Q('1534190760961-74e8c1c5c3da'),
  miami:          Q('1514214246423-c03f8b9f4b80'),
  sanfrancisco:   Q('1501594907352-04cda38ebc29'),
  lasvegas:       Q('1536514045-4ee7a94a9d02'),
  toronto:        Q('1517935706615-2717063c2225'),
  mexicocity:     Q('1518105779142-d975f22f1b0a'),
  buenosaires:    Q('1591871937573-b6c028c23a0b'),
  rio:            Q('1483729558449-99ef09a8c325'),
  havana:         Q('1500822551395-2c1e5ef5aa93'),
  cusco:          Q('1526392060635-9d6019884377'),
  cartagena:      Q('1536037412888-b8e53b0e5b0b'),
  // Africa
  marrakech:      Q('1543349689-9a4d426bee8e'),
  cairo:          Q('1553913861-c0fddf2619ee'),
  capetown:       Q('1580060839134-75a5edca2e99'),
  // Oceania
  sydney:         Q('1523482580672-f109ba8cb9be'),
  melbourne:      Q('1514395462022-83c75de49c96'),
  auckland:       Q('1507699622278-fdf6e3073e2f'),
  queenstown:     Q('1506905925346-21bda4d32df4'),
};

@Component({
    selector: 'tb-featured-slideshow',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass],
    host: {
        '[style.display]': 'hostDisplay',
        '[class.landing-snap-child]': 'isVisible',
        '[class.featured-slideshow]': 'isVisible',
    },
    template: `
@for (trip of trips(); track trip.id; let i = $index) {
  <div [ngClass]="['s2-slide', activeIdx() === i ? 'active' : '']">
    <img [src]="coverUrl(trip)" [alt]="trip.tripName" />
    <div class="s2-overlay"></div>
    <div class="s2-content">
      <div class="s2-trip-block">
        <div class="s2-city-chips">
          @for (stop of trip.stops.slice(0,3); track stop.cityId) {
            <span class="s2-chip">{{ cityName(stop.cityId) }}</span>
          }
        </div>
        <h2 class="s2-trip-title">{{ trip.tripName }}</h2>
        <p class="s2-trip-by"><span i18n="@@landing.cardBy">por</span> {{ trip.ownerName }}</p>
        <button class="btn-pill s2-clone-btn"
                (click)="goToShared(trip.id)"
                i18n="@@landing.cloneBtn">⿻ Copia este viaje para ti</button>
      </div>
      <div class="s2-caption">
        <div class="s2-caption-attr">{{ firstAttrName(trip) }}</div>
        <div class="s2-caption-city">{{ firstCityName(trip) }}</div>
        <div class="s2-caption-country">{{ firstCityCountry(trip) }}</div>
      </div>
    </div>
  </div>
}

@if (trips().length > 1) {
  <div class="s2-dots">
    @for (trip of trips(); track trip.id; let i = $index) {
      <button [class]="'s2-dot' + (activeIdx() === i ? ' active' : '')"
              (click)="goTo(i)"></button>
    }
  </div>
  <div class="s2-arrows">
    <button class="s2-arrow" (click)="prev()">▲</button>
    <button class="s2-arrow" (click)="next()">▼</button>
  </div>
  <div class="s2-progress" [class.running]="running()"></div>
}
  `
})
export class FeaturedSlideshowComponent implements OnInit, OnDestroy {
  protected readonly trips     = signal<FeaturedTrip[]>([]);
  protected readonly activeIdx = signal(0);
  protected readonly running   = signal(false);
  private readonly loaded      = signal(false);

  // Host binding helpers — start hidden until loaded with trips
  get hostDisplay(): string | null {
    return !this.loaded() || this.trips().length === 0 ? 'none' : null;
  }
  get isVisible(): boolean {
    return this.loaded() && this.trips().length > 0;
  }

  private readonly api = inject(ApiService);
  private timer?: ReturnType<typeof setInterval>;
  private readonly INTERVAL = 5000;

  ngOnInit(): void {
    this.api.getFeatured().subscribe({
      next: trips => {
        this.trips.set(trips);
        this.loaded.set(true);
        if (trips.length > 1) this.startTimer();
      },
      error: () => {
        this.trips.set([]);
        this.loaded.set(true);
      },
    });
  }

  ngOnDestroy(): void { clearInterval(this.timer); }

  protected goTo(i: number): void {
    this.activeIdx.set((i + this.trips().length) % this.trips().length);
    this.resetTimer();
  }
  protected prev(): void { this.goTo(this.activeIdx() - 1); }
  protected next(): void { this.goTo(this.activeIdx() + 1); }

  protected goToShared(shareId: string): void {
    window.location.href = `/?share=${encodeURIComponent(shareId)}&highlight=clone`;
  }

  protected coverUrl(trip: FeaturedTrip): string {
    const cityId = trip.stops[0]?.cityId ?? '';
    const city   = WORLD_CITIES.find(c => c.id === cityId);
    if (!city) return CITY_COVER_PHOTOS[cityId] ?? '';
    const attrs  = getAttractions(city);
    const attrId = trip.stops[0]?.selectedAttractions[0]?.attractionId;
    return attrs.find(a => a.id === attrId)?.imageUrl
        ?? attrs.find(a => !!a.imageUrl)?.imageUrl
        ?? CITY_COVER_PHOTOS[cityId]
        ?? '';
  }

  protected cityName(cityId: string): string {
    return WORLD_CITIES.find(c => c.id === cityId)?.name ?? cityId;
  }

  protected firstCityName(trip: FeaturedTrip): string {
    return this.cityName(trip.stops[0]?.cityId ?? '');
  }

  protected firstCityCountry(trip: FeaturedTrip): string {
    return WORLD_CITIES.find(c => c.id === trip.stops[0]?.cityId)?.country ?? '';
  }

  protected firstAttrName(trip: FeaturedTrip): string {
    const city   = WORLD_CITIES.find(c => c.id === trip.stops[0]?.cityId);
    const attrId = trip.stops[0]?.selectedAttractions[0]?.attractionId;
    return (city ? getAttractions(city).find(a => a.id === attrId)?.name ?? '' : '').toUpperCase();
  }

  private startTimer(): void {
    this.running.set(true);
    this.timer = setInterval(() => {
      this.activeIdx.update(i => (i + 1) % this.trips().length);
      this.running.set(false);
      setTimeout(() => this.running.set(true), 50);
    }, this.INTERVAL);
  }

  private resetTimer(): void {
    clearInterval(this.timer);
    this.running.set(false);
    setTimeout(() => { this.running.set(true); this.startTimer(); }, 50);
  }
}
