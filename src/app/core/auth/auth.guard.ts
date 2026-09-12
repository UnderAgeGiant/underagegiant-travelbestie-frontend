import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Guards against the boot-time in-memory-token race: on a fresh page load
 * (reload, direct link, new tab) the access token is restored asynchronously
 * by AuthService's constructor. If a session marker exists but the token
 * hasn't been restored yet, wait for the in-flight/triggered refresh before
 * deciding — otherwise a genuinely logged-in user gets bounced to '/'.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return of(true);
  if (auth.sessionMayExist()) {
    return auth.refreshAccessToken().pipe(
      map(ok => ok ? true : router.createUrlTree(['/'])),
    );
  }
  return of(router.createUrlTree(['/']));
};
