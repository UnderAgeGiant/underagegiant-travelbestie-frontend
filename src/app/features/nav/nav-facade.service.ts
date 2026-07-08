import { Injectable, inject, signal, computed } from '@angular/core';
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
import { FavoritedTrip } from '../../core/models/trip.model';
import { VisitedPlacesService } from '../../core/visited-places/visited-places.service';
import { CommentCooldownService } from '../../core/comments/comment-cooldown.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { City } from '../../core/models/city.model';

@Injectable({ providedIn: 'root' })
export class NavFacadeService {
  readonly auth         = inject(AuthService);
  readonly authModal    = inject(AuthModalService);
  readonly trip         = inject(TripService);
  readonly karma        = inject(KarmaService);
  readonly karmaModal   = inject(KarmaModalService);
  readonly savedPlans   = inject(SavedPlansService);
  readonly cooldown     = inject(CommentCooldownService);
  private readonly visited      = inject(VisitedPlacesService);
  private readonly sharedTrips  = inject(SharedTripsService);
  private readonly api          = inject(ApiService);
  readonly favorites            = inject(FavoritesService);
  private readonly router       = inject(Router);

  // ── search / menu state ──
  navQuery     = signal('');
  searchOpen   = signal(false);
  userMenuOpen = signal(false);

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
      switchMap(q => q.trim()
        ? this.api.searchSharedTrips(q).pipe(catchError(() => of([])))
        : of([])),
      takeUntilDestroyed(),
    ).subscribe(trips => this.navSharedTrips.set(trips));
  }

  readonly mySharedTrips = computed(() => {
    return this.savedPlans.plans()
      .filter((p): p is SavedPlan & { shareId: string } => !!p.shareId)
      .map(p => ({ id: p.shareId, tripName: p.name, stops: p.stops }));
  });

  readonly filteredPlans = computed(() => {
    const q = this.planSearch().toLowerCase().trim();
    if (!q) return this.savedPlans.plans();
    return this.savedPlans.plans().filter(p => p.name.toLowerCase().includes(q));
  });

  readonly filteredFavorites = computed<FavoritedTrip[]>(() => {
    const q = this.favoritesSearch().toLowerCase().trim();
    if (!q) return this.favorites.favoritedTrips();
    return this.favorites.favoritedTrips().filter(t => t.tripName.toLowerCase().includes(q));
  });

  readonly filteredSharedTrips = computed(() => {
    const q = this.sharedTripsSearch().toLowerCase().trim();
    if (!q) return this.mySharedTrips();
    return this.mySharedTrips().filter(t => t.tripName.toLowerCase().includes(q));
  });

  readonly navFiltered = computed(() => {
    const q = this.navQuery().toLowerCase();
    if (!q) return [];
    return WORLD_CITIES
      .filter(c => !this.trip.existingCityIds().includes(c.id) &&
        (c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)))
      .slice(0, 8);
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
    if (name) this.savedPlans.upsert(email, currentId, name, this.trip.stops(), this.trip.transits()).subscribe();
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

  // adapted from nav.component.ts:1070-1073 — emit moved to the bar component
  openProfile(): void {
    this.userMenuOpen.set(false);
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

  quickAdd(city: City): void {
    this.trip.addStop(city, '', '');
    this.navQuery.set('');
    this.searchOpen.set(false);
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

    // Loading a plan while viewing a shared trip (/shared/:id) should return
    // to the main app view. window.location.search is no longer a reliable
    // signal here — the Router shows this URL with an empty search string.
    if (this.router.url.startsWith('/shared')) {
      const email = this.auth.currentUser()?.email;
      if (email) this.trip.persistNow(email);
      this.router.navigate(['/']);
    }
  }

  // adapted from nav.component.ts:1164-1170 — emit moved to the bar component
  onLogoClick(): void {
    this.autoSaveCurrentTrip();
    this.trip.restoreStops([], null);
    this.userMenuOpen.set(false);
    this.plansOpen.set(false);
  }

  doNewTrip(): void {
    this.autoSaveCurrentTrip();
    this.karma.spend();
    this.trip.restoreStops([], null);
    this.userMenuOpen.set(false);
    this.plansOpen.set(false);
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
    if (plan.shareId) void shareTrip(plan.name, plan.shareId);
  }

  doLogout(): void {
    this.auth.logout();
    this.trip.clearPlan();
    this.karma.clear();
    this.savedPlans.clear();
    this.visited.clear();
    this.favorites.clear();
    this.router.navigate(['/']);
  }
}
