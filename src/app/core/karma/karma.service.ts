import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api/api.service';

@Injectable({ providedIn: 'root' })
export class KarmaService {
  private readonly auth = inject(AuthService);
  private readonly api  = inject(ApiService);

  private _karma = signal<number | null>(null);
  readonly karma = this._karma.asReadonly();

  constructor() {
    // Restore karma on page refresh if user session is already present
    const user = this.auth.currentUser();
    if (user?.email) this.loadForUser(user.email);
  }

  loadForUser(email: string): void {
    this.api.getKarma(email).subscribe(res => this._karma.set(res.karma));
  }

  clear(): void {
    this._karma.set(null);
  }

  gain(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    this._karma.update(k => (k ?? 0) + 1);
    this.api.updateKarma(user.email, +1).subscribe();
  }

  spend(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    this._karma.update(k => (k ?? 0) - 1);
    this.api.updateKarma(user.email, -1).subscribe();
  }
}
