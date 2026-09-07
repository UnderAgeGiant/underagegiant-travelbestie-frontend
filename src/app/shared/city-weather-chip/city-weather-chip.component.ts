import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { TripStop } from '../../core/models/trip.model';
import { WeatherService } from '../../core/weather/weather.service';
import { getWeatherCodeMeta } from '../../core/models/weather.model';
import { iterateDMYRange } from '../../core/utils/event-datetime.util';

/**
 * Extracted from StopListComponent (Feature 61 originally, moved here in the
 * 2026-09-07 UX-improvements round so SharedTripComponent's itin-city-head can
 * show the exact same chip + hover popover). Loads its own weather data —
 * WeatherService.load() de-dupes concurrent/repeat requests and caches via
 * ETag, so it's safe for multiple instances (or the pre-existing
 * DayTimelineComponent instance) to call it for the same city/range.
 */
@Component({
  selector: 'app-city-weather-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .city-weather-chip {
      display: inline-flex; align-items: center; gap: 3px;
      margin-left: 6px; font-size: 11px; font-weight: 600;
      color: var(--t3); vertical-align: middle; cursor: pointer;
      border-radius: 6px;
    }
    .city-weather-chip:focus-visible { outline: 2px solid var(--lav-d); outline-offset: 2px; }
    .city-weather-chip-historic .city-weather-icon { filter: grayscale(1); opacity: .75; }
    .city-weather-mark {
      font-size: 8px; font-weight: 700; color: var(--t3);
      background: var(--border); border-radius: 50%;
      width: 10px; height: 10px; display: inline-flex;
      align-items: center; justify-content: center; margin-left: 1px;
    }
    .city-weather-popover {
      position: fixed; z-index: 900;
      min-width: 170px; max-width: 220px; max-height: 280px;
      overflow-y: auto;
      background: #fff; border-radius: 12px; box-shadow: var(--sh-lg);
      padding: 6px; pointer-events: none;
      animation: fadeIn .15s ease;
    }
    .city-weather-popover-row { display: flex; align-items: center; gap: 6px; padding: 4px 4px; font-size: 11px; color: var(--t2); }
    .city-weather-popover-row-historic { opacity: .7; }
    .city-weather-popover-row-historic .city-weather-popover-icon { filter: grayscale(1); }
    .city-weather-popover-date { width: 32px; flex-shrink: 0; color: var(--t3); font-variant-numeric: tabular-nums; }
    .city-weather-popover-icon { flex-shrink: 0; }
    .city-weather-popover-temp { flex: 1; font-weight: 600; white-space: nowrap; }
    .city-weather-popover-tag { font-size: 9px; color: var(--t3); flex-shrink: 0; }
    .city-weather-popover-empty { font-size: 11px; color: var(--t3); padding: 6px 4px; }
  `],
  template: `
    @if (chip(); as w) {
      <span class="city-weather-chip" [class.city-weather-chip-historic]="w.historic"
            tabindex="0"
            (mouseenter)="onHover($event)" (mouseleave)="onHoverLeave()"
            (focus)="onHover($event)" (blur)="onHoverLeave()"
            (click)="onClick($event)">
        <span class="city-weather-icon">{{ w.icon }}</span> {{ w.tempMinC }}°/{{ w.tempMaxC }}°
        @if (w.historic) { <span class="city-weather-mark">?</span> }
      </span>
    }
    @if (open(); as pos) {
      <div class="city-weather-popover" role="tooltip" [style.left.px]="pos.x" [style.top.px]="pos.y">
        @for (d of previewDays(); track d.date) {
          <div class="city-weather-popover-row" [class.city-weather-popover-row-historic]="d.historic">
            <span class="city-weather-popover-date">{{ d.date.slice(0, 5) }}</span>
            <span class="city-weather-popover-icon">{{ d.icon }}</span>
            <span class="city-weather-popover-temp">{{ d.tempMinC }}°/{{ d.tempMaxC }}°</span>
            <span class="city-weather-popover-tag">{{ d.historic ? historicTag : forecastTag }}</span>
          </div>
        } @empty {
          <div class="city-weather-popover-empty">{{ loadingLabel }}</div>
        }
      </div>
    }
  `,
})
export class CityWeatherChipComponent {
  private readonly weather = inject(WeatherService);

  readonly stop = input.required<TripStop>();

  protected readonly forecastTag = $localize`:@@cityWeather.forecastTag:Pronóstico`;
  protected readonly historicTag = $localize`:@@cityWeather.historicTag:Estimado`;
  protected readonly loadingLabel = $localize`:@@cityWeather.loadingLabel:Cargando pronóstico…`;

  private lastSignature: string | null = null;

  constructor() {
    effect(() => {
      const s = this.stop();
      if (!s.checkIn || !s.checkOut) return;
      const signature = `${s.cityId}|${s.checkIn}|${s.checkOut}`;
      if (signature === this.lastSignature) return;
      this.lastSignature = signature;
      this.weather.load(s.cityId, s.checkIn, s.checkOut);
    });
  }

  protected readonly chip = computed(() => {
    this.weather.dayMap();
    const s = this.stop();
    if (!s.checkIn) return null;
    const w = this.weather.get(s.cityId, s.checkIn);
    if (!w || w.type === 'unavailable' || w.tempMinC === undefined || w.tempMaxC === undefined) return null;
    return {
      icon: getWeatherCodeMeta(w.weatherCode!).icon,
      tempMinC: Math.round(w.tempMinC),
      tempMaxC: Math.round(w.tempMaxC),
      historic: w.type === 'historic',
    };
  });

  protected readonly open = signal<{ x: number; y: number } | null>(null);
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly previewDays = computed(() => {
    if (!this.open()) return [];
    this.weather.dayMap();
    const s = this.stop();
    const days: Array<{ date: string; icon: string; tempMinC: number; tempMaxC: number; historic: boolean }> = [];
    for (const date of iterateDMYRange(s.checkIn, s.checkOut)) {
      const w = this.weather.get(s.cityId, date);
      if (!w || w.type === 'unavailable' || w.tempMinC === undefined || w.tempMaxC === undefined) continue;
      days.push({
        date,
        icon: getWeatherCodeMeta(w.weatherCode!).icon,
        tempMinC: Math.round(w.tempMinC),
        tempMaxC: Math.round(w.tempMaxC),
        historic: w.type === 'historic',
      });
    }
    return days;
  });

  protected onHover(e: MouseEvent | FocusEvent): void {
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => {
      const s = this.stop();
      const cardW = 200;
      const cardH = Math.min(300, 50 + iterateDMYRange(s.checkIn, s.checkOut).length * 26);
      let x: number;
      let y: number;
      if (e instanceof MouseEvent) {
        x = e.clientX + 14;
        y = e.clientY + 14;
      } else {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        x = rect.right + 10;
        y = rect.top;
      }
      if (x + cardW > window.innerWidth) x -= cardW + 28;
      y = Math.min(y, window.innerHeight - cardH);
      this.open.set({ x, y });
    }, 150);
  }

  protected onHoverLeave(): void {
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    this.hoverTimer = null;
    this.open.set(null);
  }

  protected onClick(e: MouseEvent): void {
    e.stopPropagation();
    if (!window.matchMedia('(hover: none)').matches) return;
    if (this.open()) { this.open.set(null); return; }
    const s = this.stop();
    const cardW = 200;
    const cardH = Math.min(300, 50 + iterateDMYRange(s.checkIn, s.checkOut).length * 26);
    const x = Math.max(12, Math.min(e.clientX - cardW / 2, window.innerWidth - cardW - 12));
    const y = Math.min(e.clientY + 16, window.innerHeight - cardH - 12);
    this.open.set({ x, y });
  }
}
