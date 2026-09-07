import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { NavFacadeService } from '../nav/nav-facade.service';

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
    // This test verifies that ProfileComponent no longer emits its own openMyTrips
    // output, and instead relies on NavFacadeService.openMyTrips() being called
    // from NavDesktopComponent/NavMobileComponent directly.
    const component = fixture.componentInstance;
    expect(component.openMyTrips).toBeUndefined();
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
});
