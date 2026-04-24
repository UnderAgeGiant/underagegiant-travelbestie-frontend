import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('stores token and user after login', () => {
    service.login('test@test.com', 'pass').subscribe();
    const req = http.expectOne(r => r.url.includes('/auth/login'));
    req.flush({ token: 'fake.jwt.token', user: { name: 'Test', email: 'test@test.com' } });
    expect(service.token()).toBe('fake.jwt.token');
    expect(service.currentUser()?.name).toBe('Test');
  });

  it('isLoggedIn returns false when no token', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('logout clears token and user', () => {
    service.logout();
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });
});
