import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HighlightSeenService } from './highlight-seen.service';
import { highlightDeviceKey } from './highlight-storage.util';

describe('HighlightSeenService', () => {
  let service: HighlightSeenService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()), provideHttpClientTesting(),
        { provide: 'ENV', useValue: { useMocks: false, apiUrl: 'http://localhost:3000' } },
      ],
    });
    service = TestBed.inject(HighlightSeenService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('hasSeenLocally() is false when nothing is cached', () => {
    expect(service.hasSeenLocally('landing_welcome')).toBe(false);
  });

  it('markSeenLocally() caches seen=true so hasSeenLocally() then reads back as true', () => {
    service.markSeenLocally('landing_welcome');
    expect(service.hasSeenLocally('landing_welcome')).toBe(true);
  });

  it('checkServerStatus() hits the network when nothing is cached, and maps the response to a boolean', done => {
    service.checkServerStatus('landing_welcome').subscribe(seen => {
      expect(seen).toBe(true);
      done();
    });
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/status')).flush({ seen: true });
  });

  it('checkServerStatus() caches a `false` server response too, so a second call never hits the network', () => {
    let firstResult: boolean | undefined;
    service.checkServerStatus('landing_welcome').subscribe(seen => { firstResult = seen; });
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/status')).flush({ seen: false });
    expect(firstResult).toBe(false);

    let secondResult: boolean | undefined;
    service.checkServerStatus('landing_welcome').subscribe(seen => { secondResult = seen; });
    expect(secondResult).toBe(false);
    http.verify(); // no second request
  });

  it('checkServerStatus() skips the network entirely once a value is cached', () => {
    service.markSeenLocally('landing_welcome');
    let result: boolean | undefined;
    service.checkServerStatus('landing_welcome').subscribe(seen => { result = seen; });
    expect(result).toBe(true);
    http.verify(); // no request at all
  });

  it('markSeenOnServer() fires the POST and swallows an error (fire-and-forget)', () => {
    expect(() => service.markSeenOnServer('landing_welcome')).not.toThrow();
    const req = http.expectOne(r => r.url.includes('/highlights/landing_welcome/seen') && r.method === 'POST');
    req.flush(null, { status: 500, statusText: 'Server Error' });
  });

  it('markDismissedOnServer() fires the POST to /dismiss and swallows an error (fire-and-forget)', () => {
    expect(() => service.markDismissedOnServer('landing_welcome')).not.toThrow();
    const req = http.expectOne(r => r.url.includes('/highlights/landing_welcome/dismiss') && r.method === 'POST');
    req.flush(null, { status: 500, statusText: 'Server Error' });
  });

  it('markDismissedOnServer() counts as seen on this device (2026-10-25 owner rule) but leaves the session cache alone', () => {
    service.markDismissedOnServer('landing_welcome');
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/dismiss')).flush(null);
    expect(service.hasSeenLocally('landing_welcome')).toBe(true);
    expect(sessionStorage.getItem('tb_highlight_seen_landing_welcome')).toBeNull();
  });
});

describe('HighlightSeenService — once per device (2026-10-25 feedback)', () => {
  let service: HighlightSeenService;
  let http: HttpTestingController;
  const KEY = 'tb_highlight_device_seen_landing_welcome';

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
    service = TestBed.inject(HighlightSeenService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { jest.restoreAllMocks(); http.verify(); });

  it('highlightDeviceKey builds the per-device key', () => {
    expect(highlightDeviceKey('landing_welcome')).toBe(KEY);
  });

  it('checkServerStatus returns true without an API call when the device flag is set', () => {
    localStorage.setItem(KEY, '1');
    let seen: boolean | undefined;
    service.checkServerStatus('landing_welcome').subscribe(v => (seen = v));
    expect(seen).toBe(true);
    http.expectNone(r => r.url.includes('/highlights/'));
  });

  it('markSeenLocally sets the device flag', () => {
    service.markSeenLocally('landing_welcome');
    expect(localStorage.getItem(KEY)).toBe('1');
  });

  it('markDismissedOnServer sets the device flag AND still calls the API', () => {
    service.markDismissedOnServer('landing_welcome');
    expect(localStorage.getItem(KEY)).toBe('1');
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/dismiss')).flush(null);
  });

  it('hasSeenLocally is true from the device flag in a fresh tab (empty sessionStorage)', () => {
    localStorage.setItem(KEY, '1');
    expect(service.hasSeenLocally('landing_welcome')).toBe(true);
  });

  it('throwing localStorage falls back to the sessionStorage/server path', () => {
    const realGet = Storage.prototype.getItem;
    const realSet = Storage.prototype.setItem;
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, k: string) {
      if (this === localStorage) throw new Error('blocked');
      return realGet.call(this, k);
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (this === localStorage) throw new Error('blocked');
      realSet.call(this, k, v);
    });
    expect(service.hasSeenLocally('landing_welcome')).toBe(false);
    let seen: boolean | undefined;
    service.checkServerStatus('landing_welcome').subscribe(v => (seen = v));
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/status')).flush({ seen: false });
    expect(seen).toBe(false);
    expect(() => service.markDismissedOnServer('landing_welcome')).not.toThrow();
    http.expectOne(r => r.url.includes('/dismiss')).flush(null);
  });
});
