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
