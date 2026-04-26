import { Component, input, output, signal, inject, computed } from '@angular/core';
import { Attraction, Comment } from '../../../core/models/comment.model';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { TripService } from '../../trip/trip.service';
import { AttractionDetailModalComponent } from '../attraction-detail-modal/attraction-detail-modal.component';

@Component({
  selector: 'app-attraction-card',
  standalone: true,
  imports: [DurationPipe, AttractionDetailModalComponent],
  styles: [`
    .att-card {
      padding: 0 !important;
      overflow: hidden;
      cursor: pointer;
      transition: transform .22s ease, box-shadow .22s ease;
    }
    .att-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 32px rgba(0,0,0,.15);
    }
    /* ── Image area ── */
    .card-visual {
      position: relative;
      height: 160px;
      overflow: hidden;
      box-shadow: inset 0 0 0 2px rgba(255,255,255,0.5);
    }
    .card-img {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform .38s ease;
    }
    .att-card:hover .card-img { transform: scale(1.06); }
    .card-fallback-icon {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-size: 38px; opacity: .5; pointer-events: none;
    }
    .card-gradient {
      position: absolute; inset: 0;
      background: linear-gradient(to bottom, transparent 28%, rgba(0,0,0,0.66) 100%);
      pointer-events: none;
    }
    /* White inset border frame (the subtle white border) */
    .card-frame {
      position: absolute; inset: 0;
      box-shadow: inset 0 0 0 2px rgba(255,255,255,.55);
      border-radius: inherit;
      pointer-events: none;
    }
    .card-plan-badge {
      position: absolute; top: 8px; right: 8px;
      background: rgba(255,255,255,.92);
      font-size: 10px; font-weight: 700;
      padding: 3px 8px; border-radius: 99px;
      color: var(--lav-d);
      backdrop-filter: blur(4px);
    }
    .card-caption {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 10px 12px; pointer-events: none;
    }
    .card-caption-name {
      font-size: 13px; font-weight: 700; color: #fff;
      text-shadow: 0 1px 4px rgba(0,0,0,.5);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .card-caption-meta {
      font-size: 10px; color: rgba(255,255,255,.82); margin-top: 2px;
    }
    /* ── Footer ── */
    .card-footer {
      display: flex; align-items: center; gap: 2px;
      padding: 7px 12px;
      background: #fff;
    }
    .card-footer .stars { font-size: 11px; }
    .card-footer .rating-val { font-size: 11px; font-weight: 700; color: var(--t2); }
    .card-cmnt-count {
      margin-left: auto; font-size: 11px; color: var(--t3);
    }
  `],
  template: `
    <div class="att-card" (click)="showDetailModal.set(true)">
      <!-- Image / visual area -->
      <div class="card-visual" [style.background-color]="attraction().bg">
        @if (attraction().imageUrl && !imgError()) {
          <img class="card-img"
               [src]="attraction().imageUrl"
               [alt]="attraction().name"
               loading="lazy"
               (error)="imgError.set(true)">
        } @else {
          <div class="card-fallback-icon">{{ attraction().icon }}</div>
        }
        <div class="card-gradient"></div>
        <div class="card-frame"></div>
        @if (inPlan()) {
          <div class="card-plan-badge">📌 {{ plannedEntry()?.startTime }}</div>
        }
        <div class="card-caption">
          <div class="card-caption-name">{{ attraction().icon }} {{ attraction().name }}</div>
          <div class="card-caption-meta">{{ attraction().type }} · ⏱ {{ attraction().estimatedMinutes | duration }}</div>
        </div>
      </div>

      <!-- Footer row -->
      <div class="card-footer">
        <span class="stars">{{ starStr() }}</span>
        <span class="rating-val">{{ attraction().rating }}</span>
        @if (comments().length > 0) {
          <span class="card-cmnt-count">💬 {{ comments().length }}</span>
        }
      </div>
    </div>

    @if (showDetailModal()) {
      <app-attraction-detail-modal
        [attraction]="attraction()"
        [cityId]="cityId()"
        [cityName]="cityName()"
        [comments]="comments()"
        (close)="showDetailModal.set(false)"
        (commentAdded)="commentAdded.emit($event)" />
    }
  `,
})
export class AttractionCardComponent {
  attraction   = input.required<Attraction>();
  cityName     = input.required<string>();
  cityId       = input.required<string>();
  comments     = input<Comment[]>([]);
  commentAdded = output<{ attractionId: string; comment: Omit<Comment, 'id'> }>();

  showDetailModal = signal(false);
  imgError        = signal(false);

  private readonly trip = inject(TripService);

  readonly inPlan = computed(() =>
    this.trip.isAttractionSelected(this.cityId(), this.attraction().id)
  );

  readonly plannedEntry = computed(() =>
    this.trip.getPlannedAttraction(this.cityId(), this.attraction().id)
  );

  starStr(): string {
    const r = Math.round(this.attraction().rating);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }
}
