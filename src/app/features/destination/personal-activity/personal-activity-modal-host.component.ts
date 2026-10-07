import { Component, computed, inject } from '@angular/core';
import { PlanTimeModalComponent, PlanEntry, ScheduleEntry } from '../plan-time-modal/plan-time-modal.component';
import { PersonalActivityModalService } from './personal-activity-modal.service';
import { TripService } from '../../trip/trip.service';
import { personalAttraction, resolvePlannedAttraction } from '../../../core/utils/personal-activity.util';
import { activityMeta } from '../../../core/models/personal-activity.model';
import { WORLD_CITIES } from '../../../data/cities.data';
import { ToastService } from '../../../core/ui/toast.service';

/** Single mount (ShellComponent) for adding/editing personal activities — opened from the
 *  activity cards (add) and from timeline blocks / stop-list rows (edit). Its .modal-backdrop
 *  (z-index 400) stacks above the mobile attractions sheet (.att-sheet, 200). */
@Component({
  selector: 'tb-personal-activity-modal-host',
  imports: [PlanTimeModalComponent],
  template: `
    @if (view(); as v) {
      <app-plan-time-modal
        [attraction]="v.attraction"
        [personal]="v.personal"
        [initialTime]="v.initialTime"
        [initialDate]="v.initialDate"
        [stopCheckIn]="v.stop.checkIn"
        [stopCheckOut]="v.stop.checkOut"
        [existingPlanned]="v.schedule"
        [cityName]="v.cityName"
        (cancel)="modal.close()"
        (confirmed)="onConfirmed($event)"
        (remove)="onRemove()" />
    }
  `,
})
export class PersonalActivityModalHostComponent {
  protected readonly modal = inject(PersonalActivityModalService);
  private readonly trip = inject(TripService);
  private readonly toast = inject(ToastService);

  protected readonly view = computed(() => {
    const st = this.modal.state();
    if (!st) return null;
    const stop = this.trip.stops().find(s => s.stopId === st.stopId);
    if (!stop) return null;
    const editing = st.mode === 'edit' ? stop.selectedAttractions.find(a => a.entryId === st.entryId) : undefined;
    if (st.mode === 'edit' && !editing) return null;
    const type = st.mode === 'add' ? st.activityType : editing!.activityType;
    const schedule: ScheduleEntry[] = stop.selectedAttractions
      .filter(a => a.entryId !== editing?.entryId)
      .flatMap(a => {
        const att = resolvePlannedAttraction(stop.cityId, a);
        return att ? [{ entryId: a.entryId, startTime: a.startTime, date: a.date, attraction: att }] : [];
      });
    return {
      stop, schedule,
      attraction: personalAttraction({ activityType: type, title: editing?.title }),
      personal: { title: editing?.title ?? activityMeta(type).label, mapsUrl: editing?.mapsUrl ?? '', isPrivate: editing?.isPrivate ?? false },
      initialTime: editing?.startTime ?? '',
      initialDate: editing?.date ?? '',
      cityName: WORLD_CITIES.find(c => c.id === stop.cityId)?.name ?? '',
    };
  });

  onConfirmed(e: PlanEntry): void {
    const st = this.modal.state();
    if (!st) return;
    const input = { title: e.title ?? '', mapsUrl: e.mapsUrl, isPrivate: !!e.isPrivate, startTime: e.startTime, date: e.date || undefined };
    if (st.mode === 'add') {
      this.trip.addPersonalActivity(st.stopId, { ...input, activityType: st.activityType });
      this.toast.show($localize`:@@personal.addedToast:¡Actividad agregada a tu itinerario!`);
    } else {
      this.trip.updatePersonalActivity(st.stopId, st.entryId, input);
    }
    this.modal.close();
  }

  onRemove(): void {
    const st = this.modal.state();
    if (st?.mode === 'edit') this.trip.removeAttraction(st.stopId, st.entryId);
    this.modal.close();
  }
}
