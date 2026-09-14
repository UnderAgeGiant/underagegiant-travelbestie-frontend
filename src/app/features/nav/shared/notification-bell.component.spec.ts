import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { NotificationBellComponent } from './notification-bell.component';
import { NavFacadeService } from '../nav-facade.service';
import { AppNotification } from '../../../core/models/notification.model';

describe('NotificationBellComponent — open() routing for ai_plan_ready/ai_plan_failed', () => {
  let component: NotificationBellComponent;
  let facade: NavFacadeService;
  let router: { navigateByUrl: jest.Mock };
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    router = { navigateByUrl: jest.fn() };

    TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpTestingController);
    facade = TestBed.inject(NavFacadeService);
    component = TestBed.createComponent(NotificationBellComponent).componentInstance;
  });

  afterEach(() => http.verify());

  it('routes ai_plan_ready notifications to My Trips → Planes IA Pendientes instead of following n.url', () => {
    const n: AppNotification = {
      notificationId: 'n1', type: 'ai_plan_ready', title: 't', body: 'b',
      url: '/', read: false, createdAt: new Date().toISOString(),
    };
    component.open(n);
    expect(facade.pendingMyTripsTab()).toBe('aiplans');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('routes ai_plan_failed notifications to My Trips → Planes IA Pendientes instead of following n.url', () => {
    const n: AppNotification = {
      notificationId: 'n2', type: 'ai_plan_failed', title: 't', body: 'b',
      url: '/', read: false, createdAt: new Date().toISOString(),
    };
    component.open(n);
    expect(facade.pendingMyTripsTab()).toBe('aiplans');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});

describe('NotificationBellComponent — open() routing for purchase notifications', () => {
  let component: NotificationBellComponent;
  let router: { navigateByUrl: jest.Mock };
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    router = { navigateByUrl: jest.fn() };

    TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpTestingController);
    component = TestBed.createComponent(NotificationBellComponent).componentInstance;
  });

  afterEach(() => http.verify());

  it('routes purchase notifications to /karma-history instead of following n.url', () => {
    const n: AppNotification = {
      notificationId: 'n3', type: 'purchase', title: 't', body: 'b',
      url: '/', read: false, createdAt: new Date().toISOString(),
    };
    component.open(n);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/karma-history');
  });
});

describe('NotificationBellComponent — open() same-URL navigation hardening', () => {
  let component: NotificationBellComponent;
  let router: { navigateByUrl: jest.Mock; url: string };
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    // Simulate the Router already tracking '/' as current — e.g. after a
    // signal-only view switch (onLogoClick) followed by history.back().
    router = { navigateByUrl: jest.fn().mockResolvedValue(true), url: '/' };

    TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpTestingController);
    component = TestBed.createComponent(NotificationBellComponent).componentInstance;
  });

  afterEach(() => http.verify());

  it('bounces through a skipLocationChange hop before navigating to a shared-trip target Router already thinks is current', async () => {
    // Router.url is '/' (set above); the resolved target is '/shared/abc', which differs —
    // this exercises the *safety net itself* by making the mock report the target as
    // already-current on the second call, mirroring what a stale Router state looks like.
    router.url = '/shared/abc';
    const n: AppNotification = {
      notificationId: 'n4', type: 'clone', title: 't', body: 'b',
      url: '/?share=abc', read: false, createdAt: new Date().toISOString(),
    };

    component.open(n);
    await Promise.resolve(); // flush the microtask from navigateByUrl('/', {skipLocationChange:true}).then(...)

    expect(router.navigateByUrl).toHaveBeenNthCalledWith(1, '/', { skipLocationChange: true });
    expect(router.navigateByUrl).toHaveBeenNthCalledWith(2, '/shared/abc');
  });

  it('navigates directly, with no bounce, when the target differs from the current Router url', () => {
    router.url = '/some-other-page';
    const n: AppNotification = {
      notificationId: 'n5', type: 'favorite', title: 't', body: 'b',
      url: '/?share=xyz', read: false, createdAt: new Date().toISOString(),
    };

    component.open(n);

    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/shared/xyz');
  });
});
