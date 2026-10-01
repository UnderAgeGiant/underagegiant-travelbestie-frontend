import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { landingGuard } from './landing.guard';
import { TripService } from '../trip/trip.service';

@Component({ template: '' }) class Blank {}

describe('landingGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        provideRouter([
          { path: '', canActivate: [landingGuard], component: Blank },
          { path: 'plan', component: Blank },
          { path: 'about', component: Blank },
        ]),
      ],
    });
  });

  const withTrip = () => TestBed.inject(TripService).restoreStops(
    [{ stopId: 's1', cityId: 'paris', checkIn: '01/07/2026', checkOut: '05/07/2026', selectedAttractions: [] }], null, []);

  it('first navigation to / with a trip in progress → /plan (returning user lands in the editor)', async () => {
    withTrip();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/plan');
  });

  it('first navigation to / with no trip → stays on the landing', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('a LATER navigation to / (e.g. browser Back from /plan) shows the landing even with a trip — no redirect loop', async () => {
    withTrip();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/about');
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('keeps ?addCity= on the landing (city guide hand-off) even with a trip', async () => {
    withTrip();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/?addCity=paris');
    expect(TestBed.inject(Router).url).toBe('/?addCity=paris');
  });
});
