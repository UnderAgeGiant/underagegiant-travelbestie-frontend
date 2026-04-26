import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  private _open        = signal(false);
  private _postLogin: (() => void) | null = null;

  readonly isOpen = this._open.asReadonly();

  /** Open the login modal. If `onSuccess` is provided it runs once after a successful login. */
  openLogin(onSuccess?: () => void): void {
    this._postLogin = onSuccess ?? null;
    this._open.set(true);
  }

  close(): void {
    this._postLogin = null;
    this._open.set(false);
  }

  /** Called by NavComponent after a successful login/register. */
  executePostLogin(): void {
    const action = this._postLogin;
    this._postLogin = null;
    this._open.set(false);
    action?.();
  }
}
