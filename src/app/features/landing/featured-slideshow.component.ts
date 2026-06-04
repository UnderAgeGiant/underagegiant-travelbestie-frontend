import {
  ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { FeaturedTrip } from '../../core/models/featured-trip.model';
import { ApiService } from '../../core/api/api.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';

@Component({
  selector: 'tb-featured-slideshow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  host: {
    '[style.display]':           'hostDisplay',
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
  `,
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
    const city = WORLD_CITIES.find(c => c.id === trip.stops[0]?.cityId);
    if (!city) return '';
    const attrId = trip.stops[0]?.selectedAttractions[0]?.attractionId;
    return getAttractions(city).find(a => a.id === attrId)?.imageUrl ?? '';
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
