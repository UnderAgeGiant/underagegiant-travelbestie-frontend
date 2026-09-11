import { Injectable, signal, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api/api.service';
import { KarmaEvent, KarmaEventReason } from '../models/karma-event.model';

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
  // so we just re-fetch the authoritative value. reason/targetId only drive the
  // mock-mode local ledger (see recordMockEvent) — real mode already has an
  // authoritative karma_events row written server-side.
  gain(reason: KarmaEventReason = 'attraction_comment_first', targetId?: string): void {
    const user = this.auth.currentUser();
    if (!user) return;
    if (environment.useMocks) {
      this._karma.update(k => (k ?? 0) + 1);
      this.api.updateKarmaMock(user.email, +1);
      this.recordMockEvent(user.email, 1, reason, targetId);
    } else {
      this.loadForUser(user.email);
    }
  }

  // Called after the user shares a trip, creates a new blank trip, or exports
  // an itinerary. See gain()'s note above re: reason/targetId scope.
  spend(reason: KarmaEventReason = 'itinerary_exported', targetId?: string): void {
    const user = this.auth.currentUser();
    if (!user) return;
    if (environment.useMocks) {
      this._karma.update(k => (k ?? 0) - 1);
      this.api.updateKarmaMock(user.email, -1);
      this.recordMockEvent(user.email, -1, reason, targetId);
    } else {
      this.loadForUser(user.email);
    }
  }

  // Called after a successful karma purchase (any payment provider).
  purchaseComplete(karmaAdded: number, reason: KarmaEventReason = 'karma_purchased'): void {
    const user = this.auth.currentUser();
    if (!user) return;
    if (environment.useMocks) {
      this._karma.update(k => (k ?? 0) + karmaAdded);
      this.api.updateKarmaMock(user.email, karmaAdded);
      this.recordMockEvent(user.email, karmaAdded, reason);
    } else {
      this.loadForUser(user.email);
    }
  }

  // Dev-convenience local ledger backing ApiService.getKarmaEvents' mock branch —
  // best-effort, not a strict mirror of backend karma_events semantics.
  private recordMockEvent(email: string, delta: number, reason: KarmaEventReason, targetId?: string): void {
    const key = `tb_karma_events_${email}`;
    const existing: KarmaEvent[] = JSON.parse(localStorage.getItem(key) ?? '[]');
    const event: KarmaEvent = {
      eventId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      delta, reason, createdAt: new Date().toISOString(),
      target: targetId
        ? { type: reason === 'ai_plan' || reason === 'ai_plan_refund' ? 'ai_plan_request' : 'trip', id: targetId }
        : null,
    };
    existing.unshift(event);
    localStorage.setItem(key, JSON.stringify(existing));
  }
}
