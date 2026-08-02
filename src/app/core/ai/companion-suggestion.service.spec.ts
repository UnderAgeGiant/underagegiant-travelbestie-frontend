import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CompanionSuggestionService } from './companion-suggestion.service';
import { KarmaModalService } from '../karma/karma-modal.service';
import { KarmaService } from '../karma/karma.service';
import { AuthService } from '../auth/auth.service';
import { TripService } from '../../features/trip/trip.service';
import { City } from '../models/city.model';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };

function flushAsync(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe('CompanionSuggestionService', () => {
  let service: CompanionSuggestionService;
  let trip: TripService;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()), provideHttpClientTesting(),
        { provide: 'ENV', useValue: { useMocks: false, apiUrl: 'http://localhost:3000' } },
      ],
    });
    service = TestBed.inject(CompanionSuggestionService);
    trip    = TestBed.inject(TripService);
    auth    = TestBed.inject(AuthService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('does nothing when the user is not logged in', async () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(false as any);
    trip.addStop(PARIS, '01/07/2026', '05/07/2026');
    const stop = trip.stops()[0];
    trip.addAttraction(stop.stopId, 'paris_0', '09:00', '02/07/2026');

    await service.trigger(stop.stopId, 'paris_0');
    expect(service.state()).toBe('idle');
    http.expectNone(r => r.url.includes('/ai/suggest-companion'));
  });

  it('stays idle (silent) for the whole request, then sniffs and reveals the bubble a few seconds after a 200 response', async () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);
    trip.addStop(PARIS, '01/07/2026', '05/07/2026');
    const stop = trip.stops()[0];
    trip.addAttraction(stop.stopId, 'paris_0', '09:00', '02/07/2026');

    const promise = service.trigger(stop.stopId, 'paris_0');
    // Silent while in flight — nothing is shown, nothing is known about the added
    // attraction yet. This is the whole point: the mascot never signals "thinking".
    expect(service.state()).toBe('idle');
    expect(service.addedAttractionInfo()).toBeNull();

    await flushAsync();
    const req = http.expectOne(r => r.url.includes('/ai/suggest-companion') && r.method === 'POST');
    expect(req.request.body.addedAttractionId).toBe('paris_0');

    jest.useFakeTimers(); // control the reveal delay from here on
    req.flush({ attractionId: 'paris_1', date: '02/07/2026', startTime: '11:00', endTime: '12:00', reason: 'Muy popular después.' });
    await promise;

    // The 200 arrived — NOW (and only now) the dog appears sniffing. The suggestion
    // is already known and stored, but held back from the template until the delay.
    expect(service.state()).toBe('sniffing');
    expect(service.addedAttractionInfo()?.date).toBe('02/07/2026');
    expect(service.addedAttractionInfo()?.time).toBe('09:00');
    expect(service.suggestion()?.attractionId).toBe('paris_1');

    jest.advanceTimersByTime(2500);
    expect(service.state()).toBe('suggesting');

    jest.useRealTimers();
  });

  it('stays idle for the whole request and never shows anything on a 204 (no suggestion) response', async () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);
    trip.addStop(PARIS, '01/07/2026', '05/07/2026');
    const stop = trip.stops()[0];
    trip.addAttraction(stop.stopId, 'paris_0', '09:00', '02/07/2026');

    const promise = service.trigger(stop.stopId, 'paris_0');
    expect(service.state()).toBe('idle');
    await flushAsync();
    http.expectOne(r => r.url.includes('/ai/suggest-companion'))
      .flush(null, { status: 204, statusText: 'No Content' });
    await promise;

    expect(service.state()).toBe('idle');
    expect(service.suggestion()).toBeNull();
  });

  it('accept() adds the suggested attraction via TripService.addAttraction and returns to idle (even mid-sniff, before the reveal)', async () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);
    trip.addStop(PARIS, '01/07/2026', '05/07/2026');
    const stop = trip.stops()[0];
    trip.addAttraction(stop.stopId, 'paris_0', '09:00', '02/07/2026');

    const promise = service.trigger(stop.stopId, 'paris_0');
    await flushAsync();
    http.expectOne(r => r.url.includes('/ai/suggest-companion'))
      .flush({ attractionId: 'paris_1', date: '02/07/2026', startTime: '11:00', endTime: '12:00', reason: 'x' });
    await promise;
    expect(service.state()).toBe('sniffing'); // reveal delay hasn't elapsed — accept() must still work

    service.accept();

    const updatedStop = trip.stops()[0];
    expect(updatedStop.selectedAttractions.some(a => a.attractionId === 'paris_1')).toBe(true);
    expect(service.state()).toBe('idle');
    expect(service.suggestion()).toBeNull();
  });

  it('dismiss() returns to idle without adding anything', async () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);
    trip.addStop(PARIS, '01/07/2026', '05/07/2026');
    const stop = trip.stops()[0];
    trip.addAttraction(stop.stopId, 'paris_0', '09:00', '02/07/2026');

    const promise = service.trigger(stop.stopId, 'paris_0');
    await flushAsync();
    http.expectOne(r => r.url.includes('/ai/suggest-companion'))
      .flush({ attractionId: 'paris_1', date: '02/07/2026', startTime: '11:00', endTime: '12:00', reason: 'x' });
    await promise;

    service.dismiss();

    const updatedStop = trip.stops()[0];
    expect(updatedStop.selectedAttractions.some(a => a.attractionId === 'paris_1')).toBe(false);
    expect(service.state()).toBe('idle');
  });

  it('dismiss() cancels the pending reveal timer so it never fires late and flips state back to suggesting', async () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);
    trip.addStop(PARIS, '01/07/2026', '05/07/2026');
    const stop = trip.stops()[0];
    trip.addAttraction(stop.stopId, 'paris_0', '09:00', '02/07/2026');

    const promise = service.trigger(stop.stopId, 'paris_0');
    await flushAsync();
    jest.useFakeTimers();
    http.expectOne(r => r.url.includes('/ai/suggest-companion'))
      .flush({ attractionId: 'paris_1', date: '02/07/2026', startTime: '11:00', endTime: '12:00', reason: 'x' });
    await promise;
    expect(service.state()).toBe('sniffing');

    service.dismiss(); // e.g. the user closes the app / navigates away mid-sniff

    jest.advanceTimersByTime(5000); // well past the 2.5 s reveal delay
    expect(service.state()).toBe('idle'); // never jumps to 'suggesting' after being dismissed

    jest.useRealTimers();
  });

  it('starts with boosted() false and boostExpiresAt() null', () => {
    expect(service.boosted()).toBe(false);
    expect(service.boostExpiresAt()).toBeNull();
  });

  it('refreshBoostStatus() sets boosted + boostExpiresAt (~24h out) from the API when logged in', () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);
    const before = Date.now();
    service.refreshBoostStatus();
    http.expectOne(r => r.url.includes('/companion/status')).flush({ boosted: true, secondsRemaining: 86400 });

    expect(service.boosted()).toBe(true);
    expect(service.boostExpiresAt()).not.toBeNull();
    expect(service.boostExpiresAt()!).toBeGreaterThanOrEqual(before + 86400 * 1000);
    expect(service.boostExpiresAt()!).toBeLessThanOrEqual(Date.now() + 86400 * 1000);
  });

  it('refreshBoostStatus() sets boosted false and boostExpiresAt null when the API reports no boost', () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);
    service.refreshBoostStatus();
    http.expectOne(r => r.url.includes('/companion/status')).flush({ boosted: false, secondsRemaining: 0 });
    expect(service.boosted()).toBe(false);
    expect(service.boostExpiresAt()).toBeNull();
  });

  it('refreshBoostStatus() sets boosted false without a request when logged out', () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(false as any);
    service.refreshBoostStatus();
    http.expectNone(r => r.url.includes('/companion/status'));
    expect(service.boosted()).toBe(false);
    expect(service.boostExpiresAt()).toBeNull();
  });

  it('boost() calls the API, sets boostExpiresAt ~24h out, and spends karma locally', () => {
    const before = Date.now();
    service.boost();
    http.expectOne(r => r.url.includes('/companion/boost')).flush({ boosted: true, secondsRemaining: 86400 });

    expect(service.boosted()).toBe(true);
    expect(service.boostExpiresAt()!).toBeGreaterThanOrEqual(before + 86400 * 1000);
  });

  it('clear() resets boostExpiresAt and any open suggestion', async () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);
    service.boost();
    http.expectOne(r => r.url.includes('/companion/boost')).flush({ boosted: true, secondsRemaining: 86400 });

    trip.addStop(PARIS, '01/07/2026', '05/07/2026');
    const stop = trip.stops()[0];
    trip.addAttraction(stop.stopId, 'paris_0', '09:00', '02/07/2026');
    const promise = service.trigger(stop.stopId, 'paris_0');
    await flushAsync();
    http.expectOne(r => r.url.includes('/ai/suggest-companion'))
      .flush({ attractionId: 'paris_1', date: '02/07/2026', startTime: '11:00', endTime: '12:00', reason: 'x' });
    await promise;

    service.clear();

    expect(service.boosted()).toBe(false);
    expect(service.boostExpiresAt()).toBeNull();
    expect(service.state()).toBe('idle');
    expect(service.suggestion()).toBeNull();
  });
});
