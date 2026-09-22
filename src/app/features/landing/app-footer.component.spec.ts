import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppFooterComponent } from './app-footer.component';

jest.mock('../../data/city-guides.data', () => {
  const actual = jest.requireActual('../../data/city-guides.data');
  return { ...actual, CITY_GUIDES: [
    { ...actual.CITY_GUIDES[0], slug: 'madrid', displayName: 'Madrid', reviewed: true },
    { ...actual.CITY_GUIDES[0], slug: 'hidden', displayName: 'Oculta', reviewed: false },
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
  it('links every reviewed guide with a real anchor and hides unreviewed ones', () => {
    TestBed.configureTestingModule({ imports: [AppFooterComponent], providers: [provideRouter([])] });
    const f = TestBed.createComponent(AppFooterComponent);
    f.detectChanges();
    const links = Array.from((f.nativeElement as HTMLElement).querySelectorAll('a[href^="/ciudad/"]')) as HTMLAnchorElement[];
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/ciudad/madrid']);
  });
});
