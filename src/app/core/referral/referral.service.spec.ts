import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReferralService } from './referral.service';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { REFERRAL_KEY } from './pending-referral';
import type { ReferralSummary } from '../models/referral.model';

const DAY = 24 * 60 * 60 * 1000;
const SUMMARY: ReferralSummary = { code: 'ana7k2xq', invitedCount: 3, monthTokens: 30, rewardTokens: 10, monthCap: 100, capResetsOn: '2026-12-01' };

describe('ReferralService', () => {
  let service: ReferralService;
  let user: { name: string; email: string } | null;
  let loggedIn: boolean;
  const api = { getMyReferrals: jest.fn() };
  const stored = () => JSON.parse(localStorage.getItem(REFERRAL_KEY) ?? 'null');
  const url = (q: string) => new URL(`https://x.test/shared/abc${q}`);

  beforeEach(() => {
    localStorage.clear();
    user = null; loggedIn = false;
    api.getMyReferrals.mockReset().mockReturnValue(of(SUMMARY));
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: { currentUser: () => user, isLoggedIn: () => loggedIn } },
      ],
    });
    service = TestBed.inject(ReferralService);
  });

  it('stores the code and channel from ?ref&via', () => {
    service.captureFromUrl(url('?ref=ana7k2xq&via=card'));
    expect(stored()).toMatchObject({ code: 'ana7k2xq', channel: 'card' });
  });

  it('defaults the channel to link for a missing or unknown via', () => {
    service.captureFromUrl(url('?ref=ana7k2xq&via=evil'));
    expect(stored().channel).toBe('link');
  });

  it('keeps the first code for 30 days', () => {
    service.captureFromUrl(url('?ref=ana7k2xq'));
    service.captureFromUrl(url('?ref=bob12345'));
    expect(stored().code).toBe('ana7k2xq');
  });

  it('replaces a code older than 30 days', () => {
    localStorage.setItem(REFERRAL_KEY, JSON.stringify({ code: 'ana7k2xq', channel: 'link', at: Date.now() - 31 * DAY }));
    service.captureFromUrl(url('?ref=bob12345'));
    expect(stored().code).toBe('bob12345');
  });

  it('stores nothing when logged in', () => {
    user = { name: 'A', email: 'a@x.cl' };
    service.captureFromUrl(url('?ref=ana7k2xq'));
    expect(stored()).toBeNull();
  });

  it('ignores a malformed code', () => {
    service.captureFromUrl(url('?ref=ZZZ'));
    expect(stored()).toBeNull();
  });

  it('strips ref and via from the address bar, keeping other params', () => {
    const spy = jest.spyOn(history, 'replaceState');
    service.captureFromUrl(url('?ref=ana7k2xq&via=card&utm_source=card'));
    expect(spy).toHaveBeenCalledWith(null, '', '/shared/abc?utm_source=card');
    spy.mockRestore();
  });

  it('pending() drops an expired entry', () => {
    localStorage.setItem(REFERRAL_KEY, JSON.stringify({ code: 'ana7k2xq', channel: 'link', at: Date.now() - 31 * DAY }));
    expect(service.pending()).toBeNull();
    expect(localStorage.getItem(REFERRAL_KEY)).toBeNull();
  });

  it('loadSummary calls the API once per login and code() returns the code', async () => {
    user = { name: 'A', email: 'a@x.cl' }; loggedIn = true;
    await Promise.all([service.loadSummary(), service.loadSummary()]);
    expect(api.getMyReferrals).toHaveBeenCalledTimes(1);
    expect(service.code()).toBe('ana7k2xq');
    service.reset();
    expect(service.summary()).toBeNull();
  });

  it('loadSummary resolves null and flags loadError on failure', async () => {
    user = { name: 'A', email: 'a@x.cl' }; loggedIn = true;
    api.getMyReferrals.mockReturnValue(throwError(() => new Error('500')));
    expect(await service.loadSummary()).toBeNull();
    expect(service.loadError()).toBe(true);
  });

  it('loadSummary retries after a failure', async () => {
    user = { name: 'A', email: 'a@x.cl' }; loggedIn = true;
    api.getMyReferrals.mockReturnValueOnce(throwError(() => new Error('429')));
    expect(await service.loadSummary()).toBeNull();
    expect(await service.loadSummary()).toEqual(SUMMARY);
    expect(api.getMyReferrals).toHaveBeenCalledTimes(2);
    expect(service.loadError()).toBe(false);
    expect(service.code()).toBe(SUMMARY.code);
  });

  it('code() is null and loads nothing when logged out', async () => {
    expect(service.code()).toBeNull();
    await Promise.resolve();
    expect(api.getMyReferrals).not.toHaveBeenCalled();
  });
});
