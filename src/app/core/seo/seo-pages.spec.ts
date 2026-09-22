import { karmaHistorySeo, notFoundSeo, sharedPendingSeo } from './seo-pages';

/**
 * Regression coverage for the 2026-09-21 "noindex tag detected" incident: sharedPendingSeo() used to carry
 * `noindex: true` as the interim /shared/:id head, applied by SeoRouteListener on navigation — before
 * SharedTripComponent's fetchTrip() resolves. A JS-rendering crawler (Google's indexing renderer) can snapshot
 * the DOM during that ~1-2s window and see a fully indexable plan reported as noindex. The placeholder must
 * never claim noindex; only the routes that are genuinely, permanently non-indexable (404, karma history) do.
 */
describe('sharedPendingSeo', () => {
  it('never sets noindex — the interim /shared/:id head while the plan is still loading', () => {
    expect(sharedPendingSeo().noindex).toBeFalsy();
  });

  it('still carries a placeholder title', () => {
    expect(sharedPendingSeo().title.length).toBeGreaterThan(0);
  });
});

describe('genuinely non-indexable routes (unaffected by the fix above)', () => {
  it('notFoundSeo is noindex', () => expect(notFoundSeo().noindex).toBe(true));
  it('karmaHistorySeo is noindex', () => expect(karmaHistorySeo().noindex).toBe(true));
});
