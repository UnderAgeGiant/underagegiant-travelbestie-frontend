import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ProfileComponent } from './profile.component';

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

  it('still shows the Nombre, Contraseña, and Ciudad de origen accordion rows', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Nombre');
    expect(text).toContain('Contraseña');
    expect(text).toContain('Ciudad de origen');
  });

  it('has exactly three accordion toggle buttons in the edit-account section', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.profile-accordion-hd');
    expect(buttons.length).toBe(3);
  });
});
