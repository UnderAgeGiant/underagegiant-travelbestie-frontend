import { Component, inject, signal, computed, input } from '@angular/core';
import { TripService } from '../trip.service';
import { HomeAddressService } from '../../../core/home-address/home-address.service';
import { DatePickerComponent } from '../../../shared/date-picker/date-picker.component';
import { TransitMode, TransitSegment, TransitLeg } from '../../../core/models/trip.model';

export type TransitConnectorType = 'default' | 'departure' | 'arrival';

@Component({
    selector: 'app-transit-connector',
    imports: [DatePickerComponent],
    template: `
    <div class="transit-connector" (click)="$event.stopPropagation()">
      @if (editOpen()) {
        <div class="transit-form">

          <!-- Already-added segments -->
          @for (seg of segs(); track $index) {
            <div class="transit-seg-row">
              <span class="transit-seg-icon">{{ icon(seg.mode) }}</span>
              <span class="transit-seg-info">
                <span>{{ label(seg.mode) }}</span>
                @if (seg.departureDate && seg.arrivalDate) {
                  <span style="color:var(--t3)">
                    {{ seg.departureDate }} {{ seg.departureTime }}
                    → {{ seg.arrivalDate !== seg.departureDate ? seg.arrivalDate + ' ' : '' }}{{ seg.arrivalTime }}
                    ({{ fmt(computeMins(seg)) }})
                  </span>
                } @else if ((seg.durationMinutes ?? 0) > 0) {
                  <span style="color:var(--t3)">{{ fmt(seg.durationMinutes!) }}</span>
                }
                @if (seg.notes) { <span style="color:var(--t3)">· {{ seg.notes }}</span> }
              </span>
              <button class="transit-seg-del" (click)="removeSeg($index)" type="button">×</button>
            </div>
          }

          @if (segs().length > 0) {
            <div class="transit-seg-divider" i18n="@@transit.addConnection">+ Agregar conexión</div>
          }

          <!-- Mode -->
          <div class="transit-modes">
            @for (m of modes; track m.value) {
              <button class="transit-mode-btn" [class.active]="tMode() === m.value"
                      (click)="tMode.set(m.value)" type="button">
                <span>{{ m.icon }}</span><span>{{ m.label }}</span>
              </button>
            }
          </div>

          <!-- Departure -->
          <div class="transit-datetime-section">
            <div class="transit-datetime-lbl" i18n="@@transit.depLabel">Salida</div>
            <div class="transit-datetime-row">
              <div class="transit-field-col" style="flex:1">
                <div class="transit-datetime-lbl" i18n="@@transit.dateLabel">Fecha</div>
                <app-date-picker
                  [initialDate]="tDepDate()"
                  (dateChange)="onDepDateChange($event)" />
              </div>
              <div class="transit-field-col">
                <div class="transit-datetime-lbl" i18n="@@transit.timeLabel">Hora</div>
                <input type="time" class="transit-time-input"
                       [value]="tDepTime()"
                       (change)="tDepTime.set($any($event.target).value)" />
              </div>
            </div>
          </div>

          <!-- Arrival -->
          <div class="transit-datetime-section">
            <div class="transit-datetime-lbl" i18n="@@transit.arrLabel">Llegada</div>
            <div class="transit-datetime-row">
              <div class="transit-field-col" style="flex:1">
                <div class="transit-datetime-lbl" i18n="@@transit.dateLabel">Fecha</div>
                <app-date-picker
                  [initialDate]="tArrDate()"
                  [minDate]="tDepDate()"
                  (dateChange)="tArrDate.set($event)" />
              </div>
              <div class="transit-field-col">
                <div class="transit-datetime-lbl" i18n="@@transit.timeLabel">Hora</div>
                <input type="time" class="transit-time-input"
                       [value]="tArrTime()"
                       [min]="tArrDate() === tDepDate() ? tDepTime() : ''"
                       (change)="tArrTime.set($any($event.target).value)" />
              </div>
            </div>
          </div>

          <!-- Arrival-before-departure warning -->
          @if (arrivalBeforeDep()) {
            <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:oklch(48% 0.16 25);margin-top:4px;padding:5px 9px;background:oklch(97% 0.03 25);border-radius:8px;border:1px solid oklch(88% 0.07 25)"
                 i18n="@@transit.arrBeforeDepWarn">
              ⚠ La llegada no puede ser antes que la salida.
            </div>
          }

          <!-- Computed duration hint -->
          @if (pendingDuration() > 0) {
            <div class="transit-duration-hint">⏱ {{ fmt(pendingDuration()) }}</div>
          }

          <!-- Notes -->
          <input class="form-input"
                 style="font-size:11px;padding:5px 8px;margin-top:2px;width:100%;box-sizing:border-box"
                 [value]="tNotes()"
                 (input)="tNotes.set($any($event.target).value)"
                 i18n-placeholder="@@transit.notesPlaceholder"
                 placeholder="Nro. de vuelo, notas… (opcional)" />

          <!-- Actions -->
          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="btn-pill btn-primary"
                    style="flex:1;justify-content:center;font-size:11px;padding:5px 8px"
                    [disabled]="!canSave()"
                    [style.opacity]="canSave() ? 1 : 0.45"
                    (click)="save()" type="button"
                    i18n="@@transit.saveBtn">✓ Guardar</button>
            @if (segs().length > 0) {
              <button class="btn-pill btn-outline"
                      style="padding:5px 10px;font-size:11px;white-space:nowrap"
                      [disabled]="!canAddSeg()"
                      [style.opacity]="canAddSeg() ? 1 : 0.45"
                      (click)="addSeg()" type="button"
                      i18n="@@transit.addSegBtn">+ Tramo</button>
            }
            @if (transit()) {
              <button class="btn-pill btn-outline"
                      style="padding:5px 10px;font-size:11px;color:var(--peach-d)"
                      (click)="clear()" type="button">🗑</button>
            }
            <button class="btn-pill btn-outline"
                    style="padding:5px 10px;font-size:11px"
                    (click)="editOpen.set(false)">✕</button>
          </div>
        </div>

      } @else if (transit()) {
        <div class="transit-badge" (click)="openEdit()">
          @if (type() === 'departure') {
            <div class="transit-edge-ctx">{{ homeLabel() }} ✈️ {{ cityLabel() }}</div>
          } @else if (type() === 'arrival') {
            <div class="transit-edge-ctx">{{ cityLabel() }} ✈️ {{ homeLabel() }}</div>
          }
          <div class="transit-badge-body">
            @for (seg of transit()!.segments; track $index; let last = $last) {
              <div class="transit-badge-seg">
                <span>{{ icon(seg.mode) }}</span>
                @if (seg.departureDate && seg.arrivalDate) {
                  <span class="transit-badge-dt">
                    {{ seg.departureDate }} {{ seg.departureTime }}
                    → {{ seg.arrivalDate !== seg.departureDate ? seg.arrivalDate + ' ' : '' }}{{ seg.arrivalTime }}
                  </span>
                  <span class="transit-badge-dur">({{ fmt(computeMins(seg)) }})</span>
                } @else if ((seg.durationMinutes ?? 0) > 0) {
                  <span>{{ fmt(seg.durationMinutes!) }}</span>
                }
                @if (seg.notes) { <span class="transit-badge-notes">· {{ seg.notes }}</span> }
              </div>
              @if (!last) { <div class="transit-seg-arrow">↓</div> }
            }
            @if (transit()!.segments.length > 1) {
              <div class="transit-badge-total">Total: {{ fmt(totalDuration(transit()!)) }}</div>
            }
          </div>
          <span class="transit-edit-hint">✏️</span>
        </div>

      } @else {
        <div class="transit-empty" (click)="openEdit()">
          <div class="transit-line"></div>
          @if (type() === 'departure') {
            <span class="transit-add-label transit-edge-label">
              {{ homeLabel() }} ✈️ {{ cityLabel() || '+ Vuelo de ida' }}
            </span>
          } @else if (type() === 'arrival') {
            <span class="transit-add-label transit-edge-label">
              {{ cityLabel() || '+ Vuelo de vuelta' }} ✈️ {{ homeLabel() }}
            </span>
          } @else {
            <span class="transit-add-label" i18n="@@transit.addBtn">+ Transporte</span>
          }
          <div class="transit-line"></div>
        </div>
      }
    </div>
  `
})
export class TransitConnectorComponent {
  readonly fromId    = input('');
  readonly toId      = input('');
  readonly type      = input<TransitConnectorType>('default');
  readonly cityLabel = input('');

