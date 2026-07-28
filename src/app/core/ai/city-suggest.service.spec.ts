import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CitySuggestService } from './city-suggest.service';
import { KarmaModalService } from '../karma/karma-modal.service';
import { TripService } from '../../features/trip/trip.service';
import { City } from '../models/city.model';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };

// AttractionCatalogService.getCityCatalog() resolves via dynamic import() — flush the
// macrotask queue the same way api.service.spec.ts does for planTrip()/suggestTrips().
function flushAsync(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe('CitySuggestService', () => {
  let service: CitySuggestService;
  let trip: TripService;
  let karmaModal: KarmaModalService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()), provideHttpClientTesting(),
        { provide: 'ENV', useValue: { useMocks: false, apiUrl: 'http://localhost:3000' } },
      ],
    });
    service    = TestBed.inject(CitySuggestService);
    trip       = TestBed.inject(TripService);
    karmaModal = TestBed.inject(KarmaModalService);
    http       = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('opens the cloud for the requested stop, then loads suggestions from the response', async () => {
    trip.addStop(PARIS, '01/07/2026', '05/07/2026');
    const stop = trip.stops()[0];

    service.request(stop);
    expect(service.openForStopId()).toBe(stop.stopId);
    expect(service.loading()).toBe(true);

    await flushAsync();

    const req = http.expectOne(r => r.url.includes('/ai/suggest-attractions') && r.method === 'POST');
    expect(req.request.body.cityId).toBe('paris');
    expect(req.request.body.checkIn).toBe('01/07/2026');
    expect(req.request.body.checkOut).toBe('05/07/2026');
    req.flush({ suggestions: [{ attractionId: 'paris_0', date: '02/07/2026', startTime: '10:00', endTime: '11:00', reason: 'Cerca de tu hotel' }] });

    expect(service.loading()).toBe(false);
    expect(service.suggestions().length).toBe(1);
    expect(service.suggestions()[0].attractionId).toBe('paris_0');
  });

  it('addAll adds every suggestion via TripService.addAttraction and closes the cloud', async () => {
    trip.addStop(PARIS, '01/07/2026', '05/07/2026');
    const stop = trip.stops()[0];

    service.request(stop);
    await flushAsync();
    http.expectOne(r => r.url.includes('/ai/suggest-attractions'))
      .flush({ suggestions: [{ attractionId: 'paris_0', date: '02/07/2026', startTime: '10:00', endTime: '11:00', reason: 'Cerca' }] });

    service.addAll(stop.stopId, 'paris');

    const updatedStop = trip.stops()[0];
    expect(updatedStop.selectedAttractions.length).toBe(1);
    expect(updatedStop.selectedAttractions[0].attractionId).toBe('paris_0');
    expect(updatedStop.selectedAttractions[0].startTime).toBe('10:00');
    expect(service.openForStopId()).toBeNull();
    expect(service.suggestions().length).toBe(0);
  });

  it('routes a 402 response through KarmaModalService and closes the cloud', async () => {
    trip.addStop(PARIS, '01/07/2026', '05/07/2026');
    const stop = trip.stops()[0];

    service.request(stop);
    await flushAsync();
    http.expectOne(r => r.url.includes('/ai/suggest-attractions'))
      .flush({ error: 'Insufficient karma: need 2, have 0' }, { status: 402, statusText: 'Payment Required' });

    expect(karmaModal.insufficientOpen()).toBe(true);
    expect(service.openForStopId()).toBeNull();
  });

  it('close() clears suggestions, error, and the open stop id', async () => {
    trip.addStop(PARIS, '01/07/2026', '05/07/2026');
    const stop = trip.stops()[0];
    service.request(stop);
    await flushAsync();
    http.expectOne(r => r.url.includes('/ai/suggest-attractions'))
      .flush({ suggestions: [{ attractionId: 'paris_0', date: '02/07/2026', startTime: '10:00', endTime: '11:00', reason: 'x' }] });

    service.close();

    expect(service.openForStopId()).toBeNull();
    expect(service.suggestions().length).toBe(0);
    expect(service.error()).toBeNull();
  });
});
