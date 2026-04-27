import { Component, input, output, signal, inject, computed } from '@angular/core';
import { Attraction, Comment } from '../../../core/models/comment.model';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { TripService } from '../../trip/trip.service';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions } from '../../../data/attractions.data';
import { AttractionDetailModalComponent } from '../attraction-detail-modal/attraction-detail-modal.component';
import { PlanTimeModalComponent, PlanEntry, ScheduleEntry } from '../plan-time-modal/plan-time-modal.component';

@Component({
  selector: 'app-attraction-card',
  standalone: true,
  imports: [DurationPipe, AttractionDetailModalComponent, PlanTimeModalComponent],
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
    /* White inset border frame */
    .card-frame {
      position: absolute; inset: 0;
      box-shadow: inset 0 0 0 2px rgba(255,255,255,.55);
      border-radius: inherit;
      pointer-events: none;
    }
    /* ── Plan button ── */
    .card-plan-btn {
      position: absolute; top: 8px; right: 8px;
      display: flex; align-items: center; gap: 4px;
      padding: 4px 9px; border-radius: 99px;
      font-size: 10px; font-weight: 700;
      border: none; cursor: pointer;
      backdrop-filter: blur(6px);
      transition: background .15s, transform .15s;
      z-index: 1;
    }
    .card-plan-btn.idle {
      background: rgba(255,255,255,.72); color: var(--t2);
      opacity: 0;
      transition: opacity .15s, background .15s, transform .15s;
    }
    .att-card:hover .card-plan-btn.idle { opacity: 1; }
    .card-plan-btn.idle:hover { background: rgba(255,255,255,.95); transform: scale(1.05); }
    .card-plan-btn.planned {
      background: rgba(255,255,255,.92); color: var(--lav-d);
    }
    .card-plan-btn.planned:hover { background: #fff; transform: scale(1.05); }
    /* ── Caption ── */
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
    .card-cmnt-count { margin-left: auto; font-size: 11px; color: var(--t3); }
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

        <!-- Plan button — always in top-right, stops propagation to card click -->
        <button [class]="'card-plan-btn ' + (inPlan() ? 'planned' : 'idle')"
                (click)="$event.stopPropagation(); showPlanModal.set(true)"
                type="button">
          @if (inPlan()) {
            <span>📌</span>
            <span>{{ plannedEntry()?.date ? shortDate(plannedEntry()!.date!) + ' ' : '' }}{{ plannedEntry()?.startTime }}</span>
          } @else {
            <span>🔖</span><span i18n="@@attCard.addToPlan">Planificar</span>
          }
        </button>

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

    <!-- Plan-time modal (direct from card, no detail modal needed) -->
    @if (showPlanModal()) {
      <app-plan-time-modal
        [attraction]="attraction()"
        [initialTime]="plannedEntry()?.startTime ?? ''"
        [initialDate]="plannedEntry()?.date ?? ''"
        [stopCheckIn]="activeStop()?.checkIn ?? ''"
        [stopCheckOut]="activeStop()?.checkOut ?? ''"
        [existingPlanned]="scheduleEntries()"
        (cancel)="showPlanModal.set(false)"
        (confirmed)="onPlanConfirmed($event)"
        (remove)="onPlanRemoved()" />
    }

    <!-- Detail modal (full info) -->
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
  showPlanModal   = signal(false);
  imgError        = signal(false);

  private readonly trip = inject(TripService);

  readonly inPlan = computed(() =>
    this.trip.isAttractionSelected(this.cityId(), this.attraction().id)
  );

  readonly plannedEntry = computed(() =>
    this.trip.getPlannedAttraction(this.cityId(), this.attraction().id)
  );

  readonly activeStop = computed(() => this.trip.activeStop());

  readonly scheduleEntries = computed((): ScheduleEntry[] => {
    const city = WORLD_CITIES.find(c => c.id === this.cityId());
    if (!city) return [];
    const allAttractions = getAttractions(city);
    return this.trip.selectedAttractionsFor(this.cityId())
      .filter(p => p.attractionId !== this.attraction().id)
      .map(p => ({
        startTime:  p.startTime,
        date:       p.date,
        attraction: allAttractions.find(a => a.id === p.attractionId)!,
      }))
      .filter(e => e.attraction != null);
  });

  starStr(): string {
    const r = Math.round(this.attraction().rating);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  shortDate(s: string): string {
    const p = s.split('/');
    return p.length >= 2 ? `${p[0]}/${p[1]}` : s;
  }

  onPlanConfirmed(entry: PlanEntry): void {
    const date = entry.date || undefined;
    if (this.inPlan()) {
      this.trip.updateStartTime(this.cityId(), this.attraction().id, entry.startTime, date);
    } else {
      this.trip.addAttraction(this.cityId(), this.attraction().id, entry.startTime, date);
    }
    this.showPlanModal.set(false);
  }

  onPlanRemoved(): void {
    this.trip.removeAttraction(this.cityId(), this.attraction().id);
    this.showPlanModal.set(false);
  }
}
