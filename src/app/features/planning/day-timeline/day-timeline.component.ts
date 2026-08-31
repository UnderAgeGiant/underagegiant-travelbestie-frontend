import {
  ChangeDetectionStrategy, Component, computed, effect, ElementRef,
  HostListener, inject, input, signal, ViewChild,
} from '@angular/core';
import { DeviceService } from '../../../core/device/device.service';
import { TouchDragService } from '../../../core/utils/touch-drag.service';
import { findScrollableAncestor } from '../../../core/utils/scroll-passthrough.util';
import { NgClass, NgStyle } from '@angular/common';
import { TripService } from '../../trip/trip.service';
import { TripStop, PlannedAttraction, TransitLeg, TransitMode } from '../../../core/models/trip.model';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions, findCuratedAttraction } from '../../../data/attractions.data';
import { ApiService } from '../../../core/api/api.service';
import { KarmaModalService } from '../../../core/karma/karma-modal.service';
import { dayRouteUrl as buildDayRouteUrl, transitTerminalName } from '../../../core/maps/google-maps-url.util';
import { SlideshowItem } from '../../../core/models/plan-slideshow.model';
import { PlanSlideshowComponent } from '../../../shared/plan-slideshow/plan-slideshow.component';
import { buildPlanSlideshowItems } from '../../../shared/plan-slideshow/plan-slideshow.util';
import { FlagIconComponent } from '../../../shared/flag-icon/flag-icon.component';
import { buildItineraryExportMaps } from '../../../core/utils/itinerary-export.util';
import { LocaleService } from '../../../core/i18n/locale.service';
import { localizedDescription } from '../../../core/utils/attraction-description.util';
import { NEW_ATTRACTION_MIME, RESCHEDULE_MIME, NewAttractionDragPayload, RescheduleDragPayload, snapMinutesFromOffset, minutesToHm } from '../../../core/utils/day-timeline-drag.util';

// ── Grid constants (from landing-preview.html) ──────────────────────────────
const TL_H0 = 0;   // first hour rendered (00:00 — full day, user feedback 09-07-2026)
const TL_H1 = 23;  // last  hour rendered (23:00)
const TL_RH = 46;  // pixels per hour

interface DayTab {
  date: Date;
  dow:  string;
  num:  number;
  key:  string;
  hasEvents: boolean;
  cityId:    string;
  cityFlag:  string;
}

interface TimeBlock {
  top:    number;
  height: number;
  bg:     string;
  fg:     string;
  icon:   string;
  name:   string;
  time:   string;
  kind:   'attraction' | 'transit';
  entryId?: string;
  draggable?: boolean;
}

function hmToMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minToHm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/**
 * A planned attraction's real duration in minutes: the explicit endTime-startTime gap when
 * one was set, otherwise the curated catalog attraction's own suggested duration — NEVER a
 * flat fallback. This must be the single source of truth for both what the block's HEIGHT
 * shows (blocks()) and what a DRAG-TO-RESCHEDULE preserves (onGridDrop) — they used to
 * disagree (blocks() fell back to att?.estimatedMinutes, onGridDrop's reschedule fell back to
 * a flat 60), so dragging any attraction whose endTime was never explicitly set (the common
 * case — see TripService.addAttraction's own comment on this) silently shrank/grew a visibly
 * multi-hour block down to exactly 60 minutes on drop. Family feedback bugfix.
 */
function resolveDuration(a: PlannedAttraction, att: { estimatedMinutes?: number } | null): number {
  if (a.startTime && a.endTime) return hmToMin(a.endTime) - hmToMin(a.startTime);
  return att?.estimatedMinutes ?? 60;
}

