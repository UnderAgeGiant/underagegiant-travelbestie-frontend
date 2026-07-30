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
    path: 'shared/:id',
    loadComponent: () => import('./features/shared-trip/shared-trip.component').then(m => m.SharedTripComponent),
  },
  { path: '**', redirectTo: '' },
];
