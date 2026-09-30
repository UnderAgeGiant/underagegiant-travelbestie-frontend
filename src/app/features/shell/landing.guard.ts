import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TripService } from '../trip/trip.service';

/**
 * Feature 68. A returning visitor who opens tripilove.com with a trip in progress lands in the editor
 * (/plan), same as before the editor had its own URL. Only on the FIRST navigation of the session:
 * a later visit to / (browser Back from /plan, the logo) must show the landing, or Back would loop.
 * TripService restores stops synchronously in its constructor (AuthService restores the user from
 * localStorage synchronously), so stops() is already accurate here.
 */
export const landingGuard: CanActivateFn = route => {
  const router = inject(Router);
  const firstNavigation = router.lastSuccessfulNavigation() === null;
  if (!firstNavigation || route.queryParamMap.has('addCity') || inject(TripService).stops().length === 0) return true;
  return router.createUrlTree(['/plan'], { queryParams: route.queryParams });
};