function dateKey(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function typeColors(type: string): [string, string] {
  switch (type) {
    case 'Parque Natural': return ['var(--mint)',  'var(--mint-d)'];
    case 'Patrimonio':     return ['var(--peach)', 'var(--peach-d)'];
    default:               return ['var(--lav)',   'var(--lav-d)'];
  }
}

function typeIcon(type: string): string {
  switch (type) {
    case 'Parque Natural': return '🌿';
    case 'Patrimonio':     return '✨';
    default:               return '🏛️';
  }
}

function transitModeColors(mode: string): [string, string] {
  switch (mode) {
    case 'train': return ['oklch(92% .07 150)', 'oklch(38% .17 150)'];
    case 'boat':  return ['oklch(92% .07 200)', 'oklch(38% .17 200)'];
    case 'bus':   return ['oklch(93% .07 70)',  'oklch(38% .17 70)'];
    case 'car':   return ['oklch(93% .07 40)',  'oklch(38% .17 40)'];
    default:      return ['oklch(92% .07 230)', 'oklch(38% .17 230)'];  // flight / default: sky blue
  }
}

function transitIcon(mode: string): string {
  const icons: Record<string, string> = {
    flight: '✈️', train: '🚂', boat: '🚢', bus: '🚌', car: '🚗',
  };
  return icons[mode] ?? '🚀';
}

function transitLabel(mode: TransitMode): string {
  switch (mode) {
    case 'flight': return $localize`:@@timeline.modeFlight:Vuelo`;
    case 'train':  return $localize`:@@timeline.modeTrain:Tren`;
    case 'boat':   return $localize`:@@timeline.modeBoat:Barco`;
    case 'bus':    return $localize`:@@timeline.modeBus:Bus`;
    case 'car':    return $localize`:@@timeline.modeCar:Auto`;
  }
}

@Component({
    selector: 'tb-day-timeline',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass, NgStyle, PlanSlideshowComponent, FlagIconComponent],
    template: `
@if (visible()) {
  <div class="timeline-panel timeline-accent" [class.collapsed]="collapsed()" [class.timeline-inline]="inline()">

    <div class="tl-body">

      <!-- Header -->
      <div class="tl-head">
        <div class="tl-head-eyebrow">{{ eyebrow() }}</div>
        <div class="tl-head-title">
          @if (titleFlag()) { <app-flag-icon [flag]="titleFlag()!" [size]="16" /> }
          {{ title() }}
        </div>
        <div class="tl-head-sub">{{ subtitle() }}</div>
        @if (trip.loadedPlanId() || routeUrl() || blocks().length > 0 || (showPlanSlideshow() && planSlideItems().length > 0)) {
          <div class="tl-head-actions">
            <!-- Day-scoped actions first (this component's own subject), then plan-scoped —
                 grouped by what they act on, not the order they happened to be added in. -->
            @if (routeUrl()) {
              <a class="btn-pill btn-outline tl-head-action tl-route-btn"
                 [attr.href]="routeUrl()" target="_blank" rel="noopener noreferrer">
                <span i18n="@@timeline.dayRoute">🗺️ Ruta del día</span>
              </a>
            }
            @if (blocks().length > 0) {
              <button class="btn-pill btn-outline tl-head-action"
                      (click)="daySlideshowOpen.set(true)" type="button"
                      i18n="@@timeline.daySlideshow">🎬 Presentación del día</button>
            }
            @if (trip.loadedPlanId()) {
              <button class="btn-pill btn-outline tl-head-action"
                      [disabled]="exporting()" (click)="exportItinerary()" type="button"
                      i18n="@@plan.exportItinerary">{{ exporting() ? '⏳' : '📥' }} Exportar</button>
            }
            @if (showPlanSlideshow() && planSlideItems().length > 0) {
              <button class="btn-pill btn-outline tl-head-action"
                      (click)="planSlideshowOpen.set(true)" type="button"
                      i18n="@@timeline.planSlideshow">🎞️ Presentación del plan</button>
            }
          </div>
        }
      </div>

      <!-- Day tabs (hidden in transport mode) -->
      @if (!transportMode()) {
        <div class="tl-days-row">
          @if (days().length > 6) {
            <button type="button" class="tl-days-arrow tl-days-arrow-left"
                    (click)="scrollDays(-1)"
                    i18n-aria-label="@@timeline.scrollDaysLeft" aria-label="Ver días anteriores">‹</button>
          }
          <div class="tl-days" #tlDaysEl>
            @for (day of days(); track day.key) {
              <button [ngClass]="['tl-day', day.key === selectedDay() ? 'active' : '']"
                      (click)="selectDay(day.key)">
                <div class="tl-day-city"><app-flag-icon [flag]="day.cityFlag" [size]="12" /></div>
                <div class="tl-day-dow">{{ day.dow }}</div>
                <div class="tl-day-num">{{ day.num }}</div>
                <div [ngClass]="['tl-day-dot', day.hasEvents ? '' : 'empty']"></div>
              </button>
            }
          </div>
          @if (days().length > 6) {
            <button type="button" class="tl-days-arrow tl-days-arrow-right"
                    (click)="scrollDays(1)"
                    i18n-aria-label="@@timeline.scrollDaysRight" aria-label="Ver días siguientes">›</button>
          }
        </div>
      }

      <!-- Hour grid -->
      <div class="tl-grid-wrap" #tlGridWrap>
        <div class="tl-grid" #tlGridEl [ngStyle]="{ height: gridHeight() + 'px' }"
             (dragover)="onGridDragOver($event)" (drop)="onGridDrop($event)">

          <!-- Hour lines -->
          @for (h of hours; track h) {
            <div class="tl-hour-line major"
                 [ngStyle]="{ top: (h - TL_H0) * TL_RH + 'px' }">
              <span class="lbl">{{ pad(h) }}:00</span>
              <span class="ln"></span>
            </div>
          }

          <!-- All blocks (attractions + transits) -->
          @for (block of blocks(); track block.name + block.top) {
            <div class="tl-block"
                 [class.tl-block-draggable]="block.kind === 'attraction' && block.draggable"
                 [attr.draggable]="block.kind === 'attraction' && block.draggable && !device.isMobile() ? true : null"
                 (dragstart)="block.entryId && onBlockDragStart($event, block.entryId)"
                 (dragend)="onBlockDragEnd()"
                 (touchstart)="block.kind === 'attraction' && block.draggable && block.entryId && onBlockTouchStart($event, block.entryId)"
                 (touchmove)="onBlockTouchMove($event)"
                 (touchend)="onBlockTouchEnd($event)"
                 (touchcancel)="onBlockTouchCancel()"
                 [ngStyle]="{
                   top:         block.top    + 'px',
                   height:      block.height + 'px',
                   background:  block.bg,
                   borderColor: block.fg,
                   color:       block.fg
                 }">
              <div class="tl-block-top">
                <span class="tl-block-icon">{{ block.icon }}</span>
                <span class="tl-block-name">{{ block.name }}</span>
              </div>
              <div class="tl-block-time">{{ block.time }}</div>
            </div>
          }

          @if (dragPreview(); as dp) {
            <div class="tl-drag-bubble" [ngStyle]="{ top: dp.top + 'px' }">{{ dp.time }}</div>
          }

          <!-- Empty day state -->
          @if (!transportMode() && blocks().length === 0) {
            <div class="tl-free">
              <span class="tl-free-emoji">🌤️</span>
              <span class="tl-free-text" i18n="@@timeline.freeDay">Día libre — sin planes aún</span>
            </div>
          }

        </div>
      </div>

    </div><!-- /tl-body -->

    <!-- Collapse / expand flap -->
    <button class="tl-flap"
            (click)="toggleCollapse()"
            [attr.aria-label]="flapAriaLabel()">
      <span class="tl-flap-chevron">{{ collapsed() ? '›' : '‹' }}</span>
      <span class="tl-flap-label">{{ flapLabel() }}</span>
    </button>

  </div>

  @if (daySlideshowOpen()) {
    <app-plan-slideshow [items]="daySlideItems()" (closed)="daySlideshowOpen.set(false)" />
  }
  @if (planSlideshowOpen()) {
    <app-plan-slideshow [items]="planSlideItems()" (closed)="planSlideshowOpen.set(false)" />
  }
}
  `
})
export class DayTimelineComponent {
  protected readonly TL_H0 = TL_H0;
  protected readonly TL_RH = TL_RH;

