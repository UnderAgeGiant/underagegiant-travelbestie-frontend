import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { aboutSeo, karmaHistorySeo, notFoundSeo, privacySeo, sharedPendingSeo, termsSeo } from './core/seo/seo-pages';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/shell/shell.component').then(m => m.ShellComponent),
  },
  {
    path: 'about',
    data: { seo: aboutSeo },
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
  },
  {
    path: 'terms',
    data: { seo: termsSeo },
    loadComponent: () => import('./features/legal/terms.component').then(m => m.TermsComponent),
  },
  {
    path: 'privacy',
    data: { seo: privacySeo },
    loadComponent: () => import('./features/legal/privacy.component').then(m => m.PrivacyComponent),
  },
  {
    path: 'karma-history',
    canActivate: [authGuard],
    data: { seo: karmaHistorySeo },
    loadComponent: () => import('./features/karma-history/karma-history.component').then(m => m.KarmaHistoryComponent),
  },
  {
    path: 'shared/:id',
    data: { seo: sharedPendingSeo },
    loadComponent: () => import('./features/shared-trip/shared-trip.component').then(m => m.SharedTripComponent),
  },
  {
    path: '**',
    data: { seo: notFoundSeo },
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
