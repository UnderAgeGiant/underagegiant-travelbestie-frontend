import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TrophyService } from './trophy.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

describe('TrophyService', () => {
  let http: HttpTestingController;
  let svc: TrophyService;
  let loggedIn = true;

  beforeEach(() => {
    loggedIn = true;
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(),
        { provide: AuthService, useValue: { isLoggedIn: () => loggedIn } }],
    });
    http = TestBed.inject(HttpTestingController);
    svc = TestBed.inject(TrophyService);
  });
  afterEach(() => http.verify());

  it('load() fills earned and progress', () => {
    svc.load();
    http.expectOne(`${environment.apiUrl}/trophies`).flush({
      earned: [{ type: 'clones', tier: 'bronze', earnedAt: '2026-10-01T00:00:00.000Z' }], progress: { clones: 2 },
    });
    expect(svc.earned()).toHaveLength(1);
    expect(svc.progress()).toEqual({ clones: 2 });
    expect(svc.loadError()).toBe(false);
  });

  it('load() failure sets loadError and keeps state empty', () => {
    svc.load();
    http.expectOne(`${environment.apiUrl}/trophies`).flush('x', { status: 500, statusText: 'err' });
    expect(svc.loadError()).toBe(true);
    expect(svc.earned()).toEqual([]);
  });

  it('reportShare posts when logged in, swallows errors, and is a no-op when logged out', () => {
    svc.reportShare('abc');
    http.expectOne(`${environment.apiUrl}/trophies/share/abc`).flush('x', { status: 500, statusText: 'err' });
    loggedIn = false;
    svc.reportShare('abc');
    http.expectNone(`${environment.apiUrl}/trophies/share/abc`);
  });

  it('reset() clears state', () => {
    svc.load();
    http.expectOne(`${environment.apiUrl}/trophies`).flush({ earned: [{ type: 'clones', tier: 'bronze', earnedAt: 'x' }], progress: {} });
    svc.reset();
    expect(svc.earned()).toEqual([]);
  });
});