  private readonly trip        = inject(TripService);
  private readonly homeService = inject(HomeAddressService);

  readonly transit = computed(() =>
    this.trip.transitMap().get(`${this.fromId()}|${this.toId()}`) ?? null
  );

  readonly homeLabel = computed(() => this.homeService.address() || '🏠');

  readonly departureDate = computed((): string | null => {
    const from  = this.fromId();
    const stops = this.trip.stops();
    if (!stops.length) return null;
    if (from === '__start__') return stops[0].checkIn    || null;
    if (from === '__end__')   return stops[stops.length - 1].checkOut || null;
    return stops.find(s => s.cityId === from)?.checkOut ?? null;
  });

  editOpen  = signal(false);
  segs      = signal<TransitSegment[]>([]);
  tMode     = signal<TransitMode>('flight');
  tDepDate  = signal('');
  tDepTime  = signal('');
  tArrDate  = signal('');
  tArrTime  = signal('');
  tNotes    = signal('');

  readonly arrivalBeforeDep = computed(() => {
    const dd = this.tDepDate(), dt = this.tDepTime();
    const ad = this.tArrDate(), at = this.tArrTime();
    if (!dd || !dt || !ad || !at) return false;
    const parse = (d: string, t: string) => {
      const [day, mo, yr] = d.split('/').map(Number);
      const [hh, mi]      = t.split(':').map(Number);
      return new Date(yr, mo - 1, day, hh ?? 0, mi ?? 0).getTime();
    };
    return parse(ad, at) <= parse(dd, dt);
  });

