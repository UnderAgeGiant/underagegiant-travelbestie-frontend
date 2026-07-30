import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService (useMocks=true)', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: 'ENV', useValue: { useMocks: true, apiUrl: 'http://localhost:3000' } },
      ],
    });
    service = TestBed.inject(ApiService);
  });

  it('getTrips returns mock array without hitting HTTP', done => {
    service.getTrips().subscribe(trips => {
      expect(Array.isArray(trips)).toBe(true);
      done();
    });
  });

  it('addComment returns mock comment with generated id', done => {
    const input = { attractionId: 'paris_0', name: 'Ana', text: 'Amazing!', rating: 5, color: '#fff', date: 'Apr 24' };
    service.addComment(input).subscribe(c => {
      expect(c.id).toBeDefined();
      expect(c.attractionId).toBe('paris_0');
      done();
    });
  });

  it('getComments returns mock comments for known attraction', done => {
    service.getComments('paris_0').subscribe(comments => {
      expect(Array.isArray(comments)).toBe(true);
      done();
    });
  });
});

describe('ApiService (useMocks=false via spy)', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
    jest.spyOn(service as any, 'useMocks', 'get').mockReturnValue(false);
  });

  afterEach(() => http.verify());

  it('getTrips calls GET /trips', () => {
    service.getTrips().subscribe();
    http.expectOne(r => r.url.includes('/trips') && r.method === 'GET').flush([]);
  });

  it('saveTrip calls POST /trips', () => {
    service.saveTrip({ title: 'My Trip', stops: [] }).subscribe();
    const req = http.expectOne(r => r.url.includes('/trips') && r.method === 'POST');
    req.flush({ id: '1', title: 'My Trip', stops: [] });
  });

  it('addComment calls POST /comments/:attractionId', () => {
    const comment = { attractionId: 'paris_0', name: 'Ana', text: 'Amazing!', rating: 5, color: '#fff', date: '2026-04-24' };
    service.addComment(comment).subscribe();
    const req = http.expectOne(r => r.url.includes('/comments/paris_0') && r.method === 'POST');
    req.flush({ id: 'c1', ...comment });
  });
});

describe('ApiService.getStats() caching', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('tb:stats:cache');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
    jest.spyOn(service as any, 'useMocks', 'get').mockReturnValue(false);
  });

  afterEach(() => { http.verify(); localStorage.removeItem('tb:stats:cache'); });

  it('returns cached stats without HTTP when cache is fresh', done => {
    const cached = { cities: 99, users: 999, plans: 9999 };
    localStorage.setItem('tb:stats:cache', JSON.stringify({ data: cached, ts: Date.now() }));
    service.getStats().subscribe(result => {
      expect(result).toEqual(cached);
      http.expectNone((service as any).base + '/stats');
      done();
    });
  });

  it('fetches from API and writes cache when cache is missing', done => {
    const fresh = { cities: 1, users: 2, plans: 3 };
    service.getStats().subscribe(result => {
      expect(result).toEqual(fresh);
      const stored = JSON.parse(localStorage.getItem('tb:stats:cache')!);
      expect(stored.data).toEqual(fresh);
      expect(typeof stored.ts).toBe('number');
      done();
    });
    http.expectOne(req => req.url.endsWith('/stats')).flush(fresh);
  });

  it('fetches from API when cache is older than 24 h', done => {
    const stale = { cities: 0, users: 0, plans: 0 };
    localStorage.setItem('tb:stats:cache', JSON.stringify({ data: stale, ts: Date.now() - 86_400_001 }));
    service.getStats().subscribe(result => {
      expect(result.cities).toBe(5);
      done();
    });
    http.expectOne(req => req.url.endsWith('/stats')).flush({ cities: 5, users: 50, plans: 500 });
  });
});

