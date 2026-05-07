import { Component, inject, signal } from '@angular/core';
import { TripService } from './features/trip/trip.service';
import { NavComponent } from './features/nav/nav.component';
import { WelcomeComponent } from './features/welcome/welcome.component';
import { StopListComponent } from './features/trip/stop-list/stop-list.component';
import { DestinationComponent } from './features/destination/destination.component';
import { AddStopModalComponent } from './features/trip/add-stop-modal/add-stop-modal.component';
import { ToastComponent } from './shared/toast/toast.component';
import { ProfileComponent } from './features/profile/profile.component';
import { SharedTripComponent } from './features/shared-trip/shared-trip.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NavComponent,
    WelcomeComponent,
    StopListComponent,
    DestinationComponent,
    AddStopModalComponent,
    ToastComponent,
    ProfileComponent,
    SharedTripComponent,
  ],
  template: `
    @if (sharedTripId()) {
      <app-shared-trip [tripId]="sharedTripId()!" />
    } @else {
    <app-nav (logoClick)="trip.setActive(trip.stops()[0]?.cityId ?? '')"
             (profileClick)="showProfile.set(true)" />

    <div class="layout">
      <app-stop-list (addDestination)="showAddModal.set(true)" />

      <div class="right-panel">
        @if (trip.stops().length === 0) {
          <app-welcome (addDestination)="showAddModal.set(true)" />
        } @else if (!trip.activeStop()) {
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

    @if (showAddModal()) {
      <app-add-stop-modal (close)="showAddModal.set(false)" />
    }

    @if (toast()) {
      <app-toast [message]="toast()!" (done)="toast.set(null)" />
    }

    @if (showProfile()) {
      <app-profile (close)="showProfile.set(false)" />
    }
    }
  `,
})
export class AppComponent {
  readonly trip = inject(TripService);
  showAddModal  = signal(false);
  showProfile   = signal(false);
  toast         = signal<string | null>(null);

  readonly sharedTripId = signal<string | null>(
    new URLSearchParams(window.location.search).get('share')
  );
}
