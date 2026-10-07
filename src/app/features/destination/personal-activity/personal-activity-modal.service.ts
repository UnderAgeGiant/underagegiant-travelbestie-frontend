import { Injectable, signal } from '@angular/core';

export type PersonalModalState =
  | { mode: 'add'; stopId: string; activityType: string }
  | { mode: 'edit'; stopId: string; entryId: string };

/** Feature 71 — open/close state for the single personal-activity modal mounted in ShellComponent. */
@Injectable({ providedIn: 'root' })
export class PersonalActivityModalService {
  private readonly _state = signal<PersonalModalState | null>(null);
  readonly state = this._state.asReadonly();
  openAdd(stopId: string, activityType: string): void { this._state.set({ mode: 'add', stopId, activityType }); }
  openEdit(stopId: string, entryId: string): void { this._state.set({ mode: 'edit', stopId, entryId }); }
  close(): void { this._state.set(null); }
}
