import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { TripService } from '../trip/trip.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { REGION_LABELS } from '../../core/models/city.model';
import { getAttractions } from '../../data/attractions.data';
import { Comment } from '../../core/models/comment.model';
import { ApiService } from '../../core/api/api.service';
import { DeviceService } from '../../core/device/device.service';
import { AttractionsListComponent } from './attractions-list/attractions-list.component';
import { FlagIconComponent } from '../../shared/flag-icon/flag-icon.component';

@Component({
    selector: 'app-destination',
    imports: [AttractionsListComponent, FlagIconComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <div class="dest-view">
      @if (city() && !device.isMobile()) {
        <div class="dest-banner">
          <div class="dest-banner-flag"><app-flag-icon [flag]="city()!.flag" [alt]="city()!.name" [size]="42" /></div>
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

        <app-attractions-list
          [city]="city()!"
          [attractions]="attractions()"
          [stopId]="activeStop()!.stopId"
          [comments]="allComments()"
          (commentAdded)="onCommentAdded($event.attractionId, $event.comment)" />
      }
    </div>
  `
})
export class DestinationComponent implements OnInit {
  private readonly trip = inject(TripService);
  private readonly api = inject(ApiService);
  protected readonly device = inject(DeviceService);

  protected allComments = signal<Record<string, Comment[]>>({});

  readonly city = computed(() => {
    const stop = this.trip.activeStop();
    return stop ? WORLD_CITIES.find(c => c.id === stop.cityId) ?? null : null;
  });

  readonly activeStop = computed(() => this.trip.activeStop());
  readonly attractions = computed(() => this.city() ? getAttractions(this.city()!) : []);

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
