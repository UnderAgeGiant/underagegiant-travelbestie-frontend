import { Injectable } from '@angular/core';

const ANONYMOUS_ID_KEY = 'tb_anonymous_id';

/**
 * A UUID generated once per browser profile and persisted in localStorage — NOT
 * sessionStorage, since the whole point is to survive across tabs and browser restarts so
 * the backend can recognize a RETURNING anonymous visitor individually instead of lumping
 * everyone behind the same IP/NAT together (see highlightIdentity on the backend). Sent as
 * the X-Anonymous-Id header on requests that need that distinction.
 */
@Injectable({ providedIn: 'root' })
export class AnonymousIdService {
  private cached: string | null = null;

  get(): string {
    if (this.cached) return this.cached;
    try {
      let id = localStorage.getItem(ANONYMOUS_ID_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(ANONYMOUS_ID_KEY, id);
      }
      return (this.cached = id);
    } catch {
      // Storage unavailable (private mode, quota, etc.) — a fresh id per call just means
      // the backend falls back to IP-based identity for this request, same as before this
      // feature existed. Still cache it in-memory so at least this page load is consistent.
      return (this.cached = crypto.randomUUID());
    }
  }
}
