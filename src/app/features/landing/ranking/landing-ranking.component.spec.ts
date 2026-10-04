import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { LandingRankingComponent } from './landing-ranking.component';
import { RankingService } from '../../../core/rankings/ranking.service';
import { AuthService } from '../../../core/auth/auth.service';
import { MyRankings, WeeklyRankings } from '../../../core/models/ranking.model';

class FakeIO {
  static last: FakeIO;
  constructor(public cb: (e: { isIntersecting: boolean }[]) => void) { FakeIO.last = this; }
  observe() {} disconnect() {}
  fire(isIntersecting: boolean) { this.cb([{ isIntersecting }]); }
}

const W: WeeklyRankings = {
  weekStart: '2026-09-28', generatedAt: '2026-10-04T17:32:00.000Z',
  topPlanners: [{ name: 'Ana', value: 8 }], topDestinations: [{ cityId: 'paris', value: 3 }],
  topTrophies: [{ name: 'Luis', value: 1 }], topFavorited: [{ title: 'Europa', shareId: 's1', ownerName: 'Ana', value: 5 }],
};

function setup(o: { weekly?: WeeklyRankings | null; weeklyError?: boolean; mine?: MyRankings | null; mineLoading?: boolean; mineError?: boolean; userName?: string } = {}) {
  (global as any).IntersectionObserver = FakeIO;
  const svc = {
    weekly: signal(o.weekly === undefined ? W : o.weekly), weeklyError: signal(o.weeklyError ?? false),
    mine: signal(o.mine ?? null), mineLoading: signal(o.mineLoading ?? false), mineError: signal(o.mineError ?? false),
    load: jest.fn(), loadMine: jest.fn(), reset: jest.fn(),
  };
  TestBed.configureTestingModule({
    imports: [LandingRankingComponent],
    providers: [provideRouter([]), { provide: RankingService, useValue: svc },
      { provide: AuthService, useValue: { currentUser: () => ({ name: o.userName ?? 'Zoe', email: 'z@x.com' }) } }],
  });
  const fixture = TestBed.createComponent(LandingRankingComponent);
  fixture.detectChanges();
  return { fixture, svc, el: fixture.nativeElement as HTMLElement };
}

describe('LandingRankingComponent', () => {
  it('loads weekly and mine on init', () => {
    const { svc } = setup();
    expect(svc.load).toHaveBeenCalled();
    expect(svc.loadMine).toHaveBeenCalled();
  });

  it('renders 4 charts with a link for favorited plans', () => {
    const { el } = setup();
    expect(el.querySelectorAll('.rk-chart')).toHaveLength(4);
    expect(el.querySelector('.rk-chart a')?.getAttribute('href')).toBe('/shared/s1');
  });

  it('toggles .filled on every enter/leave so the bars refill each pass', () => {
    const { fixture, el } = setup();
    const section = el.querySelector('.landing-ranking')!;
    FakeIO.last.fire(true);  fixture.detectChanges();
    expect(section.classList).toContain('filled');
    FakeIO.last.fire(false); fixture.detectChanges();
    expect(section.classList).not.toContain('filled');
    FakeIO.last.fire(true);  fixture.detectChanges();
    expect(section.classList).toContain('filled');
  });

  it('shows "Calculando…" in the 3 user charts while mine is loading (none for destinations)', () => {
    const { el } = setup({ mineLoading: true });
    expect(el.querySelectorAll('.rk-calc')).toHaveLength(3);
  });

  it('outside the top 3 → own "Tú" row under the chart with rank and bar; other charts say "not yet"', () => {
    const { el } = setup({ mine: { weekStart: '2026-09-28', planners: { rank: 4, value: 1 }, trophies: null, favorited: null } });
    const you = el.querySelectorAll('.rk-you');
    expect(you).toHaveLength(1);
    expect(you[0].closest('.rk-chart')!.getAttribute('data-key')).toBe('planners');
    expect(you[0].querySelector('.rk-rank')!.textContent!.trim()).toBe('4');
    expect(you[0].textContent).toContain('Tú');
    expect(you[0].querySelector('.rk-fill')).not.toBeNull();
    const notYet = Array.from(el.querySelectorAll('.rk-me')).map(n => n.textContent!.trim());
    expect(notYet).toHaveLength(2);
    expect(notYet.every(t => /Aún no apareces/.test(t))).toBe(true);
  });

  it('on the podium → that row is highlighted with a "Tú" chip, no extra row', () => {
    const { el } = setup({ userName: 'Ana', mine: { weekStart: '2026-09-28', planners: { rank: 1, value: 8 }, trophies: null, favorited: { rank: 1, value: 5 } } });
    const hl = el.querySelectorAll('.rk-rows .rk-row--me');
    expect(hl).toHaveLength(2); // planners (Ana 8) + favorited (Europa by Ana, 5)
    expect(hl[0].querySelector('.rk-you-chip')?.textContent).toContain('Tú');
    expect(el.querySelectorAll('.rk-you')).toHaveLength(0);
  });

  it('puts a 🏆 next to first place in every chart', () => {
    const { el } = setup();
    const firsts = Array.from(el.querySelectorAll('.rk-rows')).map(ol => ol.querySelector('.rk-row'));
    expect(firsts.every(r => r!.querySelector('.rk-cup')?.textContent === '🏆')).toBe(true);
    expect(el.querySelectorAll('.rk-cup')).toHaveLength(4);
  });

  it('weekly failed but mine fine → Travel Expert charts, Tú still shown, no last-update line (Review Focus 5)', () => {
    const { el } = setup({ weekly: null, weeklyError: true, mine: { weekStart: '2026-09-28', planners: { rank: 1, value: 2 }, trophies: null, favorited: null } });
    expect(el.textContent).toContain('Travel Expert');
    expect(el.querySelectorAll('.rk-you')).toHaveLength(1);   // podium rank but no matching fallback row → own row
    expect(el.querySelectorAll('.rk-me')).toHaveLength(2);    // "not yet" for trophies + favorited
    expect(el.querySelector('.rk-updated')).toBeNull();
  });

  it('mine failed → no Tú rows, charts unaffected (Review Focus 5)', () => {
    const { el } = setup({ mineError: true });
    expect(el.querySelectorAll('.rk-me, .rk-you, .rk-row--me')).toHaveLength(0);
    expect(el.querySelectorAll('.rk-chart')).toHaveLength(4);
  });

  it('shows the faint last-update line with real data', () => {
    const { el } = setup();
    expect(el.querySelector('.rk-updated')?.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it('while loading (weekly null, no error) no charts are shown (Review Focus 4)', () => {
    const { el } = setup({ weekly: null, weeklyError: false });
    expect(el.querySelectorAll('.rk-chart')).toHaveLength(0);
    expect(el.textContent).not.toContain('Travel Expert');
  });
});
