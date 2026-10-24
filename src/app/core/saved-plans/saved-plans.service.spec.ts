import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SavedPlansService } from './saved-plans.service';
import { TravelDocsReminderService } from '../reminders/travel-docs-reminder.service';

import { CostEstimate } from '../models/trip.model';

const EMPTY_ESTIMATE: CostEstimate = {
  totalUsd: 0, flightsUsd: 0, lodgingUsd: 0, ticketsUsd: 0, groundUsd: 0,
  nights: 0, rooms: 0, ticketCount: 0, unpricedTicketCount: 0, unestimated: [],
  missingOrigin: false,
  settings: { origin: null, adults: 1, children: 0, comfort: 'mid' },
  inputsHash: 'h', calculatedAt: '2026-10-22T00:00:00.000Z',
};

/** Answers any estimate request left pending by an explicit save, so verify() passes. */
const flushEstimates = () => TestBed.inject(HttpTestingController).match(r => r.url.endsWith('/estimate')).forEach(r => r.flush(EMPTY_ESTIMATE));

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

  afterEach(() => { flushEstimates(); http.verify(); });

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

  afterEach(() => { flushEstimates(); http.verify(); });

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

describe('SavedPlansService — save triggers estimate (F74)', () => {
  let service: SavedPlansService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SavedPlansService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('does not call estimate on a background save', () => {
    service.upsert('a@b.com', null, 'Bg Trip', [], [], { background: true }).subscribe();
    http.expectOne(r => r.url.endsWith('/trips') && r.method === 'POST').flush({ id: 'bg-1', title: 'Bg Trip', stops: [], transits: [] });
    http.expectNone(r => r.url.endsWith('/estimate'));
  });

  it('calls estimate once after an explicit create and stores the result on the plan', () => {
    service.upsert('a@b.com', null, 'New Trip', [], []).subscribe();
    http.expectOne(r => r.url.endsWith('/trips') && r.method === 'POST').flush({ id: 'new-1', title: 'New Trip', stops: [], transits: [] });
    const est = http.expectOne(r => r.url.endsWith('/trips/new-1/estimate') && r.method === 'POST');
    est.flush({ ...EMPTY_ESTIMATE, totalUsd: 1234 });
    expect(service.plans()[0].costEstimate?.totalUsd).toBe(1234);
  });

  it('calls estimate once after an explicit update', () => {
    service.register({ id: 't1', name: 'Old', savedAt: '', stops: [], transits: [] });
    service.upsert('a@b.com', 't1', 'Renamed', [], [], { costSettings: { origin: null, adults: 2, children: 0, comfort: 'luxury' } }).subscribe();
    const put = http.expectOne(r => r.url.endsWith('/trips/t1') && r.method === 'PUT');
    expect(put.request.body.costSettings).toEqual({ origin: null, adults: 2, children: 0, comfort: 'luxury' });
    put.flush({ id: 't1', title: 'Renamed', stops: [], transits: [] });
    http.expectOne(r => r.url.endsWith('/trips/t1/estimate')).flush(EMPTY_ESTIMATE);
    expect(service.plans()[0].costSettings?.adults).toBe(2);
  });

  it('does not send costSettings when not given', () => {
    service.upsert('a@b.com', 't1', 'Renamed', [], []).subscribe();
    const put = http.expectOne(r => r.url.endsWith('/trips/t1') && r.method === 'PUT');
    expect('costSettings' in put.request.body).toBe(false);
    put.flush({ id: 't1', title: 'Renamed', stops: [], transits: [] });
    http.expectOne(r => r.url.endsWith('/trips/t1/estimate')).flush(EMPTY_ESTIMATE);
  });

  it('still resolves the save when the estimate fails', () => {
    let savedId: string | undefined;
    service.upsert('a@b.com', null, 'New Trip', [], []).subscribe(id => savedId = id);
    http.expectOne(r => r.url.endsWith('/trips') && r.method === 'POST').flush({ id: 'new-2', title: 'New Trip', stops: [], transits: [] });
    http.expectOne(r => r.url.endsWith('/trips/new-2/estimate')).flush({}, { status: 500, statusText: 'Server Error' });
    expect(savedId).toBe('new-2');
  });
});

