import { Component, input, output, signal, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { Attraction, Comment } from '../../../core/models/comment.model';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { TripService } from '../../trip/trip.service';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions } from '../../../data/attractions.data';
import { AttractionDetailModalComponent } from '../attraction-detail-modal/attraction-detail-modal.component';
import { PlanTimeModalComponent, PlanEntry, ScheduleEntry } from '../plan-time-modal/plan-time-modal.component';
import { formatTodayHours } from '../../../core/utils/attraction-hours.util';
import { getCategoryMeta } from '../../../core/models/attraction-category';
import { formatEventChip } from '../../../core/utils/event-datetime.util';
import { attractionMapsUrl } from '../../../core/maps/google-maps-url.util';
import { CompanionSuggestionService } from '../../../core/ai/companion-suggestion.service';
import { ToastService } from '../../../core/ui/toast.service';

@Component({
    selector: 'app-attraction-card',
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
    .card-caption-native {
      font-size: 9px; color: rgba(255,255,255,.65); margin-top: 1px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-style: italic;
    }
    /* ── Footer ── */
    .card-footer {
      display: flex; align-items: center; gap: 2px;
      padding: 7px 12px;
      background: transparent;
    }
    .card-footer .stars { font-size: 11px; }
    .card-footer .rating-val { font-size: 11px; font-weight: 700; color: var(--t2); }
    .card-cmnt-count { font-size: 11px; color: var(--t3); }
    /* ── Planned entry chips ── */
    .card-entries {
      display: flex; flex-wrap: wrap; gap: 4px;
      padding: 5px 12px 8px; background: transparent;
      border-top: 1px solid var(--border);
    }
    .entry-chip {
      display: inline-flex; align-items: center; gap: 3px;
      padding: 2px 9px; border-radius: 99px; font-size: 10px; font-weight: 700;
      background: var(--lav); color: var(--lav-d);
      border: none; cursor: pointer; transition: background .12s, color .12s;
      white-space: nowrap;
    }
    .entry-chip:hover { background: var(--lav-d); color: #fff; }
    .entry-chip-add {
      background: none; color: var(--lav-d);
      border: 1.5px dashed var(--lav-d);
    }
    .entry-chip-add:hover { background: var(--lav); }
    .entry-ticket-check {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: var(--t2);
      cursor: pointer;
      margin-left: 4px;
    }
    .entry-ticket-check input[type="checkbox"] {
      accent-color: var(--peach-d);
      cursor: pointer;
    }
    /* ── Enrichment strip ── */
    .card-enrich {
      padding: 4px 12px 8px;
      background: transparent;
      border-top: 1px solid var(--border);
    }
    /* ── Fixed-event date/time chip ── */
    .card-event-dt {
      display: inline-flex; align-items: center; gap: 4px;
      margin: 0 12px 8px;
      padding: 3px 10px; border-radius: 99px;
      font-size: 11px; font-weight: 800;
      color: var(--peach-d);
      background: var(--butter);
      border: 1px solid var(--peach);
      font-variant-numeric: tabular-nums;
    }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <div class="att-card" [style.background-color]="categoryBg()" (click)="showDetailModal.set(true)">
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

        <!-- Plan button — top-right; opens edit when single entry, add when none/multiple -->
        <button [class]="'card-plan-btn ' + (inPlan() ? 'planned' : 'idle')"
                (click)="$event.stopPropagation(); openPlanAction()"
                type="button">
          @if (inPlan()) {
            <span>📌</span>
            @if (plannedEntries().length === 1) {
              <span>{{ plannedEntries()[0].date ? shortDate(plannedEntries()[0].date!) + ' ' : '' }}{{ plannedEntries()[0].startTime }}</span>
            } @else {
              <span>×{{ plannedEntries().length }}</span>
            }
          } @else {
            <span>🔖</span><span i18n="@@attCard.addToPlan">Planificar</span>
          }
        </button>

        <div class="card-caption">
          <div class="card-caption-name">{{ attraction().icon }} {{ attraction().name }}</div>
          @if (attraction().nativeName && attraction().nativeName !== attraction().name) {
            <div class="card-caption-native">({{ attraction().nativeName }})</div>
          }
          <div class="card-caption-meta">{{ attraction().type }} · ⏱ {{ attraction().estimatedMinutes | duration }}</div>
        </div>
      </div>

      <!-- Footer row -->
      <div class="card-footer">
        <span class="stars">{{ starStr() }}</span>
        <span class="rating-val">{{ attraction().rating }}</span>
        @if (comments().length > 0) {
          <span class="card-cmnt-count" style="margin-left:4px">💬 {{ comments().length }}</span>
        }
      </div>

      <!-- Fixed event date/time (accent) -->
      @if (eventDateTime()) {
        <div class="card-event-dt" i18n-title="@@attCard.eventDateTime"
             title="Fecha y hora del evento">{{ eventDateTime() }}</div>
      }

      <!-- Enrichment strip: hours / ticket / website / maps -->
      <div class="card-enrich">
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
                 (click)="$event.stopPropagation()">{{ websiteDomain() }}</a>
            </div>
          }
          <div class="att-preview-enrich">
            <span class="att-enrich-icon">📍</span>
            <a class="att-enrich-value att-enrich-link"
               [attr.href]="mapsUrl()"
               target="_blank" rel="noopener noreferrer"
               (click)="$event.stopPropagation()"
               i18n="@@maps.viewOnMaps">Ver en Google Maps</a>
          </div>
        </div>

      <!-- Planned entry chips — one per scheduled visit -->
      @if (plannedEntries().length > 0) {
        <div class="card-entries">
          @for (entry of plannedEntries(); track entry.entryId) {
            <button class="entry-chip"
                    (click)="$event.stopPropagation(); editingEntry.set(entry)"
                    type="button">
              📌 {{ entry.date ? shortDate(entry.date) + ' ' : '' }}{{ entry.startTime }}
            </button>
            @if (attraction().ticketUrl) {
              <label class="entry-ticket-check" (click)="$event.stopPropagation()">
                <input type="checkbox"
                       [checked]="entry.ticketPurchased ?? false"
                       (change)="toggleTicketPurchased(entry.entryId, $any($event.target).checked)" />
                <span i18n="@@attCard.ticketPurchasedLabel">🎟 Entrada comprada</span>
              </label>
            }
          }
          <button class="entry-chip entry-chip-add"
                  (click)="$event.stopPropagation(); showPlanModal.set(true)"
                  type="button">
            + visita
          </button>
        </div>
      }
    </div>

    <!-- Add new visit modal -->
    @if (showPlanModal()) {
      <app-plan-time-modal
        [attraction]="attraction()"
        [initialTime]="''"
        [initialDate]="''"
        [stopCheckIn]="activeStop()?.checkIn ?? ''"
        [stopCheckOut]="activeStop()?.checkOut ?? ''"
        [existingPlanned]="scheduleEntries()"
        [cityName]="cityName()"
        (cancel)="showPlanModal.set(false)"
        (confirmed)="onPlanConfirmed($event)"
        (remove)="showPlanModal.set(false)" />
    }

    <!-- Edit existing visit modal -->
    @if (editingEntry()) {
      <app-plan-time-modal
        [attraction]="attraction()"
        [initialTime]="editingEntry()!.startTime ?? ''"
        [initialDate]="editingEntry()!.date ?? ''"
        [stopCheckIn]="activeStop()?.checkIn ?? ''"
        [stopCheckOut]="activeStop()?.checkOut ?? ''"
        [existingPlanned]="editScheduleEntries()"
        [cityName]="cityName()"
        (cancel)="editingEntry.set(null)"
        (confirmed)="onEditConfirmed($event)"
        (remove)="onRemoveEntry()" />
    }

    <!-- Detail modal (full info) -->
    @if (showDetailModal()) {
      <app-attraction-detail-modal
        [attraction]="attraction()"
        [cityId]="cityId()"
        [stopId]="stopId()"
        [cityName]="cityName()"
        [comments]="comments()"
        (close)="showDetailModal.set(false)"
        (commentAdded)="commentAdded.emit($event)" />
    }
  `
})
export class AttractionCardComponent {
  attraction   = input.required<Attraction>();
  cityName     = input.required<string>();
  cityId       = input.required<string>();
  stopId       = input.required<string>();
  comments     = input<Comment[]>([]);
  commentAdded = output<{ attractionId: string; comment: Omit<Comment, 'id'> }>();

  showDetailModal = signal(false);
  showPlanModal   = signal(false);
  editingEntry    = signal<import('../../../core/models/trip.model').PlannedAttraction | null>(null);
  imgError        = signal(false);

  private readonly trip = inject(TripService);
  private readonly companionSuggest = inject(CompanionSuggestionService);
  private readonly toast = inject(ToastService);

  readonly plannedEntries = computed(() =>
    this.trip.getAllPlannedEntries(this.stopId(), this.attraction().id)
  );

  readonly inPlan = computed(() => this.plannedEntries().length > 0);

  readonly activeStop   = computed(() => this.trip.activeStop());
  readonly categoryBg   = computed(() => getCategoryMeta()[this.attraction().category]?.bg ?? '#E8F0FD');

  readonly todayHours = computed(() => formatTodayHours(this.attraction().schedule));

  readonly mapsUrl = computed(() => attractionMapsUrl(this.attraction().name, this.cityId()));

  readonly eventDateTime = computed(() =>
    formatEventChip(this.attraction().date, this.attraction().time)
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

  // For the ADD modal: show all existing entries including sibling visits of this attraction
  readonly scheduleEntries = computed((): ScheduleEntry[] => {
    const city = WORLD_CITIES.find(c => c.id === this.cityId());
    if (!city) return [];
    const allAttractions = getAttractions(city);
    return this.trip.selectedAttractionsFor(this.stopId())
      .map(p => ({
        entryId:    p.entryId,
        startTime:  p.startTime,
        date:       p.date,
        attraction: allAttractions.find(a => a.id === p.attractionId)!,
      }))
      .filter(e => e.attraction != null);
  });

  // For the EDIT modal: exclude only the entry being edited (shows sibling visits as potential conflicts)
  readonly editScheduleEntries = computed((): ScheduleEntry[] => {
    const city = WORLD_CITIES.find(c => c.id === this.cityId());
    if (!city) return [];
    const allAttractions = getAttractions(city);
    const editId = this.editingEntry()?.entryId;
    return this.trip.selectedAttractionsFor(this.stopId())
      .filter(p => p.entryId !== editId)
      .map(p => ({
        entryId:    p.entryId,
        startTime:  p.startTime,
        date:       p.date,
        attraction: allAttractions.find(a => a.id === p.attractionId)!,
      }))
      .filter(e => e.attraction != null);
  });

  starStr(): string {
    const r = Math.min(5, Math.max(0, Math.round(this.attraction().rating)));
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  shortDate(s: string): string {
    const p = s.split('/');
    return p.length >= 2 ? `${p[0]}/${p[1]}` : s;
  }

  // Single entry → edit it; none or multiple → add new
  openPlanAction(): void {
    if (this.plannedEntries().length === 1) {
      this.editingEntry.set(this.plannedEntries()[0]);
    } else {
      this.showPlanModal.set(true);
    }
  }

  onPlanConfirmed(entry: PlanEntry): void {
    this.trip.addAttraction(this.stopId(), this.attraction().id, entry.startTime, entry.date || undefined, this.attraction().category);
    this.showPlanModal.set(false);
    this.toast.show($localize`:@@attCard.addedToast:¡Ya se agregó a tu itinerario esta atracción!`);
    void this.companionSuggest.trigger(this.stopId(), this.attraction().id);
  }

  onEditConfirmed(entry: PlanEntry): void {
    const editId = this.editingEntry()!.entryId;
    this.trip.updateStartTime(this.stopId(), editId, entry.startTime, entry.date || undefined);
    this.editingEntry.set(null);
  }

  onRemoveEntry(): void {
    const editId = this.editingEntry()?.entryId;
    if (!editId) return;
    this.trip.removeAttraction(this.stopId(), editId);
    this.editingEntry.set(null);
  }

  toggleTicketPurchased(entryId: string, purchased: boolean): void {
    this.trip.setTicketPurchased(this.stopId(), entryId, purchased);
  }
}
