import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { LocaleService } from './locale.service';

function makeService(currentLocale: string): LocaleService {
  TestBed.configureTestingModule({
    providers: [{ provide: LOCALE_ID, useValue: currentLocale }],
  });
  return TestBed.inject(LocaleService);
}

describe('LocaleService', () => {
  beforeEach(() => {
    localStorage.clear();
    // wipe the cookie
    document.cookie = 'tb_locale=; path=/; max-age=0';
    TestBed.resetTestingModule();
  });

  it('reports the current and other locale from LOCALE_ID', () => {
    const svc = makeService('es-CL');
    expect(svc.current()).toBe('es-CL');
    expect(svc.other()).toBe('en-US');
  });

  it('falls back to the default locale when LOCALE_ID is unsupported', () => {
    const svc = makeService('xx-YY');
    expect(svc.current()).toBe('es-CL');
  });

  it('builds the target URL for the other locale, preserving the in-app path, query and hash', () => {
    const svc = makeService('es-CL');
    expect(svc.targetUrl('en-US', '/es-CL/profile', '?share=abc', '#top'))
      .toBe('/en-US/profile?share=abc#top');
    expect(svc.targetUrl('en-US', '/es-CL/', '', ''))
      .toBe('/en-US/');
    // path with no locale prefix (e.g. dev server) still gets prefixed
    expect(svc.targetUrl('en-US', '/profile', '', ''))
      .toBe('/en-US/profile');
  });

  it('persists the chosen locale to localStorage and a cookie', () => {
    const svc = makeService('es-CL');
    svc.persist('en-US');
    expect(localStorage.getItem('tb_locale')).toBe('en-US');
    expect(document.cookie).toContain('tb_locale=en-US');
  });
});
