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
  private readonly memSeen = new Map<string, Set<string>>();

  readonly current = signal<EarnedTrophy | null>(null);
  readonly burstId = signal(0);

  celebrate(list: EarnedTrophy[]): void {
    const seen = this.readSeen();
    const fresh = list.filter(t => {
      const k = trophyKey(t.type, t.tier);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (!fresh.length) return;
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

  /** Logout: drop anything queued or on screen. */
  clear(): void {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.queue = [];
    this.current.set(null);
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
    // In-memory set per email survives a throwing localStorage; storage still seeds it across reloads.
    const mem = this.memSeen.get(email) ?? new Set<string>();
    try { (JSON.parse(localStorage.getItem(storageKey(email)) ?? '[]') as string[]).forEach(k => mem.add(k)); }
    catch { /* non-fatal */ }
    this.memSeen.set(email, mem);
    return mem;
  }

  private writeSeen(seen: Set<string>): void {
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    try { localStorage.setItem(storageKey(email), JSON.stringify([...seen])); } catch { /* non-fatal */ }
  }
}
