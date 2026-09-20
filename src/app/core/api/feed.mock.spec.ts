import { MOCK_FEED_PLANS, mockFeedPage } from './feed.mock';

describe('feed mock', () => {
  it('has 25 plans ranked by favorites descending, with real curated attraction ids', () => {
    expect(MOCK_FEED_PLANS).toHaveLength(25);
    const favs = MOCK_FEED_PLANS.map(p => p.favoriteCount);
    expect(favs).toEqual([...favs].sort((a, b) => b - a));
    expect(MOCK_FEED_PLANS[0].stops[0].selectedAttractions[0].attractionId).toMatch(/^[a-z]+_\d+$/);
  });

  it('pages 20 then 5 then reports the end with a null cursor', () => {
    const p1 = mockFeedPage(null, 20);
    expect(p1.items).toHaveLength(20);
    expect(p1.nextCursor).toBe('20');
    const p2 = mockFeedPage(p1.nextCursor, 20);
    expect(p2.items).toHaveLength(5);
    expect(p2.nextCursor).toBeNull();
    expect(new Set([...p1.items, ...p2.items].map(p => p.id)).size).toBe(25);
  });

  it('treats a junk cursor as the first page', () => {
    expect(mockFeedPage('abc', 20).items[0].id).toBe(MOCK_FEED_PLANS[0].id);
  });
});
