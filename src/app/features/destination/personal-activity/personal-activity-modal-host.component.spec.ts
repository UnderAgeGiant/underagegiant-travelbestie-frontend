import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PersonalActivityModalHostComponent } from './personal-activity-modal-host.component';
import { PersonalActivityModalService } from './personal-activity-modal.service';
import { TripService } from '../../trip/trip.service';
import { City } from '../../../core/models/city.model';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };

describe('PersonalActivityModalHostComponent (Feature 71)', () => {
  let fixture: ComponentFixture<PersonalActivityModalHostComponent>;
  let host: PersonalActivityModalHostComponent;
  let modal: PersonalActivityModalService;
  let trip: TripService;
  let stopId: string;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [PersonalActivityModalHostComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    modal = TestBed.inject(PersonalActivityModalService);
    trip.addStop(PARIS, '01/10/2026', '03/10/2026');
    stopId = trip.stops()[0].stopId;
    fixture = TestBed.createComponent(PersonalActivityModalHostComponent);
    host = fixture.componentInstance;
  });

  it('add mode → renders the modal; confirm adds a personal entry and closes', () => {
    modal.openAdd(stopId, 'lunch');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-plan-time-modal')).not.toBeNull();
    host.onConfirmed({ startTime: '13:00', date: '01/10/2026', title: 'Almuerzo', mapsUrl: '', isPrivate: false });
    expect(trip.selectedAttractionsFor(stopId).at(-1)).toMatchObject({ activityType: 'lunch', title: 'Almuerzo', startTime: '13:00' });
    expect(modal.state()).toBeNull();
  });

  it('edit mode → confirm updates the entry', () => {
    trip.addPersonalActivity(stopId, { activityType: 'walk', title: 'Paseo', isPrivate: false, startTime: '10:00' });
    const id = trip.selectedAttractionsFor(stopId).at(-1)!.entryId;
    modal.openEdit(stopId, id);
    fixture.detectChanges();
    host.onConfirmed({ startTime: '11:00', date: '01/10/2026', title: 'Paseo largo', isPrivate: true });
    expect(trip.selectedAttractionsFor(stopId).at(-1)).toMatchObject({ entryId: id, title: 'Paseo largo', isPrivate: true, startTime: '11:00' });
    expect(modal.state()).toBeNull();
  });

  it('edit mode → remove deletes the entry', () => {
    trip.addPersonalActivity(stopId, { activityType: 'walk', title: 'Paseo', isPrivate: false, startTime: '10:00' });
    const id = trip.selectedAttractionsFor(stopId).at(-1)!.entryId;
    modal.openEdit(stopId, id);
    fixture.detectChanges();
    host.onRemove();
    expect(trip.selectedAttractionsFor(stopId).some(a => a.entryId === id)).toBe(false);
  });

  it('edit mode for a vanished entry renders nothing', () => {
    modal.openEdit(stopId, 'missing');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-plan-time-modal')).toBeNull();
  });
});
