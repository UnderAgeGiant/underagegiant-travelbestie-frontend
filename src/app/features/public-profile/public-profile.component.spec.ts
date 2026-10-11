import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';
import { PublicProfileComponent } from './public-profile.component';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { mockPublicProfile } from '../../core/api/public-profile.mock';

function setup(api: Partial<ApiService>, me: string | null = null) {
  TestBed.configureTestingModule({
    imports: [PublicProfileComponent],
    providers: [
      provideRouter([]),
      { provide: ApiService, useValue: api },
      { provide: AuthService, useValue: { isLoggedIn: signal(!!me), currentUser: signal(me ? { name: 'Me', email: '', username: me } : null) } },
      { provide: ActivatedRoute, useValue: { paramMap: new BehaviorSubject(convertToParamMap({ username: 'ana' })), queryParamMap: of(convertToParamMap({})) } },
    ],
  });
  const f = TestBed.createComponent(PublicProfileComponent);
  f.detectChanges();
  return f;
}

describe('PublicProfileComponent', () => {
  beforeAll(() => {
    // Mock window.matchMedia for DeviceService (the nav shell needs it; jsdom has none).
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false, media: query, onchange: null,
        addListener: jest.fn(), removeListener: jest.fn(),
        addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
      })),
    });
  });

  it('renders name, @username, counts and trip cards', () => {
    const f = setup({ getPublicProfile: () => of(mockPublicProfile('ana')) });
    const el: HTMLElement = f.nativeElement;
    expect(el.textContent).toContain('@ana');
    expect(el.textContent).toContain('12');
    expect(el.querySelectorAll('tb-feed-plan-card').length).toBe(3);
  });

  it('hides the follow button on my own profile', () => {
    const f = setup({ getPublicProfile: () => of(mockPublicProfile('ana')), getFavorites: () => of([]) }, 'ana');
    expect(f.nativeElement.querySelector('tb-follow-button')).toBeNull();
  });

  it('shows a not-found state on 404', () => {
    const f = setup({ getPublicProfile: () => throwError(() => new HttpErrorResponse({ status: 404 })) });
    expect(f.componentInstance.state()).toBe('notFound');
  });

  it('navigates to /demasiadas-visitas with Retry-After and replaceUrl on 429', () => {
    TestBed.resetTestingModule();
    const navigate = jest.fn();
    TestBed.configureTestingModule({
      imports: [PublicProfileComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: { getPublicProfile: () => throwError(() => new HttpErrorResponse({ status: 429, headers: new HttpHeaders({ 'Retry-After': '42' }) })) } },
        { provide: AuthService, useValue: { isLoggedIn: signal(false), currentUser: signal(null) } },
        { provide: ActivatedRoute, useValue: { paramMap: new BehaviorSubject(convertToParamMap({ username: 'ana' })), queryParamMap: of(convertToParamMap({})) } },
      ],
    });
    jest.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);
    const f = TestBed.createComponent(PublicProfileComponent);
    f.detectChanges();
    expect(f.componentInstance.state()).toBe('rateLimited');
    expect(navigate).toHaveBeenCalledWith(['/demasiadas-visitas'], { queryParams: { retry: 42 }, replaceUrl: true });
  });
});
