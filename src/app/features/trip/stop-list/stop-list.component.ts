import { Component, inject, signal, computed, effect, output, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { TripService } from '../trip.service';
import { DeviceService } from '../../../core/device/device.service';
import { SavedPlansService } from '../../../core/saved-plans/saved-plans.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthModalService } from '../../../core/auth/auth-modal.service';
import { KarmaModalService } from '../../../core/karma/karma-modal.service';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions } from '../../../data/attractions.data';
import { Attraction } from '../../../core/models/comment.model';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { DateRangeComponent } from '../../../shared/date-range/date-range.component';
import { TransitConnectorComponent } from './transit-connector.component';
import { LodgingComponent } from './lodging.component';
import { DayTimelineComponent } from '../../planning/day-timeline/day-timeline.component';
import { DestinationModalService } from '../../destination/destination-modal.service';
import { CitySuggestService } from '../../../core/ai/city-suggest.service';
import { CitySuggestCloudComponent } from './city-suggest-cloud.component';
import { FlagIconComponent } from '../../../shared/flag-icon/flag-icon.component';
import { parseDMY, iterateDMYRange } from '../../../core/utils/event-datetime.util';
import { TripStop, PlannedAttraction } from '../../../core/models/trip.model';
import { AutoSaveService } from '../../../core/saved-plans/auto-save.service';
import { TimePickerComponent } from '../../../shared/time-picker/time-picker.component';
import { WeatherService } from '../../../core/weather/weather.service';
import { getWeatherCodeMeta } from '../../../core/models/weather.model';
import { VisaRequirementService } from '../../../core/visa/visa-requirement.service';
import { getVisaRequirementMeta } from '../../../core/models/visa-requirement.model';
import { countryCodeFromFlagEmoji } from '../../../shared/flag-icon/flag-emoji.util';
import { City } from '../../../core/models/city.model';
import { TravelInfoService } from '../../../core/travel-info/travel-info.service';
import { formatCurrencyLabel, formatPlugLabel } from '../../../core/models/travel-info-badge.model';

