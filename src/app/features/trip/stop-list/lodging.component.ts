import { Component, inject, signal, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { TripService } from '../trip.service';
import { Lodging } from '../../../core/models/trip.model';

@Component({
  selector: 'app-lodging',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="lodging-connector">
      @if (editOpen()) {
        <div class="lodging-form" (click)="$event.stopPropagation()">
          <input class="form-input"
                 style="font-size:11px;padding:5px 8px;width:100%;box-sizing:border-box"
                 [value]="lName()"
                 (input)="lName.set($any($event.target).value)"
                 i18n-placeholder="@@lodging.namePlaceholder"
                 placeholder="Hotel, Airbnb, hostal…"
                 (keydown.enter)="save()" />
          <input class="form-input"
                 style="font-size:11px;padding:5px 8px;margin-top:6px;width:100%;box-sizing:border-box"
                 [value]="lUrl()"
                 (input)="lUrl.set($any($event.target).value)"
                 i18n-placeholder="@@lodging.urlPlaceholder"
                 placeholder="Link de reserva (opcional)"
                 (keydown.enter)="save()" />
          <input class="form-input"
                 style="font-size:11px;padding:5px 8px;margin-top:6px;width:100%;box-sizing:border-box"
                 [value]="lAddress()"
                 (input)="lAddress.set($any($event.target).value)"
                 i18n-placeholder="@@lodging.addressPlaceholder"
                 placeholder="Dirección (opcional)"
                 (keydown.enter)="save()" />
          <input class="form-input"
                 style="font-size:11px;padding:5px 8px;margin-top:6px;width:100%;box-sizing:border-box"
                 [value]="lNotes()"
                 (input)="lNotes.set($any($event.target).value)"
                 i18n-placeholder="@@lodging.notesPlaceholder"
                 placeholder="Observaciones (opcional)"
                 (keydown.enter)="save()" />
          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="btn-pill btn-primary"
                    style="flex:1;justify-content:center;font-size:11px;padding:5px 8px"
                    [disabled]="!lName().trim()"
                    [style.opacity]="lName().trim() ? 1 : 0.45"
                    (click)="save()" type="button"
                    i18n="@@lodging.saveBtn">✓ Guardar</button>
            @if (lodging()) {
              <button class="btn-pill btn-outline"
                      style="padding:5px 10px;font-size:11px;color:var(--peach-d)"
                      (click)="clear()" type="button">🗑</button>
            }
            <button class="btn-pill btn-outline"
                    style="padding:5px 10px;font-size:11px"
                    (click)="editOpen.set(false)">✕</button>
          </div>
        </div>

      } @else if (lodging()) {
        <div class="lodging-badge" (click)="openEdit(); $event.stopPropagation()">
          <span class="lodging-icon">🏨</span>
          <span class="lodging-name">{{ lodging()!.name }}</span>
          @if (lodging()!.url) {
            <a class="lodging-link"
               [href]="lodging()!.url"
               target="_blank" rel="noopener noreferrer"
               (click)="$event.stopPropagation()"
               i18n-title="@@lodging.linkTitle" title="Abrir reserva">🔗</a>
          }
          <span class="lodging-edit-hint">✏️</span>
        </div>

      } @else {
        <div class="lodging-empty">
          <span class="lodging-add-label" (click)="openEdit(); $event.stopPropagation()"
                i18n="@@lodging.addBtn">🏨 + Alojamiento</span>
        </div>
      }
    </div>
  `,
})
export class LodgingComponent {
  readonly stopId = input('');

  private readonly trip = inject(TripService);

  readonly lodging = computed(() =>
    this.trip.stops().find(s => s.stopId === this.stopId())?.lodging ?? null
  );

  editOpen = signal(false);
  lName    = signal('');
  lUrl     = signal('');
  lAddress = signal('');
  lNotes   = signal('');

  openEdit(): void {
    const l = this.lodging();
    this.lName.set(l?.name ?? '');
    this.lUrl.set(l?.url ?? '');
    this.lAddress.set(l?.address ?? '');
    this.lNotes.set(l?.notes ?? '');
    this.editOpen.set(true);
  }

  save(): void {
    const name = this.lName().trim();
    if (!name) return;
    const url = this.lUrl().trim();
    const address = this.lAddress().trim();
    const notes = this.lNotes().trim();
    this.trip.setLodging(this.stopId(), {
      name, url,
      ...(address ? { address } : {}),
      ...(notes   ? { notes }   : {}),
    });
    this.editOpen.set(false);
  }

  clear(): void {
    this.trip.removeLodging(this.stopId());
    this.editOpen.set(false);
  }
}
