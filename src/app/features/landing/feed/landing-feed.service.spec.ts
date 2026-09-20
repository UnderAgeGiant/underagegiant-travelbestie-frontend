import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { FeedPage, FeedPlan } from '../../../core/models/feed-plan.model';
import { LandingFeedService, FEED_PAGE_SIZE } from './landing-feed.service';

const plan = (n: number): FeedPlan => ({
  id: `p${n}`, tripName: `Plan ${n}`, ownerName: 'Ana', createdAt: '2026-09-01T00:00:00Z',
  favoriteCount: 100 - n, stops: [],
});
const page = (from: number, count: number, nextCursor: string | null): FeedPage =>
  ({ items: Array.from({ length: count }, (_, i) => plan(from + i)), nextCursor });

describe('LandingFeedService', () => {
  let getFeed: jest.Mock;
  let svc: LandingFeedService;

  const setup = () => {
    getFeed = jest.fn();
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: { getFeed } }] });
    svc = TestBed.inject(LandingFeedService);
  };

  it('initialLoad fetches the first page once and exposes topPlan/hasItems', () => {
    setup();
    getFeed.mockReturnValueOnce(of(page(0, FEED_PAGE_SIZE, 'c1')));
    svc.initialLoad();
    svc.initialLoad(); // second call is a no-op
    expect(getFeed).toHaveBeenCalledTimes(1);
    expect(getFeed).toHaveBeenCalledWith(null, FEED_PAGE_SIZE);
    expect(svc.itemCount()).toBe(20);
    expect(svc.hasItems()).toBe(true);
    expect(svc.topPlan()!.id).toBe('p0');
    expect(svc.loaded()).toBe(true);
  });

  it('prefetches at 90 % of the loaded plans: index 17 of 20 does nothing, 18 loads the next page', () => {
    setup();
    getFeed.mockReturnValueOnce(of(page(0, 20, 'c1'))).mockReturnValueOnce(of(page(20, 5, null)));
    svc.initialLoad();
    svc.onActiveIndex(17);
    expect(getFeed).toHaveBeenCalledTimes(1);
    svc.onActiveIndex(18);
    expect(getFeed).toHaveBeenCalledTimes(2);
    expect(getFeed).toHaveBeenLastCalledWith('c1', FEED_PAGE_SIZE);
    expect(svc.itemCount()).toBe(25);
  });

  it('never fires a second request while one is in flight', () => {
    setup();
    const inFlight = new Subject<FeedPage>();
    getFeed.mockReturnValueOnce(of(page(0, 20, 'c1'))).mockReturnValueOnce(inFlight.asObservable());
    svc.initialLoad();
    svc.onActiveIndex(19);
    svc.onActiveIndex(19);
    svc.loadMore();
    expect(getFeed).toHaveBeenCalledTimes(2);
    expect(svc.loading()).toBe(true);
  });

  it('wraps around: after nextCursor null the next load restarts with no cursor and a new pass key', () => {
    setup();
    getFeed
      .mockReturnValueOnce(of(page(0, 20, 'c1')))
      .mockReturnValueOnce(of(page(20, 5, null)))
      .mockReturnValueOnce(of(page(0, 20, 'c1')));
    svc.initialLoad();
    svc.loadMore();                       // page 2 — ends the pass
    svc.loadMore();                       // wrap: start again
    expect(getFeed).toHaveBeenLastCalledWith(null, FEED_PAGE_SIZE);
    const keys = svc.items().map(i => i.key);
    expect(new Set(keys).size).toBe(keys.length);        // pass-scoped keys never collide
    expect(keys).toContain('0:p0');
    expect(keys).toContain('1:p0');
  });

  it('drops plans already seen in the current pass (ranking shifted between pages)', () => {
    setup();
    getFeed.mockReturnValueOnce(of(page(0, 20, 'c1'))).mockReturnValueOnce(of(page(19, 3, null))); // p19 repeats
    svc.initialLoad();
    svc.loadMore();
    expect(svc.itemCount()).toBe(22);
    expect(svc.items().filter(i => i.plan.id === 'p19')).toHaveLength(1);
  });

  it('tiny catalog: recycles in memory after a single-page pass and never re-requests', () => {
    setup();
    getFeed.mockReturnValueOnce(of(page(0, 3, null)));
    svc.initialLoad();
    svc.loadMore();
    svc.loadMore();
    expect(getFeed).toHaveBeenCalledTimes(1);
    expect(svc.itemCount()).toBe(9);
    expect(svc.items().map(i => i.key)).toContain('2:p0');
  });

  it('empty catalog: no items, no loop', () => {
    setup();
    getFeed.mockReturnValueOnce(of({ items: [], nextCursor: null }));
    svc.initialLoad();
    svc.onActiveIndex(0);
    svc.loadMore();
    expect(getFeed).toHaveBeenCalledTimes(1);
    expect(svc.hasItems()).toBe(false);
    expect(svc.loaded()).toBe(true);
  });

  it('error keeps loaded items, blocks auto-prefetch, and retry() recovers', () => {
    setup();
    getFeed
      .mockReturnValueOnce(of(page(0, 20, 'c1')))
      .mockReturnValueOnce(throwError(() => new Error('boom')))
      .mockReturnValueOnce(of(page(20, 5, null)));
    svc.initialLoad();
    svc.loadMore();
    expect(svc.error()).toBe(true);
    expect(svc.itemCount()).toBe(20);
    svc.onActiveIndex(19);                 // auto-prefetch is blocked while errored
    expect(getFeed).toHaveBeenCalledTimes(2);
    svc.retry();
    expect(svc.error()).toBe(false);
    expect(svc.itemCount()).toBe(25);
  });

  it('reset() clears everything so the next landing mount starts fresh', () => {
    setup();
    getFeed.mockReturnValue(of(page(0, 20, 'c1')));
    svc.initialLoad();
    svc.reset();
    expect(svc.itemCount()).toBe(0);
    expect(svc.loaded()).toBe(false);
    svc.initialLoad();
    expect(getFeed).toHaveBeenLastCalledWith(null, FEED_PAGE_SIZE);
  });
});
