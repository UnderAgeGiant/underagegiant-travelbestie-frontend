import { Component, inject, output, signal } from '@angular/core';
import { NavFacadeService } from '../nav-facade.service';
import { NotificationBellComponent } from '../shared/notification-bell.component';
import { SavedPlan } from '../../../core/saved-plans/saved-plans.service';

@Component({
  selector: 'app-nav-mobile',
  imports: [NotificationBellComponent],
  template: `
    <nav class="nav-m-bar">
      <div class="nav-logo" (click)="onLogo()">Tripi<em>love</em></div>
      <div style="flex:1"></div>

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
        <button class="btn-pill btn-ghost" (click)="facade.authModal.openLogin()"
                i18n="@@nav.signInBtn">Iniciar sesión</button>
      } @else {
        <button class="nav-m-burger" (click)="drawerOpen.set(true)"
                i18n-aria-label="@@nav.mobileMenuOpen" aria-label="Abrir menú">☰</button>
      }
    </nav>

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
                 placeholder="Agregar ciudad o buscar viajes públicos…"
                 [value]="facade.navQuery()"
                 (input)="facade.navQuery.set($any($event.target).value)" />
          @for (city of facade.navFiltered(); track city.id) {
            <button class="up-shared-trip-row" (click)="quickAdd(city)">
              <div class="up-shared-trip-name">{{ city.flag }} {{ city.name }}</div>
              <div class="up-shared-trip-meta">{{ city.country }}</div>
            </button>
          }
          @for (t of facade.navSharedTrips(); track t.id) {
            <button class="up-shared-trip-row" (click)="openSharedTrip(t.id)">
              <div class="up-shared-trip-name">🗺️ {{ t.tripName }}</div>
              <div class="up-shared-trip-meta">Por {{ t.ownerName }}</div>
            </button>
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

        <button class="up-plans-btn" (click)="onProfile()" i18n="@@nav.myProfile">👤 Mi perfil</button>
        <button class="up-plans-btn" (click)="onMyTrips()" i18n="@@nav.myTripsPage">🗺 Mis viajes</button>
        <button class="up-plans-btn" (click)="facade.openBuyKarma()">
          <span>✨</span><span i18n="@@nav.buyKarmaBtn">Comprar Karma</span>
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
                <button class="up-plan-load" (click)="onLoadPlan(plan)">
                  <div class="up-plan-name">{{ plan.name }}</div>
                  <div class="up-plan-date">{{ facade.planDate(plan.savedAt) }}</div>
                </button>
                <button class="up-plan-del" (click)="facade.sharePlan(plan)" type="button"
                        i18n-title="@@nav.sharePlan" title="Publicar">🔗</button>
                @if (plan.shareId) {
                  <button class="up-plan-del" (click)="facade.shareNative(plan)" type="button"
                          i18n-title="@@share.shareBtn" title="📤 Compartir">📤</button>
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
              <button class="up-shared-trip-row" (click)="goToShared(t.shareId)">
                <div class="up-shared-trip-name">{{ t.tripName }}</div>
                <div class="up-shared-trip-meta">Por {{ t.ownerName }}</div>
              </button>
            }
            @if (facade.filteredFavorites().length === 0) {
              <div class="up-plans-empty" i18n="@@nav.noFavorites">Sin favoritos aún ❤️</div>
            }
          </div>
        }

        <!-- Shared trips -->
        @if (facade.mySharedTrips().length > 0) {
          <button class="up-plans-btn" (click)="facade.toggleMyTrips()">
            <span>🔗</span><span>Mis viajes compartidos</span>
            <span class="up-plans-badge">{{ facade.mySharedTrips().length }}</span>
            <span style="margin-left:auto">{{ facade.myTripsOpen() ? '▴' : '▾' }}</span>
          </button>
          @if (facade.myTripsOpen()) {
            <div class="up-plans-panel">
              @for (t of facade.filteredSharedTrips(); track t.id) {
                <button class="up-shared-trip-row" (click)="goToShared(t.id)">
                  <div class="up-shared-trip-name">{{ t.tripName }}</div>
                </button>
              }
            </div>
          }
        }

        <button class="signout-btn" (click)="facade.doLogout()" i18n="@@nav.signOut">Cerrar sesión</button>
      </aside>
    }
  `,
})
export class NavMobileComponent {
  readonly facade = inject(NavFacadeService);

  logoClick    = output<void>();
  profileClick = output<void>();
  myTripsClick = output<void>();

  drawerOpen = signal(false);

  onLogo(): void { this.facade.onLogoClick(); this.drawerOpen.set(false); this.logoClick.emit(); }
  onProfile(): void { this.facade.openProfile(); this.drawerOpen.set(false); this.profileClick.emit(); }
  onMyTrips(): void { this.facade.userMenuOpen.set(false); this.drawerOpen.set(false); this.myTripsClick.emit(); }

  quickAdd = this.facade.quickAdd.bind(this.facade);
  openSharedTrip = this.facade.openSharedTrip.bind(this.facade);
  goToShared = this.facade.goToSharedTrip.bind(this.facade);

  onLoadPlan(plan: SavedPlan): void {
    this.facade.doLoadPlan(plan);
    this.drawerOpen.set(false);
  }
}
