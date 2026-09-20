import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { FeedPage, FeedPlan } from '../../../core/models/feed-plan.model';

export const FEED_PAGE_SIZE = 20;
/** Fetch the next page once the active plan is at/after this fraction of the plans loaded so far. */
export const FEED_PREFETCH_RATIO = 0.9;

export interface FeedItem {
  key: string;       // `${pass}:${plan.id}` — unique across wrap-arounds
  plan: FeedPlan;
  pass: number;
}

@Injectable({ providedIn: 'root' })
export class LandingFeedService {
  private readonly api = inject(ApiService);

  private readonly _items   = signal<FeedItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _error   = signal(false);
  private readonly _loaded  = signal(false);

  readonly items     = this._items.asReadonly();
  readonly itemCount = computed(() => this._items().length);
  readonly loading   = this._loading.asReadonly();
  readonly error     = this._error.asReadonly();
  readonly loaded    = this._loaded.asReadonly();
  readonly hasItems  = computed(() => this._items().length > 0);
  /** The most-favorited plan (first item of the first pass) — feeds the welcome-page pill. */
  readonly topPlan   = computed<FeedPlan | null>(() => this._items()[0]?.plan ?? null);

  private cursor: string | null = null;           // cursor for the NEXT request; null = start of the list
  private pass = 0;
  private seenThisPass = new Set<string>();
  private singlePageCatalog: FeedPlan[] | null = null;
  private inFlight?: Subscription;

  /** First page. Safe to call repeatedly. */
  initialLoad(): void {
    if (this._loaded() || this._loading()) return;
    this.loadMore();
  }

  loadMore(): void {
    if (this._loading()) return;
    if (this.singlePageCatalog) {                 // whole catalog is already in memory: wrap locally
      this.append(this.singlePageCatalog, this.pass);
      this.pass += 1;
      return;
    }
    this._loading.set(true);
    this._error.set(false);
    this.inFlight = this.api.getFeed(this.cursor, FEED_PAGE_SIZE).subscribe({
      next: page => this.onPage(page),
      error: () => { this._loading.set(false); this._error.set(true); },
    });
  }

  retry(): void { this.loadMore(); }

  /** Called with the index of the plan the visitor is currently on. */
  onActiveIndex(index: number): void {
    const len = this._items().length;
    if (len === 0 || this._loading() || this._error()) return;
    if (index >= Math.floor(len * FEED_PREFETCH_RATIO)) this.loadMore();
  }

  reset(): void {
    this.inFlight?.unsubscribe();
    this.inFlight = undefined;
    this._items.set([]);
    this._loading.set(false);
    this._error.set(false);
    this._loaded.set(false);
    this.cursor = null;
    this.pass = 0;
    this.seenThisPass = new Set();
    this.singlePageCatalog = null;
  }

  private onPage(page: FeedPage): void {
    const startOfPass = this.cursor === null;
    const fresh = page.items.filter(p => !this.seenThisPass.has(p.id));
    fresh.forEach(p => this.seenThisPass.add(p.id));
    this.append(fresh, this.pass);

    if (page.nextCursor === null) {
      if (startOfPass) this.singlePageCatalog = fresh;   // the whole list fit in one page
      this.cursor = null;
      this.pass += 1;
      this.seenThisPass = new Set();
    } else {
      this.cursor = page.nextCursor;
    }
    this._loaded.set(true);
    this._loading.set(false);
  }

  private append(plans: FeedPlan[], pass: number): void {
    if (plans.length === 0) return;
    this._items.update(list => [...list, ...plans.map(plan => ({ key: `${pass}:${plan.id}`, plan, pass }))]);
  }
}
