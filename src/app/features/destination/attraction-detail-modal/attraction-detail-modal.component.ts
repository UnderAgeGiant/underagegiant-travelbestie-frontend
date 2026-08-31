import { Component, computed, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Attraction, Comment } from '../../../core/models/comment.model';
import { TripService } from '../../trip/trip.service';
import { ApiService } from '../../../core/api/api.service';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions } from '../../../data/attractions.data';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { PlanTimeModalComponent, PlanEntry, ScheduleEntry } from '../plan-time-modal/plan-time-modal.component';
import { formatTodayHours } from '../../../core/utils/attraction-hours.util';
import { formatEventLong } from '../../../core/utils/event-datetime.util';
import { CommentModalComponent } from '../comment-modal/comment-modal.component';
import { CommentCooldownService } from '../../../core/comments/comment-cooldown.service';
import { CommentSimilarModalComponent } from '../../comments/comment-similar-modal.component';
import { KarmaModalService } from '../../../core/karma/karma-modal.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthModalService } from '../../../core/auth/auth-modal.service';
import { attractionMapsUrl } from '../../../core/maps/google-maps-url.util';
import { CompanionSuggestionService } from '../../../core/ai/companion-suggestion.service';
import { attractionImages } from '../../../core/utils/attraction-images.util';
import { localizedDescription } from '../../../core/utils/attraction-description.util';
import { LocaleService } from '../../../core/i18n/locale.service';
import { ToastService } from '../../../core/ui/toast.service';
import { AttractionImageLightboxComponent } from '../attraction-image-lightbox/attraction-image-lightbox.component';
import { MapsPinIconComponent } from '../../../shared/maps-pin-icon/maps-pin-icon.component';

