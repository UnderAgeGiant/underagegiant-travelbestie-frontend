import { Component, inject, output, input } from '@angular/core';
import { DeviceService } from '../../core/device/device.service';
import { NavFacadeService } from './nav-facade.service';
import { NavDesktopComponent } from './desktop/nav-desktop.component';
import { NavMobileComponent } from './mobile/nav-mobile.component';
import { AuthModalComponent } from './shared/auth-modal.component';
import { BuyKarmaModalComponent } from '../karma/buy-karma-modal.component';
import { KarmaSuccessOverlayComponent } from '../karma/karma-success-overlay.component';
import { InsufficientKarmaModalComponent } from '../karma/insufficient-karma-modal.component';

@Component({
  selector: 'app-nav',
  imports: [
    NavDesktopComponent, NavMobileComponent, AuthModalComponent,
    BuyKarmaModalComponent, KarmaSuccessOverlayComponent, InsufficientKarmaModalComponent,
  ],
  template: `
    @if (device.isMobile()) {
      <app-nav-mobile [activeView]="activeView()" (logoClick)="logoClick.emit()" (profileClick)="profileClick.emit()" />
    } @else {
      <app-nav-desktop [activeView]="activeView()" (logoClick)="logoClick.emit()" (profileClick)="profileClick.emit()" />
    }

    <app-auth-modal />

    @if (facade.buyKarmaOpen()) {
      <app-buy-karma-modal
        [confirmingPurchaseRef]="facade.karmaModal.mpConfirm()?.purchaseRef ?? null"
        [confirmingStatus]="facade.karmaModal.mpConfirm()?.status ?? null"
        (closed)="facade.karmaModal.closeBuy()"
        (karmaGained)="facade.onKarmaGained($event)">
      </app-buy-karma-modal>
    }

    @if (facade.karmaModal.insufficientOpen()) {
      <app-insufficient-karma-modal />
    }

    @if (facade.karmaSuccessOpen()) {
      <app-karma-success-overlay
        [amount]="facade.karmaSuccessAmount()"
        [newTotal]="facade.karma.karma() ?? 0"
        (dismissed)="facade.dismissKarmaSuccess()">
      </app-karma-success-overlay>
    }
  `,
})
export class NavShellComponent {
  readonly device = inject(DeviceService);
  readonly facade = inject(NavFacadeService);

  logoClick    = output<void>();
  profileClick = output<void>();
  activeView   = input<'profile' | 'mytrips' | 'karmahistory' | null>(null);
}
