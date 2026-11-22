import { Injectable, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import type { PendingReferral, ReferralChannel, ReferralSummary } from '../models/referral.model';
import { REFERRAL_CODE_RE, readPendingReferral, writePendingReferral } from './pending-referral';

/** F81: remembers the first `?ref` code a logged-out browser sees, and loads the user's own code and counts. */
@Injectable({ providedIn: 'root' })
export class ReferralService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly _summary = signal<ReferralSummary | null>(null);
  readonly summary = this._summary.asReadonly();
  readonly loadError = signal(false);
  private inflight: { email: string; promise: Promise<ReferralSummary | null> } | null = null;

  /** Reads `ref`/`via`, stores them unless logged in or a code younger than 30 days exists, and strips them from the address bar. */
  captureFromUrl(url: URL = new URL(window.location.href)): void {
    const ref = url.searchParams.get('ref');
    if (ref === null) return;
    // currentUser is restored synchronously from the session marker, so this holds before the boot refresh.
    if (REFERRAL_CODE_RE.test(ref) && !this.auth.currentUser() && !readPendingReferral()) {
      const via = url.searchParams.get('via');
      const channel: ReferralChannel = via === 'shared_plan' || via === 'card' ? via : 'link';
      writePendingReferral({ code: ref, channel, at: Date.now() });
    }
    url.searchParams.delete('ref');
    url.searchParams.delete('via');
    try { history.replaceState(history.state, '', url.pathname + url.search + url.hash); } catch { /* not a browser */ }
  }

  pending(): PendingReferral | null { return readPendingReferral(); }

  /** One `GET /referrals/me` per login; resolves null when logged out or on error. */
  loadSummary(): Promise<ReferralSummary | null> {
    return untracked(() => {
      const email = this.auth.currentUser()?.email;
      if (!email || !this.auth.isLoggedIn()) return Promise.resolve(null);
      if (this.inflight?.email === email) return this.inflight.promise;
      this.loadError.set(false);
      const promise = firstValueFrom(this.api.getMyReferrals()).then(
        s => { this._summary.set(s); return s; },
        () => { this.loadError.set(true); return null; },
      );
      this.inflight = { email, promise };
      return promise;
    });
  }

  /** The logged-in user's code, or null. Starts the load lazily (deferred: safe inside a template or computed). */
  code(): string | null {
    const s = this._summary();
    if (s) return s.code;
    if (this.auth.isLoggedIn()) queueMicrotask(() => void this.loadSummary());
    return null;
  }

  /** Logout: the next user loads their own summary. */
  reset(): void {
    this.inflight = null;
    this._summary.set(null);
    this.loadError.set(false);
  }
}
