import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TripMapComponent, TripMapCity } from '../../../shared/trip-map/trip-map.component';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthModalService } from '../../../core/auth/auth-modal.service';
import { FavoritesService } from '../../../core/favorites/favorites.service';
import { ToastService } from '../../../core/ui/toast.service';
import { LocaleService } from '../../../core/i18n/locale.service';
import { FeedPlan } from '../../../core/models/feed-plan.model';
import { TripStop } from '../../../core/models/trip.model';
import { WORLD_CITIES } from '../../../data/cities.data';
import { buildFeedSlides } from './feed-slides.util';

/** Every page (map or attraction photo) stays on screen this long before the strip slides to the next. */
const AUTO_ADVANCE_MS = 2500;
const SWIPE_PX = 40;
const MAX_DOTS = 9;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}

@Component({
  selector: 'tb-feed-plan-card',
  imports: [TripMapComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<article class="feed-card"
         [attr.aria-label]="plan().tripName"
         (pointerleave)="pressed.set(false)" (pointercancel)="pressed.set(false)"
         (focusin)="onFocusIn($event)" (focusout)="focused.set(false)"
         (keydown.arrowright)="next()" (keydown.arrowleft)="prev()"
         (pointerdown)="onPointerDown($event)" (pointerup)="onPointerUp($event)">

  <div class="feed-pane feed-pane-map" [class.active]="pageIdx() === 0" [style.--feed-off]="offset(0)"
       [attr.aria-hidden]="pageIdx() !== 0">
    <div class="feed-map">
      <app-trip-map [cities]="cityRefs()" [interactive]="false" [showFlightPath]="true" [showLabels]="true" />
    </div>
  </div>

  @for (slide of slides(); track slide.id; let i = $index) {
    <div class="feed-pane feed-pane-slide" [class.active]="pageIdx() === i + 1" [style.--feed-off]="offset(i + 1)"
         [attr.aria-hidden]="pageIdx() !== i + 1">
      @if (near(i + 1) && slide.imageUrl) {
        <img class="feed-photo" [src]="slide.imageUrl" [alt]="slide.name" loading="lazy" decoding="async" />
      } @else if (!slide.imageUrl) {
        <div class="feed-fallback" aria-hidden="true">{{ slide.icon }}</div>
      }
      <div class="feed-scrim"></div>
      <div class="feed-caption">
        <div class="feed-caption-name">{{ slide.name }}</div>
        <div class="feed-caption-city">{{ slide.cityName }}</div>
        <div class="feed-caption-meta">
          <span class="feed-caption-type">{{ slide.icon }} {{ slide.type }}</span>
          @if (slide.rating !== null) { <span class="feed-caption-rating">★ {{ slide.rating }}</span> }
        </div>
      </div>
    </div>
  }

  <div class="feed-identity">
    <div class="feed-chips">
      @for (name of routeNames().shown; track name) { <span class="feed-chip">{{ name }}</span> }
      @if (routeNames().more > 0) { <span class="feed-chip feed-chip-more">+{{ routeNames().more }}</span> }
    </div>
    <h3 class="feed-title">{{ plan().tripName }}</h3>
    <p class="feed-owner"><span i18n="@@feed.by">por</span> {{ plan().ownerName }}</p>
    <div class="feed-actions">
      <a class="btn-pill feed-view-plan" [routerLink]="['/shared', plan().id]"
         i18n="@@feed.viewPlan">Ver plan completo</a>
      <button type="button" class="feed-heart" [class.on]="favorited()"
              [attr.aria-pressed]="favorited()"
              [attr.aria-label]="favorited() ? heartLabelOn : heartLabelOff"
              (click)="toggleFavorite()">
        <svg class="feed-heart-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 2.9 5 6.4 5c2 0 3.4 1.1 4.1 2.3h3C14.2 6.1 15.6 5 17.6 5 21.1 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z"
                fill="currentColor"/>
        </svg>
        <span class="feed-heart-count">{{ favoriteCount() }}</span>
      </button>
    </div>
  </div>

  @if (pageCount() > 1) {
    <div class="feed-nav">
      <button type="button" class="feed-nav-prev" (click)="prev()"
              i18n-aria-label="@@feed.prev" aria-label="Anterior">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      @if (pageCount() <= maxDots) {
        <div class="feed-dots">
          @for (p of pages(); track p) {
            <button type="button" class="feed-dot" [class.active]="pageIdx() === p" (click)="goTo(p)"
                    [attr.aria-current]="pageIdx() === p ? 'true' : null"
                    [attr.aria-label]="pageLabel(p)"></button>
          }
        </div>
      } @else {
        <span class="feed-counter">{{ pageIdx() + 1 }} / {{ pageCount() }}</span>
      }
      <button type="button" class="feed-nav-next" (click)="next()"
              i18n-aria-label="@@feed.next" aria-label="Siguiente">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  }
</article>
  `,
})
export class FeedPlanCardComponent {
  readonly plan   = input.required<FeedPlan>();
  readonly active = input(false);

  private readonly auth      = inject(AuthService);
  private readonly authModal = inject(AuthModalService);
  private readonly favorites = inject(FavoritesService);
  private readonly toast     = inject(ToastService);
  private readonly locale    = inject(LocaleService);

  protected readonly maxDots = MAX_DOTS;
  protected readonly heartLabelOn  = $localize`:@@feed.heartOn:Quitar de favoritos`;
  protected readonly heartLabelOff = $localize`:@@feed.heartOff:Guardar en favoritos`;

  protected readonly pageIdx = signal(0);
  /** Pointer held down on the card (press-and-hold to read a slide). Deliberately NOT hover: a desktop visitor's
   *  cursor rests over the card while they scroll, and that must not stop the auto-advance. */
  protected readonly pressed = signal(false);
  /** Keyboard focus inside the card (mouse-click focus doesn't count, or one click on ◀ ▶ would stop it for good). */
  protected readonly focused = signal(false);
  protected readonly paused  = computed(() => this.pressed() || this.focused());
  private readonly countOverride = signal<number | null>(null);
  private readonly liking = signal(false);
  private swipeStartX: number | null = null;

  protected readonly slides    = computed(() => buildFeedSlides(this.plan(), this.locale.current()));
  protected readonly pageCount = computed(() => 1 + this.slides().length);
  protected readonly pages     = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i));
  protected readonly cityRefs  = computed<TripMapCity[]>(() => this.plan().stops.map(s => ({ cityId: s.cityId })));
  protected readonly routeNames = computed(() => {
    const names = this.plan().stops.map(s => WORLD_CITIES.find(c => c.id === s.cityId)?.name ?? s.cityId);
    const unique = [...new Set(names)];
    return { shown: unique.slice(0, 3), more: Math.max(0, unique.length - 3) };
  });
  protected readonly favorited     = computed(() => this.favorites.isFavorited(this.plan().id));
  protected readonly favoriteCount = computed(() => this.countOverride() ?? this.plan().favoriteCount);

  constructor() {
    // One interval, only for the active, un-paused card. Cleared whenever any input changes or the card is destroyed.
    effect(onCleanup => {
      // Reading pageIdx restarts the interval on every page change (auto or manual), so each page always gets a full 2.5 s.
      this.pageIdx();
      if (!this.active() || this.paused() || this.pageCount() < 2 || prefersReducedMotion()) return;
      const id = setInterval(() => this.next(), AUTO_ADVANCE_MS);
      onCleanup(() => clearInterval(id));
    });
  }

  /** Circular distance from the current page, so the last→first wrap counts as adjacent. */
  private circularOffset(page: number): number {
    const n = this.pageCount();
    let d = (page - this.pageIdx() + n) % n;
    if (d > n / 2) d -= n;
    return d;
  }
  protected near(page: number): boolean { return Math.abs(this.circularOffset(page)) <= 1; }
  /** Horizontal-strip position of a pane: 0 = on screen, ±1 = parked just off the right/left edge.
   *  Clamped to ±1 so a far pane (dot jump, wrap-around) slides in from the edge instead of sweeping across the whole strip. */
  protected offset(page: number): number { return Math.max(-1, Math.min(1, this.circularOffset(page))); }
  protected pageLabel(p: number): string { return $localize`:@@feed.pageLabel:Página ${p + 1}:page: de ${this.pageCount()}:total:`; }

  protected next(): void { this.pageIdx.update(i => (i + 1) % this.pageCount()); }
  protected prev(): void { this.pageIdx.update(i => (i - 1 + this.pageCount()) % this.pageCount()); }
  protected goTo(p: number): void { this.pageIdx.set(p); }

  protected onFocusIn(e: Event): void {
    let keyboard = true;
    try { keyboard = (e.target as HTMLElement).matches(':focus-visible'); } catch { /* engines without :focus-visible: assume keyboard */ }
    this.focused.set(keyboard);
  }

  protected onPointerDown(e: PointerEvent | MouseEvent): void { this.swipeStartX = e.clientX; this.pressed.set(true); }
  protected onPointerUp(e: PointerEvent | MouseEvent): void {
    this.pressed.set(false);
    if (this.swipeStartX === null) return;
    const dx = e.clientX - this.swipeStartX;
    this.swipeStartX = null;
    if (dx <= -SWIPE_PX) this.next();
    else if (dx >= SWIPE_PX) this.prev();
  }


  protected toggleFavorite(): void {
    if (!this.auth.isLoggedIn()) {
      // Deliberately NOT toggling in the post-login callback: POST /shared/:id/favorite is a toggle, and the
      // just-logged-in user's favorites may not have loaded yet — auto-toggling could un-favorite a saved plan.
      this.authModal.openLogin(() => this.favorites.loadFavorites());
      return;
    }
    if (this.liking()) return;
    this.liking.set(true);
    const plan = this.plan();
    this.favorites.toggle(
      plan.id,
      result => { this.countOverride.set(result.favoriteCount); this.liking.set(false); },
      () => {
        this.liking.set(false);
        this.toast.show($localize`:@@feed.favoriteError:No pudimos actualizar tus favoritos. Intenta de nuevo.`);
      },
      { tripName: plan.tripName, ownerName: plan.ownerName, stops: plan.stops as unknown as TripStop[], transits: [], favoriteCount: plan.favoriteCount },
    );
  }
}
