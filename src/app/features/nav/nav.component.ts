import { Component, inject, signal, computed, output, effect } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuthModalService } from '../../core/auth/auth-modal.service';
import { TripService } from '../trip/trip.service';
import { KarmaService } from '../../core/karma/karma.service';
import { KarmaModalService } from '../../core/karma/karma-modal.service';
import { SavedPlansService, SavedPlan } from '../../core/saved-plans/saved-plans.service';
import { SharedTrip, SharedTripsService } from '../../core/shared-trips/shared-trips.service';
import { ApiService } from '../../core/api/api.service';
import { FavoritesService } from '../../core/favorites/favorites.service';
import { FavoritedTrip } from '../../core/models/trip.model';
import { VisitedPlacesService } from '../../core/visited-places/visited-places.service';
import { CommentCooldownService } from '../../core/comments/comment-cooldown.service';
import { BuyKarmaModalComponent } from '../karma/buy-karma-modal.component';
import { KarmaSuccessOverlayComponent } from '../karma/karma-success-overlay.component';
import { InsufficientKarmaModalComponent } from '../karma/insufficient-karma-modal.component';
import { WORLD_CITIES } from '../../data/cities.data';
import { City } from '../../core/models/city.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [BuyKarmaModalComponent, KarmaSuccessOverlayComponent, InsufficientKarmaModalComponent],
  styles: [`
    /* ── Saved-plans toggle button ── */
    .up-plans-btn {
      display: flex; align-items: center; gap: 7px;
      width: 100%; padding: 9px 14px;
      background: none; border: none; border-radius: 10px;
      font-size: 12px; font-weight: 600; color: var(--t2);
      cursor: pointer; text-align: left;
      transition: background .12s;
    }
    .up-plans-btn:hover { background: var(--cream); }
    .up-plans-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 18px; height: 18px; border-radius: 99px; padding: 0 5px;
      background: var(--lav); color: var(--lav-d);
      font-size: 10px; font-weight: 700;
    }
    /* ── Plans panel ── */
    .up-plans-panel {
      margin: 0 8px 4px;
      background: var(--cream);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }
    .up-plans-empty {
      padding: 14px 12px;
      font-size: 11px; color: var(--t3); text-align: center;
    }
    /* ── Plan row ── */
    .up-plan-row {
      display: flex; align-items: stretch;
      border-bottom: 1px solid var(--border);
      transition: background .1s;
    }
    .up-plan-row:last-of-type { border-bottom: none; }
    .up-plan-row:hover { background: rgba(0,0,0,.03); }
    .up-plan-row.active { background: oklch(95% 0.04 280); }
    .up-plan-load {
      flex: 1; background: none; border: none;
      padding: 9px 12px; cursor: pointer; text-align: left;
    }
    .up-plan-name { font-size: 12px; font-weight: 700; color: var(--t1); }
    .up-plan-date { font-size: 10px; color: var(--t3); margin-top: 2px; }
    .up-plan-del {
      background: none; border: none; border-left: 1px solid var(--border);
      padding: 0 11px; font-size: 11px; color: var(--t3);
      cursor: pointer; flex-shrink: 0;
      transition: color .12s, background .12s;
    }
    .up-plan-del:hover { color: oklch(48% 0.18 25); background: oklch(97% 0.03 25); }
    /* ── Delete confirmation ── */
    .up-plan-confirm {
      display: flex; align-items: center; gap: 8px;
      width: 100%; padding: 8px 12px;
      background: oklch(98% 0.02 25);
    }
    .up-plan-confirm-text {
      flex: 1; font-size: 11px; font-weight: 600; color: oklch(45% 0.18 25);
    }
    .up-plan-confirm-yes {
      padding: 3px 11px; border-radius: 99px; border: none;
      background: oklch(45% 0.18 25); color: #fff;
      font-size: 11px; font-weight: 700; cursor: pointer;
      transition: opacity .12s;
    }
    .up-plan-confirm-yes:hover { opacity: .85; }
    .up-plan-confirm-no {
      padding: 3px 11px; border-radius: 99px;
      border: 1px solid var(--border); background: none;
      font-size: 11px; color: var(--t2); cursor: pointer;
      transition: background .12s;
    }
    .up-plan-confirm-no:hover { background: var(--cream); }
    /* ── Save form ── */
    .up-plans-sep { height: 1px; background: var(--border); }
    .up-save-btn {
      display: flex; align-items: center; gap: 6px;
      width: 100%; padding: 9px 12px;
      background: none; border: none;
      font-size: 11px; font-weight: 600; color: var(--lav-d);
      cursor: pointer; text-align: left;
      transition: background .12s;
    }
    .up-save-btn:hover { background: var(--lav); }
    .up-save-form { padding: 10px 12px; }
    .up-save-input {
      width: 100%; box-sizing: border-box;
      padding: 7px 10px; border-radius: 8px;
      border: 1.5px solid var(--border);
      font-size: 12px; color: var(--t1); background: #fff;
      outline: none; transition: border-color .12s;
    }
    .up-save-input:focus { border-color: var(--lav-d); }
    .up-save-actions { display: flex; gap: 6px; margin-top: 8px; }
    .combo-section-sep { height: 1px; background: var(--border); margin: 4px 0; }
    .combo-section-header { padding: 5px 14px 3px; font-size: 10px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; color: var(--t3); }
    .up-shared-trip-row { display: block; width: 100%; padding: 9px 12px; background: none; border: none; border-bottom: 1px solid var(--border); cursor: pointer; text-align: left; transition: background .1s; }
    .up-shared-trip-row:last-child { border-bottom: none; }
    .up-shared-trip-row:hover { background: var(--lav); }
    .up-shared-trip-name { font-size: 12px; font-weight: 700; color: var(--t1); }
    .up-shared-trip-meta { font-size: 10px; color: var(--t3); margin-top: 2px; }
    .up-shared-trip-cmts { color: var(--lav-d); font-weight: 600; }
    /* ── Plans search + scrollable list ── */
    .up-plans-search {
      padding: 6px 8px; border-bottom: 1px solid var(--border);
    }
    .up-plans-search-input {
      width: 100%; box-sizing: border-box;
      padding: 5px 8px; border-radius: 6px;
      border: 1.5px solid var(--border);
      font-size: 11px; color: var(--t1); background: #fff;
      outline: none; transition: border-color .12s;
    }
    .up-plans-search-input:focus { border-color: var(--lav-d); }
    .up-plans-list { max-height: 240px; overflow-y: auto; }
  `],
  template: `
    <nav class="nav">
      <div class="nav-logo" (click)="onLogoClick()">Tripi<em>love</em></div>

      <div class="nav-search-wrap" style="flex:1;max-width:440px;position:relative">
        <div class="nav-search-inner">
          <span style="color:var(--t3);font-size:15px">🔍</span>
          <input i18n-placeholder="@@nav.searchPlaceholder" placeholder="Agregar ciudad o buscar viajes públicos…"
                 [value]="navQuery()"
                 (input)="navQuery.set($any($event.target).value); searchOpen.set(true)"
                 (focus)="searchOpen.set(true)"
                 (blur)="scheduleClose()" />
        </div>
        @if (searchOpen() && (navFiltered().length > 0 || navSharedTrips().length > 0)) {
          <div class="combo-dropdown" style="top:calc(100% + 6px)">
            <div class="combo-list">
              @for (city of navFiltered(); track city.id) {
                <div class="combo-item" (mousedown)="quickAdd(city)">
                  <span class="combo-item-flag">{{ city.flag }}</span>
                  <div>
                    <div class="combo-item-city">{{ city.name }}</div>
                    <div class="combo-item-country">{{ city.country }}</div>
                  </div>
                  <span style="margin-left:auto;font-size:11px;color:var(--lav-d);font-weight:600" i18n="@@nav.quickAdd">+ Agregar</span>
                </div>
              }
              @if (navSharedTrips().length > 0) {
                @if (navFiltered().length > 0) { <div class="combo-section-sep"></div> }
                <div class="combo-section-header">✈️ Viajes compartidos</div>
                @for (t of navSharedTrips(); track t.id) {
                  <div class="combo-item" (mousedown)="openSharedTrip(t.id)">
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
        @if (auth.isLoggedIn() && karma.karma() !== null) {
          <div style="display:flex;align-items:center;gap:6px">
            <!-- karma pill wrapper — position:relative anchors the floating badge -->
            <div style="position:relative">
              @if (karmaGainAnim() > 0) {
                <div class="karma-gain-badge">+{{ karmaGainAnim() }} ✨</div>
              }
              <div [style]="karmaPillStyle()"
                   [class.karma-pill-pulse]="karmaGainAnim() > 0"
                   style="display:flex;align-items:center;gap:5px;padding:4px 11px;border-radius:99px;font-size:12px;font-weight:700;transition:background .35s,color .35s"
                   title="Good Karma">
                <span [class.karma-icon-sparkle]="karmaGainAnim() > 0"
                      style="font-size:14px">{{ karmaIcon() }}</span>
                <span>{{ karma.karma() }}</span>
                <span style="font-weight:500;opacity:.8" i18n="@@nav.karma">karma</span>
              </div>
            </div>
            @if (auth.isLoggedIn() && cooldown.cooldownSeconds() > 0) {
              <div [class]="'comment-cooldown-banner' + (cooldown.shaking() ? ' shake' : '')">
                🕐 <span i18n="@@nav.commentCooldown">Validando tu comentario…</span>
                {{ cooldown.cooldownSeconds() }}s
              </div>
            }
            <button class="btn-pill btn-primary"
                    style="padding:4px 10px;font-size:11px;font-weight:700"
                    (click)="openBuyKarma()"
                    i18n="@@nav.buyKarmaBtn">
              + Comprar
            </button>
          </div>
        }

        @if (!auth.isLoggedIn()) {
          <button class="btn-pill btn-ghost" (click)="authModal.openLogin()" i18n="@@nav.signInBtn">Iniciar sesión</button>
        } @else {
          <div style="position:relative">
            <button class="user-btn" (click)="toggleUserMenu()">
              <div class="user-avatar">{{ initials() }}</div>
              <span class="user-btn-name">{{ auth.currentUser()?.name }}</span>
              <span style="font-size:10px;color:var(--t3)">▾</span>
            </button>

            @if (userMenuOpen()) {
              <div class="user-panel" style="position:absolute;top:calc(100% + 10px);right:0;min-width:270px">
                <div class="user-panel-head">
                  <div class="up-title" i18n="@@nav.myAccount">Mi cuenta</div>
                  <div class="up-sub">{{ auth.currentUser()?.email }}</div>
                </div>
                <div class="up-body">

                  <!-- Profile card -->
                  <div class="profile-card">
                    <div class="profile-av">{{ initials() }}</div>
                    <div>
                      <div class="profile-name">{{ auth.currentUser()?.name }}</div>
                      <div class="profile-email">{{ auth.currentUser()?.email }}</div>
                    </div>
                  </div>

                  <button class="btn-pill btn-ghost"
                          style="width:100%;justify-content:center;margin-bottom:8px"
                          (click)="openProfile()" type="button"
                          i18n="@@nav.myProfile">👤 Mi perfil</button>

                  <!-- Saved plans toggle -->
                  <button class="up-plans-btn" (click)="togglePlans()" type="button">
                    <span>🗺</span>
                    <span i18n="@@nav.myPlans">Mis viajes guardados</span>
                    @if (savedPlans.plans().length > 0) {
                      <span class="up-plans-badge">{{ savedPlans.plans().length }}</span>
                    }
                    <span style="margin-left:auto;font-size:10px;opacity:.6">{{ plansOpen() ? '▴' : '▾' }}</span>
                  </button>

                  <!-- Saved plans panel -->
                  @if (plansOpen()) {
                    <div class="up-plans-panel">

                      @if (savedPlans.plans().length === 0) {
                        <div class="up-plans-empty" i18n="@@nav.noSavedPlans">Sin viajes guardados aún ✈️</div>
                      } @else {
                        <div class="up-plans-search">
                          <input class="up-plans-search-input"
                                 type="search"
                                 placeholder="Buscar viaje…"
                                 [value]="planSearch()"
                                 (input)="planSearch.set($any($event.target).value)" />
                        </div>
                        <div class="up-plans-list">
                        @for (plan of filteredPlans(); track plan.id) {
                          <div class="up-plan-row" [class.active]="trip.loadedPlanId() === plan.id">
                            @if (deletingPlanId() === plan.id) {
                              <div class="up-plan-confirm">
                                <span class="up-plan-confirm-text" i18n="@@nav.deletePlanConfirm">¿Eliminar viaje?</span>
                                <button class="up-plan-confirm-yes" (click)="confirmDeletePlan(plan.id)" type="button"
                                        i18n="@@nav.deletePlanYes">Sí</button>
                                <button class="up-plan-confirm-no" (click)="deletingPlanId.set(null)" type="button"
                                        i18n="@@nav.deletePlanNo">No</button>
                              </div>
                            } @else if (cloningConfirmPlanId() === plan.id) {
                              <div class="up-plan-confirm" style="background:var(--lav)">
                                <span class="up-plan-confirm-text" style="color:var(--lav-d)">⿻ ¿Duplicar viaje? −1 ✨ karma</span>
                                <button class="up-plan-confirm-yes" style="background:var(--lav-d)"
                                        (click)="confirmClonePlan(plan)" type="button">Sí</button>
                                <button class="up-plan-confirm-no" (click)="cloningConfirmPlanId.set(null)" type="button">No</button>
                              </div>
                            } @else {
                              <button class="up-plan-load" (click)="doLoadPlan(plan)" type="button">
                                <div class="up-plan-name">{{ plan.name }}</div>
                                <div class="up-plan-date">{{ planDate(plan.savedAt) }}</div>
                              </button>
                              <button class="up-plan-del"
                                      [disabled]="cloningPlanId() === plan.id"
                                      (click)="cloningConfirmPlanId.set(plan.id)"
                                      type="button"
                                      title="Duplicar">
                                {{ cloningPlanId() === plan.id ? '…' : clonedPlanId() === plan.id ? '✓' : '⿻' }}
                              </button>
                              <button class="up-plan-del" (click)="doDeletePlan(plan.id)" type="button"
                                      title="Eliminar">✕</button>
                            }
                          </div>
                        }
                        @if (filteredPlans().length === 0) {
                          <div class="up-plans-empty">Sin resultados 🔍</div>
                        }
                        </div>
                      }

                      <div class="up-plans-sep"></div>

                      @if (trip.stops().length > 0) {
                        @if (!savePlanOpen()) {
                          <button class="up-save-btn" (click)="openSaveForm()" type="button">
                            <span>💾</span>
                            <span>
                              @if (trip.loadedPlanId()) {
                                <ng-container i18n="@@nav.updatePlan">Actualizar viaje</ng-container>
                              } @else {
                                <ng-container i18n="@@nav.savePlan">Guardar como nuevo viaje</ng-container>
                              }
                            </span>
                            @if (!trip.loadedPlanId()) {
                              <span class="karma-cost" style="margin-left:auto">−1 ✨ karma</span>
                            }
                          </button>
                        } @else {
                          <div class="up-save-form">
                            <input class="up-save-input"
                                   [value]="savePlanName()"
                                   (input)="savePlanName.set($any($event.target).value)"
                                   i18n-placeholder="@@nav.savePlanPlaceholder" placeholder="Nombre del viaje…"
                                   (keydown.enter)="doSavePlan()" />
                            <div class="up-save-actions">
                              <button class="btn-pill btn-primary" style="flex:1;font-size:11px;padding:6px 0"
                                      (click)="doSavePlan()" type="button" i18n="@@nav.savePlanConfirm">Guardar</button>
                              <button class="btn-pill btn-outline" style="font-size:11px;padding:6px 12px"
                                      (click)="savePlanOpen.set(false)" type="button">✕</button>
                            </div>
                            @if (savePlanError()) {
                              <div style="font-size:11px;color:oklch(48% 0.16 50);text-align:center;margin-top:4px">
                                ⭐ {{ savePlanError() }}
                              </div>
                            }
                          </div>
                        }
                      }

                      <button class="up-save-btn" style="color:var(--t3)"
                              (click)="doNewTrip()" type="button">
                        <span>＋</span>
                        <span i18n="@@nav.newTrip">Nuevo viaje en blanco</span>
                        <span class="karma-cost" style="margin-left:auto">−1 ✨ karma</span>
                      </button>

                    </div>
                  }

                  <!-- My favorites -->
                  <button class="up-plans-btn" (click)="toggleFavorites()" type="button">
                    <span>❤️</span>
                    <span i18n="@@nav.myFavorites">Mis favoritos</span>
                    @if (favorites.favoritedTrips().length > 0) {
                      <span class="up-plans-badge">{{ favorites.favoritedTrips().length }}</span>
                    }
                    <span style="margin-left:auto;font-size:10px;opacity:.6">{{ favoritesOpen() ? '▴' : '▾' }}</span>
                  </button>
                  @if (favoritesOpen()) {
                    <div class="up-plans-panel">
                      @if (favorites.loading()) {
                        <div class="up-plans-empty" i18n="@@nav.loadingFavorites">Cargando…</div>
                      } @else if (favorites.favoritedTrips().length === 0) {
                        <div class="up-plans-empty" i18n="@@nav.noFavorites">Sin favoritos aún ❤️</div>
                      } @else {
                        <div class="up-plans-search">
                          <input class="up-plans-search-input"
                                 type="search"
                                 i18n-placeholder="@@nav.searchFavoritesPlaceholder" placeholder="Buscar favorito…"
                                 [value]="favoritesSearch()"
                                 (input)="favoritesSearch.set($any($event.target).value)" />
                        </div>
                        <div class="up-plans-list">
                          @for (t of filteredFavorites(); track t.shareId) {
                            <button class="up-shared-trip-row" (click)="goToSharedTrip(t.shareId)" type="button">
                              <div class="up-shared-trip-name">{{ t.tripName }}</div>
                              <div class="up-shared-trip-meta">Por {{ t.ownerName }} · {{ t.stops.length }} ciudad{{ t.stops.length !== 1 ? 'es' : '' }}</div>
                            </button>
                          }
                          @if (filteredFavorites().length === 0) {
                            <div class="up-plans-empty">Sin resultados 🔍</div>
                          }
                        </div>
                      }
                    </div>
                  }

                  <!-- My shared trips -->
                  @if (mySharedTrips().length > 0) {
                    <button class="up-plans-btn" (click)="toggleMyTrips()" type="button">
                      <span>🔗</span>
                      <span>Mis viajes compartidos</span>
                      <span class="up-plans-badge">{{ mySharedTrips().length }}</span>
                      <span style="margin-left:auto;font-size:10px;opacity:.6">{{ myTripsOpen() ? '▴' : '▾' }}</span>
                    </button>
                    @if (myTripsOpen()) {
                      <div class="up-plans-panel">
                        <div class="up-plans-search">
                          <input class="up-plans-search-input"
                                 type="search"
                                 i18n-placeholder="@@nav.searchSharedTripsPlaceholder" placeholder="Buscar viaje compartido…"
                                 [value]="sharedTripsSearch()"
                                 (input)="sharedTripsSearch.set($any($event.target).value)" />
                        </div>
                        <div class="up-plans-list">
                          @for (t of filteredSharedTrips(); track t.id) {
                            @let cmts = commentCount(t.id);
                            <button class="up-shared-trip-row" (click)="goToSharedTrip(t.id)" type="button">
                              <div class="up-shared-trip-name">{{ t.tripName }}</div>
                              <div class="up-shared-trip-meta">
                                {{ t.stops.length }} ciudad{{ t.stops.length !== 1 ? 'es' : '' }}
                                @if (cmts > 0) {
                                  · <span class="up-shared-trip-cmts">{{ cmts }} comentario{{ cmts !== 1 ? 's' : '' }}</span>
                                }
                              </div>
                            </button>
                          }
                          @if (filteredSharedTrips().length === 0) {
                            <div class="up-plans-empty">Sin resultados 🔍</div>
                          }
                        </div>
                      </div>
                    }
                  }

                  <button class="signout-btn" (click)="doLogout()" i18n="@@nav.signOut">Cerrar sesión</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </nav>

    @if (buyKarmaOpen()) {
      <app-buy-karma-modal
        (closed)="karmaModal.closeBuy()"
        (karmaGained)="onKarmaGained($event)">
      </app-buy-karma-modal>
    }

    @if (karmaModal.insufficientOpen()) {
      <app-insufficient-karma-modal />
    }

    @if (karmaSuccessOpen()) {
      <app-karma-success-overlay
        [amount]="karmaSuccessAmount()"
        [newTotal]="karma.karma() ?? 0"
        (dismissed)="dismissKarmaSuccess()">
      </app-karma-success-overlay>
    }

    @if (registerSuccessOpen()) {
      <div style="position:fixed;inset:0;z-index:1000;background:rgba(15,10,30,0.72);display:flex;align-items:center;justify-content:center;padding:16px">
        <div style="background:#fff;border-radius:24px;max-width:380px;width:100%;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.28)">
          <div style="background:linear-gradient(135deg,var(--mint),var(--sky));padding:40px 32px 32px;text-align:center">
            <div style="font-size:52px;margin-bottom:14px">🎉</div>
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:500;color:#fff;line-height:1.15;letter-spacing:-0.5px">
              ¡Bienvenido,<br><em>{{ registerSuccessName() }}</em>!
            </div>
          </div>
          <div style="padding:28px 32px 32px;text-align:center">
            <p style="font-size:14px;color:var(--t2);line-height:1.7;margin:0 0 24px">
              Tu cuenta ha sido creada exitosamente. ¡Ya puedes empezar a planear tus aventuras y compartirlas con tus amigos!
            </p>
            <button class="btn-pill btn-primary"
                    style="width:100%;justify-content:center;font-size:14px"
                    (click)="dismissRegisterSuccess()">
              ¡Empezar a planear! ✈️
            </button>
          </div>
        </div>
      </div>
    }

    @if (authModal.isOpen()) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div class="modal">
          <div class="modal-head" style="position:relative"
               [style.background]="loginMode() === 'login'
                 ? 'linear-gradient(135deg,var(--lav),var(--peach))'
                 : 'linear-gradient(135deg,var(--mint),var(--sky))'">
            <button type="button"
                    style="position:absolute;top:10px;right:12px;background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:16px;line-height:1;padding:5px 8px;border-radius:8px;cursor:pointer;transition:background .12s"
                    (click)="authModal.close()">✕</button>
            @if (loginMode() === 'login') {
              <div class="modal-title" i18n="@@nav.loginTitle">¡Bienvenido de vuelta! 👋</div>
              <div class="modal-sub" i18n="@@nav.loginSubtitle">Inicia sesión para guardar tus viajes</div>
            } @else {
              <div class="modal-title" i18n="@@nav.registerTitle">Crear cuenta ✨</div>
              <div class="modal-sub" i18n="@@nav.registerSubtitle">Únete y planifica viajes con tus amigos</div>
            }
          </div>
          <div class="modal-body">
            @if (loginMode() === 'login') {
              <div class="form-group">
                <label class="form-label" i18n="@@nav.emailLabel">Correo electrónico</label>
                <input class="form-input" type="email"
                       i18n-placeholder="@@nav.emailPlaceholder" placeholder="tú@correo.com"
                       [value]="loginEmail()"
                       (input)="loginEmail.set($any($event.target).value)" />
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label" i18n="@@nav.passwordLabel">Contraseña</label>
                <div style="position:relative">
                  <input class="form-input" style="padding-right:72px"
                         [type]="showPassword() ? 'text' : 'password'" placeholder="••••••••"
                         [value]="loginPassword()"
                         (input)="loginPassword.set($any($event.target).value)" />
                  <button type="button"
                          style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:11px;font-weight:600;color:var(--lav-d);cursor:pointer;padding:4px 2px;line-height:1"
                          (click)="showPassword.set(!showPassword())">
                    {{ showPassword() ? 'Ocultar' : 'Ver' }}
                  </button>
                </div>
              </div>
            }
            @if (loginMode() === 'register') {
              @if (!otpStep()) {
                <div class="form-group">
                  <label class="form-label" i18n="@@nav.nameLabel">Tu nombre</label>
                  <input class="form-input"
                         i18n-placeholder="@@nav.namePlaceholder" placeholder="Sofía García"
                         [value]="loginName()"
                         (input)="loginName.set($any($event.target).value)" />
                </div>
                <div class="form-group">
                  <label class="form-label" i18n="@@nav.emailLabel">Correo electrónico</label>
                  <input class="form-input" type="email"
                         i18n-placeholder="@@nav.emailPlaceholder" placeholder="tú@correo.com"
                         [value]="loginEmail()"
                         (input)="loginEmail.set($any($event.target).value)" />
                </div>
                <div class="form-group">
                  <label class="form-label" i18n="@@nav.passwordLabel">Contraseña</label>
                  <div style="position:relative">
                    <input class="form-input" style="padding-right:72px"
                           [type]="showPassword() ? 'text' : 'password'" placeholder="••••••••"
                           [value]="loginPassword()"
                           (input)="loginPassword.set($any($event.target).value)" />
                    <button type="button"
                            style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:11px;font-weight:600;color:var(--lav-d);cursor:pointer;padding:4px 2px;line-height:1"
                            (click)="showPassword.set(!showPassword())">
                      {{ showPassword() ? 'Ocultar' : 'Ver' }}
                    </button>
                  </div>
                  @if (loginPassword()) {
                    <div style="margin-top:7px">
                      <div style="display:flex;gap:3px;margin-bottom:4px">
                        @for (i of [0, 1, 2]; track i) {
                          <div style="flex:1;height:3px;border-radius:99px;transition:background .25s"
                               [style.background]="strengthBarActive(i) ? strengthColor() : 'oklch(92% 0.02 280)'"></div>
                        }
                      </div>
                      <span style="font-size:11px;font-weight:600;transition:color .25s"
                            [style.color]="strengthColor()">{{ strengthLabel() }}</span>
                    </div>
                  }
                </div>
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label" i18n="@@nav.confirmPasswordLabel">Confirmar contraseña</label>
                  <div style="position:relative">
                    <input class="form-input" style="padding-right:72px"
                           [type]="showConfirmPassword() ? 'text' : 'password'" placeholder="••••••••"
                           [value]="loginConfirmPassword()"
                           (input)="loginConfirmPassword.set($any($event.target).value)"
                           [style.border-color]="loginConfirmPassword() && !passwordsMatch() ? 'oklch(55% 0.22 25)' : ''" />
                    <button type="button"
                            style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:11px;font-weight:600;color:var(--lav-d);cursor:pointer;padding:4px 2px;line-height:1"
                            (click)="showConfirmPassword.set(!showConfirmPassword())">
                      {{ showConfirmPassword() ? 'Ocultar' : 'Ver' }}
                    </button>
                  </div>
                  @if (loginConfirmPassword() && !passwordsMatch()) {
                    <div style="font-size:11px;color:oklch(55% 0.22 25);margin-top:4px"
                         i18n="@@nav.confirmPasswordMismatch">Las contraseñas no coinciden</div>
                  }
                </div>
              } @else {
                <div style="text-align:center;padding:8px 0 4px">
                  <div style="font-size:28px">📧</div>
                  <div style="font-size:13px;font-weight:600;color:var(--t1);margin-top:6px"
                       i18n="@@nav.otpSentTitle">Revisa tu correo</div>
                  <div style="font-size:12px;color:var(--t3);margin-top:3px">
                    <ng-container i18n="@@nav.otpSentTo">Código enviado a </ng-container>
                    <strong>{{ loginEmail() }}</strong>
                  </div>
                </div>
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label" i18n="@@nav.otpLabel">Código de verificación</label>
                  <input class="form-input"
                         type="text" inputmode="numeric" maxlength="6"
                         i18n-placeholder="@@nav.otpPlaceholder" placeholder="000000"
                         [value]="otpCode()"
                         (input)="onOtpInput($any($event.target).value)" />
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px">
                  <span style="color:var(--lav-d);cursor:pointer" (click)="goBackFromOtp()"
                        i18n="@@nav.otpBack">← Cambiar email</span>
                  <span style="color:var(--lav-d);cursor:pointer" (click)="resendOtp()"
                        i18n="@@nav.otpResend">
                    {{ otpLoading() ? 'Enviando…' : 'Reenviar código' }}
                  </span>
                </div>
              }
            }
          </div>
          <div class="modal-foot" style="flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:center;padding-bottom:4px">
              @if (loginMode() !== 'register' || !otpStep()) {
                <div id="tb-turnstile"></div>
              }
            </div>
            <div style="display:flex;gap:8px;width:100%">
              <button class="btn-pill btn-outline" (click)="authModal.close()" style="flex:1" i18n="@@nav.cancelBtn">Cancelar</button>
              @if (loginMode() === 'login') {
                <button class="btn-pill btn-primary" (click)="doAuth()"
                        [disabled]="!captchaToken()"
                        [style.opacity]="captchaToken() ? '1' : '0.5'"
                        style="flex:2" i18n="@@nav.signInSubmit">Iniciar sesión →</button>
              } @else if (!otpStep()) {
                <button class="btn-pill btn-primary" (click)="sendOtp()"
                        [disabled]="otpLoading() || !captchaToken() || !loginName().trim() || !isEmailValid() || !loginPassword().trim() || !loginConfirmPassword().trim() || !passwordsMatch()"
                        [style.opacity]="(otpLoading() || !captchaToken() || !loginName().trim() || !isEmailValid() || !loginPassword().trim() || !loginConfirmPassword().trim() || !passwordsMatch()) ? '0.5' : '1'"
                        style="flex:2" i18n="@@nav.sendOtpBtn">
                  {{ otpLoading() ? 'Enviando…' : 'Enviar código →' }}
                </button>
              } @else {
                <button class="btn-pill btn-primary" (click)="doAuth()"
                        [disabled]="otpCode().length < 6 || registerLoading()"
                        [style.opacity]="otpCode().length >= 6 && !registerLoading() ? '1' : '0.5'"
                        style="flex:2" i18n="@@nav.registerSubmit">
                  {{ registerLoading() ? 'Verificando…' : 'Crear cuenta →' }}
                </button>
              }
            </div>
            @if (loginErrorCode() || loginError()) {
              <div style="font-size:11px;color:oklch(50% 0.18 25);text-align:center;padding:4px 8px;background:oklch(97% 0.03 25);border-radius:8px">
                @switch (authErrorContext()) {
                  @case ('login') {
                    @if (loginErrorCode() === 'USER_NOT_FOUND') {
                      ⚠ <ng-container i18n="@@nav.loginErrNotFound">No encontramos una cuenta con ese correo electrónico.</ng-container>
                    } @else if (loginErrorCode() === 'WRONG_PASSWORD') {
                      ⚠ <ng-container i18n="@@nav.loginErrWrongPassword">Contraseña incorrecta. Intenta de nuevo.</ng-container>
                    } @else {
                      ⚠ <ng-container i18n="@@nav.loginErrGeneric">Correo o contraseña incorrectos.</ng-container>
                    }
                  }
                  @case ('send-otp') {
                    @if (loginErrorCode() === 'RATE_LIMITED') {
                      ⚠ <ng-container i18n="@@nav.errRateLimited">Demasiados intentos. Espera unos minutos e inténtalo de nuevo.</ng-container>
                    } @else {
                      ⚠ <ng-container i18n="@@nav.sendOtpErr">No pudimos enviar el código. Es posible que ese correo ya tenga una cuenta.</ng-container>
                    }
                  }
                  @case ('register') {
                    @if (loginErrorCode() === 'RATE_LIMITED') {
                      ⚠ <ng-container i18n="@@nav.errRateLimited">Demasiados intentos. Espera unos minutos e inténtalo de nuevo.</ng-container>
                    } @else {
                      ⚠ <ng-container i18n="@@nav.registerOtpErr">Código incorrecto o vencido. Te enviamos uno nuevo, revisa tu correo.</ng-container>
                    }
                  }
                  @default {
                    ⚠ {{ loginError() }}
                  }
                }
              </div>
            }
            <div class="auth-toggle">
              @if (loginMode() === 'login') {
                <span style="cursor:pointer" (click)="switchToRegister()" i18n="@@nav.authToggleLogin">¿Sin cuenta? <span>Regístrate gratis</span></span>
              } @else {
                <span style="cursor:pointer" (click)="switchToLogin()" i18n="@@nav.authToggleRegister">¿Ya tienes una? <span>Inicia sesión</span></span>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class NavComponent {
  readonly auth             = inject(AuthService);
  readonly authModal        = inject(AuthModalService);

  readonly trip             = inject(TripService);
  readonly karma            = inject(KarmaService);
  readonly karmaModal       = inject(KarmaModalService);
  readonly savedPlans       = inject(SavedPlansService);
  readonly cooldown         = inject(CommentCooldownService);
  private readonly visited      = inject(VisitedPlacesService);
  private readonly sharedTrips  = inject(SharedTripsService);
  private readonly api          = inject(ApiService);
  readonly favorites            = inject(FavoritesService);

  logoClick    = output<void>();
  profileClick = output<void>();

  navQuery      = signal('');
  searchOpen    = signal(false);
  userMenuOpen  = signal(false);
  loginMode     = signal<'login' | 'register'>('login');
  loginName     = signal('');
  loginEmail    = signal('');
  loginPassword        = signal('');
  loginConfirmPassword = signal('');
  loginError           = signal('');
  loginErrorCode       = signal<string>('');
  authErrorContext     = signal<'login' | 'send-otp' | 'register' | ''>('');

  showPassword        = signal(false);
  showConfirmPassword = signal(false);

  plansOpen      = signal(false);
  planSearch     = signal('');
  savePlanOpen   = signal(false);
  savePlanName   = signal('');
  savePlanError  = signal('');
  deletingPlanId      = signal<string | null>(null);
  cloningConfirmPlanId = signal<string | null>(null);
  cloningPlanId       = signal<string | null>(null);
  clonedPlanId        = signal<string | null>(null);
  myTripsOpen    = signal(false);
  favoritesOpen  = signal(false);
  favoritesSearch = signal('');
  sharedTripsSearch = signal('');
  readonly buyKarmaOpen  = this.karmaModal.buyOpen;
  registerSuccessOpen    = signal(false);
  registerSuccessName    = signal('');
  karmaSuccessOpen    = signal(false);   // fullscreen celebration overlay
  karmaSuccessAmount  = signal(0);       // karma units added in last purchase
  karmaGainAnim       = signal(0);       // >0 while counter sparkle animation plays

  private karmaAnimTimer: ReturnType<typeof setTimeout> | null = null;

  captchaToken = signal('');
  otpStep        = signal(false);
  otpCode        = signal('');
  otpLoading     = signal(false);
  registerLoading = signal(false);

  readonly isEmailValid    = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.loginEmail().trim()));
  readonly passwordsMatch  = computed(() =>
    !this.loginConfirmPassword() || this.loginPassword() === this.loginConfirmPassword()
  );

  readonly passwordStrength = computed((): 'none' | 'vulnerable' | 'light' | 'strong' => {
    const p = this.loginPassword();
    if (!p) return 'none';
    let score = 0;
    if (p.length >= 8)          score++;
    if (/[A-Z]/.test(p))        score++;
    if (/[a-z]/.test(p))        score++;
    if (/\d/.test(p))           score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (p.length < 6)  return 'vulnerable';
    if (score <= 2)    return 'vulnerable';
    if (score === 3)   return 'light';
    return 'strong';
  });

  readonly strengthColor = computed((): string => {
    switch (this.passwordStrength()) {
      case 'vulnerable': return 'oklch(55% 0.22 25)';
      case 'light':      return 'oklch(62% 0.14 60)';
      case 'strong':     return 'oklch(50% 0.16 145)';
      default:           return 'var(--t3)';
    }
  });

  strengthBarActive(index: number): boolean {
    switch (this.passwordStrength()) {
      case 'vulnerable': return index === 0;
      case 'light':      return index <= 1;
      case 'strong':     return true;
      default:           return false;
    }
  }

  strengthLabel(): string {
    switch (this.passwordStrength()) {
      case 'vulnerable': return 'Vulnerable';
      case 'light':      return 'Moderada';
      case 'strong':     return 'Fuerte';
      default:           return '';
    }
  }

  private readonly turnstileWidgetId = signal<string | null>(null);
  private initAttempts = 0;

  constructor() {
    toObservable(this.navQuery).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q.trim()
        ? this.api.searchSharedTrips(q).pipe(catchError(() => of([])))
        : of([])),
      takeUntilDestroyed(),
    ).subscribe(trips => this.navSharedTrips.set(trips));

    effect(() => {
      if (this.authModal.isOpen()) {
        this.initAttempts = 0;
        setTimeout(() => this.renderTurnstile(), 0);
      } else {
        this.destroyTurnstile();
        this.otpStep.set(false);
        this.otpCode.set('');
        this.loginPassword.set('');
        this.loginConfirmPassword.set('');
        this.showPassword.set(false);
        this.showConfirmPassword.set(false);
        this.registerLoading.set(false);
        this.loginError.set('');
        this.loginErrorCode.set('');
        this.authErrorContext.set('');
      }
    }, { allowSignalWrites: true });
  }

  readonly mySharedTrips = computed(() => {
    return this.savedPlans.plans()
      .filter((p): p is SavedPlan & { shareId: string } => !!p.shareId)
      .map(p => ({ id: p.shareId, tripName: p.name, stops: p.stops }));
  });

  readonly filteredPlans = computed(() => {
    const q = this.planSearch().toLowerCase().trim();
    if (!q) return this.savedPlans.plans();
    return this.savedPlans.plans().filter(p => p.name.toLowerCase().includes(q));
  });

  readonly filteredFavorites = computed<FavoritedTrip[]>(() => {
    const q = this.favoritesSearch().toLowerCase().trim();
    if (!q) return this.favorites.favoritedTrips();
    return this.favorites.favoritedTrips().filter(t => t.tripName.toLowerCase().includes(q));
  });

  readonly filteredSharedTrips = computed(() => {
    const q = this.sharedTripsSearch().toLowerCase().trim();
    if (!q) return this.mySharedTrips();
    return this.mySharedTrips().filter(t => t.tripName.toLowerCase().includes(q));
  });

  navSharedTrips = signal<SharedTrip[]>([]);

  readonly navFiltered = computed(() => {
    const q = this.navQuery().toLowerCase();
    if (!q) return [];
    return WORLD_CITIES
      .filter(c => !this.trip.existingCityIds().includes(c.id) &&
        (c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)))
      .slice(0, 8);
  });

  readonly initials = computed(() => {
    const name = this.auth.currentUser()?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  });

  readonly activeTripName = computed(() => {
    const id = this.trip.loadedPlanId();
    if (!id) return null;
    return this.savedPlans.plans().find(p => p.id === id)?.name ?? null;
  });

  private autoSaveCurrentTrip(): void {
    const email     = this.auth.currentUser()?.email;
    const currentId = this.trip.loadedPlanId();
    if (!email || !currentId || this.trip.stops().length === 0) return;
    const name = this.savedPlans.plans().find(p => p.id === currentId)?.name;
    if (name) this.savedPlans.upsert(email, currentId, name, this.trip.stops(), this.trip.transits()).subscribe();
  }

  private renderTurnstile(): void {
    const container = document.getElementById('tb-turnstile');
    const ts = (window as any).turnstile;
    if (!container) return;
    if (!ts) {
      if (this.initAttempts < 15) {
        this.initAttempts++;
        setTimeout(() => this.renderTurnstile(), 200);
      }
      return;
    }
    if (this.turnstileWidgetId() !== null) return;
    const id: string = ts.render(container, {
      sitekey: environment.turnstileSiteKey,
      callback: (token: string) => this.captchaToken.set(token),
      'error-callback': () => this.captchaToken.set(''),
      'expired-callback': () => this.captchaToken.set(''),
      theme: 'light',
    });
    this.turnstileWidgetId.set(id);
  }

  private destroyTurnstile(): void {
    const id = this.turnstileWidgetId();
    const ts = (window as any).turnstile;
    if (id !== null && ts) ts.remove(id);
    this.turnstileWidgetId.set(null);
    this.captchaToken.set('');
  }

  private resetTurnstile(): void {
    const id = this.turnstileWidgetId();
    const ts = (window as any).turnstile;
    if (id !== null && ts) ts.reset(id);
    this.captchaToken.set('');
  }

  switchToRegister(): void {
    this.loginMode.set('register');
    this.loginError.set('');
    this.loginErrorCode.set('');
    this.authErrorContext.set('');
    this.otpStep.set(false);
    this.otpCode.set('');
    this.loginConfirmPassword.set('');
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  switchToLogin(): void {
    this.loginMode.set('login');
    this.loginError.set('');
    this.loginErrorCode.set('');
    this.authErrorContext.set('');
    this.otpStep.set(false);
    this.otpCode.set('');
    this.loginConfirmPassword.set('');
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  goBackFromOtp(): void {
    this.otpStep.set(false);
    this.otpCode.set('');
    this.loginError.set('');
    this.loginErrorCode.set('');
    this.authErrorContext.set('');
    setTimeout(() => this.renderTurnstile(), 0);
  }

  sendOtp(): void {
    if (!this.captchaToken()) {
      this.loginError.set('Por favor completa la verificación de seguridad');
      return;
    }
    this.otpLoading.set(true);
    this.loginError.set('');
    this.loginErrorCode.set('');
    this.authErrorContext.set('');
    this.auth.requestOtp(this.loginEmail()).subscribe({
      next: () => {
        this.otpStep.set(true);
        this.otpLoading.set(false);
        this.destroyTurnstile();
      },
      error: (err: unknown) => {
        this.loginErrorCode.set((err as any)?.code ?? 'UNKNOWN');
        this.authErrorContext.set('send-otp');
        this.otpLoading.set(false);
        this.resetTurnstile();
      },
    });
  }

  resendOtp(): void {
    this.otpLoading.set(true);
    this.loginError.set('');
    this.loginErrorCode.set('');
    this.authErrorContext.set('');
    this.auth.requestOtp(this.loginEmail()).subscribe({
      next: () => {
        this.otpLoading.set(false);
      },
      error: (err: unknown) => {
        this.loginErrorCode.set((err as any)?.code ?? 'UNKNOWN');
        this.authErrorContext.set('send-otp');
        this.otpLoading.set(false);
      },
    });
  }

  onOtpInput(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    this.otpCode.set(digits);
    if (digits.length === 6) {
      this.doAuth();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target !== event.currentTarget) return;
    if (this.loginMode() === 'register') return;
    this.authModal.close();
  }

  karmaIcon(): string {
    const k = this.karma.karma() ?? 0;
    if (k <= 0) return '💀';
    if (k <= 2) return '🌱';
    if (k <= 5) return '✨';
    return '🌟';
  }

  karmaPillStyle(): string {
    const k = this.karma.karma() ?? 0;
    if (k <= 0) return 'background:oklch(94% 0.06 25);color:oklch(45% 0.18 25)';
    if (k <= 2) return 'background:oklch(95% 0.08 75);color:oklch(50% 0.15 75)';
    if (k <= 5) return 'background:var(--lav);color:var(--lav-d)';
    return 'background:oklch(93% 0.10 145);color:oklch(42% 0.15 145)';
  }

  planDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
    if (!this.userMenuOpen()) {
      this.plansOpen.set(false);
      this.savePlanOpen.set(false);
      this.favoritesOpen.set(false);
    }
  }

  toggleFavorites(): void {
    this.favoritesOpen.update(v => !v);
    if (this.favoritesOpen()) {
      this.favorites.loadFavorites();
    } else {
      this.favoritesSearch.set('');
    }
  }

  togglePlans(): void {
    this.plansOpen.update(v => !v);
    if (!this.plansOpen()) {
      this.savePlanOpen.set(false);
      this.deletingPlanId.set(null);
      this.cloningConfirmPlanId.set(null);
      this.planSearch.set('');
    }
  }

  scheduleClose(): void { setTimeout(() => this.searchOpen.set(false), 160); }

  openProfile(): void {
    this.userMenuOpen.set(false);
    this.profileClick.emit();
  }

  openBuyKarma(): void {
    this.userMenuOpen.set(false);
    this.karmaModal.open();
  }

  /** Step 1 — called immediately after PayPal captures the payment. */
  onKarmaGained(amount: number): void {
    this.karmaModal.closeBuy();          // close the buy modal
    this.karmaSuccessAmount.set(amount);
    this.karmaSuccessOpen.set(true);     // show fullscreen celebration overlay
  }

  dismissRegisterSuccess(): void {
    this.registerSuccessOpen.set(false);
  }

  /** Step 2 — called when user dismisses the celebration overlay. */
  dismissKarmaSuccess(): void {
    this.karmaSuccessOpen.set(false);
    // Trigger the karma counter sparkle animation.
    // Reset to 0 first so Angular removes the badge node, giving CSS
    // a clean start even if the user somehow triggers this twice quickly.
    this.karmaGainAnim.set(0);
    if (this.karmaAnimTimer) clearTimeout(this.karmaAnimTimer);
    this.karmaAnimTimer = setTimeout(() => {
      this.karmaGainAnim.set(this.karmaSuccessAmount());
      this.karmaAnimTimer = setTimeout(() => this.karmaGainAnim.set(0), 2300);
    }, 20);
  }

  toggleMyTrips(): void {
    this.myTripsOpen.update(v => !v);
    if (!this.myTripsOpen()) this.sharedTripsSearch.set('');
  }
  openSharedTrip(id: string): void { window.location.href = `/?share=${id}`; }
  goToSharedTrip(id: string): void { window.location.href = `/?share=${id}`; }
  commentCount(tripId: string): number { return this.sharedTrips.getCommentCount(tripId); }

  quickAdd(city: City): void {
    this.trip.addStop(city, '', '');
    this.navQuery.set('');
    this.searchOpen.set(false);
  }

  openSaveForm(): void {
    const loaded = this.trip.loadedPlanId();
    if (loaded) {
      const current = this.savedPlans.plans().find(p => p.id === loaded);
      this.savePlanName.set(current?.name ?? '');
    } else {
      this.savePlanName.set('');
    }
    this.savePlanOpen.set(true);
  }

  doSavePlan(): void {
    const name = this.savePlanName().trim();
    if (!name) return;
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.savePlanError.set('');
    this.savedPlans.upsert(email, this.trip.loadedPlanId(), name, this.trip.stops(), this.trip.transits()).subscribe({
      next: newId => {
        this.trip.markAsLoadedPlan(newId);
        this.savePlanOpen.set(false);
        this.savePlanName.set('');
      },
      error: err => {
        if (this.karmaModal.handleKarmaError(err)) {
          this.savePlanOpen.set(false);
        }
      },
    });
  }

  doLoadPlan(plan: SavedPlan): void {
    this.autoSaveCurrentTrip();
    this.trip.restoreStops(plan.stops, plan.id, plan.transits ?? []);
    this.userMenuOpen.set(false);
    this.plansOpen.set(false);

    // If we're not already on the main page, flush state and navigate there
    if (window.location.search) {
      const email = this.auth.currentUser()?.email;
      if (email) this.trip.persistNow(email);
      window.location.href = '/';
    }
  }

  onLogoClick(): void {
    this.autoSaveCurrentTrip();          // persist changes if a named plan is loaded
    this.trip.restoreStops([], null);    // clear stops → welcome page shows automatically
    this.userMenuOpen.set(false);
    this.plansOpen.set(false);
    this.logoClick.emit();               // let AppComponent know (its handler is now a no-op)
  }

  doNewTrip(): void {
    this.autoSaveCurrentTrip();
    this.karma.spend();
    this.trip.restoreStops([], null);
    this.userMenuOpen.set(false);
    this.plansOpen.set(false);
  }

  doDeletePlan(id: string): void {
    this.deletingPlanId.set(id);
  }

  confirmDeletePlan(id: string): void {
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.savedPlans.remove(email, id);
    if (this.trip.loadedPlanId() === id) this.trip.markAsLoadedPlan(null);
    this.deletingPlanId.set(null);
  }

  confirmClonePlan(plan: SavedPlan): void {
    this.cloningConfirmPlanId.set(null);
    this.doClonePlan(plan);
  }

  doClonePlan(plan: SavedPlan): void {
    this.cloningPlanId.set(plan.id);
    this.api.cloneOwnTrip(plan.id).subscribe({
      next: cloned => {
        this.cloningPlanId.set(null);
        this.savedPlans.register({
          id:       cloned.id!,
          name:     cloned.title,
          savedAt:  cloned.createdAt ?? new Date().toISOString(),
          stops:    cloned.stops,
          transits: cloned.transits ?? [],
        });
        this.clonedPlanId.set(cloned.id!);
        setTimeout(() => this.clonedPlanId.set(null), 2000);
      },
      error: err => {
        this.cloningPlanId.set(null);
        this.karmaModal.handleKarmaError(err);
      },
    });
  }

  doAuth(): void {
    this.loginError.set('');
    this.loginErrorCode.set('');
    this.authErrorContext.set('');
    if (!this.otpStep() && !this.captchaToken()) {
      this.loginError.set('Por favor completa la verificación de seguridad');
      return;
    }
    if (this.loginMode() === 'login') {
      this.auth.login(this.loginEmail(), this.loginPassword()).subscribe({
        next: res => {
          this.trip.loadForUserPreservingAnonymous(res.user.email);
          this.karma.loadForUser(res.user.email);
          this.savedPlans.loadForUser(res.user.email);
          this.visited.loadForUser(res.user.email);
          this.loginEmail.set('');
          this.loginPassword.set('');
          this.loginConfirmPassword.set('');
          this.authModal.executePostLogin();
        },
        error: (err: unknown) => {
          this.loginErrorCode.set((err as any)?.code ?? 'UNKNOWN');
          this.authErrorContext.set('login');
          this.resetTurnstile();
        },
      });
    } else {
      this.registerLoading.set(true);
      this.auth.register(this.loginName(), this.loginEmail(), this.loginPassword(), this.otpCode()).subscribe({
        next: res => {
          this.registerLoading.set(false);
          this.trip.loadForUserPreservingAnonymous(res.user.email);
          this.karma.loadForUser(res.user.email);
          this.savedPlans.loadForUser(res.user.email);
          this.visited.loadForUser(res.user.email);
          this.registerSuccessName.set(res.user.name);
          this.loginName.set('');
          this.loginEmail.set('');
          this.loginPassword.set('');
          this.loginConfirmPassword.set('');
          this.otpCode.set('');
          this.otpStep.set(false);
          this.authModal.executePostLogin();
          this.registerSuccessOpen.set(true);
        },
        error: (err: unknown) => {
          this.registerLoading.set(false);
          this.loginErrorCode.set((err as any)?.code ?? 'UNKNOWN');
          this.authErrorContext.set('register');
        },
      });
    }
  }

  doLogout(): void {
    this.auth.logout();
    this.trip.clearPlan();
    this.karma.clear();
    this.savedPlans.clear();
    this.visited.clear();
    this.favorites.clear();
    window.location.href = '/';
  }
}
