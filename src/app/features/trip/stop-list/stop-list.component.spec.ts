import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StopListComponent } from './stop-list.component';
import { TripService } from '../trip.service';
import { DestinationModalService } from '../../destination/destination-modal.service';
import { City } from '../../../core/models/city.model';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };

// jsdom has no matchMedia — DeviceService (injected by StopListComponent) needs one.
// Mirrors the helper already used in day-timeline.component.spec.ts.
function installMatchMediaMock(initialMatches: boolean): void {
  const mql = {
    matches: initialMatches,
    media: '(max-width: 768px)',
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  (window as any).matchMedia = () => mql;
}

describe('StopListComponent — mobile add-attraction trigger', () => {
  let component: StopListComponent;
  let trip: TripService;
  let destModal: DestinationModalService;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(true); // mobile viewport
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    destModal = TestBed.inject(DestinationModalService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    component = TestBed.createComponent(StopListComponent).componentInstance;
  });

  it('activates the stop and opens the destination modal', () => {
    const stopId = trip.stops()[0].stopId;

    component.openAddAttraction(stopId);

    expect(trip.activeId()).toBe(stopId);
    expect(destModal.isOpen()).toBe(true);
  });
});