@Component({
    selector: 'app-stop-list',
    imports: [DurationPipe, DateRangeComponent, TransitConnectorComponent, LodgingComponent, DayTimelineComponent, CitySuggestCloudComponent, FlagIconComponent, TimePickerComponent],
    styles: [`
    .att-plan-row {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 2px; border-radius: 8px;
      transition: background .12s;
      flex-wrap: wrap;
    }
    .att-plan-row:hover { background: oklch(0% 0 0/.04); }
    .att-plan-icon { font-size: 14px; flex-shrink: 0; }
    .att-plan-name {
      flex: 1; font-size: 11px; color: var(--t2);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .att-plan-del {
      width: 18px; height: 18px; border-radius: 50%;
      background: var(--blush); color: var(--peach-d);
      font-size: 11px; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity .15s; flex-shrink: 0; cursor: pointer;
    }
    .att-plan-row:hover .att-plan-del { opacity: 1; }
    .autosave-toggle {
      display: inline-flex; align-items: center; gap: 6px;
      margin-left: 8px; padding: 2px; border: none; background: transparent;
      cursor: pointer; vertical-align: middle;
    }
    .autosave-toggle-track {
      width: 30px; height: 16px; border-radius: 999px; flex-shrink: 0;
      background: oklch(55% 0.18 25); /* red = off */
      position: relative; transition: background .15s;
    }
    .autosave-toggle.on .autosave-toggle-track { background: oklch(62% 0.15 145); /* green = on */ }
    .autosave-toggle-thumb {
      position: absolute; top: 2px; left: 2px; width: 12px; height: 12px;
      border-radius: 50%; background: #fff; transition: left .15s;
    }
    .autosave-toggle.on .autosave-toggle-thumb { left: 16px; }
    .autosave-toggle-label { font-size: 10px; color: var(--t3); white-space: nowrap; }
    .autosave-countdown {
      margin-left: 6px; font-size: 10px; color: var(--t3);
      font-variant-numeric: tabular-nums; white-space: nowrap; vertical-align: middle;
    }
    .stop-weather-chip {
      display: inline-flex; align-items: center; gap: 3px;
      margin-left: 6px; font-size: 11px; font-weight: 600;
      color: var(--t3); vertical-align: middle; cursor: pointer;
      border-radius: 6px;
    }
    .stop-weather-chip:focus-visible { outline: 2px solid var(--lav-d); outline-offset: 2px; }
    .stop-weather-chip-historic .stop-weather-icon { filter: grayscale(1); opacity: .75; }
    .stop-weather-mark {
      font-size: 8px; font-weight: 700; color: var(--t3);
      background: var(--border); border-radius: 50%;
      width: 10px; height: 10px; display: inline-flex;
      align-items: center; justify-content: center; margin-left: 1px;
    }
    .stop-weather-popover {
      position: fixed; z-index: 900;
      min-width: 170px; max-width: 220px; max-height: 280px;
      overflow-y: auto;
      background: #fff; border-radius: 12px; box-shadow: var(--sh-lg);
      padding: 6px; pointer-events: none;
      animation: fadeIn .15s ease;
    }
    .stop-weather-popover-row {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 4px; font-size: 11px; color: var(--t2);
    }
    .stop-weather-popover-row-historic { opacity: .7; }
    .stop-weather-popover-row-historic .stop-weather-popover-icon { filter: grayscale(1); }
    .stop-weather-popover-date {
      width: 32px; flex-shrink: 0; color: var(--t3);
      font-variant-numeric: tabular-nums;
    }
    .stop-weather-popover-icon { flex-shrink: 0; }
    .stop-weather-popover-temp { flex: 1; font-weight: 600; white-space: nowrap; }
    .stop-weather-popover-tag { font-size: 9px; color: var(--t3); flex-shrink: 0; }
    .stop-weather-popover-empty { font-size: 11px; color: var(--t3); padding: 6px 4px; }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <div class="left-panel">
      <div class="panel-head">
        <div class="panel-head-title">
          @if (activeTripName()) {
            {{ activeTripName() }}
          } @else {
            <ng-container i18n="@@stopList.title">Mi viaje ✈️</ng-container>
          }
          @if (trip.loadedPlanId()) {
            <button type="button"
                    class="autosave-toggle"
                    [class.on]="autoSave.enabled()"
                    (click)="autoSave.toggle()"
                    [attr.aria-pressed]="autoSave.enabled()"
                    [attr.title]="autoSave.enabled() ? offTitle : onTitle">
              <span class="autosave-toggle-track"><span class="autosave-toggle-thumb"></span></span>
              <span class="autosave-toggle-label" i18n="@@stopList.autoSaveLabel">Auto-guardado</span>
            </button>
            @if (autoSave.secondsUntilNextTick() !== null) {
              <span class="autosave-countdown" [attr.title]="countdownTitle">⏱ {{ formatCountdown(autoSave.secondsUntilNextTick()!) }}</span>
            }
          }
        </div>
        @if (trip.loadedPlanOwner(); as owner) {
          <div style="font-size:11px;color:var(--t2);background:var(--lav);border-radius:8px;padding:4px 8px;margin:4px 0;display:inline-block">
            👤 <ng-container i18n="@@stopList.editingOwnerPlan">Editando el plan de {{ owner.name }} ({{ owner.email }})</ng-container>
          </div>
        }
        <div class="panel-head-sub">
          @if (trip.stops().length === 0) {
            <ng-container i18n="@@stopList.noStops">Agrega tu primer destino</ng-container>
          } @else if (trip.stops().length === 1) {
            1 <ng-container i18n="@@stopList.oneStopPlanned">destino planificado</ng-container>
          } @else {
            {{ trip.stops().length }} <ng-container i18n="@@stopList.manyStopsPlanned">destinos planificados</ng-container>
          }
        </div>
      </div>

      <div class="panel-body">
        @if (trip.stops().length === 0) {
          <div style="padding:24px 8px;text-align:center">
            <div style="font-size:34px;margin-bottom:10px;animation:float 3s ease-in-out infinite">🗺️</div>
            <div style="font-size:12px;color:var(--t3);line-height:1.6">
              <span i18n="@@stopList.emptyLine1">Busca una ciudad arriba</span><br/>
              <span i18n="@@stopList.emptyOr">o haz clic en</span> <strong i18n="@@stopList.emptyAddBtn">+ Agregar destino</strong>
            </div>
          </div>
        } @else {

          <!-- Departure flight connector -->
          <app-transit-connector fromId="__start__" toId="__start__"
            type="departure" [cityLabel]="firstCityLabel()" [cityFlag]="firstCityFlag()" />

          @for (stop of trip.stops(); track stop.stopId; let i = $index) {

            <!-- Transport connector between stops -->
            @if (i > 0) {
              @let prevStop = trip.stops()[i - 1];
              <app-transit-connector [fromId]="prevStop.cityId" [toId]="stop.cityId" />
            }

            @let city = cityFor(stop.cityId);
            @if (city) {
              <div [class]="'stop-item' + (trip.activeId() === stop.stopId ? ' active' : '')"
                   (click)="trip.setActive(stop.stopId)">
                <div class="stop-row">
                  <app-flag-icon class="stop-flag" [flag]="city.flag" [alt]="city.name" [size]="22" />
                  <div class="stop-info">
                    <div class="stop-name">
                      {{ city.name }}
                      @if (stopWeatherChips()[stop.stopId ?? '']; as w) {
                        <span class="stop-weather-chip" [class.stop-weather-chip-historic]="w.historic"
                              tabindex="0"
                              (mouseenter)="onWeatherChipHover($event, stop)"
                              (mouseleave)="onWeatherChipHoverLeave()"
                              (focus)="onWeatherChipHover($event, stop)"
                              (blur)="onWeatherChipHoverLeave()"
                              (click)="onWeatherChipClick($event, stop)">
                          <span class="stop-weather-icon">{{ w.icon }}</span> {{ w.tempMinC }}°/{{ w.tempMaxC }}°
                          @if (w.historic) { <span class="stop-weather-mark">?</span> }
                        </span>
                      }
                    </div>
                    <div class="stop-country">{{ city.country }}</div>
                    @if (visaBadge(city); as visa) {
                      <div class="stop-visa-badge" [class.stop-visa-cta]="visa.cta"
                           (click)="visa.cta ? onVisaCtaClick($event) : null">
                        <span>{{ visa.icon }}</span> {{ visa.label }}
                      </div>
                    }
                    @if (currencyBadge(city); as currency) {
                      <div class="stop-currency-badge">
                        <span>{{ currency.icon }}</span> {{ currency.label }}
                      </div>
                    }
                    @if (plugBadge(city); as plug) {
                      <div class="stop-plug-badge">
                        <span>{{ plug.icon }}</span> {{ plug.label }}
                      </div>
                    }
                  </div>
                  <button class="stop-del"
                          (click)="$event.stopPropagation(); trip.removeStop(stop.stopId)">×</button>
                </div>

                <div class="stop-dates" (click)="$event.stopPropagation()">
                  @if (editingDatesStopId() === stop.stopId) {
                    <div style="width:100%;padding-top:4px">
                      <app-date-range
                        [initialCheckIn]="editCheckIn()"
                        [initialCheckOut]="editCheckOut()"
                        (checkIn)="editCheckIn.set($event)"
                        (checkOut)="editCheckOut.set($event)" />
                      <div style="display:flex;gap:6px;margin-top:8px">
                        <button class="btn-pill btn-primary"
                                style="flex:1;justify-content:center;font-size:11px;padding:5px 8px"
                                (click)="commitDateEdit(stop.stopId)"
                                i18n="@@stopList.saveDatesBtn">✓ Guardar</button>
                        <button class="btn-pill btn-outline"
                                style="padding:5px 10px;font-size:11px"
                                (click)="editingDatesStopId.set(null)">✕</button>
                      </div>
                    </div>
                  } @else {
                    <div class="date-chip date-chip-edit"
                         title="Editar fechas"
                         (click)="openDateEdit(stop.stopId, stop.checkIn, stop.checkOut)">
                      <label i18n="@@stopList.checkInLabel">Llegada</label>{{ stop.checkIn || '—' }}
                    </div>
                    <div class="date-chip date-chip-edit"
                         title="Editar fechas"
                         (click)="openDateEdit(stop.stopId, stop.checkIn, stop.checkOut)">
                      <label i18n="@@stopList.checkOutLabel">Salida</label>{{ stop.checkOut || '—' }}
                    </div>
                  }
                </div>

                <app-lodging [stopId]="stop.stopId" />

                <div class="stop-pill-row">
                  <button type="button" class="stop-itinerary-pill"
                          [class.active]="itineraryOpenStopId() === stop.stopId"
                          (click)="$event.stopPropagation(); toggleItinerary(stop.stopId)"
                          i18n="@@stopList.viewItinerary">📅 Ver itinerario de la ciudad</button>
                  <button type="button" class="stop-itinerary-pill stop-ai-suggest-pill"
                          (click)="$event.stopPropagation(); suggestForCity(stop)"
                          i18n="@@stopList.aiSuggestBtn">🐾 Sugiere qué hacer en esta ciudad
                    <span class="karma-cost">−2 ✨ karma</span>
                  </button>
                  @if (device.isMobile()) {
                    <button type="button" class="stop-itinerary-pill stop-add-attraction-pill"
                            (click)="$event.stopPropagation(); openAddAttraction(stop.stopId)"
                            i18n="@@stopList.addAttractionBtn">➕ Agregar atracción</button>
                  }
                </div>

                @if (citySuggest.openForStopId() === stop.stopId) {
                  <app-city-suggest-cloud
                    [cityId]="stop.cityId"
                    [suggestions]="citySuggest.suggestions()"
                    [loading]="citySuggest.loading()"
                    [error]="citySuggest.error()"
                    (dismiss)="citySuggest.close()"
                    (addAll)="citySuggest.addAll(stop.stopId, stop.cityId, $event)"
                    (searchMore)="citySuggest.searchMore(stop)" />
                }

                @if (itineraryOpenStopId() === stop.stopId) {
                  <tb-day-timeline [stop]="stop" [inline]="true" />
                }

                @if (stop.selectedAttractions.length > 0) {
                  <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
                    <button type="button"
                            style="display:flex;align-items:center;gap:6px;width:100%;background:none;border:none;cursor:pointer;padding:0"
                            (click)="$event.stopPropagation(); toggleScheduled(stop.stopId)">
                      <span style="font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--t3)">
                        <ng-container i18n="@@stopList.plannedLabel">Planificado</ng-container>
                        ({{ stop.selectedAttractions.length }})
                      </span>
                      <span style="margin-left:auto;font-size:10px;color:var(--t3)">{{ isScheduledOpen(stop.stopId) ? '▴' : '▾' }}</span>
                    </button>

                    @if (isScheduledOpen(stop.stopId)) {
                      @for (planned of plannedSorted(stop); track planned.entryId) {
                        @let att = attractionFor(stop.cityId, planned.attractionId);
                        @if (att) {
                          @let collision = hasTimeCollision(stop, planned.entryId);
                          <div class="att-plan-row" [class.att-collision]="collision"
                               (click)="$event.stopPropagation()">
                            <span class="att-plan-icon">{{ att.icon }}</span>
                            <span class="att-plan-name">{{ att.name }}</span>
                            <span style="font-size:10px;color:var(--t3);white-space:nowrap;flex-shrink:0">
                              @let d = planned.date || stop.checkIn;
                              @if (d) { {{ shortDate(d) }} · }{{ planned.startTime }} · {{ att.estimatedMinutes | duration }}
                            </span>
                            @if (collision) {
                              <span title="Conflicto de horario" style="font-size:11px;flex-shrink:0">⚠️</span>
                            }
                            <button class="att-plan-del"
                                    (click)="trip.removeAttraction(stop.stopId, planned.entryId)"
                                    i18n-title="@@stopList.removeAttTitle"
                                    title="Quitar del plan">×</button>
                            <!-- Inline time inputs for timeline — app-time-picker (flatpickr,
                                 time_24hr) rather than a native <input type="time">, whose
                                 12h/24h display otherwise follows the browser/OS locale and
                                 can't be forced to 24h on every browser (notably Firefox). -->
                            <div class="att-time-inputs">
                              <app-time-picker class="att-time-input"
                                     [initialTime]="planned.startTime ?? ''"
                                     (timeChange)="onAttractionTimeChange(stop.stopId, planned.entryId, 'startTime', $event, att.estimatedMinutes)" />
                              <span class="att-time-sep">–</span>
                              <app-time-picker class="att-time-input"
                                     [initialTime]="planned.endTime || endTimeFor(planned.startTime, att.estimatedMinutes)"
                                     (timeChange)="onAttractionTimeChange(stop.stopId, planned.entryId, 'endTime', $event)" />
                            </div>
                          </div>
                        }
                      }
                    }
                  </div>
                }
              </div>
            }
          }

          <!-- Return flight connector -->
          <app-transit-connector fromId="__end__" toId="__end__"
            type="arrival" [cityLabel]="lastCityLabel()" [cityFlag]="lastCityFlag()" />

        }
      </div>

      @if (activeWeatherPreview(); as p) {
        <div class="stop-weather-popover" role="tooltip"
             [style.left.px]="p.x" [style.top.px]="p.y">
          @for (d of activeWeatherDays(); track d.date) {
            <div class="stop-weather-popover-row" [class.stop-weather-popover-row-historic]="d.historic">
              <span class="stop-weather-popover-date">{{ d.date.slice(0, 5) }}</span>
              <span class="stop-weather-popover-icon">{{ d.icon }}</span>
              <span class="stop-weather-popover-temp">{{ d.tempMinC }}°/{{ d.tempMaxC }}°</span>
              <span class="stop-weather-popover-tag">{{ d.historic ? weatherHistoricTag : weatherForecastTag }}</span>
            </div>
          } @empty {
            <div class="stop-weather-popover-empty">{{ weatherLoadingLabel }}</div>
          }
        </div>
      }

      <div class="panel-footer">
        <button class="btn-pill btn-ghost" style="width:100%;justify-content:center"
                (click)="addDestination.emit()"
                i18n="@@stopList.addBtn">+ Agregar destino</button>
        @if (trip.stops().length > 0) {
          @if (!bookOpen()) {
            <button class="btn-pill btn-primary"
                    style="width:100%;justify-content:center;margin-top:8px"
                    [disabled]="bookSaving()"
                    (click)="doBook()"
                    i18n="@@stopList.bookBtn">Guardar viaje 🎉
              @if (!trip.loadedPlanId()) {
                <span class="karma-cost">−1 ✨ karma</span>
              }
            </button>
          } @else {
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">
              <input class="form-input"
                     [value]="bookName()"
                     (input)="bookName.set($any($event.target).value)"
                     i18n-placeholder="@@stopList.bookNamePlaceholder" placeholder="Nombre del viaje…"
                     (keydown.enter)="doBookSave()" />
              <div style="display:flex;gap:6px">
                <button class="btn-pill btn-primary" style="flex:1;justify-content:center"
                        [disabled]="bookSaving()"
                        (click)="doBookSave()"
                        i18n="@@stopList.bookSaveBtn">Guardar ✓ <span class="karma-cost">−1 ✨ karma</span></button>
                <button class="btn-pill btn-outline" style="padding:0 14px"
                        [disabled]="bookSaving()"
                        (click)="bookOpen.set(false)">✕</button>
              </div>
            </div>
          }
          @if (bookError()) {
            <div style="font-size:11px;color:oklch(48% 0.16 50);margin-top:4px;text-align:center">
              ⭐ {{ bookError() }}
            </div>
          }
        }

        @if (device.isMobile() && showScrollTop() && trip.stops().length > 0) {
          <button class="scroll-top-fab" (click)="scrollToActiveCity()" type="button"
                  i18n-aria-label="@@plan.scrollToTop" aria-label="Ir arriba">↑</button>
        }

        <!-- Saving popup -->
        @if (bookSaving()) {
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:oklch(100% 0 0/.7);border-radius:inherit;z-index:10;backdrop-filter:blur(2px)">
            <div style="background:white;border-radius:16px;padding:20px 28px;display:flex;flex-direction:column;align-items:center;gap:10px;box-shadow:0 4px 24px oklch(0% 0 0/.12)">
              <div style="width:32px;height:32px;border:3px solid var(--peach-d);border-top-color:transparent;border-radius:50%;animation:spin 0.7s linear infinite"></div>
              <span style="font-size:13px;font-weight:600;color:var(--t1)" i18n="@@stopList.savingMsg">Guardando…</span>
            </div>
          </div>
        }

        <!-- Success popup -->
        @if (bookSaved()) {
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:oklch(100% 0 0/.7);border-radius:inherit;z-index:10;backdrop-filter:blur(2px);pointer-events:none">
            <div style="background:white;border-radius:16px;padding:20px 28px;display:flex;flex-direction:column;align-items:center;gap:10px;box-shadow:0 4px 24px oklch(0% 0 0/.12);animation:pop-in .2s ease">
              <div style="width:40px;height:40px;border-radius:50%;background:oklch(88% 0.15 145);display:flex;align-items:center;justify-content:center;font-size:20px">✓</div>
              <span style="font-size:13px;font-weight:600;color:oklch(42% 0.15 145)" i18n="@@stopList.bookSavedMsg">Viaje guardado</span>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class StopListComponent {
  readonly trip       = inject(TripService);
  readonly savedPlans = inject(SavedPlansService);
  private readonly auth       = inject(AuthService);
  private readonly authModal  = inject(AuthModalService);
  private readonly karmaModal = inject(KarmaModalService);
  protected readonly device   = inject(DeviceService);
  private readonly destModal  = inject(DestinationModalService);
  protected readonly citySuggest = inject(CitySuggestService);
  protected readonly autoSave = inject(AutoSaveService);
  private readonly weather = inject(WeatherService);
  private readonly visaRequirement = inject(VisaRequirementService);
  private readonly travelInfo = inject(TravelInfoService);
  addDestination = output<void>();
  openProfile = output<void>();

  protected readonly onTitle  = $localize`:@@stopList.autoSaveToggleOnTitle:Guardado automático activado — clic para desactivar`;
  protected readonly offTitle = $localize`:@@stopList.autoSaveToggleOffTitle:Guardado automático desactivado — clic para activar`;
  protected readonly countdownTitle = $localize`:@@stopList.autoSaveCountdownTitle:Tiempo restante hasta el próximo intento de guardado automático`;
  protected readonly weatherForecastTag = $localize`:@@stopList.weatherForecastTag:Pronóstico`;
  protected readonly weatherHistoricTag = $localize`:@@stopList.weatherHistoricTag:Estimado`;
  protected readonly weatherLoadingLabel = $localize`:@@stopList.weatherLoadingLabel:Cargando pronóstico…`;
  readonly setCountryCta = $localize`:@@stopList.setCountryCta:Agrega tu país de residencia para ver info de visa`;

  visaBadge(city: City): { cta: boolean; icon: string; label: string } | null {
    if (!this.auth.isLoggedIn()) return null;
    const home = this.auth.currentUser()?.countryOfResidence;
    if (!home) return { cta: true, icon: '🛂', label: this.setCountryCta };
    const destCode = countryCodeFromFlagEmoji(city.flag);
    if (!destCode) return null;
    const result = this.visaRequirement.requirement(home, destCode);
    if (!result) return null;
    const meta = getVisaRequirementMeta(result.category, result.days);
    return { cta: false, icon: meta.icon, label: meta.label };
  }

  onVisaCtaClick(event: MouseEvent): void {
    event.stopPropagation();
    this.openProfile.emit();
  }

  currencyBadge(city: City): { icon: string; label: string } | null {
    const destCode = countryCodeFromFlagEmoji(city.flag);
    if (!destCode) return null;
    const currency = this.travelInfo.currencyInfo(destCode);
    if (!currency) return null;
    return { icon: '🪙', label: formatCurrencyLabel(currency.name, currency.symbol) };
  }

  plugBadge(city: City): { icon: string; label: string } | null {
    const destCode = countryCodeFromFlagEmoji(city.flag);
    if (!destCode) return null;
    const home = this.auth.isLoggedIn() ? this.auth.currentUser()?.countryOfResidence : null;
    const plug = this.travelInfo.plugInfo(destCode, home);
    if (!plug) return null;
    const icon = plug.adapterNeeded === true ? '🔌⚠️' : '🔌';
    return { icon, label: formatPlugLabel(plug.plugTypes, plug.voltages, plug.adapterNeeded) };
  }

  protected formatCountdown(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  private lastWeatherSignature: string | null = null;

  constructor() {
    this.autoSave.start();

    // Loads weather for every stop's first day (checkIn) so the city card can show a
    // min/max temperature chip next to the name. Only re-derives when the set of
    // (cityId, checkIn, checkOut) tuples actually changes, same discipline as
    // DayTimelineComponent's own weather-trigger effect — WeatherService.load() is
    // safe to call from multiple sites (it de-dupes concurrent/repeat requests via
    // its own in-flight guard + ETag/304 caching), so this doesn't duplicate network
    // traffic against tb-day-timeline's trip-wide instance doing the same thing.
    effect(() => {
      const stops = this.trip.stops();
      const signature = stops
        .filter(s => s.checkIn && s.checkOut)
        .map(s => `${s.cityId}|${s.checkIn}|${s.checkOut}`)
        .join(',');
      if (signature === this.lastWeatherSignature) return;
      this.lastWeatherSignature = signature;

      for (const stop of stops) {
        if (!stop.checkIn || !stop.checkOut) continue;
        this.weather.load(stop.cityId, stop.checkIn, stop.checkOut);
      }
    });
  }

  // Keyed by stopId. Only the stop's first day (checkIn) is shown on the city card —
  // a single min/max temperature summary, not the full day-by-day breakdown
  // tb-day-timeline renders per day-tab.
  protected readonly stopWeatherChips = computed(() => {
    this.weather.dayMap(); // establish the reactive dependency
    const map: Record<string, { icon: string; tempMinC: number; tempMaxC: number; historic: boolean } | null> = {};
    for (const stop of this.trip.stops()) {
      const key = stop.stopId ?? '';
      if (!key || !stop.checkIn) { continue; }
      const w = this.weather.get(stop.cityId, stop.checkIn);
      map[key] = (w && w.type !== 'unavailable' && w.tempMinC !== undefined && w.tempMaxC !== undefined)
        ? {
            icon: getWeatherCodeMeta(w.weatherCode!).icon,
            tempMinC: Math.round(w.tempMinC),
            tempMaxC: Math.round(w.tempMaxC),
            historic: w.type === 'historic',
          }
        : null;
    }
    return map;
  });

  // ── Weather popover: hover/focus/click on a stop's weather chip shows every day
  // in that stop's range (icon + min/max temp + forecast/historic tag), not just the
  // first-day summary the chip itself shows. Same hover-delay/viewport-flip/touch-click
  // pattern as SharedTripComponent's onAttHover/onAttClick for the attraction preview
  // popover — see that component if this pattern needs to change in both places.
  protected readonly activeWeatherPreview = signal<{ stop: TripStop; x: number; y: number } | null>(null);
  private weatherHoverTimer: ReturnType<typeof setTimeout> | null = null;

  protected onWeatherChipHover(e: MouseEvent | FocusEvent, stop: TripStop): void {
    if (this.weatherHoverTimer) clearTimeout(this.weatherHoverTimer);
    this.weatherHoverTimer = setTimeout(() => {
      const cardW = 200;
      const cardH = Math.min(300, 50 + iterateDMYRange(stop.checkIn, stop.checkOut).length * 26);
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
      this.activeWeatherPreview.set({ stop, x, y });
    }, 150);
  }

  protected onWeatherChipHoverLeave(): void {
    if (this.weatherHoverTimer) clearTimeout(this.weatherHoverTimer);
    this.weatherHoverTimer = null;
    this.activeWeatherPreview.set(null);
  }

  protected onWeatherChipClick(e: MouseEvent, stop: TripStop): void {
    e.stopPropagation();
    if (!window.matchMedia('(hover: none)').matches) return; // desktop/hover-capable: hover already handles it
    if (this.activeWeatherPreview()?.stop === stop) {
      this.activeWeatherPreview.set(null);
      return;
    }
    const cardW = 200;
    const cardH = Math.min(300, 50 + iterateDMYRange(stop.checkIn, stop.checkOut).length * 26);
    const x = Math.max(12, Math.min(e.clientX - cardW / 2, window.innerWidth - cardW - 12));
    const y = Math.min(e.clientY + 16, window.innerHeight - cardH - 12);
    this.activeWeatherPreview.set({ stop, x, y });
  }

  protected readonly activeWeatherDays = computed(() => {
    const preview = this.activeWeatherPreview();
    if (!preview) return [];
    this.weather.dayMap(); // establish the reactive dependency
    const days: Array<{ date: string; icon: string; tempMinC: number; tempMaxC: number; historic: boolean }> = [];
    for (const date of iterateDMYRange(preview.stop.checkIn, preview.stop.checkOut)) {
      const w = this.weather.get(preview.stop.cityId, date);
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

  protected readonly showScrollTop = signal(false);

  // Which stop's inline city timeline is currently open (null = none).
  protected readonly itineraryOpenStopId = signal<string | null>(null);

  protected toggleItinerary(stopId: string): void {
    this.trip.setActive(stopId);
    this.itineraryOpenStopId.update(cur => (cur === stopId ? null : stopId));
  }

  openAddAttraction(stopId: string): void {
    this.trip.setActive(stopId);
    this.destModal.open();
  }

  suggestForCity(stop: import('../../../core/models/trip.model').TripStop): void {
    if (!this.auth.isLoggedIn()) {
      this.authModal.openLogin(() => this.citySuggest.request(stop));
      return;
    }
    this.citySuggest.request(stop);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showScrollTop.set(window.scrollY > 240);
  }

  protected scrollToActiveCity(): void {
    const el = document.querySelector('.stop-item.active');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected readonly expandedStops = signal<Set<string>>(new Set());

  protected toggleScheduled(stopId: string): void {
    this.expandedStops.update(set => {
      const next = new Set(set);
      next.has(stopId) ? next.delete(stopId) : next.add(stopId);
      return next;
    });
  }

  protected isScheduledOpen(stopId: string): boolean {
    return this.expandedStops().has(stopId);
  }

  readonly firstCityLabel = computed(() => {
    const stops = this.trip.stops();
    if (!stops.length) return '';
    const c = WORLD_CITIES.find(city => city.id === stops[0].cityId);
    return c ? c.name : '';
  });

  readonly firstCityFlag = computed(() => {
    const stops = this.trip.stops();
    if (!stops.length) return '';
    const c = WORLD_CITIES.find(city => city.id === stops[0].cityId);
    return c?.flag ?? '';
  });

  readonly lastCityLabel = computed(() => {
    const stops = this.trip.stops();
    if (!stops.length) return '';
    const c = WORLD_CITIES.find(city => city.id === stops[stops.length - 1].cityId);
    return c ? c.name : '';
  });

  readonly lastCityFlag = computed(() => {
    const stops = this.trip.stops();
    if (!stops.length) return '';
    const c = WORLD_CITIES.find(city => city.id === stops[stops.length - 1].cityId);
    return c?.flag ?? '';
  });

  readonly activeTripName = computed(() => {
    const id = this.trip.loadedPlanId();
    if (!id) return null;
    return this.savedPlans.plans().find(p => p.id === id)?.name ?? null;
  });

  bookOpen   = signal(false);
  bookName   = signal('');
  bookSaved  = signal(false);
  bookSaving = signal(false);
  bookError  = signal('');

  editingDatesStopId = signal<string | null>(null);
  editCheckIn        = signal('');
  editCheckOut       = signal('');

  doBook(): void {
    if (!this.auth.isLoggedIn()) {
      this.authModal.openLogin(() => this.doBook());
      return;
    }
    const existingName = this.activeTripName();
    if (this.trip.loadedPlanId() && existingName) {
      const email = this.auth.currentUser()?.email;
      if (!email) return;
      this.bookSaving.set(true);
      this.savedPlans.upsert(email, this.trip.loadedPlanId(), existingName, this.trip.stops(), this.trip.transits()).subscribe({
        next: () => { this.bookSaving.set(false); this.autoSave.commitSnapshot(this.trip.loadedPlanId()!); this.flashSaved(); },
        error: () => { this.bookSaving.set(false); },
      });
    } else {
      this.bookName.set('');
      this.bookOpen.set(true);
    }
  }

  doBookSave(): void {
    const name = this.bookName().trim();
    if (!name) return;
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.bookError.set('');
    this.bookSaving.set(true);
    // Always null: the form only shows when activeTripName() was null, meaning the stale
    // loadedPlanId doesn't resolve to a known plan — passing it would PUT a ghost trip and fail silently.
    this.savedPlans.upsert(email, null, name, this.trip.stops(), this.trip.transits()).subscribe({
      next: newId => {
        this.bookSaving.set(false);
        this.trip.markAsLoadedPlan(newId);
        this.autoSave.commitSnapshot(newId);
        this.bookOpen.set(false);
        this.bookName.set('');
        this.flashSaved();
      },
      error: err => {
        this.bookSaving.set(false);
        if (this.karmaModal.handleKarmaError(err)) {
          this.bookOpen.set(false);
        }
      },
    });
  }

  private flashSaved(): void {
    this.bookSaved.set(true);
    setTimeout(() => this.bookSaved.set(false), 2500);
  }

  openDateEdit(stopId: string, checkIn: string, checkOut: string): void {
    this.editCheckIn.set(checkIn);
    this.editCheckOut.set(checkOut);
    this.editingDatesStopId.set(stopId);
  }

  commitDateEdit(stopId: string): void {
    if (!this.editCheckIn() || !this.editCheckOut()) return;
    this.trip.updateDates(stopId, this.editCheckIn(), this.editCheckOut());
    this.editingDatesStopId.set(null);
  }

  cityFor(cityId: string) {
    return WORLD_CITIES.find(c => c.id === cityId) ?? null;
  }

  attractionFor(cityId: string, attractionId: string): Attraction | null {
    const city = this.cityFor(cityId);
    if (!city) return null;
    return getAttractions(city).find(a => a.id === attractionId) ?? null;
  }

  shortDate(s: string): string {
    const p = s.split('/');
    return p.length >= 2 ? `${p[0]}/${p[1]}` : s;
  }

  // Planned attractions are stored in add order — the panel should read as a
  // timeline, so sort by date (falling back to the stop's check-in, same as
  // the row's own date label) then by start time.
  plannedSorted(stop: TripStop): PlannedAttraction[] {
    const dateMs = (p: PlannedAttraction) => parseDMY(p.date || stop.checkIn)?.getTime() ?? 0;
    return [...stop.selectedAttractions].sort((a, b) =>
      dateMs(a) - dateMs(b) || (a.startTime ?? '').localeCompare(b.startTime ?? ''));
  }

  onAttractionTimeChange(stopId: string, entryId: string, field: 'startTime' | 'endTime', time: string, estimatedMinutes?: number): void {
    this.trip.patchAttractionTime(stopId, entryId, field, time || null, estimatedMinutes);
  }

  hasTimeCollision(stop: import('../../../core/models/trip.model').TripStop, targetEntryId: string): boolean {
    const target = stop.selectedAttractions.find(a => a.entryId === targetEntryId);
    if (!target?.startTime) return false;
    const tAtt  = this.attractionFor(stop.cityId, target.attractionId);
    if (!tAtt) return false;
    const tStart = this.toMins(target.startTime);
    const tEnd   = tStart + tAtt.estimatedMinutes;
    const tDate  = target.date ?? '';
    return stop.selectedAttractions.some(other => {
      if (other.entryId === targetEntryId || !other.startTime) return false;
      const oDate = other.date ?? '';
      if (tDate && oDate && tDate !== oDate) return false;
      const oAtt = this.attractionFor(stop.cityId, other.attractionId);
      if (!oAtt) return false;
      const oStart = this.toMins(other.startTime);
      const oEnd   = oStart + oAtt.estimatedMinutes;
      return tStart < oEnd && tEnd > oStart;
    });
  }

  endTimeFor(startTime: string | null, estimatedMinutes: number): string {
    if (!startTime) return '';
    const total = this.toMins(startTime) + estimatedMinutes;
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private toMins(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }
}