describe('ApiService AI planning — city-scoped payloads', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
    jest.spyOn(service as any, 'useMocks', 'get').mockReturnValue(false);
  });

  afterEach(() => http.verify());

  it('suggestTrips sends a lightweight cityIndex alongside preferences', async () => {
    service.suggestTrips('historia y arte').subscribe();
    await new Promise(resolve => setTimeout(resolve, 0));
    const req = http.expectOne(r => r.url.includes('/ai/suggest') && r.method === 'POST');
    expect(Array.isArray(req.request.body.cityIndex)).toBe(true);
    expect(req.request.body.cityIndex.length).toBeGreaterThan(0);
    expect(req.request.body.cityIndex[0]).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String) }));
    req.flush({ options: [] });
  });

  it('planTrip sends an attractions catalog filtered to the selected option\'s cityIds', async () => {
    service.planTrip({
      selectedOption: { id: 1, title: 'T', summary: 'S', highlights: [], cityIds: ['paris', 'rome'] },
      preferences: 'arte',
    }).subscribe();
    await new Promise(resolve => setTimeout(resolve, 0));
    const req = http.expectOne(r => r.url.includes('/ai/plan') && r.method === 'POST');
    expect(Object.keys(req.request.body.cityCatalog).sort()).toEqual(['paris', 'rome']);
    req.flush({ title: 'T', stops: [], transits: [] });
  });

  it('planTrip sends no cityCatalog when the selected option has no cityIds', async () => {
    service.planTrip({
      selectedOption: { id: 1, title: 'T', summary: 'S', highlights: [] },
      preferences: 'arte',
    }).subscribe();
    await new Promise(resolve => setTimeout(resolve, 0));
    const req = http.expectOne(r => r.url.includes('/ai/plan') && r.method === 'POST');
    expect(req.request.body.cityCatalog).toBeUndefined();
    req.flush({ title: 'T', stops: [], transits: [] });
  });
});

describe('ApiService.suggestCityAttractions() — real HTTP', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
    jest.spyOn(service as any, 'useMocks', 'get').mockReturnValue(false);
  });

  afterEach(() => http.verify());

  it('posts cityId, dates, existing IDs and the city catalog to /ai/suggest-attractions, defaulting isFollowUp, existingSchedule and departureTimes', () => {
    service.suggestCityAttractions(
      'paris', '01/07/2026', '05/07/2026', ['paris_0'],
      [{ id: 'paris_0', name: 'Torre Eiffel' }, { id: 'paris_1', name: 'Louvre' }],
    ).subscribe();

    const req = http.expectOne(r => r.url.includes('/ai/suggest-attractions') && r.method === 'POST');
    expect(req.request.body).toEqual({
      cityId: 'paris',
      checkIn: '01/07/2026',
      checkOut: '05/07/2026',
      existingAttractionIds: ['paris_0'],
      cityCatalog: [{ id: 'paris_0', name: 'Torre Eiffel' }, { id: 'paris_1', name: 'Louvre' }],
      isFollowUp: false,
      existingSchedule: [],
      departureTimes: [],
    });
    req.flush({ suggestions: [] });
  });

  it('posts provided existingSchedule and departureTimes verbatim', () => {
    service.suggestCityAttractions(
      'paris', '01/07/2026', '05/07/2026', ['paris_0'],
      [{ id: 'paris_0', name: 'Torre Eiffel' }],
      true,
      [{ date: '02/07/2026', startTime: '10:00', endTime: '11:00' }],
      [{ date: '03/07/2026', time: '15:00' }],
    ).subscribe();

    const req = http.expectOne(r => r.url.includes('/ai/suggest-attractions') && r.method === 'POST');
    expect(req.request.body.existingSchedule).toEqual([{ date: '02/07/2026', startTime: '10:00', endTime: '11:00' }]);
    expect(req.request.body.departureTimes).toEqual([{ date: '03/07/2026', time: '15:00' }]);
    req.flush({ suggestions: [] });
  });

  it('posts isFollowUp: true when explicitly requested (free "search more" call)', () => {
    service.suggestCityAttractions(
      'paris', '01/07/2026', '05/07/2026', ['paris_0'],
      [{ id: 'paris_0', name: 'Torre Eiffel' }, { id: 'paris_1', name: 'Louvre' }],
      true,
    ).subscribe();

    const req = http.expectOne(r => r.url.includes('/ai/suggest-attractions') && r.method === 'POST');
    expect(req.request.body.isFollowUp).toBe(true);
    req.flush({ suggestions: [] });
  });
});

describe('ApiService.suggestCityAttractions() — mock mode', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()), provideHttpClientTesting(),
        { provide: 'ENV', useValue: { useMocks: true, apiUrl: 'http://localhost:3000' } },
      ],
    });
    service = TestBed.inject(ApiService);
  });

  it('returns canned suggestions built from the given catalog, excluding existing IDs', done => {
    service.suggestCityAttractions(
      'paris', '01/07/2026', '05/07/2026', ['paris_0'],
      [{ id: 'paris_0', name: 'Torre Eiffel' }, { id: 'paris_1', name: 'Louvre' }, { id: 'paris_2', name: 'Notre-Dame' }],
    ).subscribe(res => {
      expect(res.suggestions.length).toBeGreaterThan(0);
      expect(res.suggestions.every(s => s.attractionId !== 'paris_0')).toBe(true);
      done();
    });
  });
});
