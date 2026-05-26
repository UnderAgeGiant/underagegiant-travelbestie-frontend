import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, from } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MockUser, DEMO_USERS } from '../../mock/users.mock';

export interface AuthUser {
  name: string;
  email: string;
}

const USERS_KEY   = 'tb_mock_users';
const TOKEN_KEY   = 'tb_token';
const SESSION_KEY = 'tb_session_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private _token = signal<string | null>(sessionStorage.getItem(TOKEN_KEY));
  private _user  = signal<AuthUser | null>(null);

  readonly token      = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => this._token() !== null);

  constructor() {
    // Purge any stale localStorage session data left from before this change.
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);

    // Token and user now live in sessionStorage — auto-cleared when the tab closes,
    // so every new browser session starts logged out.
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw && this._token()) {
      try { this._user.set(JSON.parse(raw)); } catch { /* ignore */ }
    }

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
    return from(this.encryptPayload({ email, password })).pipe(
      switchMap(body => this.http.post<{ token: string; user: AuthUser }>(
        `${environment.apiUrl}/auth/login`, body
      )),
      tap(res => this.persistSession(res.token, res.user))
    );
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
    return from(this.encryptPayload({ name, email, password })).pipe(
      switchMap(body => this.http.post<{ token: string; user: AuthUser }>(
        `${environment.apiUrl}/auth/register`, body
      )),
      tap(res => this.persistSession(res.token, res.user))
    );
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  // Encrypts plaintext credentials with the RSA public key (JWK) stored in environment.
  // Returns { encryptedPayload: base64 } — the shape expected by /auth/login and /auth/register.
  private async encryptPayload(plaintext: object): Promise<{ encryptedPayload: string }> {
    if (!environment.rsaPublicKey) {
      throw new Error('La clave pública RSA no está configurada. Contacta al administrador.');
    }

    let spkiDer: Uint8Array;
    try {
      spkiDer = Uint8Array.from(atob(environment.rsaPublicKey), c => c.charCodeAt(0));
    } catch {
      throw new Error('La clave pública RSA tiene un formato inválido.');
    }

    let key: CryptoKey;
    try {
      key = await crypto.subtle.importKey(
        'spki', spkiDer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false, ['encrypt']
      );
    } catch {
      throw new Error('No se pudo importar la clave pública RSA. Verifica que sea SPKI/base64.');
    }

    try {
      const buf = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        key,
        new TextEncoder().encode(JSON.stringify(plaintext))
      );
      return { encryptedPayload: btoa(String.fromCharCode(...new Uint8Array(buf))) };
    } catch {
      throw new Error('Error al cifrar las credenciales. Intenta de nuevo.');
    }
  }

  private mockSession(name: string, email: string): { token: string; user: AuthUser } {
    const token = `mock_${Date.now()}`;
    const user: AuthUser = { name, email };
    this.persistSession(token, user);
    return { token, user };
  }

  private persistSession(token: string, user: AuthUser): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }

  private getStoredUsers(): MockUser[] {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]'); } catch { return []; }
  }
}
