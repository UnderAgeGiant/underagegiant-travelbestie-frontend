import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { EarnedTrophy, TrophiesResponse } from '../models/trophy.model';

@Injectable({ providedIn: 'root' })
export class TrophyService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly earned    = signal<EarnedTrophy[]>([]);
  readonly progress  = signal<TrophiesResponse['progress']>({});
  readonly loading   = signal(false);
  readonly loadError = signal(false);

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api.getTrophies().subscribe({
      next: ({ earned, progress }) => {
        this.earned.set(earned);
        this.progress.set(progress);
        this.loading.set(false);
      },
      error: () => { this.loadError.set(true); this.loading.set(false); },
    });
  }

  /** Called after a completed share. The response's X-New-Trophies header drives the celebration. */
  reportShare(shareId: string): void {
    if (!this.auth.isLoggedIn()) return;
    this.api.reportShare(shareId).subscribe({ error: () => { /* non-fatal */ } });
  }

  reset(): void {
    this.earned.set([]);
    this.progress.set({});
    this.loadError.set(false);
  }
}
