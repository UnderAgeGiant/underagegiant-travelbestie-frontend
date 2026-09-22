import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
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
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
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

describe('AddStopModalComponent — presetCityId (city guide "plan this city" pre-fill)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AddStopModalComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
  });

  it('pre-selects the city when presetCityId matches a known city', () => {
    const fixture = TestBed.createComponent(AddStopModalComponent);
    fixture.componentRef.setInput('presetCityId', 'madrid');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedCity()?.id).toBe('madrid');
  });

  it('leaves selectedCity null for an unknown id', () => {
    const fixture = TestBed.createComponent(AddStopModalComponent);
    fixture.componentRef.setInput('presetCityId', 'atlantis');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedCity()).toBeNull();
  });
});

describe('AddStopModalComponent — backdrop close guard', () => {
  let component: AddStopModalComponent;
  const backdropEl = { id: 'backdrop' } as unknown as EventTarget;
  const childEl = { id: 'child' } as unknown as EventTarget;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AddStopModalComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    component = TestBed.createComponent(AddStopModalComponent).componentInstance;
  });

  function event(target: EventTarget, currentTarget: EventTarget): MouseEvent {
    return { target, currentTarget } as unknown as MouseEvent;
  }

  it('closes when both mousedown and click land directly on the backdrop', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));

    component.onBackdropMouseDown(event(backdropEl, backdropEl));
    component.onBackdropClick(event(backdropEl, backdropEl));

    expect(closed).toBe(true);
  });

  it('does not close on a ghost click whose mousedown started on a child element (e.g. a flatpickr day cell)', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));

    component.onBackdropMouseDown(event(childEl, backdropEl));
    component.onBackdropClick(event(backdropEl, backdropEl));

    expect(closed).toBe(false);
  });

  it('does not close when the click itself lands on a child element', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));

    component.onBackdropMouseDown(event(backdropEl, backdropEl));
    component.onBackdropClick(event(childEl, backdropEl));

    expect(closed).toBe(false);
  });
});
