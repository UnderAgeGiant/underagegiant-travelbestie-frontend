import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/shell/shell.component').then(m => m.ShellComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/legal/terms.component').then(m => m.TermsComponent),
  },
  {
    path: 'privacy',
    loadComponent: () => import('./features/legal/privacy.component').then(m => m.PrivacyComponent),
  },
  {
    path: 'karma-history',
    canActivate: [authGuard],
    loadComponent: () => import('./features/karma-history/karma-history.component').then(m => m.KarmaHistoryComponent),
  },
  {
    path: 'shared/:id',
    loadComponent: () => import('./features/shared-trip/shared-trip.component').then(m => m.SharedTripComponent),
  },
  { path: '**', redirectTo: '' },
];
