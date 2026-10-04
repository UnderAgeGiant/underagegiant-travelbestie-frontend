import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { NotificationBellComponent } from './notification-bell.component';
import { AppNotification } from '../../../core/models/notification.model';

function notif(type: string, url: string): AppNotification {
  return { notificationId: 'n', type: type as AppNotification['type'], title: 't', body: 'b', url, read: false, createdAt: new Date().toISOString() };
}

describe('NotificationBellComponent — open() follows the backend url', () => {
  let component: NotificationBellComponent;
  let router: { navigateByUrl: jest.Mock; url: string };
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    router = { navigateByUrl: jest.fn().mockResolvedValue(true), url: '/some-other-page' };
    TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), { provide: Router, useValue: router }],
    });
    http = TestBed.inject(HttpTestingController);
    component = TestBed.createComponent(NotificationBellComponent).componentInstance;
  });

  afterEach(() => http.verify());

  it.each([
    ['comment', '/shared/abc?focus=att%3Amadrid%3Amadrid_3'],
    ['favorite', '/shared/abc'],
    ['clone', '/shared/abc'],
    ['purchase', '/karma-history'],
    ['collaborator_invite', '/my-trips?tab=invites&focus=t1'],
    ['collaborator_accepted', '/my-trips?tab=trips&focus=t1'],
    ['ai_plan_ready', '/my-trips?tab=aiplans&focus=r1'],
    ['ai_plan_failed', '/my-trips?tab=aiplans'],
    ['trophy', '/profile?focus=ai_plans%3Abronze#trofeos'],
    ['some_future_type', '/somewhere/new'],
  ])('%s → navigates to %s exactly once', (type, url) => {
    component.panelOpen.set(true);
    component.open(notif(type, url));
    expect(component.panelOpen()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith(url);
  });

  it('maps a legacy /?share=<id> row to /shared/<id>', () => {
    component.open(notif('clone', '/?share=xyz'));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/shared/xyz');
  });

  it.each(['https://evil.example', '//evil.example', 'javascript:alert(1)', ''])(
    'ignores a non-path url %p but still closes the panel', (url) => {
      component.panelOpen.set(true);
      component.open(notif('comment', url));
      expect(component.panelOpen()).toBe(false);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

  it('bounces through a skipLocationChange hop when the target is already the current Router url', async () => {
    router.url = '/my-trips?tab=aiplans&focus=r1';
    component.open(notif('ai_plan_ready', '/my-trips?tab=aiplans&focus=r1'));
    await Promise.resolve();
    expect(router.navigateByUrl).toHaveBeenNthCalledWith(1, '/', { skipLocationChange: true });
    expect(router.navigateByUrl).toHaveBeenNthCalledWith(2, '/my-trips?tab=aiplans&focus=r1');
  });
});
