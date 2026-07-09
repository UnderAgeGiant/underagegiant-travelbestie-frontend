import {
  ChangeDetectionStrategy, Component, computed, effect, ElementRef,
  inject, input, signal, ViewChild,
} from '@angular/core';
import { DeviceService } from '../../../core/device/device.service';
import { NgClass, NgStyle } from '@angular/common';
import { TripService } from '../../trip/trip.service';
import { TripStop, PlannedAttraction, TransitLeg } from '../../../core/models/trip.model';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions } from '../../../data/attractions.data';
import { ApiService } from '../../../core/api/api.service';
import { KarmaModalService } from '../../../core/karma/karma-modal.service';
import { dayRouteUrl as buildDayRouteUrl, transitTerminalName } from '../../../core/maps/google-maps-url.util';

// ── Grid constants (from landing-preview.html) ──────────────────────────────
const TL_H0 = 0;   // first hour rendered (00:00 — full day, user feedback 09-07-2026)
const TL_H1 = 23;  // last  hour rendered (23:00)
const TL_RH = 46;  // pixels per hour

const DOW_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

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
}

function hmToMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minToHm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
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

@Component({
    selector: 'tb-day-timeline',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass, NgStyle],
    template: `
@if (visible()) {
  <div class="timeline-panel timeline-accent" [class.collapsed]="collapsed()" [class.timeline-inline]="inline()">

    <div class="tl-body">

      <!-- Header -->
      <div class="tl-head">
        <div class="tl-head-eyebrow">{{ eyebrow() }}</div>
        <div class="tl-head-title">{{ title() }}</div>
        <div class="tl-head-sub">{{ subtitle() }}</div>
        @if (trip.loadedPlanId()) {
          <button class="btn-pill btn-outline" style="margin-top:6px;font-size:11px;padding:4px 12px"
                  [disabled]="exporting()" (click)="exportItinerary()" type="button"
                  i18n="@@plan.exportItinerary">{{ exporting() ? '⏳' : '📥' }} Exportar</button>
        }
        @if (routeUrl()) {
          <a class="btn-pill btn-outline tl-route-btn"
             [attr.href]="routeUrl()" target="_blank" rel="noopener noreferrer">
            <span i18n="@@timeline.dayRoute">🗺️ Ruta del día</span>
          </a>
        }
      </div>

      <!-- Day tabs (hidden in transport mode) -->
      @if (!transportMode()) {
        <div class="tl-days" #tlDaysEl>
          @for (day of days(); track day.key) {
            <button [ngClass]="['tl-day', day.key === selectedDay() ? 'active' : '']"
                    (click)="selectDay(day.key)">
              <div class="tl-day-city">{{ day.cityFlag }}</div>
              <div class="tl-day-dow">{{ day.dow }}</div>
              <div class="tl-day-num">{{ day.num }}</div>
              <div [ngClass]="['tl-day-dot', day.hasEvents ? '' : 'empty']"></div>
            </button>
          }
        </div>
      }

      <!-- Hour grid -->
      <div class="tl-grid-wrap" #tlGridWrap>
        <div class="tl-grid" [ngStyle]="{ height: gridHeight() + 'px' }">

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
            [attr.aria-label]="collapsed() ? 'Expandir panel de horario' : 'Colapsar panel de horario'">
      <span class="tl-flap-chevron">{{ collapsed() ? '›' : '‹' }}</span>
      <span class="tl-flap-label">{{ flapLabel() }}</span>
    </button>

  </div>
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

  // Flap label depends on scope: a single stop shows that city; otherwise the whole plan.
  protected readonly flapLabel = computed(() =>
    this.stop()
      ? $localize`:@@timeline.flapLabelCity:Ver itinerario de la ciudad`
      : $localize`:@@timeline.flapLabelPlan:Ver itinerario del plan`,
  );

  protected readonly hours = Array.from(
    { length: TL_H1 - TL_H0 + 1 },
    (_, i) => TL_H0 + i,
  );

  protected readonly gridHeight = computed(() => (TL_H1 - TL_H0) * TL_RH + 12);
  protected readonly pad = (h: number) => String(h).padStart(2, '0');

  @ViewChild('tlGridWrap') private tlGridWrap?: ElementRef<HTMLElement>;
  @ViewChild('tlDaysEl')   private tlDaysEl?:   ElementRef<HTMLElement>;

  protected readonly trip   = inject(TripService);
  private  readonly device  = inject(DeviceService);
  private  readonly api     = inject(ApiService);
  private  readonly karmaModal = inject(KarmaModalService);
  protected readonly exporting = signal(false);

  // ── Collapse / expand ─────────────────────────────────────────────────────
  protected readonly collapsed = signal(false);
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
          date: new Date(d), dow: DOW_ES[d.getDay()], num: d.getDate(), key,
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
  constructor() {
    effect(() => {
      const stop = this.activeStop();
      if (!stop) { this.selectedDay.set(null); this.lastStopId = null; return; }

      if (stop.stopId !== this.lastStopId && this.device.isMobile() && !this.inline()) {
        this.collapsed.set(true);
      }
      this.lastStopId = stop.stopId;

      const tabs = this.days();
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
  }

  // ── Header content ────────────────────────────────────────────────────────
  protected readonly eyebrow = computed<string>(() =>
    this.transportMode() ? 'Transporte' : 'Vista del día',
  );

  protected readonly title = computed<string>(() => {
    if (this.transportMode()) return 'Transporte';
    const stop = this.selectedStopForDay();
    if (!stop) return '';
    const city = WORLD_CITIES.find(c => c.id === stop.cityId);
    return city ? `${city.flag} ${city.name}` : stop.cityId;
  });

  protected readonly subtitle = computed<string>(() => {
    if (this.transportMode()) return '';
    const stop = this.selectedStopForDay();
    const day  = this.selectedDay();
    if (!stop || !day) return '';
    const dayAtts = this.attractionsForDay(stop.selectedAttractions, day)
      .filter((a: PlannedAttraction) => !!a.startTime);
    const totalBlocks = this.blocks().length;
    if (!totalBlocks) return `${day} · sin actividades`;
    const attCount = dayAtts.length;
    const transitCount = totalBlocks - attCount;
    const parts: string[] = [];
    if (attCount)     parts.push(`${attCount} ${attCount === 1 ? 'actividad' : 'actividades'}`);
    if (transitCount) parts.push(`${transitCount} ${transitCount === 1 ? 'transporte' : 'transportes'}`);
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

    const city = WORLD_CITIES.find(c => c.id === stop.cityId);
    const attractions = city ? getAttractions(city) : [];

    const attBlocks: TimeBlock[] = this.attractionsForDay(stop.selectedAttractions, day)
      .filter((a: PlannedAttraction) => !!a.startTime)
      .map((a: PlannedAttraction) => {
        const att      = attractions.find(x => x.id === a.attractionId) ?? null;
        const startMin = hmToMin(a.startTime!);
        const endMin   = a.endTime ? hmToMin(a.endTime) : startMin + (att?.estimatedMinutes ?? 60);
        const top      = Math.max(0, (startMin - TL_H0 * 60) / 60 * TL_RH);
        const height   = Math.max(30, (endMin - startMin) / 60 * TL_RH - 4);
        const [bg, fg] = typeColors(att?.type ?? '');
        return {
          top, height, bg, fg,
          icon: typeIcon(att?.type ?? ''),
          name: att?.name ?? a.attractionId,
          time: `${a.startTime}–${minToHm(endMin)}`,
        };
      });

    const transitBlocks: TimeBlock[] = this.transitBlocksForDay(day, stop.cityId);

    return [...attBlocks, ...transitBlocks].sort((a, b) => a.top - b.top);
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
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
    const cityNames: Record<string, string> = {};
    const attractionNames: Record<string, string> = {};
    for (const stop of this.trip.stops()) {
      const city = WORLD_CITIES.find(c => c.id === stop.cityId);
      if (!city) continue;
      cityNames[stop.cityId] = city.name;
      for (const att of getAttractions(city)) attractionNames[att.id] = att.name;
    }
    this.exporting.set(true);
    this.api.exportItinerary(planId, cityNames, attractionNames).subscribe({
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
}
