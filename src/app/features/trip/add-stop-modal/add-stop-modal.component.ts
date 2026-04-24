import { Component, output, signal, inject } from '@angular/core';
import { CityComboboxComponent } from '../../../shared/city-combobox/city-combobox.component';
import { TripService } from '../trip.service';
import { City } from '../../../core/models/city.model';

@Component({
  selector: 'app-add-stop-modal',
  standalone: true,
  imports: [CityComboboxComponent],
  template: `
    <div class="modal-backdrop" (click)="$event.target === $event.currentTarget && close.emit()">
      <div class="modal" style="max-width:480px">
        <div class="modal-head" style="background:linear-gradient(135deg,var(--mint),var(--sky))">
          <div class="modal-title">Add a Destination ✈️</div>
          <div class="modal-sub">Search from 120+ cities worldwide</div>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">City</label>
            <app-city-combobox [excludeIds]="trip.existingCityIds()"
                               (cityChange)="selectedCity.set($event)" />
          </div>
          @if (selectedCity()) {
            <div style="display:flex;gap:10px">
              <div class="form-group" style="flex:1;margin-bottom:0">
                <label class="form-label">Check-in</label>
                <input type="date" class="form-input"
                       (change)="checkIn.set($any($event.target).value)" />
              </div>
              <div class="form-group" style="flex:1;margin-bottom:0">
                <label class="form-label">Check-out</label>
                <input type="date" class="form-input"
                       (change)="checkOut.set($any($event.target).value)" />
              </div>
            </div>
          }
        </div>
        <div class="modal-foot">
          <button class="btn-pill btn-outline" (click)="close.emit()" style="flex:1">Cancel</button>
          <button class="btn-pill btn-primary"
                  [disabled]="!selectedCity()"
                  [style.opacity]="selectedCity() ? 1 : 0.45"
                  (click)="add()"
                  style="flex:2">Add to Trip ✈️</button>
        </div>
      </div>
    </div>
  `,
})
export class AddStopModalComponent {
  readonly trip = inject(TripService);
  close = output<void>();

  selectedCity = signal<City | null>(null);
  checkIn = signal('');
  checkOut = signal('');

  add(): void {
    const city = this.selectedCity();
    if (!city) return;
    this.trip.addStop(city, this.checkIn(), this.checkOut());
    this.close.emit();
  }
}
