import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { HighlightType } from '../../core/models/highlight.model';
import { highlightCookieKey, HIGHLIGHT_COOKIE_MAX_AGE_SECONDS } from './highlight-cookie.util';

@Injectable({ providedIn: 'root' })
export class HighlightSeenService {
  private readonly doc = inject(DOCUMENT);
  private readonly api = inject(ApiService);

  /** Layer 1: cookie fast-path — no network call. */
  hasSeenLocally(type: HighlightType): boolean {
    const key = highlightCookieKey(type);
    return this.doc.cookie
      .split(';')
      .map(c => c.trim())
      .some(c => c.startsWith(`${key}=`));
  }

  markSeenLocally(type: HighlightType): void {
    this.doc.cookie = `${highlightCookieKey(type)}=1; path=/; max-age=${HIGHLIGHT_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  }

  /** Layers 2+3: server check (Redis, falling back to DB for logged-in users). */
  checkServerStatus(type: HighlightType): Observable<boolean> {
    return this.api.getHighlightStatus(type).pipe(map(status => status.seen));
  }

  /** Fire-and-forget — a failed write here is non-fatal, the cookie already remembers locally. */
  markSeenOnServer(type: HighlightType): void {
    this.api.markHighlightSeen(type).subscribe({ error: () => { /* non-fatal */ } });
  }
}
