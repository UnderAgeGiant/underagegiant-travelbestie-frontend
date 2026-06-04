import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProfileModalService {
  private readonly _isOpen = signal(false);
  readonly isOpen = this._isOpen.asReadonly();

  open(): void  { this._isOpen.set(true);  }
  close(): void { this._isOpen.set(false); }
}
