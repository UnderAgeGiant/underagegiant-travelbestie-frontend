import { Injectable, signal, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api/api.service';

@Injectable({ providedIn: 'root' })
export class KarmaService {
  private readonly auth = inject(AuthService);
  private readonly api  = inject(ApiService);

  private _karma = signal<number | null>(null);
  readonly karma = this._karma.asReadonly();

  constructor() {
    const user = this.auth.currentUser();
    if (user?.email) this.loadForUser(user.email);
  }

  loadForUser(email: string): void {
    this.api.getKarma(email).subscribe(res => this._karma.set(res.karma));
  }

  clear(): void {
    this._karma.set(null);
  }

  // Called after the user posts a comment on someone else's trip.
  // In real mode the backend already applied +1 as a side effect of POST /comments,
  // so we just re-fetch the authoritative value.
  gain(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    if (environment.useMocks) {
      this._karma.update(k => (k ?? 0) + 1);
      this.api.updateKarmaMock(user.email, +1);
    } else {
      this.loadForUser(user.email);
    }
  }

  // Called after the user shares a trip or creates a new blank trip.
  // In real mode the backend already applied −1 as a side effect of POST /trips,
  // so we just re-fetch the authoritative value.
  spend(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    if (environment.useMocks) {
      this._karma.update(k => (k ?? 0) - 1);
      this.api.updateKarmaMock(user.email, -1);
    } else {
      this.loadForUser(user.email);
    }
  }

  // Called after a successful karma purchase (any payment provider).
  // In real mode re-fetches the authoritative balance from the backend.
  // In mock mode updates local signal + localStorage so the display refreshes immediately.
  purchaseComplete(karmaAdded: number): void {
    const user = this.auth.currentUser();
    if (!user) return;
    if (environment.useMocks) {
      this._karma.update(k => (k ?? 0) + karmaAdded);
      this.api.updateKarmaMock(user.email, karmaAdded);
    } else {
      this.loadForUser(user.email);
    }
  }
}
