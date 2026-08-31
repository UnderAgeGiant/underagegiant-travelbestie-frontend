import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { WeatherService } from './weather.service';

describe('WeatherService', () => {
  let service: WeatherService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(WeatherService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads weather for a city/range and exposes it via get()', () => {
    service.load('paris', '30/08/2026', '30/08/2026');
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '30/08/2026', type: 'forecast', tempMaxC: 23, tempMinC: 14, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );

    expect(service.get('paris', '30/08/2026')).toEqual(
      { date: '30/08/2026', type: 'forecast', tempMaxC: 23, tempMinC: 14, weatherCode: 3 },
    );
  });

  it('sends the cached etag on a repeat load for the same city/range, and keeps cached days on a 304', () => {
    service.load('paris', '30/08/2026', '30/08/2026');
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '30/08/2026', type: 'forecast', tempMaxC: 23, tempMinC: 14, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );

    service.load('paris', '30/08/2026', '30/08/2026');
    const req = http.expectOne(r => r.url.includes('/weather'));
    expect(req.request.headers.get('If-None-Match')).toBe('"etag-1"');
    req.flush(null, { status: 304, statusText: 'Not Modified' });

    expect(service.get('paris', '30/08/2026')).toEqual(
      { date: '30/08/2026', type: 'forecast', tempMaxC: 23, tempMinC: 14, weatherCode: 3 },
    );
  });

  it('does not send If-None-Match for a different city/range than what is cached', () => {
    service.load('paris', '30/08/2026', '30/08/2026');
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '30/08/2026', type: 'forecast', tempMaxC: 23, tempMinC: 14, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );

    service.load('rome', '01/09/2026', '01/09/2026');
    const req = http.expectOne(r => r.url.includes('/weather'));
    expect(req.request.headers.get('If-None-Match')).toBeNull();
    req.flush({ days: [] }, { headers: { ETag: '"etag-2"' } });
  });

  it('get() returns null for a city/date with no loaded data', () => {
    expect(service.get('tokyo', '01/01/2027')).toBeNull();
  });

  it('leaves existing data untouched when a load errors', () => {
    service.load('paris', '30/08/2026', '30/08/2026');
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '30/08/2026', type: 'forecast', tempMaxC: 23, tempMinC: 14, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );

    service.load('rome', '01/09/2026', '01/09/2026');
    http.expectOne(r => r.url.includes('/weather')).flush('boom', { status: 500, statusText: 'Server Error' });

    expect(service.get('paris', '30/08/2026')).not.toBeNull();
  });

  it('collapses two concurrent load() calls for the same city/range into a single HTTP request', () => {
    // Simulates the trip-wide DayTimelineComponent instance and an inline
    // per-stop instance (StopListComponent) both reacting to the same newly
    // added stop in the same tick.
    service.load('paris', '30/08/2026', '30/08/2026');
    service.load('paris', '30/08/2026', '30/08/2026');

    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '30/08/2026', type: 'forecast', tempMaxC: 23, tempMinC: 14, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );

    expect(service.get('paris', '30/08/2026')).not.toBeNull();
  });

  it('merges days into dayMap even when the response has no readable ETag header (cross-origin regression)', () => {
    // ETag is not a CORS-safelisted response header, and if the backend doesn't
    // send Access-Control-Expose-Headers: ETag, res.headers.get('ETag') comes back
    // null in a real browser even though the body itself is perfectly usable.
    // The merge must not be gated on etag presence.
    service.load('paris', '30/08/2026', '30/08/2026');
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '30/08/2026', type: 'forecast', tempMaxC: 23, tempMinC: 14, weatherCode: 3 }] },
      {},
    );

    expect(service.get('paris', '30/08/2026')).toEqual(
      { date: '30/08/2026', type: 'forecast', tempMaxC: 23, tempMinC: 14, weatherCode: 3 },
    );
  });

  it('prunes a stale (>24h old) cache entry when a later write triggers a prune pass', () => {
    const staleKey = 'tb:weather:tokyo:01/01/2026:01/01/2026';
    localStorage.setItem(staleKey, JSON.stringify({
      days: [{ date: '01/01/2026', type: 'forecast', tempMaxC: 10, tempMinC: 2, weatherCode: 1 }],
      etag: '"stale-etag"',
      cachedAt: Date.now() - 25 * 60 * 60 * 1000,
    }));

    service.load('paris', '30/08/2026', '30/08/2026');
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '30/08/2026', type: 'forecast', tempMaxC: 23, tempMinC: 14, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );

    expect(localStorage.getItem(staleKey)).toBeNull();
  });

  it('caps the cache at MAX_CACHE_ENTRIES, evicting the oldest entries first', () => {
    const MAX_CACHE_ENTRIES = 100;
    const seededCount = MAX_CACHE_ENTRIES + 5;
    const baseTime = Date.now() - 1000 * seededCount;

    for (let i = 0; i < seededCount; i++) {
      const key = `tb:weather:city${i}:01/01/2026:01/01/2026`;
      localStorage.setItem(key, JSON.stringify({
        days: [{ date: '01/01/2026', type: 'forecast', tempMaxC: 10, tempMinC: 2, weatherCode: 1 }],
        etag: `"etag-${i}"`,
        cachedAt: baseTime + i * 1000,
      }));
    }

    service.load('paris', '30/08/2026', '30/08/2026');
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '30/08/2026', type: 'forecast', tempMaxC: 23, tempMinC: 14, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );

    const remainingWeatherKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tb:weather:')) remainingWeatherKeys.push(key);
    }

    expect(remainingWeatherKeys.length).toBeLessThanOrEqual(MAX_CACHE_ENTRIES);
    // Oldest synthetic entries are gone…
    expect(localStorage.getItem('tb:weather:city0:01/01/2026:01/01/2026')).toBeNull();
    expect(localStorage.getItem('tb:weather:city1:01/01/2026:01/01/2026')).toBeNull();
    // …newest ones (plus the just-written paris entry) survive.
    expect(localStorage.getItem(`tb:weather:city${seededCount - 1}:01/01/2026:01/01/2026`)).not.toBeNull();
    expect(localStorage.getItem('tb:weather:paris:30/08/2026:30/08/2026')).not.toBeNull();
  });

  it('allows a fresh load() for the same city/range once the prior request has completed', () => {
    service.load('paris', '30/08/2026', '30/08/2026');
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '30/08/2026', type: 'forecast', tempMaxC: 23, tempMinC: 14, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );

    // A later, separate call (e.g. re-opening an inline instance later) is not
    // treated as a duplicate — it should still fire (with the now-cached etag).
    service.load('paris', '30/08/2026', '30/08/2026');
    const req = http.expectOne(r => r.url.includes('/weather'));
    expect(req.request.headers.get('If-None-Match')).toBe('"etag-1"');
    req.flush(null, { status: 304, statusText: 'Not Modified' });
  });
});
