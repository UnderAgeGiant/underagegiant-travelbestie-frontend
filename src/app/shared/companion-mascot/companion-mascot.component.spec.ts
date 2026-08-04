import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CompanionMascotComponent } from './companion-mascot.component';
import { CompanionSuggestionService } from '../../core/ai/companion-suggestion.service';

describe('CompanionMascotComponent', () => {
  let http: HttpTestingController;
  let companion: CompanionSuggestionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CompanionMascotComponent],
      providers: [
        provideHttpClient(withXhr()), provideHttpClientTesting(),
        { provide: 'ENV', useValue: { useMocks: false, apiUrl: 'http://localhost:3000' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    companion = TestBed.inject(CompanionSuggestionService);
  });

  afterEach(() => http.verify());

  it('renders nothing when idle', () => {
    const fixture = TestBed.createComponent(CompanionMascotComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.companion-mascot')).toBeNull();
  });

  it('renders the sniffing dog while sniffing', () => {
    (companion as any)._state.set('sniffing');
    const fixture = TestBed.createComponent(CompanionMascotComponent);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.companion-dog') as HTMLImageElement;
    expect(img.src).toContain('sniffing-back-dog.png');
  });

  it('renders the bubble with the intro line and suggestion while suggesting', () => {
    (companion as any)._addedAttractionInfo.set({ name: 'Torre Eiffel', date: '02/07/2026', time: '09:00' });
    (companion as any)._cityId.set('paris');
    (companion as any)._suggestion.set({ attractionId: 'paris_1', date: '02/07/2026', startTime: '11:00', endTime: '12:00', reason: 'Muy popular después.' });
    (companion as any)._state.set('suggesting');

    const fixture = TestBed.createComponent(CompanionMascotComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Torre Eiffel');
    expect(text).toContain('Muy popular después.');
    expect(text).toContain('11:00');
  });

  it('accept button calls companion.accept()', () => {
    (companion as any)._cityId.set('paris');
    (companion as any)._suggestion.set({ attractionId: 'paris_1', date: '02/07/2026', startTime: '11:00', endTime: '12:00', reason: 'x' });
    (companion as any)._state.set('suggesting');
    const acceptSpy = jest.spyOn(companion, 'accept');

    const fixture = TestBed.createComponent(CompanionMascotComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.companion-accept-btn') as HTMLButtonElement).click();

    expect(acceptSpy).toHaveBeenCalled();
  });

  it('dismiss button calls companion.dismiss()', () => {
    (companion as any)._cityId.set('paris');
    (companion as any)._suggestion.set({ attractionId: 'paris_1', date: '02/07/2026', startTime: '11:00', endTime: '12:00', reason: 'x' });
    (companion as any)._state.set('suggesting');
    const dismissSpy = jest.spyOn(companion, 'dismiss');

    const fixture = TestBed.createComponent(CompanionMascotComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.companion-dismiss-x') as HTMLButtonElement).click();

    expect(dismissSpy).toHaveBeenCalled();
  });
});
