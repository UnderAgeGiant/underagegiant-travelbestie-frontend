import { Routes } from '@angular/router';

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
    path: 'shared/:id',
    loadComponent: () => import('./features/shared-trip/shared-trip.component').then(m => m.SharedTripComponent),
  },
  { path: '**', redirectTo: '' },
];