describe('SavedPlansService — estimating() follows the estimate request (F74 fix round 1)', () => {
  let service: SavedPlansService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SavedPlansService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); });

  it('contains the id while the estimate is pending, and not after it answers', () => {
    service.estimate('t1').subscribe();
    expect(service.estimating().has('t1')).toBe(true);
    http.expectOne(r => r.url.endsWith('/trips/t1/estimate')).flush(EMPTY_ESTIMATE);
    expect(service.estimating().has('t1')).toBe(false);
  });

  it('removes the id when the estimate errors', () => {
    service.estimate('t2').subscribe({ error: () => {} });
    expect(service.estimating().has('t2')).toBe(true);
    http.expectOne(r => r.url.endsWith('/trips/t2/estimate')).flush({}, { status: 500, statusText: 'Server Error' });
    expect(service.estimating().has('t2')).toBe(false);
  });

  it('keeps the id in the set during an explicit save until its estimate answers', () => {
    service.upsert('a@b.com', 't3', 'Trip', [], [], { costSettings: { origin: null, adults: 1, children: 0, comfort: 'mid' } }).subscribe();
    http.expectOne(r => r.url.includes('/trips/t3') && r.method === 'PUT').flush({ id: 't3', title: 'Trip', stops: [], transits: [] });
    expect(service.estimating().has('t3')).toBe(true);
    http.expectOne(r => r.url.endsWith('/trips/t3/estimate')).flush(EMPTY_ESTIMATE);
    expect(service.estimating().has('t3')).toBe(false);
  });
});

describe('SavedPlansService — server costEstimate from the save response (I3)', () => {
  let service: SavedPlansService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SavedPlansService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('a background upsert whose PUT answers stale:true marks the local estimate stale, with no estimate call', () => {
    service.register({ id: 'trip-1', name: 'Old', savedAt: '', stops: [], transits: [], costEstimate: { ...EMPTY_ESTIMATE, totalUsd: 500 } });

    service.upsert('a@b.com', 'trip-1', 'Old', [], [], { background: true }).subscribe();
    http.expectOne(r => r.url.endsWith('/trips/trip-1') && r.method === 'PUT').flush({
      id: 'trip-1', title: 'Old', stops: [], transits: [],
      costEstimate: { ...EMPTY_ESTIMATE, totalUsd: 500, stale: true },
    });

    expect(service.plans()[0].costEstimate?.stale).toBe(true);
    http.expectNone(r => r.url.endsWith('/estimate'));
  });

  it('a background upsert answering with an older estimate keeps the newer stored one', () => {
    const T1 = '2026-10-22T10:00:00.000Z', T2 = '2026-10-22T11:00:00.000Z';
    service.register({ id: 'trip-1', name: 'Old', savedAt: '', stops: [], transits: [], costEstimate: { ...EMPTY_ESTIMATE, totalUsd: 900, calculatedAt: T2 } });

    service.upsert('a@b.com', 'trip-1', 'Old', [], [], { background: true }).subscribe();
    http.expectOne(r => r.url.endsWith('/trips/trip-1') && r.method === 'PUT').flush({
      id: 'trip-1', title: 'Old', stops: [], transits: [],
      costEstimate: { ...EMPTY_ESTIMATE, totalUsd: 500, calculatedAt: T1, stale: true },
    });

    expect(service.plans()[0].costEstimate?.calculatedAt).toBe(T2);
    expect(service.plans()[0].costEstimate?.totalUsd).toBe(900);
    http.expectNone(r => r.url.endsWith('/estimate'));
  });
});

describe('SavedPlansService.clearShareId — unpublish (F74 feedback F3)', () => {
  it('drops the shareId of that plan only', () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(SavedPlansService);
    service.register({ id: 'p1', name: 'A', savedAt: '2026-10-24T00:00:00Z', stops: [], shareId: 'sh-1' });
    service.register({ id: 'p2', name: 'B', savedAt: '2026-10-24T00:00:00Z', stops: [], shareId: 'sh-2' });

    service.clearShareId('a@b.com', 'p1');

    expect(service.plans().find(p => p.id === 'p1')?.shareId).toBeUndefined();
    expect(service.plans().find(p => p.id === 'p2')?.shareId).toBe('sh-2');
  });
});
