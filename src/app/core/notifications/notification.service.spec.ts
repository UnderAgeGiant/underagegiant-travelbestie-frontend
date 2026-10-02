import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { AuthService } from '../auth/auth.service';
import { TrophyCelebrationService } from '../trophies/trophy-celebration.service';
import { environment } from '../../../environments/environment';

describe('NotificationService', () => {
  let httpMock: HttpTestingController;
  let svc: NotificationService;
  const burst = jest.fn();

  beforeEach(() => {
    burst.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // Logged out → constructor effect never starts the poll timer; tests drive methods directly.
        { provide: AuthService, useValue: { isLoggedIn: () => false } },
        { provide: TrophyCelebrationService, useValue: { burst } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    svc = TestBed.inject(NotificationService);
  });

  afterEach(() => httpMock.verify());

  it('refreshStatus sets count and muted, and shakes when count increases', () => {
    svc.refreshStatus();
    httpMock.expectOne(`${environment.apiUrl}/notifications/status`).flush({ count: 2, muted: false });

    expect(svc.unreadCount()).toBe(2);
    expect(svc.muted()).toBe(false);
    expect(svc.shaking()).toBe(true);
  });

  it('refreshStatus does not shake when muted', () => {
    svc.refreshStatus();
    httpMock.expectOne(`${environment.apiUrl}/notifications/status`).flush({ count: 3, muted: true });

    expect(svc.unreadCount()).toBe(3);
    expect(svc.muted()).toBe(true);
    expect(svc.shaking()).toBe(false);
  });

  it('openPanel loads the list, then marks all read (badge zeroed, list flags untouched)', () => {
    svc.refreshStatus();
    httpMock.expectOne(`${environment.apiUrl}/notifications/status`).flush({ count: 1, muted: false });

    svc.openPanel();
    httpMock.expectOne(`${environment.apiUrl}/notifications`).flush({
      notifications: [{ notificationId: 'n1', type: 'comment', title: 't', body: 'b', url: '/?share=a', read: false, createdAt: new Date().toISOString() }],
    });
    httpMock.expectOne(`${environment.apiUrl}/notifications/read`).flush(null);

    expect(svc.notifications()).toHaveLength(1);
    expect(svc.notifications()[0].read).toBe(false);   // still highlighted this opening
    expect(svc.unreadCount()).toBe(0);                 // badge cleared
  });

  it('toggleMute flips the signal optimistically and calls the API', () => {
    expect(svc.muted()).toBe(false);
    svc.toggleMute();
    expect(svc.muted()).toBe(true);
    httpMock.expectOne(`${environment.apiUrl}/notifications/mute`).flush({ muted: true });
  });

  it('openPanel bursts streamers when the fetched list has an unread trophy notification', () => {
    svc.refreshStatus();
    httpMock.expectOne(`${environment.apiUrl}/notifications/status`).flush({ count: 1, muted: false });

    svc.openPanel();
    httpMock.expectOne(`${environment.apiUrl}/notifications`).flush({ notifications: [
      { notificationId: '1', type: 'trophy', title: 't', body: 'b', url: '/profile#trofeos', read: false, createdAt: new Date().toISOString() },
    ] });
    httpMock.expectOne(`${environment.apiUrl}/notifications/read`).flush(null);
    expect(burst).toHaveBeenCalledTimes(1);
  });

  it('openPanel does not burst for read trophy notifications', () => {
    svc.refreshStatus();
    httpMock.expectOne(`${environment.apiUrl}/notifications/status`).flush({ count: 1, muted: false });

    svc.openPanel();
    httpMock.expectOne(`${environment.apiUrl}/notifications`).flush({ notifications: [
      { notificationId: '1', type: 'trophy', title: 't', body: 'b', url: '/profile#trofeos', read: true, createdAt: new Date().toISOString() },
    ] });
    httpMock.expectOne(`${environment.apiUrl}/notifications/read`).flush(null);
    expect(burst).not.toHaveBeenCalled();
  });
});

describe('NotificationService — background tabs (C4)', () => {
  let httpMock: HttpTestingController;
  let svc: NotificationService;
  let hidden = false;
  const statusRequests = () => httpMock.match(`${environment.apiUrl}/notifications/status`);

  beforeEach(() => {
    jest.useFakeTimers();
    hidden = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isLoggedIn: () => false } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    svc = TestBed.inject(NotificationService);
    // Flush the constructor's effect deterministically now, the way real boot naturally
    // would (Angular ticks soon after construction) — otherwise, under fake timers, its
    // first run can land mid-test (inside a later advanceTimersByTime), spuriously
    // clearing a poll timer this describe block starts manually via startPolling().
    TestBed.tick();
  });

  afterEach(() => {
    TestBed.resetTestingModule();   // destroys the service → removes its listener + interval
    jest.useRealTimers();
  });

  it('skips interval polls while the tab is hidden', () => {
    svc['startPolling']();
    statusRequests().forEach(r => r.flush({ count: 0, muted: false }));   // immediate first refresh
    hidden = true;
    jest.advanceTimersByTime(3 * 60_000);
    expect(statusRequests()).toHaveLength(0);
  });

  it('refreshes once when the tab becomes visible again', () => {
    svc['startPolling']();
    statusRequests().forEach(r => r.flush({ count: 0, muted: false }));
    hidden = true;
    jest.advanceTimersByTime(60_000);
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    const reqs = statusRequests();
    expect(reqs).toHaveLength(1);
    reqs[0].flush({ count: 1, muted: false });
  });

  it('does not poll on visibilitychange when polling never started (logged out)', () => {
    document.dispatchEvent(new Event('visibilitychange'));
    expect(statusRequests()).toHaveLength(0);
  });

  it('still polls on the interval while visible', () => {
    svc['startPolling']();
    statusRequests().forEach(r => r.flush({ count: 0, muted: false }));
    jest.advanceTimersByTime(60_000);
    const reqs = statusRequests();
    expect(reqs).toHaveLength(1);
    reqs[0].flush({ count: 0, muted: false });
  });
});
