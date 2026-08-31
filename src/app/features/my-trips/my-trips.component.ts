import { Component, computed, inject, signal, output, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TripService } from '../trip/trip.service';
import { SavedPlansService, SavedPlan } from '../../core/saved-plans/saved-plans.service';
import { FavoritesService } from '../../core/favorites/favorites.service';
import { FavoritedTrip, Collaborator } from '../../core/models/trip.model';
import { AiPlanHistoryItem, AiPlanViewPayload } from '../../core/models/ai.model';
import { SharedTripsService } from '../../core/shared-trips/shared-trips.service';
import { KarmaService } from '../../core/karma/karma.service';
import { KarmaModalService } from '../../core/karma/karma-modal.service';
import { ApiService } from '../../core/api/api.service';
import { AutoSaveService } from '../../core/saved-plans/auto-save.service';
import { NavFacadeService } from '../nav/nav-facade.service';
import { TripItineraryComponent } from '../profile/trip-itinerary.component';
import { ProfileComponent } from '../profile/profile.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { shareTrip, buildShareLink } from '../../core/share/share-url.util';
import { environment } from '../../../environments/environment';
import { normalizeSearch } from '../../core/utils/normalize-search.util';
import { buildItineraryExportMaps } from '../../core/utils/itinerary-export.util';
import { NavShellComponent } from '../nav/nav-shell.component';

