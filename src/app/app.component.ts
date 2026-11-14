import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TrophyCelebrationComponent } from './shared/trophy-celebration/trophy-celebration.component';
import { TripCardDialogComponent } from './features/trip-card/trip-card-dialog.component';
import { TripCardService } from './features/trip-card/trip-card.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, TrophyCelebrationComponent, TripCardDialogComponent],
    // The card dialog (city catalog, renderer) loads on its first open, not in the main bundle.
    template: `<router-outlet /><tb-trophy-celebration />@defer (when tripCard.request()) { <tb-trip-card-dialog /> }`,
})
export class AppComponent {
    readonly tripCard = inject(TripCardService);
}
