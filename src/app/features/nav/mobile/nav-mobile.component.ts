import { Component, inject, output, signal, input } from '@angular/core';
import { Router } from '@angular/router';
import { NavFacadeService } from '../nav-facade.service';
import { NotificationBellComponent } from '../shared/notification-bell.component';
import { CityGuidePromoComponent } from '../shared/city-guide-promo.component';
import { SavedPlan } from '../../../core/saved-plans/saved-plans.service';
import { HighlightTargetDirective } from '../../../shared/highlight-tour/highlight-target.directive';
import { PlanActionsMenuComponent, PlanMenuAction } from '../plan-actions-menu/plan-actions-menu.component';

@Component({
  selector: 'app-nav-mobile',
  imports: [NotificationBellComponent, CityGuidePromoComponent, HighlightTargetDirective, PlanActionsMenuComponent],
  template: `
    <nav class="nav-m-bar">
      <div class="nav-logo" tbHighlightTarget="nav-logo" (click)="onLogo()">Tripi<em>love</em></div>
      <div style="flex:1"></div>

      <button class="lang-drop-btn" data-testid="lang-switch" type="button"
              (click)="facade.switchLocale(facade.locale.other())"
              i18n-aria-label="@@nav.langSwitch" aria-label="Cambiar idioma">
        <img [src]="facade.locale.current() === 'es-CL' ? 'https://flagcdn.com/w20/cl.jpg' : 'https://flagcdn.com/w20/us.jpg'"
             [alt]="facade.locale.current() === 'es-CL' ? 'ES' : 'EN'"
             class="lang-nav-flag" />
        <span>{{ facade.locale.current() === 'es-CL' ? 'ES' : 'EN' }}</span>
      </button>

      @if (facade.auth.isLoggedIn() && facade.karma.karma() !== null) {
        <div [style]="facade.karmaPillStyle()"
             class="nav-m-karma"
             (click)="facade.openBuyKarma()">
          <span style="font-size:14px">{{ facade.karmaIcon() }}</span>
          <span>{{ facade.karma.karma() }}</span>
        </div>
      }

      @if (facade.auth.isLoggedIn()) {
        <app-notification-bell />
      }

      @if (!facade.auth.isLoggedIn()) {
        <button class="btn-pill btn-ghost" tbHighlightTarget="login-btn" (click)="facade.authModal.openLogin()"
                i18n="@@nav.signInBtn">Iniciar sesión</button>
      } @else {
        <button class="nav-m-burger" data-testid="nav-mobile-menu" tbHighlightTarget="user-menu-btn" (click)="drawerOpen.set(true)"
                i18n-aria-label="@@nav.mobileMenuOpen" aria-label="Abrir menú">☰</button>
      }
    </nav>

    @if (showCityGuidePromo()) {
      <div class="nav-m-guide-promo">
        <app-city-guide-promo />
      </div>
    }

    @if (drawerOpen()) {
      <div class="nav-m-backdrop" (click)="drawerOpen.set(false)"></div>
      <aside class="nav-m-drawer">
        <header class="nav-m-drawer-head">
          <span i18n="@@nav.mobileMenuTitle">Menú</span>
          <button class="nav-m-close" (click)="drawerOpen.set(false)"
                  i18n-aria-label="@@nav.mobileClose" aria-label="Cerrar menú">✕</button>
        </header>

        <!-- Search -->
        <div class="nav-m-section">
          <input class="up-save-input" i18n-placeholder="@@nav.searchPlaceholder"
                 placeholder="Buscar viajes creados por otros usuarios"
                 [value]="facade.navQuery()"
                 (input)="facade.navQuery.set($any($event.target).value)" />
          @for (t of facade.navSharedTrips(); track t.id) {
            <button class="up-shared-trip-row" (click)="onOpenSharedTrip(t.id)">
              <div class="up-shared-trip-name">🗺️ {{ t.tripName }}</div>
              <div class="up-shared-trip-meta">Por {{ t.ownerName }}</div>
            </button>
          }
          @if (facade.navNoResults()) {
            <div class="up-plans-empty" i18n="@@nav.searchNoResults">Sin resultados 🔍</div>
          }
        </div>

        <!-- Account -->
        <div class="profile-card">
          <div class="profile-av">{{ facade.initials() }}</div>
          <div>
            <div class="profile-name">{{ facade.auth.currentUser()?.name }}</div>
            <div class="profile-email">{{ facade.auth.currentUser()?.email }}</div>
          </div>
        </div>

        @if (facade.auth.currentUser()?.username) {
          <button class="up-plans-btn nav-page-btn" (click)="onMyProfile()" i18n="@@nav.myProfile">👤 Mi perfil</button>
        }
        <button class="up-plans-btn nav-page-btn" [class.active]="activeView() === 'preferences'" (click)="onPreferences()" i18n="@@nav.myPreferences">⚙️ Configuración de cuenta</button>
        <button class="up-plans-btn nav-page-btn" [class.active]="activeView() === 'mytrips'" (click)="onMyTrips()" i18n="@@nav.myTripsPage">🗺 Mis viajes</button>
        <button class="up-plans-btn nav-page-btn" [class.active]="activeView() === 'karmahistory'" (click)="onKarmaHistory()" i18n="@@nav.karmaHistory">📈 Historial de token</button>
        <button class="up-plans-btn" (click)="onBuyKarma()">
          <span>✨</span><span i18n="@@nav.buyKarmaBtn">Comprar Tokens</span>
        </button>

        <!-- Saved plans -->
        <button class="up-plans-btn" (click)="facade.togglePlans()">
          <span>🗺</span><span i18n="@@nav.myPlans">Mis viajes guardados</span>
          @if (facade.savedPlans.plans().length > 0) {
            <span class="up-plans-badge">{{ facade.savedPlans.plans().length }}</span>
          }
          <span style="margin-left:auto">{{ facade.plansOpen() ? '▴' : '▾' }}</span>
        </button>
        @if (facade.plansOpen()) {
          <div class="up-plans-panel">
            @for (plan of facade.filteredPlans(); track plan.id) {
              <div class="up-plan-row">
                @if (facade.deletingPlanId() === plan.id) {
                  <div class="up-plan-confirm">
                    <span class="up-plan-confirm-text" i18n="@@nav.deletePlanConfirm">¿Eliminar viaje?</span>
                    <button class="up-plan-confirm-yes" (click)="facade.confirmDeletePlan(plan.id)" type="button"
                            i18n="@@nav.deletePlanYes">Sí</button>
                    <button class="up-plan-confirm-no" (click)="facade.deletingPlanId.set(null)" type="button"
                            i18n="@@nav.deletePlanNo">No</button>
                  </div>
                } @else if (facade.cloningConfirmPlanId() === plan.id) {
                  <div class="up-plan-confirm" style="background:var(--lav)">
                    <span class="up-plan-confirm-text" style="color:var(--lav-d)">⿻ ¿Duplicar viaje? −1 ✨ token</span>
                    <button class="up-plan-confirm-yes" style="background:var(--lav-d)"
                            (click)="facade.confirmClonePlan(plan)" type="button">Sí</button>
                    <button class="up-plan-confirm-no" (click)="facade.cloningConfirmPlanId.set(null)" type="button">No</button>
                  </div>
                } @else if (facade.unpublishConfirmPlanId() === plan.id) {
                  <div class="up-plan-confirm">
                    <span class="up-plan-confirm-text" i18n="@@nav.unpublishConfirm">¿Dejar de publicar? El enlace dejará de funcionar.</span>
                    <button class="up-plan-confirm-yes" (click)="facade.confirmUnpublish(plan)" type="button"
                            i18n="@@nav.unpublishYes">Sí</button>
                    <button class="up-plan-confirm-no" (click)="facade.unpublishConfirmPlanId.set(null)" type="button"
                            i18n="@@nav.deletePlanNo">No</button>
                  </div>
                } @else {
                  <button class="up-plan-load" (click)="onLoadPlan(plan)">
                    <div class="up-plan-name">{{ plan.name }}</div>
                    <div class="up-plan-date">{{ facade.planDate(plan.savedAt) }}</div>
                  </button>
                  <tb-plan-actions-menu [plan]="plan" [busy]="facade.planBusy(plan)" (action)="onPlanAction(plan, $event)" />
                }
              </div>
            }
            @if (facade.filteredPlans().length === 0) {
              <div class="up-plans-empty" i18n="@@nav.noSavedPlans">Sin viajes guardados aún ✈️</div>
            }
          </div>
        }

        <!-- Favorites -->
        <button class="up-plans-btn" (click)="facade.toggleFavorites()">
          <span>❤️</span><span i18n="@@nav.myFavorites">Mis favoritos</span>
          @if (facade.favorites.favoritedTrips().length > 0) {
            <span class="up-plans-badge">{{ facade.favorites.favoritedTrips().length }}</span>
          }
          <span style="margin-left:auto">{{ facade.favoritesOpen() ? '▴' : '▾' }}</span>
        </button>
        @if (facade.favoritesOpen()) {
          <div class="up-plans-panel">
            @for (t of facade.filteredFavorites(); track t.shareId) {
              <button class="up-shared-trip-row" (click)="onGoToShared(t.shareId)">
                <div class="up-shared-trip-name">{{ t.tripName }}</div>
                <div class="up-shared-trip-meta">Por {{ t.ownerName }}</div>
              </button>
            }
            @if (facade.filteredFavorites().length === 0) {
              <div class="up-plans-empty" i18n="@@nav.noFavorites">Sin favoritos aún ❤️</div>
            }
          </div>
        }

        <button class="up-legal-link" type="button" (click)="onGuides()" i18n="@@nav.legalGuides">Legales y Guías</button>
        <button class="signout-btn" (click)="onLogout()" i18n="@@nav.signOut">Cerrar sesión</button>
      </aside>
    }
  `,
})
export class NavMobileComponent {
  readonly facade = inject(NavFacadeService);
  private readonly router = inject(Router);