@Component({
  selector: 'app-my-trips',
  imports: [TripItineraryComponent, ToastComponent, RouterLink, ProfileComponent, NavShellComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="profile-page">

      <app-nav (logoClick)="close.emit()" (profileClick)="showProfile.set(true)" />

      @if (showProfile()) {
        <app-profile (close)="showProfile.set(false)"
                     (openAiPlanning)="showProfile.set(false); openAiPlanning.emit()"
                     (openMyTrips)="showProfile.set(false)" />
      }

      <!-- Header bar -->
      <div class="prof-bar">
        <button class="back-btn" (click)="close.emit()" type="button" i18n="@@profile.backBtn">← Volver</button>
        <div class="prof-bar-title" i18n="@@myTrips.title">Mis viajes</div>
      </div>

      <div class="prof-body">

        <!-- Saved trips with itinerary -->
        <section>
          <div class="section-head" i18n="@@myTrips.savedTripsTitle">Viajes guardados 🗺️</div>
          @if (!auth.isLoggedIn()) {
            <div class="section-empty" i18n="@@myTrips.loginToViewTrips">Inicia sesión para ver tus viajes guardados.</div>
          } @else {
            <!-- Tab switcher -->
            <div class="profile-tabs">
              <button class="profile-tab" [class.active]="favTab() === 'trips'"
                      (click)="favTab.set('trips')"
                      i18n="@@profile.tabTrips">Mis viajes</button>
              <button class="profile-tab" [class.active]="favTab() === 'favorites'"
                      (click)="openFavTab()"
                      i18n="@@profile.tabFavorites">Mis favoritos</button>
              <button class="profile-tab" [class.active]="favTab() === 'collaborations'"
                      (click)="favTab.set('collaborations')"
                      i18n="@@myTrips.tabCollaborations">Colaborando en estos planes</button>
              @if (savedPlans.pendingInvites().length > 0) {
                <button class="profile-tab" [class.active]="favTab() === 'invites'"
                        (click)="favTab.set('invites')"
                        i18n="@@myTrips.tabInvites">Invitaciones pendientes ({{ savedPlans.pendingInvites().length }})</button>
              }
              <button class="profile-tab" [class.active]="favTab() === 'aiplans'"
                      (click)="openAiPlansTab()"
                      i18n="@@mytrips.tabAiPlans">Planes IA Pendientes</button>
            </div>

            @if (favTab() === 'trips') {
              @if (savedPlans.plans().length === 0) {
                <div class="section-empty" i18n="@@myTrips.noSavedTrips">Aún no tienes viajes guardados. Usa el botón "Guardar viaje 🎉" para guardar uno.</div>
              } @else {
                <div class="saved-plan-filter-row">
                  <input class="form-input"
                         type="search"
                         style="font-size:12px;padding:7px 10px"
                         i18n-placeholder="@@myTrips.searchPlaceholder"
                         placeholder="Buscar viaje guardado…"
                         [value]="planSearch()"
                         (input)="planSearch.set($any($event.target).value)" />
                  <label class="saved-plan-filter-check">
                    <input type="checkbox"
                           [checked]="publishedOnly()"
                           (change)="publishedOnly.set($any($event.target).checked)" />
                    <span i18n="@@myTrips.publishedFilter">Viaje publicado</span>
                  </label>
                </div>
                @for (plan of filteredPlans(); track plan.id) {
                  <div class="saved-plan-card">
                    <div class="saved-plan-header" (click)="togglePlan(plan.id)">
                      <div class="saved-plan-info">
                        <div class="saved-plan-name">
                          {{ plan.name }}
                          @if (planShareId(plan)) {
                            <span class="saved-plan-published" i18n="@@myTrips.publishedBadge">✓ Viaje Publicado</span>
                          }
                        </div>
                        <div class="saved-plan-meta">
                          @if (plan.stops.length === 1) {
                            <ng-container i18n="@@myTrips.cityCountOne">{{ plan.stops.length }} ciudad</ng-container>
                          } @else {
                            <ng-container i18n="@@myTrips.cityCountMany">{{ plan.stops.length }} ciudades</ng-container>
                          }
                          · {{ fmtDate(plan.savedAt) }}
                        </div>
                      </div>
                      <div style="display:flex;align-items:center;gap:4px;margin-left:auto">
                        <button class="saved-plan-act-btn"
                                [disabled]="cloningId() === plan.id"
                                (click)="$event.stopPropagation(); confirmCloneId.set(plan.id)"
                                i18n-title="@@myTrips.duplicateTitle" title="Duplicar viaje">
                          {{ cloningId() === plan.id ? '⏳' : '📋' }} <span i18n="@@myTrips.cloneBtn">Duplicar</span>
                        </button>
                        <button class="saved-plan-act-btn"
                                (click)="$event.stopPropagation(); confirmDeleteId.set(plan.id)"
                                i18n-title="@@myTrips.deleteTitle" title="Eliminar viaje">
                          🗑️ <span i18n="@@myTrips.deleteBtn">Eliminar</span>
                        </button>
                        <span class="saved-plan-chevron">{{ selectedPlanId() === plan.id ? '▲' : '▼' }}</span>
                      </div>
                    </div>

                    @if (selectedPlanId() === plan.id) {
                      <div class="saved-plan-actions">
                        <button class="btn-pill btn-primary"
                                style="flex:1;justify-content:center;gap:7px"
                                (click)="loadAndModify(plan)" type="button"
                                i18n="@@myTrips.modifyPlanBtn">
                          ✏️ Modificar mi plan
                        </button>
                        @if (planShareId(plan)) {
                          <button class="btn-pill btn-ghost"
                                  style="justify-content:center;gap:7px"
                                  (click)="sharePlan(plan)" type="button"
                                  i18n="@@myTrips.viewPublishedBtn">
                            🔗 Ver viaje publicado
                          </button>
                          <button class="btn-pill btn-outline"
                                  style="justify-content:center;gap:6px"
                                  (click)="shareNative(plan)" type="button"
                                  i18n="@@share.shareBtn">📤 Compartir</button>
                        } @else {
                          <button class="btn-pill btn-outline"
                                  style="justify-content:center;gap:6px"
                                  (click)="sharePlan(plan)" type="button"
                                  i18n="@@myTrips.publishBtn">
                            📤 Publicar
                          </button>
                        }
                        <button class="btn-pill btn-outline"
                                style="justify-content:center;gap:6px;white-space:nowrap"
                                [disabled]="exportingPlanId() === plan.id"
                                (click)="downloadItinerary(plan)" type="button">
                          {{ exportingPlanId() === plan.id ? '⏳' : '📥' }} Excel
                          @if (!plan.exportedAt) {
                            <span class="karma-cost">−1 ✨ karma</span>
                          }
                        </button>
                        @if (shareError() === plan.id) {
                          <span class="share-error" i18n="@@myTrips.insufficientKarma">Karma insuficiente</span>
                        }
                      </div>
                    }

                    @if (selectedPlanId() === plan.id) {
                      <div class="fav-card" style="margin:0 16px 12px;padding:14px 16px">
                        <div style="font-size:12px;font-weight:600;color:var(--t2);margin-bottom:8px" i18n="@@myTrips.collaboratorsTitle">🤝 Colaboradores</div>
                        @for (c of (collaboratorsByPlan()[plan.id] ?? []); track c.userId) {
                          <div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px">
                            <span style="flex:1">{{ c.name }} ({{ c.email }})</span>
                            <span style="color:var(--t3)">{{ c.acceptedAt ? '✓' : '⏳' }}</span>
                            <button class="att-plan-del" (click)="removeCollaborator(plan.id, c.userId)" type="button">✕</button>
                          </div>
                        }
                        <div style="display:flex;gap:6px;margin-top:8px">
                          <input class="form-input"
                                 style="font-size:11px;padding:5px 8px;flex:1"
                                 type="email"
                                 [value]="inviteEmailByPlan()[plan.id] ?? ''"
                                 (input)="setInviteEmail(plan.id, $any($event.target).value)"
                                 i18n-placeholder="@@myTrips.invitePlaceholder"
                                 placeholder="Correo del colaborador" />
                          <button class="btn-pill btn-outline"
                                  style="font-size:11px;padding:5px 10px;white-space:nowrap"
                                  [disabled]="invitingPlanId() === plan.id || !isEmailFormatValid(inviteEmailByPlan()[plan.id] ?? '')"
                                  (click)="inviteCollaborator(plan.id)" type="button">
                            {{ invitingPlanId() === plan.id ? '⏳' : '+ Invitar' }}
                          </button>
                        </div>
                      </div>
                    }

                    @if (selectedPlanId() === plan.id) {
                      <div class="saved-plan-itin">
                        <app-trip-itinerary [stops]="plan.stops" [transits]="plan.transits ?? []" />
                      </div>
                    }
                  </div>
                }
                @if (filteredPlans().length === 0) {
                  <div class="section-empty" i18n="@@myTrips.noResults">Sin resultados para "{{ planSearch() }}" 🔍</div>
                }
              }
            }

            @if (favTab() === 'favorites') {
              @if (favorites.loading()) {
                <div class="fav-loading" i18n="@@profile.favLoading">Cargando favoritos…</div>
              } @else if (favorites.favoritedTrips().length === 0) {
                <div class="fav-empty">
                  <span class="fav-empty-icon">🤍</span>
                  <p i18n="@@profile.favEmpty">Todavía no guardaste ningún plan como favorito.</p>
                  <p i18n="@@profile.favEmptyHint">Explorá planes compartidos y presioná ❤️ para guardarlos aquí.</p>
                </div>
              } @else {
                <div class="fav-list">
                  @for (trip of favorites.favoritedTrips(); track trip.shareId) {
                    <div class="fav-card">
                      <div class="fav-card-header">
                        <span class="fav-card-name">{{ trip.tripName }}</span>
                        <span class="fav-card-owner" i18n="@@profile.favCardBy">por {{ trip.ownerName }}</span>
                      </div>
                      <div class="fav-card-meta">
                        <span class="fav-card-count">❤️ {{ trip.favoriteCount }}</span>
                        <span class="fav-card-date">{{ fmtDate(trip.favoritedAt) }}</span>
                      </div>
                      <div class="fav-card-actions">
                        <a class="btn-pill btn-outline" [routerLink]="['/shared', trip.shareId]"
                           i18n="@@profile.favCardOpen">Ver plan</a>
                        <button class="btn-pill btn-ghost fav-remove-btn"
                                (click)="removeFavorite(trip)"
                                i18n="@@profile.favCardRemove">Quitar de favoritos</button>
                      </div>
                    </div>
                  }
                </div>
              }
            }

            @if (favTab() === 'collaborations') {
              @if (collaborationPlans().length === 0) {
                <div class="fav-empty">
                  <span class="fav-empty-icon">🤝</span>
                  <p i18n="@@myTrips.collabEmpty">Todavía no colaboras en ningún viaje.</p>
                </div>
              } @else {
                <div class="fav-list">
                  @for (plan of collaborationPlans(); track plan.id) {
                    <div class="fav-card">
                      <div class="fav-card-header">
                        <span class="fav-card-name">{{ plan.name }}</span>
                        <span class="fav-card-owner" i18n="@@myTrips.collabWith">Colaborando con {{ plan.ownerName }}</span>
                      </div>
                      <div class="fav-card-meta">
                        @if (plan.stops.length === 1) {
                          <ng-container i18n="@@myTrips.cityCountOne">{{ plan.stops.length }} ciudad</ng-container>
                        } @else {
                          <ng-container i18n="@@myTrips.cityCountMany">{{ plan.stops.length }} ciudades</ng-container>
                        }
                      </div>
                      <div class="fav-card-actions">
                        <button class="btn-pill btn-outline" (click)="loadAndModify(plan)" type="button" i18n="@@myTrips.modifyPlanBtn">✏️ Modificar mi plan</button>
                      </div>
                    </div>
                  }
                </div>
              }
            }

            @if (favTab() === 'invites') {
              <div class="fav-list">
                @for (invite of savedPlans.pendingInvites(); track invite.tripId) {
                  <div class="fav-card">
                    <div class="fav-card-header">
                      <span class="fav-card-name">{{ invite.tripTitle }}</span>
                      <span class="fav-card-owner" i18n="@@profile.favCardBy">por {{ invite.ownerName }}</span>
                    </div>
                    <div class="fav-card-actions">
                      <button class="btn-pill btn-primary"
                              [disabled]="acceptingTripId() === invite.tripId"
                              (click)="acceptInvite(invite.tripId)" type="button">
                        {{ acceptingTripId() === invite.tripId ? '⏳' : '✓' }} <ng-container i18n="@@myTrips.acceptInviteBtn">Aceptar</ng-container>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            @if (favTab() === 'aiplans') {
              <div class="fav-list">
                @if (aiPlanHistoryLoading()) {
                  <div class="fav-empty" i18n="@@mytrips.aiPlansLoading">Cargando tus planes…</div>
                } @else if (aiPlanHistory().length === 0) {
                  <div class="fav-empty" i18n="@@mytrips.aiPlansEmpty">Aún no tienes planes de IA pendientes.</div>
                } @else {
                  @for (item of aiPlanHistory(); track item.requestId) {
                    <div class="fav-card aiplan-card"
                         [class.aiplan-card-failed]="item.status === 'failed'"
                         [class.aiplan-card-clickable]="item.status === 'completed'"
                         [attr.role]="item.status === 'completed' ? 'button' : null"
                         [attr.tabindex]="item.status === 'completed' ? 0 : null"
                         (click)="openAiPlanResult(item)"
                         (keydown.enter)="openAiPlanResult(item)"
                         (keydown.space)="$event.preventDefault(); openAiPlanResult(item)">
                      @if (item.status === 'completed') {
                        <div class="aiplan-card-title">{{ item.result?.title }}</div>
                        <div class="aiplan-card-meta" i18n="@@mytrips.aiPlanBasedOn">Basado en: {{ item.requestParams.selectedOption.title }}</div>
                        <div class="aiplan-card-hint" i18n="@@mytrips.aiPlanViewHint">Ver plan →</div>
                      } @else {
                        <div class="aiplan-card-title" i18n="@@mytrips.aiPlanFailedTitle">No se pudo generar</div>
                        <div class="aiplan-card-meta">{{ item.requestParams.selectedOption.title }}</div>
                        @if (item.karmaCharged > 0) {
                          <div class="aiplan-card-refund" i18n="@@mytrips.aiPlanRefunded">Karma reembolsado</div>
                        }
                      }
                      <button class="btn-pill btn-outline aiplan-card-discard-btn"
                              [disabled]="discardingRequestId() === item.requestId"
                              (click)="$event.stopPropagation(); discardAiPlan(item)" type="button"
                              i18n="@@mytrips.aiPlanDiscardBtn">🗑️ Descartar</button>
                      <div class="aiplan-card-date">{{ item.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
                    </div>
                  }
                }
              </div>
            }
          }
        </section>

        <!-- Also link to AI planning -->
        <section>
          <div style="padding:0 0 8px">
            <button class="btn-pill btn-outline" style="font-size:12px;padding:5px 14px"
                    (click)="openAiPlanning.emit()" type="button"
                    i18n="@@profile.aiBtn">✨ Nuevo viaje con IA</button>
          </div>
        </section>

      </div>
    </div>

    @if (toast()) {
      <app-toast [message]="toast()!" (done)="toast.set(null)" />
    }

    <!-- Clone confirmation modal -->
    @if (confirmCloneId()) {
      <div class="modal-backdrop" (click)="confirmCloneId.set(null)">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width:340px">
          <div class="modal-head" style="background:linear-gradient(135deg,var(--lav),var(--peach))">
            <div class="modal-title" i18n="@@myTrips.cloneModalTitle">📋 Duplicar viaje</div>
            <div class="modal-sub">{{ planName(confirmCloneId()!) }}</div>
          </div>
          <div class="modal-body" style="padding:20px 24px">
            <p style="font-size:13px;color:var(--t2);margin:0;line-height:1.6" i18n="@@myTrips.cloneModalBody">
              Se creará una copia de este viaje en tu lista de guardados.<br>
              Costo: <strong>−1 ✨ karma</strong>.
            </p>
          </div>
          <div class="modal-foot" style="gap:8px">
            <button class="btn-pill btn-outline" style="flex:1" (click)="confirmCloneId.set(null)" type="button" i18n="@@myTrips.cancelBtn">Cancelar</button>
            <button class="btn-pill btn-primary" style="flex:1" (click)="confirmClonePlan()" type="button" i18n="@@myTrips.cloneConfirmBtn">📋 Duplicar</button>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirmation modal -->
    @if (confirmDeleteId()) {
      <div class="modal-backdrop" (click)="confirmDeleteId.set(null)">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width:340px">
          <div class="modal-head" style="background:linear-gradient(135deg,oklch(58% 0.2 25),oklch(46% 0.16 25))">
            <div class="modal-title" i18n="@@myTrips.deleteModalTitle">🗑️ Eliminar viaje</div>
            <div class="modal-sub" i18n="@@myTrips.deleteModalSub">Esta acción no se puede deshacer</div>
          </div>
          <div class="modal-body" style="padding:20px 24px">
            <p style="font-size:13px;color:var(--t2);margin:0;line-height:1.6" i18n="@@myTrips.deleteModalBody">
              ¿Eliminar <strong>"{{ planName(confirmDeleteId()!) }}"</strong>?<br>
              Perderás este viaje permanentemente.
            </p>
          </div>
          <div class="modal-foot" style="gap:8px">
            <button class="btn-pill btn-outline" style="flex:1" (click)="confirmDeleteId.set(null)" type="button" i18n="@@myTrips.cancelBtn">Cancelar</button>
            <button class="btn-pill btn-primary" style="flex:1;background:oklch(48% 0.18 25);border-color:oklch(48% 0.18 25)"
                    (click)="confirmDeletePlan()" type="button" i18n="@@myTrips.deleteConfirmBtn">🗑️ Eliminar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class MyTripsComponent {
  readonly auth       = inject(AuthService);
  readonly trip       = inject(TripService);
  readonly savedPlans = inject(SavedPlansService);
  readonly favorites  = inject(FavoritesService);
  private readonly sharedTrips = inject(SharedTripsService);
  private readonly karma       = inject(KarmaService);
  private readonly karmaModal  = inject(KarmaModalService);
  private readonly api         = inject(ApiService);
  private readonly router      = inject(Router);
  protected readonly autoSave  = inject(AutoSaveService);
  private readonly facade      = inject(NavFacadeService);

  close          = output<void>();
  openAiPlanning = output<void>();
  /** A completed "Planes IA Pendientes" card was clicked — parent opens AiPlanningComponent straight onto Step 3 with this plan + its slideshow auto-playing. */
  viewAiPlan     = output<AiPlanViewPayload>();

  showProfile = signal(false);

  // ── Favorites tab ──
  favTab = signal<'trips' | 'favorites' | 'collaborations' | 'invites' | 'aiplans'>('trips');
  aiPlanHistory = signal<AiPlanHistoryItem[]>([]);
  aiPlanHistoryLoading = signal(false);
  discardingRequestId = signal<string | null>(null);

  constructor() {
    // One-shot: a notification click (e.g. collaborator invite/accept, AI plan
    // ready/failed) can request opening straight onto a specific tab. Consume
    // + clear so a later plain "Mis viajes" open doesn't inherit a stale tab.
    const pendingTab = this.facade.pendingMyTripsTab();
    if (pendingTab) {
      this.favTab.set(pendingTab);
      this.facade.pendingMyTripsTab.set(null);
      if (pendingTab === 'aiplans') this.loadAiPlanHistory();
    }
  }

  openFavTab(): void {
    this.favTab.set('favorites');
    this.favorites.loadFavorites();
  }

  openAiPlansTab(): void {
    this.favTab.set('aiplans');
    this.loadAiPlanHistory();
  }

  private loadAiPlanHistory(): void {
    this.aiPlanHistoryLoading.set(true);
    this.api.getAiPlanHistory().subscribe({
      next: items => { this.aiPlanHistory.set(items); this.aiPlanHistoryLoading.set(false); },
      error: () => { this.aiPlanHistoryLoading.set(false); },
    });
  }

  /** Only completed rows carry a `result` to revisit — failed rows are inert (their only action is "Descartar", see discardAiPlan()). */
  openAiPlanResult(item: AiPlanHistoryItem): void {
    if (item.status === 'completed' && item.result) {
      this.viewAiPlan.emit({ result: item.result, requestId: item.requestId, requestParams: item.requestParams });
    }
  }

  /** "Descartar" on any card, completed or failed — a row only ever leaves "Planes IA Pendientes" via an explicit save() in AiPlanningComponent or this manual discard, never as a side effect of viewing/regenerating a plan (Post-Implementation Rework, 2026-08-28). Removes it from the local list on success rather than re-fetching the whole history. */
  discardAiPlan(item: AiPlanHistoryItem): void {
    this.discardingRequestId.set(item.requestId);
    this.api.deleteAiPlanHistoryItem(item.requestId).subscribe({
      next: () => {
        this.aiPlanHistory.update(items => items.filter(i => i.requestId !== item.requestId));
        this.discardingRequestId.set(null);
      },
      error: () => { this.discardingRequestId.set(null); },
    });
  }

  removeFavorite(trip: FavoritedTrip): void {
    this.favorites.toggle(trip.shareId, () => {}, () => {});
  }

  // ── Saved plans ──
  selectedPlanId  = signal<string | null>(null);
  planSearch      = signal('');
  publishedOnly   = signal(false);
  shareError      = signal<string | null>(null);
  exportingPlanId = signal<string | null>(null);
  toast           = signal<string | null>(null);
  confirmCloneId  = signal<string | null>(null);
  confirmDeleteId = signal<string | null>(null);
  cloningId       = signal<string | null>(null);

  inviteEmailByPlan = signal<Record<string, string>>({});
  invitingPlanId    = signal<string | null>(null);
  collaboratorsByPlan = signal<Record<string, Collaborator[]>>({});
  acceptingTripId   = signal<string | null>(null);

  readonly filteredPlans = computed(() => {
    const q = normalizeSearch(this.planSearch().trim());
    let plans = this.savedPlans.plans().filter(p => !p.isCollaborator);
    if (this.publishedOnly()) plans = plans.filter(p => !!this.planShareId(p));
    if (!q) return plans;
    return plans.filter(p => normalizeSearch(p.name).includes(q));
  });

  readonly collaborationPlans = computed(() => this.savedPlans.plans().filter(p => p.isCollaborator));

  planShareId(plan: SavedPlan): string | undefined {
    if (plan.shareId) return plan.shareId;
    const email = this.auth.currentUser()?.email;
    if (!email) return undefined;
    return this.sharedTrips.getMyTrips(email).find(t => t.planId === plan.id)?.id;
  }

  sharePlan(plan: SavedPlan): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const existingShareId = this.planShareId(plan);
    if (existingShareId) { this.copyLink(existingShareId, plan.id); return; }

    if (environment.useMocks) {
      const shareId = this.sharedTrips.createShare({
        ownerEmail: user.email, ownerName: user.name, tripName: plan.name,
        stops: plan.stops, transits: plan.transits ?? [], planId: plan.id,
      });
      this.savedPlans.setShareId(user.email, plan.id, shareId);
      this.copyLink(shareId, plan.id);
    } else {
      this.api.shareTrip(plan.id).subscribe({
        next: ({ shareId }) => {
          this.savedPlans.setShareId(user.email, plan.id, shareId);
          this.copyLink(shareId, plan.id);
        },
        error: err => { this.karmaModal.handleKarmaError(err); },
      });
    }
  }

  shareNative(plan: SavedPlan): void {
    const sid = this.planShareId(plan);
    if (sid) void shareTrip(plan.name, sid);
  }

  downloadItinerary(plan: SavedPlan): void {
    if (environment.useMocks) {
      if (!plan.exportedAt && (this.karma.karma() ?? 0) < 1) {
        this.karmaModal.openInsufficient(1, this.karma.karma() ?? 0);
        return;
      }
      const user = this.auth.currentUser();
      if (!plan.exportedAt && user) {
        this.karma.spend();
        this.savedPlans.markExported(user.email, plan.id);
      }
      this.toast.set($localize`:@@myTrips.excelNeedsBackend:La exportación Excel requiere el backend activo`);
      return;
    }

    const { cityNames, attractionNames, ticketRequiredIds } = buildItineraryExportMaps(plan.stops);

    this.exportingPlanId.set(plan.id);
    this.api.exportItinerary(plan.id, cityNames, attractionNames, ticketRequiredIds).subscribe({
      next: (blob) => {
        const slug = plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `itinerario-${slug}.xlsx`; a.click();
        URL.revokeObjectURL(url);
        this.exportingPlanId.set(null);
        this.toast.set($localize`:@@myTrips.itineraryDownloaded:Itinerario descargado`);
        if (!plan.exportedAt) {
          const user = this.auth.currentUser();
          if (user) { this.karma.spend(); this.savedPlans.markExported(user.email, plan.id); }
        }
      },
      error: (err) => {
        this.exportingPlanId.set(null);
        if (!this.karmaModal.handleKarmaError(err)) this.toast.set($localize`:@@myTrips.itineraryDownloadError:Error al descargar el itinerario`);
      },
    });
  }

  private copyLink(shareId: string, _planId: string): void {
    // Clipboard needs a real absolute URL (it leaves the app); the follow-up
    // "view it" navigation stays in-app via the Router so the in-memory
    // access token survives instead of a full reload blanking it.
    navigator.clipboard.writeText(buildShareLink(shareId)).catch(() => {});
    this.router.navigate(['/shared', shareId]);
  }

  togglePlan(id: string): void {
    this.selectedPlanId.update(cur => cur === id ? null : id);
    if (this.selectedPlanId() === id && !this.collaboratorsByPlan()[id]) {
      this.api.getCollaborators(id).subscribe(list => {
        this.collaboratorsByPlan.update(m => ({ ...m, [id]: list }));
      });
    }
  }

  setInviteEmail(planId: string, value: string): void {
    this.inviteEmailByPlan.update(m => ({ ...m, [planId]: value }));
  }

  // Same pattern as AuthModalComponent.isEmailValid — client-side format check only,
  // so an obviously malformed address never round-trips to the backend's zod validation.
  isEmailFormatValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  inviteCollaborator(planId: string): void {
    const email = (this.inviteEmailByPlan()[planId] ?? '').trim();
    if (!this.isEmailFormatValid(email)) return;
    this.invitingPlanId.set(planId);
    this.api.inviteCollaborator(planId, email).subscribe({
      next: (collaborator) => {
        this.invitingPlanId.set(null);
        this.setInviteEmail(planId, '');
        this.collaboratorsByPlan.update(m => ({ ...m, [planId]: [...(m[planId] ?? []), collaborator] }));
        this.toast.set($localize`:@@myTrips.inviteSentToast:Invitación enviada`);
      },
      error: (err) => {
        this.invitingPlanId.set(null);
        if (!this.karmaModal.handleKarmaError(err)) {
          this.toast.set($localize`:@@myTrips.inviteErrorToast:No se pudo enviar la invitación`);
        }
      },
    });
  }

  removeCollaborator(planId: string, userId: string): void {
    this.api.removeCollaborator(planId, userId).subscribe(() => {
      this.collaboratorsByPlan.update(m => ({ ...m, [planId]: (m[planId] ?? []).filter(c => c.userId !== userId) }));
    });
  }

  acceptInvite(tripId: string): void {
    this.acceptingTripId.set(tripId);
    this.api.acceptCollaboratorInvite(tripId).subscribe({
      next: () => {
        this.acceptingTripId.set(null);
        this.savedPlans.loadForUser(this.auth.currentUser()!.email);
        this.toast.set($localize`:@@myTrips.inviteAcceptedToast:¡Ahora colaboras en este viaje!`);
        this.favTab.set('collaborations');
      },
      error: () => { this.acceptingTripId.set(null); },
    });
  }

  loadAndModify(plan: SavedPlan): void {
    const owner = plan.isCollaborator ? { name: plan.ownerName!, email: plan.ownerEmail! } : null;
    this.trip.restoreStops(plan.stops, plan.id, plan.transits ?? [], owner);
    if (plan.stops.length > 0) this.trip.setActive(plan.stops[0].stopId);
    this.autoSave.commitSnapshot(plan.id);
    // Collaborative plans default to auto-save off — tell the user up front, right as they
    // enter, instead of waiting for the first tick to discover an unsaved change.
    if (owner && !this.autoSave.enabled()) this.autoSave.showReminderNow();
    this.close.emit();
  }

  planName(id: string): string {
    return this.savedPlans.plans().find(p => p.id === id)?.name ?? '';
  }

  confirmClonePlan(): void {
    const id = this.confirmCloneId();
    if (!id) return;
    this.confirmCloneId.set(null);
    this.cloningId.set(id);
    this.api.cloneOwnTrip(id).subscribe({
      next: cloned => {
        this.cloningId.set(null);
        this.savedPlans.register({
          id: cloned.id!, name: cloned.title,
          savedAt: cloned.createdAt ?? new Date().toISOString(),
          stops: cloned.stops, transits: cloned.transits ?? [],
        });
        this.toast.set($localize`:@@myTrips.cloneSavedToast:"${cloned.title}" guardado`);
      },
      error: err => { this.cloningId.set(null); this.karmaModal.handleKarmaError(err); },
    });
  }

  confirmDeletePlan(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.savedPlans.remove(email, id);
    if (this.selectedPlanId() === id) this.selectedPlanId.set(null);
    this.confirmDeleteId.set(null);
  }

  fmtDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return iso; }
  }
}
