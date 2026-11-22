import type { PendingReferral, ReferralChannel } from '../models/referral.model';

// Dependency-free so AuthService can read it without injecting ReferralService
// (which depends on ApiService: NG0200 if the interceptor chain pulls it in).
export const REFERRAL_KEY = 'tb_referral';
export const REFERRAL_CODE_RE = /^[a-z0-9]{8}$/;
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CHANNELS: ReferralChannel[] = ['link', 'shared_plan', 'card'];

/** The first code this browser saw in the last 30 days, or null (an expired or malformed entry is removed). */
export function readPendingReferral(now = Date.now()): PendingReferral | null {
  try {
    const raw = localStorage.getItem(REFERRAL_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingReferral;
    if (REFERRAL_CODE_RE.test(p?.code) && CHANNELS.includes(p.channel) && typeof p.at === 'number' && now - p.at < TTL_MS) return p;
    localStorage.removeItem(REFERRAL_KEY);
  } catch { /* storage blocked or bad JSON */ }
  return null;
}

export function writePendingReferral(p: PendingReferral): void {
  try { localStorage.setItem(REFERRAL_KEY, JSON.stringify(p)); } catch { /* storage blocked */ }
}

export function clearPendingReferral(): void {
  try { localStorage.removeItem(REFERRAL_KEY); } catch { /* storage blocked */ }
}
