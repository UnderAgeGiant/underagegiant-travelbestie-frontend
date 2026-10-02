import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { shareTrip } from '../../core/share/share-url.util';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuthModalService } from '../../core/auth/auth-modal.service';
import { TripService } from '../trip/trip.service';
import { KarmaService } from '../../core/karma/karma.service';
import { KarmaModalService } from '../../core/karma/karma-modal.service';
import { SavedPlansService, SavedPlan } from '../../core/saved-plans/saved-plans.service';
import { SharedTrip, SharedTripsService } from '../../core/shared-trips/shared-trips.service';
import { ApiService } from '../../core/api/api.service';
import { FavoritesService } from '../../core/favorites/favorites.service';
import { CompanionSuggestionService } from '../../core/ai/companion-suggestion.service';
import { FavoritedTrip } from '../../core/models/trip.model';
import { LandingFeedService } from '../landing/feed/landing-feed.service';
import { CommentCooldownService } from '../../core/comments/comment-cooldown.service';
import { TrophyService } from '../../core/trophies/trophy.service';
import { LocaleService } from '../../core/i18n/locale.service';
import { AppLocale } from '../../core/i18n/locale.util';
import { normalizeSearch } from '../../core/utils/normalize-search.util';
import { AiPlanViewPayload } from '../../core/models/ai.model';

/** One-letter queries match almost everything and cost a request each; wait for two. */
export function shouldSearchSharedTrips(query: string): boolean {
  return query.trim().length >= 2;
}

/** Routes behind authGuard — kept in sync with app.routes.ts (Feature 68). */
const PRIVATE_PATHS = ['/profile', '/my-trips', '/karma-history'];

@Injectable({ providedIn: 'root' })
export class NavFacadeService {
  readonly auth         = inject(AuthService);
  readonly authModal    = inject(AuthModalService);
  readonly trip         = inject(TripService);
  readonly karma        = inject(KarmaService);
  readonly karmaModal   = inject(KarmaModalService);
  readonly savedPlans   = inject(SavedPlansService);
  readonly cooldown     = inject(CommentCooldownService);
  private readonly sharedTrips  = inject(SharedTripsService);
  private readonly api          = inject(ApiService);
  readonly favorites            = inject(FavoritesService);
  readonly trophies              = inject(TrophyService);
  private readonly companionSuggest = inject(CompanionSuggestionService);
  private readonly landingFeed  = inject(LandingFeedService);
  private readonly router       = inject(Router);
  readonly locale = inject(LocaleService);

  // ── search / menu state ──
  navQuery     = signal('');
  searchOpen   = signal(false);
  userMenuOpen = signal(false);

  /** Language dropdown open state (desktop). */
  langOpen = signal(false);

  /** One-shot command: open My Trips to a specific tab (e.g. from a notification click). Consumed by MyTripsComponent. */
  pendingMyTripsTab = signal<'trips' | 'collaborations' | 'aiplans' | null>(null);

  // ── saved-plans / favorites / shared-trips state ──
  plansOpen      = signal(false);
  planSearch     = signal('');
  savePlanOpen   = signal(false);
  savePlanName   = signal('');
  savePlanError  = signal('');
  deletingPlanId       = signal<string | null>(null);
  cloningConfirmPlanId = signal<string | null>(null);
  cloningPlanId        = signal<string | null>(null);
  clonedPlanId         = signal<string | null>(null);
  myTripsOpen     = signal(false);
  favoritesOpen   = signal(false);
  favoritesSearch = signal('');
  sharedTripsSearch = signal('');

  // ── karma pill / success overlay state ──
  readonly buyKarmaOpen = this.karmaModal.buyOpen;
  karmaSuccessOpen   = signal(false);
  karmaSuccessAmount = signal(0);
  karmaGainAnim      = signal(0);
  private karmaAnimTimer: ReturnType<typeof setTimeout> | null = null;

  navSharedTrips = signal<SharedTrip[]>([]);

