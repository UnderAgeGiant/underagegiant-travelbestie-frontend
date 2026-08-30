import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TravelDocsReminderComponent } from './travel-docs-reminder.component';
import { TravelDocsReminderService } from '../../core/reminders/travel-docs-reminder.service';

describe('TravelDocsReminderComponent', () => {
  let fixture: ComponentFixture<TravelDocsReminderComponent>;
  let service: TravelDocsReminderService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [TravelDocsReminderComponent] });
    fixture = TestBed.createComponent(TravelDocsReminderComponent);
    service = TestBed.inject(TravelDocsReminderService);
    fixture.detectChanges();
  });

  it('renders nothing when the service is not visible', () => {
    expect(fixture.nativeElement.querySelector('.travel-docs-reminder')).toBeNull();
  });

  it('renders the reminder bubble once the service shows it, and dismisses it on close', () => {
    service.maybeShow();
    fixture.detectChanges();
    const bubble = fixture.nativeElement.querySelector('.travel-docs-reminder');
    expect(bubble).not.toBeNull();
    expect(bubble.textContent).toContain('visa');

    fixture.nativeElement.querySelector('.companion-dismiss-x').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.travel-docs-reminder')).toBeNull();
  });
});
