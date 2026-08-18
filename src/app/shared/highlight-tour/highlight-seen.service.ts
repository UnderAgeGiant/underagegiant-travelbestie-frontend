import { Injectable, inject } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { HighlightType } from '../../core/models/highlight.model';
import { highlightStorageKey } from './highlight-storage.util';

@Injectable({ providedIn: 'root' })
export class HighlightSeenService {
  private readonly api = inject(ApiService);

  /** Layer 1: sessionStorage cache, scoped to this tab's session. */
  private readCache(type: HighlightType): boolean | null {
    try {
      const raw = sessionStorage.getItem(highlightStorageKey(type));
      return raw === null ? null : raw === '1';
    } catch { return null; }
  }

  private writeCache(type: HighlightType, seen: boolean): void {
    try { sessionStorage.setItem(highlightStorageKey(type), seen ? '1' : '0'); } catch { /* non-fatal */ }
  }

  hasSeenLocally(type: HighlightType): boolean {
    return this.readCache(type) === true;
  }

  markSeenLocally(type: HighlightType): void {
    this.writeCache(type, true);
  }

  /**
   * Layers 2+3: server check (Redis, falling back to DB for logged-in users) — skipped
   * entirely once this tab's session already has a cached answer for `type`, whichever way
   * it went. That's the actual point of caching `false` too, not just `true`: without it, a
   * page that reloads several times in the same tab before the visitor ever finishes (or
   * dismisses) the tour would re-hit `/highlights/:type/status` on every single reload.
   * Caching the resolved value the first time — true or false — means at most one network
   * call per tab session, ever, for a given highlight type.
   */
  checkServerStatus(type: HighlightType): Observable<boolean> {
    const cached = this.readCache(type);
    if (cached !== null) return of(cached);
    return this.api.getHighlightStatus(type).pipe(
      map(status => status.seen),
      tap(seen => this.writeCache(type, seen)),
    );
  }

  /** Fire-and-forget — a failed write here is non-fatal, the cache already remembers locally. */
  markSeenOnServer(type: HighlightType): void {
    this.api.markHighlightSeen(type).subscribe({ error: () => { /* non-fatal */ } });
  }

  /**
   * Called when the visitor closes the tour WITHOUT confirming it (✕/Escape — never reaching
   * "¡Entendido!" on the last step). Does NOT touch the local cache or call markSeenLocally —
   * the backend owns the 3-strikes count (`HIGHLIGHT_DISMISS_LIMIT`) and only escalates to
   * "seen" once that's exhausted, so the frontend has no way to know from this 204 response
   * whether this particular dismissal was the one that crossed the limit. Leaving the local
   * cache untouched means the next real `checkServerStatus()` call (a later tab session) asks
   * the server fresh and gets the authoritative answer either way.
   */
  markDismissedOnServer(type: HighlightType): void {
    this.api.markHighlightDismissed(type).subscribe({ error: () => { /* non-fatal */ } });
  }
}
