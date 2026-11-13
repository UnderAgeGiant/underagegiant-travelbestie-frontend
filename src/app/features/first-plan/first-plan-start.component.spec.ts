import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FirstPlanStartComponent } from './first-plan-start.component';
import { AuthService } from '../../core/auth/auth.service';
import { ApiService } from '../../core/api/api.service';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';
import { NavFacadeService } from '../nav/nav-facade.service';
import { TripService } from '../trip/trip.service';
import { FeaturedTrip } from '../../core/models/featured-trip.model';

(window as any).matchMedia = (window as any).matchMedia ?? (() => ({
  matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {},
}));

const FEATURED: FeaturedTrip[] = [{
  id: 'share-1', tripName: 'Italia clásica', ownerName: 'Ana', ownerEmail: 'a@t.com', createdAt: '', planId: 'p',
  transits: [],
  stops: [
    { cityId: 'rome', checkIn: '01/06/2026', checkOut: '03/06/2026', selectedAttractions: [{ attractionId: 'rome_0' }, { attractionId: 'rome_1' }] },
    { cityId: 'florence', checkIn: '03/06/2026', checkOut: '05/06/2026', selectedAttractions: [{ attractionId: 'florence_0' }] },
  ],
}];

describe('FirstPlanStartComponent (/first-plan)', () => {
  function setup(gift: boolean, featured$ = of(FEATURED)) {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [FirstPlanStartComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
    });
    const auth = TestBed.inject(AuthService);
    auth.setTokens('t', { name: 'Ana', email: 'ana@test.com', firstPlanAvailable: gift });
    const api = TestBed.inject(ApiService);
    jest.spyOn(api, 'getFeatured').mockReturnValue(featured$);
    const router = TestBed.inject(Router);
    const nav = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const facade = TestBed.inject(NavFacadeService);
    const openEditor = jest.spyOn(facade, 'openEditor').mockImplementation(() => {});
    const fixture = TestBed.createComponent(FirstPlanStartComponent);
    fixture.detectChanges();
    return { el: fixture.nativeElement as HTMLElement, fixture, auth, api, nav, openEditor };
  }

  it('redirects home without the gift', () => {
    const { nav } = setup(false);
    expect(nav).toHaveBeenCalledWith('/', { replaceUrl: true });
  });

  it('renders one card per featured plan with days, cities and places', () => {
    const { el } = setup(true);
    const cards = el.querySelectorAll('.fp-card');
    expect(cards.length).toBe(1);
    const text = cards[0].textContent!.replace(/\s+/g, ' ');
    expect(text).toContain('Italia clásica');
    expect(text).toContain('5 días');
    expect(text).toContain('2 ciudades');
    expect(text).toContain('3 lugares');
  });

  it('Usar gratis clones with source featured, registers the plan and opens the editor', () => {
    const { el, fixture, auth, api, openEditor } = setup(true);
    const clone = jest.spyOn(api, 'cloneSharedTrip').mockReturnValue(of({ id: 'c1', title: 'Italia clásica', stops: FEATURED[0].stops as any, transits: [] }));
    const register = jest.spyOn(TestBed.inject(SavedPlansService), 'register');
    (el.querySelector('.fp-card .btn-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(clone).toHaveBeenCalledWith('share-1', 'featured');
    expect(register).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', name: 'Italia clásica' }));
    expect(TestBed.inject(TripService).loadedPlanId()).toBe('c1');
    expect(auth.firstPlanAvailable()).toBe(false);
    expect(openEditor).toHaveBeenCalled();
  });

  it('empty featured shows only the AI button and the link', () => {
    const { el } = setup(true, of([]));
    expect(el.querySelector('.fp-card')).toBeNull();
    expect(el.querySelector('a.fp-ai[href="/ai-planning"]')).not.toBeNull();
    expect(el.querySelector('a.fp-scratch[href="/"]')).not.toBeNull();
  });

  it('a failed featured load behaves like an empty list', () => {
    const { el } = setup(true, throwError(() => new Error('down')));
    expect(el.querySelector('.fp-card')).toBeNull();
    expect(el.querySelector('a.fp-ai')).not.toBeNull();
  });
});
