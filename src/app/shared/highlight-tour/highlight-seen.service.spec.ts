import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HighlightSeenService } from './highlight-seen.service';

describe('HighlightSeenService', () => {
  let service: HighlightSeenService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
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

  it('markDismissedOnServer() does not touch the local cache', () => {
    service.markDismissedOnServer('landing_welcome');
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/dismiss')).flush(null);
    expect(service.hasSeenLocally('landing_welcome')).toBe(false);
  });
});
