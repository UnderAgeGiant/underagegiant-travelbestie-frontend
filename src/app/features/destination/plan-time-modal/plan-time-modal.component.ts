import { Component, input, output, signal, computed, OnInit } from '@angular/core';
import { Attraction } from '../../../core/models/comment.model';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';

export interface ScheduleEntry {
  attraction: Attraction;
  startTime: string;
}

@Component({
  selector: 'app-plan-time-modal',
  standalone: true,
  imports: [DurationPipe],
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
  `],
  template: `
    <div class="modal-backdrop" (click)="$event.target === $event.currentTarget && cancel.emit()">
      <div class="modal" style="max-width:420px;overflow:visible">
        <div class="modal-head"
             style="background:linear-gradient(135deg,var(--butter),var(--peach));border-radius:22px 22px 0 0;overflow:hidden">
          <div class="modal-title" i18n="@@planModal.title">¿A qué hora? ⏰</div>
          <div class="modal-sub">
            {{ attraction().icon }} {{ attraction().name }} ·
            {{ attraction().estimatedMinutes | duration }}
          </div>
        </div>

        <div class="modal-body">
          <!-- Time picker -->
          <div class="form-group" [style.margin-bottom]="schedule().length ? '16px' : '0'">
            <label class="form-label" i18n="@@planModal.timeLabel">Hora de inicio</label>
            <input type="time" class="form-input"
                   [value]="time()"
                   (change)="time.set($any($event.target).value)" />
            @if (hasOverlap()) {
              <div class="overlap-warn">
                <span>⚠</span>
                <span i18n="@@planModal.overlapWarn">Se superpone con otra atracción planificada</span>
              </div>
            }
          </div>

          <!-- Existing schedule for this city -->
          @if (schedule().length > 0) {
            <div>
              <div class="form-label" style="margin-bottom:8px" i18n="@@planModal.scheduleLabel">
                Ya planificado en esta ciudad
              </div>
              <div style="max-height:200px;overflow-y:auto">
                @for (entry of schedule(); track entry.attraction.id) {
                  <div [class]="'schedule-row' + (overlappingIds().has(entry.attraction.id) ? ' conflict' : '')">
                    @if (overlappingIds().has(entry.attraction.id)) {
                      <span class="conflict-badge">⚠</span>
                    }
                    <span class="schedule-time">{{ entry.startTime }}</span>
                    <span class="schedule-icon">{{ entry.attraction.icon }}</span>
                    <span class="schedule-name">{{ entry.attraction.name }}</span>
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
  `,
})
export class PlanTimeModalComponent implements OnInit {
  attraction  = input.required<Attraction>();
  initialTime = input('');
  existingPlanned = input<ScheduleEntry[]>([]);

  cancel    = output<void>();
  confirmed = output<string>();
  remove    = output<void>();

  time = signal('09:00');

  readonly isEditing = computed(() => this.initialTime() !== '');

  readonly schedule = computed(() =>
    [...this.existingPlanned()].sort((a, b) => a.startTime.localeCompare(b.startTime))
  );

  readonly overlappingIds = computed(() => {
    const currentStart = this.toMinutes(this.time());
    const currentEnd = currentStart + this.attraction().estimatedMinutes;
    const ids = new Set<string>();
    for (const entry of this.schedule()) {
      const entryStart = this.toMinutes(entry.startTime);
      const entryEnd = entryStart + entry.attraction.estimatedMinutes;
      if (currentStart < entryEnd && entryStart < currentEnd) {
        ids.add(entry.attraction.id);
      }
    }
    return ids;
  });

  readonly hasOverlap = computed(() => this.overlappingIds().size > 0);

  ngOnInit() {
    if (this.initialTime()) this.time.set(this.initialTime());
  }

  confirm(): void { this.confirmed.emit(this.time()); }

  private toMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }
}
