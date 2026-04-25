import { Component, inject, output } from '@angular/core';
import { TripService } from '../trip.service';
import { WORLD_CITIES } from '../../../data/cities.data';

@Component({
  selector: 'app-stop-list',
  standalone: true,
  template: `
    <div class="left-panel">
      <div class="panel-head">
        <div class="panel-head-title" i18n="@@stopList.title">Mi viaje ✈️</div>
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
        }
        @for (stop of trip.stops(); track stop.cityId; let i = $index) {
          @if (i > 0) { <div class="stop-connector"></div> }
          @let city = cityFor(stop.cityId);
          @if (city) {
            <div [class]="'stop-item' + (trip.activeId() === stop.cityId ? ' active' : '')"
                 (click)="trip.setActive(stop.cityId)">
              <div class="stop-row">
                <span class="stop-flag">{{ city.flag }}</span>
                <div class="stop-info">
                  <div class="stop-name">{{ city.name }}</div>
                  <div class="stop-country">{{ city.country }}</div>
                  @if (stop.selectedAttractions.length > 0) {
                    <div class="stop-comments">
                      📌 {{ stop.selectedAttractions.length }}
                      @if (stop.selectedAttractions.length === 1) {
                        <ng-container i18n="@@stopList.oneAttraction">atracción</ng-container>
                      } @else {
                        <ng-container i18n="@@stopList.manyAttractionsPlanned">atracciones planificadas</ng-container>
                      }
                    </div>
                  }
                </div>
                <button class="stop-del"
                        (click)="$event.stopPropagation(); trip.removeStop(stop.cityId)">×</button>
              </div>
              @if (stop.checkIn || stop.checkOut) {
                <div class="stop-dates">
                  <div class="date-chip"><label i18n="@@stopList.checkInLabel">Llegada</label>{{ stop.checkIn || '—' }}</div>
                  <div class="date-chip"><label i18n="@@stopList.checkOutLabel">Salida</label>{{ stop.checkOut || '—' }}</div>
                </div>
              }
            </div>
          }
        }
      </div>

      <div class="panel-footer">
        <button class="btn-pill btn-ghost" style="width:100%;justify-content:center"
                (click)="addDestination.emit()"
                i18n="@@stopList.addBtn">+ Agregar destino</button>
        @if (trip.stops().length > 0) {
          <button class="btn-pill btn-primary"
                  style="width:100%;justify-content:center;margin-top:8px"
                  i18n="@@stopList.bookBtn">Reservar viaje 🎉</button>
        }
      </div>
    </div>
  `,
})
export class StopListComponent {
  readonly trip = inject(TripService);
  addDestination = output<void>();

  cityFor(cityId: string) {
    return WORLD_CITIES.find(c => c.id === cityId) ?? null;
  }
}
