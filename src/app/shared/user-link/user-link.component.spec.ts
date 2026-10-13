import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UserLinkComponent } from './user-link.component';

function render(name: string, username: string | null | undefined): HTMLElement {
  TestBed.configureTestingModule({ imports: [UserLinkComponent], providers: [provideRouter([])] });
  const f = TestBed.createComponent(UserLinkComponent);
  f.componentRef.setInput('name', name);
  f.componentRef.setInput('username', username);
  f.detectChanges();
  return f.nativeElement;
}

describe('UserLinkComponent', () => {
  it('links to /u/<username>', () => {
    const a = render('Ana', 'ana').querySelector('a');
    expect(a?.getAttribute('href')).toBe('/u/ana');
    expect(a?.textContent?.trim()).toBe('Ana');
  });
  it('renders plain text without a username', () => {
    const el = render('Ana', null);
    expect(el.querySelector('a')).toBeNull();
    expect(el.textContent?.trim()).toBe('Ana');
  });
  it('escapes the name (no HTML injection)', () => {
    expect(render('<img src=x>', 'ana').querySelector('img')).toBeNull();
  });
});
