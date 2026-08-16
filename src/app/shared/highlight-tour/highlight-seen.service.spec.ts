import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HighlightSeenService } from './highlight-seen.service';

describe('HighlightSeenService', () => {
  let service: HighlightSeenService;
  let http: HttpTestingController;

  beforeEach(() => {
    document.cookie.split(';').forEach(c => {
      const name = c.split('=')[0].trim();
      if (name.startsWith('tb_highlight_seen_')) document.cookie = `${name}=; path=/; max-age=0`;
    });
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

  it('hasSeenLocally() is false when no cookie is set', () => {
    expect(service.hasSeenLocally('landing_welcome')).toBe(false);
  });

  it('markSeenLocally() sets a cookie that hasSeenLocally() then reads back as true', () => {
    service.markSeenLocally('landing_welcome');
    expect(service.hasSeenLocally('landing_welcome')).toBe(true);
  });

  it('checkServerStatus() maps the HTTP response to a boolean', done => {
    service.checkServerStatus('landing_welcome').subscribe(seen => {
      expect(seen).toBe(true);
      done();
    });
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/status')).flush({ seen: true });
  });

  it('markSeenOnServer() fires the POST and swallows an error (fire-and-forget)', () => {
    expect(() => service.markSeenOnServer('landing_welcome')).not.toThrow();
    const req = http.expectOne(r => r.url.includes('/highlights/landing_welcome/seen') && r.method === 'POST');
    req.flush(null, { status: 500, statusText: 'Server Error' });
  });
});
