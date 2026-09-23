import { Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LandingFeedComponent } from './landing-feed.component';
import { FeedPlanCardComponent } from './feed-plan-card.component';
import { LandingFeedService } from './landing-feed.service';
import { ApiService } from '../../../core/api/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { FeedPage, FeedPlan } from '../../../core/models/feed-plan.model';

@Component({ selector: 'tb-feed-plan-card', template: '' })
class CardStub {
  readonly plan = input.required<FeedPlan>();
  readonly active = input(false);
}

const plan = (n: number): FeedPlan => ({
  id: `p${n}`, tripName: `Plan ${n}`, ownerName: 'Ana', createdAt: '2026-09-01T00:00:00Z', favoriteCount: 50 - n, stops: [],
});
const page = (from: number, count: number, next: string | null): FeedPage =>
  ({ items: Array.from({ length: count }, (_, i) => plan(from + i)), nextCursor: next });

describe('LandingFeedComponent', () => {
  let fixture: ComponentFixture<LandingFeedComponent>;
  let getFeed: jest.Mock;
  let feed: LandingFeedService;
  const ITEM_H = 696; // jsdom innerHeight 768 - 72 nav (the component's fallback when nothing is laid out)

  const el = () => fixture.nativeElement as HTMLElement;
  const renderedIndexes = () => Array.from(el().querySelectorAll('.feed-item')).map(n => Number(n.getAttribute('data-index')));
  const scrollTo = (index: number) => {
    // host top such that the viewport centre (384) falls inside item `index`
    el().getBoundingClientRect = () => ({ top: 384 - index * ITEM_H - 100 } as DOMRect);
    document.dispatchEvent(new Event('scroll'));
    jest.advanceTimersByTime(20);
    fixture.detectChanges();
  };

  let isLoggedInSignal: any;

  beforeEach(() => {
    jest.useFakeTimers();
    getFeed = jest.fn();
    isLoggedInSignal = signal(true);
    TestBed.configureTestingModule({
      imports: [LandingFeedComponent],
      providers: [
        { provide: ApiService, useValue: { getFeed } },
        { provide: AuthService, useValue: { isLoggedIn: isLoggedInSignal } },
      ],
    });
    TestBed.overrideComponent(LandingFeedComponent, { remove: { imports: [FeedPlanCardComponent] }, add: { imports: [CardStub] } });
    feed = TestBed.inject(LandingFeedService);
    fixture = TestBed.createComponent(LandingFeedComponent);
  });
  afterEach(() => { fixture.destroy(); jest.useRealTimers(); });

  const boot = (first: FeedPage) => {
    getFeed.mockReturnValueOnce(of(first));
    fixture.detectChanges();
    jest.advanceTimersByTime(300);          // idle/timeout kick-off of initialLoad()
    fixture.detectChanges();
  };

  it('is hidden while the feed has no items', () => {
    boot({ items: [], nextCursor: null });
    expect(el().style.display).toBe('none');
  });

  it('stays hidden and never calls the API when the visitor is not logged in (feedback F2)', () => {
    isLoggedInSignal.set(false);
    boot(page(0, 20, 'c1'));
    expect(el().style.display).toBe('none');
    expect(getFeed).not.toHaveBeenCalled();
  });

  it('loads once the visitor logs in mid-session', () => {
    isLoggedInSignal.set(false);
    fixture.detectChanges();
    jest.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(getFeed).not.toHaveBeenCalled();

    isLoggedInSignal.set(true);
    getFeed.mockReturnValueOnce(of(page(0, 20, 'c1')));
    fixture.detectChanges();
    expect(getFeed).toHaveBeenCalledTimes(1);
  });

  it('renders only a window of the loaded plans, with spacers standing in for the rest', () => {
    boot(page(0, 20, 'c1'));
    expect(el().style.display).not.toBe('none');
    expect(renderedIndexes()).toEqual([0, 1, 2, 3]);
    scrollTo(10);
    expect(renderedIndexes()).toEqual([8, 9, 10, 11, 12, 13]);
    const spacers = el().querySelectorAll('.feed-spacer');
    expect(spacers).toHaveLength(2);
  });

  it('marks only the item under the viewport centre as active', () => {
    boot(page(0, 20, 'c1'));
    scrollTo(10);
    const cards = fixture.debugElement.queryAll((d) => d.name === 'tb-feed-plan-card');
    const activeIdx = cards.filter(c => c.componentInstance.active()).map(c => Number(c.nativeElement.getAttribute('data-index')));
    expect(activeIdx).toEqual([10]);
  });

  it('prefetches the next page when the visitor reaches 90 % (index 18 of 20)', () => {
    boot(page(0, 20, 'c1'));
    getFeed.mockReturnValueOnce(of(page(20, 5, null)));
    scrollTo(17);
    expect(getFeed).toHaveBeenCalledTimes(1);
    scrollTo(18);
    expect(getFeed).toHaveBeenCalledTimes(2);
    expect(getFeed).toHaveBeenLastCalledWith('c1', 20);
  });

  it('shows a back-to-top button from the third plan on, and emits backToTop', () => {
    boot(page(0, 20, 'c1'));
    expect(el().querySelector('.feed-back-top')).toBeNull();
    scrollTo(3);
    const btn = el().querySelector('.feed-back-top') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    const emitted = jest.fn();
    fixture.componentInstance.backToTop.subscribe(emitted);
    btn.click();
    expect(emitted).toHaveBeenCalled();
  });

  it('shows an inline retry on a failed page without dropping loaded plans', () => {
    boot(page(0, 20, 'c1'));
    getFeed.mockReturnValueOnce(throwError(() => new Error('x'))).mockReturnValueOnce(of(page(20, 5, null)));
    scrollTo(18);
    expect(el().querySelector('.feed-error')).not.toBeNull();
    expect(feed.itemCount()).toBe(20);
    (el().querySelector('.feed-retry') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().querySelector('.feed-error')).toBeNull();
    expect(feed.itemCount()).toBe(25);
  });

  it('resets the feed and stops listening on destroy', () => {
    boot(page(0, 20, 'c1'));
    fixture.destroy();
    expect(feed.itemCount()).toBe(0);
    expect(() => document.dispatchEvent(new Event('scroll'))).not.toThrow();
  });
});
