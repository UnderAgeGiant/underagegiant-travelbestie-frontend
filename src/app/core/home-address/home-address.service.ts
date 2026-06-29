import { Injectable, inject, computed, effect } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

const legacyKey = (email: string) => `tb_home_${email}`;

@Injectable({ providedIn: 'root' })
export class HomeAddressService {
  private readonly auth = inject(AuthService);

  readonly address = computed(() => this.auth.currentUser()?.homeCity ?? '');

  constructor() {
    // One-time migration: if the account has no server-side home city but a legacy
    // localStorage value exists, push it up once, then drop the legacy key.
    effect(() => {
      const user = this.auth.currentUser();
      if (!user?.email) return;
      const serverValue = user.homeCity ?? '';
      if (serverValue) return;
      const legacy = localStorage.getItem(legacyKey(user.email));
      if (legacy && legacy.trim()) {
        this.save(legacy.trim()).subscribe({
          next: () => localStorage.removeItem(legacyKey(user.email)),
          error: () => { /* keep the legacy key for a future retry */ },
        });
      }
    }, { allowSignalWrites: true });
  }

  save(value: string): Observable<{ user: { homeCity?: string | null } }> {
    return this.auth.updateProfile({ homeCity: value.trim() });
  }
}
