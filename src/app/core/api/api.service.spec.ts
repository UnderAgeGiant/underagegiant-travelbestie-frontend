import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService (useMocks=true)', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
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
      providers: [provideHttpClient(), provideHttpClientTesting()],
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
