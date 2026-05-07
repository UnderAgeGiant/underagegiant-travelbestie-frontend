import { Component, output, signal, inject, computed } from '@angular/core';
import { CityComboboxComponent } from '../../../shared/city-combobox/city-combobox.component';
import { DateRangeComponent } from '../../../shared/date-range/date-range.component';
import { TripService } from '../trip.service';
import { City } from '../../../core/models/city.model';

@Component({
  selector: 'app-add-stop-modal',
  standalone: true,
  imports: [CityComboboxComponent, DateRangeComponent],
  template: `
    <div class="modal-backdrop" (click)="$event.target === $event.currentTarget && close.emit()">
      <div class="modal" style="max-width:560px;overflow:visible">
        <div class="modal-head" style="background:linear-gradient(135deg,var(--mint),var(--sky));border-radius:22px 22px 0 0;overflow:hidden">
          <div class="modal-title" i18n="@@addStop.title">Agregar destino ✈️</div>
          <div class="modal-sub" i18n="@@addStop.subtitle">Busca entre 120+ ciudades del mundo</div>
        </div>
        <div class="modal-body" style="min-height:320px">
          <div class="form-group">
            <label class="form-label" i18n="@@addStop.cityLabel">Ciudad</label>
            <app-city-combobox (cityChange)="selectedCity.set($event)" />
          </div>
          @if (selectedCity()) {
            <app-date-range
              (checkIn)="checkIn.set($event)"
              (checkOut)="checkOut.set($event)" />
          }
          @if (selectedCity() && (!checkIn() || !checkOut())) {
            <div style="font-size:11px;color:var(--peach-d);margin-top:8px"
                 i18n="@@addStop.datesRequired">Las fechas de entrada y salida son obligatorias.</div>
          }
          @if (consecutiveWarning()) {
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:oklch(48% 0.16 60);margin-top:8px;padding:6px 10px;background:oklch(97% 0.04 85);border-radius:8px;border:1px solid oklch(88% 0.08 85)">
              <span>⚠</span>
              <span i18n="@@addStop.consecutiveWarning">Esta ciudad ya está en el destino adyacente. ¿Seguro que querés agregarla de nuevo?</span>
            </div>
          }
        </div>
        <div class="modal-foot" style="border-radius:0 0 22px 22px;overflow:hidden">
          <button class="btn-pill btn-outline" (click)="close.emit()" style="flex:1" i18n="@@addStop.cancelBtn">Cancelar</button>
          <button class="btn-pill btn-primary"
                  [disabled]="!selectedCity() || !checkIn() || !checkOut()"
                  [style.opacity]="selectedCity() && checkIn() && checkOut() ? 1 : 0.45"
                  (click)="add()"
                  style="flex:2"
                  i18n="@@addStop.addBtn">Agregar al viaje ✈️</button>
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

  readonly consecutiveWarning = computed(() => {
    const city = this.selectedCity();
    const ci   = this.checkIn();
    if (!city || !ci) return false;
    const stops = this.trip.stops();
    if (stops.length === 0) return false;
    const parseMs = (s: string): number => {
      const [dd, mm, yyyy] = s.split('/').map(Number);
      return new Date(yyyy, mm - 1, dd).getTime();
    };
    const newMs = parseMs(ci);
    const sorted = [...stops].sort((a, b) => parseMs(a.checkIn) - parseMs(b.checkIn));
    let insertIdx = sorted.length;
    for (let i = 0; i < sorted.length; i++) {
      if (newMs < parseMs(sorted[i].checkIn)) { insertIdx = i; break; }
    }
    const before = sorted[insertIdx - 1];
    const after  = sorted[insertIdx];
    return before?.cityId === city.id || after?.cityId === city.id;
  });

  add(): void {
    const city = this.selectedCity();
    if (!city) return;
    this.trip.addStop(city, this.checkIn(), this.checkOut());
    this.close.emit();
  }
}
