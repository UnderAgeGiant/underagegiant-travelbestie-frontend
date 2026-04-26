import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  name: string;
  email: string;
}

interface MockUser {
  name: string;
  email: string;
  password: string;
}

const DEMO_USERS: MockUser[] = [
  { name: 'Sofía García',   email: 'sofia@demo.com',   password: 'demo1234' },
  { name: 'Matías Fuentes', email: 'matias@demo.com',  password: 'demo1234' },
];

const USERS_KEY   = 'tb_mock_users';
const TOKEN_KEY   = 'tb_token';
const SESSION_KEY = 'tb_session_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _user  = signal<AuthUser | null>(null);

  readonly token      = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => this._token() !== null);

  constructor() {
    // Restore session user on page refresh
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw && this._token()) {
      try { this._user.set(JSON.parse(raw)); } catch { /* ignore */ }
    }

    // Seed demo users if not yet stored
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
    }
  }

  login(email: string, password: string): Observable<{ token: string; user: AuthUser }> {
    if (environment.useMocks) {
      const users = this.getStoredUsers();
      const match = users.find(u => u.email === email && u.password === password);
      if (!match) return throwError(() => new Error('Correo o contraseña incorrectos'));
      return of(this.mockSession(match.name, match.email));
    }
    return this.http.post<{ token: string; user: AuthUser }>(
      `${environment.apiUrl}/auth/login`, { email, password }
    ).pipe(tap(res => this.persistSession(res.token, res.user)));
  }

  register(name: string, email: string, password: string): Observable<{ token: string; user: AuthUser }> {
    if (environment.useMocks) {
      const users = this.getStoredUsers();
      if (users.some(u => u.email === email)) {
        return throwError(() => new Error('Ese correo ya está registrado'));
      }
      users.push({ name, email, password });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return of(this.mockSession(name, email));
    }
    return this.http.post<{ token: string; user: AuthUser }>(
      `${environment.apiUrl}/auth/register`, { name, email, password }
    ).pipe(tap(res => this.persistSession(res.token, res.user)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  private mockSession(name: string, email: string): { token: string; user: AuthUser } {
    const token = `mock_${Date.now()}`;
    const user: AuthUser = { name, email };
    this.persistSession(token, user);
    return { token, user };
  }

  private persistSession(token: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }

  private getStoredUsers(): MockUser[] {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]'); } catch { return []; }
  }
}