  logoClick    = output<void>();
  preferencesClick = output<void>();
  activeView   = input<'preferences' | 'mytrips' | 'karmahistory' | null>(null);
  /** Default true: shown as a full-width strip under the compact bar on every page that renders <app-nav>. */
  showCityGuidePromo = input<boolean>(true);

  drawerOpen = signal(false);

  onLogo(): void { this.facade.onLogoClick(); this.drawerOpen.set(false); this.logoClick.emit(); }
  onMyProfile(): void { this.facade.openMyProfile(); this.drawerOpen.set(false); }
  onPreferences(): void { this.facade.openPreferences(); this.drawerOpen.set(false); this.preferencesClick.emit(); }
  onMyTrips(): void { this.drawerOpen.set(false); this.facade.openMyTrips(); }
  onKarmaHistory(): void { this.drawerOpen.set(false); this.facade.openKarmaHistory(); }
  onGuides(): void { void this.router.navigateByUrl('/guides'); this.drawerOpen.set(false); }
  onBuyKarma(): void { this.facade.openBuyKarma(); this.drawerOpen.set(false); }

  // The account drawer is local component state (drawerOpen) — facade.doLogout() has no way
  // to close it itself, unlike userMenuOpen (owned by the facade). Without this, signing out
  // from the drawer left it open afterward, still showing the now-stale account/plans/favorites
  // sections behind the "Iniciar sesión" button that replaces the burger menu once logged out.
  onLogout(): void { this.facade.doLogout(); this.drawerOpen.set(false); }

  // Both navigate away from whatever page the drawer is open over (to /shared/:id) —
  // like every other drawer action, they must close the drawer themselves first,
  // or it's left open on top of the shared-trip page underneath (bug: selecting a
  // shared trip from the drawer left the drawer covering the trip that just loaded).
  onOpenSharedTrip(id: string): void { this.drawerOpen.set(false); this.facade.openSharedTrip(id); }
  onGoToShared(id: string): void { this.drawerOpen.set(false); this.facade.goToSharedTrip(id); }

  /** Every action except these navigates or opens a modal, so it closes the drawer itself first. */
  onPlanAction(plan: SavedPlan, action: PlanMenuAction): void {
    const staysInDrawer = action === 'duplicate' || action === 'unpublish' || action === 'delete' || action === 'export';
    if (!staysInDrawer) this.drawerOpen.set(false);
    this.facade.runPlanAction(plan, action);
  }

  onLoadPlan(plan: SavedPlan): void {
    this.facade.doLoadPlan(plan);
    this.drawerOpen.set(false);
  }
}
