import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { trophyHeaderInterceptor, parseNewTrophies } from './trophy-header.interceptor';
import { TrophyCelebrationService } from './trophy-celebration.service';

describe('trophyHeaderInterceptor', () => {
  const celebrate = jest.fn();
  let http: HttpClient;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    celebrate.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([trophyHeaderInterceptor])),
        provideHttpClientTesting(),
        { provide: TrophyCelebrationService, useValue: { celebrate } },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  it('celebrates trophies from the header', () => {
    http.get('/x').subscribe();
    ctrl.expectOne('/x').flush({}, { headers: { 'X-New-Trophies': '[{"type":"share_plan","tier":"single","earnedAt":"2026-10-01T00:00:00.000Z"}]' } });
    expect(celebrate).toHaveBeenCalledWith([{ type: 'share_plan', tier: 'single', earnedAt: '2026-10-01T00:00:00.000Z' }]);
  });

  it('ignores missing or malformed headers', () => {
    http.get('/a').subscribe();
    ctrl.expectOne('/a').flush({});
    http.get('/b').subscribe();
    ctrl.expectOne('/b').flush({}, { headers: { 'X-New-Trophies': 'not json' } });
    expect(celebrate).not.toHaveBeenCalled();
  });

  it('parseNewTrophies drops entries without type/tier', () => {
    expect(parseNewTrophies('[{"type":"clones"},{"type":"clones","tier":"gold","earnedAt":"x"}]'))
      .toEqual([{ type: 'clones', tier: 'gold', earnedAt: 'x' }]);
    expect(parseNewTrophies('{"a":1}')).toEqual([]);
  });

  it('parseNewTrophies drops unknown types and tiers', () => {
    expect(parseNewTrophies('[{"type":"new_thing","tier":"single","earnedAt":"x"},{"type":"clones","tier":"single","earnedAt":"x"},{"type":"clones","tier":"gold","earnedAt":"x"}]'))
      .toEqual([{ type: 'clones', tier: 'gold', earnedAt: 'x' }]);
  });
});
