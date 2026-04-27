import { Component, inject, signal, computed, input } from '@angular/core';
import { TripService } from '../trip.service';
import { HomeAddressService } from '../../../core/home-address/home-address.service';
import { TransitMode, TransitSegment, TransitLeg } from '../../../core/models/trip.model';

export type TransitConnectorType = 'default' | 'departure' | 'arrival';

@Component({
  selector: 'app-transit-connector',
  standalone: true,
  template: `
    <div class="transit-connector" (click)="$event.stopPropagation()">
      @if (editOpen()) {
        <div class="transit-form">

          @for (seg of segs(); track $index) {
            <div class="transit-seg-row">
              <span class="transit-seg-icon">{{ icon(seg.mode) }}</span>
              <span class="transit-seg-info">
                <span>{{ label(seg.mode) }}</span>
                <span style="color:var(--t3)">{{ fmt(seg.durationMinutes) }}</span>
                @if (seg.notes) { <span style="color:var(--t3)">· {{ seg.notes }}</span> }
              </span>
              <button class="transit-seg-del" (click)="removeSeg($index)" type="button">×</button>
            </div>
          }

          @if (segs().length > 0) {
            <div class="transit-seg-divider" i18n="@@transit.addConnection">+ Agregar conexión</div>
          }

          <div class="transit-modes">
            @for (m of modes; track m.value) {
              <button class="transit-mode-btn" [class.active]="tMode() === m.value"
                      (click)="tMode.set(m.value)" type="button">
                <span>{{ m.icon }}</span><span>{{ m.label }}</span>
              </button>
            }
          </div>
          <div class="transit-duration-row">
            <span class="transit-dur-lbl" i18n="@@transit.durLabel">Duración:</span>
            <input type="number" min="0" max="99" class="transit-num-input"
                   [value]="tHours()"
                   (input)="tHours.set(+$any($event.target).value || 0)" />
            <span class="transit-dur-lbl">h</span>
            <input type="number" min="0" max="59" class="transit-num-input"
                   [value]="tMins()"
                   (input)="tMins.set(+$any($event.target).value || 0)" />
            <span class="transit-dur-lbl">min</span>
          </div>
          <div class="transit-duration-row" style="margin-top:6px">
            <span class="transit-dur-lbl">📅</span>
            <input type="text" class="transit-date-input"
                   [value]="tDate()"
                   (input)="tDate.set($any($event.target).value)"
                   i18n-placeholder="@@transit.datePlaceholder"
                   placeholder="dd/mm/aaaa" />
          </div>
          <input class="form-input"
                 style="font-size:11px;padding:5px 8px;margin-top:6px;width:100%;box-sizing:border-box"
                 [value]="tNotes()"
                 (input)="tNotes.set($any($event.target).value)"
                 i18n-placeholder="@@transit.notesPlaceholder"
                 placeholder="Nro. de vuelo, notas… (opcional)" />

          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="btn-pill btn-primary"
                    style="flex:1;justify-content:center;font-size:11px;padding:5px 8px"
                    [disabled]="segs().length === 0 && tHours() === 0 && tMins() === 0"
                    [style.opacity]="segs().length > 0 || tHours() > 0 || tMins() > 0 ? 1 : 0.45"
                    (click)="save()" type="button"
                    i18n="@@transit.saveBtn">✓ Guardar</button>
            @if (segs().length > 0) {
              <button class="btn-pill btn-outline"
                      style="padding:5px 10px;font-size:11px;white-space:nowrap"
                      [disabled]="tHours() === 0 && tMins() === 0"
                      [style.opacity]="tHours() > 0 || tMins() > 0 ? 1 : 0.45"
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
            @if (displayDate()) {
              <div class="transit-badge-date">📅 {{ displayDate() }}</div>
            }
            @for (seg of transit()!.segments; track $index; let last = $last) {
              <div class="transit-badge-seg">
                <span>{{ icon(seg.mode) }}</span>
                <span>{{ fmt(seg.durationMinutes) }}</span>
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
  `,
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

  /** Home city/address label, falling back to 🏠 emoji. */
  readonly homeLabel = computed(() => this.homeService.address() || '🏠');

  /** Date when this transport departs, derived from the adjacent stops. */
  readonly departureDate = computed((): string | null => {
    const from  = this.fromId();
    const stops = this.trip.stops();
    if (!stops.length) return null;
    if (from === '__start__') return stops[0].checkIn    || null;
    if (from === '__end__')   return stops[stops.length - 1].checkOut || null;
    return stops.find(s => s.cityId === from)?.checkOut ?? null;
  });

  /** Stored date wins; falls back to the auto-derived departure date. */
  readonly displayDate = computed(() =>
    this.transit()?.date || this.departureDate()
  );

  editOpen = signal(false);
  segs     = signal<TransitSegment[]>([]);
  tMode    = signal<TransitMode>('flight');
  tHours   = signal(0);
  tMins    = signal(0);
  tDate    = signal('');
  tNotes   = signal('');

  readonly modes: Array<{ value: TransitMode; icon: string; label: string }> = [
    { value: 'flight', icon: '✈️', label: 'Avión' },
    { value: 'train',  icon: '🚂', label: 'Tren'  },
    { value: 'boat',   icon: '🚢', label: 'Barco' },
    { value: 'bus',    icon: '🚌', label: 'Bus'   },
    { value: 'car',    icon: '🚗', label: 'Auto'  },
  ];

  openEdit(): void {
    const existing = this.transit();
    this.segs.set(existing ? [...existing.segments] : []);
    this.tMode.set('flight');
    this.tHours.set(0);
    this.tMins.set(0);
    this.tDate.set(existing?.date ?? this.departureDate() ?? '');
    this.tNotes.set('');
    this.editOpen.set(true);
  }

  addSeg(): void {
    const total = this.tHours() * 60 + this.tMins();
    if (total === 0) return;
    this.segs.update(s => [...s, { mode: this.tMode(), durationMinutes: total, notes: this.tNotes().trim() }]);
    this.tMode.set('flight'); this.tHours.set(0); this.tMins.set(0); this.tNotes.set('');
  }

  removeSeg(idx: number): void {
    this.segs.update(s => s.filter((_, i) => i !== idx));
  }

  save(): void {
    const total = this.tHours() * 60 + this.tMins();
    const pending: TransitSegment[] = total > 0
      ? [{ mode: this.tMode(), durationMinutes: total, notes: this.tNotes().trim() }]
      : [];
    const all = [...this.segs(), ...pending];
    if (all.length === 0) return;
    const date = this.tDate().trim() || undefined;
    this.trip.setTransit({ fromCityId: this.fromId(), toCityId: this.toId(), segments: all, date });
    this.editOpen.set(false);
  }

  clear(): void {
    this.trip.removeTransit(this.fromId(), this.toId());
    this.editOpen.set(false);
  }

  icon(mode: TransitMode): string  { return this.modes.find(m => m.value === mode)?.icon  ?? '🚀'; }
  label(mode: TransitMode): string { return this.modes.find(m => m.value === mode)?.label ?? mode; }

  fmt(mins: number): string {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    return h > 0 ? `${h}h` : `${m}m`;
  }

  totalDuration(leg: TransitLeg): number {
    return leg.segments.reduce((sum, s) => sum + s.durationMinutes, 0);
  }
}
