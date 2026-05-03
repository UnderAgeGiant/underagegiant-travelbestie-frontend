import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { TripService } from '../trip/trip.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { REGION_LABELS } from '../../core/models/city.model';
import { getAttractions } from '../../data/attractions.data';
import { AttractionCardComponent } from './attraction-card/attraction-card.component';
import { Comment } from '../../core/models/comment.model';
import { ApiService } from '../../core/api/api.service';

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
              @if (totalComments() > 0) {
                <span class="badge" style="background:var(--blush);color:var(--peach-d)">
                  💬 {{ totalComments() }}
                  @if (totalComments() === 1) {
                    <ng-container i18n="@@dest.oneComment">comentario</ng-container>
                  } @else {
                    <ng-container i18n="@@dest.manyComments">comentarios</ng-container>
                  }
                </span>
              }
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
              {{ attractions().length }}
              @if (attractions().length === 1) {
                <ng-container i18n="@@dest.onePlace">lugar</ng-container>
              } @else {
                <ng-container i18n="@@dest.manyPlaces">lugares</ng-container>
              }
            </span>
          </div>
          <div class="att-grid">
            @for (att of attractions(); track att.id) {
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
  readonly totalComments = computed(() =>
    this.attractions().reduce((sum, a) => sum + (this.allComments()[a.id]?.length ?? 0), 0)
  );

  commentsFor(attractionId: string): Comment[] {
    return this.allComments()[attractionId] ?? [];
  }

  ngOnInit(): void {
    for (const att of this.attractions()) {
      this.api.getComments(att.id).subscribe(comments => {
        this.allComments.update(prev => ({ ...prev, [att.id]: comments }));
      });
    }
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
