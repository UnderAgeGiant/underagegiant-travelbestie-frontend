import { Component, computed, inject, signal, output, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { TripService } from '../trip/trip.service';
import { HomeAddressService } from '../../core/home-address/home-address.service';
import { VisitedPlacesService } from '../../core/visited-places/visited-places.service';
import { WORLD_CITIES } from '../../data/cities.data';

@Component({
    selector: 'app-profile',
    imports: [],
    changeDetection: ChangeDetectionStrategy.Eager,
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

        <!-- Edit account accordion -->
        <section>
          <div class="section-head">Editar cuenta ✏️</div>
          @if (editErrorCode() || editError()) {
            <div class="profile-error" style="margin:0 0 10px">
              @if (editErrorCode()) {
                @switch (editErrorContext()) {
                  @case ('name') {
                    @if (editErrorCode() === 'UNAUTHORIZED') {
                      <ng-container i18n="@@profile.errSessionExpired">Tu sesión expiró. Vuelve a iniciar sesión.</ng-container>
                    } @else {
                      <ng-container i18n="@@profile.errUpdateName">No se pudo actualizar tu nombre. Intenta de nuevo.</ng-container>
                    }
                  }
                  @case ('email-otp') {
                    @if (editErrorCode() === 'UNAUTHORIZED') {
                      <ng-container i18n="@@profile.errSessionExpired">Tu sesión expiró. Vuelve a iniciar sesión.</ng-container>
                    } @else if (editErrorCode() === 'RATE_LIMITED') {
                      <ng-container i18n="@@profile.errRateLimited">Demasiados intentos. Espera unos minutos e inténtalo de nuevo.</ng-container>
                    } @else {
                      <ng-container i18n="@@profile.errSendEmailOtp">No se pudo enviar el código. Verifica que el correo no esté ya registrado.</ng-container>
                    }
                  }
                  @case ('email') {
                    @if (editErrorCode() === 'UNAUTHORIZED') {
                      <ng-container i18n="@@profile.errSessionExpired">Tu sesión expiró. Vuelve a iniciar sesión.</ng-container>
                    } @else {
                      <ng-container i18n="@@profile.errUpdateEmail">Código incorrecto o vencido. Solicita uno nuevo.</ng-container>
                    }
                  }
                  @case ('password') {
                    @if (editErrorCode() === 'UNAUTHORIZED') {
                      <ng-container i18n="@@profile.errSessionExpired">Tu sesión expiró. Vuelve a iniciar sesión.</ng-container>
                    } @else {
                      <ng-container i18n="@@profile.errUpdatePassword">No se pudo actualizar tu contraseña. Verifica tu contraseña actual.</ng-container>
                    }
                  }
                  @case ('homeCity') {
                    @if (editErrorCode() === 'UNAUTHORIZED') {
                      <ng-container i18n="@@profile.errSessionExpired">Tu sesión expiró. Vuelve a iniciar sesión.</ng-container>
                    } @else {
                      <ng-container i18n="@@profile.errUpdateHomeCity">No se pudo guardar la ciudad. Intenta de nuevo.</ng-container>
                    }
                  }
                }
              } @else {
                {{ editError() }}
              }
            </div>
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

            <div class="profile-accordion-sep"></div>

            <!-- Home city -->
            <button class="profile-accordion-hd" (click)="toggleEditSection('homeCity')" type="button">
              <div style="display:flex;align-items:center;gap:10px">
                <span>🏠</span>
                <div style="text-align:left">
                  <div class="profile-accordion-title" i18n="@@profile.homeCityTitle">Ciudad de origen</div>
                  <div class="profile-accordion-sub">{{ homeAddress.address() || sinDefinir }}</div>
                </div>
              </div>
              @if (editSavedTab() === 'homeCity') {
                <span class="profile-accordion-check">✓</span>
              } @else {
                <span class="profile-accordion-chevron">{{ editSection() === 'homeCity' ? '▴' : '▾' }}</span>
              }
            </button>
            @if (editSection() === 'homeCity') {
              <div class="profile-accordion-bd">
                <input class="form-input"
                       i18n-placeholder="@@profile.homeCityPlaceholder" placeholder="Ciudad o dirección de inicio…"
                       [value]="editHomeCity()"
                       (input)="editHomeCity.set($any($event.target).value)"
                       (keydown.enter)="editSaveHomeCity()" />
                <button class="btn-pill btn-primary" style="margin-top:10px;width:100%;justify-content:center"
                        [disabled]="editLoading()"
                        (click)="editSaveHomeCity()">
                  @if (editLoading()) {
                    <span class="btn-spinner"></span> <ng-container i18n="@@profile.saving">Guardando…</ng-container>
                  } @else if (editSavedTab() === 'homeCity') {
                    ✓ <ng-container i18n="@@profile.saved">Guardado</ng-container>
                  } @else {
                    <ng-container i18n="@@profile.homeCitySave">Guardar ciudad</ng-container>
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

  `
})
export class ProfileComponent {
  readonly auth          = inject(AuthService);
  readonly trip          = inject(TripService);
  readonly homeAddress   = inject(HomeAddressService);
  readonly visitedPlaces = inject(VisitedPlacesService);

  close          = output<void>();
  openAiPlanning = output<void>();

  // ── Edit account accordion ──────────────────────────────────
  editSection       = signal<'name' | 'email' | 'password' | 'homeCity' | null>(null);
  editDisplayName   = signal(this.auth.currentUser()?.name ?? '');
  editNewEmail      = signal('');
  editEmailOtp      = signal('');
  editEmailOtpSent  = signal(false);
  editCurrentPwd    = signal('');
  editNewPwd        = signal('');
  editConfirmPwd    = signal('');
  editLoading       = signal(false);
  editSavedTab      = signal<'name' | 'email-otp' | 'email' | 'password' | 'homeCity' | null>(null);
  editError         = signal('');
  editErrorCode     = signal<string>('');
  editErrorContext  = signal<'name' | 'email-otp' | 'email' | 'password' | 'homeCity' | ''>('');
  editShowCurrentPwd  = signal(false);
  editShowNewPwd      = signal(false);
  editShowConfirmPwd  = signal(false);
  editHomeCity        = signal(this.homeAddress.address());

  readonly sinDefinir = $localize`:@@profile.homeCitySub:Sin definir`;

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

  toggleEditSection(section: 'name' | 'email' | 'password' | 'homeCity'): void {
    this.editSection.update(cur => cur === section ? null : section);
    this.editError.set('');
    this.editErrorCode.set('');
    this.editErrorContext.set('');
    if (section === 'homeCity') this.editHomeCity.set(this.homeAddress.address());
  }

  editSaveName(): void {
    const name = this.editDisplayName().trim();
    if (!name) { this.editError.set('El nombre no puede estar vacío.'); return; }
    this.editLoading.set(true);
    this.editError.set('');
    this.editErrorCode.set('');
    this.editErrorContext.set('');
    this.auth.updateProfile({ name }).subscribe({
      next: () => { this.editLoading.set(false); this.editMarkSaved('name'); },
      error: (err: unknown) => {
        this.editErrorCode.set((err as any)?.code ?? 'UNKNOWN');
        this.editErrorContext.set('name');
        this.editLoading.set(false);
      },
    });
  }

  editRequestOtp(): void {
    const email = this.editNewEmail().trim();
    if (!email) { this.editError.set('Ingresa la nueva dirección de correo.'); return; }
    this.editLoading.set(true);
    this.editError.set('');
    this.editErrorCode.set('');
    this.editErrorContext.set('');
    this.auth.requestProfileOtp(email).subscribe({
      next: () => {
        this.editLoading.set(false);
        this.editMarkSaved('email-otp', () => { this.editEmailOtpSent.set(true); });
      },
      error: (err: unknown) => {
        this.editErrorCode.set((err as any)?.code ?? 'UNKNOWN');
        this.editErrorContext.set('email-otp');
        this.editLoading.set(false);
      },
    });
  }

  editUpdateEmail(): void {
    this.editLoading.set(true);
    this.editError.set('');
    this.editErrorCode.set('');
    this.editErrorContext.set('');
    this.auth.updateProfile({ newEmail: this.editNewEmail().trim(), otp: this.editEmailOtp() }).subscribe({
      next: () => {
        this.editLoading.set(false);
        this.editMarkSaved('email', () => {
          this.editEmailOtpSent.set(false);
          this.editEmailOtp.set('');
          this.editNewEmail.set('');
        });
      },
      error: (err: unknown) => {
        this.editErrorCode.set((err as any)?.code ?? 'UNKNOWN');
        this.editErrorContext.set('email');
        this.editLoading.set(false);
      },
    });
  }

  editUpdatePassword(): void {
    if (!this.editPasswordsMatch()) { this.editError.set('Las contraseñas no coinciden.'); return; }
    if (this.editNewPwd().length < 6) { this.editError.set('La contraseña debe tener al menos 6 caracteres.'); return; }
    this.editLoading.set(true);
    this.editError.set('');
    this.editErrorCode.set('');
    this.editErrorContext.set('');
    this.auth.updateProfile({ currentPassword: this.editCurrentPwd(), newPassword: this.editNewPwd() }).subscribe({
      next: () => {
        this.editLoading.set(false);
        this.editCurrentPwd.set(''); this.editNewPwd.set(''); this.editConfirmPwd.set('');
        this.editMarkSaved('password');
      },
      error: (err: unknown) => {
        this.editErrorCode.set((err as any)?.code ?? 'UNKNOWN');
        this.editErrorContext.set('password');
        this.editLoading.set(false);
      },
    });
  }

  editSaveHomeCity(): void {
    this.editLoading.set(true);
    this.editError.set('');
    this.editErrorCode.set('');
    this.editErrorContext.set('');
    this.homeAddress.save(this.editHomeCity().trim()).subscribe({
      next: () => { this.editLoading.set(false); this.editMarkSaved('homeCity'); },
      error: (err: unknown) => {
        this.editErrorCode.set((err as any)?.code ?? 'UNKNOWN');
        this.editErrorContext.set('homeCity');
        this.editLoading.set(false);
      },
    });
  }

  private editMarkSaved(tab: 'name' | 'email-otp' | 'email' | 'password' | 'homeCity', onComplete?: () => void): void {
    if (this.editSavedTimer) clearTimeout(this.editSavedTimer);
    this.editSavedTab.set(tab);
    this.editSavedTimer = setTimeout(() => { this.editSavedTab.set(null); onComplete?.(); }, 2500);
  }

  pendingPin      = signal<{ x: number; y: number } | null>(null);
  pendingLabel    = signal('');

  readonly initials = computed(() => {
    const name = this.auth.currentUser()?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  });

  readonly totalPlanned = computed(() =>
    this.trip.stops().reduce((sum, s) => sum + s.selectedAttractions.length, 0)
  );

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
