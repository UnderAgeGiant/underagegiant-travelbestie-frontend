import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { TripService } from '../trip/trip.service';
import { NavShellComponent } from '../nav/nav-shell.component';
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
        <tb-day-timeline />
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

    @if (toast()) {
      <app-toast [message]="toast()!" (done)="toast.set(null)" />
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
                         (planSaved)="showAiPlanning.set(false); toast.set('Plan guardado')" />
      }
    }
  `
})
export class ShellComponent {
  readonly trip  = inject(TripService);
  showAddModal   = signal(false);
  showProfile    = signal(false);
  showAiPlanning = signal(false);
  showMyTrips    = signal(false);
  toast          = signal<string | null>(null);
}
