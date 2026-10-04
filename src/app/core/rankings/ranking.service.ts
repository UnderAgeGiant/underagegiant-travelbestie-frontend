import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { MyRankings, WeeklyRankings } from '../models/ranking.model';
import { santiagoWeekStart } from './week-start.util';

export const RANKINGS_CACHE_KEY = 'tb_rankings';
const ME_PREFIX = 'tb_rankings_me_';
export const myRankingsCacheKey = (email: string): string => `${ME_PREFIX}${email}`;
export const RANKINGS_CLIENT_TTL_MS = 2 * 60 * 60 * 1000;

function readCache<T extends { weekStart: string }>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw) as { data: T; savedAt: number };
    if (Date.now() - savedAt >= RANKINGS_CLIENT_TTL_MS) return null;
    if (data?.weekStart !== santiagoWeekStart()) return null; // Monday rollover
    return data;
  } catch { return null; }
}

function writeCache(key: string, data: unknown): void {
  try { localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() })); } catch { /* no cache */ }
}

@Injectable({ providedIn: 'root' })
export class RankingService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly weekly = signal<WeeklyRankings | null>(null);
  readonly weeklyError = signal(false);
  readonly mine = signal<MyRankings | null>(null);
  readonly mineLoading = signal(false);
  readonly mineError = signal(false);

  load(): void {
    const hit = readCache<WeeklyRankings>(RANKINGS_CACHE_KEY);
    if (hit) { this.weekly.set(hit); this.weeklyError.set(false); return; }
    this.api.getRankings().subscribe({
      next: data => { this.weekly.set(data); this.weeklyError.set(false); writeCache(RANKINGS_CACHE_KEY, data); },
      error: () => this.weeklyError.set(true),
    });
  }

  /** Independent of load() — the charts never wait for it. */
  loadMine(): void {
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    const key = myRankingsCacheKey(email);
    const hit = readCache<MyRankings>(key);
    if (hit) { this.mine.set(hit); return; }
    this.mineLoading.set(true);
    this.mineError.set(false);
    this.api.getMyRankings().subscribe({
      next: data => {
        if (this.auth.currentUser()?.email !== email) return;
        this.mine.set(data);
        this.mineLoading.set(false);
        writeCache(key, data);
      },
      error: () => {
        if (this.auth.currentUser()?.email !== email) return;
        this.mineLoading.set(false);
        this.mineError.set(true);
      },
    });
  }

  reset(): void {
    this.weekly.set(null);
    this.weeklyError.set(false);
    this.mine.set(null);
    this.mineLoading.set(false);
    this.mineError.set(false);
    try {
      localStorage.removeItem(RANKINGS_CACHE_KEY);
      Object.keys(localStorage).filter(k => k.startsWith(ME_PREFIX)).forEach(k => localStorage.removeItem(k));
    } catch { /* nothing to clear */ }
  }
}
