// IMPORT-FREE on purpose: loaded by Node (scripts/city-pages.mjs) through built-in type stripping.
// Thresholds mirror lib/audit-city-data.mjs (root) — change both together.
export const MIN_GUIDE_ATTRACTIONS = 30;
export const MIN_DESCRIBED_RATIO = 0.9;
export const MIN_IMAGE_RATIO = 0.8;
export const MIN_DISTINCT_RATINGS = 6;
export const MAX_MODAL_RATING_SHARE = 0.25;
export const MIN_DESCRIPTION_CHARS = 60;

export interface QualityAttraction {
  active: boolean;
  rating: number;
  imageUrl?: string;
  description?: string;
}

export interface GuideQuality {
  ok: boolean;
  reasons: string[];
}

export function evaluateGuideQuality(attractions: QualityAttraction[]): GuideQuality {
  const active = attractions.filter(a => a.active);
  const n = active.length;
  const reasons: string[] = [];

  if (n < MIN_GUIDE_ATTRACTIONS) reasons.push(`active < ${MIN_GUIDE_ATTRACTIONS} (${n})`);

  const described = active.filter(a => (a.description ?? '').length >= MIN_DESCRIPTION_CHARS).length;
  if (n && described / n < MIN_DESCRIBED_RATIO) reasons.push(`descriptions < 90% (${described}/${n})`);

  const withImage = active.filter(a => !!a.imageUrl).length;
  if (n && withImage / n < MIN_IMAGE_RATIO) reasons.push(`images < 80% (${withImage}/${n})`);

  const counts = new Map<number, number>();
  for (const a of active) counts.set(a.rating, (counts.get(a.rating) ?? 0) + 1);
  if (counts.size < MIN_DISTINCT_RATINGS) reasons.push(`distinct ratings < ${MIN_DISTINCT_RATINGS} (${counts.size})`);

  const modal = Math.max(0, ...counts.values());
  if (n && Math.round((modal / n) * 100) / 100 > MAX_MODAL_RATING_SHARE) reasons.push('same rating > 25%');

  return { ok: reasons.length === 0, reasons };
}
