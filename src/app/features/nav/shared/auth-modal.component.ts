import { Component, inject, signal, computed, effect } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthModalService } from '../../../core/auth/auth-modal.service';
import { TripService } from '../../trip/trip.service';
import { KarmaService } from '../../../core/karma/karma.service';
import { SavedPlansService } from '../../../core/saved-plans/saved-plans.service';
import { VisitedPlacesService } from '../../../core/visited-places/visited-places.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-auth-modal',
  imports: [],
  template: `
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
export class AuthModalComponent {
  readonly auth      = inject(AuthService);
  readonly authModal = inject(AuthModalService);
  private readonly trip       = inject(TripService);
  private readonly karma      = inject(KarmaService);
  private readonly savedPlans = inject(SavedPlansService);
  private readonly visited    = inject(VisitedPlacesService);

  // auth form signals
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

  // register-success overlay
  registerSuccessOpen = signal(false);
  registerSuccessName = signal('');

  // captcha / otp
  captchaToken = signal('');
  otpStep        = signal(false);
  otpCode        = signal('');
  otpLoading     = signal(false);
  registerLoading = signal(false);

  private readonly turnstileWidgetId = signal<string | null>(null);
  private initAttempts = 0;

  readonly isEmailValid   = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.loginEmail().trim()));
  readonly passwordsMatch = computed(() =>
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

  constructor() {
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

  dismissRegisterSuccess(): void {
    this.registerSuccessOpen.set(false);
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
}
