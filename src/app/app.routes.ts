import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { aboutSeo, karmaHistorySeo, notFoundSeo, privacySeo, sharedPendingSeo, termsSeo } from './core/seo/seo-pages';
import { cityGuideSlugGuard } from './features/city-guide/city-guide.guard';

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
    path: 'ciudad/:slug',
    canMatch: [cityGuideSlugGuard],
    data: { seoManaged: true },
    loadComponent: () => import('./features/city-guide/city-guide.component').then(m => m.CityGuideComponent),
  },
  {
    path: '**',
    data: { seo: notFoundSeo },
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
