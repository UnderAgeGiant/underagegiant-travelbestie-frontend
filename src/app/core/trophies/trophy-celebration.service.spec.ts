import { TestBed } from '@angular/core/testing';
import { TrophyCelebrationService } from './trophy-celebration.service';
import { AuthService } from '../auth/auth.service';
import { EarnedTrophy } from '../models/trophy.model';

const t = (type: any, tier: any): EarnedTrophy => ({ type, tier, earnedAt: '2026-10-01T00:00:00.000Z' });

describe('TrophyCelebrationService', () => {
  let svc: TrophyCelebrationService;

  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { currentUser: () => ({ email: 'a@x.com' }) } }],
    });
    svc = TestBed.inject(TrophyCelebrationService);
  });
  afterEach(() => jest.useRealTimers());

  it('shows trophies one at a time and bursts streamers for each', () => {
    const b0 = svc.burstId();
    svc.celebrate([t('ai_plans', 'bronze'), t('ai_plans', 'silver')]);
    expect(svc.current()?.tier).toBe('bronze');
    expect(svc.burstId()).toBe(b0 + 1);
    svc.dismiss();
    expect(svc.current()?.tier).toBe('silver');
    svc.dismiss();
    expect(svc.current()).toBeNull();
  });

  it('auto-dismisses after ~4s', () => {
    svc.celebrate([t('share_plan', 'single')]);
    jest.advanceTimersByTime(4100);
    expect(svc.current()).toBeNull();
  });

  it('never celebrates the same type:tier twice for the same user (persists in localStorage)', () => {
    svc.celebrate([t('publish_plan', 'single')]);
    svc.dismiss();
    svc.celebrate([t('publish_plan', 'single')]);
    expect(svc.current()).toBeNull();
    expect(localStorage.getItem('tb_trophies_celebrated_a@x.com')).toContain('publish_plan:single');
  });

  it('shows a duplicate type:tier inside one list only once', () => {
    svc.celebrate([t('comments', 'bronze'), t('comments', 'bronze')]);
    svc.dismiss();
    expect(svc.current()).toBeNull();
  });

  it('clear() empties the queue, timer and current card', () => {
    svc.celebrate([t('ai_plans', 'bronze'), t('ai_plans', 'silver')]);
    svc.clear();
    expect(svc.current()).toBeNull();
    jest.advanceTimersByTime(5000);
    expect(svc.current()).toBeNull();
  });

  it('dedupes in memory when localStorage throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    svc.celebrate([t('clones', 'gold')]);
    svc.dismiss();
    svc.celebrate([t('clones', 'gold')]);
    expect(svc.current()).toBeNull();
  });

  it('still works when localStorage throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    svc.celebrate([t('comments', 'bronze')]);
    expect(svc.current()?.type).toBe('comments');
  });
});
