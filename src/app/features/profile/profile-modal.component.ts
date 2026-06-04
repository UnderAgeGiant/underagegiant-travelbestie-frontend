import {
  ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked,
} from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileModalService } from '../../core/profile/profile-modal.service';

type Section = 'name' | 'email' | 'password';
type SavedTab = 'name' | 'email-otp' | 'email' | 'password';

const TOGGLE_BTN = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:11px;font-weight:600;color:var(--lav-d);cursor:pointer;padding:4px 2px;line-height:1';

@Component({
  selector: 'tb-profile-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
@if (modal.isOpen()) {
<div class="modal-backdrop">
  <div class="modal" style="max-width:440px">

    <!-- Header -->
    <div class="modal-head" style="background:linear-gradient(135deg,var(--lav),var(--peach));position:relative">
      <button type="button"
              style="position:absolute;top:10px;right:12px;background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:16px;line-height:1;padding:5px 8px;border-radius:8px;cursor:pointer"
              (click)="modal.close()">✕</button>
      <div class="modal-title" i18n="@@profile.title">Editar perfil</div>
      <div class="modal-sub" i18n="@@profile.subtitle">Actualiza tu información de cuenta</div>
    </div>

    <!-- Error banner -->
    @if (errorMessage()) {
      <div class="profile-error">{{ errorMessage() }}</div>
    }

    <!-- ① Nombre ─────────────────────────────────── -->
    <button class="profile-accordion-hd" (click)="toggleSection('name')" type="button">
      <span style="font-size:17px">👤</span>
      <div style="flex:1;text-align:left">
        <div class="profile-accordion-title">Nombre</div>
        @if (openSection() !== 'name') {
          <div class="profile-accordion-sub">{{ auth.currentUser()?.name }}</div>
        }
      </div>
      @if (savedTab() === 'name') {
        <span class="profile-accordion-check">✓</span>
      } @else {
        <span class="profile-accordion-chevron">{{ openSection() === 'name' ? '▴' : '▾' }}</span>
      }
    </button>

    @if (openSection() === 'name') {
      <div class="profile-accordion-bd">
        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label" i18n="@@profile.nameLabel">Nombre para mostrar</label>
          <input class="form-input"
                 i18n-placeholder="@@profile.namePlaceholder" placeholder="Tu nombre"
                 [value]="displayName()"
                 (input)="displayName.set($any($event.target).value)" />
        </div>
        <button class="btn-pill btn-primary"
                style="width:100%;justify-content:center"
                (click)="saveName()" [disabled]="loading()"
                [style.opacity]="loading() ? '0.5' : '1'"
                [style.background]="savedTab() === 'name' ? 'oklch(50% 0.16 145)' : ''"
                [style.border-color]="savedTab() === 'name' ? 'oklch(50% 0.16 145)' : ''">
          @if (loading()) {
            <span class="btn-spinner"></span> Guardando…
          } @else if (savedTab() === 'name') {
            ✓ Guardado
          } @else {
            Guardar nombre
          }
        </button>
      </div>
    }

    <div class="profile-accordion-sep"></div>

    <!-- ② Correo ─────────────────────────────────── -->
    <button class="profile-accordion-hd" (click)="toggleSection('email')" type="button">
      <span style="font-size:17px">✉️</span>
      <div style="flex:1;text-align:left">
        <div class="profile-accordion-title">Correo electrónico</div>
        @if (openSection() !== 'email') {
          <div class="profile-accordion-sub">{{ auth.currentUser()?.email }}</div>
        }
      </div>
      @if (savedTab() === 'email') {
        <span class="profile-accordion-check">✓</span>
      } @else {
        <span class="profile-accordion-chevron">{{ openSection() === 'email' ? '▴' : '▾' }}</span>
      }
    </button>

    @if (openSection() === 'email') {
      <div class="profile-accordion-bd">
        @if (!emailOtpSent()) {
          <div class="form-group" style="margin-bottom:14px">
            <label class="form-label" i18n="@@profile.newEmailLabel">Nueva dirección de correo</label>
            <input class="form-input" type="email"
                   i18n-placeholder="@@profile.newEmailPlaceholder" placeholder="nuevo@correo.com"
                   [value]="newEmail()"
                   (input)="newEmail.set($any($event.target).value)" />
          </div>
          <button class="btn-pill btn-primary"
                  style="width:100%;justify-content:center"
                  (click)="requestEmailOtp()"
                  [disabled]="loading() || (savedTab() !== 'email-otp' && !newEmail())"
                  [style.opacity]="loading() ? '0.5' : (savedTab() !== 'email-otp' && !newEmail()) ? '0.5' : '1'"
                  [style.background]="savedTab() === 'email-otp' ? 'oklch(50% 0.16 145)' : ''"
                  [style.border-color]="savedTab() === 'email-otp' ? 'oklch(50% 0.16 145)' : ''">
            @if (loading()) {
              <span class="btn-spinner"></span> Enviando…
            } @else if (savedTab() === 'email-otp') {
              ✓ Enviado
            } @else {
              Enviar código →
            }
          </button>
        } @else {
          <div style="text-align:center;padding:4px 0 12px">
            <div style="font-size:28px">📧</div>
            <div style="font-size:13px;font-weight:600;color:var(--t1);margin-top:6px"
                 i18n="@@profile.otpSentTitle">Revisa tu correo</div>
            <div style="font-size:12px;color:var(--t3);margin-top:3px">
              <ng-container i18n="@@profile.otpSentTo">Código enviado a </ng-container>
              <strong>{{ newEmail() }}</strong>
            </div>
          </div>
          <div class="form-group" style="margin-bottom:4px">
            <label class="form-label" i18n="@@profile.otpLabel">Código de verificación</label>
            <input class="form-input" type="text" inputmode="numeric" maxlength="6"
                   i18n-placeholder="@@profile.otpPlaceholder" placeholder="000000"
                   [value]="emailOtp()"
                   (input)="emailOtp.set($any($event.target).value)" />
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:14px;font-size:11px">
            <span style="color:var(--lav-d);cursor:pointer"
                  (click)="emailOtpSent.set(false)"
                  i18n="@@profile.otpBack">← Cambiar correo</span>
            <span style="color:var(--lav-d);cursor:pointer"
                  (click)="requestEmailOtp()"
                  i18n="@@profile.otpResend">Reenviar código</span>
          </div>
          <button class="btn-pill btn-primary"
                  style="width:100%;justify-content:center"
                  (click)="updateEmail()"
                  [disabled]="loading() || (savedTab() !== 'email' && emailOtp().length < 6)"
                  [style.opacity]="loading() ? '0.5' : (savedTab() !== 'email' && emailOtp().length < 6) ? '0.5' : '1'"
                  [style.background]="savedTab() === 'email' ? 'oklch(50% 0.16 145)' : ''"
                  [style.border-color]="savedTab() === 'email' ? 'oklch(50% 0.16 145)' : ''">
            @if (loading()) {
              <span class="btn-spinner"></span> Verificando…
            } @else if (savedTab() === 'email') {
              ✓ Actualizado
            } @else {
              Actualizar correo →
            }
          </button>
        }
      </div>
    }

    <div class="profile-accordion-sep"></div>

    <!-- ③ Contraseña ─────────────────────────────── -->
    <button class="profile-accordion-hd" (click)="toggleSection('password')" type="button">
      <span style="font-size:17px">🔒</span>
      <div style="flex:1;text-align:left">
        <div class="profile-accordion-title">Contraseña</div>
        @if (openSection() !== 'password') {
          <div class="profile-accordion-sub">••••••••</div>
        }
      </div>
      @if (savedTab() === 'password') {
        <span class="profile-accordion-check">✓</span>
      } @else {
        <span class="profile-accordion-chevron">{{ openSection() === 'password' ? '▴' : '▾' }}</span>
      }
    </button>

    @if (openSection() === 'password') {
      <div class="profile-accordion-bd">
        <div class="form-group">
          <label class="form-label" i18n="@@profile.currentPasswordLabel">Contraseña actual</label>
          <div style="position:relative">
            <input class="form-input" style="padding-right:72px"
                   [type]="showCurrentPassword() ? 'text' : 'password'" placeholder="••••••••"
                   [value]="currentPassword()"
                   (input)="currentPassword.set($any($event.target).value)" />
            <button type="button" [style]="TOGGLE_BTN"
                    (click)="showCurrentPassword.set(!showCurrentPassword())">
              {{ showCurrentPassword() ? 'Ocultar' : 'Ver' }}
            </button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" i18n="@@profile.newPasswordLabel">Nueva contraseña</label>
          <div style="position:relative">
            <input class="form-input" style="padding-right:72px"
                   [type]="showNewPassword() ? 'text' : 'password'" placeholder="••••••••"
                   [value]="newPassword()"
                   (input)="newPassword.set($any($event.target).value)" />
            <button type="button" [style]="TOGGLE_BTN"
                    (click)="showNewPassword.set(!showNewPassword())">
              {{ showNewPassword() ? 'Ocultar' : 'Ver' }}
            </button>
          </div>
          @if (newPassword()) {
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
        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label" i18n="@@profile.confirmPasswordLabel">Confirmar contraseña</label>
          <div style="position:relative">
            <input class="form-input" style="padding-right:72px"
                   [type]="showConfirmPassword() ? 'text' : 'password'" placeholder="••••••••"
                   [value]="confirmPassword()"
                   (input)="confirmPassword.set($any($event.target).value)"
                   [style.border-color]="confirmPassword() && !passwordsMatch() ? 'oklch(55% 0.22 25)' : ''" />
            <button type="button" [style]="TOGGLE_BTN"
                    (click)="showConfirmPassword.set(!showConfirmPassword())">
              {{ showConfirmPassword() ? 'Ocultar' : 'Ver' }}
            </button>
          </div>
          @if (confirmPassword() && !passwordsMatch()) {
            <div style="font-size:11px;color:oklch(55% 0.22 25);margin-top:4px">
              Las contraseñas no coinciden
            </div>
          }
        </div>
        <button class="btn-pill btn-primary"
                style="width:100%;justify-content:center"
                (click)="updatePassword()"
                [disabled]="loading() || (savedTab() !== 'password' && (!currentPassword() || !newPassword() || !confirmPassword()))"
                [style.opacity]="loading() ? '0.5' : (savedTab() !== 'password' && (!currentPassword() || !newPassword() || !confirmPassword())) ? '0.5' : '1'"
                [style.background]="savedTab() === 'password' ? 'oklch(50% 0.16 145)' : ''"
                [style.border-color]="savedTab() === 'password' ? 'oklch(50% 0.16 145)' : ''">
          @if (loading()) {
            <span class="btn-spinner"></span> Actualizando…
          } @else if (savedTab() === 'password') {
            ✓ Actualizada
          } @else {
            Actualizar contraseña
          }
        </button>
      </div>
    }

    <div style="height:8px"></div>

  </div>
</div>
}
  `,
})
export class ProfileModalComponent {
  protected readonly modal = inject(ProfileModalService);
  protected readonly auth  = inject(AuthService);

  protected readonly TOGGLE_BTN = TOGGLE_BTN;

  protected readonly openSection      = signal<Section | null>(null);
  protected readonly displayName      = signal('');
  protected readonly newEmail         = signal('');
  protected readonly emailOtp         = signal('');
  protected readonly emailOtpSent     = signal(false);
  protected readonly currentPassword  = signal('');
  protected readonly newPassword      = signal('');
  protected readonly confirmPassword  = signal('');
  protected readonly loading              = signal(false);
  protected readonly savedTab             = signal<SavedTab | null>(null);
  protected readonly errorMessage         = signal('');
  protected readonly showCurrentPassword  = signal(false);
  protected readonly showNewPassword      = signal(false);
  protected readonly showConfirmPassword  = signal(false);

  protected readonly passwordsMatch = computed(() =>
    !this.confirmPassword() || this.newPassword() === this.confirmPassword()
  );

  protected readonly passwordStrength = computed((): 'none' | 'vulnerable' | 'light' | 'strong' => {
    const p = this.newPassword();
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

  protected readonly strengthColor = computed((): string => {
    switch (this.passwordStrength()) {
      case 'vulnerable': return 'oklch(55% 0.22 25)';
      case 'light':      return 'oklch(62% 0.14 60)';
      case 'strong':     return 'oklch(50% 0.16 145)';
      default:           return 'var(--t3)';
    }
  });

  protected strengthBarActive(index: number): boolean {
    switch (this.passwordStrength()) {
      case 'vulnerable': return index === 0;
      case 'light':      return index <= 1;
      case 'strong':     return true;
      default:           return false;
    }
  }

  protected strengthLabel(): string {
    switch (this.passwordStrength()) {
      case 'vulnerable': return 'Vulnerable';
      case 'light':      return 'Moderada';
      case 'strong':     return 'Fuerte';
      default:           return '';
    }
  }

  private savedTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (this.modal.isOpen()) {
        this.displayName.set(untracked(() => this.auth.currentUser()?.name ?? ''));
        this.resetState();
      }
    }, { allowSignalWrites: true });
  }

  protected toggleSection(section: Section): void {
    this.openSection.update(cur => cur === section ? null : section);
    this.errorMessage.set('');
  }

  protected saveName(): void {
    const name = this.displayName().trim();
    if (!name) { this.errorMessage.set('El nombre no puede estar vacío.'); return; }
    this.loading.set(true);
    this.errorMessage.set('');
    this.auth.updateProfile({ name }).subscribe({
      next: () => { this.loading.set(false); this.markSaved('name'); },
      error: (err: Error) => {
        this.errorMessage.set(err.message ?? 'Error al actualizar el nombre.');
        this.loading.set(false);
      },
    });
  }

  protected requestEmailOtp(): void {
    const email = this.newEmail().trim();
    if (!email) { this.errorMessage.set('Ingresa la nueva dirección de correo.'); return; }
    this.loading.set(true);
    this.errorMessage.set('');
    this.auth.requestProfileOtp(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.markSaved('email-otp', () => { this.emailOtpSent.set(true); });
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message ?? 'Error al enviar el código. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  protected updateEmail(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.auth.updateProfile({ newEmail: this.newEmail().trim(), otp: this.emailOtp() }).subscribe({
      next: () => {
        this.loading.set(false);
        this.markSaved('email', () => {
          this.emailOtpSent.set(false);
          this.emailOtp.set('');
          this.newEmail.set('');
        });
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message ?? 'Código incorrecto. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  protected updatePassword(): void {
    if (!this.passwordsMatch()) { this.errorMessage.set('Las contraseñas no coinciden.'); return; }
    if (this.newPassword().length < 6) { this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.'); return; }
    this.loading.set(true);
    this.errorMessage.set('');
    this.auth.updateProfile({
      currentPassword: this.currentPassword(),
      newPassword: this.newPassword(),
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
        this.markSaved('password');
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message ?? 'Error al actualizar la contraseña.');
        this.loading.set(false);
      },
    });
  }

  private markSaved(tab: SavedTab, onComplete?: () => void): void {
    if (this.savedTimer) clearTimeout(this.savedTimer);
    this.savedTab.set(tab);
    this.savedTimer = setTimeout(() => {
      this.savedTab.set(null);
      onComplete?.();
    }, 2500);
  }

  private resetState(): void {
    if (this.savedTimer) { clearTimeout(this.savedTimer); this.savedTimer = null; }
    this.openSection.set(null);
    this.newEmail.set('');
    this.emailOtp.set('');
    this.emailOtpSent.set(false);
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.showCurrentPassword.set(false);
    this.showNewPassword.set(false);
    this.showConfirmPassword.set(false);
    this.errorMessage.set('');
    this.savedTab.set(null);
    this.loading.set(false);
  }
}
