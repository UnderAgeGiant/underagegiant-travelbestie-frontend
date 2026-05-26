import { Injectable, signal, inject, effect } from '@angular/core';
import { AuthService } from '../auth/auth.service';

const key = (email: string) => `tb_home_${email}`;

@Injectable({ providedIn: 'root' })
export class HomeAddressService {
  private readonly auth = inject(AuthService);
  private _address = signal('');
  readonly address = this._address.asReadonly();

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user?.email) {
        this._address.set(localStorage.getItem(key(user.email)) ?? '');
      } else {
        this._address.set('');
      }
    }, { allowSignalWrites: true });
  }

  save(email: string, address: string): void {
    this._address.set(address);
    if (address.trim()) {
      localStorage.setItem(key(email), address.trim());
    } else {
      localStorage.removeItem(key(email));
    }
  }
}
