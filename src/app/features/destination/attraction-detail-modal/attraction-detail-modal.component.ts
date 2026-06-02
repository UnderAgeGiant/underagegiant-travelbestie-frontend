import { Component, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Attraction, Comment } from '../../../core/models/comment.model';
import { TripService } from '../../trip/trip.service';
import { ApiService } from '../../../core/api/api.service';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions } from '../../../data/attractions.data';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { PlanTimeModalComponent, PlanEntry, ScheduleEntry } from '../plan-time-modal/plan-time-modal.component';
import { CommentModalComponent } from '../comment-modal/comment-modal.component';
import { CommentCooldownService } from '../../../core/comments/comment-cooldown.service';
import { CommentSimilarModalComponent } from '../../comments/comment-similar-modal.component';

@Component({
  selector: 'app-attraction-detail-modal',
  standalone: true,
  imports: [DurationPipe, PlanTimeModalComponent, CommentModalComponent, CommentSimilarModalComponent],
  styles: [`
    .detail-modal {
      background: #fff;
      border-radius: 24px;
      max-width: 500px;
      width: calc(100% - 32px);
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,.22);
    }
    .detail-hero {
      position: relative;
      height: 230px;
      flex-shrink: 0;
      overflow: hidden;
    }
    .hero-img {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform .4s ease;
    }
    .hero-fallback-icon {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -55%);
      font-size: 56px; opacity: .55; pointer-events: none;
    }
    .hero-gradient {
      position: absolute; inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,.05) 35%, rgba(0,0,0,.75) 100%);
      pointer-events: none;
    }
    .hero-close {
      position: absolute; top: 12px; right: 12px;
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(255,255,255,.88); color: var(--t1);
      font-size: 16px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; border: none; backdrop-filter: blur(6px);
      transition: background .15s, transform .15s;
      z-index: 2;
    }
    .hero-close:hover { background: #fff; transform: scale(1.08); }
    .hero-caption {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 16px 20px; pointer-events: none;
    }
    .hero-name {
      font-size: 21px; font-weight: 800; color: #fff;
      text-shadow: 0 1px 6px rgba(0,0,0,.45);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .hero-meta {
      display: flex; align-items: center; gap: 8px; margin-top: 4px;
    }
    .hero-type { font-size: 12px; color: rgba(255,255,255,.85); font-weight: 500; }
    .hero-stars { font-size: 12px; color: #FFD700; letter-spacing: 1px; }
    .hero-rating { font-size: 12px; color: rgba(255,255,255,.9); font-weight: 700; }
    .detail-body { overflow-y: auto; flex: 1; padding: 20px; }
    .action-row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      margin-bottom: 16px;
    }
    .dur-label {
      font-size: 10px; color: var(--t3); text-transform: uppercase;
      letter-spacing: .6px; font-weight: 600;
    }
    .dur-value { font-size: 22px; font-weight: 800; color: var(--t1); margin-top: 2px; }
    .divider { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
    .comments-head {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
    }
    .comments-head-label { font-size: 13px; font-weight: 700; color: var(--t1); }
    .cmnt-count {
      font-size: 11px; color: var(--t3);
      background: oklch(97% 0 0); padding: 2px 8px; border-radius: 99px;
    }
  `],
  template: `
    <div class="modal-backdrop" (click)="$event.target === $event.currentTarget && close.emit()">
      <div class="detail-modal">

        <!-- Hero image -->
        <div class="detail-hero" [style.background-color]="attraction().bg">
          @if (attraction().imageUrl && !imgError()) {
            <img class="hero-img" [src]="attraction().imageUrl" [alt]="attraction().name"
                 loading="lazy" (error)="imgError.set(true)">
          } @else {
            <div class="hero-fallback-icon">{{ attraction().icon }}</div>
          }
          <div class="hero-gradient"></div>
          <button class="hero-close" (click)="close.emit()" type="button" aria-label="Cerrar">✕</button>
          <div class="hero-caption">
            <div class="hero-name">{{ attraction().icon }} {{ attraction().name }}</div>
            <div class="hero-meta">
              <span class="hero-type">{{ attraction().type }}</span>
              <span class="hero-stars">{{ starStr() }}</span>
              <span class="hero-rating">{{ attraction().rating }}</span>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="detail-body">

          <!-- Duration + plan button -->
          <div class="action-row">
            <div>
              <div class="dur-label" i18n="@@detailModal.durationLabel">⏱ Duración estimada</div>
              <div class="dur-value">{{ attraction().estimatedMinutes | duration }}</div>
            </div>
            <button [class]="'btn-pill ' + (inPlan() ? 'btn-primary' : 'btn-outline')"
                    style="flex-shrink:0"
                    (click)="openPlanModal()">
              @if (inPlan()) {
                <span>📌</span><span>{{ plannedEntry()?.startTime }}</span>
              } @else {
                <span>🔖</span><span i18n="@@attCard.addToPlan">Planificar</span>
              }
            </button>
          </div>

          <hr class="divider">

          <!-- Comments -->
          <div class="comments-head">
            <span class="comments-head-label" i18n="@@detailModal.commentsTitle">💬 Comentarios</span>
            @if (comments().length > 0) {
              <span class="cmnt-count">{{ comments().length }}</span>
            }
          </div>

          @if (comments().length === 0) {
            <div class="no-comments" i18n="@@attCard.noComments">¡Sin comentarios aún — sé el primero! 💬</div>
          } @else {
            <div class="comments-list">
              @for (c of comments(); track $index) {
                <div class="comment-row">
                  <div class="c-avatar" [style.background]="c.color">{{ c.name[0].toUpperCase() }}</div>
                  <div class="c-bubble">
                    <strong>{{ c.name }} {{ '⭐'.repeat(c.rating) }} · {{ c.date }}</strong>
                    {{ c.text }}
                  </div>
                </div>
              }
            </div>
          }

          <button class="add-c-btn" style="margin-top:12px"
                  (click)="showCommentModal.set(true)"
                  i18n="@@attCard.addComment">💌 Agregar comentario</button>
        </div>
      </div>

      <!-- Sub-modals use position:fixed so they layer above the detail modal -->
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
      @if (showCommentModal()) {
        <app-comment-modal
          [attraction]="attraction()"
          [cityName]="cityName()"
          (close)="showCommentModal.set(false)"
          (submitted)="onCommentSubmitted($event)" />
      }
      @if (showSimilarModal()) {
        <app-comment-similar-modal (dismiss)="showSimilarModal.set(false)" />
      }
    </div>
  `,
})
export class AttractionDetailModalComponent {
  attraction = input.required<Attraction>();
  cityId     = input.required<string>();
  stopId     = input.required<string>();
  cityName   = input.required<string>();
  comments   = input<Comment[]>([]);

