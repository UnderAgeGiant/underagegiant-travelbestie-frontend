import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsCL from '@angular/common/locales/es-CL';
import localeEnUS from '@angular/common/locales/en';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';

registerLocaleData(localeEsCL, 'es-CL');
registerLocaleData(localeEnUS, 'en-US');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
