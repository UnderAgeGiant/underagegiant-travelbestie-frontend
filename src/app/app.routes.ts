import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { aboutSeo, aiPlanningSeo, guidesSeo, karmaHistorySeo, myTripsSeo, notFoundSeo, planSeo, privacySeo, profileSeo, sharedPendingSeo, termsSeo } from './core/seo/seo-pages';
import { cityGuideSlugGuard } from './features/city-guide/city-guide.guard';
import { landingGuard } from './features/shell/landing.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [landingGuard],
    data: { mode: 'landing' },
    loadComponent: () => import('./features/shell/shell.component').then(m => m.ShellComponent),
  },
  {
    path: 'plan',
    data: { seo: planSeo, mode: 'editor' },
    loadComponent: () => import('./features/shell/shell.component').then(m => m.ShellComponent),
  },
  {
    path: 'about',
    data: { seo: aboutSeo },
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
  },
  {
    path: 'guides',
    data: { seo: guidesSeo },
    loadComponent: () => import('./features/city-guide/guides-index.component').then(m => m.GuidesIndexComponent),
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
    path: 'profile',
    canActivate: [authGuard],
    data: { seo: profileSeo },
    loadComponent: () => import('./features/profile/profile-page.component').then(m => m.ProfilePageComponent),
  },
  {
    path: 'my-trips',
    canActivate: [authGuard],
    data: { seo: myTripsSeo },
    loadComponent: () => import('./features/my-trips/my-trips-page.component').then(m => m.MyTripsPageComponent),
  },
  {
    path: 'ai-planning',
    data: { seo: aiPlanningSeo },
    loadComponent: () => import('./features/ai-planning/ai-planning-page.component').then(m => m.AiPlanningPageComponent),
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
