import { APP_INITIALIZER, ApplicationConfig, LOCALE_ID, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsCL from '@angular/common/locales/es-CL';
import localeEnUS from '@angular/common/locales/en';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { shareRedirectPath } from './core/routing/share-redirect.util';

registerLocaleData(localeEsCL, 'es-CL');
registerLocaleData(localeEnUS, 'en-US');

function syncDocumentLang() {
  const locale = inject(LOCALE_ID);
  return () => { document.documentElement.lang = locale; };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    { provide: APP_INITIALIZER, useFactory: syncDocumentLang, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {
        const target = shareRedirectPath(window.location.search);
        if (target) window.history.replaceState({}, '', target);
      },
      multi: true,
    },
  ],
};
