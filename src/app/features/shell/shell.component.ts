import { Component, afterNextRender, effect, inject, signal, viewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WORLD_CITIES } from '../../data/cities.data';
import { TripService } from '../trip/trip.service';
import { NavShellComponent } from '../nav/nav-shell.component';
import { NavFacadeService } from '../nav/nav-facade.service';
import { AuthService } from '../../core/auth/auth.service';
import { SavedPlan } from '../../core/saved-plans/saved-plans.service';
import { WelcomeComponent } from '../welcome/welcome.component';
import { StopListComponent } from '../trip/stop-list/stop-list.component';
import { DestinationComponent } from '../destination/destination.component';
import { AddStopModalComponent } from '../trip/add-stop-modal/add-stop-modal.component';
import { MobileAttractionsModalComponent } from '../destination/mobile-attractions-modal/mobile-attractions-modal.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { FeaturedSlideshowComponent } from '../landing/featured-slideshow.component';
import { LandingFeedComponent } from '../landing/feed/landing-feed.component';
import { AppFooterComponent } from '../landing/app-footer.component';
import { AboutContentComponent } from '../about/about-content.component';
import { DayTimelineComponent } from '../planning/day-timeline/day-timeline.component';
import { CompanionMascotComponent } from '../../shared/companion-mascot/companion-mascot.component';
import { TravelDocsReminderComponent } from '../../shared/travel-docs-reminder/travel-docs-reminder.component';
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
        FeaturedSlideshowComponent,
        LandingFeedComponent,
        AppFooterComponent,
        AboutContentComponent,
        DayTimelineComponent,
        CompanionMascotComponent,
        TravelDocsReminderComponent,
        AutosaveReminderBannerComponent,
        HighlightTourComponent,
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <app-nav />

    @if (trip.stops().length === 0) {
      <!-- ── LANDING MODE: scroll-snap container ── -->
      <div class="landing-scroll">

        <!-- S1: full app shell (left panel + welcome) -->
        <section class="landing-snap-child s1-shell" #topSection>
          <app-stop-list (addDestination)="showAddModal.set(true)" (openProfile)="facade.openProfile()" />
          <div class="right-panel">
            <app-welcome (addDestination)="showAddModal.set(true)"
                         (openAiPlanning)="facade.openAiPlanning()"
                         (loadLastEditedPlan)="loadLastEditedPlan($event)"
                         (scrollToFeed)="scrollToFeed()" />
          </div>
        </section>

        <!-- S2: cinematic slideshow (hidden when no featured trips) -->
        <tb-featured-slideshow #featuredSection />

        <!-- S5: full About Us page (feedback #4 — scrolling the homepage to the end shows
             the complete About Us content, not just the S3 teaser). Rendered BEFORE S4 the
             footer as of feedback F1 (2026-09-20) — section labels stay S1/S2/S4/S5/S6 for
             history even though S5 now precedes S4 in scroll order; see frontend CLAUDE.md. -->
        <section class="landing-snap-child landing-about-full">
          <app-about-content (startPlanning)="scrollToTop()" />
        </section>

        <!-- S4: footer -->
        <tb-app-footer (createPlan)="showAddModal.set(true)"
                        (viewMyTrips)="facade.openMyTrips()"
                        (exploreFeatured)="scrollToFeatured()" />

        <!-- S6: infinite feed of other users' shared plans (hidden until logged in and the first page returns ≥1 plan) -->
        <tb-landing-feed #feedSection (backToTop)="scrollToTop()" />

      </div>
    } @else {
      <!-- ── APP MODE: normal layout ── -->
      <div class="layout">
        <app-stop-list (addDestination)="showAddModal.set(true)" (openProfile)="facade.openProfile()" />
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
      <app-add-stop-modal [presetCityId]="presetCityId()" (close)="showAddModal.set(false); presetCityId.set(null)" />
    }

    <app-mobile-attractions-modal />

    <app-companion-mascot />

    <app-travel-docs-reminder />

    <app-highlight-tour />

    @if (toastService.message()) {
      <app-toast [message]="toastService.message()!" (done)="toastService.clear()" />
    }

    @if (autoSave.reminderVisible()) {
      <app-autosave-reminder-banner (dismiss)="autoSave.dismissReminder()" />
    }
  `
})
export class ShellComponent {
  readonly trip  = inject(TripService);
  readonly toastService = inject(ToastService);
  readonly autoSave = inject(AutoSaveService);
  readonly facade = inject(NavFacadeService);
  private readonly auth = inject(AuthService);
  private readonly highlightTour = inject(HighlightTourService);
  showAddModal   = signal(false);
  /** City id to pre-fill the add-stop modal with, from `?addCity=` — see the constructor. */
  presetCityId   = signal<string | null>(null);
  // read: ElementRef is required here — #featuredSection sits on a component tag
  // (<tb-featured-slideshow>), so without it the template ref resolves to the
  // FeaturedSlideshowComponent instance instead of its host DOM element.
  private readonly featuredSection = viewChild('featuredSection', { read: ElementRef<HTMLElement> });
  private readonly feedSection = viewChild('feedSection', { read: ElementRef<HTMLElement> });
  // #topSection sits directly on a native <section>, so no `read:` override is needed —
  // viewChild() already resolves a template ref on a plain DOM element to its ElementRef.
  private readonly topSection = viewChild('topSection', { read: ElementRef<HTMLElement> });

  constructor() {
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

    const route = inject(ActivatedRoute);
    const router = inject(Router);

    // "Planificar mi viaje a <ciudad>" from a city guide page (/ciudad/:slug) navigates here with
    // ?addCity=<cityId> — open the add-stop modal pre-filled with that city, then strip the param
    // so a reload/back-nav doesn't reopen it.
    const addCity = route.snapshot.queryParamMap.get('addCity');
    if (addCity && WORLD_CITIES.some(c => c.id === addCity)) {
      this.presetCityId.set(addCity);
      this.showAddModal.set(true);
      void router.navigate([], { queryParams: { addCity: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }

    // /ai-planning's "Ok" after "Notificarme" sends the user to /#featured to browse featured plans while they wait.
    // ponytail: scrolls once after first render; if featured trips arrive later the section may still be collapsed — add a retry when that bites.
    if (route.snapshot.fragment === 'featured') {
      afterNextRender(() => this.scrollToFeatured());
    }
  }

  /** S5's closing CTA (About Us content appended to the landing scroll, feedback #4) — scrolls
   *  back to S1 at the top of the page. The routed /about page's own CTA still calls goHome()
   *  instead, since there's no landing scroll to return to on that page. */
  scrollToTop(): void {
    this.topSection()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToFeatured(): void {
    this.featuredSection()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Welcome-page pill → S6 infinite feed. No-op in app mode (no landing scroll rendered). */
  scrollToFeed(): void {
    this.feedSection()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** "Último viaje que editaste" on the landing welcome screen (Task 7). */
  protected loadLastEditedPlan(plan: SavedPlan): void {
    this.facade.doLoadPlan(plan);
  }
}
