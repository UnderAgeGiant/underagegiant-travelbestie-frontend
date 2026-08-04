import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CompanionBoostCardComponent } from './companion-boost-card.component';
import { CompanionSuggestionService } from '../../core/ai/companion-suggestion.service';
import { AuthService } from '../../core/auth/auth.service';

describe('CompanionBoostCardComponent', () => {
  let http: HttpTestingController;
  let companion: CompanionSuggestionService;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CompanionBoostCardComponent],
      providers: [
        provideHttpClient(withXhr()), provideHttpClientTesting(),
        { provide: 'ENV', useValue: { useMocks: false, apiUrl: 'http://localhost:3000' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    companion = TestBed.inject(CompanionSuggestionService);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => http.verify());

  it('shows the unboosted illustration and "Dar premio" button by default', () => {
    const fixture = TestBed.createComponent(CompanionBoostCardComponent);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.companion-boost-img') as HTMLImageElement;
    expect(img.src).toContain('standing-black-dog.jpeg');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Dar premio');
  });

  it('clicking "Dar premio" calls companion.boost()', () => {
    const boostSpy = jest.spyOn(companion, 'boost');
    const fixture = TestBed.createComponent(CompanionBoostCardComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.companion-boost-btn') as HTMLButtonElement).click();
    expect(boostSpy).toHaveBeenCalled();

    http.expectOne(r => r.url.includes('/companion/boost'))
      .flush({ boosted: true, secondsRemaining: 86400 });
  });

  it('shows the boosted illustration once boostExpiresAt() is in the future', () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);
    const fixture = TestBed.createComponent(CompanionBoostCardComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/companion/status'))
      .flush({ boosted: true, secondsRemaining: 86400 });
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('.companion-boost-img') as HTMLImageElement;
    expect(img.src).toContain('snack-hearts-black-dog.png');
    expect(fixture.nativeElement.querySelector('.companion-boost-btn')).toBeNull();
  });

  it('calls refreshBoostStatus() on init so a page reload reflects the real state', () => {
    const refreshSpy = jest.spyOn(companion, 'refreshBoostStatus');
    const fixture = TestBed.createComponent(CompanionBoostCardComponent);
    fixture.detectChanges();
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('shows a live HH:MM:SS countdown that ticks down once a second while boosted', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-02T12:00:00.000Z'));
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);

    const fixture = TestBed.createComponent(CompanionBoostCardComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/companion/status'))
      .flush({ boosted: true, secondsRemaining: 86400 }); // exactly 24h out
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('24:00:00');

    jest.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('23:59:55');

    jest.useRealTimers();
  });

  it('reverts to the unboosted "Dar premio" state on its own once the countdown reaches zero', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-02T12:00:00.000Z'));
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);

    const fixture = TestBed.createComponent(CompanionBoostCardComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/companion/status'))
      .flush({ boosted: true, secondsRemaining: 3 }); // 3 seconds out
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.companion-boost-btn')).toBeNull();

    jest.advanceTimersByTime(4000); // past expiry
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.companion-boost-btn')).not.toBeNull();

    jest.useRealTimers();
  });

  it('shows a hearts/fireworks celebration right after a boost purchase succeeds, then hides it on its own', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-02T12:00:00.000Z'));
    const fixture = TestBed.createComponent(CompanionBoostCardComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.companion-boost-btn') as HTMLButtonElement).click();
    http.expectOne(r => r.url.includes('/companion/boost')).flush({ boosted: true, secondsRemaining: 86400 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.companion-celebrate-emoji').length).toBeGreaterThan(0);

    jest.advanceTimersByTime(2600);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.companion-celebrate')).toBeNull();

    jest.useRealTimers();
  });

  it('does not celebrate just from refreshBoostStatus() discovering an already-active boost on init', () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);
    const fixture = TestBed.createComponent(CompanionBoostCardComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/companion/status')).flush({ boosted: true, secondsRemaining: 86400 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.companion-celebrate')).toBeNull();
  });
});
