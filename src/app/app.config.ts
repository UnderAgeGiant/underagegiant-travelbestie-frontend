import { APP_INITIALIZER, ApplicationConfig, LOCALE_ID, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsCL from '@angular/common/locales/es-CL';
import localeEnUS from '@angular/common/locales/en';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { shareRedirectPath } from './core/routing/share-redirect.util';
import { parseMpReturnParams, stripMpReturnParams } from './core/karma/mp-return.util';
import { KarmaModalService } from './core/karma/karma-modal.service';

registerLocaleData(localeEsCL, 'es-CL');
registerLocaleData(localeEnUS, 'en-US');

function syncDocumentLang() {
  const locale = inject(LOCALE_ID);
  return () => { document.documentElement.lang = locale; };
}

function handleMpReturn() {
  const karmaModal = inject(KarmaModalService);
  return () => {
    const parsed = parseMpReturnParams(window.location.search);
    if (!parsed) return;
    const newSearch = stripMpReturnParams(window.location.search);
    window.history.replaceState({}, '', window.location.pathname + newSearch);
    karmaModal.openMpConfirmation(parsed.purchaseRef, parsed.status);
  };
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
    {
      provide: APP_INITIALIZER,
      useFactory: handleMpReturn,
      multi: true,
    },
  ],
};
