import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { provideHttpClient, withXhr, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    // AuthService stores the token in sessionStorage; clear both storages so the
    // signal field initializer starts clean in every test.
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    // jsdom does not implement crypto.subtle — mock it to allow HTTP path tests
    (service as any)['encryptPayload'] = jest.fn().mockResolvedValue({ encryptedPayload: 'mock-encrypted' });
  });

  afterEach(() => http.verify());

  it('stores token and user after login', () => {
    // encryptPayload returns a Promise (async crypto.subtle). Mock it with a
    // synchronous Observable so from(observable) emits immediately and the HTTP
    // call is available synchronously for http.expectOne().
    jest.spyOn(service as any, 'encryptPayload').mockReturnValue(of({ encryptedPayload: 'fake' }));
    service.login('test@test.com', 'pass').subscribe();

    const req = http.expectOne(r => r.url.includes('/auth/login'));
    // The refresh token now arrives as an HttpOnly cookie the test backend does not model.
    req.flush({ token: 'fake.jwt.token', user: { name: 'Test', email: 'test@test.com' } });

    expect(service.token()).toBe('fake.jwt.token');
    expect(service.currentUser()?.name).toBe('Test');
    expect(localStorage.getItem('tb_refresh_token')).toBeNull();
  });

  it('login sends X-Anonymous-Id so the backend can migrate anon seen-state onto this account', () => {
    jest.spyOn(service as any, 'encryptPayload').mockReturnValue(of({ encryptedPayload: 'fake' }));
    service.login('test@test.com', 'pass').subscribe();

    const req = http.expectOne(r => r.url.includes('/auth/login'));
    expect(req.request.headers.get('X-Anonymous-Id')).toMatch(/^[0-9a-f-]{36}$/i);
    req.flush({ token: 'fake.jwt.token', user: { name: 'Test', email: 'test@test.com' } });
  });

  it('register sends X-Anonymous-Id too', () => {
    jest.spyOn(service as any, 'encryptPayload').mockReturnValue(of({ encryptedPayload: 'fake' }));
    service.register('Test', 'test@test.com', 'pass', '123456').subscribe();

    const req = http.expectOne(r => r.url.includes('/auth/register'));
    expect(req.request.headers.get('X-Anonymous-Id')).toMatch(/^[0-9a-f-]{36}$/i);
    req.flush({ token: 'fake.jwt.token', user: { name: 'Test', email: 'test@test.com' } });
  });

  it('isLoggedIn returns false when no token', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('never seeds a mock user registry into localStorage', () => {
    expect(localStorage.getItem('tb_mock_users')).toBeNull();
  });

  it('logout clears token and user', () => {
    service.logout();
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });
});

describe('AuthService boot-time silent refresh (NG0200 regression)', () => {
  // authInterceptor calls inject(AuthService) on every outgoing request, including the
  // one the constructor fires for itself. If that call is dispatched synchronously
  // during construction, Angular's DI detects the re-entrant inject(AuthService) as a
  // circular dependency (NG0200) before the request ever reaches the network — silently
  // caught by refreshAccessToken()'s catchError, which then wipes the session marker on
  // every reload. The constructor must defer the call past construction (queueMicrotask)
  // so the interceptor's inject(AuthService) resolves against the finished singleton.
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('does not throw NG0200 and issues the refresh request when a session marker exists on construction', fakeAsync(() => {
    localStorage.setItem('tb_session_user', JSON.stringify({ name: 'Test', email: 'test@test.com' }));
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    expect(() => TestBed.inject(AuthService)).not.toThrow();

    flushMicrotasks();
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne(r => r.url.includes('/auth/refresh'));
    req.flush({ token: 'fresh.jwt.token', user: { name: 'Test', email: 'test@test.com' } });
    http.verify();
  }));
});
