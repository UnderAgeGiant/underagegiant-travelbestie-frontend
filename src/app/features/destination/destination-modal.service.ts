import { Injectable, signal } from '@angular/core';

/** Shared open/closed state for the mobile "add attractions" full-screen modal
 *  rendered by DestinationComponent, so other components (e.g. the per-stop
 *  button in StopListComponent) can open it without DestinationComponent being
 *  visible in the normal page flow. */
@Injectable({ providedIn: 'root' })
export class DestinationModalService {
  private readonly _isOpen = signal(false);
  readonly isOpen = this._isOpen.asReadonly();

  open(): void { this._isOpen.set(true); }
  close(): void { this._isOpen.set(false); }
}
