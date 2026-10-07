import { Component, input, inject } from '@angular/core';
import { PersonalActivityMeta } from '../../../core/models/personal-activity.model';
import { PersonalActivityModalService } from './personal-activity-modal.service';
import { NEW_ATTRACTION_MIME, NewAttractionDragPayload } from '../../../core/utils/day-timeline-drag.util';

/** Feature 71 — one personal-activity type in the "Mis actividades" grid: tap opens the add
 *  modal, desktop drag drops it straight onto the day timeline. */
@Component({
  selector: 'tb-personal-activity-card',
  template: `
    <button type="button" class="pa-card" draggable="true" [style.background-color]="meta().bg"
            (click)="modal.openAdd(stopId(), meta().type)" (dragstart)="onDragStart($event)">
      @if (meta().image) {
        <img class="pa-card-img" [src]="meta().image" [alt]="meta().label" loading="lazy" />
      } @else {
        <span class="pa-card-icon" aria-hidden="true">{{ meta().icon }}</span>
      }
      <span class="pa-card-label">{{ meta().label }}</span>
      <span class="pa-card-add" i18n="@@personal.addBtn">+ Agregar</span>
    </button>
  `,
  styles: [`
    .pa-card { display:flex; flex-direction:column; align-items:center; gap:6px; width:100%; padding:14px 10px;
      border:1px solid var(--border); border-radius:16px; cursor:pointer; font:inherit; color:var(--t1); }
    .pa-card:focus-visible { outline:2px solid var(--lav-d); outline-offset:2px; }
    .pa-card-img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:12px; }
    .pa-card-icon { font-size:40px; line-height:1; }
    .pa-card-label { font-weight:600; }
    .pa-card-add { font-size:12px; color:var(--lav-d); }
  `],
})
export class PersonalActivityCardComponent {
  meta = input.required<PersonalActivityMeta>();
  stopId = input.required<string>();
  protected readonly modal = inject(PersonalActivityModalService);

  onDragStart(event: DragEvent): void {
    const payload: NewAttractionDragPayload = { activityType: this.meta().type, estimatedMinutes: this.meta().minutes };
    event.dataTransfer?.setData(NEW_ATTRACTION_MIME, JSON.stringify(payload));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }
}
