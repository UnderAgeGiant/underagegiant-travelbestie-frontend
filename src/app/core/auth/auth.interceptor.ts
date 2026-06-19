import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.token();

  // Never add auth header to the refresh endpoint — it uses the refresh token body.
  const isRefreshCall = req.url.includes('/auth/refresh');
  const authReq = (token && !isRefreshCall)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        token &&                // we had a token — it expired
        !isRefreshCall          // don't retry a failed refresh itself
      ) {
        return auth.refreshAccessToken().pipe(
          switchMap(success => {
            if (!success) return throwError(() => err);
            const newToken = auth.token();
            const retried = newToken
              ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
              : req;
            return next(retried);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
