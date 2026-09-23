import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NavDesktopComponent } from './nav-desktop.component';
import { NavFacadeService } from '../nav-facade.service';

describe('NavDesktopComponent — active page indication', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [NavDesktopComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(NavDesktopComponent);
    const facade = TestBed.inject(NavFacadeService);
    const auth = TestBed.inject(NavFacadeService).auth;
    auth.setTokens('fake-token', { name: 'Test User', email: 'test@example.com', countryOfResidence: null });
    facade.userMenuOpen.set(true); // "Mi perfil"/"Mis viajes" live in the user-menu panel
    fixture.detectChanges();
    return fixture;
  }

  it('marks neither button active by default', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('.nav-page-btn.active')).toBeNull();
  });

  it('marks "Mi perfil" active when activeView is "profile"', () => {
    const fixture = setup();
    fixture.componentRef.setInput('activeView', 'profile');
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector('.nav-page-btn.active');
    expect(active?.textContent).toContain('Mi perfil');
  });

  it('marks "Mis viajes" active when activeView is "mytrips"', () => {
    const fixture = setup();
    fixture.componentRef.setInput('activeView', 'mytrips');
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector('.nav-page-btn.active');
    expect(active?.textContent).toContain('Mis viajes');
  });

  it('marks "Historial de karma" active when activeView is "karmahistory"', () => {
    const fixture = setup();
    fixture.componentRef.setInput('activeView', 'karmahistory');
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector('.nav-page-btn.active');
    expect(active?.textContent).toContain('Historial de token');
  });
});

describe('NavDesktopComponent — outside-click close is multi-instance safe', () => {
  // Multiple <app-nav> instances can be mounted at once in the real app (the
  // base shell nav plus whichever overlay's own nav — Profile/MyTrips/
  // AiPlanning/SharedTrip/About), all sharing NavFacadeService.userMenuOpen.
  // These tests fake the real <app-nav-desktop> nesting inside <app-nav> (the
  // NavShellComponent host tag) by wrapping each bare fixture manually, since
  // this spec instantiates NavDesktopComponent directly rather than through
  // NavShellComponent. TestBed is configured once in beforeEach so both
  // fixtures in a test resolve the SAME NavFacadeService singleton, matching
  // how it actually works in the app.
  let facade: NavFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NavDesktopComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    facade = TestBed.inject(NavFacadeService);
    facade.auth.setTokens('fake-token', { name: 'Test User', email: 'test@example.com', countryOfResidence: null });
  });

  afterEach(() => {
    document.querySelectorAll('body > app-nav').forEach(el => el.remove());
  });

  function mountWrapped() {
    const fixture = TestBed.createComponent(NavDesktopComponent);
    fixture.detectChanges();
    const wrapper = document.createElement('app-nav');
    wrapper.appendChild(fixture.nativeElement);
    document.body.appendChild(wrapper);
    return { fixture, wrapper };
  }

  it('does not close the shared user menu when a mousedown lands inside a DIFFERENT mounted <app-nav> instance', () => {
    mountWrapped();
    const { fixture: otherFixture, wrapper: otherWrapper } = mountWrapped();
    facade.userMenuOpen.set(true);
    otherFixture.detectChanges();

    // Simulate clicking "Mis viajes" in the OTHER instance's panel — the bug:
    // the first instance's own outside-click handler used to see this as
    // outside ITS elRef and close the shared signal before the click could
    // register on the button.
    const myTripsBtn = Array.from(otherWrapper.querySelectorAll('button'))
      .find((b: any) => b.textContent.includes('Mis viajes')) as HTMLElement;
    myTripsBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(facade.userMenuOpen()).toBe(true);
  });

  it('still closes the shared user menu when a mousedown lands genuinely outside every mounted <app-nav> instance', () => {
    mountWrapped();
    facade.userMenuOpen.set(true);

    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    outsideEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    outsideEl.remove();

    expect(facade.userMenuOpen()).toBe(false);
  });
});

describe('NavDesktopComponent — search box (feedback #9)', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [NavDesktopComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(NavDesktopComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('does not show a city quick-add row for a query that matches a world city', () => {
    const fixture = setup();
    const facade = TestBed.inject(NavFacadeService);
    facade.navQuery.set('Paris');
    facade.searchOpen.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.combo-item-flag')).toBeNull();
  });

  it('shows the new search placeholder', () => {
    const fixture = setup();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.nav-search-inner input');
    expect(input.placeholder).toBe('Buscar viajes creados por otros usuarios');
  });
});

describe('NavDesktopComponent — Mis viajes button spacing (feedback #14)', () => {
  it('has a 4px margin-bottom, not 8px', () => {
    TestBed.configureTestingModule({
      imports: [NavDesktopComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(NavDesktopComponent);
    const facade = TestBed.inject(NavFacadeService);
    facade.auth.setTokens('fake-token', { name: 'Test User', email: 'test@example.com', countryOfResidence: null });
    facade.userMenuOpen.set(true);
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.nav-page-btn'));
    const myTripsBtn = buttons.find(b => b.textContent?.includes('Mis viajes'));
    expect(myTripsBtn?.style.marginBottom).toBe('4px');
  });
});

describe('NavDesktopComponent — city guide promo teaser', () => {
  function setup(show: boolean) {
    TestBed.configureTestingModule({
      imports: [NavDesktopComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(NavDesktopComponent);
    fixture.componentRef.setInput('showCityGuidePromo', show);
    fixture.detectChanges();
    return fixture;
  }

  it('mounts the promo teaser next to the search box by default (every page with <app-nav>)', () => {
    const fixture = setup(true);
    expect(fixture.nativeElement.querySelector('app-city-guide-promo')).not.toBeNull();
  });

  it('omits the promo teaser when a page explicitly opts out (showCityGuidePromo=false)', () => {
    const fixture = setup(false);
    expect(fixture.nativeElement.querySelector('app-city-guide-promo')).toBeNull();
  });

  it('defaults showCityGuidePromo to true when the input is left unbound', () => {
    TestBed.configureTestingModule({
      imports: [NavDesktopComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(NavDesktopComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-city-guide-promo')).not.toBeNull();
  });
});
