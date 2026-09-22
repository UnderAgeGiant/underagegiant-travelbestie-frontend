import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CityGuideComponent } from './city-guide.component';
import { NavShellComponent } from '../nav/nav-shell.component';
import { ProfileComponent } from '../profile/profile.component';
import { ApiService } from '../../core/api/api.service';
import { SeoService } from '../../core/seo/seo.service';
import type { Attraction } from '../../core/models/comment.model';

const att = (i: number, o: Partial<Attraction> = {}): Attraction => ({
  id: `madrid_${i}`, name: `Sitio ${i}`, type: 'Museo', category: 'poi', active: true, icon: '🖼️', bg: '#fff',
  rating: 4.1 + (i % 8) / 10, estimatedMinutes: 60, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/F.jpg/1280px-F.jpg',
  description: 'Descripción de prueba suficientemente larga para el umbral de sesenta caracteres.',
  sourceUrl: `https://es.wikipedia.org/wiki/Sitio_${i}`, ...o,
});
const mockData = [...Array.from({ length: 40 }, (_, i) => att(i)), att(99, { name: 'Toledo', dayTrip: true, rating: 4.8 })];
// Mutable so individual tests (e.g. the day-trips scroll-box test) can swap in a bigger fixture
// without leaking into other tests — reset to `mockData` in beforeEach below.
let activeData: Attraction[] = mockData;

jest.mock('../../data/attractions.data', () => ({ getAttractions: () => activeData }));

// Fixed madrid manifest entry — independent of the real one's current `reviewed` flag (which
// changes as guides get approved) so this spec's "unreviewed → noindex" assertion stays stable.
// (Object literal duplicated inline, not a shared outer const: jest hoists jest.mock() factories
// above even top-level const declarations that precede them in source order.)
jest.mock('../../data/city-guides.data', () => {
  const guide = {
    slug: 'madrid', cityId: 'madrid', displayName: 'Madrid', wave: 1, timeZone: 'Europe/Madrid', reviewed: false,
    intro: 'x'.repeat(90), bestTime: 'b', gettingThere: 'g', tips: ['a', 'b', 'c'],
    faq: [{ q: '¿Uno?', a: 'Respuesta uno suficientemente larga para pasar el umbral.' },
          { q: '¿Dos?', a: 'Respuesta dos suficientemente larga para pasar el umbral.' },
          { q: '¿Tres?', a: 'Respuesta tres suficientemente larga para pasar el umbral.' }],
  };
  return {
    CITY_GUIDES: [guide],
    guideBySlug: (slug: string) => slug === 'madrid' ? guide : undefined,
    guideByCityId: (cityId: string) => cityId === 'madrid' ? guide : undefined,
  };
});

describe('CityGuideComponent (/ciudad/madrid)', () => {
  const seo = { apply: jest.fn(), reset: jest.fn() };
  const api = { getSeoCityPlans: jest.fn() };

  function create(plans: any[] = []) {
    api.getSeoCityPlans.mockReturnValue(of({ items: plans }));
    TestBed.configureTestingModule({
      imports: [CityGuideComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ slug: 'madrid' })) } },
        { provide: ApiService, useValue: api },
        { provide: SeoService, useValue: seo },
      ],
    });
    TestBed.overrideComponent(CityGuideComponent, {
      remove: { imports: [NavShellComponent, ProfileComponent] },
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    const f = TestBed.createComponent(CityGuideComponent);
    f.detectChanges();
    return f;
  }

  beforeEach(() => { jest.clearAllMocks(); TestBed.resetTestingModule(); activeData = mockData; });

  it('renders the h1, the Chile facts block and the editorial sections', () => {
    const el: HTMLElement = create().nativeElement;
    expect(el.querySelector('h1')?.textContent).toContain('Madrid');
    expect(el.querySelector('.cg-facts')).not.toBeNull();
    expect(el.querySelectorAll('.cg-faq details').length).toBeGreaterThanOrEqual(3);
  });

  it('shows must-see cards with a Wikipedia attribution link, and separates day trips', () => {
    const el: HTMLElement = create().nativeElement;
    expect(el.querySelector('.cg-must .cg-card a[href^="https://es.wikipedia.org/"]')).not.toBeNull();
    expect(el.querySelector('.cg-daytrips')?.textContent).toContain('Toledo');
    expect(el.querySelector('.cg-must')?.textContent).not.toContain('Toledo');
  });

  it('credits Commons photos', () => {
    const el: HTMLElement = create().nativeElement;
    expect(el.querySelector('a[href^="https://commons.wikimedia.org/wiki/File:"]')).not.toBeNull();
  });

  it('applies the guide SEO head (noindex while unreviewed) and loads real plans by city id', () => {
    create();
    const page = seo.apply.mock.calls[0][0];
    expect(page.path).toBe('/ciudad/madrid');
    expect(page.noindex).toBe(true);
    expect(api.getSeoCityPlans).toHaveBeenCalledWith('madrid');
  });

  it('renders real plans as crawlable links, and hides the block when there are none', () => {
    const withPlans: HTMLElement = create([{ id: 'abc', tripName: 'Europa', cities: ['Madrid', 'Rome'], attractionCount: 9, favoriteCount: 3 }]).nativeElement;
    expect(withPlans.querySelector('.cg-plans a[href="/shared/abc"]')).not.toBeNull();
    TestBed.resetTestingModule();
    const none: HTMLElement = create([]).nativeElement;
    expect(none.querySelector('.cg-plans')).toBeNull();
  });

  it('the CTA sends the visitor to the planner with the city pre-selected', () => {
    const f = create();
    const nav = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    (f.nativeElement.querySelector('.cg-cta') as HTMLButtonElement).click();
    expect(nav).toHaveBeenCalledWith(['/'], { queryParams: { addCity: 'madrid' } });
  });

  it('repeats the plan CTA at the end of the guide, after the FAQ', () => {
    const el: HTMLElement = create().nativeElement;
    expect(el.querySelectorAll('.cg-cta').length).toBe(2);
    const endCta = el.querySelector('.cg-cta-end .cg-cta');
    const faq = el.querySelector('.cg-faq');
    expect(endCta).not.toBeNull();
    expect(faq).not.toBeNull();
    expect(faq!.compareDocumentPosition(endCta!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders the country flag via app-flag-icon instead of a raw emoji in the eyebrow', () => {
    const el: HTMLElement = create().nativeElement;
    expect(el.querySelector('.cg-eyebrow app-flag-icon')).not.toBeNull();
    expect(el.querySelector('.cg-eyebrow')?.textContent).toContain('Guía de viaje');
  });

  it('titles the best-time-to-go block "Cuándo es mejor ir"', () => {
    const el: HTMLElement = create().nativeElement;
    expect(el.querySelector('.cg-practical')?.textContent).toContain('Cuándo es mejor ir');
  });

  it('boxes the day-trips list once it exceeds 6 items, matching the category-list treatment', () => {
    activeData = [...Array.from({ length: 40 }, (_, i) => att(i)), ...Array.from({ length: 8 }, (_, i) => att(200 + i, { name: `Excursión ${i}`, dayTrip: true }))];
    const el: HTMLElement = create().nativeElement;
    expect(el.querySelector('.cg-daytrips .cg-scroll-box')).not.toBeNull();
    expect(el.querySelector('.cg-daytrips .cg-scroll-hint')).not.toBeNull();
  });
});
