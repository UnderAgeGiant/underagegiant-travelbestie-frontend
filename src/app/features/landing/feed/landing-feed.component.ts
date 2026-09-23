import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, computed, effect, inject, output, signal, untracked,
} from '@angular/core';
import { FeedPlanCardComponent } from './feed-plan-card.component';
import { LandingFeedService } from './landing-feed.service';
import { AuthService } from '../../../core/auth/auth.service';
import { activeIndexFromTop, computeFeedWindow } from './feed-window.util';

const NAV_HEIGHT = 72;            // desktop nav; matches .landing-scroll's margin-top in styles.css
const MIN_ITEM_HEIGHT = 400;

@Component({
  selector: 'tb-landing-feed',
  imports: [FeedPlanCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'landing-feed',
    role: 'region',
    '[attr.aria-label]': 'regionLabel',
    '[style.display]': 'showSection() ? null : "none"',
  },
  template: `
<div class="feed-spacer" [style.height.px]="win().topSpacer" aria-hidden="true"></div>
@for (v of visible(); track v.item.key) {
  <tb-feed-plan-card class="feed-item" [attr.data-index]="v.index"
                     [plan]="v.item.plan" [active]="v.index === activeIndex()" />
}
<div class="feed-spacer" [style.height.px]="win().bottomSpacer" aria-hidden="true"></div>

@if (feed.error()) {
  <div class="feed-status feed-error" role="alert">
    <span i18n="@@feed.loadError">No pudimos cargar más planes</span>
    <button type="button" class="feed-retry" (click)="feed.retry()" i18n="@@feed.retry">Reintentar</button>
  </div>
} @else if (feed.loading() && feed.hasItems()) {
  <div class="feed-status feed-loading" aria-hidden="true"><span></span><span></span><span></span></div>
}

@if (showBackToTop()) {
  <button type="button" class="feed-back-top" (click)="backToTop.emit()"
          i18n-aria-label="@@feed.backToTop" aria-label="Volver arriba">
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>
}
  `,
})
export class LandingFeedComponent implements OnInit, OnDestroy {
  readonly feed = inject(LandingFeedService);
  private readonly auth = inject(AuthService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly backToTop = output<void>();
  protected readonly regionLabel = $localize`:@@feed.regionLabel:Planes de otros viajeros`;

  protected readonly activeIndex = signal(-1);
  private readonly measuredHeight = signal(0);
  private raf = 0;
  private idleTimer?: ReturnType<typeof setTimeout>;
  private idleHandle?: number;

  private readonly itemHeight = computed(() => this.measuredHeight() || this.fallbackHeight());
  protected readonly win = computed(() =>
    computeFeedWindow(this.feed.itemCount(), Math.max(this.activeIndex(), 0), this.itemHeight()));
  protected readonly visible = computed(() => {
    const w = this.win();
    return this.feed.items().slice(w.start, w.end).map((item, i) => ({ item, index: w.start + i }));
  });
  protected readonly showBackToTop = computed(() => this.activeIndex() >= 2);
  /** Feedback F2 (2026-09-20) — the whole S6 section stays hidden for a logged-out
   *  visitor, not just while it has no items yet. */
  protected readonly showSection = computed(() => this.auth.isLoggedIn() && this.feed.hasItems());

  private readonly onScroll = (): void => {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; this.recompute(); });
  };

  constructor() {
    // 90 % rule. Re-checks when a page lands while the visitor is still past the threshold.
    effect(() => {
      const i = this.activeIndex();
      this.feed.itemCount();
      if (i >= 0) untracked(() => this.feed.onActiveIndex(i));   // untracked: service reads its own signals
    });
    // Feedback F2 — load only once logged in. Covers both "already logged in at mount" and
    // "logs in mid-session" (this effect re-fires the moment isLoggedIn() flips true;
    // initialLoad() is a no-op if a load is already in flight or done, so the two paths never
    // race). The load itself is always deferred to browser idle time (never during the
    // triggering change detection) so it never competes with S1's first paint.
    effect(() => {
      if (!this.auth.isLoggedIn()) return;
      untracked(() => this.scheduleInitialLoad());
    });
  }

  ngOnInit(): void {
    document.addEventListener('scroll', this.onScroll, { capture: true, passive: true });
    window.addEventListener('resize', this.onScroll, { passive: true });
  }

  private scheduleInitialLoad(): void {
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) this.idleHandle = idle.call(window, () => this.feed.initialLoad());
    else this.idleTimer = setTimeout(() => this.feed.initialLoad(), 0);
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.onScroll, { capture: true });
    window.removeEventListener('resize', this.onScroll);
    if (this.raf) cancelAnimationFrame(this.raf);
    clearTimeout(this.idleTimer);
    const cancelIdle = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
    if (this.idleHandle !== undefined && cancelIdle) cancelIdle.call(window, this.idleHandle);
    this.feed.reset();          // next landing mount starts from a fresh, freshly-ranked list
  }

  private fallbackHeight(): number {
    return Math.max(window.innerHeight - NAV_HEIGHT, MIN_ITEM_HEIGHT);
  }

  private recompute(): void {
    if (!this.feed.hasItems()) return;
    const first = this.host.nativeElement.querySelector('.feed-item') as HTMLElement | null;
    if (first && first.offsetHeight > 0) this.measuredHeight.set(first.offsetHeight);
    const top = this.host.nativeElement.getBoundingClientRect().top;
    this.activeIndex.set(activeIndexFromTop(top, this.itemHeight(), window.innerHeight, this.feed.itemCount()));
  }
}
