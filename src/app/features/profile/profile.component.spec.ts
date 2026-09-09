import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { NavFacadeService } from '../nav/nav-facade.service';
import { AuthService } from '../../core/auth/auth.service';

// ProfileComponent renders <app-nav>, whose DeviceService reads window.matchMedia.
(window as any).matchMedia = (window as any).matchMedia ?? (() => ({
  matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {},
}));

describe('ProfileComponent — edit account accordion', () => {
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(ProfileComponent);
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
    // This test verifies the bug fix: clicking "Mis viajes" in the nav (rendered via ProfileComponent's own <app-nav>)
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

  it('has exactly three accordion toggle buttons in the edit-account section', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.profile-accordion-hd');
    expect(buttons.length).toBe(3);
  });

  it('renders the country combobox when the País de residencia section is opened', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.profile-accordion-hd');
    (buttons[2] as HTMLButtonElement).click();
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
});
