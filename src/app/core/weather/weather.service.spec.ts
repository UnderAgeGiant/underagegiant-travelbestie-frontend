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
