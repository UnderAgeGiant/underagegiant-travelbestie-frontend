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
