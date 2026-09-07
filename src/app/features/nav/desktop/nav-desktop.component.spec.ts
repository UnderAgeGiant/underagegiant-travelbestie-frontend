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
});
