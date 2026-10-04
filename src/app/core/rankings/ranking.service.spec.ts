import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RankingService, RANKINGS_CACHE_KEY, myRankingsCacheKey, RANKINGS_CLIENT_TTL_MS } from './ranking.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';
import { santiagoWeekStart } from './week-start.util';
import { WeeklyRankings } from '../models/ranking.model';

const URL = `${environment.apiUrl}/rankings`;
const ME_URL = `${environment.apiUrl}/rankings/me`;

function weekly(weekStart = santiagoWeekStart()): WeeklyRankings {
  return { weekStart, generatedAt: '2026-10-04T10:00:00.000Z', topPlanners: [{ name: 'Ana', value: 2 }], topDestinations: [], topTrophies: [], topFavorited: [] };
}

describe('RankingService', () => {
  let http: HttpTestingController;
  let svc: RankingService;
  let email: string | null = 'a@b.com';

  beforeEach(() => {
    localStorage.clear();
    email = 'a@b.com';
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: () => (email ? { name: 'A', email } : null) } }],
    });
    http = TestBed.inject(HttpTestingController);
    svc = TestBed.inject(RankingService);
  });
  afterEach(() => { http.verify(); jest.useRealTimers(); });

  it('load() fetches, sets weekly and caches it', () => {
    svc.load();
    http.expectOne(URL).flush(weekly());
    expect(svc.weekly()?.topPlanners).toEqual([{ name: 'Ana', value: 2 }]);
    expect(JSON.parse(localStorage.getItem(RANKINGS_CACHE_KEY)!).data.weekStart).toBe(santiagoWeekStart());
  });

  it('load() reuses a fresh same-week cache without a request', () => {
    localStorage.setItem(RANKINGS_CACHE_KEY, JSON.stringify({ data: weekly(), savedAt: Date.now() - 1000 }));
    svc.load();
    http.expectNone(URL);
    expect(svc.weekly()).not.toBeNull();
  });

  it('load() refetches when the cache is older than 2 h', () => {
    localStorage.setItem(RANKINGS_CACHE_KEY, JSON.stringify({ data: weekly(), savedAt: Date.now() - RANKINGS_CLIENT_TTL_MS - 1 }));
    svc.load();
    http.expectOne(URL).flush(weekly());
  });

  it('week rollover: a 5-minute-old cache from last week is ignored (Review Focus 1)', () => {
    jest.useFakeTimers({ now: new Date('2026-10-05T03:05:00Z') }); // Monday 00:05 Santiago
    localStorage.setItem(RANKINGS_CACHE_KEY, JSON.stringify({ data: weekly('2026-09-28'), savedAt: Date.now() - 5 * 60_000 }));
    svc.load();
    http.expectOne(URL).flush(weekly('2026-10-05'));
    expect(svc.weekly()?.weekStart).toBe('2026-10-05');
  });

  it('load() failure sets weeklyError', () => {
    svc.load();
    http.expectOne(URL).flush('x', { status: 500, statusText: 'err' });
    expect(svc.weeklyError()).toBe(true);
    expect(svc.weekly()).toBeNull();
  });

  it('a throwing localStorage just means no cache', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    svc.load();
    http.expectOne(URL).flush(weekly());
    expect(svc.weekly()).not.toBeNull();
    spy.mockRestore();
    jest.restoreAllMocks();
  });

  it('loadMine() shows loading, then stores per email', () => {
    svc.loadMine();
    expect(svc.mineLoading()).toBe(true);
    http.expectOne(ME_URL).flush({ weekStart: santiagoWeekStart(), planners: { rank: 3, value: 2 }, trophies: null, favorited: null });
    expect(svc.mineLoading()).toBe(false);
    expect(svc.mine()?.planners).toEqual({ rank: 3, value: 2 });
    expect(localStorage.getItem(myRankingsCacheKey('a@b.com'))).not.toBeNull();
  });

  it('loadMine() failure clears loading and sets mineError', () => {
    svc.loadMine();
    http.expectOne(ME_URL).flush('x', { status: 500, statusText: 'err' });
    expect(svc.mineLoading()).toBe(false);
    expect(svc.mineError()).toBe(true);
  });

  it("account switch: B never sees A's cached position (Review Focus 2)", () => {
    localStorage.setItem(myRankingsCacheKey('a@b.com'),
      JSON.stringify({ data: { weekStart: santiagoWeekStart(), planners: { rank: 1, value: 9 }, trophies: null, favorited: null }, savedAt: Date.now() }));
    email = 'b@c.com';
    svc.loadMine();
    http.expectOne(ME_URL).flush({ weekStart: santiagoWeekStart(), planners: null, trophies: null, favorited: null });
    expect(svc.mine()?.planners).toBeNull();
  });

  it('reset() clears signals and every rankings key', () => {
    localStorage.setItem(RANKINGS_CACHE_KEY, '{}');
    localStorage.setItem(myRankingsCacheKey('a@b.com'), '{}');
    localStorage.setItem('tb_other', 'keep');
    svc.reset();
    expect(svc.weekly()).toBeNull();
    expect(svc.mine()).toBeNull();
    expect(localStorage.getItem(RANKINGS_CACHE_KEY)).toBeNull();
    expect(localStorage.getItem(myRankingsCacheKey('a@b.com'))).toBeNull();
    expect(localStorage.getItem('tb_other')).toBe('keep');
  });

  it('stale response after account switch is ignored (Review Focus 3)', () => {
    svc.loadMine();
    expect(svc.mineLoading()).toBe(true);
    email = 'b@c.com';
    http.expectOne(ME_URL).flush({ weekStart: santiagoWeekStart(), planners: { rank: 1, value: 9 }, trophies: null, favorited: null });
    expect(svc.mine()).toBeNull();
    expect(localStorage.getItem(myRankingsCacheKey('a@b.com'))).toBeNull();
  });

  it('stale error after account switch is ignored (Review Focus 3)', () => {
    svc.loadMine();
    email = 'b@c.com';
    http.expectOne(ME_URL).flush('x', { status: 500, statusText: 'err' });
    expect(svc.mine()).toBeNull();
    expect(svc.mineError()).toBe(false);
  });
});
