import { WORLD_CITIES } from '../../../data/cities.data';
import { MyRank, MyRankings, WeeklyRankings } from '../../../core/models/ranking.model';

export type RankingKey = 'planners' | 'destinations' | 'trophies' | 'favorited';
export interface RankingRow { label: string; sublabel?: string; link?: string; value: number; pct: number }
export interface RankingChart { key: RankingKey; title: string; rows: RankingRow[]; fallback: boolean }

/** Placeholder until the owner provides the real Asistente Miel artwork — swap this one constant. */
export const MIEL_HOST_IMAGE = '/Dog-highlight-wagging-tail-1.png';

const TRAVEL_EXPERT = 'Travel Expert';
const cityNames = new Map(WORLD_CITIES.map(c => [c.id, c.name]));

// Functions, not consts — lazy $localize (same convention as trophy-catalog.ts).
const titles = (): Record<RankingKey, string> => ({
  planners:     $localize`:@@ranking.planners:Usuarios con más planes`,
  destinations: $localize`:@@ranking.destinations:Destinos más planificados`,
  trophies:     $localize`:@@ranking.trophies:Usuarios con más trofeos`,
  favorited:    $localize`:@@ranking.favorited:Planes con más favoritos`,
});
const byOwner = (name: string): string => $localize`:@@ranking.byOwner:de ${name}:owner:`;

type RawRow = Omit<RankingRow, 'pct'>;

function fallbackRows(key: RankingKey): RawRow[] {
  switch (key) {
    case 'destinations': return [{ label: cityNames.get('paris') ?? 'Paris', value: 5 }];
    case 'favorited':    return [{ label: $localize`:@@ranking.fallbackPlan:Plan de Travel Expert`, sublabel: byOwner(TRAVEL_EXPERT), value: 5 }];
    default:             return [{ label: TRAVEL_EXPERT, value: 5 }];
  }
}

function rawRows(key: RankingKey, w: WeeklyRankings): RawRow[] {
  switch (key) {
    case 'planners':     return w.topPlanners.map(r => ({ label: r.name, value: r.value }));
    case 'trophies':     return w.topTrophies.map(r => ({ label: r.name, value: r.value }));
    case 'destinations': return w.topDestinations.map(r => ({ label: cityNames.get(r.cityId) ?? r.cityId, value: r.value }));
    case 'favorited':    return w.topFavorited.map(r => ({
      label: r.title, sublabel: byOwner(r.ownerName), link: `/shared/${encodeURIComponent(r.shareId)}`, value: r.value,
    }));
  }
}

const KEYS: RankingKey[] = ['planners', 'destinations', 'trophies', 'favorited'];

export function buildCharts(weekly: WeeklyRankings | null, failed: boolean): RankingChart[] {
  const t = titles();
  return KEYS.map(key => {
    const real = !failed && weekly ? rawRows(key, weekly) : [];
    const fallback = real.length === 0;
    const rows = fallback ? fallbackRows(key) : real;
    const max = Math.max(...rows.map(r => r.value), 1);
    return { key, title: t[key], fallback, rows: rows.map(r => ({ ...r, pct: Math.round((r.value / max) * 100) })) };
  });
}

export function myRankFor(key: RankingKey, mine: MyRankings | null): MyRank | null {
  if (!mine || key === 'destinations') return null;
  return mine[key];
}

/** In the viewer's own timezone unless one is passed (tests). dateStyle can't be combined with timeZoneName, so fields are explicit. */
export function formatLastUpdate(iso: string, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23', timeZoneName: 'short', ...(timeZone ? { timeZone } : {}),
  }).format(new Date(iso));
}

export function formatWeekStart(weekStart: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${weekStart}T00:00:00Z`));
}
