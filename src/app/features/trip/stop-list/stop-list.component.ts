import { Component, inject, signal, computed, output } from '@angular/core';
import { TripService } from '../trip.service';
import { SavedPlansService } from '../../../core/saved-plans/saved-plans.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthModalService } from '../../../core/auth/auth-modal.service';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions } from '../../../data/attractions.data';
import { Attraction } from '../../../core/models/comment.model';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { DateRangeComponent } from '../../../shared/date-range/date-range.component';
import { TransitConnectorComponent } from './transit-connector.component';

@Component({
  selector: 'app-stop-list',
  standalone: true,
  imports: [DurationPipe, DateRangeComponent, TransitConnectorComponent],
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

          @for (stop of trip.stops(); track stop.cityId; let i = $index) {

            <!-- Transport connector between stops -->
            @if (i > 0) {
              @let prevStop = trip.stops()[i - 1];
              <app-transit-connector [fromId]="prevStop.cityId" [toId]="stop.cityId" />
            }

            @let city = cityFor(stop.cityId);
            @if (city) {
              <div [class]="'stop-item' + (trip.activeId() === stop.cityId ? ' active' : '')"
                   (click)="trip.setActive(stop.cityId)">
                <div class="stop-row">
                  <span class="stop-flag">{{ city.flag }}</span>
                  <div class="stop-info">
                    <div class="stop-name">{{ city.name }}</div>
                    <div class="stop-country">{{ city.country }}</div>
                  </div>
                  <button class="stop-del"
                          (click)="$event.stopPropagation(); trip.removeStop(stop.cityId)">×</button>
                </div>

                <div class="stop-dates" (click)="$event.stopPropagation()">
                  @if (editingDatesCityId() === stop.cityId) {
                    <div style="width:100%;padding-top:4px">
                      <app-date-range
                        [initialCheckIn]="editCheckIn()"
                        [initialCheckOut]="editCheckOut()"
                        (checkIn)="editCheckIn.set($event)"
                        (checkOut)="editCheckOut.set($event)" />
                      <div style="display:flex;gap:6px;margin-top:8px">
                        <button class="btn-pill btn-primary"
                                style="flex:1;justify-content:center;font-size:11px;padding:5px 8px"
                                (click)="commitDateEdit(stop.cityId)"
                                i18n="@@stopList.saveDatesBtn">✓ Guardar</button>
                        <button class="btn-pill btn-outline"
                                style="padding:5px 10px;font-size:11px"
                                (click)="editingDatesCityId.set(null)">✕</button>
                      </div>
                    </div>
                  } @else {
                    <div class="date-chip date-chip-edit"
                         title="Editar fechas"
                         (click)="openDateEdit(stop.cityId, stop.checkIn, stop.checkOut)">
                      <label i18n="@@stopList.checkInLabel">Llegada</label>{{ stop.checkIn || '—' }}
                    </div>
                    <div class="date-chip date-chip-edit"
                         title="Editar fechas"
                         (click)="openDateEdit(stop.cityId, stop.checkIn, stop.checkOut)">
                      <label i18n="@@stopList.checkOutLabel">Salida</label>{{ stop.checkOut || '—' }}
                    </div>
                  }
                </div>

                @if (stop.selectedAttractions.length > 0) {
                  <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
                    <div style="font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--t3);margin-bottom:4px"
                         i18n="@@stopList.plannedLabel">Planificado</div>
                    @for (planned of stop.selectedAttractions; track planned.attractionId) {
                      @let att = attractionFor(stop.cityId, planned.attractionId);
                      @if (att) {
                        <div class="att-plan-row" (click)="$event.stopPropagation()">
                          <span class="att-plan-icon">{{ att.icon }}</span>
                          <span class="att-plan-name">{{ att.name }}</span>
                          <span style="font-size:10px;color:var(--t3);white-space:nowrap;flex-shrink:0">
                            {{ planned.startTime }} · {{ att.estimatedMinutes | duration }}
                          </span>
                          <button class="att-plan-del"
                                  (click)="trip.removeAttraction(stop.cityId, planned.attractionId)"
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
                    (click)="doBook()"
                    i18n="@@stopList.bookBtn">Reservar viaje 🎉</button>
          } @else {
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">
              <input class="form-input"
                     [value]="bookName()"
                     (input)="bookName.set($any($event.target).value)"
                     i18n-placeholder="@@stopList.bookNamePlaceholder" placeholder="Nombre del viaje…"
                     (keydown.enter)="doBookSave()" />
              <div style="display:flex;gap:6px">
                <button class="btn-pill btn-primary" style="flex:1;justify-content:center"
                        (click)="doBookSave()"
                        i18n="@@stopList.bookSaveBtn">Guardar ✓</button>
                <button class="btn-pill btn-outline" style="padding:0 14px"
                        (click)="bookOpen.set(false)">✕</button>
              </div>
            </div>
          }
          @if (bookSaved()) {
            <div style="text-align:center;font-size:11px;color:oklch(42% 0.15 145);font-weight:700;margin-top:6px">
              ✓ <ng-container i18n="@@stopList.bookSavedMsg">Viaje guardado</ng-container>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class StopListComponent {
  readonly trip       = inject(TripService);
  readonly savedPlans = inject(SavedPlansService);
  private readonly auth      = inject(AuthService);
  private readonly authModal = inject(AuthModalService);
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

  bookOpen  = signal(false);
  bookName  = signal('');
  bookSaved = signal(false);

  editingDatesCityId = signal<string | null>(null);
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
      this.savedPlans.upsert(email, this.trip.loadedPlanId(), existingName, this.trip.stops(), this.trip.transits());
      this.flashSaved();
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
    const newId = this.savedPlans.upsert(email, this.trip.loadedPlanId(), name, this.trip.stops(), this.trip.transits());
    this.trip.markAsLoadedPlan(newId);
    this.bookOpen.set(false);
    this.bookName.set('');
    this.flashSaved();
  }

  private flashSaved(): void {
    this.bookSaved.set(true);
    setTimeout(() => this.bookSaved.set(false), 2500);
  }

  openDateEdit(cityId: string, checkIn: string, checkOut: string): void {
    this.editCheckIn.set(checkIn);
    this.editCheckOut.set(checkOut);
    this.editingDatesCityId.set(cityId);
  }

  commitDateEdit(cityId: string): void {
    if (!this.editCheckIn() || !this.editCheckOut()) return;
    this.trip.updateDates(cityId, this.editCheckIn(), this.editCheckOut());
    this.editingDatesCityId.set(null);
  }

  cityFor(cityId: string) {
    return WORLD_CITIES.find(c => c.id === cityId) ?? null;
  }

  attractionFor(cityId: string, attractionId: string): Attraction | null {
    const city = this.cityFor(cityId);
    if (!city) return null;
    return getAttractions(city).find(a => a.id === attractionId) ?? null;
  }
}
