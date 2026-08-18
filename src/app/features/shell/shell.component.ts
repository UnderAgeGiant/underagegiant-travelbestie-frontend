import { Component, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { TripService } from '../trip/trip.service';
import { NavShellComponent } from '../nav/nav-shell.component';
import { NavFacadeService } from '../nav/nav-facade.service';
import { LocaleService } from '../../core/i18n/locale.service';
import { AuthService } from '../../core/auth/auth.service';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';
import { WelcomeComponent } from '../welcome/welcome.component';
import { StopListComponent } from '../trip/stop-list/stop-list.component';
import { DestinationComponent } from '../destination/destination.component';
import { AddStopModalComponent } from '../trip/add-stop-modal/add-stop-modal.component';
import { MobileAttractionsModalComponent } from '../destination/mobile-attractions-modal/mobile-attractions-modal.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { ProfileComponent } from '../profile/profile.component';
import { AiPlanningComponent } from '../ai-planning/ai-planning.component';
import { FeaturedSlideshowComponent } from '../landing/featured-slideshow.component';
import { LandingAboutComponent } from '../landing/landing-about.component';
import { AppFooterComponent } from '../landing/app-footer.component';
import { DayTimelineComponent } from '../planning/day-timeline/day-timeline.component';
import { MyTripsComponent } from '../my-trips/my-trips.component';
import { CompanionMascotComponent } from '../../shared/companion-mascot/companion-mascot.component';
import { ToastService } from '../../core/ui/toast.service';
import { AutoSaveService } from '../../core/saved-plans/auto-save.service';
import { AutosaveReminderBannerComponent } from '../../shared/autosave-reminder-banner/autosave-reminder-banner.component';
import { HighlightTourComponent } from '../../shared/highlight-tour/highlight-tour.component';
import { HighlightTourService } from '../../shared/highlight-tour/highlight-tour.service';

@Component({
    selector: 'tb-shell',
    imports: [
        NavShellComponent,
        WelcomeComponent,
        StopListComponent,
        DestinationComponent,
        AddStopModalComponent,
        MobileAttractionsModalComponent,
        ToastComponent,
        ProfileComponent,
        AiPlanningComponent,
        FeaturedSlideshowComponent,
        LandingAboutComponent,
        AppFooterComponent,
        DayTimelineComponent,
        MyTripsComponent,
        CompanionMascotComponent,
        AutosaveReminderBannerComponent,
        HighlightTourComponent,
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <app-nav (logoClick)="null"
             (profileClick)="showProfile.set(true)"
             (myTripsClick)="showMyTrips.set(true)" />

    @if (trip.stops().length === 0) {
      <!-- ── LANDING MODE: scroll-snap container ── -->
      <div class="landing-scroll">

        <!-- S1: full app shell (left panel + welcome) -->
        <section class="landing-snap-child s1-shell">
          <app-stop-list (addDestination)="showAddModal.set(true)" />
          <div class="right-panel">
            <app-welcome (addDestination)="showAddModal.set(true)"
                         (openAiPlanning)="showAiPlanning.set(true)" />
          </div>
          <!-- Scroll hint -->
          <div class="scroll-hint">
            <span i18n="@@landing.scrollHint">Desliza para explorar</span>
            <div class="scroll-arrow">↓</div>
          </div>
        </section>

        <!-- S2: cinematic slideshow (hidden when no featured trips) -->
        <tb-featured-slideshow />

        <!-- S3: about -->
        <tb-landing-about />

        <!-- S4: footer -->
        <tb-app-footer />

      </div>
    } @else {
      <!-- ── APP MODE: normal layout ── -->
      <div class="layout">
        <app-stop-list (addDestination)="showAddModal.set(true)" />
        <tb-day-timeline [showPlanSlideshow]="true" />
        <div class="right-panel">
          @if (!trip.activeStop()) {
            <div class="empty-stop">
              <div class="empty-stop-icon">👆</div>
              <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:400;margin-bottom:6px"
                   i18n="@@app.selectStop">Selecciona una parada</div>
              <div style="font-size:13px;color:var(--t3);max-width:240px;line-height:1.5;text-align:center"
                   i18n="@@app.selectStopDesc">Haz clic en un destino del panel para explorar sus atracciones</div>
            </div>
          } @else {
            <app-destination />
          }
        </div>
      </div>
    }

    @if (showAddModal()) {
      <app-add-stop-modal (close)="showAddModal.set(false)" />
    }

    <app-mobile-attractions-modal />

    <app-companion-mascot />

    <app-highlight-tour />

    @if (toastService.message()) {
      <app-toast [message]="toastService.message()!" (done)="toastService.clear()" />
    }

    @if (autoSave.reminderVisible() && !showProfile()) {
      <!-- ProfileComponent (a full-screen overlay) renders its own copy while it's open,
           since this one — a fixed sibling — would otherwise render twice at once. -->
      <app-autosave-reminder-banner (dismiss)="autoSave.dismissReminder()" />
    }

    @if (showProfile()) {
      <app-profile (close)="showProfile.set(false)"
                   (openAiPlanning)="showProfile.set(false); showAiPlanning.set(true)" />
    }

    @if (showMyTrips()) {
      <app-my-trips (close)="showMyTrips.set(false)"
                    (openAiPlanning)="showMyTrips.set(false); showAiPlanning.set(true)" />
    }

    @defer (when showAiPlanning()) {
      @if (showAiPlanning()) {
        <app-ai-planning (close)="showAiPlanning.set(false)"
                         (planSaved)="showAiPlanning.set(false); toastService.show('Plan guardado')" />
      }
    }
  `
})
export class ShellComponent {
  readonly trip  = inject(TripService);
  readonly toastService = inject(ToastService);
  readonly autoSave = inject(AutoSaveService);
  private readonly facade = inject(NavFacadeService);
  private readonly locale = inject(LocaleService);
  private readonly auth = inject(AuthService);
  private readonly savedPlans = inject(SavedPlansService);
  private readonly highlightTour = inject(HighlightTourService);
  showAddModal   = signal(false);
  showProfile    = signal(false);
  showAiPlanning = signal(false);
  showMyTrips    = signal(false);

  constructor() {
    // SavedPlansService's own constructor only checks auth.currentUser() once, synchronously —
    // on a page reload that user is restored asynchronously by AuthService's silent refresh
    // (see auth.service.ts), which typically resolves AFTER that one-shot check already ran.
    // Without this, a returning user's saved plans (including accepted collaborations) would
    // stay empty until an explicit login re-triggered a fetch. Scoped to ShellComponent (the
    // real app's root view) rather than the service itself, so it fires once per real session
    // instead of on every unrelated unit test that merely injects AuthService + SavedPlansService.
    let lastLoadedEmail: string | null = null;
    effect(() => {
      const email = this.auth.currentUser()?.email ?? null;
      if (email && email !== lastLoadedEmail) {
        lastLoadedEmail = email;
        this.savedPlans.loadForUser(email);
      } else if (!email) {
        lastLoadedEmail = null;
      }
    });

    // Keep the facade informed of the open panel so a locale switch can restore it.
    effect(() => {
      this.facade.currentShellView.set(
        this.showProfile()    ? 'profile'
        : this.showAiPlanning() ? 'ai'
        : this.showMyTrips()  ? 'mytrips'
        : null,
      );
    });

    // Reopen the panel the user was in before the locale-switch reload (one-shot).
    const restore = this.locale.consumeRestoreView();
    if (restore === 'profile') this.showProfile.set(true);
    else if (restore === 'ai') this.showAiPlanning.set(true);
    else if (restore === 'mytrips') this.showMyTrips.set(true);

    // Opens My Trips when a notification (e.g. collaborator invite/accept)
    // requests a specific tab. MyTripsComponent itself consumes the tab and
    // clears the facade signal once it applies it.
    effect(() => {
      if (this.facade.pendingMyTripsTab()) this.showMyTrips.set(true);
    });

    // First-touch onboarding: show the landing_welcome tour to an anonymous
    // (not-yet-logged-in) visitor looking at the empty-state landing page (S1,
    // trip.stops().length === 0) — its two targets are the "Iniciar sesión" login
    // button (only rendered while logged out) and the "Crear con IA" button in
    // <app-welcome>. HighlightTourService.start() is itself idempotent/safe to call
    // repeatedly — the cookie/Redis seen-check makes every call after the first a no-op.
    //
    // auth.sessionMayExist() gates the OTHER direction: a returning visitor who is
    // still genuinely logged in reads isLoggedIn() === false for a brief window on
    // every page load, before the boot-time silent refresh (AuthService constructor,
    // queueMicrotask) restores the in-memory access token — sessionMayExist() is
    // exactly "token not restored yet, but a session marker says one probably exists"
    // for that window. Without this check, a real existing user would flash through
    // as "anonymous" and could get shown the "create an account" tour by mistake.
    // Once the refresh resolves, isLoggedIn()/sessionMayExist() both read the same
    // _token signal, so this effect re-evaluates automatically and the gate closes.
    //
    // shouldStillShow closes the narrower remaining race: login completing while the
    // /highlights/landing_welcome/status round trip (started by this call) is still
    // in flight — see HighlightTourService.start()'s doc comment.
    effect(() => {
      if (!this.auth.isLoggedIn() && !this.auth.sessionMayExist() && this.trip.stops().length === 0) {
        this.highlightTour.start('landing_welcome', { shouldStillShow: () => !this.auth.isLoggedIn() });
      }
    });
  }
}
