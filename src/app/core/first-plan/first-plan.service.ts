import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, finalize, forkJoin, of, shareReplay, tap, timer } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api/api.service';
import { SavedPlansService } from '../saved-plans/saved-plans.service';
import { AutoSaveService } from '../saved-plans/auto-save.service';
import { KarmaModalService } from '../karma/karma-modal.service';
import { ToastService } from '../ui/toast.service';
import { TripService } from '../../features/trip/trip.service';
import { NavFacadeService } from '../../features/nav/nav-facade.service';

/** What a visitor was looking at when they started signing up (survives the auth modal + OTP in the same tab). */
export type SignupIntent = { kind: 'city'; cityId: string } | { kind: 'shared'; shareId: string };

import { AUTO_OPENED_KEY, SIGNUP_INTENT_KEY as INTENT_KEY } from './first-plan-session';

/**
 * F79 free first plan, client side: carries the sign-up intent, opens the first-run screen once per
 * session after login/register, and saves a hand-built first plan without the "Guardar viaje" form.
 * The backend decides every waiver; `auth.firstPlanAvailable()` is display state only.
 */
@Injectable({ providedIn: 'root' })
export class FirstPlanService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly savedPlans = inject(SavedPlansService);
  private readonly trip = inject(TripService);
  private readonly autoSave = inject(AutoSaveService);
  private readonly karmaModal = inject(KarmaModalService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly facade = inject(NavFacadeService);

  /** True while the sign-up shared-plan clone runs: the auth modal shows a waiting popup. */
  readonly cloningShared = signal(false);
  /** The popup stays at least this long so it doesn't flash. */
  static readonly CLONING_MIN_MS = 800;

  /** The in-flight hand-built save, shared so a second caller never POSTs twice. */
  private saving$: Observable<string> | null = null;

  setSignupIntent(intent: SignupIntent): void {
    try { sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent)); } catch { /* storage unavailable */ }
  }

  takeSignupIntent(): SignupIntent | null {
    try {
      const raw = sessionStorage.getItem(INTENT_KEY);
      sessionStorage.removeItem(INTENT_KEY);
      return raw ? (JSON.parse(raw) as SignupIntent) : null;
    } catch { return null; }
  }

  /** Called after a login and when the register welcome overlay closes. */
  afterLogin(): void {
    const intent = this.takeSignupIntent();
    if (!this.auth.firstPlanAvailable()) return;

    if (intent?.kind === 'shared') {
      this.cloningShared.set(true);
      // Error closes at once (forkJoin errors without waiting for the timer); success after ≥ CLONING_MIN_MS.
      forkJoin([this.api.cloneSharedTrip(intent.shareId, 'shared'), timer(FirstPlanService.CLONING_MIN_MS)]).pipe(
        finalize(() => this.cloningShared.set(false)),
      ).subscribe({
        next: ([copy]) => {
          this.savedPlans.register({ id: copy.id!, name: copy.title, savedAt: new Date().toISOString(), stops: copy.stops, transits: copy.transits ?? [] });
          this.trip.restoreStops(copy.stops, copy.id!, copy.transits ?? []);
          this.auth.setFirstPlanAvailable(false);
          this.facade.openEditor();
        },
        error: () => this.autoOpenFirstRun(null), // unshared or deleted meanwhile
      });
      return;
    }
    if (this.trip.stops().length > 0 && !this.trip.loadedPlanId()) {
      this.saveFirstManualPlan().subscribe({ next: () => this.facade.openEditor(), error: () => {} });
      return;
    }
    this.autoOpenFirstRun(intent);
  }

  /** Saves the current editor plan as the free first plan. Idempotent while in flight and once saved. */
  saveFirstManualPlan(): Observable<string> {
    const loaded = this.trip.loadedPlanId();
    if (loaded) return of(loaded);
    if (this.saving$) return this.saving$;
    const email = this.auth.currentUser()?.email;
    if (!email) return EMPTY;
    this.saving$ = this.savedPlans
      .upsert(email, null, $localize`:@@firstplan.defaultName:Mi primer viaje`, this.trip.stops(), this.trip.transits())
      .pipe(
        tap({
          next: id => {
            this.trip.markAsLoadedPlan(id);
            this.autoSave.commitSnapshot(id);
            this.auth.setFirstPlanAvailable(false);
            this.toast.show($localize`:@@firstplan.savedToast:Guardado en tu cuenta ✓`);
          },
          error: err => {
            // The gift was used elsewhere (another tab): the normal 1-Token price applies.
            if (this.karmaModal.handleKarmaError(err)) this.auth.setFirstPlanAvailable(false);
          },
        }),
        finalize(() => (this.saving$ = null)),
        shareReplay(1),
      );
    return this.saving$;
  }

  private autoOpenFirstRun(intent: SignupIntent | null): void {
    try {
      if (sessionStorage.getItem(AUTO_OPENED_KEY)) return;
      sessionStorage.setItem(AUTO_OPENED_KEY, '1');
    } catch { /* no storage: open anyway */ }
    void this.router.navigate(['/ai-planning'], { queryParams: intent?.kind === 'city' ? { city: intent.cityId } : {} });
  }
}
