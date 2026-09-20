import { FeedPage, FeedPlan } from '../models/feed-plan.model';

const CITIES = ['paris', 'rome', 'barcelona', 'london', 'amsterdam'];
const OWNERS = ['Ana', 'Bruno', 'Camila', 'Diego', 'Elena'];

/** 25 deterministic plans (> one 20-item page, so paging + wrap-around are exercisable in mock mode). */
export const MOCK_FEED_PLANS: FeedPlan[] = Array.from({ length: 25 }, (_, i) => {
  const cityIds = [CITIES[i % CITIES.length], CITIES[(i + 1) % CITIES.length]];
  return {
    id: `mock-feed-${String(i).padStart(2, '0')}`,
    tripName: `Plan de ejemplo ${i + 1}`,
    ownerName: OWNERS[i % OWNERS.length],
    createdAt: new Date(Date.UTC(2026, 5, 1) - i * 86_400_000).toISOString(),
    favoriteCount: 100 - i * 3,
    stops: cityIds.map((cityId, s) => ({
      cityId,
      checkIn:  s === 0 ? '01/07/2026' : '05/07/2026',
      checkOut: s === 0 ? '04/07/2026' : '08/07/2026',
      selectedAttractions: [0, 1, 2, 3].map(k => ({
        attractionId: `${cityId}_${k}`,
        startTime: k === 0 ? '09:00' : null,
        endTime: null,
      })),
    })),
  };
});

/** Mock of GET /feed: the cursor is just the next offset, as a string. */
export function mockFeedPage(cursor: string | null, limit: number): FeedPage {
  const parsed = cursor ? Number.parseInt(cursor, 10) : 0;
  const start = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  const end = start + limit;
  return {
    items: MOCK_FEED_PLANS.slice(start, end),
    nextCursor: end < MOCK_FEED_PLANS.length ? String(end) : null,
  };
}