  close        = output<void>();
  commentAdded = output<{ attractionId: string; comment: Omit<Comment, 'id'> }>();

  imgError         = signal(false);
  showPlanModal    = signal(false);
  showCommentModal = signal(false);
  showSimilarModal = signal(false);

  private readonly trip     = inject(TripService);
  private readonly api      = inject(ApiService);
  private readonly cooldown = inject(CommentCooldownService);

  readonly inPlan = computed(() =>
    this.trip.isAttractionSelected(this.stopId(), this.attraction().id)
  );

  readonly plannedEntry = computed(() =>
    this.trip.getPlannedAttraction(this.stopId(), this.attraction().id)
  );

  readonly activeStop = computed(() => this.trip.activeStop());

  readonly scheduleEntries = computed((): ScheduleEntry[] => {
    const city = WORLD_CITIES.find(c => c.id === this.cityId());
    if (!city) return [];
    const allAttractions = getAttractions(city);
    return this.trip.selectedAttractionsFor(this.stopId())
      .filter(p => p.attractionId !== this.attraction().id)
      .map(p => ({
        entryId:    p.entryId,
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

  openPlanModal(): void { this.showPlanModal.set(true); }

  onPlanConfirmed(entry: PlanEntry): void {
    const date = entry.date || undefined;
    if (this.inPlan()) {
      this.trip.updateStartTime(this.stopId(), this.plannedEntry()!.entryId, entry.startTime, date);
    } else {
      this.trip.addAttraction(this.stopId(), this.attraction().id, entry.startTime, date);
    }
    this.showPlanModal.set(false);
  }

  onPlanRemoved(): void {
    const entryId = this.plannedEntry()?.entryId;
    if (!entryId) return;
    this.trip.removeAttraction(this.stopId(), entryId);
    this.showPlanModal.set(false);
  }

  onCommentSubmitted(comment: Omit<Comment, 'id'>): void {
    this.api.addComment(comment).subscribe({
      next: () => {
        this.commentAdded.emit({ attractionId: this.attraction().id, comment });
        this.showCommentModal.set(false);
        this.cooldown.startCooldown(60);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.showCommentModal.set(false);
          this.showSimilarModal.set(true);
        } else if (err.status === 429) {
          this.showCommentModal.set(false);
          this.cooldown.startCooldown(err.error?.retryAfterSeconds ?? 60);
          this.cooldown.triggerShake();
        }
      },
    });
  }
}
