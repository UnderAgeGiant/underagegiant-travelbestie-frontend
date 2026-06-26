import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NavShellComponent } from './nav-shell.component';
import { DeviceService } from '../../core/device/device.service';

class FakeDevice {
  private mobile = false;
  isMobile = () => this.mobile;
  isDesktop = () => !this.mobile;
  setMobile(v: boolean) { this.mobile = v; }
}

describe('NavShellComponent', () => {
  function setup(mobile: boolean) {
    localStorage.clear();
    const device = new FakeDevice();
    device.setMobile(mobile);
    TestBed.configureTestingModule({
      imports: [NavShellComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: DeviceService, useValue: device }],
    });
    const fixture = TestBed.createComponent(NavShellComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the desktop bar on a wide viewport', () => {
    const el = setup(false).nativeElement as HTMLElement;
    expect(el.querySelector('app-nav-desktop')).toBeTruthy();
    expect(el.querySelector('app-nav-mobile')).toBeNull();
  });

  it('renders the mobile bar on a narrow viewport', () => {
    const el = setup(true).nativeElement as HTMLElement;
    expect(el.querySelector('app-nav-mobile')).toBeTruthy();
    expect(el.querySelector('app-nav-desktop')).toBeNull();
  });

  it('always renders the shared auth modal', () => {
    const el = setup(false).nativeElement as HTMLElement;
    expect(el.querySelector('app-auth-modal')).toBeTruthy();
  });
});
