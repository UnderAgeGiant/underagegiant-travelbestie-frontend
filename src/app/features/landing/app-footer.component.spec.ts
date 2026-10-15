import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppFooterComponent } from './app-footer.component';

jest.mock('../../data/city-guides.data', () => {
  const actual = jest.requireActual('../../data/city-guides.data');
  return { ...actual, CITY_GUIDES: [
    { ...actual.CITY_GUIDES[0], slug: 'lima', cityId: 'lima', displayName: 'Lima', reviewed: true },
    { ...actual.CITY_GUIDES[0], slug: 'mendoza', cityId: 'mendoza', displayName: 'Mendoza', reviewed: true },
    { ...actual.CITY_GUIDES[0], slug: 'cusco', cityId: 'cusco', displayName: 'Cusco', reviewed: true },
    { ...actual.CITY_GUIDES[0], slug: 'rio-de-janeiro', cityId: 'rio', displayName: 'Río', reviewed: true },
    { ...actual.CITY_GUIDES[0], slug: 'florencia', cityId: 'florence', displayName: 'Florencia', reviewed: true },
    { ...actual.CITY_GUIDES[0], slug: 'londres', cityId: 'london', displayName: 'Londres', reviewed: false },
    { ...actual.CITY_GUIDES[0], slug: 'madrid', cityId: 'madrid', displayName: 'Madrid', reviewed: true },
  ] };
});

describe('AppFooterComponent — clickable tagline (feedback #2)', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [AppFooterComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(AppFooterComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('emits createPlan when "Planifica" is clicked', () => {
    const fixture = setup();
    const spy = jest.fn();
    fixture.componentInstance.createPlan.subscribe(spy);
    (fixture.nativeElement.querySelector('.landing-footer-tagline-word[data-word="planifica"]') as HTMLElement).click();
    expect(spy).toHaveBeenCalled();
  });

  it('emits viewMyTrips when "Comparte" is clicked', () => {
    const fixture = setup();
    const spy = jest.fn();
    fixture.componentInstance.viewMyTrips.subscribe(spy);
    (fixture.nativeElement.querySelector('.landing-footer-tagline-word[data-word="comparte"]') as HTMLElement).click();
    expect(spy).toHaveBeenCalled();
  });

  it('emits exploreFeatured when "Explora" is clicked', () => {
    const fixture = setup();
    const spy = jest.fn();
    fixture.componentInstance.exploreFeatured.subscribe(spy);
    (fixture.nativeElement.querySelector('.landing-footer-tagline-word[data-word="explora"]') as HTMLElement).click();
    expect(spy).toHaveBeenCalled();
  });
});

describe('AppFooterComponent — destination guide links (Task 11)', () => {
  const render = () => {
    TestBed.configureTestingModule({ imports: [AppFooterComponent], providers: [provideRouter([])] });
    const f = TestBed.createComponent(AppFooterComponent);
    f.detectChanges();
    return f.nativeElement as HTMLElement;
  };
  const hrefs = (el: Element) => Array.from(el.querySelectorAll('a[href^="/ciudad/"]')).map(a => a.getAttribute('href'));

  it('groups reviewed guides by continent, max 3 each, in priority order then manifest order', () => {
    const blocks = Array.from(render().querySelectorAll('.landing-footer-continent'));
    expect(blocks.map(b => b.getAttribute('data-continent'))).toEqual(['south_america', 'europe']);
    expect(hrefs(blocks[0])).toEqual(['/ciudad/rio-de-janeiro', '/ciudad/cusco', '/ciudad/lima']);
    expect(hrefs(blocks[1])).toEqual(['/ciudad/madrid', '/ciudad/florencia']);
  });

  it('links each continent heading to its /guides section and ends with "Ver todas las guías"', () => {
    const el = render();
    const heads = Array.from(el.querySelectorAll('.landing-footer-continent-head')).map(a => a.getAttribute('href'));
    expect(heads).toEqual(['/guides#south_america', '/guides#europe']);
    const all = el.querySelector('.landing-footer-all-guides')!;
    expect(all.getAttribute('href')).toBe('/guides');
    expect(all.textContent).toContain('Ver todas las guías');
  });

  it('hides the guides column when showGuides is false', () => {
    TestBed.configureTestingModule({ imports: [AppFooterComponent], providers: [provideRouter([])] });
    const f = TestBed.createComponent(AppFooterComponent);
    f.componentRef.setInput('showGuides', false);
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).textContent).not.toContain('Guías de destinos');
  });
});
