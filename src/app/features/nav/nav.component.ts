import { Component, inject, signal, computed, output } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { TripService } from '../trip/trip.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { City } from '../../core/models/city.model';

@Component({
  selector: 'app-nav',
  standalone: true,
  template: `
    <nav class="nav">
      <div class="nav-logo" (click)="logoClick.emit()">Traveling<em>Bestie</em></div>

      <div class="nav-search-wrap" style="flex:1;max-width:440px;position:relative">
        <div class="nav-search-inner">
          <span style="color:var(--t3);font-size:15px">🔍</span>
          <input i18n-placeholder="@@nav.searchPlaceholder" placeholder="Agregar ciudad…"
                 [value]="navQuery()"
                 (input)="navQuery.set($any($event.target).value); searchOpen.set(true)"
                 (focus)="searchOpen.set(true)"
                 (blur)="scheduleClose()" />
        </div>
        @if (searchOpen() && navFiltered().length > 0) {
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
            </div>
          </div>
        }
      </div>

      <div class="nav-right">
        @if (trip.stops().length > 0) {
          <span style="font-size:12px;color:var(--t3)">
            {{ trip.stops().length }}
            @if (trip.stops().length === 1) {
              <ng-container i18n="@@nav.oneStop">parada</ng-container>
            } @else {
              <ng-container i18n="@@nav.manyStops">paradas</ng-container>
            }
          </span>
        }

        @if (!auth.isLoggedIn()) {
          <button class="btn-pill btn-ghost" (click)="showLogin.set(true)" i18n="@@nav.signInBtn">Iniciar sesión</button>
        } @else {
          <div style="position:relative">
            <button class="user-btn" (click)="toggleUserMenu()">
              <div class="user-avatar">{{ initials() }}</div>
              <span class="user-btn-name">{{ auth.currentUser()?.name }}</span>
              <span style="font-size:10px;color:var(--t3)">▾</span>
            </button>
            @if (userMenuOpen()) {
              <div class="user-panel" style="position:absolute;top:calc(100% + 10px);right:0;min-width:200px">
                <div class="user-panel-head">
                  <div class="up-title" i18n="@@nav.myAccount">Mi cuenta</div>
                  <div class="up-sub">{{ auth.currentUser()?.email }}</div>
                </div>
                <div class="up-body">
                  <div class="profile-card">
                    <div class="profile-av">{{ initials() }}</div>
                    <div>
                      <div class="profile-name">{{ auth.currentUser()?.name }}</div>
                      <div class="profile-email">{{ auth.currentUser()?.email }}</div>
                    </div>
                  </div>
                  <button class="signout-btn" (click)="doLogout()" i18n="@@nav.signOut">Cerrar sesión</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </nav>

    @if (showLogin()) {
      <div class="modal-backdrop" (click)="$event.target === $event.currentTarget && showLogin.set(false)">
        <div class="modal">
          <div class="modal-head"
               [style.background]="loginMode() === 'login'
                 ? 'linear-gradient(135deg,var(--lav),var(--peach))'
                 : 'linear-gradient(135deg,var(--mint),var(--sky))'">
            @if (loginMode() === 'login') {
              <div class="modal-title" i18n="@@nav.loginTitle">¡Bienvenido de vuelta! 👋</div>
              <div class="modal-sub" i18n="@@nav.loginSubtitle">Inicia sesión para guardar tus viajes</div>
            } @else {
              <div class="modal-title" i18n="@@nav.registerTitle">Crear cuenta ✨</div>
              <div class="modal-sub" i18n="@@nav.registerSubtitle">Únete y planifica viajes con tus amigos</div>
            }
          </div>
          <div class="modal-body">
            @if (loginMode() === 'register') {
              <div class="form-group">
                <label class="form-label" i18n="@@nav.nameLabel">Tu nombre</label>
                <input class="form-input"
                       i18n-placeholder="@@nav.namePlaceholder" placeholder="Sofía García"
                       [value]="loginName()"
                       (input)="loginName.set($any($event.target).value)" />
              </div>
            }
            <div class="form-group">
              <label class="form-label" i18n="@@nav.emailLabel">Correo electrónico</label>
              <input class="form-input" type="email"
                     i18n-placeholder="@@nav.emailPlaceholder" placeholder="tú@correo.com"
                     [value]="loginEmail()"
                     (input)="loginEmail.set($any($event.target).value)" />
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label" i18n="@@nav.passwordLabel">Contraseña</label>
              <input class="form-input" type="password" placeholder="••••••••"
                     [value]="loginPassword()"
                     (input)="loginPassword.set($any($event.target).value)" />
            </div>
          </div>
          <div class="modal-foot" style="flex-direction:column;gap:8px">
            <div style="display:flex;gap:8px;width:100%">
              <button class="btn-pill btn-outline" (click)="showLogin.set(false)" style="flex:1" i18n="@@nav.cancelBtn">Cancelar</button>
              @if (loginMode() === 'login') {
                <button class="btn-pill btn-primary" (click)="doAuth()" style="flex:2" i18n="@@nav.signInSubmit">Iniciar sesión →</button>
              } @else {
                <button class="btn-pill btn-primary" (click)="doAuth()" style="flex:2" i18n="@@nav.registerSubmit">Crear cuenta →</button>
              }
            </div>
            @if (loginError()) {
              <div style="font-size:11px;color:oklch(50% 0.18 25);text-align:center;padding:4px 8px;background:oklch(97% 0.03 25);border-radius:8px">
                ⚠ {{ loginError() }}
              </div>
            }
            <div class="auth-toggle">
              @if (loginMode() === 'login') {
                <span i18n="@@nav.authToggleLogin">¿Sin cuenta? <span (click)="loginMode.set('register'); loginError.set('')">Regístrate gratis</span></span>
              } @else {
                <span i18n="@@nav.authToggleRegister">¿Ya tienes una? <span (click)="loginMode.set('login'); loginError.set('')">Inicia sesión</span></span>
              }
            </div>
            @if (loginMode() === 'login') {
              <div style="font-size:10px;color:var(--t3);text-align:center;opacity:.7">
                Demo: sofia&#64;demo.com / demo1234
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class NavComponent {
  readonly auth = inject(AuthService);
  readonly trip = inject(TripService);

  logoClick = output<void>();

  navQuery      = signal('');
  searchOpen    = signal(false);
  userMenuOpen  = signal(false);
  showLogin     = signal(false);
  loginMode     = signal<'login' | 'register'>('login');
  loginName     = signal('');
  loginEmail    = signal('');
  loginPassword = signal('');
  loginError    = signal('');

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

  toggleUserMenu() { this.userMenuOpen.update(v => !v); }
  scheduleClose() { setTimeout(() => this.searchOpen.set(false), 160); }

  quickAdd(city: City): void {
    this.trip.addStop(city, '', '');
    this.navQuery.set('');
    this.searchOpen.set(false);
  }

  doAuth(): void {
    this.loginError.set('');
    if (this.loginMode() === 'login') {
      this.auth.login(this.loginEmail(), this.loginPassword()).subscribe({
        next: res => {
          this.trip.loadForUser(res.user.email);
          this.showLogin.set(false);
          this.loginEmail.set('');
          this.loginPassword.set('');
        },
        error: (err: Error) => this.loginError.set(err.message),
      });
    } else {
      this.auth.register(this.loginName(), this.loginEmail(), this.loginPassword()).subscribe({
        next: res => {
          this.trip.loadForUser(res.user.email);
          this.showLogin.set(false);
          this.loginName.set('');
          this.loginEmail.set('');
          this.loginPassword.set('');
        },
        error: (err: Error) => this.loginError.set(err.message),
      });
    }
  }

  doLogout(): void {
    this.trip.clearPlan();
    this.auth.logout();
    this.userMenuOpen.set(false);
  }
}
