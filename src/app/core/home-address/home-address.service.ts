import { Injectable, inject, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class HomeAddressService {
  private readonly auth = inject(AuthService);

  readonly countryCode = computed(() => this.auth.currentUser()?.countryOfResidence ?? null);

  save(countryCode: string): Observable<{ user: { countryOfResidence?: string | null } }> {
    return this.auth.updateProfile({ countryOfResidence: countryCode });
  }
}
