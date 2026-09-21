import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  it('renders a heading and a link back home', () => {
    TestBed.configureTestingModule({ imports: [NotFoundComponent], providers: [provideRouter([])] });
    const f = TestBed.createComponent(NotFoundComponent);
    f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    expect(el.querySelector('h1')?.textContent?.trim().length).toBeGreaterThan(0);
    expect(el.querySelector('a.btn-pill')?.getAttribute('href')).toBe('/');
  });
});
