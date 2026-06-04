import {
  ChangeDetectionStrategy, Component, effect, inject, signal,
} from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileModalService } from '../../core/profile/profile-modal.service';

@Component({
  selector: 'tb-profile-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
@if (modal.isOpen()) {
<div class="modal-backdrop" (click)="onBackdropClick($event)">
  <div class="modal" style="max-width:440px">

    <!-- Header -->
    <div class="modal-head" style="background:linear-gradient(135deg,var(--lav),var(--peach));position:relative">
      <button type="button"
              style="position:absolute;top:10px;right:12px;background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:16px;line-height:1;padding:5px 8px;border-radius:8px;cursor:pointer"
              (click)="modal.close()">✕</button>
      <div class="modal-title" i18n="@@profile.title">Editar perfil</div>
      <div class="modal-sub" i18n="@@profile.subtitle">Actualiza tu información de cuenta</div>
    </div>

    <!-- Tab selector -->
    <div class="profile-tabs">
      <button class="profile-tab" [class.active]="activeTab() === 'name'"
              (click)="selectTab('name')" i18n="@@profile.tabName">Nombre</button>
      <button class="profile-tab" [class.active]="activeTab() === 'email'"
              (click)="selectTab('email')" i18n="@@profile.tabEmail">Correo</button>
      <button class="profile-tab" [class.active]="activeTab() === 'password'"
              (click)="selectTab('password')" i18n="@@profile.tabPassword">Contraseña</button>
    </div>

    <!-- Feedback messages -->
    @if (successMessage()) {
      <div class="profile-success">{{ successMessage() }}</div>
    }
    @if (errorMessage()) {
      <div class="profile-error">{{ errorMessage() }}</div>
    }

    <!-- Body -->
    <div class="modal-body">

      @if (activeTab() === 'name') {
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label" i18n="@@profile.nameLabel">Nombre para mostrar</label>
          <input class="form-input"
                 i18n-placeholder="@@profile.namePlaceholder" placeholder="Tu nombre"
                 [value]="displayName()"
                 (input)="displayName.set($any($event.target).value)" />
        </div>
      }

      @if (activeTab() === 'email') {
        @if (!emailOtpSent()) {
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label" i18n="@@profile.newEmailLabel">Nueva dirección de correo</label>
            <input class="form-input" type="email"
                   i18n-placeholder="@@profile.newEmailPlaceholder" placeholder="nuevo@correo.com"
                   [value]="newEmail()"
                   (input)="newEmail.set($any($event.target).value)" />
          </div>
        } @else {
          <div style="text-align:center;padding:8px 0 4px">
            <div style="font-size:28px">📧</div>
            <div style="font-size:13px;font-weight:600;color:var(--t1);margin-top:6px"
                 i18n="@@profile.otpSentTitle">Revisa tu correo</div>
            <div style="font-size:12px;color:var(--t3);margin-top:3px">
              <ng-container i18n="@@profile.otpSentTo">Código enviado a </ng-container>
              <strong>{{ newEmail() }}</strong>
            </div>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label" i18n="@@profile.otpLabel">Código de verificación</label>
            <input class="form-input" type="text" inputmode="numeric" maxlength="6"
                   i18n-placeholder="@@profile.otpPlaceholder" placeholder="000000"
                   [value]="emailOtp()"
                   (input)="emailOtp.set($any($event.target).value)" />
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px">
            <span style="color:var(--lav-d);cursor:pointer"
                  (click)="emailOtpSent.set(false)"
                  i18n="@@profile.otpBack">← Cambiar correo</span>
            <span style="color:var(--lav-d);cursor:pointer"
                  (click)="requestEmailOtp()"
                  i18n="@@profile.otpResend">Reenviar código</span>
          </div>
        }
      }

      @if (activeTab() === 'password') {
        <div class="form-group">
          <label class="form-label" i18n="@@profile.currentPasswordLabel">Contraseña actual</label>
          <input class="form-input" type="password" placeholder="••••••••"
                 [value]="currentPassword()"
                 (input)="currentPassword.set($any($event.target).value)" />
        </div>
        <div class="form-group">
          <label class="form-label" i18n="@@profile.newPasswordLabel">Nueva contraseña</label>
          <input class="form-input" type="password" placeholder="••••••••"
                 [value]="newPassword()"
                 (input)="newPassword.set($any($event.target).value)" />
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label" i18n="@@profile.confirmPasswordLabel">Confirmar contraseña</label>
          <input class="form-input" type="password" placeholder="••••••••"
                 [value]="confirmPassword()"
                 (input)="confirmPassword.set($any($event.target).value)" />
        </div>
      }

    </div>

    <!-- Footer -->
    <div class="modal-foot">
      <div style="display:flex;gap:8px;width:100%">
        <button class="btn-pill btn-outline" (click)="modal.close()" style="flex:1"
                i18n="@@profile.cancelBtn">Cancelar</button>

        @if (activeTab() === 'name') {
          <button class="btn-pill btn-primary" (click)="saveName()"
                  [disabled]="loading()"
                  [style.opacity]="loading() ? '0.5' : '1'"
                  style="flex:2" i18n="@@profile.saveNameBtn">
            {{ loading() ? 'Guardando…' : 'Guardar nombre' }}
          </button>
        }

        @if (activeTab() === 'email' && !emailOtpSent()) {
          <button class="btn-pill btn-primary" (click)="requestEmailOtp()"
                  [disabled]="loading() || !newEmail()"
                  [style.opacity]="(loading() || !newEmail()) ? '0.5' : '1'"
                  style="flex:2" i18n="@@profile.sendOtpBtn">
            {{ loading() ? 'Enviando…' : 'Enviar código →' }}
          </button>
        }

        @if (activeTab() === 'email' && emailOtpSent()) {
          <button class="btn-pill btn-primary" (click)="updateEmail()"
                  [disabled]="loading() || emailOtp().length < 6"
                  [style.opacity]="(loading() || emailOtp().length < 6) ? '0.5' : '1'"
                  style="flex:2" i18n="@@profile.updateEmailBtn">
            {{ loading() ? 'Verificando…' : 'Actualizar correo →' }}
          </button>
        }

        @if (activeTab() === 'password') {
          <button class="btn-pill btn-primary" (click)="updatePassword()"
                  [disabled]="loading() || !currentPassword() || !newPassword() || !confirmPassword()"
                  [style.opacity]="(loading() || !currentPassword() || !newPassword() || !confirmPassword()) ? '0.5' : '1'"
                  style="flex:2" i18n="@@profile.updatePasswordBtn">
            {{ loading() ? 'Actualizando…' : 'Actualizar contraseña' }}
          </button>
        }
      </div>
    </div>

  </div>
</div>
}
  `,
})
export class ProfileModalComponent {
  protected readonly modal = inject(ProfileModalService);
  protected readonly auth  = inject(AuthService);

  protected readonly activeTab       = signal<'name' | 'email' | 'password'>('name');
  protected readonly displayName     = signal('');
  protected readonly newEmail        = signal('');
  protected readonly emailOtp        = signal('');
  protected readonly emailOtpSent    = signal(false);
  protected readonly currentPassword = signal('');
  protected readonly newPassword     = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly loading         = signal(false);
  protected readonly successMessage  = signal('');
  protected readonly errorMessage    = signal('');

  constructor() {
    effect(() => {
      if (this.modal.isOpen()) {
        this.displayName.set(this.auth.currentUser()?.name ?? '');
        this.activeTab.set('name');
        this.resetState();
      }
    }, { allowSignalWrites: true });
  }

  protected selectTab(tab: 'name' | 'email' | 'password'): void {
    this.activeTab.set(tab);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  protected saveName(): void {
    const name = this.displayName().trim();
    if (!name) { this.errorMessage.set('El nombre no puede estar vacío.'); return; }
    this.loading.set(true);
    this.errorMessage.set('');
    this.auth.updateProfile({ name }).subscribe({
      next: () => {
        this.successMessage.set('Nombre actualizado correctamente.');
        this.loading.set(false);
      },
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
        this.emailOtpSent.set(true);
        this.loading.set(false);
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
        this.successMessage.set('Correo actualizado correctamente.');
        this.emailOtpSent.set(false);
        this.emailOtp.set('');
        this.newEmail.set('');
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message ?? 'Código incorrecto. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  protected updatePassword(): void {
    if (this.newPassword() !== this.confirmPassword()) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }
    if (this.newPassword().length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    this.auth.updateProfile({
      currentPassword: this.currentPassword(),
      newPassword: this.newPassword(),
    }).subscribe({
      next: () => {
        this.successMessage.set('Contraseña actualizada correctamente.');
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message ?? 'Error al actualizar la contraseña.');
        this.loading.set(false);
      },
    });
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target !== event.currentTarget) return;
    this.modal.close();
  }

  private resetState(): void {
    this.newEmail.set('');
    this.emailOtp.set('');
    this.emailOtpSent.set(false);
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.successMessage.set('');
    this.errorMessage.set('');
    this.loading.set(false);
  }
}
