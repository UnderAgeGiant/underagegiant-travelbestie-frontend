import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { EarnedTrophy } from '../models/trophy.model';
import { trophyKey } from './trophy-catalog';

const AUTO_DISMISS_MS = 4000;
const storageKey = (email: string) => `tb_trophies_celebrated_${email}`;

/**
 * Queue of "¡Nuevo trofeo!" cards + streamer bursts. Injected by an HTTP interceptor,
 * so it must depend on AuthService only — never ApiService/HttpClient (NG0200 risk).
 */
@Injectable({ providedIn: 'root' })
export class TrophyCelebrationService {
  private readonly auth = inject(AuthService);
  private queue: EarnedTrophy[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly current = signal<EarnedTrophy | null>(null);
  readonly burstId = signal(0);

  celebrate(list: EarnedTrophy[]): void {
    const seen = this.readSeen();
    const fresh = list.filter(t => !seen.has(trophyKey(t.type, t.tier)));
    if (!fresh.length) return;
    fresh.forEach(t => seen.add(trophyKey(t.type, t.tier)));
    this.writeSeen(seen);
    this.queue.push(...fresh);
    if (!this.current()) this.showNext();
  }

  /** Streamers only — used by the bell when it opens with an unread trophy notification. */
  burst(): void { this.burstId.update(n => n + 1); }

  dismiss(): void {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.current.set(null);
    this.showNext();
  }

  private showNext(): void {
    const next = this.queue.shift();
    if (!next) return;
    this.current.set(next);
    this.burst();
    this.timer = setTimeout(() => this.dismiss(), AUTO_DISMISS_MS);
  }

  private readSeen(): Set<string> {
    const email = this.auth.currentUser()?.email;
    if (!email) return new Set();
    try { return new Set(JSON.parse(localStorage.getItem(storageKey(email)) ?? '[]') as string[]); }
    catch { return new Set(); }
  }

  private writeSeen(seen: Set<string>): void {
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    try { localStorage.setItem(storageKey(email), JSON.stringify([...seen])); } catch { /* non-fatal */ }
  }
}
