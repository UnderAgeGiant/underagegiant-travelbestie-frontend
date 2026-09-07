import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TravelDocsReminderComponent } from './travel-docs-reminder.component';
import { TravelDocsReminderService } from '../../core/reminders/travel-docs-reminder.service';
import { CompanionSuggestionService } from '../../core/ai/companion-suggestion.service';
import { TripService } from '../../features/trip/trip.service';
import { AuthService } from '../../core/auth/auth.service';

describe('TravelDocsReminderComponent', () => {
  let fixture: ComponentFixture<TravelDocsReminderComponent>;
  let service: TravelDocsReminderService;
  let companion: CompanionSuggestionService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [TravelDocsReminderComponent] });
    fixture = TestBed.createComponent(TravelDocsReminderComponent);
    service = TestBed.inject(TravelDocsReminderService);
    companion = TestBed.inject(CompanionSuggestionService);
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

  it('stays hidden while the companion mascot bubble is showing, and appears once it goes idle', () => {
    service.maybeShow();
    (companion as any)._state.set('suggesting');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.travel-docs-reminder')).toBeNull();

    (companion as any)._state.set('idle');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.travel-docs-reminder')).not.toBeNull();
  });
});

describe('TravelDocsReminderComponent — enumerated details', () => {
  it('shows visa/currency/adapter detail lines once a trip with stops is loaded and the user is logged in', () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [TravelDocsReminderComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const trip = TestBed.inject(TripService);
    const auth = TestBed.inject(AuthService);
    const reminder = TestBed.inject(TravelDocsReminderService);
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: 'US' });
    trip.addStop({ id: 'bangkok', name: 'Bangkok', country: 'Tailandia', flag: '🇹🇭', region: 'asia' } as any, '01/06/2026', '05/06/2026');
    reminder.maybeShow();

    const fixture = TestBed.createComponent(TravelDocsReminderComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Thai Baht');
  });
});
