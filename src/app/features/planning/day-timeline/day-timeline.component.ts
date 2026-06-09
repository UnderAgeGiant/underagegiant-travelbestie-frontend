import {
  ChangeDetectionStrategy, Component, computed, effect, ElementRef,
  inject, input, signal, ViewChild,
} from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { TripService } from '../../trip/trip.service';
import { TripStop, PlannedAttraction } from '../../../core/models/trip.model';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions } from '../../../data/attractions.data';

// ── Grid constants (from landing-preview.html) ──────────────────────────────
const TL_H0 = 7;   // first hour rendered (07:00)
const TL_H1 = 23;  // last  hour rendered (23:00)
const TL_RH = 46;  // pixels per hour

const DOW_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

interface DayTab {
  date: Date;
  dow:  string;
  num:  number;
  key:  string;   // dd/mm — matches dd/mm slice of dd/mm/yyyy date
  hasEvents: boolean;
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

@Component({
  selector: 'tb-day-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, NgStyle],
  template: `
@if (visible()) {
  <div class="timeline-panel" [class.collapsed]="collapsed()">

    <div class="tl-body">

      <!-- Header -->
      <div class="tl-head">
        <div class="tl-head-eyebrow">{{ eyebrow() }}</div>
        <div class="tl-head-title">{{ title() }}</div>
        <div class="tl-head-sub">{{ subtitle() }}</div>
      </div>

      <!-- Day tabs (hidden in transport mode) -->
      @if (!transportMode()) {
        <div class="tl-days" #tlDaysEl>
          @for (day of days(); track day.key) {
            <button [ngClass]="['tl-day', day.key === selectedDay() ? 'active' : '']"
                    (click)="selectDay(day.key)">
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

          <!-- Attraction blocks -->
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
      {{ collapsed() ? '›' : '‹' }}
    </button>

  </div>
}
  `,
})
export class DayTimelineComponent {
  protected readonly TL_H0 = TL_H0;
  protected readonly TL_RH = TL_RH;

  readonly stop = input<TripStop | null>(null);

  protected readonly hours = Array.from(
    { length: TL_H1 - TL_H0 + 1 },
    (_, i) => TL_H0 + i,
  );

  protected readonly gridHeight = computed(() => (TL_H1 - TL_H0) * TL_RH + 12);
  protected readonly pad = (h: number) => String(h).padStart(2, '0');

  @ViewChild('tlGridWrap') private tlGridWrap?: ElementRef<HTMLElement>;
  @ViewChild('tlDaysEl')   private tlDaysEl?:   ElementRef<HTMLElement>;

  private readonly trip = inject(TripService);

  // ── Collapse / expand ─────────────────────────────────────────────────────
  protected readonly collapsed = signal(false);
  protected toggleCollapse(): void { this.collapsed.update(v => !v); }

  // ── Active stop (input override or service) ────────────────────────────────
  private activeStop() {
    return this.stop() ?? this.trip.activeStop();
  }

  // ── Visibility ────────────────────────────────────────────────────────────
  protected readonly visible = computed(() =>
    !!this.activeStop() || !!this.trip.selectedTransitId(),
  );

  protected readonly transportMode = computed(() =>
    !this.stop() && !this.trip.activeStop() && !!this.trip.selectedTransitId(),
  );

  // ── Selected day (reset on stop change) ───────────────────────────────────
  protected readonly selectedDay = signal<string | null>(null);

  // ── Day tabs for current stop ─────────────────────────────────────────────
  protected readonly days = computed<DayTab[]>(() => {
    const stop = this.activeStop();
    if (!stop || !stop.checkIn || !stop.checkOut) return [];

    const [dIn,  mIn,  yIn]  = stop.checkIn.split('/').map(Number);
    const [dOut, mOut, yOut] = stop.checkOut.split('/').map(Number);
    const from = new Date(yIn,  mIn  - 1, dIn);
    const to   = new Date(yOut, mOut - 1, dOut);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return [];

    const tabs: DayTab[] = [];
    for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 86_400_000)) {
      const key = dateKey(d);
      tabs.push({
        date: new Date(d),
        dow:  DOW_ES[d.getDay()],
        num:  d.getDate(),
        key,
        hasEvents: stop.selectedAttractions.some(
          (a: PlannedAttraction) => !!a.startTime && (!a.date || a.date.slice(0, 5) === key),
        ),
      });
    }
    return tabs;
  });

  // ── Auto-select first day with events on stop change ──────────────────────
  constructor() {
    effect(() => {
      const stop = this.activeStop();
      if (!stop) { this.selectedDay.set(null); return; }
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
    const stop = this.activeStop();
    if (!stop) return '';
    const city = WORLD_CITIES.find(c => c.id === stop.cityId);
    return city ? `${city.flag} ${city.name}` : stop.cityId;
  });

  protected readonly subtitle = computed<string>(() => {
    if (this.transportMode()) return '';
    const stop = this.activeStop();
    const day  = this.selectedDay();
    if (!stop || !day) return '';
    const dayAtts = this.attractionsForDay(stop.selectedAttractions, day)
      .filter((a: PlannedAttraction) => !!a.startTime);
    if (!dayAtts.length) return `${day} · sin actividades`;
    const totalH = dayAtts.reduce((sum: number, a: PlannedAttraction) => {
      const start = hmToMin(a.startTime!);
      const end   = a.endTime ? hmToMin(a.endTime) : start + 60;
      return sum + (end - start) / 60;
    }, 0);
    const n = dayAtts.length;
    return `${day} · ${n} ${n === 1 ? 'actividad' : 'actividades'} · ${totalH}h`;
  });

  // ── Block calculation ─────────────────────────────────────────────────────
  protected readonly blocks = computed<TimeBlock[]>(() => {
    const stop = this.activeStop();
    const day  = this.selectedDay();
    if (!stop || !day) return [];

    const city = WORLD_CITIES.find(c => c.id === stop.cityId);
    const attractions = city ? getAttractions(city) : [];

    const atts = this.attractionsForDay(stop.selectedAttractions, day)
      .filter((a: PlannedAttraction) => !!a.startTime);

    return atts.map((a: PlannedAttraction) => {
      const att      = attractions.find(x => x.id === a.attractionId) ?? null;
      const startMin = hmToMin(a.startTime!);
      const endMin   = a.endTime ? hmToMin(a.endTime) : startMin + 60;
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
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  private attractionsForDay(atts: PlannedAttraction[], dayKey: string): PlannedAttraction[] {
    return atts.filter((a: PlannedAttraction) =>
      !a.date || a.date.slice(0, 5) === dayKey,
    );
  }

  private scrollToFirstBlock(): void {
    const wrap = this.tlGridWrap?.nativeElement;
    if (!wrap) return;
    const bls = this.blocks();
    if (bls.length) {
      const firstTop = Math.min(...bls.map(b => b.top));
      wrap.scrollTop = Math.max(0, firstTop - 20);
    } else {
      wrap.scrollTop = TL_RH;
    }
  }
}
