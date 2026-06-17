import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { TripService } from '../trip/trip.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { REGION_LABELS } from '../../core/models/city.model';
import { getAttractions } from '../../data/attractions.data';
import { AttractionCardComponent } from './attraction-card/attraction-card.component';
import { Comment } from '../../core/models/comment.model';
import { ApiService } from '../../core/api/api.service';
import { AttractionCategory, CATEGORY_META, ALL_CATEGORIES } from '../../core/models/attraction-category';

@Component({
  selector: 'app-destination',
  standalone: true,
  imports: [AttractionCardComponent],
  template: `
    <div class="dest-view">
      @if (city()) {
        <div class="dest-banner">
          <div class="dest-banner-flag">{{ city()!.flag }}</div>
          <div class="dest-banner-info">
            <div class="dest-banner-name">{{ city()!.name }}</div>
            <div class="dest-banner-country">📍 {{ city()!.country }}</div>
            <div class="dest-banner-badges">
              <span class="badge" [style.background]="regionBg()" [style.color]="regionColor()">
                {{ regionLabel() }}
              </span>
              <span class="badge" style="background:var(--cream);color:var(--t2);border:1px solid var(--border)">
                {{ attractions().length }}
                @if (attractions().length === 1) {
                  <ng-container i18n="@@dest.oneAttraction">atracción</ng-container>
                } @else {
                  <ng-container i18n="@@dest.manyAttractions">atracciones</ng-container>
                }
              </span>

              @if (activeStop()?.checkIn && activeStop()?.checkOut) {
                <span class="badge" style="background:var(--cream);color:var(--t3);border:1px solid var(--border);font-size:10px">
                  {{ activeStop()!.checkIn }} → {{ activeStop()!.checkOut }}
                </span>
              }
            </div>
          </div>
        </div>
        <div class="attractions-area">
          <div class="attractions-top">
            <div class="attractions-label" i18n="@@dest.exploreTitle">Explorar atracciones</div>
            <span class="att-count">
              {{ filteredAttractions().length }}
              @if (filteredAttractions().length === 1) {
                <ng-container i18n="@@dest.onePlace">lugar</ng-container>
              } @else {
                <ng-container i18n="@@dest.manyPlaces">lugares</ng-container>
              }
            </span>
          </div>

          @if (availableCategories().length > 1) {
            <div class="att-filter-row">
              <button class="att-filter-chip" [class.active]="filterCategory() === null"
                      (click)="filterCategory.set(null)" type="button"
                      i18n="@@dest.filterAll">Todos</button>
              @for (cat of availableCategories(); track cat.code) {
                <button class="att-filter-chip" [class.active]="filterCategory() === cat.code"
                        [style.--chip-bg]="cat.bg"
                        (click)="filterCategory.set(filterCategory() === cat.code ? null : cat.code)"
                        type="button">
                  {{ cat.icon }} {{ cat.label }}
                </button>
              }
            </div>
          }

          <div class="att-grid">
            @for (att of filteredAttractions(); track att.id) {
              <app-attraction-card
                [attraction]="att"
                [cityName]="city()!.name"
                [cityId]="city()!.id"
                [stopId]="activeStop()!.stopId"
                [comments]="commentsFor(att.id)"
                (commentAdded)="onCommentAdded($event.attractionId, $event.comment)" />
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DestinationComponent implements OnInit {
  private readonly trip = inject(TripService);
  private readonly api = inject(ApiService);

  private allComments = signal<Record<string, Comment[]>>({});

  readonly city = computed(() => {
    const stop = this.trip.activeStop();
    return stop ? WORLD_CITIES.find(c => c.id === stop.cityId) ?? null : null;
  });

  readonly activeStop = computed(() => this.trip.activeStop());
  readonly attractions = computed(() => this.city() ? getAttractions(this.city()!) : []);

  readonly filterCategory = signal<AttractionCategory | null>(null);

  readonly availableCategories = computed(() =>
    ALL_CATEGORIES.filter(m => this.attractions().some(a => a.category === m.code))
  );

  readonly filteredAttractions = computed(() => {
    const filter = this.filterCategory();
    return filter ? this.attractions().filter(a => a.category === filter) : this.attractions();
  });

  constructor() {
    effect(() => {
      this.city();
      this.filterCategory.set(null);
    });
  }

  commentsFor(attractionId: string): Comment[] {
    return this.allComments()[attractionId] ?? [];
  }

  ngOnInit(): void {
    const ids = this.attractions().map(a => a.id);
    if (ids.length === 0) return;
    this.api.getCommentsBatch(ids).subscribe(map => {
      this.allComments.set(map);
    });
  }

  onCommentAdded(attractionId: string, comment: Omit<Comment, 'id'>): void {
    this.allComments.update(prev => ({
      ...prev,
      [attractionId]: [...(prev[attractionId] ?? []), comment as Comment],
    }));
  }

  regionLabel() {
    const c = this.city();
    return c ? REGION_LABELS[c.region] : '';
  }

  regionBg() {
    const map: Record<string, string> = {
      europe: 'var(--lav)', asia: 'var(--peach)', americas: 'var(--mint)',
      africa: 'var(--butter)', oceania: 'var(--sky)',
    };
    return map[this.city()?.region ?? ''] ?? 'var(--lav)';
  }

  regionColor() {
    const map: Record<string, string> = {
      europe: 'var(--lav-d)', asia: 'var(--peach-d)', americas: 'var(--mint-d)',
      africa: 'oklch(55% .12 95)', oceania: 'oklch(45% .12 220)',
    };
    return map[this.city()?.region ?? ''] ?? 'var(--lav-d)';
  }
}
