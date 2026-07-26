import { HttpEvent, HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

function attach(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // Never add an auth header to the refresh endpoint — it authenticates via the HttpOnly cookie.
  const isRefreshCall = req.url.includes('/auth/refresh');

  const send = (): Observable<HttpEvent<unknown>> => {
    const token = isRefreshCall ? null : auth.token();
    return next(attach(req, token)).pipe(
      catchError((err: unknown) => {
        if (
          err instanceof HttpErrorResponse &&
          err.status === 401 &&
          token &&                // we had a token — it expired
          !isRefreshCall          // don't retry a failed refresh itself
        ) {
          return auth.refreshAccessToken().pipe(
            switchMap(success =>
              success ? next(attach(req, auth.token())) : throwError(() => err),
            ),
          );
        }
        return throwError(() => err);
      }),
    );
  };

  // Boot race (page reload): a session marker exists but the silent refresh
  // hasn't restored the in-memory token yet. Wait for it so the request
  // carries its Authorization header. refreshAccessToken() deduplicates
  // concurrent callers, and a failed refresh clears the marker, so this cannot loop.
  if (!isRefreshCall && auth.sessionMayExist()) {
    return auth.refreshAccessToken().pipe(switchMap(() => send()));
  }
  return send();
};
