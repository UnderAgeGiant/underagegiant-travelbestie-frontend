import { Component, inject, output } from '@angular/core';
import { NavFacadeService } from '../nav-facade.service';
import { NotificationBellComponent } from '../shared/notification-bell.component';

@Component({
  selector: 'app-nav-desktop',
  imports: [NotificationBellComponent],
  template: `
    <nav class="nav">
      <div class="nav-logo" (click)="onLogo()">Tripi<em>love</em></div>

      <div class="nav-search-wrap" style="flex:1;max-width:440px;position:relative">
        <div class="nav-search-inner">
          <span style="color:var(--t3);font-size:15px">🔍</span>
          <input i18n-placeholder="@@nav.searchPlaceholder" placeholder="Agregar ciudad o buscar viajes públicos…"
                 [value]="facade.navQuery()"
                 (input)="facade.navQuery.set($any($event.target).value); facade.searchOpen.set(true)"
                 (focus)="facade.searchOpen.set(true)"
                 (blur)="facade.scheduleClose()" />
        </div>
        @if (facade.searchOpen() && (facade.navFiltered().length > 0 || facade.navSharedTrips().length > 0)) {
          <div class="combo-dropdown" style="top:calc(100% + 6px)">
            <div class="combo-list">
              @for (city of facade.navFiltered(); track city.id) {
                <div class="combo-item" (mousedown)="facade.quickAdd(city)">
                  <span class="combo-item-flag">{{ city.flag }}</span>
                  <div>
                    <div class="combo-item-city">{{ city.name }}</div>
                    <div class="combo-item-country">{{ city.country }}</div>
                  </div>
                  <span style="margin-left:auto;font-size:11px;color:var(--lav-d);font-weight:600" i18n="@@nav.quickAdd">+ Agregar</span>
                </div>
              }
              @if (facade.navSharedTrips().length > 0) {
                @if (facade.navFiltered().length > 0) { <div class="combo-section-sep"></div> }
                <div class="combo-section-header">✈️ Viajes compartidos</div>
                @for (t of facade.navSharedTrips(); track t.id) {
                  <div class="combo-item" (mousedown)="facade.openSharedTrip(t.id)">
                    <span class="combo-item-flag">🗺️</span>
                    <div>
                      <div class="combo-item-city">{{ t.tripName }}</div>
                      <div class="combo-item-country">Por {{ t.ownerName }} · {{ t.stops.length }} ciudad{{ t.stops.length !== 1 ? 'es' : '' }}@if ((t.favoriteCount ?? 0) >= 1) { · ❤️ {{ t.favoriteCount }} }</div>
                    </div>
                    <span style="margin-left:auto;font-size:11px;color:var(--lav-d);font-weight:600">Ver →</span>
                  </div>
                }
              }
            </div>
          </div>
        }
      </div>

      <div class="nav-right">
        @if (facade.auth.isLoggedIn() && facade.karma.karma() !== null) {
          <div style="display:flex;align-items:center;gap:6px">
            <!-- karma pill wrapper — position:relative anchors the floating badge -->
            <div style="position:relative">
              @if (facade.karmaGainAnim() > 0) {
                <div class="karma-gain-badge">+{{ facade.karmaGainAnim() }} ✨</div>
              }
              <div [style]="facade.karmaPillStyle()"
                   [class.karma-pill-pulse]="facade.karmaGainAnim() > 0"
                   style="display:flex;align-items:center;gap:5px;padding:4px 11px;border-radius:99px;font-size:12px;font-weight:700;transition:background .35s,color .35s"
                   title="Good Karma">
                <span [class.karma-icon-sparkle]="facade.karmaGainAnim() > 0"
                      style="font-size:14px">{{ facade.karmaIcon() }}</span>
                <span>{{ facade.karma.karma() }}</span>
                <span style="font-weight:500;opacity:.8" i18n="@@nav.karma">karma</span>
              </div>
            </div>
            @if (facade.auth.isLoggedIn() && facade.cooldown.cooldownSeconds() > 0) {
              <div [class]="'comment-cooldown-banner' + (facade.cooldown.shaking() ? ' shake' : '')">
                🕐 <span i18n="@@nav.commentCooldown">Validando tu comentario…</span>
                {{ facade.cooldown.cooldownSeconds() }}s
              </div>
            }
            <button class="btn-pill btn-primary"
                    style="padding:4px 10px;font-size:11px;font-weight:700"
                    (click)="facade.openBuyKarma()"
                    i18n="@@nav.buyKarmaBtn">
              + Comprar
            </button>
          </div>
        }

        @if (facade.auth.isLoggedIn()) {
          <app-notification-bell />
        }

        @if (!facade.auth.isLoggedIn()) {
          <button class="btn-pill btn-ghost" (click)="facade.authModal.openLogin()" i18n="@@nav.signInBtn">Iniciar sesión</button>
        } @else {
          <div style="position:relative">
            <button class="user-btn" (click)="facade.toggleUserMenu()">
              <div class="user-avatar">{{ facade.initials() }}</div>
              <span class="user-btn-name">{{ facade.auth.currentUser()?.name }}</span>
              <span style="font-size:10px;color:var(--t3)">▾</span>
            </button>

            @if (facade.userMenuOpen()) {
              <div class="user-panel" style="position:absolute;top:calc(100% + 10px);right:0;min-width:270px">
                <div class="user-panel-head">
                  <div class="up-title" i18n="@@nav.myAccount">Mi cuenta</div>
                  <div class="up-sub">{{ facade.auth.currentUser()?.email }}</div>
                </div>
                <div class="up-body">

                  <!-- Profile card -->
                  <div class="profile-card">
                    <div class="profile-av">{{ facade.initials() }}</div>
                    <div>
                      <div class="profile-name">{{ facade.auth.currentUser()?.name }}</div>
                      <div class="profile-email">{{ facade.auth.currentUser()?.email }}</div>
                    </div>
                  </div>

                  <button class="btn-pill btn-ghost"
                          style="width:100%;justify-content:center;margin-bottom:4px"
                          (click)="onProfile()" type="button"
                          i18n="@@nav.myProfile">👤 Mi perfil</button>
                  <button class="btn-pill btn-ghost"
                          style="width:100%;justify-content:center;margin-bottom:8px"
                          (click)="onMyTrips()" type="button"
                          i18n="@@nav.myTripsPage">🗺 Mis viajes</button>

                  <!-- Saved plans toggle -->
                  <button class="up-plans-btn" (click)="facade.togglePlans()" type="button">
                    <span>🗺</span>
                    <span i18n="@@nav.myPlans">Mis viajes guardados</span>
                    @if (facade.savedPlans.plans().length > 0) {
                      <span class="up-plans-badge">{{ facade.savedPlans.plans().length }}</span>
                    }
                    <span style="margin-left:auto;font-size:10px;opacity:.6">{{ facade.plansOpen() ? '▴' : '▾' }}</span>
                  </button>

                  <!-- Saved plans panel -->
                  @if (facade.plansOpen()) {
                    <div class="up-plans-panel">

                      @if (facade.savedPlans.plans().length === 0) {
                        <div class="up-plans-empty" i18n="@@nav.noSavedPlans">Sin viajes guardados aún ✈️</div>
                      } @else {
                        <div class="up-plans-search">
                          <input class="up-plans-search-input"
                                 type="search"
                                 placeholder="Buscar viaje…"
                                 [value]="facade.planSearch()"
                                 (input)="facade.planSearch.set($any($event.target).value)" />
                        </div>
                        <div class="up-plans-list">
                        @for (plan of facade.filteredPlans(); track plan.id) {
                          <div class="up-plan-row" [class.active]="facade.trip.loadedPlanId() === plan.id">
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
                                <span class="up-plan-confirm-text" style="color:var(--lav-d)">⿻ ¿Duplicar viaje? −1 ✨ karma</span>
                                <button class="up-plan-confirm-yes" style="background:var(--lav-d)"
                                        (click)="facade.confirmClonePlan(plan)" type="button">Sí</button>
                                <button class="up-plan-confirm-no" (click)="facade.cloningConfirmPlanId.set(null)" type="button">No</button>
                              </div>
                            } @else {
                              <button class="up-plan-load" (click)="facade.doLoadPlan(plan)" type="button">
                                <div class="up-plan-name">{{ plan.name }}</div>
                                <div class="up-plan-date">{{ facade.planDate(plan.savedAt) }}</div>
                              </button>
                              <button class="up-plan-del" (click)="facade.sharePlan(plan)" type="button"
                                      i18n-title="@@nav.sharePlan" title="Publicar">🔗</button>
                              @if (plan.shareId) {
                                <button class="up-plan-del" (click)="facade.shareNative(plan)" type="button"
                                        i18n-title="@@share.shareBtn" title="📤 Compartir">📤</button>
                              }
                              <button class="up-plan-del"
                                      [disabled]="facade.cloningPlanId() === plan.id"
                                      (click)="facade.cloningConfirmPlanId.set(plan.id)"
                                      type="button"
                                      title="Duplicar">
                                {{ facade.cloningPlanId() === plan.id ? '…' : facade.clonedPlanId() === plan.id ? '✓' : '⿻' }}
                              </button>
                              <button class="up-plan-del" (click)="facade.doDeletePlan(plan.id)" type="button"
                                      title="Eliminar">✕</button>
                            }
                          </div>
                        }
                        @if (facade.filteredPlans().length === 0) {
                          <div class="up-plans-empty">Sin resultados 🔍</div>
                        }
                        </div>
                      }

                      <div class="up-plans-sep"></div>

                      @if (facade.trip.stops().length > 0) {
                        @if (!facade.savePlanOpen()) {
                          <button class="up-save-btn" (click)="facade.openSaveForm()" type="button">
                            <span>💾</span>
                            <span>
                              @if (facade.trip.loadedPlanId()) {
                                <ng-container i18n="@@nav.updatePlan">Actualizar viaje</ng-container>
                              } @else {
                                <ng-container i18n="@@nav.savePlan">Guardar como nuevo viaje</ng-container>
                              }
                            </span>
                            @if (!facade.trip.loadedPlanId()) {
                              <span class="karma-cost" style="margin-left:auto">−1 ✨ karma</span>
                            }
                          </button>
                        } @else {
                          <div class="up-save-form">
                            <input class="up-save-input"
                                   [value]="facade.savePlanName()"
                                   (input)="facade.savePlanName.set($any($event.target).value)"
                                   i18n-placeholder="@@nav.savePlanPlaceholder" placeholder="Nombre del viaje…"
                                   (keydown.enter)="facade.doSavePlan()" />
                            <div class="up-save-actions">
                              <button class="btn-pill btn-primary" style="flex:1;font-size:11px;padding:6px 0"
                                      (click)="facade.doSavePlan()" type="button" i18n="@@nav.savePlanConfirm">Guardar</button>
                              <button class="btn-pill btn-outline" style="font-size:11px;padding:6px 12px"
                                      (click)="facade.savePlanOpen.set(false)" type="button">✕</button>
                            </div>
                            @if (facade.savePlanError()) {
                              <div style="font-size:11px;color:oklch(48% 0.16 50);text-align:center;margin-top:4px">
                                ⭐ {{ facade.savePlanError() }}
                              </div>
                            }
                          </div>
                        }
                      }

                      <button class="up-save-btn" style="color:var(--t3)"
                              (click)="facade.doNewTrip()" type="button">
                        <span>＋</span>
                        <span i18n="@@nav.newTrip">Nuevo viaje en blanco</span>
                        <span class="karma-cost" style="margin-left:auto">−1 ✨ karma</span>
                      </button>

                    </div>
                  }

                  <!-- My favorites -->
                  <button class="up-plans-btn" (click)="facade.toggleFavorites()" type="button">
                    <span>❤️</span>
                    <span i18n="@@nav.myFavorites">Mis favoritos</span>
                    @if (facade.favorites.favoritedTrips().length > 0) {
                      <span class="up-plans-badge">{{ facade.favorites.favoritedTrips().length }}</span>
                    }
                    <span style="margin-left:auto;font-size:10px;opacity:.6">{{ facade.favoritesOpen() ? '▴' : '▾' }}</span>
                  </button>
                  @if (facade.favoritesOpen()) {
                    <div class="up-plans-panel">
                      @if (facade.favorites.loading()) {
                        <div class="up-plans-empty" i18n="@@nav.loadingFavorites">Cargando…</div>
                      } @else if (facade.favorites.favoritedTrips().length === 0) {
                        <div class="up-plans-empty" i18n="@@nav.noFavorites">Sin favoritos aún ❤️</div>
                      } @else {
                        <div class="up-plans-search">
                          <input class="up-plans-search-input"
                                 type="search"
                                 i18n-placeholder="@@nav.searchFavoritesPlaceholder" placeholder="Buscar favorito…"
                                 [value]="facade.favoritesSearch()"
                                 (input)="facade.favoritesSearch.set($any($event.target).value)" />
                        </div>
                        <div class="up-plans-list">
                          @for (t of facade.filteredFavorites(); track t.shareId) {
                            <button class="up-shared-trip-row" (click)="facade.goToSharedTrip(t.shareId)" type="button">
                              <div class="up-shared-trip-name">{{ t.tripName }}</div>
                              <div class="up-shared-trip-meta">Por {{ t.ownerName }} · {{ t.stops.length }} ciudad{{ t.stops.length !== 1 ? 'es' : '' }}</div>
                            </button>
                          }
                          @if (facade.filteredFavorites().length === 0) {
                            <div class="up-plans-empty">Sin resultados 🔍</div>
                          }
                        </div>
                      }
                    </div>
                  }

                  <!-- My shared trips -->
                  @if (facade.mySharedTrips().length > 0) {
                    <button class="up-plans-btn" (click)="facade.toggleMyTrips()" type="button">
                      <span>🔗</span>
                      <span>Mis viajes compartidos</span>
                      <span class="up-plans-badge">{{ facade.mySharedTrips().length }}</span>
                      <span style="margin-left:auto;font-size:10px;opacity:.6">{{ facade.myTripsOpen() ? '▴' : '▾' }}</span>
                    </button>
                    @if (facade.myTripsOpen()) {
                      <div class="up-plans-panel">
                        <div class="up-plans-search">
                          <input class="up-plans-search-input"
                                 type="search"
                                 i18n-placeholder="@@nav.searchSharedTripsPlaceholder" placeholder="Buscar viaje compartido…"
                                 [value]="facade.sharedTripsSearch()"
                                 (input)="facade.sharedTripsSearch.set($any($event.target).value)" />
                        </div>
                        <div class="up-plans-list">
                          @for (t of facade.filteredSharedTrips(); track t.id) {
                            @let cmts = facade.commentCount(t.id);
                            <button class="up-shared-trip-row" (click)="facade.goToSharedTrip(t.id)" type="button">
                              <div class="up-shared-trip-name">{{ t.tripName }}</div>
                              <div class="up-shared-trip-meta">
                                {{ t.stops.length }} ciudad{{ t.stops.length !== 1 ? 'es' : '' }}
                                @if (cmts > 0) {
                                  · <span class="up-shared-trip-cmts">{{ cmts }} comentario{{ cmts !== 1 ? 's' : '' }}</span>
                                }
                              </div>
                            </button>
                          }
                          @if (facade.filteredSharedTrips().length === 0) {
                            <div class="up-plans-empty">Sin resultados 🔍</div>
                          }
                        </div>
                      </div>
                    }
                  }

                  <button class="signout-btn" (click)="facade.doLogout()" i18n="@@nav.signOut">Cerrar sesión</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </nav>
  `,
})
export class NavDesktopComponent {
  readonly facade = inject(NavFacadeService);

  logoClick    = output<void>();
  profileClick = output<void>();
  myTripsClick = output<void>();

  onLogo(): void { this.facade.onLogoClick(); this.logoClick.emit(); }
  onProfile(): void { this.facade.openProfile(); this.profileClick.emit(); }
  onMyTrips(): void { this.facade.userMenuOpen.set(false); this.myTripsClick.emit(); }
}