@Component({
    selector: 'app-attraction-detail-modal',
    imports: [DurationPipe, PlanTimeModalComponent, CommentModalComponent, CommentSimilarModalComponent, AttractionImageLightboxComponent, MapsPinIconComponent],
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
    .hero-name-native {
      font-size: 12px; color: rgba(255,255,255,.7); margin-top: 2px; font-style: italic;
    }
    .hero-meta {
      display: flex; align-items: center; gap: 8px; margin-top: 4px;
    }
    .hero-type { font-size: 12px; color: rgba(255,255,255,.85); font-weight: 500; }
    .hero-stars { font-size: 12px; color: #FFD700; letter-spacing: 1px; }
    .hero-rating { font-size: 12px; color: rgba(255,255,255,.9); font-weight: 700; }
    .hero-img { cursor: zoom-in; }
    .hero-nav {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(255,255,255,.55); color: var(--t1);
      font-size: 15px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; border: none; backdrop-filter: blur(6px);
      transition: background .15s, transform .15s;
      z-index: 2;
    }
    .hero-nav:hover { background: rgba(255,255,255,.85); transform: translateY(-50%) scale(1.08); }
    .hero-nav-prev { left: 10px; }
    .hero-nav-next { right: 10px; }
    .hero-dots {
      position: absolute; top: 16px; left: 12px; z-index: 2;
      display: flex; gap: 6px;
    }
    .hero-dot {
      width: 6px; height: 6px; border-radius: 50%; border: none; padding: 0;
      background: rgba(255,255,255,.5); cursor: pointer; transition: all .2s;
    }
    .hero-dot.active { background: #fff; width: 16px; border-radius: 3px; }
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
    .detail-description {
      font-size: 13.5px; line-height: 1.5; color: var(--t2);
      margin: 0 0 16px;
    }
    .divider { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
    .comments-head {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
    }
    .comments-head-label { font-size: 13px; font-weight: 700; color: var(--t1); }
    .cmnt-count {
      font-size: 11px; color: var(--t3);
      background: oklch(97% 0 0); padding: 2px 8px; border-radius: 99px;
    }
    .detail-enrich {
      display: flex; flex-wrap: wrap; gap: 4px 24px;
    }
    .detail-enrich .att-preview-enrich {
      margin-top: 0; font-size: 12.5px;
    }
    .detail-event-dt {
      display: inline-flex; align-items: center; gap: 6px;
      margin-bottom: 14px;
      padding: 6px 12px; border-radius: 12px;
      font-size: 14px; font-weight: 800;
      color: var(--peach-d);
      background: var(--butter);
      border: 1px solid var(--peach);
      font-variant-numeric: tabular-nums;
    }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <div class="modal-backdrop" (click)="$event.target === $event.currentTarget && close.emit()">
      <div class="detail-modal">

        <!-- Hero image carousel -->
        <div class="detail-hero" [style.background-color]="attraction().bg">
          @if (images()[heroIdx()] && !imgError()) {
            <img class="hero-img" [src]="images()[heroIdx()]" [alt]="attraction().name"
                 loading="lazy" (error)="imgError.set(true)" (click)="openLightbox()">
          } @else {
            <div class="hero-fallback-icon">{{ attraction().icon }}</div>
          }
          <div class="hero-gradient"></div>
          <button class="hero-close" (click)="close.emit()" type="button" aria-label="Cerrar">✕</button>

          @if (images().length > 1) {
            <button class="hero-nav hero-nav-prev" (click)="$event.stopPropagation(); prevHeroImage()"
                    type="button" i18n-aria-label="@@detailModal.prevImage" aria-label="Imagen anterior">‹</button>
            <button class="hero-nav hero-nav-next" (click)="$event.stopPropagation(); nextHeroImage()"
                    type="button" i18n-aria-label="@@detailModal.nextImage" aria-label="Siguiente imagen">›</button>
            <div class="hero-dots">
              @for (img of images(); track $index) {
                <button [class]="'hero-dot' + (heroIdx() === $index ? ' active' : '')"
                        (click)="$event.stopPropagation(); selectHeroImage($index)"
                        type="button" [attr.aria-label]="'Imagen ' + ($index + 1)"></button>
              }
            </div>
          }

          <div class="hero-caption">
            <div class="hero-name">{{ attraction().icon }} {{ attraction().name }}</div>
            @if (attraction().nativeName && attraction().nativeName !== attraction().name) {
              <div class="hero-name-native">({{ attraction().nativeName }})</div>
            }
            <div class="hero-meta">
              <span class="hero-type">{{ attraction().type }}</span>
              <span class="hero-stars">{{ starStr() }}</span>
              <span class="hero-rating">{{ attraction().rating }}</span>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="detail-body">

          @if (eventDateTime()) {
            <div class="detail-event-dt">{{ eventDateTime() }}</div>
          }

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

          @if (description()) {
            <p class="detail-description">{{ description() }}</p>
          }

          <!-- Enrichment: hours / ticket / website / maps -->
          <div class="detail-enrich">
              @if (todayHours()) {
                <div class="att-preview-enrich">
                  <span class="att-enrich-icon">🕐</span>
                  <span class="att-enrich-value">{{ todayHours() }}</span>
                </div>
              }
              @if (ticketSummary()) {
                <div class="att-preview-enrich">
                  <span class="att-enrich-icon">🎟️</span>
                  <span class="att-enrich-value">{{ ticketSummary() }}</span>
                </div>
              }
              @if (websiteDomain()) {
                <div class="att-preview-enrich">
                  <span class="att-enrich-icon">🌐</span>
                  <a class="att-enrich-value att-enrich-link"
                     [attr.href]="attraction().website"
                     target="_blank"
                     rel="noopener noreferrer"
                     (click)="openWebsite($event)">{{ websiteDomain() }}</a>
                </div>
              }
              <div class="att-preview-enrich">
                <span class="att-enrich-icon"><app-maps-pin-icon /></span>
                <a class="att-enrich-value att-enrich-link"
                   [attr.href]="mapsUrl()"
                   target="_blank" rel="noopener noreferrer"
                   (click)="$event.stopPropagation()"
                   i18n="@@maps.viewOnMaps">Ver en Google Maps</a>
              </div>
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
                    <div class="c-text">{{ c.text }}</div>
                  </div>
                </div>
              }
            </div>
          }

          <button class="add-c-btn" style="margin-top:12px"
                  (click)="openCommentModal()"
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
          [cityName]="cityName()"
          (cancel)="showPlanModal.set(false)"
          (confirmed)="onPlanConfirmed($event)"
          (remove)="onPlanRemoved()" />
      }
      @if (showCommentModal()) {
        <app-comment-modal
          [attraction]="attraction()"
          [cityName]="cityName()"
          [userName]="auth.currentUser()!.name"
          [errorMessage]="commentError()"
          (close)="showCommentModal.set(false); commentError.set(null)"
          (submitted)="onCommentSubmitted($event)" />
      }
      @if (showSimilarModal()) {
        <app-comment-similar-modal (dismiss)="showSimilarModal.set(false)" />
      }
    </div>

    <!-- Rendered outside .modal-backdrop: that ancestor's backdrop-filter makes it a containing
         block for fixed-position descendants, which traps the lightbox's z-index under the nav bar. -->
    @if (showLightbox()) {
      <app-attraction-image-lightbox
        [images]="images()"
        [startIndex]="heroIdx()"
        [altText]="attraction().name"
        (closed)="showLightbox.set(false)" />
    }
  `
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
  commentError     = signal<string | null>(null);
  showLightbox     = signal(false);
  heroIdx          = signal(0);

  private readonly trip       = inject(TripService);
  private readonly companionSuggest = inject(CompanionSuggestionService);
  private readonly toast      = inject(ToastService);
  private readonly locale     = inject(LocaleService);
  private readonly api        = inject(ApiService);
  private readonly cooldown   = inject(CommentCooldownService);
  private readonly karmaModal = inject(KarmaModalService);
  readonly auth              = inject(AuthService);
  private readonly authModal = inject(AuthModalService);

  readonly inPlan = computed(() =>
    this.trip.isAttractionSelected(this.stopId(), this.attraction().id)
  );

  readonly plannedEntry = computed(() =>
    this.trip.getPlannedAttraction(this.stopId(), this.attraction().id)
  );

  readonly activeStop = computed(() => this.trip.activeStop());

  readonly images = computed(() => attractionImages(this.attraction()));

  readonly description = computed(() => localizedDescription(this.attraction(), this.locale.current()));

  readonly todayHours = computed(() => formatTodayHours(this.attraction().schedule));

  readonly mapsUrl = computed(() => attractionMapsUrl(this.attraction().name, this.cityId()));

  readonly eventDateTime = computed(() =>
    formatEventLong(this.attraction().date, this.attraction().time)
  );

  readonly websiteDomain = computed(() => {
    const url = this.attraction().website;
    if (!url) return null;
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
  });

  readonly ticketSummary = computed((): string | null => {
    const p = this.attraction().ticketPrices;
    if (!p) return null;
    if (p.free) return 'Entrada gratuita';
    const parts: string[] = [];
    if (p.adult)  parts.push(`Adulto ${p.adult}`);
    if (p.child)  parts.push(`Niño ${p.child}`);
    if (p.senior) parts.push(`Adulto mayor ${p.senior}`);
    if (p.notes && !parts.length) return p.notes;
    return parts.join(' · ') || null;
  });

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

  selectHeroImage(i: number): void {
    this.heroIdx.set(i);
    this.imgError.set(false);
  }

  nextHeroImage(): void {
    const n = this.images().length;
    if (n) this.selectHeroImage((this.heroIdx() + 1) % n);
  }

  prevHeroImage(): void {
    const n = this.images().length;
    if (n) this.selectHeroImage((this.heroIdx() - 1 + n) % n);
  }

  openLightbox(): void {
    if (this.images().length > 0) this.showLightbox.set(true);
  }

  openWebsite(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const url = this.attraction().website;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  openPlanModal(): void { this.showPlanModal.set(true); }

  onPlanConfirmed(entry: PlanEntry): void {
    const date = entry.date || undefined;
    const wasAlreadyPlanned = this.inPlan();
    if (wasAlreadyPlanned) {
      this.trip.updateStartTime(this.stopId(), this.plannedEntry()!.entryId, entry.startTime, date, this.attraction().estimatedMinutes);
    } else {
      this.trip.addAttraction(this.stopId(), this.attraction().id, entry.startTime, date, undefined, this.attraction().estimatedMinutes);
    }
    this.showPlanModal.set(false);
    if (!wasAlreadyPlanned) {
      this.toast.show($localize`:@@attCard.addedToast:¡Ya se agregó a tu itinerario esta atracción!`);
      void this.companionSuggest.trigger(this.stopId(), this.attraction().id);
      // The user came here to add this attraction — close the detail view so the
      // added-to-itinerary toast/mascot nudge isn't hidden behind it.
      this.close.emit();
    }
  }

  onPlanRemoved(): void {
    const entryId = this.plannedEntry()?.entryId;
    if (!entryId) return;
    this.trip.removeAttraction(this.stopId(), entryId);
    this.showPlanModal.set(false);
  }

  openCommentModal(): void {
    if (this.auth.isLoggedIn()) {
      this.showCommentModal.set(true);
    } else {
      this.authModal.openLogin(() => this.showCommentModal.set(true));
    }
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
        } else if (this.karmaModal.handleKarmaError(err)) {
          this.showCommentModal.set(false);
        } else {
          this.commentError.set('No se pudo enviar el comentario. Inténtalo de nuevo.');
          setTimeout(() => this.commentError.set(null), 4000);
        }
      },
    });
  }
}
