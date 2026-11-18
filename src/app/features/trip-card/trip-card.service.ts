import { Injectable, signal } from '@angular/core';

/** Opens the shareable trip card dialog (mounted once in AppComponent). */
@Injectable({ providedIn: 'root' })
export class TripCardService {
  private readonly _request = signal<{ shareId: string; celebrate: boolean; own: boolean } | null>(null);
  readonly request = this._request.asReadonly();

  /** `celebrate` only right after an unpublished plan was published. `own` false = someone else's trip (share wording). */
  open(shareId: string, opts?: { celebrate?: boolean; own?: boolean }): void {
    this._request.set({ shareId, celebrate: !!opts?.celebrate, own: opts?.own ?? true });
  }

  close(): void {
    this._request.set(null);
  }
}