  readonly canAddSeg = computed(() =>
    !!(this.tDepDate() && this.tDepTime() && this.tArrDate() && this.tArrTime()) &&
    !this.arrivalBeforeDep()
  );

  readonly canSave = computed(() => this.segs().length > 0 || this.canAddSeg());

  readonly pendingDuration = computed(() => {
    if (!this.canAddSeg()) return 0;
    return this.computeMins({
      departureDate: this.tDepDate(), departureTime: this.tDepTime(),
      arrivalDate:   this.tArrDate(), arrivalTime:   this.tArrTime(),
    });
  });

  readonly modes: Array<{ value: TransitMode; icon: string; label: string }> = [
    { value: 'flight', icon: '✈️', label: 'Avión' },
    { value: 'train',  icon: '🚂', label: 'Tren'  },
    { value: 'boat',   icon: '🚢', label: 'Barco' },
    { value: 'bus',    icon: '🚌', label: 'Bus'   },
    { value: 'car',    icon: '🚗', label: 'Auto'  },
  ];

  openEdit(): void {
    if (this.type() === 'default') {
      this.trip.selectTransit(`${this.fromId()}_${this.toId()}`);
    }
    const existing     = this.transit();
    const existingSegs = existing ? [...existing.segments] : [];
    this.segs.set(existingSegs);
    this.tMode.set('flight');
    this.tNotes.set('');
    const autoDate = this.departureDate() ?? '';
    const lastSeg  = existingSegs[existingSegs.length - 1];
    // For new transit: seed departure from auto-derived date
    // For existing:    seed departure from last segment's arrival (chaining)
    this.tDepDate.set(lastSeg?.arrivalDate || autoDate);
    this.tDepTime.set(lastSeg?.arrivalTime || '');
    this.tArrDate.set(lastSeg?.arrivalDate || autoDate);
    this.tArrTime.set('');
    this.editOpen.set(true);
  }

  onDepDateChange(date: string): void {
    this.tDepDate.set(date);
    if (!this.tArrDate()) this.tArrDate.set(date);
  }

  addSeg(): void {
    if (!this.canAddSeg()) return;
    this.segs.update(s => [...s, {
      mode:          this.tMode(),
      departureDate: this.tDepDate(),
      departureTime: this.tDepTime(),
      arrivalDate:   this.tArrDate(),
      arrivalTime:   this.tArrTime(),
      notes:         this.tNotes().trim(),
    }]);
    const nextDep = { date: this.tArrDate(), time: this.tArrTime() };
    this.tMode.set('flight');
    this.tDepDate.set(nextDep.date);
    this.tDepTime.set(nextDep.time);
    this.tArrDate.set(nextDep.date);
    this.tArrTime.set('');
    this.tNotes.set('');
  }

  removeSeg(idx: number): void {
    this.segs.update(s => s.filter((_, i) => i !== idx));
  }

  save(): void {
    const pending: TransitSegment[] = this.canAddSeg()
      ? [{ mode: this.tMode(), departureDate: this.tDepDate(), departureTime: this.tDepTime(), arrivalDate: this.tArrDate(), arrivalTime: this.tArrTime(), notes: this.tNotes().trim() }]
      : [];
    const all = [...this.segs(), ...pending];
    if (!all.length) return;
    this.trip.setTransit({ fromCityId: this.fromId(), toCityId: this.toId(), segments: all });
    this.editOpen.set(false);
  }

  clear(): void {
    this.trip.removeTransit(this.fromId(), this.toId());
    this.editOpen.set(false);
  }

  computeMins(seg: Pick<TransitSegment, 'departureDate' | 'departureTime' | 'arrivalDate' | 'arrivalTime' | 'durationMinutes'>): number {
    if (seg.departureDate && seg.departureTime && seg.arrivalDate && seg.arrivalTime) {
      const parse = (d: string, t: string) => {
        const [dd, mm, yyyy] = d.split('/').map(Number);
        const [hh, mi]       = t.split(':').map(Number);
        return new Date(yyyy, mm - 1, dd, hh ?? 0, mi ?? 0).getTime();
      };
      return Math.max(0, Math.round(
        (parse(seg.arrivalDate, seg.arrivalTime) - parse(seg.departureDate, seg.departureTime)) / 60000
      ));
    }
    return seg.durationMinutes ?? 0;
  }

  icon(mode: TransitMode): string  { return this.modes.find(m => m.value === mode)?.icon  ?? '🚀'; }
  label(mode: TransitMode): string { return this.modes.find(m => m.value === mode)?.label ?? mode; }

  fmt(mins: number): string {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    return h > 0 ? `${h}h` : `${m}m`;
  }

  totalDuration(leg: TransitLeg): number {
    return leg.segments.reduce((sum, s) => sum + this.computeMins(s), 0);
  }
}
