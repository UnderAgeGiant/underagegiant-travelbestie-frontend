import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WelcomeComponent } from './welcome.component';
import { AuthService } from '../../core/auth/auth.service';
import { SavedPlansService, SavedPlan } from '../../core/saved-plans/saved-plans.service';

describe('WelcomeComponent — last edited plan shortcut', () => {
  let fixture: ComponentFixture<WelcomeComponent>;
  let auth: AuthService;
  let savedPlans: SavedPlansService;

  const olderPlan: SavedPlan = { id: 'p1', name: 'Europa 2026', savedAt: '2026-08-01T10:00:00.000Z', stops: [] };
  const newerPlan: SavedPlan = { id: 'p2', name: 'Asia 2027',   savedAt: '2026-08-20T10:00:00.000Z', stops: [] };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WelcomeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    savedPlans = TestBed.inject(SavedPlansService);
    fixture = TestBed.createComponent(WelcomeComponent);
  });

  it('shows nothing when the user is logged out', () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.welcome-cta-last')).toBeNull();
  });

  it('shows nothing when there are no saved plans', () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.welcome-cta-last')).toBeNull();
  });

  it('shows the most recently saved plan by name and emits it on click', () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true);
    (savedPlans as any)._plans.set([olderPlan, newerPlan]);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.welcome-cta-last');
    expect(btn.querySelector('.welcome-cta-last-name').textContent).toContain('Asia 2027');

    let emitted: SavedPlan | undefined;
    fixture.componentInstance.loadLastEditedPlan.subscribe((p: SavedPlan) => (emitted = p));
    btn.click();
    expect(emitted?.id).toBe('p2');
  });
});
