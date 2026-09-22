import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CityGuidePromoComponent } from './city-guide-promo.component';
import type { Attraction } from '../../../core/models/comment.model';

const att = (i: number, imageUrl?: string): Attraction => ({
  id: `sitio_${i}`, name: `Sitio ${i}`, type: 'Museo', category: 'poi', active: true, icon: '🖼️', bg: '#fff',
  rating: 4.5, estimatedMinutes: 60, imageUrl,
  description: 'Descripción de prueba suficientemente larga para el umbral de sesenta caracteres.',
});

// Two reviewed guides (madrid, roma) + one unreviewed (paris) — only the reviewed two should
// ever appear in the rotation. `getAttractions` is keyed by city id so each guide's teaser
// photo can differ.
jest.mock('../../../data/city-guides.data', () => ({
  CITY_GUIDES: [
    { slug: 'madrid', cityId: 'madrid', displayName: 'Madrid', wave: 1, timeZone: 'Europe/Madrid', reviewed: true },
    { slug: 'roma', cityId: 'rome', displayName: 'Roma', wave: 1, timeZone: 'Europe/Rome', reviewed: true },
    { slug: 'paris', cityId: 'paris', displayName: 'París', wave: 1, timeZone: 'Europe/Paris', reviewed: false },
  ],
}));

jest.mock('../../../data/attractions.data', () => ({
  getAttractions: (city: { id: string }) =>
    city.id === 'madrid' ? [att(1, 'https://upload.wikimedia.org/madrid.jpg')] : [att(2)],
}));

describe('CityGuidePromoComponent', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [CityGuidePromoComponent],
      providers: [provideRouter([])],
    });
    const f = TestBed.createComponent(CityGuidePromoComponent);
    f.detectChanges();
    return f;
  }

  afterEach(() => jest.useRealTimers());

  it('shows only reviewed guides, starting with the first one', () => {
    const el: HTMLElement = setup().nativeElement;
    const link = el.querySelector('.nav-guide-promo') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(el.textContent).toContain('Madrid');
    expect(el.textContent).not.toContain('París');
  });

  it('links to the active guide\'s /ciudad/:slug page', () => {
    const el: HTMLElement = setup().nativeElement;
    const link = el.querySelector('.nav-guide-promo') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/ciudad/madrid');
  });

  it('rotates to the next reviewed guide every 5s', () => {
    jest.useFakeTimers();
    const f = setup();
    let el: HTMLElement = f.nativeElement;
    expect(el.textContent).toContain('Madrid');

    jest.advanceTimersByTime(5000);
    f.detectChanges();
    el = f.nativeElement;
    const link = el.querySelector('.nav-guide-promo') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/ciudad/roma');

    jest.advanceTimersByTime(5000);
    f.detectChanges();
    expect((el.querySelector('.nav-guide-promo') as HTMLAnchorElement).getAttribute('href')).toBe('/ciudad/madrid');
  });

  it('clears its rotation timer on destroy', () => {
    jest.useFakeTimers();
    const clearSpy = jest.spyOn(globalThis, 'clearInterval');
    const f = setup();
    f.destroy();
    expect(clearSpy).toHaveBeenCalled();
  });
});
