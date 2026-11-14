import { Injectable, signal } from '@angular/core';

/** Opens the shareable trip card dialog (mounted once in AppComponent). */
@Injectable({ providedIn: 'root' })
export class TripCardService {
  private readonly _request = signal<{ shareId: string; celebrate: boolean } | null>(null);
  readonly request = this._request.asReadonly();

  /** `celebrate` only right after an unpublished plan was published. */
  open(shareId: string, opts?: { celebrate?: boolean }): void {
    this._request.set({ shareId, celebrate: !!opts?.celebrate });
  }

  close(): void {
    this._request.set(null);
  }
}
