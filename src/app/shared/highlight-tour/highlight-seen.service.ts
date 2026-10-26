import { Injectable, inject } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { HighlightType } from '../../core/models/highlight.model';
import { highlightDeviceKey, highlightStorageKey } from './highlight-storage.util';

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

  /** Layer 0: permanent per-device flag — once a tour was shown (confirmed or dismissed) on this device, it never shows again. */
  private readDevice(type: HighlightType): boolean {
    try { return localStorage.getItem(highlightDeviceKey(type)) === '1'; } catch { return false; }
  }

  private writeDevice(type: HighlightType): void {
    try { localStorage.setItem(highlightDeviceKey(type), '1'); } catch { /* non-fatal: falls back to session/server */ }
  }

  hasSeenLocally(type: HighlightType): boolean {
    return this.readDevice(type) || this.readCache(type) === true;
  }

  markSeenLocally(type: HighlightType): void {
    this.writeDevice(type);
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
    if (this.readDevice(type)) return of(true);
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
   * "¡Entendido!" on the last step). Per the owner (2026-10-25), a dismissal counts as seen on
   * this device: it sets the per-device flag, so the tour never shows here again. The backend
   * still gets the dismiss call and keeps its own 3-strikes count (`HIGHLIGHT_DISMISS_LIMIT`).
   */
  markDismissedOnServer(type: HighlightType): void {
    this.writeDevice(type);
    this.api.markHighlightDismissed(type).subscribe({ error: () => { /* non-fatal */ } });
  }
}
