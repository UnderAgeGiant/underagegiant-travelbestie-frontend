import { Component, inject, signal, computed, output } from '@angular/core';
import { TripService } from '../trip.service';
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

@Component({
  selector: 'app-stop-list',
  standalone: true,
  imports: [DurationPipe, DateRangeComponent, TransitConnectorComponent, LodgingComponent],
  styles: [`
    .att-plan-row {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 2px; border-radius: 8px;
      transition: background .12s;
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
  `],
  template: `
    <div class="left-panel">
      <div class="panel-head">
        <div class="panel-head-title">
          @if (activeTripName()) {
            {{ activeTripName() }}
          } @else {
            <ng-container i18n="@@stopList.title">Mi viaje ✈️</ng-container>
          }
        </div>
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
            type="departure" [cityLabel]="firstCityLabel()" />

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
                  <span class="stop-flag">{{ city.flag }}</span>
                  <div class="stop-info">
                    <div class="stop-name">{{ city.name }}</div>
                    <div class="stop-country">{{ city.country }}</div>
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

                @if (stop.selectedAttractions.length > 0) {
                  <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
                    <div style="font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--t3);margin-bottom:4px"
                         i18n="@@stopList.plannedLabel">Planificado</div>
                    @for (planned of stop.selectedAttractions; track planned.attractionId) {
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
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            }
          }

          <!-- Return flight connector -->
          <app-transit-connector fromId="__end__" toId="__end__"
            type="arrival" [cityLabel]="lastCityLabel()" />

        }
      </div>

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
  `,
})
export class StopListComponent {
  readonly trip       = inject(TripService);
  readonly savedPlans = inject(SavedPlansService);
  private readonly auth       = inject(AuthService);
  private readonly authModal  = inject(AuthModalService);
  private readonly karmaModal = inject(KarmaModalService);
  addDestination = output<void>();

  readonly firstCityLabel = computed(() => {
    const stops = this.trip.stops();
    if (!stops.length) return '';
    const c = WORLD_CITIES.find(city => city.id === stops[0].cityId);
    return c ? `${c.flag} ${c.name}` : '';
  });

  readonly lastCityLabel = computed(() => {
    const stops = this.trip.stops();
    if (!stops.length) return '';
    const c = WORLD_CITIES.find(city => city.id === stops[stops.length - 1].cityId);
    return c ? `${c.flag} ${c.name}` : '';
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
        next: () => { this.bookSaving.set(false); this.flashSaved(); },
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

  private toMins(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }
}
