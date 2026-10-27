import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PlannedAttraction, TransitLeg, TripStop } from '../../core/models/trip.model';
import { Attraction } from '../../core/models/comment.model';
import { WORLD_CITIES } from '../../data/cities.data';
import { resolvePlannedAttraction } from '../../core/utils/personal-activity.util';
import { plannedDurationMinutes } from '../../core/utils/planned-duration.util';
import { parseDMY } from '../../core/utils/event-datetime.util';
import { formatDuration, formatSegment, legMinutes } from '../../core/utils/transit-format.util';
import { AttractionNamePipe } from '../pipes/attraction-name.pipe';
import { DurationPipe } from '../pipes/duration.pipe';
import { FlagIconComponent } from '../flag-icon/flag-icon.component';

interface PlanRow { planned: PlannedAttraction; att: Attraction; date: string; minutes: number }

/**
 * Read-only full plan of the trip being edited (2026-10-25). Same layout and `.itin*` classes as the
 * AI result step's itinerary, without its presentation pill, header, cost settings and actions.
 * The only interaction is a city name, which emits `citySelect` with that stop's id.
 */
@Component({
  selector: 'tb-trip-full-plan',
  imports: [AttractionNamePipe, DurationPipe, FlagIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tfp">
      @if (showTitle()) {
        <h2 class="tfp-title" i18n="@@editor.fullPlanTitle">Plan completo</h2>
      }
      <div class="itin">
        @let dep = legFor('__start__', '__start__');
        @if (dep) {
          <div class="itin-transit itin-edge-transit">
            <span class="itin-transit-tag" i18n="@@aiplan.departure">Salida 🏠</span>
            @for (seg of dep.segments; track $index; let sl = $last) {
              <span class="itin-seg">{{ fmtSeg(seg) }}</span>
              @if (!sl) { <span class="itin-chain">↓</span> }
            }
            @if (dep.segments.length > 1) {
              <span class="itin-transit-total">Total: {{ fmtDur(totalMins(dep)) }}</span>
            }
          </div>
          <div class="itin-line"></div>
        }

        @for (stop of stops(); track stop.stopId; let i = $index; let last = $last) {
          @let city = cityFor(stop.cityId);
          @if (city) {
            <div class="itin-city">
              <div class="itin-city-head">
                <span class="itin-city-flag"><app-flag-icon [flag]="city.flag" [alt]="city.name" [size]="24" /></span>
                <div>
                  <button type="button" class="itin-city-name tfp-city-link" (click)="citySelect.emit(stop.stopId)">{{ city.name }}</button>
                  <div class="itin-city-country">{{ city.country }}</div>
                  @if (stop.checkIn) {
                    <div class="itin-city-dates">{{ stop.checkIn }} → {{ stop.checkOut }}</div>
                  }
                </div>
              </div>

              @let rows = rowsFor(stop);
              @if (stop.lodging || rows.length > 0) {
                <div class="itin-items">
                  @if (stop.lodging) {
                    <div class="itin-item itin-item-lodging">
                      <span class="itin-item-icon">🏨</span>
                      <span class="itin-item-label">{{ stop.lodging.name }}</span>
                      @if (stop.lodging.url) {
                        <a class="itin-link" [href]="stop.lodging.url" target="_blank" rel="noopener noreferrer">🔗</a>
                      }
                    </div>
                  }
                  @for (row of rows; track row.planned.entryId) {
                    <div class="itin-item">
                      <span class="itin-item-icon">{{ row.att.icon }}</span>
                      <span class="itin-item-label">{{ row.att | attName }}</span>
                      <span class="itin-item-meta">
                        @if (row.date) { {{ shortDate(row.date) }} · }{{ row.planned.startTime }} · {{ row.minutes | duration }}
                      </span>
                    </div>
                  }
                </div>
              }
            </div>

            @if (!last) {
              @let nextStop = stops()[i + 1];
              @let leg = legFor(stop.cityId, nextStop.cityId);
              @let nextCity = cityFor(nextStop.cityId);
              <div class="itin-line"></div>
              <div class="itin-transit">
                @if (leg) {
                  @for (seg of leg.segments; track $index; let sl = $last) {
                    <span class="itin-seg">{{ fmtSeg(seg) }}</span>
                    @if (!sl) { <span class="itin-chain">↓</span> }
                  }
                  @if (leg.segments.length > 1) {
                    <span class="itin-transit-total">Total: {{ fmtDur(totalMins(leg)) }}</span>
                  }
                } @else {
                  <span class="itin-no-transit" i18n="@@aiplan.noTransit">Sin transporte definido</span>
                }
                @if (nextCity) {
                  <span class="itin-transit-dest">→ <app-flag-icon [flag]="nextCity.flag" [alt]="nextCity.name" [size]="16" /> {{ nextCity.name }}</span>
                }
              </div>
              <div class="itin-line"></div>
            } @else {
              @let ret = legFor('__end__', '__end__');
              @if (ret) {
                <div class="itin-line"></div>
                <div class="itin-transit itin-edge-transit">
                  <span class="itin-transit-tag" i18n="@@aiplan.return">Vuelta 🏠</span>
                  @for (seg of ret.segments; track $index; let sl = $last) {
                    <span class="itin-seg">{{ fmtSeg(seg) }}</span>
                    @if (!sl) { <span class="itin-chain">↓</span> }
                  }
                  @if (ret.segments.length > 1) {
                    <span class="itin-transit-total">Total: {{ fmtDur(totalMins(ret)) }}</span>
                  }
                </div>
              }
            }
          }
        }
      </div>
    </div>
  `,
})
export class TripFullPlanComponent {
  readonly stops     = input.required<TripStop[]>();
  readonly transits  = input.required<TransitLeg[]>();
  readonly showTitle = input(false);
  readonly citySelect = output<string>();

  private readonly legMap = computed(() => new Map(this.transits().map(t => [`${t.fromCityId}|${t.toCityId}`, t])));

  protected readonly fmtSeg = formatSegment;
  protected readonly fmtDur = formatDuration;
  protected readonly totalMins = legMinutes;

  protected legFor(from: string, to: string): TransitLeg | null {
    return this.legMap().get(`${from}|${to}`) ?? null;
  }

  protected cityFor(cityId: string) {
    return WORLD_CITIES.find(c => c.id === cityId) ?? null;
  }

  /** Resolved entries sorted by date (fallback check-in) then start time — same rule as StopListComponent.plannedSorted(). */
  protected rowsFor(stop: TripStop): PlanRow[] {
    const rows: PlanRow[] = [];
    for (const planned of stop.selectedAttractions) {
      const att = resolvePlannedAttraction(stop.cityId, planned);
      if (att) rows.push({ planned, att, date: planned.date || stop.checkIn, minutes: plannedDurationMinutes(planned, att) });
    }
    const ms = (r: PlanRow) => parseDMY(r.date)?.getTime() ?? 0;
    return rows.sort((a, b) => ms(a) - ms(b) || (a.planned.startTime ?? '').localeCompare(b.planned.startTime ?? ''));
  }

  protected shortDate(s: string): string {
    const p = s.split('/');
    return p.length >= 2 ? `${p[0]}/${p[1]}` : s;
  }
}
