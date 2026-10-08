import { Component, input, output, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Attraction } from '../../../core/models/comment.model';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { DatePickerComponent } from '../../../shared/date-picker/date-picker.component';
import { TimePickerComponent } from '../../../shared/time-picker/time-picker.component';
import { AttractionNamePipe } from '../../../shared/pipes/attraction-name.pipe';
import { formatEventLong, isDateInRange } from '../../../core/utils/event-datetime.util';
import { isGoogleMapsUrl } from '../../../core/maps/maps-url-validate.util';

export interface ScheduleEntry {
  entryId:    string;
  attraction: Attraction;
  startTime:  string | null;
  date?:      string;
}

export interface PlanEntry {
  startTime: string;
  date:      string;
  // Feature 71 — personal activity fields, only emitted in personal mode
  title?:     string;
  mapsUrl?:   string;
  isPrivate?: boolean;
}

@Component({
    selector: 'app-plan-time-modal',
    imports: [DurationPipe, DatePickerComponent, TimePickerComponent, AttractionNamePipe],
    styles: [`
    .schedule-row {
      display: flex; align-items: center; gap: 10px;
      padding: 7px 4px; border-bottom: 1px solid var(--border);
      border-left: 3px solid transparent; border-radius: 0 4px 4px 0;
      transition: border-color .15s, background .15s;
    }
    .schedule-row:last-child { border-bottom: none; }
    .schedule-row.conflict {
      border-left-color: oklch(62% 0.18 25);
      background: oklch(98% 0.03 25);
    }
    .schedule-time {
      font-size: 12px; font-weight: 700; color: var(--lav-d);
      font-variant-numeric: tabular-nums; min-width: 40px;
    }
    .schedule-icon { font-size: 16px; flex-shrink: 0; }
    .schedule-name {
      flex: 1; font-size: 12px; color: var(--t1);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .schedule-dur { font-size: 11px; color: var(--t3); white-space: nowrap; }
    .conflict-badge { font-size: 12px; flex-shrink: 0; }
    .overlap-warn {
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; color: oklch(48% 0.16 25);
      margin-top: 6px; padding: 5px 9px;
      background: oklch(97% 0.03 25); border-radius: 8px;
      border: 1px solid oklch(88% 0.07 25);
    }
    .event-locked {
      padding: 10px 12px; border-radius: 12px;
      background: var(--butter); border: 1px solid var(--peach);
    }
    .event-locked-value {
      font-size: 15px; font-weight: 800; color: var(--peach-d);
      font-variant-numeric: tabular-nums;
    }
    .event-locked-note { font-size: 11px; color: var(--t3); margin-top: 4px; }
    .pa-fields { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    .pa-fields .form-label { margin-bottom: 0; }
    .pa-maps-error { font-size: 12px; color: var(--peach-d); }
    .pa-private { display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--t2); cursor: pointer; }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <div class="modal-backdrop" (click)="$event.target === $event.currentTarget ? cancel.emit() : null">
      <div class="modal" style="max-width:420px;overflow:visible">
        <div class="modal-head"
             style="background:linear-gradient(135deg,var(--butter),var(--peach));border-radius:22px 22px 0 0;overflow:hidden">
          <div class="modal-title" i18n="@@planModal.title">¿Cuándo y a qué hora? 📅</div>
          <div class="modal-sub">
            {{ attraction().icon }} {{ attraction() | attName }} ·
            {{ attraction().estimatedMinutes | duration }}
          </div>
        </div>

        <div class="modal-body">
          @if (personal()) {
            <div class="pa-fields">
              <label class="form-label" for="pa-title" i18n="@@personal.titleLabel">Nombre de la actividad</label>
              <input id="pa-title" class="form-input pa-title-input" type="text" maxlength="80" required
                     [value]="title()" (input)="title.set($any($event.target).value)" />
              <label class="form-label" for="pa-maps" i18n="@@personal.mapsLabel">Link de Google Maps (opcional)</label>
              <input id="pa-maps" class="form-input" type="url" maxlength="500" inputmode="url"
                     [value]="mapsUrl()" (input)="mapsUrl.set($any($event.target).value)"
                     i18n-placeholder="@@personal.mapsPlaceholder" placeholder="https://maps.app.goo.gl/…" />
              @if (mapsUrlInvalid()) {
                <div class="pa-maps-error" role="alert" i18n="@@personal.mapsError">Pega un link de Google Maps (https://maps.app.goo.gl/… o https://www.google.com/maps/…)</div>
              }
              <label class="pa-private">
                <input type="checkbox" [checked]="isPrivate()" (change)="isPrivate.set($any($event.target).checked)" />
                <span i18n="@@personal.privateLabel">🔒 Privada — no se muestra cuando compartes el plan</span>
              </label>
            </div>
          }
          <!-- Date + time: locked for fixed events, editable otherwise -->
          @if (isFixedEvent()) {
            <div class="event-locked" style="margin-bottom:12px">
              <div class="event-locked-value">{{ fixedLabel() }}</div>
              <div class="event-locked-note" i18n="@@planModal.eventFixedNote">
                🔒 La fecha y hora de este evento son fijas.
              </div>
            </div>
          } @else {
            <div style="display:flex;gap:10px;margin-bottom:12px">
              <div class="form-group" style="flex:1;margin-bottom:0">
                <label class="form-label" i18n="@@planModal.dateLabel">Fecha</label>
                <app-date-picker
                  [initialDate]="initialDate() || stopCheckIn()"
                  [minDate]="stopCheckIn()"
                  [maxDate]="stopCheckOut()"
                  (dateChange)="date.set($event)" />
              </div>
              <div class="form-group" style="flex:1;margin-bottom:0">
                <label class="form-label" i18n="@@planModal.timeLabel">Hora de inicio</label>
                <app-time-picker
                  [initialTime]="time()"
                  (timeChange)="time.set($event)" />
              </div>
            </div>
          }
          @if (outsideStopRange()) {
            <div class="overlap-warn" style="margin-bottom:12px">
              <span>⚠</span>
              <span i18n="@@planModal.eventOutsideRange">
                No estarás en {{ cityName() || 'esta ciudad' }} el {{ attraction().date }} del evento.
                Ajusta las fechas de tu parada para poder agregarlo.
              </span>
            </div>
          }
          @if (hasOverlap()) {
            <div class="overlap-warn" style="margin-bottom:12px">
              <span>⚠</span>
              <span i18n="@@planModal.overlapWarn">Se superpone con otra atracción planificada</span>
            </div>
          }

          <!-- Existing schedule for this city -->
          @if (schedule().length > 0) {
            <div>
              <div class="form-label" style="margin-bottom:8px" i18n="@@planModal.scheduleLabel">
                Ya planificado en esta ciudad
              </div>
              <div style="max-height:200px;overflow-y:auto">
                @for (entry of schedule(); track entry.entryId) {
                  <div [class]="'schedule-row' + (overlappingIds().has(entry.entryId) ? ' conflict' : '')">
                    @if (overlappingIds().has(entry.entryId)) {
                      <span class="conflict-badge">⚠</span>
                    }
                    <span class="schedule-time">{{ entry.date ? shortDate(entry.date) + ' ' : '' }}{{ entry.startTime }}</span>
                    <span class="schedule-icon">{{ entry.attraction.icon }}</span>
                    <span class="schedule-name">{{ entry.attraction | attName }}</span>
                    <span class="schedule-dur">{{ entry.attraction.estimatedMinutes | duration }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <div class="modal-foot"
             style="flex-direction:column;gap:8px;border-radius:0 0 22px 22px;overflow:hidden">
          <div style="display:flex;gap:8px;width:100%">
            <button class="btn-pill btn-outline" (click)="cancel.emit()" style="flex:1"
                    i18n="@@planModal.cancelBtn">Cancelar</button>
            <button class="btn-pill btn-primary" (click)="confirm()" style="flex:2"
                    [disabled]="!canConfirm()"
                    i18n="@@planModal.confirmBtn">Confirmar</button>
          </div>
          @if (isEditing()) {
            <button class="btn-pill"
                    style="width:100%;justify-content:center;color:var(--peach-d);border:1.5px solid var(--blush);background:#fff"
                    (click)="remove.emit()"
                    i18n="@@planModal.removeBtn">Quitar del plan</button>
          }
        </div>
      </div>
    </div>
  `
})
export class PlanTimeModalComponent implements OnInit {
  attraction      = input.required<Attraction>();
  initialTime     = input('');
  initialDate     = input('');
  stopCheckIn     = input('');
  stopCheckOut    = input('');
  existingPlanned = input<ScheduleEntry[]>([]);
  cityName        = input('');
  /** Feature 71 — set for a personal activity: shows title / Maps link / private fields. */
  personal        = input<{ title: string; mapsUrl: string; isPrivate: boolean } | null>(null);

  cancel    = output<void>();
  confirmed = output<PlanEntry>();
  remove    = output<void>();

  time = signal('09:00');
  date = signal('');
  title     = signal('');
  mapsUrl   = signal('');
  isPrivate = signal(false);

  readonly isEditing = computed(() => this.initialTime() !== '');

  readonly isFixedEvent = computed(() =>
    this.attraction().category === 'event_party' && !!this.attraction().date
  );

  readonly fixedLabel = computed(() =>
    formatEventLong(this.attraction().date, this.attraction().time)
  );

  readonly outsideStopRange = computed(() =>
    this.isFixedEvent()
    && !isDateInRange(this.attraction().date, this.stopCheckIn(), this.stopCheckOut())
  );

  readonly mapsUrlInvalid = computed(() =>
    !!this.personal() && !!this.mapsUrl().trim() && !isGoogleMapsUrl(this.mapsUrl().trim()));

  readonly canConfirm = computed(() =>
    !this.outsideStopRange() && (!this.personal() || (!!this.title().trim() && !this.mapsUrlInvalid())));

  readonly schedule = computed(() =>
    [...this.existingPlanned()].sort((a, b) =>
      (a.startTime ?? '').localeCompare(b.startTime ?? ''))
  );

  readonly overlappingIds = computed(() => {
    const currentStart = this.toMinutes(this.time());
    const currentEnd   = currentStart + this.attraction().estimatedMinutes;
    const currentDate  = this.date();
    const ids = new Set<string>();
    for (const entry of this.schedule()) {
      if (!entry.startTime) continue;
      const entryDate = entry.date ?? '';
      // Skip overlap check if both have explicit dates and they differ
      if (currentDate && entryDate && currentDate !== entryDate) continue;
      const entryStart = this.toMinutes(entry.startTime);
      const entryEnd   = entryStart + entry.attraction.estimatedMinutes;
      if (currentStart < entryEnd && entryStart < currentEnd) {
        ids.add(entry.entryId);
      }
    }
    return ids;
  });

  readonly hasOverlap = computed(() => this.overlappingIds().size > 0);

  ngOnInit() {
    const p = this.personal();
    if (p) { this.title.set(p.title); this.mapsUrl.set(p.mapsUrl); this.isPrivate.set(p.isPrivate); }
    if (this.isFixedEvent()) {
      this.date.set(this.attraction().date!);
      this.time.set(this.attraction().time ?? '');
      return;
    }
    if (this.initialTime()) {
      this.time.set(this.initialTime());
    } else {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      this.time.set(`${hh}:${mm}`);
    }
    this.date.set(this.initialDate() || this.stopCheckIn() || '');
  }

  confirm(): void {
    if (!this.canConfirm()) return;
    const p = this.personal();
    this.confirmed.emit(p
      ? { startTime: this.time(), date: this.date(), title: this.title().trim(), mapsUrl: this.mapsUrl().trim() || undefined, isPrivate: this.isPrivate() }
      : { startTime: this.time(), date: this.date() });
  }

  shortDate(s: string): string {
    const p = s.split('/');
    return p.length >= 2 ? `${p[0]}/${p[1]}` : s;
  }

  private toMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }
}
