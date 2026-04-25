import { Component, input, output, signal, OnInit } from '@angular/core';
import { Attraction } from '../../../core/models/comment.model';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-plan-time-modal',
  standalone: true,
  imports: [DurationPipe],
  template: `
    <div class="modal-backdrop" (click)="$event.target === $event.currentTarget && cancel.emit()">
      <div class="modal" style="max-width:380px">
        <div class="modal-head" style="background:linear-gradient(135deg,var(--butter),var(--peach));border-radius:22px 22px 0 0;overflow:hidden">
          <div class="modal-title" i18n="@@planModal.title">¿A qué hora? ⏰</div>
          <div class="modal-sub">
            {{ attraction().icon }} {{ attraction().name }} ·
            {{ attraction().estimatedMinutes | duration }}
          </div>
        </div>
        <div class="modal-body">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label" i18n="@@planModal.timeLabel">Hora de inicio</label>
            <input type="time" class="form-input"
                   [value]="time()"
                   (change)="time.set($any($event.target).value)" />
          </div>
        </div>
        <div class="modal-foot" style="flex-direction:column;gap:8px;border-radius:0 0 22px 22px;overflow:hidden">
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
  attraction = input.required<Attraction>();
  initialTime = input('');

  cancel = output<void>();
  confirmed = output<string>();
  remove = output<void>();

  time = signal('09:00');

  get isEditing(): boolean { return this.initialTime() !== ''; }

  ngOnInit() {
    if (this.initialTime()) this.time.set(this.initialTime());
  }

  confirm(): void {
    this.confirmed.emit(this.time());
  }
}
