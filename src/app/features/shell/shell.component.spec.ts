import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ShellComponent } from './shell.component';
import { TripService } from '../trip/trip.service';

describe('ShellComponent', () => {
  beforeEach(() => localStorage.clear());

  function setup(stopsLen: number) {
    (window as any).matchMedia = (window as any).matchMedia ?? (() => ({
      matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {},
    }));
    (global as any).IntersectionObserver = (global as any).IntersectionObserver ?? class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(ShellComponent);
    if (stopsLen > 0) {
      const trip = TestBed.inject(TripService);
      trip.restoreStops(
        Array.from({ length: stopsLen }, (_, i) => ({
          stopId: `stop-${i}`, cityId: 'paris', checkIn: '01/07/2026', checkOut: '05/07/2026', selectedAttractions: [],
        })),
        null,
        [],
      );
    }
    fixture.detectChanges();
    return fixture;
  }

  it('renders the landing scroll container when there are no stops', () => {
    const el = setup(0).nativeElement as HTMLElement;
    expect(el.querySelector('.landing-scroll')).toBeTruthy();
    expect(el.querySelector('.layout')).toBeFalsy();
  });

  it('renders the app layout when stops exist', () => {
    const el = setup(2).nativeElement as HTMLElement;
    expect(el.querySelector('.layout')).toBeTruthy();
    expect(el.querySelector('.landing-scroll')).toBeFalsy();
  });
});