  constructor() {
    toObservable(this.navQuery).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => shouldSearchSharedTrips(q)
        ? this.api.searchSharedTrips(q).pipe(catchError(() => of([])))
        : of([])),
      takeUntilDestroyed(),
    ).subscribe(trips => this.navSharedTrips.set(trips));

    // authGuard only runs on entry. If the session ends while the user is ON a private page — a failed
    // silent refresh calls AuthService.clearTokens() with no logout click — leave it for the landing.
    // (Explicit "Cerrar sesión" already navigates to / in doLogout().) router.url isn't a signal, so this
    // re-runs only on auth changes, which is exactly when it matters.
    effect(() => {
      if (this.auth.isLoggedIn() || this.auth.sessionMayExist()) return;
      if (PRIVATE_PATHS.some(p => this.router.url.startsWith(p))) void this.router.navigateByUrl('/');
    });
  }

  readonly mySharedTrips = computed(() => {
    return this.savedPlans.plans()
      .filter((p): p is SavedPlan & { shareId: string } => !!p.shareId)
      .map(p => ({ id: p.shareId, tripName: p.name, stops: p.stops }));
  });

  readonly filteredPlans = computed(() => {
    const q = normalizeSearch(this.planSearch().trim());
    if (!q) return this.savedPlans.plans();
    return this.savedPlans.plans().filter(p => normalizeSearch(p.name).includes(q));
  });

  readonly filteredFavorites = computed<FavoritedTrip[]>(() => {
    const q = normalizeSearch(this.favoritesSearch().trim());
    if (!q) return this.favorites.favoritedTrips();
    return this.favorites.favoritedTrips().filter(t => normalizeSearch(t.tripName).includes(q));
  });

  readonly filteredSharedTrips = computed(() => {
    const q = normalizeSearch(this.sharedTripsSearch().trim());
    if (!q) return this.mySharedTrips();
    return this.mySharedTrips().filter(t => normalizeSearch(t.tripName).includes(q));
  });

  readonly initials = computed(() => {
    const name = this.auth.currentUser()?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  });

  readonly activeTripName = computed(() => {
    const id = this.trip.loadedPlanId();
    if (!id) return null;
    return this.savedPlans.plans().find(p => p.id === id)?.name ?? null;
  });

  autoSaveCurrentTrip(): void {
    const email     = this.auth.currentUser()?.email;
    const currentId = this.trip.loadedPlanId();
    if (!email || !currentId || this.trip.stops().length === 0) return;
    const name = this.savedPlans.plans().find(p => p.id === currentId)?.name;
    if (name) this.savedPlans.upsert(email, currentId, name, this.trip.stops(), this.trip.transits(), { background: true }).subscribe();
  }

  karmaIcon(): string {
    const k = this.karma.karma() ?? 0;
    if (k <= 0) return '💀';
    if (k <= 2) return '🌱';
    if (k <= 5) return '✨';
    return '🌟';
  }

  karmaPillStyle(): string {
    const k = this.karma.karma() ?? 0;
    if (k <= 0) return 'background:oklch(94% 0.06 25);color:oklch(45% 0.18 25)';
    if (k <= 2) return 'background:oklch(95% 0.08 75);color:oklch(50% 0.15 75)';
    if (k <= 5) return 'background:var(--lav);color:var(--lav-d)';
    return 'background:oklch(93% 0.10 145);color:oklch(42% 0.15 145)';
  }

  planDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
    if (!this.userMenuOpen()) {
      this.plansOpen.set(false);
      this.savePlanOpen.set(false);
      this.favoritesOpen.set(false);
    }
  }

  toggleFavorites(): void {
    this.favoritesOpen.update(v => !v);
    if (this.favoritesOpen()) {
      this.favorites.loadFavorites();
    } else {
      this.favoritesSearch.set('');
    }
  }

  togglePlans(): void {
    this.plansOpen.update(v => !v);
    if (!this.plansOpen()) {
      this.savePlanOpen.set(false);
      this.deletingPlanId.set(null);
      this.cloningConfirmPlanId.set(null);
      this.planSearch.set('');
    }
  }

  scheduleClose(): void { setTimeout(() => this.searchOpen.set(false), 160); }

  openProfile(): void {
    this.userMenuOpen.set(false);
    void this.router.navigateByUrl('/profile');
  }

  // pendingMyTripsTab is consumed by MyTripsComponent's own effect — works both when this
  // navigation creates the page and when the user is already on /my-trips.
  openMyTrips(tab: 'trips' | 'collaborations' | 'aiplans' = 'trips'): void {
    this.userMenuOpen.set(false);
    this.pendingMyTripsTab.set(tab);
    void this.router.navigateByUrl('/my-trips');
  }

  /** Every "start editing this trip" action lands here — the editor lives at /plan (Feature 68). */
  openEditor(): void {
    this.userMenuOpen.set(false);
    void this.router.navigateByUrl('/plan');
  }

  /** Opens the routed /ai-planning page. A past plan (from "Planes IA Pendientes") rides along as
   *  history state, so a reload of /ai-planning still shows it and a fresh open starts at Step 1. */
  openAiPlanning(result: AiPlanViewPayload | null = null): void {
    this.userMenuOpen.set(false);
    void this.router.navigate(['/ai-planning'], result ? { state: { aiPlanResult: result } } : {});
  }

  // Centralizes navigation to the karma history page, same pattern as openMyTrips above.
  openKarmaHistory(): void {
    this.userMenuOpen.set(false);
    this.router.navigateByUrl('/karma-history');
  }

  openBuyKarma(): void {
    this.userMenuOpen.set(false);
    this.karmaModal.open();
  }

  /** Step 1 — called immediately after PayPal captures the payment. */
  onKarmaGained(amount: number): void {
    this.karmaModal.closeBuy();
    this.karmaSuccessAmount.set(amount);
    this.karmaSuccessOpen.set(true);
  }

  /** Step 2 — called when user dismisses the celebration overlay. */
  dismissKarmaSuccess(): void {
    this.karmaSuccessOpen.set(false);
    this.karmaGainAnim.set(0);
    if (this.karmaAnimTimer) clearTimeout(this.karmaAnimTimer);
    this.karmaAnimTimer = setTimeout(() => {
      this.karmaGainAnim.set(this.karmaSuccessAmount());
      this.karmaAnimTimer = setTimeout(() => this.karmaGainAnim.set(0), 2300);
    }, 20);
  }

  toggleMyTrips(): void {
    this.myTripsOpen.update(v => !v);
    if (!this.myTripsOpen()) this.sharedTripsSearch.set('');
  }
  // Router navigation (not window.location.href) keeps the in-memory access
  // token alive — a full reload would blank it until the silent cookie
  // refresh resolves, flashing the "signed out" nav state.
  openSharedTrip(id: string): void { this.router.navigate(['/shared', id]); }
  goToSharedTrip(id: string): void { this.router.navigate(['/shared', id]); }
  commentCount(tripId: string): number { return this.sharedTrips.getCommentCount(tripId); }

  switchLocale(target: AppLocale): void {
    this.langOpen.set(false);
    this.locale.switchTo(target);   // reloads the current URL — a routed page reopens by itself
  }

  openSaveForm(): void {
    const loaded = this.trip.loadedPlanId();
    if (loaded) {
      const current = this.savedPlans.plans().find(p => p.id === loaded);
      this.savePlanName.set(current?.name ?? '');
    } else {
      this.savePlanName.set('');
    }
    this.savePlanOpen.set(true);
  }

  doSavePlan(): void {
    const name = this.savePlanName().trim();
    if (!name) return;
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.savePlanError.set('');
    this.savedPlans.upsert(email, this.trip.loadedPlanId(), name, this.trip.stops(), this.trip.transits()).subscribe({
      next: newId => {
        this.trip.markAsLoadedPlan(newId);
        this.savePlanOpen.set(false);
        this.savePlanName.set('');
      },
      error: err => {
        if (this.karmaModal.handleKarmaError(err)) {
          this.savePlanOpen.set(false);
        }
      },
    });
  }

  doLoadPlan(plan: SavedPlan): void {
    this.autoSaveCurrentTrip();
    this.trip.restoreStops(plan.stops, plan.id, plan.transits ?? []);
    this.userMenuOpen.set(false);
    this.plansOpen.set(false);

    // Leaving /shared/:id destroys that page before the debounced trip persist runs — flush it now.
    if (this.router.url.startsWith('/shared')) {
      const email = this.auth.currentUser()?.email;
      if (email) this.trip.persistNow(email);
    }
    this.openEditor();
  }

  onLogoClick(): void {
    this.autoSaveCurrentTrip();
    this.trip.restoreStops([], null);
    this.userMenuOpen.set(false);
    this.plansOpen.set(false);
    void this.router.navigateByUrl('/');
  }

  doNewTrip(): void {
    this.autoSaveCurrentTrip();
    this.karma.spend('trip_created');
    this.trip.restoreStops([], null);
    this.userMenuOpen.set(false);
    this.plansOpen.set(false);
    void this.router.navigateByUrl('/');
  }

  doDeletePlan(id: string): void {
    this.deletingPlanId.set(id);
  }

  confirmDeletePlan(id: string): void {
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.savedPlans.remove(email, id);
    if (this.trip.loadedPlanId() === id) this.trip.markAsLoadedPlan(null);
    this.deletingPlanId.set(null);
  }

  confirmClonePlan(plan: SavedPlan): void {
    this.cloningConfirmPlanId.set(null);
    this.doClonePlan(plan);
  }

  doClonePlan(plan: SavedPlan): void {
    this.cloningPlanId.set(plan.id);
    this.api.cloneOwnTrip(plan.id).subscribe({
      next: cloned => {
        this.cloningPlanId.set(null);
        this.savedPlans.register({
          id:       cloned.id!,
          name:     cloned.title,
          savedAt:  cloned.createdAt ?? new Date().toISOString(),
          stops:    cloned.stops,
          transits: cloned.transits ?? [],
        });
        this.clonedPlanId.set(cloned.id!);
        setTimeout(() => this.clonedPlanId.set(null), 2000);
      },
      error: err => {
        this.cloningPlanId.set(null);
        this.karmaModal.handleKarmaError(err);
      },
    });
  }

  sharePlan(plan: SavedPlan): void {
    const user = this.auth.currentUser();
    if (!user) return;

    if (plan.shareId) { this.goToSharedTrip(plan.shareId); return; }

    if (environment.useMocks) {
      const shareId = this.sharedTrips.createShare({
        ownerEmail: user.email, ownerName: user.name, tripName: plan.name,
        stops: plan.stops, transits: plan.transits ?? [], planId: plan.id,
      });
      this.savedPlans.setShareId(user.email, plan.id, shareId);
      this.goToSharedTrip(shareId);
    } else {
      this.api.shareTrip(plan.id).subscribe({
        next: ({ shareId }) => {
          this.savedPlans.setShareId(user.email, plan.id, shareId);
          this.goToSharedTrip(shareId);
        },
        error: err => { this.karmaModal.handleKarmaError(err); },
      });
    }
  }

  shareNative(plan: SavedPlan): void {
    const sid = plan.shareId;
    if (sid) void shareTrip(plan.name, sid).then(ok => { if (ok) this.trophies.reportShare(sid); });
  }

  doLogout(): void {
    this.auth.logout();
    this.trip.clearPlan();
    this.karma.clear();
    this.savedPlans.clear();
    this.favorites.clear();
    this.trophies.reset();
    this.companionSuggest.clear();
    this.landingFeed.reset();   // feedback F2 — never leave a previous session's feed loaded
    this.router.navigate(['/']);
  }
}
