import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TrophyShelfComponent } from './trophy-shelf.component';
import { TrophyService } from '../../../core/trophies/trophy.service';

describe('TrophyShelfComponent', () => {
  const earned = signal<any[]>([]);
  const progress = signal<any>({});
  const loadError = signal(false);
  const loading = signal(false);
  const load = jest.fn();

  function create() {
    TestBed.configureTestingModule({
      imports: [TrophyShelfComponent],
      providers: [provideRouter([]), { provide: TrophyService, useValue: { earned, progress, loadError, loading, load } }],
    });
    const f = TestBed.createComponent(TrophyShelfComponent);
    f.detectChanges();
    return f;
  }

  beforeEach(() => { earned.set([]); progress.set({}); loadError.set(false); loading.set(false); load.mockReset(); });

  it('loads on init and shows the empty state', () => {
    const f = create();
    expect(load).toHaveBeenCalled();
    expect(f.nativeElement.textContent).toContain('Aún no tienes trofeos');
  });

  it('does not flash the empty state while loading', () => {
    loading.set(true);
    const f = create();
    expect(f.nativeElement.textContent).not.toContain('Aún no tienes trofeos');
    loading.set(false);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Aún no tienes trofeos');
  });

  it('ignores unknown trophy types in the bubbles', () => {
    earned.set([{ type: 'brand_new', tier: 'single', earnedAt: '2026-10-01T00:00:00.000Z' }]);
    const f = create();
    expect(f.nativeElement.querySelectorAll('.ts-bubble').length).toBe(0);
  });

  it('renders one bubble per earned medal', () => {
    earned.set([
      { type: 'ai_plans', tier: 'bronze', earnedAt: '2026-10-01T00:00:00.000Z' },
      { type: 'ai_plans', tier: 'silver', earnedAt: '2026-10-05T00:00:00.000Z' },
      { type: 'publish_plan', tier: 'single', earnedAt: '2026-10-02T00:00:00.000Z' },
    ]);
    const f = create();
    expect(f.nativeElement.querySelectorAll('.ts-bubble').length).toBe(3);
  });

  it('tapping a bubble shows its name and date', () => {
    earned.set([{ type: 'clones', tier: 'gold', earnedAt: '2026-10-01T00:00:00.000Z' }]);
    const f = create();
    f.nativeElement.querySelector('.ts-bubble').click();
    f.detectChanges();
    const tip = f.nativeElement.querySelector('.ts-tip-open');
    expect(tip.textContent).toContain('Plan inspirador');
    expect(tip.textContent).toContain('Oro');
  });

  it('"Ver todos" lists every trophy: earned in color with date, the rest grey with progress', () => {
    earned.set([{ type: 'comments', tier: 'bronze', earnedAt: '2026-10-01T00:00:00.000Z' }]);
    progress.set({ comments: 7 });
    const f = create();
    f.nativeElement.querySelector('.ts-toggle').click();
    f.detectChanges();
    const rows = f.nativeElement.querySelectorAll('.ts-row');
    expect(rows.length).toBe(16);   // 4 tiered × 3 + 4 single
    const locked = f.nativeElement.querySelectorAll('.ts-row.ts-locked');
    expect(locked.length).toBe(15);
    expect(f.nativeElement.textContent).toContain('7 / 20');   // comments silver progress
    f.nativeElement.querySelector('.ts-toggle').click();
    f.detectChanges();
    expect(f.nativeElement.querySelector('.ts-row')).toBeNull();
  });

  it('shows an error state with retry', () => {
    loadError.set(true);
    const f = create();
    load.mockReset();
    f.nativeElement.querySelector('.ts-retry').click();
    expect(load).toHaveBeenCalled();
  });

  it('?focus=<type>:<tier> flashes that earned bubble once it renders', () => {
    jest.useFakeTimers();
    Element.prototype.scrollIntoView = jest.fn();
    earned.set([{ type: 'ai_plans', tier: 'bronze', earnedAt: '2026-10-01T00:00:00Z' }]);
    TestBed.configureTestingModule({
      imports: [TrophyShelfComponent],
      providers: [
        provideRouter([]),
        { provide: TrophyService, useValue: { earned, progress, loadError, loading, load } },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({ focus: 'ai_plans:bronze' })) } },
      ],
    });
    const f = TestBed.createComponent(TrophyShelfComponent);
    f.detectChanges();
    jest.advanceTimersByTime(300);
    expect(f.nativeElement.querySelector('[data-focus-id="ai_plans:bronze"]').classList).toContain('tb-focus-flash');
    jest.useRealTimers();
  });
});
