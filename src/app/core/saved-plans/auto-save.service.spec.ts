import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AutoSaveService } from './auto-save.service';
import { SavedPlansService } from './saved-plans.service';
import { TripService } from '../../features/trip/trip.service';
import { AuthService } from '../auth/auth.service';
import { City } from '../models/city.model';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };

describe('AutoSaveService — background tick passes { background: true } to upsert() (Finding 4 fix)', () => {
  let autoSave: AutoSaveService;
  let savedPlans: SavedPlansService;
  let trip: TripService;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    // Construct services (and any constructor-time HTTP calls) before logging in,
    // same pattern as ai-planning.component.spec.ts, to avoid a stray GET /trips.
    autoSave   = TestBed.inject(AutoSaveService);
    savedPlans = TestBed.inject(SavedPlansService);
    trip       = TestBed.inject(TripService);
    auth       = TestBed.inject(AuthService);
    http       = TestBed.inject(HttpTestingController);
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
  });

  afterEach(() => http.verify());

  it('passes { background: true } from a background tick save', () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    trip.markAsLoadedPlan('trip-1');
    savedPlans.register({ id: 'trip-1', name: 'My Trip', savedAt: '2026-01-01', stops: [] });

    const spy = jest.spyOn(savedPlans, 'upsert');
    // Call the private tick() directly rather than driving the real setInterval via
    // fakeAsync — this codebase has no existing pattern for advancing this service's
    // timers in a spec, and the goal here is only to verify the { background: true }
    // flag reaches upsert(), not the interval scheduling itself.
    (autoSave as any).tick();
    http.expectOne(r => r.url.includes('/trips/trip-1')).flush({ id: 'trip-1', title: 'My Trip', stops: [], transits: [] });

    expect(spy).toHaveBeenCalledWith(
      'ana@test.com', 'trip-1', 'My Trip', expect.any(Array), expect.any(Array), { background: true },
    );
  });
});
