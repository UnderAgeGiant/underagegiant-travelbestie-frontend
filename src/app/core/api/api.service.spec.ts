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
