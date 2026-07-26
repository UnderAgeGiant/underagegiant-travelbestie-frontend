import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let token: string | null;
  let mayExist: boolean;
  const refreshMock = jest.fn();

  beforeEach(() => {
    token = null;
    mayExist = false;
    refreshMock.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            token: () => token,
            sessionMayExist: () => mayExist,
            refreshAccessToken: refreshMock,
          },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  it('attaches the Bearer token when one is present', () => {
    token = 'tok-1';
    http.get('/api/trips').subscribe();
    const req = ctrl.expectOne('/api/trips');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-1');
    req.flush({});
  });

  it('sends without a header when there is no token and no session', () => {
    http.get('/api/stats').subscribe();
    const req = ctrl.expectOne('/api/stats');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('waits for the silent refresh when a session marker exists (boot race)', () => {
    mayExist = true;
    refreshMock.mockImplementation(() => { token = 'tok-fresh'; return of(true); });
    http.get('/api/trips').subscribe();
    expect(refreshMock).toHaveBeenCalledTimes(1);
    const req = ctrl.expectOne('/api/trips');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-fresh');
    req.flush({});
  });

  it('retries once with a new token after a 401 on an authenticated request', () => {
    token = 'tok-old';
    refreshMock.mockImplementation(() => { token = 'tok-new'; return of(true); });
    let result: unknown;
    http.get('/api/karma').subscribe(r => (result = r));

    ctrl.expectOne('/api/karma').flush({ error: 'expired' }, { status: 401, statusText: 'Unauthorized' });
    const retried = ctrl.expectOne('/api/karma');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer tok-new');
    retried.flush({ karma: 3 });
    expect(result).toEqual({ karma: 3 });
  });

  it('never attaches a header to the refresh endpoint itself', () => {
    token = 'tok-1';
    http.post('/auth/refresh', {}).subscribe();
    const req = ctrl.expectOne('/auth/refresh');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