  // Optional inputs for external data (used by share page)
  readonly stop     = input<TripStop | null>(null);
  readonly transits = input<TransitLeg[] | null>(null);
  // Rendered inline beneath a stop (single-city view); disables the column layout
  // and the mobile auto-collapse so it stays open where the user opened it.
  readonly inline   = input(false);
  // Whole-plan slideshow switch — only set true on the single trip-wide
  // instance rendered by ShellComponent (see Task 5).
  readonly showPlanSlideshow = input(false);
  // Disables all drag-to-schedule affordances (draggable blocks, drag-start,
  // drag-over preview, and drop handling) — set true on the read-only public
  // shared-trip view, where the viewer's own TripService has no matching
  // stopId so a drop would silently no-op. Left false (default) everywhere
  // else, including the editable per-stop inline timeline in StopListComponent.
  readonly readOnly = input(false);

  // Flap label depends on scope: a single stop shows that city; otherwise the whole plan.
  protected readonly flapLabel = computed(() =>
    this.stop()
      ? $localize`:@@timeline.flapLabelCity:Ver itinerario de la ciudad`
      : $localize`:@@timeline.flapLabelPlan:Ver itinerario del plan`,
  );

  protected readonly flapAriaLabel = computed(() =>
    this.collapsed()
      ? $localize`:@@timeline.flapAriaExpand:Expandir panel de horario`
      : $localize`:@@timeline.flapAriaCollapse:Colapsar panel de horario`,
  );

  protected readonly hours = Array.from(
    { length: TL_H1 - TL_H0 + 1 },
    (_, i) => TL_H0 + i,
  );

  protected readonly gridHeight = computed(() => (TL_H1 - TL_H0) * TL_RH + 12);
  protected readonly pad = (h: number) => String(h).padStart(2, '0');

  @ViewChild('tlGridWrap') private tlGridWrap?: ElementRef<HTMLElement>;
  @ViewChild('tlDaysEl')   private tlDaysEl?:   ElementRef<HTMLElement>;
  @ViewChild('tlGridEl')   private tlGridEl?:   ElementRef<HTMLElement>;

  protected readonly trip   = inject(TripService);
  protected readonly device = inject(DeviceService);
  private  readonly api     = inject(ApiService);
  private  readonly karmaModal = inject(KarmaModalService);
  private  readonly locale     = inject(LocaleService);
  protected readonly exporting = signal(false);

  // ── Collapse / expand ─────────────────────────────────────────────────────
  protected readonly collapsed = signal(false);
  protected readonly daySlideshowOpen  = signal(false);
  protected readonly planSlideshowOpen = signal(false);
  protected readonly draggingEntryId = signal<string | null>(null);
  protected readonly dragPreview = signal<{ top: number; time: string } | null>(null);
  protected toggleCollapse(): void { this.collapsed.update(v => !v); }
  /** Public: open the timeline (used by the mobile 'Ver itinerario' button). */
  expand(): void { this.collapsed.set(false); }

  private lastStopId: string | null = null;

  // ── Active stop + transits (input override or service) ────────────────────
  private activeStop(): TripStop | null {
    return this.stop() ?? this.trip.activeStop();
  }

  // Prefer explicit input; fall back to TripService (planning page)
  private readonly allTransits = computed<TransitLeg[]>(() =>
    this.transits() ?? this.trip.transits(),
  );

  // ── Visibility ────────────────────────────────────────────────────────────
  protected readonly visible = computed(() =>
    !!this.activeStop() || !!this.trip.selectedTransitId(),
  );

  protected readonly transportMode = computed(() =>
    !this.stop() && !this.trip.activeStop() && !!this.trip.selectedTransitId(),
  );

  // ── Selected day (reset on stop change) ───────────────────────────────────
  protected readonly selectedDay = signal<string | null>(null);

