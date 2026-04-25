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
      padding: 7px 0; border-bottom: 1px solid var(--border);
    }
    .schedule-row:last-child { border-bottom: none; }
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
          </div>

          <!-- Existing schedule for this city -->
          @if (schedule().length > 0) {
            <div>
              <div class="form-label" style="margin-bottom:8px" i18n="@@planModal.scheduleLabel">
                Ya planificado en esta ciudad
              </div>
              <div style="max-height:200px;overflow-y:auto">
                @for (entry of schedule(); track entry.attraction.id) {
                  <div class="schedule-row">
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

  ngOnInit() {
    if (this.initialTime()) this.time.set(this.initialTime());
  }

  confirm(): void { this.confirmed.emit(this.time()); }
}
