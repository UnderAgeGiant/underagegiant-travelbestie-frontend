import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LandingAboutComponent } from './landing-about.component';

// Mocked (rather than relying on the real manifest's `reviewed` flags, which change independently
// as guides launch) so this spec stays stable regardless of which cities are actually published.
jest.mock('../../data/city-guides.data', () => {
  const actual = jest.requireActual('../../data/city-guides.data');
  return { ...actual, CITY_GUIDES: [
    { ...actual.CITY_GUIDES[0], slug: 'madrid', displayName: 'Madrid', reviewed: true },
    { ...actual.CITY_GUIDES[0], slug: 'barcelona', displayName: 'Barcelona', reviewed: true },
    { ...actual.CITY_GUIDES[0], slug: 'hidden', displayName: 'Oculta', reviewed: false },
  ] };
});

describe('LandingAboutComponent — travel-guides links (S3, solid background)', () => {
  (global as any).IntersectionObserver = (global as any).IntersectionObserver ?? class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  function setup() {
    TestBed.configureTestingModule({
      imports: [LandingAboutComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const f = TestBed.createComponent(LandingAboutComponent);
    f.detectChanges();
    return f;
  }

  it('links every reviewed guide (capped at 5) and hides unreviewed ones', () => {
    const el: HTMLElement = setup().nativeElement;
    const links = Array.from(el.querySelectorAll('.landing-about-guides a')) as HTMLAnchorElement[];
    expect(links.map(a => a.textContent)).toEqual(['Madrid', 'Barcelona']);
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/ciudad/madrid', '/ciudad/barcelona']);
    expect(el.textContent).not.toContain('Oculta');
  });
});
