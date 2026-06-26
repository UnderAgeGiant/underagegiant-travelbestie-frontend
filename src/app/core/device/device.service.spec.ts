import { TestBed } from '@angular/core/testing';
import { DeviceService } from './device.service';

type Listener = (e: { matches: boolean }) => void;

function installMatchMediaMock(initialMatches: boolean) {
  let listener: Listener | null = null;
  const mql = {
    matches: initialMatches,
    media: '(max-width: 768px)',
    addEventListener: (_: string, cb: Listener) => { listener = cb; },
    removeEventListener: () => { listener = null; },
  };
  (window as any).matchMedia = () => mql;
  return {
    fire(matches: boolean) {
      mql.matches = matches;
      listener?.({ matches });
    },
  };
}

describe('DeviceService', () => {
  it('initializes isMobile from the media query and exposes isDesktop as its inverse', () => {
    installMatchMediaMock(true);
    const svc = TestBed.runInInjectionContext(() => new DeviceService());
    expect(svc.isMobile()).toBe(true);
    expect(svc.isDesktop()).toBe(false);
  });

  it('updates isMobile live when the media query change event fires', () => {
    const ctl = installMatchMediaMock(false);
    const svc = TestBed.runInInjectionContext(() => new DeviceService());
    expect(svc.isMobile()).toBe(false);

    ctl.fire(true);
    expect(svc.isMobile()).toBe(true);
    expect(svc.isDesktop()).toBe(false);
  });
});
