import { Component, computed, inject, signal, output } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { TripService } from '../trip/trip.service';
import { SavedPlansService, SavedPlan } from '../../core/saved-plans/saved-plans.service';
import { HomeAddressService } from '../../core/home-address/home-address.service';
import { SharedTripsService } from '../../core/shared-trips/shared-trips.service';
import { KarmaService } from '../../core/karma/karma.service';
import { KarmaModalService } from '../../core/karma/karma-modal.service';
import { VisitedPlacesService } from '../../core/visited-places/visited-places.service';
import { ApiService } from '../../core/api/api.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';
import { TripItineraryComponent } from './trip-itinerary.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [TripItineraryComponent, ToastComponent],
  template: `
    <div class="profile-page">

      <!-- Header bar -->
      <div class="prof-bar">
        <button class="back-btn" (click)="close.emit()" type="button">← Volver</button>
        <div class="prof-bar-title">Mi Perfil</div>
      </div>

      <!-- Scrollable body -->
      <div class="prof-body">

        <!-- Hero -->
        <div class="prof-hero">
          <div class="prof-av">{{ initials() }}</div>
          <div>
            <div class="prof-name">{{ auth.currentUser()?.name }}</div>
            <div class="prof-email">{{ auth.currentUser()?.email }}</div>
          </div>
        </div>

        <!-- Home address -->
        @if (auth.isLoggedIn()) {
          <div class="home-address-row">
            <span class="home-address-icon">🏠</span>
            @if (editingHome()) {
              <input class="form-input home-address-input"
                     [value]="homeInput()"
                     (input)="homeInput.set($any($event.target).value)"
                     placeholder="Ciudad o dirección de inicio…"
                     (keydown.enter)="saveHome()"
                     (keydown.escape)="editingHome.set(false)" />
              <button class="btn-pill btn-primary" style="padding:4px 12px;font-size:11px"
                      (click)="saveHome()">✓</button>
              <button class="btn-pill btn-outline" style="padding:4px 8px;font-size:11px"
                      (click)="editingHome.set(false)">✕</button>
            } @else {
              <span class="home-address-label"
                    (click)="openHomeEdit()">
                {{ homeAddress.address() || 'Agrega tu ciudad de origen…' }}
              </span>
              <button class="home-address-edit" (click)="openHomeEdit()" type="button">✏️</button>
            }
          </div>
        }

        <!-- Edit account accordion -->
        <section>
          <div class="section-head">Editar cuenta ✏️</div>
          @if (editError()) {
            <div class="profile-error" style="margin:0 0 10px">{{ editError() }}</div>
          }
          <div style="border:1px solid var(--border);border-radius:14px;overflow:hidden;background:#fff">

            <!-- Name -->
            <button class="profile-accordion-hd" (click)="toggleEditSection('name')" type="button">
              <span style="font-size:17px">👤</span>
              <div style="flex:1;text-align:left">
                <div class="profile-accordion-title">Nombre</div>
                @if (editSection() !== 'name') {
                  <div class="profile-accordion-sub">{{ auth.currentUser()?.name }}</div>
                }
              </div>
              @if (editSavedTab() === 'name') {
                <span class="profile-accordion-check">✓</span>
              } @else {
                <span class="profile-accordion-chevron">{{ editSection() === 'name' ? '▴' : '▾' }}</span>
              }
            </button>
            @if (editSection() === 'name') {
              <div class="profile-accordion-bd">
                <div class="form-group" style="margin-bottom:14px">
                  <label class="form-label">Nombre para mostrar</label>
                  <input class="form-input" placeholder="Tu nombre"
                         [value]="editDisplayName()"
                         (input)="editDisplayName.set($any($event.target).value)" />
                </div>
                <button class="btn-pill btn-primary" style="width:100%;justify-content:center"
                        (click)="editSaveName()" [disabled]="editLoading()"
                        [style.opacity]="editLoading() ? '0.5' : '1'"
                        [style.background]="editSavedTab() === 'name' ? 'oklch(50% 0.16 145)' : ''"
                        [style.border-color]="editSavedTab() === 'name' ? 'oklch(50% 0.16 145)' : ''">
                  @if (editLoading()) {
                    <span class="btn-spinner"></span> Guardando…
                  } @else if (editSavedTab() === 'name') {
                    ✓ Guardado
                  } @else {
                    Guardar nombre
                  }
                </button>
              </div>
            }

            <div class="profile-accordion-sep"></div>

            <!-- Email -->
            <button class="profile-accordion-hd" (click)="toggleEditSection('email')" type="button">
              <span style="font-size:17px">✉️</span>
              <div style="flex:1;text-align:left">
                <div class="profile-accordion-title">Correo electrónico</div>
                @if (editSection() !== 'email') {
                  <div class="profile-accordion-sub">{{ auth.currentUser()?.email }}</div>
                }
              </div>
              @if (editSavedTab() === 'email') {
                <span class="profile-accordion-check">✓</span>
              } @else {
                <span class="profile-accordion-chevron">{{ editSection() === 'email' ? '▴' : '▾' }}</span>
              }
            </button>
            @if (editSection() === 'email') {
              <div class="profile-accordion-bd">
                @if (!editEmailOtpSent()) {
                  <div class="form-group" style="margin-bottom:14px">
                    <label class="form-label">Nueva dirección de correo</label>
                    <input class="form-input" type="email" placeholder="nuevo@correo.com"
                           [value]="editNewEmail()"
                           (input)="editNewEmail.set($any($event.target).value)" />
                  </div>
                  <button class="btn-pill btn-primary" style="width:100%;justify-content:center"
                          (click)="editRequestOtp()"
                          [disabled]="editLoading() || (editSavedTab() !== 'email-otp' && !editNewEmail())"
                          [style.opacity]="editLoading() ? '0.5' : (editSavedTab() !== 'email-otp' && !editNewEmail()) ? '0.5' : '1'"
                          [style.background]="editSavedTab() === 'email-otp' ? 'oklch(50% 0.16 145)' : ''"
                          [style.border-color]="editSavedTab() === 'email-otp' ? 'oklch(50% 0.16 145)' : ''">
                    @if (editLoading()) {
                      <span class="btn-spinner"></span> Enviando…
                    } @else if (editSavedTab() === 'email-otp') {
                      ✓ Enviado
                    } @else {
                      Enviar código →
                    }
                  </button>
                } @else {
                  <div style="text-align:center;padding:4px 0 12px">
                    <div style="font-size:28px">📧</div>
                    <div style="font-size:13px;font-weight:600;color:var(--t1);margin-top:6px">Revisa tu correo</div>
                    <div style="font-size:12px;color:var(--t3);margin-top:3px">
                      Código enviado a <strong>{{ editNewEmail() }}</strong>
                    </div>
                  </div>
                  <div class="form-group" style="margin-bottom:4px">
                    <label class="form-label">Código de verificación</label>
                    <input class="form-input" type="text" inputmode="numeric" maxlength="6" placeholder="000000"
                           [value]="editEmailOtp()"
                           (input)="editEmailOtp.set($any($event.target).value)" />
                  </div>
                  <div style="display:flex;justify-content:space-between;margin-bottom:14px;font-size:11px">
                    <span style="color:var(--lav-d);cursor:pointer" (click)="editEmailOtpSent.set(false)">← Cambiar correo</span>
                    <span style="color:var(--lav-d);cursor:pointer" (click)="editRequestOtp()">Reenviar código</span>
                  </div>
                  <button class="btn-pill btn-primary" style="width:100%;justify-content:center"
                          (click)="editUpdateEmail()"
                          [disabled]="editLoading() || (editSavedTab() !== 'email' && editEmailOtp().length < 6)"
                          [style.opacity]="editLoading() ? '0.5' : (editSavedTab() !== 'email' && editEmailOtp().length < 6) ? '0.5' : '1'"
                          [style.background]="editSavedTab() === 'email' ? 'oklch(50% 0.16 145)' : ''"
                          [style.border-color]="editSavedTab() === 'email' ? 'oklch(50% 0.16 145)' : ''">
                    @if (editLoading()) {
                      <span class="btn-spinner"></span> Verificando…
                    } @else if (editSavedTab() === 'email') {
                      ✓ Actualizado
                    } @else {
                      Actualizar correo →
                    }
                  </button>
                }
              </div>
            }

            <div class="profile-accordion-sep"></div>

            <!-- Password -->
            <button class="profile-accordion-hd" (click)="toggleEditSection('password')" type="button">
              <span style="font-size:17px">🔒</span>
              <div style="flex:1;text-align:left">
                <div class="profile-accordion-title">Contraseña</div>
                @if (editSection() !== 'password') {
                  <div class="profile-accordion-sub">••••••••</div>
                }
              </div>
              @if (editSavedTab() === 'password') {
                <span class="profile-accordion-check">✓</span>
              } @else {
                <span class="profile-accordion-chevron">{{ editSection() === 'password' ? '▴' : '▾' }}</span>
              }
            </button>
            @if (editSection() === 'password') {
              <div class="profile-accordion-bd">
                <div class="form-group">
                  <label class="form-label">Contraseña actual</label>
                  <div style="position:relative">
                    <input class="form-input" style="padding-right:72px"
                           [type]="editShowCurrentPwd() ? 'text' : 'password'" placeholder="••••••••"
                           [value]="editCurrentPwd()"
                           (input)="editCurrentPwd.set($any($event.target).value)" />
                    <button type="button" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:11px;font-weight:600;color:var(--lav-d);cursor:pointer;padding:4px 2px;line-height:1"
                            (click)="editShowCurrentPwd.set(!editShowCurrentPwd())">
                      {{ editShowCurrentPwd() ? 'Ocultar' : 'Ver' }}
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Nueva contraseña</label>
                  <div style="position:relative">
                    <input class="form-input" style="padding-right:72px"
                           [type]="editShowNewPwd() ? 'text' : 'password'" placeholder="••••••••"
                           [value]="editNewPwd()"
                           (input)="editNewPwd.set($any($event.target).value)" />
                    <button type="button" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:11px;font-weight:600;color:var(--lav-d);cursor:pointer;padding:4px 2px;line-height:1"
                            (click)="editShowNewPwd.set(!editShowNewPwd())">
                      {{ editShowNewPwd() ? 'Ocultar' : 'Ver' }}
                    </button>
                  </div>
                  @if (editNewPwd()) {
                    <div style="margin-top:7px">
                      <div style="display:flex;gap:3px;margin-bottom:4px">
                        @for (i of [0, 1, 2]; track i) {
                          <div style="flex:1;height:3px;border-radius:99px;transition:background .25s"
                               [style.background]="editStrengthBarActive(i) ? editStrengthColor() : 'oklch(92% 0.02 280)'"></div>
                        }
                      </div>
                      <span style="font-size:11px;font-weight:600;transition:color .25s"
                            [style.color]="editStrengthColor()">{{ editStrengthLabel() }}</span>
                    </div>
                  }
                </div>
                <div class="form-group" style="margin-bottom:14px">
                  <label class="form-label">Confirmar contraseña</label>
                  <div style="position:relative">
                    <input class="form-input" style="padding-right:72px"
                           [type]="editShowConfirmPwd() ? 'text' : 'password'" placeholder="••••••••"
                           [value]="editConfirmPwd()"
                           (input)="editConfirmPwd.set($any($event.target).value)"
                           [style.border-color]="editConfirmPwd() && !editPasswordsMatch() ? 'oklch(55% 0.22 25)' : ''" />
                    <button type="button" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:11px;font-weight:600;color:var(--lav-d);cursor:pointer;padding:4px 2px;line-height:1"
                            (click)="editShowConfirmPwd.set(!editShowConfirmPwd())">
                      {{ editShowConfirmPwd() ? 'Ocultar' : 'Ver' }}
                    </button>
                  </div>
                  @if (editConfirmPwd() && !editPasswordsMatch()) {
                    <div style="font-size:11px;color:oklch(55% 0.22 25);margin-top:4px">Las contraseñas no coinciden</div>
                  }
                </div>
                <button class="btn-pill btn-primary" style="width:100%;justify-content:center"
                        (click)="editUpdatePassword()"
                        [disabled]="editLoading() || (editSavedTab() !== 'password' && (!editCurrentPwd() || !editNewPwd() || !editConfirmPwd()))"
                        [style.opacity]="editLoading() ? '0.5' : (editSavedTab() !== 'password' && (!editCurrentPwd() || !editNewPwd() || !editConfirmPwd())) ? '0.5' : '1'"
                        [style.background]="editSavedTab() === 'password' ? 'oklch(50% 0.16 145)' : ''"
                        [style.border-color]="editSavedTab() === 'password' ? 'oklch(50% 0.16 145)' : ''">
                  @if (editLoading()) {
                    <span class="btn-spinner"></span> Actualizando…
                  } @else if (editSavedTab() === 'password') {
                    ✓ Actualizada
                  } @else {
                    Actualizar contraseña
                  }
                </button>
              </div>
            }

          </div>
        </section>

        <!-- Trip summary -->
        <section>
          <div class="section-head" style="display:flex;align-items:center;justify-content:space-between">
            <span>Mis planificaciones ✈️</span>
            <button class="btn-pill btn-outline" style="font-size:12px;padding:5px 14px"
                    (click)="openAiPlanning.emit()" type="button"
                    i18n="@@profile.aiBtn">✨ Nuevo viaje con IA</button>
          </div>
          @if (trip.stops().length === 0) {
            <div class="section-empty">Aún no tienes destinos planificados. ¡Agrega tu primera ciudad!</div>
          } @else {
            <div class="trip-card">
              <div class="trip-card-name">Viaje actual</div>
              <div class="trip-stats">
                <div>
                  <div class="trip-stat-val">{{ trip.stops().length }}</div>
                  <div class="trip-stat-lbl">Ciudades</div>
                </div>
                <div>
                  <div class="trip-stat-val">{{ totalPlanned() }}</div>
                  <div class="trip-stat-lbl">Atracciones</div>
                </div>
                <div>
                  <div class="trip-stat-val">{{ totalAvailable() }}</div>
                  <div class="trip-stat-lbl">Disponibles</div>
                </div>
              </div>
              <div class="city-badges">
                @for (stop of trip.stops(); track stop.cityId) {
                  @let city = cityFor(stop.cityId);
                  @if (city) {
                    <div class="city-badge">
                      <span>{{ city.flag }}</span>
                      <span>{{ city.name }}</span>
                      @if (stop.selectedAttractions.length > 0) {
                        <span class="city-badge-att">{{ stop.selectedAttractions.length }}★</span>
                      }
                    </div>
                  }
                }
              </div>
            </div>
          }
        </section>

        <!-- Saved trips with itinerary -->
        <section>
          <div class="section-head">Viajes guardados 🗺️</div>
          @if (!auth.isLoggedIn()) {
            <div class="section-empty">Inicia sesión para ver tus viajes guardados.</div>
          } @else if (savedPlans.plans().length === 0) {
            <div class="section-empty">Aún no tienes viajes guardados. Usa el botón "Reservar viaje 🎉" para guardar uno.</div>
          } @else {
            <input class="form-input"
                   type="search"
                   style="font-size:12px;padding:7px 10px;margin-bottom:12px"
                   placeholder="Buscar viaje guardado…"
                   [value]="planSearch()"
                   (input)="planSearch.set($any($event.target).value)" />
            @for (plan of filteredPlans(); track plan.id) {
              <div class="saved-plan-card">
                <div class="saved-plan-header" (click)="togglePlan(plan.id)">
                  <div class="saved-plan-info">
                    <div class="saved-plan-name">{{ plan.name }}</div>
                    <div class="saved-plan-meta">
                      {{ plan.stops.length }} ciudad{{ plan.stops.length !== 1 ? 'es' : '' }}
                      · {{ fmtDate(plan.savedAt) }}
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:4px;margin-left:auto">
                    <button style="background:none;border:none;cursor:pointer;font-size:12px;padding:4px 8px;border-radius:6px;opacity:.85;transition:opacity .12s;white-space:nowrap;font-weight:600;color:var(--lav-d)"
                            (click)="$event.stopPropagation(); loadAndModify(plan)"
                            title="Modificar plan">
                      ✏️ Modificar plan
                    </button>
                    <button style="background:none;border:none;cursor:pointer;font-size:15px;padding:4px 6px;border-radius:6px;opacity:.7;transition:opacity .12s"
                            [disabled]="cloningId() === plan.id"
                            [style.opacity]="cloningId() === plan.id ? 0.4 : 0.7"
                            (click)="$event.stopPropagation(); confirmCloneId.set(plan.id)"
                            title="Clonar viaje">
                      {{ cloningId() === plan.id ? '⏳' : '📋' }}
                    </button>
                    <button style="background:none;border:none;cursor:pointer;font-size:15px;padding:4px 6px;border-radius:6px;opacity:.7;transition:opacity .12s,color .12s;color:inherit"
                            (click)="$event.stopPropagation(); confirmDeleteId.set(plan.id)"
                            title="Eliminar viaje">
                      🗑️
                    </button>
                    <span class="saved-plan-chevron">{{ selectedPlanId() === plan.id ? '▲' : '▼' }}</span>
                  </div>
                </div>

                <div class="saved-plan-actions">
                  @if (planShareId(plan)) {
                    <button class="btn-pill btn-ghost"
                            style="flex:1;justify-content:center;gap:7px"
                            (click)="sharePlan(plan)" type="button">
                      🔗 Ver viaje compartido
                    </button>
                  } @else {
                    <button class="btn-pill btn-primary"
                            style="flex:1;justify-content:center;gap:7px"
                            (click)="sharePlan(plan)" type="button">
                      📤 Compartir viaje <span class="karma-cost">−1 ✨ karma</span>
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
                    <span class="share-error">Karma insuficiente</span>
                  }
                </div>

                @if (selectedPlanId() === plan.id) {
                  <div class="saved-plan-itin">
                    <app-trip-itinerary [stops]="plan.stops" [transits]="plan.transits ?? []" />
                  </div>
                }
              </div>
            }
            @if (filteredPlans().length === 0) {
              <div class="section-empty">Sin resultados para "{{ planSearch() }}" 🔍</div>
            }
          }
        </section>

        <!-- World map -->
        <section>
          <div class="section-head">Lugares visitados 🗺</div>
          @if (!auth.isLoggedIn()) {
            <div class="section-empty">Inicia sesión para guardar tus lugares visitados en el mapa.</div>
          } @else {
            <p class="map-hint">
              Haz clic en el mapa para marcar un lugar que ya visitaste.
              Pasa el cursor sobre un pin para eliminarlo.
            </p>

            <div class="map-wrap" (click)="onMapClick($event)">
              <img class="world-map-img" src="world-map.webp" alt="World map" draggable="false" />

              @for (pin of visitedPlaces.pins(); track pin.id) {
                <div class="map-pin"
                     [style.left.%]="pin.x"
                     [style.top.%]="pin.y"
                     (click)="$event.stopPropagation()">
                  <div class="pin-icon">📍</div>
                  <div class="pin-label">{{ pin.label }}</div>
                  <button class="pin-del" (click)="removePin(pin.id)" type="button">✕</button>
                </div>
              }

              @if (pendingPin()) {
                <div class="map-pin pin-pending"
                     [style.left.%]="pendingPin()!.x"
                     [style.top.%]="pendingPin()!.y"
                     (click)="$event.stopPropagation()">
                  <div class="pin-icon">📍</div>
                </div>
              }
            </div>

            @if (pendingPin()) {
              <div class="pin-form" (click)="$event.stopPropagation()">
                <input class="pin-form-input"
                       [value]="pendingLabel()"
                       (input)="pendingLabel.set($any($event.target).value)"
                       placeholder="¿Qué lugar visitaste?"
                       (keydown.enter)="confirmPin()" />
                <button class="btn-pill btn-primary" style="padding:6px 14px;font-size:12px;flex-shrink:0"
                        (click)="confirmPin()" type="button">Agregar</button>
                <button class="btn-pill btn-outline" style="padding:6px 10px;font-size:12px;flex-shrink:0"
                        (click)="cancelPin()" type="button">✕</button>
              </div>
            }

            @if (visitedPlaces.pins().length > 0) {
              <div style="margin-top:12px;font-size:12px;color:var(--t3)">
                {{ visitedPlaces.pins().length }}
                lugar{{ visitedPlaces.pins().length !== 1 ? 'es' : '' }}
                marcado{{ visitedPlaces.pins().length !== 1 ? 's' : '' }}
              </div>
            }
          }
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
            <div class="modal-title">📋 Clonar viaje</div>
            <div class="modal-sub">{{ planName(confirmCloneId()!) }}</div>
          </div>
          <div class="modal-body" style="padding:20px 24px">
            <p style="font-size:13px;color:var(--t2);margin:0;line-height:1.6">
              Se creará una copia de este viaje en tu lista de guardados.<br>
              Costo: <strong>−1 ✨ karma</strong>.
            </p>
          </div>
          <div class="modal-foot" style="gap:8px">
            <button class="btn-pill btn-outline" style="flex:1" (click)="confirmCloneId.set(null)" type="button">Cancelar</button>
            <button class="btn-pill btn-primary" style="flex:1" (click)="confirmClonePlan()" type="button">📋 Clonar</button>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirmation modal -->
    @if (confirmDeleteId()) {
      <div class="modal-backdrop" (click)="confirmDeleteId.set(null)">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width:340px">
          <div class="modal-head" style="background:linear-gradient(135deg,oklch(58% 0.2 25),oklch(46% 0.16 25))">
            <div class="modal-title">🗑️ Eliminar viaje</div>
            <div class="modal-sub">Esta acción no se puede deshacer</div>
          </div>
          <div class="modal-body" style="padding:20px 24px">
            <p style="font-size:13px;color:var(--t2);margin:0;line-height:1.6">
              ¿Eliminar <strong>"{{ planName(confirmDeleteId()!) }}"</strong>?<br>
              Perderás este viaje permanentemente.
            </p>
          </div>
          <div class="modal-foot" style="gap:8px">
            <button class="btn-pill btn-outline" style="flex:1" (click)="confirmDeleteId.set(null)" type="button">Cancelar</button>
            <button class="btn-pill btn-primary" style="flex:1;background:oklch(48% 0.18 25);border-color:oklch(48% 0.18 25)"
                    (click)="confirmDeletePlan()" type="button">🗑️ Eliminar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ProfileComponent {
  readonly auth          = inject(AuthService);
  readonly trip          = inject(TripService);
  readonly savedPlans    = inject(SavedPlansService);
  readonly homeAddress   = inject(HomeAddressService);
  readonly visitedPlaces = inject(VisitedPlacesService);
  private readonly sharedTrips   = inject(SharedTripsService);
  private readonly karma         = inject(KarmaService);
  private readonly karmaModal    = inject(KarmaModalService);
  private readonly api           = inject(ApiService);

  close          = output<void>();
  openAiPlanning = output<void>();

  // ── Edit account accordion ──────────────────────────────────
  editSection       = signal<'name' | 'email' | 'password' | null>(null);
  editDisplayName   = signal(this.auth.currentUser()?.name ?? '');
  editNewEmail      = signal('');
  editEmailOtp      = signal('');
  editEmailOtpSent  = signal(false);
  editCurrentPwd    = signal('');
  editNewPwd        = signal('');
  editConfirmPwd    = signal('');
  editLoading       = signal(false);
  editSavedTab      = signal<'name' | 'email-otp' | 'email' | 'password' | null>(null);
  editError         = signal('');
  editShowCurrentPwd  = signal(false);
  editShowNewPwd      = signal(false);
  editShowConfirmPwd  = signal(false);

  readonly editPasswordsMatch = computed(() =>
    !this.editConfirmPwd() || this.editNewPwd() === this.editConfirmPwd()
  );

  readonly editPasswordStrength = computed((): 'none' | 'vulnerable' | 'light' | 'strong' => {
    const p = this.editNewPwd();
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

  readonly editStrengthColor = computed((): string => {
    switch (this.editPasswordStrength()) {
      case 'vulnerable': return 'oklch(55% 0.22 25)';
      case 'light':      return 'oklch(62% 0.14 60)';
      case 'strong':     return 'oklch(50% 0.16 145)';
      default:           return 'var(--t3)';
    }
  });

  editStrengthBarActive(index: number): boolean {
    switch (this.editPasswordStrength()) {
      case 'vulnerable': return index === 0;
      case 'light':      return index <= 1;
      case 'strong':     return true;
      default:           return false;
    }
  }

  editStrengthLabel(): string {
    switch (this.editPasswordStrength()) {
      case 'vulnerable': return 'Vulnerable';
      case 'light':      return 'Moderada';
      case 'strong':     return 'Fuerte';
      default:           return '';
    }
  }

  private editSavedTimer: ReturnType<typeof setTimeout> | null = null;

  toggleEditSection(section: 'name' | 'email' | 'password'): void {
    this.editSection.update(cur => cur === section ? null : section);
    this.editError.set('');
  }

  editSaveName(): void {
    const name = this.editDisplayName().trim();
    if (!name) { this.editError.set('El nombre no puede estar vacío.'); return; }
    this.editLoading.set(true);
    this.editError.set('');
    this.auth.updateProfile({ name }).subscribe({
      next: () => { this.editLoading.set(false); this.editMarkSaved('name'); },
      error: (err: Error) => { this.editError.set(err.message ?? 'Error al actualizar.'); this.editLoading.set(false); },
    });
  }

  editRequestOtp(): void {
    const email = this.editNewEmail().trim();
    if (!email) { this.editError.set('Ingresa la nueva dirección de correo.'); return; }
    this.editLoading.set(true);
    this.editError.set('');
    this.auth.requestProfileOtp(email).subscribe({
      next: () => {
        this.editLoading.set(false);
        this.editMarkSaved('email-otp', () => { this.editEmailOtpSent.set(true); });
      },
      error: (err: Error) => { this.editError.set(err.message ?? 'Error al enviar el código.'); this.editLoading.set(false); },
    });
  }

  editUpdateEmail(): void {
    this.editLoading.set(true);
    this.editError.set('');
    this.auth.updateProfile({ newEmail: this.editNewEmail().trim(), otp: this.editEmailOtp() }).subscribe({
      next: () => {
        this.editLoading.set(false);
        this.editMarkSaved('email', () => {
          this.editEmailOtpSent.set(false);
          this.editEmailOtp.set('');
          this.editNewEmail.set('');
        });
      },
      error: (err: Error) => { this.editError.set(err.message ?? 'Código incorrecto.'); this.editLoading.set(false); },
    });
  }

  editUpdatePassword(): void {
    if (!this.editPasswordsMatch()) { this.editError.set('Las contraseñas no coinciden.'); return; }
    if (this.editNewPwd().length < 6) { this.editError.set('La contraseña debe tener al menos 6 caracteres.'); return; }
    this.editLoading.set(true);
    this.editError.set('');
    this.auth.updateProfile({ currentPassword: this.editCurrentPwd(), newPassword: this.editNewPwd() }).subscribe({
      next: () => {
        this.editLoading.set(false);
        this.editCurrentPwd.set(''); this.editNewPwd.set(''); this.editConfirmPwd.set('');
        this.editMarkSaved('password');
      },
      error: (err: Error) => { this.editError.set(err.message ?? 'Error al actualizar la contraseña.'); this.editLoading.set(false); },
    });
  }

  private editMarkSaved(tab: 'name' | 'email-otp' | 'email' | 'password', onComplete?: () => void): void {
    if (this.editSavedTimer) clearTimeout(this.editSavedTimer);
    this.editSavedTab.set(tab);
    this.editSavedTimer = setTimeout(() => { this.editSavedTab.set(null); onComplete?.(); }, 2500);
  }

  // ── Saved plans ─────────────────────────────────────────────
  selectedPlanId   = signal<string | null>(null);
  planSearch       = signal('');
  shareError       = signal<string | null>(null);
  exportingPlanId  = signal<string | null>(null);
  toast            = signal<string | null>(null);
  confirmCloneId   = signal<string | null>(null);
  confirmDeleteId  = signal<string | null>(null);
  cloningId        = signal<string | null>(null);
  editingHome     = signal(false);
  homeInput       = signal('');
  pendingPin      = signal<{ x: number; y: number } | null>(null);
  pendingLabel    = signal('');

  readonly initials = computed(() => {
    const name = this.auth.currentUser()?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  });

  readonly filteredPlans = computed(() => {
    const q = this.planSearch().toLowerCase().trim();
    if (!q) return this.savedPlans.plans();
    return this.savedPlans.plans().filter(p => p.name.toLowerCase().includes(q));
  });

  readonly totalPlanned = computed(() =>
    this.trip.stops().reduce((sum, s) => sum + s.selectedAttractions.length, 0)
  );

  readonly totalAvailable = computed(() =>
    this.trip.stops().reduce((sum, s) => {
      const city = WORLD_CITIES.find(c => c.id === s.cityId);
      return sum + (city ? getAttractions(city).length : 0);
    }, 0)
  );

  openHomeEdit(): void {
    this.homeInput.set(this.homeAddress.address());
    this.editingHome.set(true);
  }

  saveHome(): void {
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.homeAddress.save(email, this.homeInput());
    this.editingHome.set(false);
  }

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
    if (existingShareId) {
      this.copyLink(existingShareId, plan.id);
      return;
    }

    if (environment.useMocks) {
      if ((this.karma.karma() ?? 0) < 1) {
        this.karmaModal.openInsufficient(1, this.karma.karma() ?? 0);
        return;
      }
      this.karma.spend();
      const shareId = this.sharedTrips.createShare({
        ownerEmail: user.email,
        ownerName:  user.name,
        tripName:   plan.name,
        stops:      plan.stops,
        transits:   plan.transits ?? [],
        planId:     plan.id,
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
      this.toast.set('La exportación Excel requiere el backend activo');
      return;
    }

    const cityNames: Record<string, string> = {};
    const attractionNames: Record<string, string> = {};

    for (const stop of plan.stops) {
      const city = WORLD_CITIES.find(c => c.id === stop.cityId);
      if (!city) continue;
      cityNames[stop.cityId] = city.name;
      for (const att of getAttractions(city)) {
        attractionNames[att.id] = att.name;
      }
    }

    this.exportingPlanId.set(plan.id);
    this.api.exportItinerary(plan.id, cityNames, attractionNames).subscribe({
      next: (blob) => {
        const slug = plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `itinerario-${slug}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportingPlanId.set(null);
        this.toast.set('Itinerario descargado');
        if (!plan.exportedAt) {
          const user = this.auth.currentUser();
          if (user) {
            this.karma.spend();
            this.savedPlans.markExported(user.email, plan.id);
          }
        }
      },
      error: (err) => {
        this.exportingPlanId.set(null);
        if (!this.karmaModal.handleKarmaError(err)) {
          this.toast.set('Error al descargar el itinerario');
        }
      },
    });
  }

  private copyLink(shareId: string, _planId: string): void {
    const url = `${window.location.origin}/?share=${shareId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    window.location.href = url;
  }

  togglePlan(id: string): void {
    this.selectedPlanId.update(cur => cur === id ? null : id);
  }

  loadAndModify(plan: SavedPlan): void {
    this.trip.restoreStops(plan.stops, plan.id, plan.transits ?? []);
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
          id:       cloned.id!,
          name:     cloned.title,
          savedAt:  cloned.createdAt ?? new Date().toISOString(),
          stops:    cloned.stops,
          transits: cloned.transits ?? [],
        });
        this.toast.set(`"${cloned.title}" guardado`);
      },
      error: err => {
        this.cloningId.set(null);
        this.karmaModal.handleKarmaError(err);
      },
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
      return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return iso; }
  }

  cityFor(cityId: string) {
    return WORLD_CITIES.find(c => c.id === cityId) ?? null;
  }

  onMapClick(event: MouseEvent): void {
    if (this.pendingPin()) { this.cancelPin(); return; }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = +((event.clientX - rect.left) / rect.width * 100).toFixed(2);
    const y = +((event.clientY - rect.top)  / rect.height * 100).toFixed(2);
    this.pendingPin.set({ x, y });
    this.pendingLabel.set('');
  }

  confirmPin(): void {
    const label = this.pendingLabel().trim();
    if (!label) return;
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.visitedPlaces.addPin(email, { ...this.pendingPin()!, label });
    this.pendingPin.set(null);
    this.pendingLabel.set('');
  }

  cancelPin(): void {
    this.pendingPin.set(null);
    this.pendingLabel.set('');
  }

  removePin(id: string): void {
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.visitedPlaces.removePin(email, id);
  }
}
