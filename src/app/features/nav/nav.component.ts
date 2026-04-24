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
          <input placeholder="Quick-add a city…"
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
                  <span style="margin-left:auto;font-size:11px;color:var(--lav-d);font-weight:600">+ Add</span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <div class="nav-right">
        @if (trip.stops().length > 0) {
          <span style="font-size:12px;color:var(--t3)">
            {{ trip.stops().length }} stop{{ trip.stops().length > 1 ? 's' : '' }}
          </span>
        }

        @if (!auth.isLoggedIn()) {
          <button class="btn-pill btn-ghost" (click)="showLogin.set(true)">Sign In</button>
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
                  <div class="up-title">My Account</div>
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
                  <button class="signout-btn" (click)="auth.logout(); userMenuOpen.set(false)">Sign out</button>
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
            <div class="modal-title">{{ loginMode() === 'login' ? 'Welcome back 👋' : 'Create account ✨' }}</div>
            <div class="modal-sub">{{ loginMode() === 'login' ? 'Sign in to save your trips' : 'Join to plan trips with besties' }}</div>
          </div>
          <div class="modal-body">
            @if (loginMode() === 'register') {
              <div class="form-group">
                <label class="form-label">Your name</label>
                <input class="form-input" placeholder="Sofia García"
                       [value]="loginName()"
                       (input)="loginName.set($any($event.target).value)" />
              </div>
            }
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" placeholder="you@email.com"
                     [value]="loginEmail()"
                     (input)="loginEmail.set($any($event.target).value)" />
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Password</label>
              <input class="form-input" type="password" placeholder="••••••••"
                     [value]="loginPassword()"
                     (input)="loginPassword.set($any($event.target).value)" />
            </div>
          </div>
          <div class="modal-foot" style="flex-direction:column;gap:8px">
            <div style="display:flex;gap:8px;width:100%">
              <button class="btn-pill btn-outline" (click)="showLogin.set(false)" style="flex:1">Cancel</button>
              <button class="btn-pill btn-primary" (click)="doAuth()" style="flex:2">
                {{ loginMode() === 'login' ? 'Sign In →' : 'Create Account →' }}
              </button>
            </div>
            <div class="auth-toggle">
              @if (loginMode() === 'login') {
                No account? <span (click)="loginMode.set('register')">Sign up free</span>
              } @else {
                Already have one? <span (click)="loginMode.set('login')">Sign in</span>
              }
            </div>
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

  navQuery = signal('');
  searchOpen = signal(false);
  userMenuOpen = signal(false);
  showLogin = signal(false);
  loginMode = signal<'login' | 'register'>('login');
  loginName = signal('');
  loginEmail = signal('');
  loginPassword = signal('');

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
    if (this.loginMode() === 'login') {
      this.auth.login(this.loginEmail(), this.loginPassword()).subscribe({
        next: () => this.showLogin.set(false),
        error: () => {},
      });
    } else {
      this.auth.register(this.loginName(), this.loginEmail(), this.loginPassword()).subscribe({
        next: () => this.showLogin.set(false),
        error: () => {},
      });
    }
  }
}
