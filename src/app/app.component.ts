import { Component, effect, inject, untracked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TrophyCelebrationComponent } from './shared/trophy-celebration/trophy-celebration.component';
import { TripCardDialogComponent } from './features/trip-card/trip-card-dialog.component';
import { TripCardService } from './features/trip-card/trip-card.service';
import { ToastComponent } from './shared/toast/toast.component';
import { ToastService } from './core/ui/toast.service';
import { ReferralService } from './core/referral/referral.service';
import { AuthService } from './core/auth/auth.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, TrophyCelebrationComponent, TripCardDialogComponent, ToastComponent],
    // The card dialog (city catalog, renderer) loads on its first open, not in the main bundle.
    // The global toast lives here so service messages (plan export, unpublish) show on every route.
    template: `<router-outlet /><tb-trophy-celebration />@defer (when tripCard.request()) { <tb-trip-card-dialog /> }@if (toastService.message()) { <app-toast [message]="toastService.message()!" (done)="toastService.clear()" /> }`,
})
export class AppComponent {
    readonly tripCard = inject(TripCardService);
    readonly toastService = inject(ToastService);
    private readonly referral = inject(ReferralService);
    private readonly auth = inject(AuthService);

    constructor() {
        // F81: remember an invite code from the landing URL, then strip it from the address bar.
        this.referral.captureFromUrl();
        // Load the user's own code up front so a copied link or card QR carries it from the first click.
        effect(() => { if (this.auth.isLoggedIn()) untracked(() => void this.referral.loadSummary()); });
    }
}
