import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { FeaturedSlideshowComponent } from './featured-slideshow.component';
import { FeaturedTrip } from '../../core/models/featured-trip.model';

const TRIP: FeaturedTrip = {
  id: 'share-1', tripName: 'Roma en 5 días', ownerName: 'Ana', ownerEmail: 'a@b.com',
  createdAt: '2026-07-01T00:00:00Z', planId: 'plan-1', transits: [],
  stops: [{ cityId: 'rome', checkIn: '01/06/2026', checkOut: '05/06/2026', selectedAttractions: [] }],
};

describe('FeaturedSlideshowComponent — "Destacado" badge', () => {
  let fixture: ComponentFixture<FeaturedSlideshowComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [FeaturedSlideshowComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FeaturedSlideshowComponent);
  });

  afterEach(() => httpMock.verify());

  it('shows a "¡Destacado!" badge on each featured trip card', () => {
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/featured')).flush([TRIP]);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.s2-featured-badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('Destacado');
  });

  it('renders one badge per slide when there are multiple featured trips', () => {
    const trip2: FeaturedTrip = { ...TRIP, id: 'share-2', tripName: 'Tokio en 7 días' };
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/featured')).flush([TRIP, trip2]);
    fixture.detectChanges();

    const badges = fixture.nativeElement.querySelectorAll('.s2-featured-badge');
    expect(badges.length).toBe(2);
  });

  it('renders nothing (including no badge) when there are no featured trips', () => {
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/featured')).flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.s2-featured-badge')).toBeNull();
  });
});
