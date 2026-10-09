import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GuidesIndexComponent } from './guides-index.component';

jest.mock('../../data/city-guides.data', () => ({
  CITY_GUIDES: [
    { slug: 'paris', cityId: 'paris', displayName: 'París', reviewed: true },
    { slug: 'lima', cityId: 'lima', displayName: 'Lima', reviewed: true },
    { slug: 'rome', cityId: 'rome', displayName: 'Roma', reviewed: false },
  ],
}));
jest.mock('../nav/nav-shell.component', () => {
  const { Component } = jest.requireActual('@angular/core');
  @Component({ selector: 'app-nav', template: '' }) class NavShellComponent {}
  return { NavShellComponent };
});

describe('GuidesIndexComponent (T4)', () => {
  const render = () => {
    TestBed.configureTestingModule({ imports: [GuidesIndexComponent], providers: [provideRouter([])] });
    const f = TestBed.createComponent(GuidesIndexComponent); f.detectChanges();
    return f.nativeElement as HTMLElement;
  };

  it('renders 6 continent sections in order', () => {
    const heads = [...render().querySelectorAll('.guides-continent h2')].map(h => h.textContent!.trim());
    expect(heads).toEqual(['Sudamérica', 'Norte y Centroamérica', 'Europa', 'Asia', 'África', 'Oceanía']);
  });

  it('links reviewed guides only, under the right continent', () => {
    const el = render();
    const links = [...el.querySelectorAll('a.guides-card')].map(a => a.getAttribute('href'));
    expect(links).toEqual(['/ciudad/lima', '/ciudad/paris']);
    expect(el.querySelectorAll('.guides-empty')).toHaveLength(4);
    expect(el.querySelector('.guides-empty')!.textContent).toContain('Guías en construcción');
  });

  it('renders the footer without the guides column', () => {
    expect(render().querySelector('tb-app-footer')!.textContent).not.toContain('Guías de destinos');
  });
});
