import { signal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WelcomeComponent } from './welcome.component';
import { AuthService } from '../../core/auth/auth.service';
import { SavedPlansService, SavedPlan } from '../../core/saved-plans/saved-plans.service';
import { LandingFeedService } from '../landing/feed/landing-feed.service';
import { LocaleService } from '../../core/i18n/locale.service';
import { FeedPlan } from '../../core/models/feed-plan.model';

// Task: welcome-page guide discovery row. Mocked here (rather than relying on the real manifest's
// `reviewed` flags, which change independently as guides launch) so this spec stays stable
// regardless of which cities are actually published at any given time.
jest.mock('../../data/city-guides.data', () => {
  const actual = jest.requireActual('../../data/city-guides.data');
  return { ...actual, CITY_GUIDES: [
    { ...actual.CITY_GUIDES[0], slug: 'madrid', displayName: 'Madrid', reviewed: true },
    { ...actual.CITY_GUIDES[0], slug: 'barcelona', displayName: 'Barcelona', reviewed: true },
    { ...actual.CITY_GUIDES[0], slug: 'hidden', displayName: 'Oculta', reviewed: false },
  ] };
});

describe('WelcomeComponent — last edited plan shortcut', () => {
  let fixture: ComponentFixture<WelcomeComponent>;
  let auth: AuthService;
  let savedPlans: SavedPlansService;

  const olderPlan: SavedPlan = { id: 'p1', name: 'Europa 2026', savedAt: '2026-08-01T10:00:00.000Z', stops: [] };
  const newerPlan: SavedPlan = { id: 'p2', name: 'Asia 2027',   savedAt: '2026-08-20T10:00:00.000Z', stops: [] };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WelcomeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
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

  it('does not render the slider arrows (dead controls removed, feedback #1)', () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.slider-arrows')).toBeNull();
  });
});

describe('WelcomeComponent — scroll-to-feed pill', () => {
  const feedStub = { hasItems: signal(false), topPlan: signal<FeedPlan | null>(null) };
  const top = (favoriteCount: number, tripName = 'Roma y Florencia en 6 días'): FeedPlan =>
    ({ id: 'p1', tripName, ownerName: 'Ana', createdAt: '', favoriteCount, stops: [] });

  beforeEach(() => {
    feedStub.hasItems.set(false);
    feedStub.topPlan.set(null);
    TestBed.configureTestingModule({
      imports: [WelcomeComponent],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: LandingFeedService, useValue: feedStub },
        { provide: LocaleService, useValue: { current: () => 'es-CL' } },
      ],
    });
  });

  const pill = (f: ComponentFixture<WelcomeComponent>) => f.nativeElement.querySelector('.welcome-feed-pill') as HTMLButtonElement | null;

  it('is hidden until the feed has plans', () => {
    feedStub.hasItems.set(false);
    const f = TestBed.createComponent(WelcomeComponent); f.detectChanges();
    expect(pill(f)).toBeNull();
  });

  it('shows the specific label when the top plan has favorites', () => {
    feedStub.hasItems.set(true); feedStub.topPlan.set(top(128));
    const f = TestBed.createComponent(WelcomeComponent); f.detectChanges();
    expect(pill(f)!.textContent).toContain('♥ 128 · Roma y Florencia en 6 días — ver más');
    expect(pill(f)!.getAttribute('aria-label')).toContain('128');
  });

  it('truncates a long title to 28 characters with an ellipsis', () => {
    feedStub.hasItems.set(true); feedStub.topPlan.set(top(5, 'Un viaje larguísimo por toda la Patagonia chilena'));
    const f = TestBed.createComponent(WelcomeComponent); f.detectChanges();
    expect(pill(f)!.textContent).toContain('…');
    expect(pill(f)!.textContent).not.toContain('chilena');
  });

  it('falls back to the generic label when the top plan has 0 favorites', () => {
    feedStub.hasItems.set(true); feedStub.topPlan.set(top(0));
    const f = TestBed.createComponent(WelcomeComponent); f.detectChanges();
    expect(pill(f)!.textContent).toContain('Descubre planes de otros viajeros');
    expect(pill(f)!.textContent).not.toContain('♥');
  });

  it('emits scrollToFeed on click', () => {
    feedStub.hasItems.set(true); feedStub.topPlan.set(top(3));
    const f = TestBed.createComponent(WelcomeComponent); f.detectChanges();
    const spy = jest.fn(); f.componentInstance.scrollToFeed.subscribe(spy);
    pill(f)!.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('WelcomeComponent — city guide discovery row', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [WelcomeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const f = TestBed.createComponent(WelcomeComponent);
    f.detectChanges();
    return f;
  }

  it('links every reviewed guide (capped at 5) and hides unreviewed ones', () => {
    const el: HTMLElement = setup().nativeElement;
    const links = Array.from(el.querySelectorAll('.welcome-guides-link')) as HTMLAnchorElement[];
    expect(links.map(a => a.textContent)).toEqual(['Madrid', 'Barcelona']);
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/ciudad/madrid', '/ciudad/barcelona']);
    expect(el.textContent).not.toContain('Oculta');
  });
});
