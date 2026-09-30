import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LocaleService } from './locale.service';

function makeService(currentLocale: string, documentOverride?: unknown): LocaleService {
  TestBed.configureTestingModule({
    providers: [
      { provide: LOCALE_ID, useValue: currentLocale },
      ...(documentOverride ? [{ provide: DOCUMENT, useValue: documentOverride }] : []),
    ],
  });
  return TestBed.inject(LocaleService);
}

describe('LocaleService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.cookie = 'tb_locale=; path=/; max-age=0';
    TestBed.resetTestingModule();
  });

  it('reports the current and other locale from LOCALE_ID', () => {
    const svc = makeService('es-CL');
    expect(svc.current()).toBe('es-CL');
    expect(svc.other()).toBe('en-US');
  });

  it('falls back to the default locale when LOCALE_ID is unsupported', () => {
    expect(makeService('xx-YY').current()).toBe('es-CL');
  });

  it('persists the chosen locale as a cookie and touches no other storage key', () => {
    localStorage.setItem('tb_plan_user@x.cl', '{"stops":[]}');
    localStorage.setItem('tb_session_user', '{"name":"Ana"}');

    const svc = makeService('es-CL');
    svc.persist('en-US');

    expect(document.cookie).toContain('tb_locale=en-US');
    expect(localStorage.getItem('tb_plan_user@x.cl')).toBe('{"stops":[]}');
    expect(localStorage.getItem('tb_session_user')).toBe('{"name":"Ana"}');
  });

  it('switchTo is a no-op for the current locale, otherwise persists + reloads the current URL', () => {
    // jsdom 26+ makes window.location a non-configurable "unforgeable" property
    // (matching the real browser spec), so it cannot be redefined directly here.
    // Instead, inject a fake DOCUMENT whose defaultView exposes a spyable
    // location.reload while delegating sessionStorage to the real window.
    const reloadSpy = jest.fn();
    const fakeDocument = {
      get cookie() { return document.cookie; },
      set cookie(v: string) { document.cookie = v; },
      defaultView: { sessionStorage: window.sessionStorage, location: { reload: reloadSpy } },
    };
    const svc = makeService('es-CL', fakeDocument);

    svc.switchTo('es-CL');
    expect(reloadSpy).not.toHaveBeenCalled();

    svc.switchTo('en-US');
    expect(document.cookie).toContain('tb_locale=en-US');
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
