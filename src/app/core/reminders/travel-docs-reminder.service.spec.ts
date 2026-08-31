import { TestBed } from '@angular/core/testing';
import { TravelDocsReminderService } from './travel-docs-reminder.service';

describe('TravelDocsReminderService', () => {
  let service: TravelDocsReminderService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TravelDocsReminderService);
  });

  it('shows the reminder the first time maybeShow() is called', () => {
    expect(service.visible()).toBe(false);
    service.maybeShow();
    expect(service.visible()).toBe(true);
  });

  it('does not show again on a second call within the same service instance', () => {
    service.maybeShow();
    service.dismiss();
    service.maybeShow();
    expect(service.visible()).toBe(false);
  });

  it('does not show again for a fresh service instance if sessionStorage already has the flag', () => {
    service.maybeShow();
    // Simulate a page reload within the same tab session: a brand-new service instance,
    // but sessionStorage (unlike the in-memory instance) survives the reload.
    const reloaded = new TravelDocsReminderService();
    reloaded.maybeShow();
    expect(reloaded.visible()).toBe(false);
  });

  it('dismiss() hides the reminder', () => {
    service.maybeShow();
    service.dismiss();
    expect(service.visible()).toBe(false);
  });
});
