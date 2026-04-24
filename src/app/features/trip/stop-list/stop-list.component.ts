import { Component, inject, output } from '@angular/core';
import { TripService } from '../trip.service';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions } from '../../../data/attractions.data';

@Component({
  selector: 'app-stop-list',
  standalone: true,
  template: `
    <div class="left-panel">
      <div class="panel-head">
        <div class="panel-head-title">My Trip ✈️</div>
        <div class="panel-head-sub">
          {{ trip.stops().length === 0
            ? 'Add your first destination'
            : trip.stops().length + ' stop' + (trip.stops().length > 1 ? 's' : '') + ' planned' }}
        </div>
      </div>

      <div class="panel-body">
        @if (trip.stops().length === 0) {
          <div style="padding:24px 8px;text-align:center">
            <div style="font-size:34px;margin-bottom:10px;animation:float 3s ease-in-out infinite">🗺️</div>
            <div style="font-size:12px;color:var(--t3);line-height:1.6">
              Search a city above<br/>or click <strong>+ Add Destination</strong>
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
                </div>
                <button class="stop-del"
                        (click)="$event.stopPropagation(); trip.removeStop(stop.cityId)">×</button>
              </div>
              @if (stop.checkIn || stop.checkOut) {
                <div class="stop-dates">
                  <div class="date-chip"><label>In</label>{{ stop.checkIn || '—' }}</div>
                  <div class="date-chip"><label>Out</label>{{ stop.checkOut || '—' }}</div>
                </div>
              }
            </div>
          }
        }
      </div>

      <div class="panel-footer">
        <button class="btn-pill btn-ghost" style="width:100%;justify-content:center"
                (click)="addDestination.emit()">+ Add Destination</button>
        @if (trip.stops().length > 0) {
          <button class="btn-pill btn-primary"
                  style="width:100%;justify-content:center;margin-top:8px">Book Trip 🎉</button>
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
