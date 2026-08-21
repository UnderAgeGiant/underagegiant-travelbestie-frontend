import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MyTripsComponent } from './my-trips.component';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';
import { AuthService } from '../../core/auth/auth.service';

// MyTripsComponent now renders <app-nav>, whose DeviceService reads window.matchMedia.
(window as any).matchMedia = (window as any).matchMedia ?? (() => ({
  matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {},
}));

describe('MyTripsComponent — published-only filter', () => {
  let component: MyTripsComponent;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [MyTripsComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
    });
    const savedPlans = TestBed.inject(SavedPlansService);
    // register() pushes straight into the plans signal — no auth/API round-trip needed
    savedPlans.register({ id: 'p1', name: 'Euro trip', savedAt: '2026-07-01T00:00:00Z', stops: [], shareId: 'sh-1' });
    savedPlans.register({ id: 'p2', name: 'Asia trip', savedAt: '2026-07-02T00:00:00Z', stops: [] });
    component = TestBed.createComponent(MyTripsComponent).componentInstance;
  });

  it('shows all plans when the checkbox is off (default)', () => {
    expect(component.publishedOnly()).toBe(false);
    expect(component.filteredPlans().map(p => p.id)).toEqual(['p1', 'p2']);
  });

  it('shows only published plans when the checkbox is on', () => {
    component.publishedOnly.set(true);
    expect(component.filteredPlans().map(p => p.id)).toEqual(['p1']);
  });

  it('combines the published filter with the text search', () => {
    component.publishedOnly.set(true);
    component.planSearch.set('asia');
    expect(component.filteredPlans()).toEqual([]);   // Asia trip is not published
    component.planSearch.set('euro');
    expect(component.filteredPlans().map(p => p.id)).toEqual(['p1']);
  });
});

describe('MyTripsComponent — clone button label', () => {
  let fixture: ComponentFixture<MyTripsComponent>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [MyTripsComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
    });
    const auth = TestBed.inject(AuthService);
    auth.setTokens('fake-jwt', { name: 'Test User', email: 'test@example.com' });
    const savedPlans = TestBed.inject(SavedPlansService);
    savedPlans.register({ id: 'p1', name: 'Euro trip', savedAt: '2026-07-01T00:00:00Z', stops: [] });
    fixture = TestBed.createComponent(MyTripsComponent);
    fixture.detectChanges();
  });

  it('labels the saved-plan-header action button "Duplicar", not "Clonar"', () => {
    const btn = fixture.nativeElement.querySelector('.saved-plan-header .saved-plan-act-btn') as HTMLElement;
    expect(btn.textContent).toContain('Duplicar');
    expect(btn.textContent).not.toContain('Clonar');
    expect(btn.getAttribute('title')).toBe('Duplicar viaje');
  });
});

describe('MyTripsComponent — saved-plan-actions visibility', () => {
  let fixture: ComponentFixture<MyTripsComponent>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [MyTripsComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
    });
    const auth = TestBed.inject(AuthService);
    auth.setTokens('fake-jwt', { name: 'Test User', email: 'test@example.com' });
    const savedPlans = TestBed.inject(SavedPlansService);
    savedPlans.register({ id: 'p1', name: 'Euro trip', savedAt: '2026-07-01T00:00:00Z', stops: [] });
    savedPlans.register({ id: 'p2', name: 'Asia trip', savedAt: '2026-07-02T00:00:00Z', stops: [] });
    fixture = TestBed.createComponent(MyTripsComponent);
    fixture.detectChanges();
  });

  it('shows actions only for the selected card, and swaps them when a different card is selected', () => {
    const cards = fixture.nativeElement.querySelectorAll('.saved-plan-card');
    expect(cards.length).toBe(2);
    expect(cards[0].querySelector('.saved-plan-actions')).toBeNull();
    expect(cards[1].querySelector('.saved-plan-actions')).toBeNull();

    const headers = fixture.nativeElement.querySelectorAll('.saved-plan-header');
    (headers[0] as HTMLElement).click();
    fixture.detectChanges();
    expect(cards[0].querySelector('.saved-plan-actions')).not.toBeNull();
    expect(cards[1].querySelector('.saved-plan-actions')).toBeNull();

    (headers[1] as HTMLElement).click();
    fixture.detectChanges();
    expect(cards[0].querySelector('.saved-plan-actions')).toBeNull();
    expect(cards[1].querySelector('.saved-plan-actions')).not.toBeNull();
  });
});

describe('MyTripsComponent — Mis Planes IA tab', () => {
  let component: MyTripsComponent;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [MyTripsComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
    });
    component = TestBed.createComponent(MyTripsComponent).componentInstance;
  });

  it('fetches and lists AI plan history when the aiplans tab is opened', () => {
    const historyItem = {
      requestId: 'req-1', status: 'completed' as const,
      requestParams: { selectedOption: { id: 1, title: 'Ruta Clásica por Europa', summary: 's', highlights: [] }, preferences: 'p' },
      result: { title: 'Mi Plan Europa', stops: [], transits: [] },
      karmaCharged: 1, createdAt: new Date().toISOString(),
    };
    jest.spyOn((component as any).api, 'getAiPlanHistory').mockReturnValue(of([historyItem]));

    component.openAiPlansTab();

    expect(component.favTab()).toBe('aiplans');
    expect(component.aiPlanHistory()).toEqual([historyItem]);
  });

  it('opens straight onto Mis Planes IA when facade.pendingMyTripsTab is aiplans', () => {
    (component as any).facade.pendingMyTripsTab.set('aiplans');
    jest.spyOn((component as any).api, 'getAiPlanHistory').mockReturnValue(of([]));

    const reconstructed = TestBed.createComponent(MyTripsComponent).componentInstance;

    expect(reconstructed.favTab()).toBe('aiplans');
  });
});
