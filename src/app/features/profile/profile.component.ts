import { Component, computed, inject, signal, output, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { TripService } from '../trip/trip.service';
import { HomeAddressService } from '../../core/home-address/home-address.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { FlagIconComponent } from '../../shared/flag-icon/flag-icon.component';
import { CountryComboboxComponent } from '../../shared/country-combobox/country-combobox.component';
import { Country, WORLD_COUNTRIES } from '../../data/countries.data';
import { CompanionBoostCardComponent } from './companion-boost-card.component';
import { TrophyShelfComponent } from './trophy-shelf/trophy-shelf.component';
import { AutoSaveService } from '../../core/saved-plans/auto-save.service';
import { AutosaveReminderBannerComponent } from '../../shared/autosave-reminder-banner/autosave-reminder-banner.component';
import { NavShellComponent } from '../nav/nav-shell.component';
import { computePasswordStrength, passwordStrengthColor, isPasswordStrengthBarActive } from '../../core/utils/password-strength.util';

@Component({
    selector: 'app-profile',
    imports: [FlagIconComponent, CountryComboboxComponent, CompanionBoostCardComponent, TrophyShelfComponent, AutosaveReminderBannerComponent, NavShellComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <div class="profile-page">

      <app-nav [activeView]="'profile'" (logoClick)="close.emit()" />

      <!-- The main app view's own banner (ShellComponent) is hidden while this page is open —
           .profile-page is a full-screen overlay, so it needs its own copy to stay visible. -->
      @if (autoSave.reminderVisible()) {
        <app-autosave-reminder-banner (dismiss)="autoSave.dismissReminder()" />
      }

      <!-- Header bar -->
      <div class="prof-bar">
        <div class="prof-bar-title" i18n="@@profile.title">Mi Perfil</div>
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
          <div class="section-head" i18n="@@profile.editAccountTitle">Editar cuenta ✏️</div>
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
                  @case ('password') {
                    @if (editErrorCode() === 'UNAUTHORIZED') {
                      <ng-container i18n="@@profile.errSessionExpired">Tu sesión expiró. Vuelve a iniciar sesión.</ng-container>
                    } @else {
                      <ng-container i18n="@@profile.errUpdatePassword">No se pudo actualizar tu contraseña. Verifica tu contraseña actual.</ng-container>
                    }
                  }
                  @case ('countryOfResidence') {
                    @if (editErrorCode() === 'UNAUTHORIZED') {
                      <ng-container i18n="@@profile.errSessionExpired">Tu sesión expiró. Vuelve a iniciar sesión.</ng-container>
                    } @else {
                      <ng-container i18n="@@profile.errUpdateCountryOfResidence">No se pudo guardar el país de residencia. Intenta de nuevo.</ng-container>
                    }
                  }
                }
              } @else {
                {{ editError() }}
              }
            </div>
          }
          <div style="border:1px solid var(--border);border-radius:14px;background:#fff">

            <!-- Name -->
            <button class="profile-accordion-hd" (click)="toggleEditSection('name')" type="button">
              <span style="font-size:17px">👤</span>
              <div style="flex:1;text-align:left">
                <div class="profile-accordion-title" i18n="@@profile.nameTitle">Nombre</div>
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
                  <label class="form-label" i18n="@@profile.displayNameLabel">Nombre para mostrar</label>
                  <input class="form-input" i18n-placeholder="@@profile.namePlaceholder" placeholder="Tu nombre"
                         [value]="editDisplayName()"
                         (input)="editDisplayName.set($any($event.target).value)" />
                </div>
                <button class="btn-pill btn-primary" style="width:100%;justify-content:center"
                        (click)="editSaveName()" [disabled]="editLoading()"
                        [style.opacity]="editLoading() ? '0.5' : '1'"
                        [style.background]="editSavedTab() === 'name' ? 'oklch(50% 0.16 145)' : ''"
                        [style.border-color]="editSavedTab() === 'name' ? 'oklch(50% 0.16 145)' : ''">
                  @if (editLoading()) {
                    <span class="btn-spinner"></span> <ng-container i18n="@@profile.saving">Guardando…</ng-container>
                  } @else if (editSavedTab() === 'name') {
                    ✓ <ng-container i18n="@@profile.saved">Guardado</ng-container>
                  } @else {
                    <ng-container i18n="@@profile.saveNameBtn">Guardar nombre</ng-container>
                  }
                </button>
              </div>
            }

            <div class="profile-accordion-sep"></div>

            <!-- Password -->
            <button class="profile-accordion-hd" (click)="toggleEditSection('password')" type="button">
              <span style="font-size:17px">🔒</span>
              <div style="flex:1;text-align:left">
                <div class="profile-accordion-title" i18n="@@profile.passwordTitle">Contraseña</div>
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
                  <label class="form-label" i18n="@@profile.currentPasswordLabel">Contraseña actual</label>
                  <div style="position:relative">
                    <input class="form-input" style="padding-right:72px"
                           [type]="editShowCurrentPwd() ? 'text' : 'password'" placeholder="••••••••"
                           [value]="editCurrentPwd()"
                           (input)="editCurrentPwd.set($any($event.target).value)" />
                    <button type="button" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:11px;font-weight:600;color:var(--lav-d);cursor:pointer;padding:4px 2px;line-height:1"
                            (click)="editShowCurrentPwd.set(!editShowCurrentPwd())">
                      @if (editShowCurrentPwd()) { <ng-container i18n="@@profile.hideBtn">Ocultar</ng-container> } @else { <ng-container i18n="@@profile.showBtn">Ver</ng-container> }
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" i18n="@@profile.newPasswordLabel">Nueva contraseña</label>
                  <div style="position:relative">
                    <input class="form-input" style="padding-right:72px"
                           [type]="editShowNewPwd() ? 'text' : 'password'" placeholder="••••••••"
                           [value]="editNewPwd()"
                           (input)="editNewPwd.set($any($event.target).value)" />
                    <button type="button" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:11px;font-weight:600;color:var(--lav-d);cursor:pointer;padding:4px 2px;line-height:1"
                            (click)="editShowNewPwd.set(!editShowNewPwd())">
                      @if (editShowNewPwd()) { <ng-container i18n="@@profile.hideBtn">Ocultar</ng-container> } @else { <ng-container i18n="@@profile.showBtn">Ver</ng-container> }
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
                  <label class="form-label" i18n="@@nav.confirmPasswordLabel">Confirmar contraseña</label>
                  <div style="position:relative">
                    <input class="form-input" style="padding-right:72px"
                           [type]="editShowConfirmPwd() ? 'text' : 'password'" placeholder="••••••••"
                           [value]="editConfirmPwd()"
                           (input)="editConfirmPwd.set($any($event.target).value)"
                           [style.border-color]="editConfirmPwd() && !editPasswordsMatch() ? 'oklch(55% 0.22 25)' : ''" />
                    <button type="button" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:11px;font-weight:600;color:var(--lav-d);cursor:pointer;padding:4px 2px;line-height:1"
                            (click)="editShowConfirmPwd.set(!editShowConfirmPwd())">
                      @if (editShowConfirmPwd()) { <ng-container i18n="@@profile.hideBtn">Ocultar</ng-container> } @else { <ng-container i18n="@@profile.showBtn">Ver</ng-container> }
                    </button>
                  </div>
                  @if (editConfirmPwd() && !editPasswordsMatch()) {
                    <div style="font-size:11px;color:oklch(55% 0.22 25);margin-top:4px" i18n="@@nav.confirmPasswordMismatch">Las contraseñas no coinciden</div>
                  }
                </div>
                <button class="btn-pill btn-primary" style="width:100%;justify-content:center"
                        (click)="editUpdatePassword()"
                        [disabled]="editLoading() || (editSavedTab() !== 'password' && (!editCurrentPwd() || !editNewPwd() || !editConfirmPwd()))"
                        [style.opacity]="editLoading() ? '0.5' : (editSavedTab() !== 'password' && (!editCurrentPwd() || !editNewPwd() || !editConfirmPwd())) ? '0.5' : '1'"
                        [style.background]="editSavedTab() === 'password' ? 'oklch(50% 0.16 145)' : ''"
                        [style.border-color]="editSavedTab() === 'password' ? 'oklch(50% 0.16 145)' : ''">
                  @if (editLoading()) {
                    <span class="btn-spinner"></span> <ng-container i18n="@@profile.updatingMsg">Actualizando…</ng-container>
                  } @else if (editSavedTab() === 'password') {
                    ✓ <ng-container i18n="@@profile.passwordUpdatedMsg">Actualizada</ng-container>
                  } @else {
                    <ng-container i18n="@@profile.updatePasswordBtn">Actualizar contraseña</ng-container>
                  }
                </button>
              </div>
            }

            <div class="profile-accordion-sep"></div>

            <!-- Country of residence -->
            <button class="profile-accordion-hd" (click)="toggleEditSection('countryOfResidence')" type="button">
              <div style="display:flex;align-items:center;gap:10px">
                <span>🌎</span>
                <div style="text-align:left">
                  <div class="profile-accordion-title" i18n="@@profile.countryOfResidenceTitle">País de residencia</div>
                  <div class="profile-accordion-sub">{{ countryOfResidenceLabel() || sinDefinir }}</div>
                </div>
              </div>
              @if (editSavedTab() === 'countryOfResidence') {
                <span class="profile-accordion-check">✓</span>
              } @else {
                <span class="profile-accordion-chevron">{{ editSection() === 'countryOfResidence' ? '▴' : '▾' }}</span>
              }
            </button>
            @if (editSection() === 'countryOfResidence') {
              <div class="profile-accordion-bd">
                <app-country-combobox [initialCode]="editCountryOfResidence()" (countryChange)="editCountryOfResidence.set($event.code)" />
                <div style="display:flex;gap:8px;margin-top:14px">
                  <button class="btn-pill btn-primary" style="flex:1;justify-content:center"
                          (click)="editSaveCountryOfResidence()"
                          [disabled]="editLoading() || !editCountryOfResidenceChanged()"
                          [style.opacity]="(editLoading() || !editCountryOfResidenceChanged()) ? '0.5' : '1'"
                          [style.background]="editSavedTab() === 'countryOfResidence' ? 'oklch(50% 0.16 145)' : ''"
                          [style.border-color]="editSavedTab() === 'countryOfResidence' ? 'oklch(50% 0.16 145)' : ''">
                    @if (editLoading() && editErrorContext() === 'countryOfResidence') {
                      <span class="btn-spinner"></span> <ng-container i18n="@@profile.saving">Guardando…</ng-container>
                    } @else if (editSavedTab() === 'countryOfResidence') {
                      ✓ <ng-container i18n="@@profile.saved">Guardado</ng-container>
                    } @else {
                      <ng-container i18n="@@profile.saveCountryBtn">Guardar</ng-container>
                    }
                  </button>
                  @if (homeAddress.countryCode()) {
                    <button class="btn-pill btn-outline" style="justify-content:center"
                            (click)="editDeleteCountryOfResidence()" [disabled]="editLoading()"
                            [style.opacity]="editLoading() ? '0.5' : '1'"
                            i18n="@@profile.deleteCountryBtn">
                      Eliminar
                    </button>
                  }
                </div>
              </div>
            }

          </div>
        </section>

        <!-- Asistente Miel boost -->
        <section>
          <div class="section-head" i18n="@@profile.companionBoostTitle">Asistente Miel 🐾</div>
          <app-companion-boost-card />
        </section>

        <!-- Trip summary -->
        <section>
          <div class="section-head" style="display:flex;align-items:center;justify-content:space-between">
            <span i18n="@@profile.myTripsTitle">Mis planificaciones ✈️</span>
            <button class="btn-pill btn-outline" style="font-size:12px;padding:5px 14px"
                    (click)="openAiPlanning.emit()" type="button"
                    i18n="@@profile.aiBtn">✨ Nuevo viaje con IA</button>
          </div>
          @if (trip.stops().length === 0) {
            <div class="section-empty" i18n="@@profile.noTripsYet">Aún no tienes destinos planificados. ¡Agrega tu primera ciudad!</div>
          } @else {
            <div class="trip-card">
              <div class="trip-card-name" i18n="@@profile.currentTripLabel">Viaje actual</div>
              <div class="trip-stats">
                <div>
                  <div class="trip-stat-val">{{ trip.stops().length }}</div>
                  <div class="trip-stat-lbl" i18n="@@profile.citiesLabel">Ciudades</div>
                </div>
                <div>
                  <div class="trip-stat-val">{{ totalPlanned() }}</div>
                  <div class="trip-stat-lbl" i18n="@@profile.attractionsLabel">Atracciones</div>
                </div>
              </div>
              <div class="city-badges">
                @for (stop of trip.stops(); track stop.cityId) {
                  @let city = cityFor(stop.cityId);
                  @if (city) {
                    <div class="city-badge">
                      <app-flag-icon [flag]="city.flag" [alt]="city.name" />
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

        <!-- Trophies (Feature 69) — replaced the visited-places map -->
        @if (auth.isLoggedIn()) {
          <tb-trophy-shelf />
        }

      </div>
    </div>

  `
})
export class ProfileComponent {
  readonly auth          = inject(AuthService);
  readonly trip          = inject(TripService);
  readonly homeAddress   = inject(HomeAddressService);
  readonly autoSave      = inject(AutoSaveService);

  close          = output<void>();
  openAiPlanning = output<void>();

  // ── Edit account accordion ──────────────────────────────────
  editSection       = signal<'name' | 'password' | 'countryOfResidence' | null>(null);
  editDisplayName   = signal(this.auth.currentUser()?.name ?? '');
  editCurrentPwd    = signal('');
  editNewPwd        = signal('');
  editConfirmPwd    = signal('');
  editLoading       = signal(false);
  editSavedTab      = signal<'name' | 'password' | 'countryOfResidence' | null>(null);
  editError         = signal('');
  editErrorCode     = signal<string>('');
  editErrorContext  = signal<'name' | 'password' | 'countryOfResidence' | ''>('');
  editShowCurrentPwd  = signal(false);
  editShowNewPwd      = signal(false);
  editShowConfirmPwd  = signal(false);
  editCountryOfResidence = signal<string | null>(this.homeAddress.countryCode());

  readonly sinDefinir = $localize`:@@profile.countryOfResidenceSub:Sin definir`;

  readonly countryOfResidenceLabel = computed(() => {
    const code = this.homeAddress.countryCode();
    if (!code) return '';
    return WORLD_COUNTRIES.find((c: Country) => c.code === code)?.name ?? code;
  });

  readonly editPasswordsMatch = computed(() =>
    !this.editConfirmPwd() || this.editNewPwd() === this.editConfirmPwd()
  );

  readonly editPasswordStrength = computed(() => computePasswordStrength(this.editNewPwd()));

  readonly editStrengthColor = computed(() => passwordStrengthColor(this.editPasswordStrength()));

  editStrengthBarActive(index: number): boolean {
    return isPasswordStrengthBarActive(this.editPasswordStrength(), index);
  }

  editStrengthLabel(): string {
    switch (this.editPasswordStrength()) {
      case 'vulnerable': return $localize`:@@profile.strengthVulnerable:Vulnerable`;
      case 'light':      return $localize`:@@profile.strengthLight:Moderada`;
      case 'strong':     return $localize`:@@profile.strengthStrong:Fuerte`;
      default:           return '';
    }
  }

  private editSavedTimer: ReturnType<typeof setTimeout> | null = null;

  toggleEditSection(section: 'name' | 'password' | 'countryOfResidence'): void {
    this.editSection.update(cur => cur === section ? null : section);
    this.editError.set('');
    this.editErrorCode.set('');
    this.editErrorContext.set('');
    if (section === 'countryOfResidence') this.editCountryOfResidence.set(this.homeAddress.countryCode());
  }

  editSaveName(): void {
    const name = this.editDisplayName().trim();
    if (!name) { this.editError.set($localize`:@@profile.errNameEmpty:El nombre no puede estar vacío.`); return; }
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

  editUpdatePassword(): void {
    if (!this.editPasswordsMatch()) { this.editError.set($localize`:@@profile.errPasswordsMismatch:Las contraseñas no coinciden.`); return; }
    if (this.editNewPwd().length < 6) { this.editError.set($localize`:@@profile.errPasswordTooShort:La contraseña debe tener al menos 6 caracteres.`); return; }
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

  readonly editCountryOfResidenceChanged = computed(() =>
    !!this.editCountryOfResidence() && this.editCountryOfResidence() !== this.homeAddress.countryCode()
  );

  editSaveCountryOfResidence(): void {
    const code = this.editCountryOfResidence();
    if (!code) return;
    this.editLoading.set(true);
    this.editError.set('');
    this.editErrorCode.set('');
    this.editErrorContext.set('');
    this.homeAddress.save(code).subscribe({
      next: () => { this.editLoading.set(false); this.editMarkSaved('countryOfResidence'); },
      error: (err: unknown) => {
        this.editErrorCode.set((err as any)?.code ?? 'UNKNOWN');
        this.editErrorContext.set('countryOfResidence');
        this.editLoading.set(false);
      },
    });
  }

  editDeleteCountryOfResidence(): void {
    this.editLoading.set(true);
    this.editError.set('');
    this.editErrorCode.set('');
    this.editErrorContext.set('');
    this.homeAddress.clear().subscribe({
      next: () => {
        this.editLoading.set(false);
        this.editCountryOfResidence.set(null);
        this.editMarkSaved('countryOfResidence');
      },
      error: (err: unknown) => {
        this.editErrorCode.set((err as any)?.code ?? 'UNKNOWN');
        this.editErrorContext.set('countryOfResidence');
        this.editLoading.set(false);
      },
    });
  }

  private editMarkSaved(tab: 'name' | 'password' | 'countryOfResidence', onComplete?: () => void): void {
    if (this.editSavedTimer) clearTimeout(this.editSavedTimer);
    this.editSavedTab.set(tab);
    this.editSavedTimer = setTimeout(() => { this.editSavedTab.set(null); onComplete?.(); }, 2500);
  }

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
}
