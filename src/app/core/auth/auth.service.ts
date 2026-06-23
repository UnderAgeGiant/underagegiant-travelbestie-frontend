import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, from } from 'rxjs';
import { tap, switchMap, catchError, map, finalize, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MockUser, DEMO_USERS } from '../../mock/users.mock';

export interface AuthUser {
  name: string;
  email: string;
}

const USERS_KEY   = 'tb_mock_users';
const SESSION_KEY = 'tb_session_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  // Access token lives in memory only — XSS cannot steal it.
  private _token = signal<string | null>(null);
  private _user  = signal<AuthUser | null>(null);

  readonly token       = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => this._token() !== null);

  private _proactiveTimer: ReturnType<typeof setTimeout> | null = null;
  private _refreshInFlight: Observable<boolean> | null = null;

  constructor() {
    // Purge legacy sessionStorage keys from the old implementation.
    sessionStorage.removeItem('tb_token');
    sessionStorage.removeItem('tb_session_user');
    localStorage.removeItem('tb_token');

    // Restore user display info from localStorage (not sensitive).
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try { this._user.set(JSON.parse(raw)); } catch { /* ignore */ }
    }

    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
    }

    // Silent refresh: the refresh token now lives in an HttpOnly cookie we cannot read.
    // Use the non-sensitive session marker to decide whether a session may exist, then
    // let the backend confirm via the cookie. A 401 simply leaves us logged out.
    if (localStorage.getItem(SESSION_KEY)) {
      this.refreshAccessToken().subscribe();
    }
  }

  login(email: string, password: string): Observable<{ token: string; user: AuthUser }> {
    if (environment.useMocks) {
      const users = this.getStoredUsers();
      const byEmail = users.find(u => u.email === email);
      if (!byEmail) return throwError(() => Object.assign(new Error('USER_NOT_FOUND'), { code: 'USER_NOT_FOUND' }));
      if (byEmail.password !== password) return throwError(() => Object.assign(new Error('WRONG_PASSWORD'), { code: 'WRONG_PASSWORD' }));
      return of(this.mockSession(byEmail.name, byEmail.email));
    }
    return from(this.encryptPayload({ email, password })).pipe(
      switchMap(body => this.http.post<{ token: string; user: AuthUser }>(
        `${environment.apiUrl}/auth/login`, body, { withCredentials: true },
      )),
      tap(res => this.setTokens(res.token, res.user)),
      catchError((err: unknown) => {
        const code = err instanceof HttpErrorResponse ? (err.error?.code ?? 'UNKNOWN') : 'UNKNOWN';
        return throwError(() => Object.assign(new Error(code), { code }));
      }),
    );
  }

  register(name: string, email: string, password: string, otp: string): Observable<{ token: string; user: AuthUser }> {
    if (environment.useMocks) {
      const users = this.getStoredUsers();
      if (users.some(u => u.email === email)) {
        return throwError(() => Object.assign(new Error('BAD_REQUEST'), { code: 'BAD_REQUEST' }));
      }
      users.push({ name, email, password });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return of(this.mockSession(name, email));
    }
    return from(this.encryptPayload({ name, email, password, otp })).pipe(
      switchMap(body => this.http.post<{ token: string; user: AuthUser }>(
        `${environment.apiUrl}/auth/register`, body, { withCredentials: true },
      )),
      tap(res => this.setTokens(res.token, res.user)),
      catchError((err: unknown) => {
        const code = this.classifyHttpStatus(err);
        return throwError(() => Object.assign(new Error(code), { code }));
      }),
    );
  }

  requestOtp(email: string): Observable<void> {
    if (environment.useMocks) return of(undefined);
    return this.http.post<void>(`${environment.apiUrl}/auth/request-otp`, { email }).pipe(
      catchError((err: unknown) => throwError(() => Object.assign(new Error(this.classifyHttpStatus(err)), { code: this.classifyHttpStatus(err) }))),
    );
  }

  requestProfileOtp(newEmail: string): Observable<void> {
    if (environment.useMocks) return of(undefined);
    return this.http.post<void>(`${environment.apiUrl}/auth/request-profile-otp`, { newEmail }).pipe(
      catchError((err: unknown) => throwError(() => Object.assign(new Error(this.classifyHttpStatus(err)), { code: this.classifyHttpStatus(err) }))),
    );
  }

  updateProfile(fields: {
    name?: string; newEmail?: string; otp?: string;
    currentPassword?: string; newPassword?: string;
  }): Observable<{ user: AuthUser }> {
    if (environment.useMocks) {
      const current = this._user();
      if (!current) return throwError(() => Object.assign(new Error('UNAUTHORIZED'), { code: 'UNAUTHORIZED' }));
      const updated: AuthUser = { name: fields.name ?? current.name, email: fields.newEmail ?? current.email };
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      this._user.set(updated);
      return of({ user: updated });
    }
    return from(this.encryptPayload(fields)).pipe(
      switchMap(body => this.http.put<{ user: AuthUser }>(`${environment.apiUrl}/auth/profile`, body)),
      tap(res => { localStorage.setItem(SESSION_KEY, JSON.stringify(res.user)); this._user.set(res.user); }),
      catchError((err: unknown) => throwError(() => Object.assign(new Error(this.classifyHttpStatus(err)), { code: this.classifyHttpStatus(err) }))),
    );
  }

  /** Silently rotate the refresh token (HttpOnly cookie) and restore the in-memory access token. */
  refreshAccessToken(): Observable<boolean> {
    if (this._refreshInFlight) return this._refreshInFlight;

    if (environment.useMocks) {
      // Mock mode has no cookie — treat a present session marker as "still logged in".
      if (!localStorage.getItem(SESSION_KEY)) { this.clearTokens(); return of(false); }
      this._token.set(`mock_refreshed_${Date.now()}`);
      return of(true);
    }

    this._refreshInFlight = this.http.post<{ token: string; user: AuthUser }>(
      `${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true },
    ).pipe(
      tap(res => this.setTokens(res.token, res.user)),
      map(() => true),
      catchError(() => { this.clearTokens(); return of(false); }),
      finalize(() => { this._refreshInFlight = null; }),
      shareReplay(1),
    );
    return this._refreshInFlight;
  }

  logout(): void {
    if (!environment.useMocks && localStorage.getItem(SESSION_KEY)) {
      // Fire-and-forget — the backend reads + clears the cookie; we don't block the UI.
      this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe();
    }
    this.clearTokens();
  }

  setTokens(token: string, user: AuthUser): void {
    this._token.set(token);
    this._user.set(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    this.scheduleProactiveRefresh(token);
  }

  clearTokens(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(SESSION_KEY);
    if (this._proactiveTimer !== null) {
      clearTimeout(this._proactiveTimer);
      this._proactiveTimer = null;
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /** Schedule a silent refresh 60 s before the JWT's exp claim. */
  private scheduleProactiveRefresh(token: string): void {
    if (this._proactiveTimer !== null) clearTimeout(this._proactiveTimer);
    const exp = this.getTokenExp(token);
    if (!exp) return;
    const msUntilRefresh = (exp * 1000) - Date.now() - 60_000;
    if (msUntilRefresh <= 0) { this.refreshAccessToken().subscribe(); return; }
    this._proactiveTimer = setTimeout(() => this.refreshAccessToken().subscribe(), msUntilRefresh);
  }

  private getTokenExp(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return typeof payload.exp === 'number' ? payload.exp : null;
    } catch { return null; }
  }

  private mockSession(name: string, email: string): { token: string; user: AuthUser } {
    const token = `mock_${Date.now()}`;
    const user: AuthUser = { name, email };
    this.setTokens(token, user);
    return { token, user };
  }

  private classifyHttpStatus(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 429) return 'RATE_LIMITED';
      if (err.status === 401) return 'UNAUTHORIZED';
      if (err.status === 400) return 'BAD_REQUEST';
    }
    return 'UNKNOWN';
  }

  private async encryptPayload(plaintext: object): Promise<{ encryptedPayload: string }> {
    if (!environment.rsaPublicKey) throw new Error('La clave pública RSA no está configurada. Contacta al administrador.');
    let spkiDer: Uint8Array;
    try { spkiDer = Uint8Array.from(atob(environment.rsaPublicKey), c => c.charCodeAt(0)); }
    catch { throw new Error('La clave pública RSA tiene un formato inválido.'); }
    let key: CryptoKey;
    try { key = await crypto.subtle.importKey('spki', spkiDer, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']); }
    catch { throw new Error('No se pudo importar la clave pública RSA. Verifica que sea SPKI/base64.'); }
    try {
      const buf = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(JSON.stringify(plaintext)));
      return { encryptedPayload: btoa(String.fromCharCode(...new Uint8Array(buf))) };
    } catch { throw new Error('Error al cifrar las credenciales. Intenta de nuevo.'); }
  }

  private getStoredUsers(): MockUser[] {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]'); } catch { return []; }
  }
}
