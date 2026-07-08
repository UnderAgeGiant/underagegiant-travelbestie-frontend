import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

describe('NotificationService', () => {
  let httpMock: HttpTestingController;
  let svc: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // Logged out → constructor effect never starts the poll timer; tests drive methods directly.
        { provide: AuthService, useValue: { isLoggedIn: () => false } },
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
});
