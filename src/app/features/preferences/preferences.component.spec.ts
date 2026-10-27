import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PreferencesComponent } from './preferences.component';
import { NavFacadeService } from '../nav/nav-facade.service';
import { AuthService } from '../../core/auth/auth.service';

// PreferencesComponent renders <app-nav>, whose DeviceService reads window.matchMedia.
(window as any).matchMedia = (window as any).matchMedia ?? (() => ({
  matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {},
}));

describe('PreferencesComponent — edit account accordion', () => {
  let fixture: ComponentFixture<PreferencesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PreferencesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(PreferencesComponent);
    fixture.detectChanges();
  });

  it('does not show an email accordion row — email editing was removed from the profile page', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Correo electrónico');
  });

  it('still shows the Nombre, Contraseña, and País de residencia accordion rows', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Nombre');
    expect(text).toContain('Contraseña');
    expect(text).toContain('País de residencia');
  });

  it('clicking "Mis viajes" navigates to My Trips regardless of which page opened this profile overlay (Feedback #7, 2026-09-07 UX-improvements round)', () => {
    // This test verifies the bug fix: clicking "Mis viajes" in the nav (rendered via PreferencesComponent's own <app-nav>)
    // calls facade.openMyTrips() instead of a now-removed local output binding, which centralizes navigation
    // through NavFacadeService where it can route through pendingMyTripsTab to handle overlays nested in multiple hosts.
    const auth = TestBed.inject(AuthService);
    const facade = TestBed.inject(NavFacadeService);
    const navSpy = jest.spyOn(facade, 'openMyTrips');

    // Log in so the "Mi perfil" and "Mis viajes" buttons appear in the rendered nav
    auth.setTokens('dummy-token', { name: 'Test User', email: 'test@example.com', countryOfResidence: 'US' });
    facade.userMenuOpen.set(true); // Desktop nav keeps Mi perfil/Mis viajes inside the collapsible user-menu panel
    fixture.detectChanges();

    // Find and click the "Mis viajes" button
    const myTripsBtn = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((b: any) => b.textContent.includes('Mis viajes')) as HTMLButtonElement;
    expect(myTripsBtn).toBeTruthy();
    myTripsBtn.click();

    // Verify the facade method was called, proving the button no longer fires a now-deleted output
    expect(navSpy).toHaveBeenCalled();
  });

  it('has exactly five accordion toggle buttons in the edit-account section (username row + Ciudad de origen)', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.pref-accordion-hd');
    expect(buttons.length).toBe(5);
  });

  it('renders the country combobox when the País de residencia section is opened', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.pref-accordion-hd');
    (buttons[3] as HTMLButtonElement).click();
    fixture.detectChanges();

    const combobox = fixture.nativeElement.querySelector('app-country-combobox');
    expect(combobox).toBeTruthy();
  });

  it('editCountryOfResidenceChanged is false until a different country is picked', () => {
    fixture.componentInstance.toggleEditSection('countryOfResidence');
    fixture.detectChanges();
    // No user logged in ⇒ homeAddress.countryCode() is null, and toggleEditSection() just
    // seeded editCountryOfResidence to match it — no pending change yet.
    expect(fixture.componentInstance.editCountryOfResidenceChanged()).toBe(false);

    fixture.componentInstance.editCountryOfResidence.set('AR');
    expect(fixture.componentInstance.editCountryOfResidenceChanged()).toBe(true);
  });

  it('editDeleteCountryOfResidence calls AuthService.updateProfile with countryOfResidence: null and resets the pending selection', () => {
    const auth = TestBed.inject(AuthService);
    const spy = jest.spyOn(auth, 'updateProfile').mockReturnValue(
      of({ user: { name: 'Test User', email: 'test@example.com', countryOfResidence: null } }),
    );
    fixture.componentInstance.editCountryOfResidence.set('CL');

    fixture.componentInstance.editDeleteCountryOfResidence();

    expect(spy).toHaveBeenCalledWith({ countryOfResidence: null });
    expect(fixture.componentInstance.editCountryOfResidence()).toBeNull();
  });

  describe('Ciudad de origen (home city)', () => {
    const CL_PLACE = { geonameId: 3897, name: 'Rancagua', countryCode: 'CL', iata: 'SCL' };

    function mockUpdate() {
      return jest.spyOn(TestBed.inject(AuthService), 'updateProfile').mockReturnValue(
        of({ user: { name: 'Test User', email: 'test@example.com' } }),
      );
    }

    it('picking a CL place with an empty country of residence also saves countryOfResidence CL', () => {
      // Earlier tests leave a session (with a country) in localStorage — make the empty case explicit.
      TestBed.inject(AuthService).setTokens('dummy-token', { name: 'Test User', email: 'test@example.com', countryOfResidence: null });
      const spy = mockUpdate();
      fixture.componentInstance.onHomePlacePicked(CL_PLACE);
      fixture.componentInstance.editSaveHomePlace();

      expect(spy).toHaveBeenCalledWith({ homePlace: CL_PLACE, countryOfResidence: 'CL' });
    });

    it('picking a CL place never overwrites an existing country of residence AR', () => {
      const auth = TestBed.inject(AuthService);
      auth.setTokens('dummy-token', { name: 'Test User', email: 'test@example.com', countryOfResidence: 'AR' });
      const spy = mockUpdate();

      fixture.componentInstance.onHomePlacePicked(CL_PLACE);
      fixture.componentInstance.editSaveHomePlace();

      const arg = spy.mock.calls[0][0];
      expect(arg).toEqual({ homePlace: CL_PLACE });
      expect(arg).not.toHaveProperty('countryOfResidence');
    });
  });

  it('does not render a "Volver" back button (feedback #7 — logo click already exits the page)', () => {
    expect(fixture.nativeElement.querySelector('.back-btn')).toBeNull();
  });
});
