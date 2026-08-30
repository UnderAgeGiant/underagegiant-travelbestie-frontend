import { Injectable, signal } from '@angular/core';

const SESSION_FLAG_KEY = 'tb_seen_travel_docs_reminder';

/**
 * Family feedback idea #3 (docs/superpowers/plans/2026-08-29-family-feedback-round.md
 * Task 6): shows a one-off reminder about visas/vaccines/passports the first time a
 * trip is saved in the browser session. Deliberately lighter than the permanent
 * Highlights module (Feature 58) — sessionStorage only, no Redis/DB, no per-user
 * "seen forever" record.
 */
@Injectable({ providedIn: 'root' })
export class TravelDocsReminderService {
  private readonly _visible = signal(false);
  readonly visible = this._visible.asReadonly();

  /** In-memory guard for this service instance's lifetime; sessionStorage extends
   *  that guarantee across a reload within the same tab session. */
  private shown = false;

  maybeShow(): void {
    if (this.shown) return;
    this.shown = true;
    try {
      if (sessionStorage.getItem(SESSION_FLAG_KEY)) return;
      sessionStorage.setItem(SESSION_FLAG_KEY, '1');
    } catch {
      // sessionStorage unavailable (e.g. private browsing) — the in-memory
      // `shown` flag above still prevents repeats within this page load.
    }
    this._visible.set(true);
  }

  dismiss(): void {
    this._visible.set(false);
  }
}
