import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SavedPlansService } from './saved-plans.service';
import { TravelDocsReminderService } from '../reminders/travel-docs-reminder.service';

describe('SavedPlansService — upsert() and the travel-docs reminder (Finding 4 fix)', () => {
  let service: SavedPlansService;
  let http: HttpTestingController;
  let reminder: TravelDocsReminderService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SavedPlansService);
    http = TestBed.inject(HttpTestingController);
    reminder = TestBed.inject(TravelDocsReminderService);
  });

  afterEach(() => http.verify());

  it('calls maybeShow() on a normal (explicit) update save', () => {
    const spy = jest.spyOn(reminder, 'maybeShow');
    service.upsert('a@b.com', 'trip-1', 'My Trip', [], []).subscribe();
    http.expectOne(r => r.url.includes('/trips/trip-1')).flush({ id: 'trip-1', title: 'My Trip', stops: [], transits: [] });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does NOT call maybeShow() on a background (autosave) update save', () => {
    const spy = jest.spyOn(reminder, 'maybeShow');
    service.upsert('a@b.com', 'trip-1', 'My Trip', [], [], { background: true }).subscribe();
    http.expectOne(r => r.url.includes('/trips/trip-1')).flush({ id: 'trip-1', title: 'My Trip', stops: [], transits: [] });
    expect(spy).not.toHaveBeenCalled();
  });

  it('calls maybeShow() on a normal (explicit) create save', () => {
    const spy = jest.spyOn(reminder, 'maybeShow');
    service.upsert('a@b.com', null, 'New Trip', [], []).subscribe();
    http.expectOne(r => r.url.endsWith('/trips')).flush({ id: 'new-1', title: 'New Trip', stops: [], transits: [] });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does NOT call maybeShow() on a background (autosave) create save', () => {
    const spy = jest.spyOn(reminder, 'maybeShow');
    service.upsert('a@b.com', null, 'New Trip', [], [], { background: true }).subscribe();
    http.expectOne(r => r.url.endsWith('/trips')).flush({ id: 'new-1', title: 'New Trip', stops: [], transits: [] });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('SavedPlansService.upsert — sourceAiPlanRequestId', () => {
  let service: SavedPlansService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SavedPlansService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends sourceAiPlanRequestId on POST /trips when creating a new trip', () => {
    service.upsert('ana@test.com', null, 'Ruta Clásica', [], [], { sourceAiPlanRequestId: 'req-123' }).subscribe();
    const req = http.expectOne(r => r.url.includes('/trips') && r.method === 'POST');
    expect(req.request.body.sourceAiPlanRequestId).toBe('req-123');
    req.flush({ id: 't1', title: 'Ruta Clásica', stops: [], transits: [] });
  });

  it('omits sourceAiPlanRequestId from the payload when not provided', () => {
    service.upsert('ana@test.com', null, 'Manual Trip', []).subscribe();
    const req = http.expectOne(r => r.url.includes('/trips') && r.method === 'POST');
    expect(req.request.body.sourceAiPlanRequestId).toBeUndefined();
    req.flush({ id: 't2', title: 'Manual Trip', stops: [], transits: [] });
  });

  it('never sends it on an update (existing trip id)', () => {
    service.upsert('ana@test.com', 't1', 'Renamed', [], [], { sourceAiPlanRequestId: 'req-123' }).subscribe();
    const req = http.expectOne(r => r.url.includes('/trips/t1') && r.method === 'PUT');
    expect(req.request.body.sourceAiPlanRequestId).toBeUndefined();
    req.flush({ id: 't1', title: 'Renamed', stops: [], transits: [] });
  });

  it('sends sourcePlanSessionId on POST /trips when creating a new trip', () => {
    service.upsert('ana@test.com', null, 'Ruta Clásica', [], [], { sourcePlanSessionId: 'session-abc' }).subscribe();
    const req = http.expectOne(r => r.url.includes('/trips') && r.method === 'POST');
    expect(req.request.body.sourcePlanSessionId).toBe('session-abc');
    req.flush({ id: 't1', title: 'Ruta Clásica', stops: [], transits: [] });
  });
});

describe('SavedPlansService.loadForUser — load once per account (C1)', () => {
  let service: SavedPlansService;
  let http: HttpTestingController;

  const tripsRequests = () => http.match(r => r.method === 'GET' && r.url.endsWith('/trips'));
  const flushAll = () => http.match(() => true).forEach(r => r.flush([]));

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SavedPlansService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { flushAll(); http.verify(); });

  it('fetches trips once when called twice for the same email', () => {
    service.loadForUser('ana@test.com');
    service.loadForUser('ana@test.com');
    expect(tripsRequests()).toHaveLength(1);
  });

  it('refetches when forced', () => {
    service.loadForUser('ana@test.com');
    tripsRequests().forEach(r => r.flush([]));
    service.loadForUser('ana@test.com', true);
    expect(tripsRequests()).toHaveLength(1);
  });

  it('refetches for a different email', () => {
    service.loadForUser('ana@test.com');
    tripsRequests().forEach(r => r.flush([]));
    service.loadForUser('bob@test.com');
    expect(tripsRequests()).toHaveLength(1);
  });

  it('refetches after clear() (logout)', () => {
    service.loadForUser('ana@test.com');
    tripsRequests().forEach(r => r.flush([]));
    service.clear();
    service.loadForUser('ana@test.com');
    expect(tripsRequests()).toHaveLength(1);
  });

  it('retries after a failed load instead of staying empty', () => {
    service.loadForUser('ana@test.com');
    tripsRequests().forEach(r => r.flush('boom', { status: 500, statusText: 'Server Error' }));
    service.loadForUser('ana@test.com');
    expect(tripsRequests()).toHaveLength(1);
  });

  it('does not fetch pending invites (My Trips loads them on open)', () => {
    service.loadForUser('ana@test.com');
    expect(http.match(r => r.url.endsWith('/trips/invites'))).toHaveLength(0);
  });
});
