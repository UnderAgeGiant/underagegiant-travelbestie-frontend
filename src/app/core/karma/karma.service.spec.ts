import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { KarmaService } from './karma.service';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api/api.service';
import { environment } from '../../../environments/environment';

describe('KarmaService — balance refresh after a charge', () => {
  it('re-fetches the balance whenever ApiService reports a charge', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: signal(null) } },
      ],
    });
    const service = TestBed.inject(KarmaService);
    const http = TestBed.inject(HttpTestingController);
    const auth = TestBed.inject(AuthService) as unknown as { currentUser: ReturnType<typeof signal<unknown>> };
    auth.currentUser.set({ name: 'Ana', email: 'ana@test.com', countryOfResidence: null });
    TestBed.inject(ApiService).karmaCharged$.next();
    http.expectOne(r => r.url.includes('/karma')).flush({ karma: 2 });
    expect(service.karma()).toBe(2);
    http.verify();
  });
});

describe('KarmaService — mock-mode event ledger', () => {
  let service: KarmaService;

  beforeEach(() => {
    environment.useMocks = true;
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: signal({ name: 'Ana', email: 'ana@test.com', countryOfResidence: null }) } },
      ],
    });
    service = TestBed.inject(KarmaService);
  });

  afterEach(() => { environment.useMocks = false; });

  it('spend() records a karma_events-shaped entry with the given reason and target', () => {
    service.spend('trip_created', 'trip-1');
    const stored = JSON.parse(localStorage.getItem('tb_karma_events_ana@test.com') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ delta: -1, reason: 'trip_created', target: { type: 'trip', id: 'trip-1' } });
  });

  it('gain() records a positive delta with no target when omitted', () => {
    service.gain('attraction_comment_first');
    const stored = JSON.parse(localStorage.getItem('tb_karma_events_ana@test.com') ?? '[]');
    expect(stored[0]).toMatchObject({ delta: 1, reason: 'attraction_comment_first', target: null });
  });

  it('purchaseComplete() defaults to the karma_purchased reason with no target', () => {
    service.purchaseComplete(25);
    const stored = JSON.parse(localStorage.getItem('tb_karma_events_ana@test.com') ?? '[]');
    expect(stored[0]).toMatchObject({ delta: 25, reason: 'karma_purchased', target: null });
  });

  it('prepends new events so the ledger stays newest-first', () => {
    service.spend('trip_created', 'trip-1');
    service.spend('itinerary_exported', 'trip-1');
    const stored = JSON.parse(localStorage.getItem('tb_karma_events_ana@test.com') ?? '[]');
    expect(stored[0].reason).toBe('itinerary_exported');
    expect(stored[1].reason).toBe('trip_created');
  });
});
