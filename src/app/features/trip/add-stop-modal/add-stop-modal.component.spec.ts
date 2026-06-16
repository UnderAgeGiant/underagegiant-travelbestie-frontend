import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AddStopModalComponent } from './add-stop-modal.component';
import { TripService } from '../trip.service';
import { City } from '../../../core/models/city.model';

const PARIS: City  = { id: 'paris',  name: 'Paris',  country: 'France', flag: '🇫🇷', region: 'europe' };
const LONDON: City = { id: 'london', name: 'London', country: 'United Kingdom', flag: '🇬🇧', region: 'europe' };

describe('AddStopModalComponent — default check-in date', () => {
  let trip: TripService;
  let component: AddStopModalComponent;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AddStopModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    component = TestBed.createComponent(AddStopModalComponent).componentInstance;
  });

  it('defaults to an empty check-in when there are no existing stops', () => {
    expect(component.defaultCheckIn()).toBe('');
  });

  it("defaults to the last stop's checkout date when stops exist", () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    expect(component.defaultCheckIn()).toBe('05/06/2026');
  });

  it('seeds checkIn with the default when a city is selected', () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    component.onCityChange(LONDON);
    expect(component.selectedCity()).toBe(LONDON);
    expect(component.checkIn()).toBe('05/06/2026');
  });
});