  // ── Day tabs — trip-wide when no explicit stop input ─────────────────────
  protected readonly days = computed<DayTab[]>(() => {
    const stops    = this.stop() ? [this.stop()!] : this.trip.stops();
    const transits = this.allTransits();
    const tabs: DayTab[] = [];

    for (const stop of stops) {
      if (!stop?.checkIn || !stop?.checkOut) continue;
      const [dIn,  mIn,  yIn]  = stop.checkIn.split('/').map(Number);
      const [dOut, mOut, yOut] = stop.checkOut.split('/').map(Number);
      const from = new Date(yIn,  mIn  - 1, dIn);
      const to   = new Date(yOut, mOut - 1, dOut);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) continue;

      const city     = WORLD_CITIES.find(c => c.id === stop.cityId);
      const cityFlag = city?.flag ?? '📍';

      for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 86_400_000)) {
        const key = dateKey(d);
        const hasAtt = stop.selectedAttractions.some(
          (a: PlannedAttraction) => !!a.startTime && (!a.date || a.date.slice(0, 5) === key),
        );
        const hasTransit = transits.some(leg =>
          (leg.fromCityId === stop.cityId || leg.toCityId === stop.cityId) &&
          leg.segments.some(seg =>
            (seg.departureDate?.slice(0, 5) === key) || (seg.arrivalDate?.slice(0, 5) === key),
          ),
        );
        tabs.push({
          date: new Date(d), dow: d.toLocaleDateString(undefined, { weekday: 'short' }), num: d.getDate(), key,
          hasEvents: hasAtt || hasTransit, cityId: stop.cityId, cityFlag,
        });
      }
    }
    return tabs;
  });

  // The stop that owns the currently-selected day (for trip-wide tabs).
  private readonly selectedStopForDay = computed<TripStop | null>(() => {
    const key   = this.selectedDay();
    const stops = this.stop() ? [this.stop()!] : this.trip.stops();
    if (!key) return this.stop() ?? this.trip.activeStop();
    const tab = this.days().find(t => t.key === key);
    if (!tab) return this.stop() ?? this.trip.activeStop();
    return stops.find(s => s.cityId === (tab as any).cityId) ?? this.trip.activeStop();
  });

  // ── Auto-select first day with events on stop change ──────────────────────
  // Only re-derives selectedDay() when the stop actually changed or the
  // current selection fell off the tab list (e.g. a check-in/out edit
  // shrank the range) — NOT on every stops() update. Adding/editing an
  // attraction in the currently-selected day also produces a new stop
  // object reference, but the day keys themselves don't change, so without
  // this guard the day tab the user is looking at would jump back to the
  // first day with events each time they plan something.
  constructor() {
    effect(() => {
      const stop = this.activeStop();
      if (!stop) { this.selectedDay.set(null); this.lastStopId = null; return; }

      const stopChanged = stop.stopId !== this.lastStopId;
      if (stopChanged && this.device.isMobile() && !this.inline()) {
        this.collapsed.set(true);
      }
      this.lastStopId = stop.stopId;

      const tabs = this.days();
      if (!stopChanged && tabs.some(t => t.key === this.selectedDay())) return;

      const firstWithEvents = tabs.find(t => t.hasEvents);
      this.selectedDay.set(firstWithEvents?.key ?? tabs[0]?.key ?? null);
    }, { allowSignalWrites: true });

    effect(() => {
      const day = this.selectedDay();
      if (!day) return;
      setTimeout(() => this.scrollToFirstBlock(), 50);
    });
  }

  protected selectDay(key: string): void {
    this.selectedDay.set(key);
    // Trip-wide mode only (no explicit `stop` input — the plan-editing page's main timeline,
    // not the inline per-stop or shared-trip read-only instances): picking a day that belongs
    // to a different city also switches the left panel's active stop to match, so the two
    // panels never show different cities at once.
    if (this.stop()) return;
    const tab = this.days().find(t => t.key === key);
    if (!tab) return;
    const targetStop = this.trip.stops().find(s => s.cityId === tab.cityId);
    if (targetStop && targetStop.stopId !== this.trip.activeId()) {
      this.trip.setActive(targetStop.stopId);
    }
  }

  protected scrollDays(direction: -1 | 1): void {
    const el = this.tlDaysEl?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: direction * 160, behavior: 'smooth' });
  }

  // ── Header content ────────────────────────────────────────────────────────
  protected readonly eyebrow = computed<string>(() =>
    this.transportMode()
      ? $localize`:@@timeline.eyebrowTransport:Transporte`
      : $localize`:@@timeline.eyebrowDayView:Vista del día`,
  );

  protected readonly title = computed<string>(() => {
    if (this.transportMode()) return $localize`:@@timeline.eyebrowTransport:Transporte`;
    const stop = this.selectedStopForDay();
    if (!stop) return '';
    const city = WORLD_CITIES.find(c => c.id === stop.cityId);
    return city ? city.name : stop.cityId;
  });

  protected readonly titleFlag = computed<string | null>(() => {
    if (this.transportMode()) return null;
    const stop = this.selectedStopForDay();
    if (!stop) return null;
    return WORLD_CITIES.find(c => c.id === stop.cityId)?.flag ?? null;
  });

  protected readonly subtitle = computed<string>(() => {
    if (this.transportMode()) return '';
    const stop = this.selectedStopForDay();
    const day  = this.selectedDay();
    if (!stop || !day) return '';
    const dayAtts = this.attractionsForDay(stop.selectedAttractions, day)
      .filter((a: PlannedAttraction) => !!a.startTime);
    const totalBlocks = this.blocks().length;
    if (!totalBlocks) return `${day} · ${$localize`:@@timeline.noActivities:sin actividades`}`;
    const attCount = dayAtts.length;
    const transitCount = totalBlocks - attCount;
    const activityWord = attCount === 1
      ? $localize`:@@timeline.activityOne:actividad`
      : $localize`:@@timeline.activityMany:actividades`;
    const transportWord = transitCount === 1
      ? $localize`:@@timeline.transportOne:transporte`
      : $localize`:@@timeline.transportMany:transportes`;
    const parts: string[] = [];
    if (attCount)     parts.push(`${attCount} ${activityWord}`);
    if (transitCount) parts.push(`${transitCount} ${transportWord}`);
    return `${day} · ${parts.join(' · ')}`;
  });

  // Walking route through the selected day's timed attractions, in start-time
  // order. Origin/destination default to the stop's lodging (round trip), but
  // on the stop's first/last day they use the arriving/departing transit's
  // terminal instead — the traveler hasn't reached (or has already left) the
  // hotel yet on those days.
  protected readonly routeUrl = computed<string | null>(() => {
    if (this.transportMode()) return null;
    const stop = this.selectedStopForDay();
    const day  = this.selectedDay();
    if (!stop || !day) return null;
    const city = WORLD_CITIES.find(c => c.id === stop.cityId);
    const attractions = city ? getAttractions(city) : [];
    const names = this.attractionsForDay(stop.selectedAttractions, day)
      .filter((a: PlannedAttraction) => !!a.startTime)
      .sort((a, b) => hmToMin(a.startTime!) - hmToMin(b.startTime!))
      .map(a => attractions.find(x => x.id === a.attractionId)?.name)
      .filter((n): n is string => !!n);

    const lodgingName = stop.lodging?.name ?? null;
    const origin      = this.arrivalTerminal(stop, day)   ?? lodgingName;
    const destination = this.departureTerminal(stop, day) ?? lodgingName;
    return buildDayRouteUrl(names, stop.cityId, origin, destination);
  });

  // Terminal (airport/station/pier) the traveler arrives at, only on the
  // stop's first day and only for modes with a fixed terminal (not bus/car).
  private arrivalTerminal(stop: TripStop, day: string): string | null {
    if (day !== stop.checkIn.slice(0, 5)) return null;
    for (const leg of this.allTransits()) {
      if (leg.toCityId !== stop.cityId) continue;
      const seg = leg.segments.find(s => s.arrivalDate?.slice(0, 5) === day);
      if (seg) return transitTerminalName(seg.mode);
    }
    return null;
  }

  // Terminal the traveler departs from, only on the stop's last day.
  private departureTerminal(stop: TripStop, day: string): string | null {
    if (day !== stop.checkOut.slice(0, 5)) return null;
    for (const leg of this.allTransits()) {
      if (leg.fromCityId !== stop.cityId) continue;
      const seg = leg.segments.find(s => s.departureDate?.slice(0, 5) === day);
      if (seg) return transitTerminalName(seg.mode);
    }
    return null;
  }

  // ── Block calculation ─────────────────────────────────────────────────────
  protected readonly blocks = computed<TimeBlock[]>(() => {
    const stop = this.selectedStopForDay();
    const day  = this.selectedDay();
    if (!stop || !day) return [];

    const attractions = this.attractionsFor(stop.cityId);

    const attBlocks: TimeBlock[] = this.attractionsForDay(stop.selectedAttractions, day)
      .filter((a: PlannedAttraction) => !!a.startTime)
      .map((a: PlannedAttraction) => {
        const att      = attractions.find(x => x.id === a.attractionId) ?? null;
        const startMin = hmToMin(a.startTime!);
        const endMin   = startMin + resolveDuration(a, att);
        const top      = Math.max(0, (startMin - TL_H0 * 60) / 60 * TL_RH);
        const height   = Math.max(30, (endMin - startMin) / 60 * TL_RH - 4);
        const [bg, fg] = typeColors(att?.type ?? '');
        return {
          top, height, bg, fg,
          icon: typeIcon(att?.type ?? ''),
          name: att?.name ?? a.attractionId,
          time: `${a.startTime}–${minToHm(endMin)}`,
          kind: 'attraction' as const,
          entryId: a.entryId,
          draggable: !this.readOnly() && !this.isRescheduleLocked(a),
        };
      });

    const transitBlocks: TimeBlock[] = this.transitBlocksForDay(day, stop.cityId);

    return [...attBlocks, ...transitBlocks].sort((a, b) => a.top - b.top);
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  // Fixed real-world schedule — cannot be dragged to a new time. Mirrors
  // PlanTimeModalComponent's isFixedEvent gate, plus freetours per the
  // family's explicit request (Task 9).
  private isRescheduleLocked(a: PlannedAttraction): boolean {
    return a.category === 'freetour' || (a.category === 'event_party' && !!a.date);
  }

  private attractionsFor(cityId: string) {
    const city = WORLD_CITIES.find(c => c.id === cityId);
    return city ? getAttractions(city) : [];
  }

  private attractionsForDay(atts: PlannedAttraction[], dayKey: string): PlannedAttraction[] {
    return atts.filter((a: PlannedAttraction) =>
      !a.date || a.date.slice(0, 5) === dayKey,
    );
  }

  private transitBlocksForDay(day: string, cityId: string): TimeBlock[] {
    const blocks: TimeBlock[] = [];

    for (const leg of this.allTransits()) {
      const isOutgoing = leg.fromCityId === cityId;
      const isIncoming = leg.toCityId   === cityId;
      if (!isOutgoing && !isIncoming) continue;

      for (const seg of leg.segments) {
        if (!seg.departureDate || !seg.departureTime) continue;

        const depKey    = seg.departureDate.slice(0, 5);  // dd/mm
        const arrKey    = seg.arrivalDate ? seg.arrivalDate.slice(0, 5) : depKey;
        const hasArrival = !!(seg.arrivalDate && seg.arrivalTime);

        let startMin: number;
        let endMin: number;
        let timeStr: string;

        if (depKey === day) {
          startMin = hmToMin(seg.departureTime);
          if (arrKey === day && hasArrival) {
            endMin  = hmToMin(seg.arrivalTime);
            timeStr = `${seg.departureTime}–${seg.arrivalTime}`;
          } else {
            endMin  = TL_H1 * 60;  // continues past midnight
            timeStr = `${seg.departureTime}→`;
          }
        } else if (arrKey === day && hasArrival) {
          startMin = TL_H0 * 60;   // started on a previous day
          endMin   = hmToMin(seg.arrivalTime);
          timeStr  = `→${seg.arrivalTime}`;
        } else {
          continue;
        }

        // Clip to grid bounds and skip zero-height blocks
        const clippedStart  = Math.max(startMin, TL_H0 * 60);
        const clippedEnd    = Math.min(endMin,   TL_H1 * 60);
        if (clippedEnd <= clippedStart) continue;

        const top    = (clippedStart - TL_H0 * 60) / 60 * TL_RH;
        const height = Math.max(20, (clippedEnd - clippedStart) / 60 * TL_RH - 4);

        const [bg, fg] = transitModeColors(seg.mode);
        const fromLabel = this.cityLabel(leg.fromCityId);
        const toLabel   = this.cityLabel(leg.toCityId);

        blocks.push({
          top, height, bg, fg,
          icon: transitIcon(seg.mode),
          name: `${fromLabel} → ${toLabel}`,
          time: timeStr + (seg.notes ? ` · ${seg.notes}` : ''),
          kind: 'transit' as const,
          draggable: false,
        });
      }
    }

    return blocks;
  }

  private cityLabel(cityId: string): string {
    if (cityId === '__start__' || cityId === '__end__') return '🏠';
    return WORLD_CITIES.find(c => c.id === cityId)?.name ?? cityId;
  }

  protected exportItinerary(): void {
    const planId = this.trip.loadedPlanId();
    if (!planId) return;
    const { cityNames, attractionNames, ticketRequiredIds } = buildItineraryExportMaps(this.trip.stops());
    this.exporting.set(true);
    this.api.exportItinerary(planId, cityNames, attractionNames, ticketRequiredIds).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'itinerario.xlsx'; a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: err => { this.exporting.set(false); this.karmaModal.handleKarmaError(err); },
    });
  }

  protected onBlockDragStart(event: DragEvent, entryId: string): void {
    if (this.readOnly()) return;
    const stop = this.selectedStopForDay();
    if (!stop) return;
    const payload: RescheduleDragPayload = { stopId: stop.stopId, entryId };
    event.dataTransfer?.setData(RESCHEDULE_MIME, JSON.stringify(payload));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    this.draggingEntryId.set(entryId);
  }

  protected onBlockDragEnd(): void {
    this.draggingEntryId.set(null);
    this.dragPreview.set(null);
  }

  protected onGridDragOver(event: DragEvent): void {
    if (this.transportMode() || this.readOnly()) return;
    const types = Array.from(event.dataTransfer?.types ?? []);
    const isNew         = types.includes(NEW_ATTRACTION_MIME);
    const isReschedule  = types.includes(RESCHEDULE_MIME);
    if (!isNew && !isReschedule) return;
    event.preventDefault(); // required to allow a drop
    if (event.dataTransfer) event.dataTransfer.dropEffect = isReschedule ? 'move' : 'copy';

    if (isReschedule && this.draggingEntryId()) {
      const offsetY    = this.offsetWithinGrid(event.clientY);
      const snappedMin = snapMinutesFromOffset(offsetY, TL_H0, TL_H1, TL_RH);
      this.dragPreview.set({
        top:  (snappedMin - TL_H0 * 60) / 60 * TL_RH,
        time: minutesToHm(snappedMin),
      });
    }
  }

  protected onGridDrop(event: DragEvent): void {
    if (this.transportMode() || this.readOnly()) return;
    event.preventDefault();

    const reschedule = event.dataTransfer?.getData(RESCHEDULE_MIME);
    if (reschedule) { this.applyReschedule(reschedule, event.clientY); return; }

    const raw = event.dataTransfer?.getData(NEW_ATTRACTION_MIME);
    if (raw) this.applyNewAttraction(raw, event.clientY);
  }

  // Shared by native-drag (onGridDrop above) and touch-drag (onBlockTouchEnd / window:touchend
  // below) — both resolve to the exact same MIME-payload shape, they just arrive through a
  // DataTransfer vs. TouchDragService. See TouchDragService's doc comment for why touch needs
  // a separate delivery channel at all.
  private applyReschedule(rawPayload: string, clientY: number): void {
    const stop = this.selectedStopForDay();
    const day  = this.selectedDay();
    if (!stop || !day) return;

    const offsetY    = this.offsetWithinGrid(clientY);
    const snappedMin = snapMinutesFromOffset(offsetY, TL_H0, TL_H1, TL_RH);
    const startTime  = minutesToHm(snappedMin);

    let payload: RescheduleDragPayload | null = null;
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      payload = null;
    }
    if (payload?.entryId) {
      const { entryId } = payload;
      const original = this.trip.selectedAttractionsFor(stop.stopId).find(a => a.entryId === entryId);
      if (original && !this.isRescheduleLocked(original)) {
        const att = this.attractionsFor(stop.cityId).find(x => x.id === original.attractionId) ?? null;
        const durationMin = resolveDuration(original, att);
        this.trip.updateStartTime(stop.stopId, entryId, startTime, undefined, durationMin);
      }
    }
    this.draggingEntryId.set(null);
    this.dragPreview.set(null);
  }

  private applyNewAttraction(rawPayload: string, clientY: number): void {
    const stop = this.selectedStopForDay();
    const day  = this.selectedDay();
    if (!stop || !day) return;

    const offsetY    = this.offsetWithinGrid(clientY);
    const snappedMin = snapMinutesFromOffset(offsetY, TL_H0, TL_H1, TL_RH);
    const startTime  = minutesToHm(snappedMin);

    let payload: NewAttractionDragPayload | null = null;
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      payload = null;
    }
    if (!payload?.attractionId) return;
    const tab = this.days().find(t => t.key === day);
    const fullDate = tab ? this.fmtDate(tab.date) : undefined;
    this.trip.addAttraction(stop.stopId, payload.attractionId, startTime, fullDate, payload.category, payload.estimatedMinutes);
  }

  private offsetWithinGrid(clientY: number): number {
    const rect = this.tlGridEl?.nativeElement.getBoundingClientRect();
    return rect ? clientY - rect.top : 0;
  }

  // ── Touch drag-and-drop (family feedback: "the move/drag is not allowed on mobile") ────────
  // Reschedule (dragging an existing .tl-block) is entirely self-contained in this component —
  // the block IS this component's own template, so its touch handlers below are bound directly,
  // same as the native (dragstart)/(dragend) handlers above. Dragging a NEW attraction in from
  // AttractionCardComponent is cross-component, so that half is driven by watching
  // TouchDragService (see the effect() in the constructor and the window:touchend/touchcancel
  // listeners further down) instead of a template binding here.
  //
  // CRITICAL — `[attr.draggable]` on .tl-block (above, in the template) must stay OFF on
  // mobile (`&& !device.isMobile()`), same reasoning as AttractionCardComponent's .att-card:
  // WebKit/iOS Safari and several Android WebViews give a `draggable="true"` element its own
  // native touch-driven drag recognition, which otherwise fights the touch handlers below for
  // the same gesture on the same element — this was the actual root cause of drag-to-reschedule
  // also not working on mobile after the first touch-support pass.
  // CRITICAL — `.tl-block.tl-block-draggable` carries `touch-action: none` (see src/styles.css).
  // Without it, a real touch device decides scroll-vs-drag from the FIRST touchmove of the
  // gesture — long before this arm timer ever fires — and once it commits to a native scroll,
  // this component calling `preventDefault()` later (once armed) does nothing; the grid just
  // keeps scrolling under the finger and no drag starts. `touch-action: none` hands 100% of that
  // decision to this component instead. The trade-off is that the browser no longer scrolls on
  // its own for a touch that starts on a block, so the pre-armed branch below replays the
  // vertical delta by hand onto the real scrollable grid ancestor (`findScrollableAncestor`) to
  // keep a plain swipe feeling exactly like a normal scroll. Root-caused via
  // superpowers:systematic-debugging after a synthetic (JS-dispatched) TouchEvent test had looked
  // fully working but a real phone still couldn't drag — synthetic dispatch never exercises the
  // real browser scroll-commit race this depends on. Same fix, same reasoning, as
  // AttractionCardComponent's onTouchStart/onTouchMove — see that component's CRITICAL comment.
  private static readonly TOUCH_ARM_DELAY_MS   = 350;
  private static readonly TOUCH_MOVE_CANCEL_PX = 10;

  private readonly touchDrag = inject(TouchDragService);
  private blockTouchArmTimer: ReturnType<typeof setTimeout> | null = null;
  private blockTouchArmed = false;
  private blockTouchStart: { x: number; y: number } | null = null;
  private blockTouchEntryId: string | null = null;
  private blockTouchScrollAncestor: HTMLElement | null = null;
  private blockLastTouchY = 0;

  protected onBlockTouchStart(event: TouchEvent, entryId: string): void {
    if (this.readOnly()) return;
    const touch = event.touches[0];
    if (!touch) return;
    this.blockTouchArmed = false;
    this.blockTouchStart = { x: touch.clientX, y: touch.clientY };
    this.blockTouchEntryId = entryId;
    this.blockTouchScrollAncestor = findScrollableAncestor(event.currentTarget as HTMLElement);
    this.blockLastTouchY = touch.clientY;
    this.clearBlockTouchArmTimer();
    this.blockTouchArmTimer = setTimeout(() => {
      this.blockTouchArmed = true;
      this.draggingEntryId.set(entryId);
    }, DayTimelineComponent.TOUCH_ARM_DELAY_MS);
  }

  protected onBlockTouchMove(event: TouchEvent): void {
    const touch = event.touches[0];
    if (!touch || !this.blockTouchStart) return;

    if (!this.blockTouchArmed) {
      const dx = touch.clientX - this.blockTouchStart.x;
      const dy = touch.clientY - this.blockTouchStart.y;
      if (Math.hypot(dx, dy) > DayTimelineComponent.TOUCH_MOVE_CANCEL_PX) this.clearBlockTouchArmTimer();
      // Native scrolling is disabled on this element (`touch-action: none`) — replay the
      // vertical delta by hand so a plain swipe that never reaches the long-press threshold
      // still scrolls the grid normally.
      if (this.blockTouchScrollAncestor) this.blockTouchScrollAncestor.scrollTop -= (touch.clientY - this.blockLastTouchY);
      this.blockLastTouchY = touch.clientY;
      return;
    }

    event.preventDefault(); // stop the grid from scrolling while a block is being dragged
    const offsetY    = this.offsetWithinGrid(touch.clientY);
    const snappedMin = snapMinutesFromOffset(offsetY, TL_H0, TL_H1, TL_RH);
    this.dragPreview.set({
      top:  (snappedMin - TL_H0 * 60) / 60 * TL_RH,
      time: minutesToHm(snappedMin),
    });
  }

  protected onBlockTouchEnd(event: TouchEvent): void {
    this.clearBlockTouchArmTimer();
    if (this.blockTouchArmed && this.blockTouchEntryId) {
      event.preventDefault();
      const touch = event.changedTouches[0];
      const stop  = this.selectedStopForDay();
      if (touch && stop) {
        const payload: RescheduleDragPayload = { stopId: stop.stopId, entryId: this.blockTouchEntryId };
        this.applyReschedule(JSON.stringify(payload), touch.clientY);
      }
    }
    this.blockTouchArmed = false;
    this.blockTouchStart = null;
    this.blockTouchEntryId = null;
    this.blockTouchScrollAncestor = null;
    this.draggingEntryId.set(null);
    this.dragPreview.set(null);
  }

  protected onBlockTouchCancel(): void {
    this.clearBlockTouchArmTimer();
    this.blockTouchArmed = false;
    this.blockTouchStart = null;
    this.blockTouchEntryId = null;
    this.blockTouchScrollAncestor = null;
    this.draggingEntryId.set(null);
    this.dragPreview.set(null);
  }

  private clearBlockTouchArmTimer(): void {
    if (this.blockTouchArmTimer !== null) { clearTimeout(this.blockTouchArmTimer); this.blockTouchArmTimer = null; }
  }

  // New-attraction (card -> grid) touch drag: TouchDragService is the shared source of truth,
  // since AttractionCardComponent (the source) and this component (the target) aren't in the
  // same subtree. This effect drives the live preview bubble the same way onGridDragOver's
  // native-drag branch does; window:touchend below resolves the actual drop.
  private touchDragPreviewEffect = effect(() => {
    const state = this.touchDrag.state();
    if (!state || state.mime !== NEW_ATTRACTION_MIME || this.readOnly() || this.transportMode()) return;
    const rect = this.tlGridEl?.nativeElement.getBoundingClientRect();
    if (!rect || !this.pointWithinRect(state.x, state.y, rect)) return;
    const snappedMin = snapMinutesFromOffset(state.y - rect.top, TL_H0, TL_H1, TL_RH);
    this.dragPreview.set({
      top:  (snappedMin - TL_H0 * 60) / 60 * TL_RH,
      time: minutesToHm(snappedMin),
    });
  }, { allowSignalWrites: true });

  private pointWithinRect(x: number, y: number, rect: DOMRect): boolean {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  @HostListener('window:touchend')
  protected onWindowTouchEnd(): void {
    const state = this.touchDrag.consume();
    if (!state || state.mime !== NEW_ATTRACTION_MIME) return;
    this.dragPreview.set(null);
    if (this.readOnly() || this.transportMode()) return;
    const rect = this.tlGridEl?.nativeElement.getBoundingClientRect();
    if (!rect || !this.pointWithinRect(state.x, state.y, rect)) return;
    this.applyNewAttraction(state.payload, state.y);
  }

  @HostListener('window:touchcancel')
  protected onWindowTouchCancel(): void {
    const state = this.touchDrag.state();
    if (state?.mime === NEW_ATTRACTION_MIME) {
      this.touchDrag.cancel();
      this.dragPreview.set(null);
    }
  }

  private scrollToFirstBlock(): void {
    const wrap = this.tlGridWrap?.nativeElement;
    if (!wrap) return;
    const bls = this.blocks();
    if (bls.length) {
      const firstTop = Math.min(...bls.map(b => b.top));
      wrap.scrollTop = Math.max(0, firstTop - 20);
    } else {
      wrap.scrollTop = 7 * TL_RH;  // free day: open at 07:00, not midnight
    }
  }

  // ── Slideshow items ───────────────────────────────────────────────────────
  protected readonly daySlideItems = computed<SlideshowItem[]>(() => {
    const stop = this.selectedStopForDay();
    const day  = this.selectedDay();
    if (!stop || !day) return [];

    const dayTab  = this.days().find(t => t.key === day);
    const dateStr = dayTab ? this.fmtDate(dayTab.date) : null;

    const city = WORLD_CITIES.find(c => c.id === stop.cityId);
    const attractions = city ? getAttractions(city) : [];

    const attItems: SlideshowItem[] = this.attractionsForDay(stop.selectedAttractions, day)
      .filter((a: PlannedAttraction) => !!a.startTime)
      .map((a: PlannedAttraction): SlideshowItem => {
        const att = attractions.find(x => x.id === a.attractionId)
                 ?? findCuratedAttraction(stop.cityId, a.attractionId)
                 ?? null;
        const startMin = hmToMin(a.startTime!);
        const endMin   = a.endTime ? hmToMin(a.endTime) : startMin + (att?.estimatedMinutes ?? 60);
        const date     = a.date ?? dateStr;
        return {
          id:          `att:${a.entryId}`,
          name:        att?.name ?? a.attractionId,
          type:        att?.type ?? '',
          icon:        typeIcon(att?.type ?? ''),
          imageUrl:    att?.imageUrl ?? null,
          description: (att ? localizedDescription(att, this.locale.current()) : undefined) ?? null,
          startDate:   date,
          startTime:   a.startTime!,
          endDate:     date,
          endTime:     minToHm(endMin),
        };
      });

    return [...attItems, ...this.transitSlideItemsForDay(day, stop.cityId)]
      .sort((a, b) => this.slideSortKey(a) - this.slideSortKey(b));
  });

  protected readonly planSlideItems = computed<SlideshowItem[]>(() => {
    if (!this.showPlanSlideshow()) return [];
    const stops = this.stop() ? [this.stop()!] : this.trip.stops();
    return buildPlanSlideshowItems(stops, this.allTransits(), this.locale.current());
  });

  private transitSlideItemsForDay(day: string, cityId: string): SlideshowItem[] {
    const items: SlideshowItem[] = [];
    for (const leg of this.allTransits()) {
      const isOutgoing = leg.fromCityId === cityId;
      const isIncoming = leg.toCityId   === cityId;
      if (!isOutgoing && !isIncoming) continue;

      for (const seg of leg.segments) {
        if (!seg.departureDate || !seg.departureTime) continue;
        const depKey = seg.departureDate.slice(0, 5);
        const arrKey = seg.arrivalDate ? seg.arrivalDate.slice(0, 5) : depKey;
        if (depKey !== day && arrKey !== day) continue;

        items.push({
          id:          `transit:${leg.fromCityId}:${leg.toCityId}:${seg.departureDate}:${seg.departureTime}`,
          name:        `${this.cityLabel(leg.fromCityId)} → ${this.cityLabel(leg.toCityId)}`,
          type:        transitLabel(seg.mode),
          icon:        transitIcon(seg.mode),
          imageUrl:    null,
          description: null,
          startDate:   seg.departureDate,
          startTime:   seg.departureTime,
          endDate:     seg.arrivalDate || seg.departureDate,
          endTime:     seg.arrivalTime || null,
        });
      }
    }
    return items;
  }

  private slideSortKey(item: SlideshowItem): number {
    if (!item.startDate || !item.startTime) return Number.MAX_SAFE_INTEGER;
    const [d, m, y] = item.startDate.split('/').map(Number);
    const [h, mi]   = item.startTime.split(':').map(Number);
    const t = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0).getTime();
    return isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
  }

  private fmtDate(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
}
