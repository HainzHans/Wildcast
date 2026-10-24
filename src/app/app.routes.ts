import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/start/start').then((m) => m.Start),
    title: 'Wildcast',
  },
  { path: '**', redirectTo: '' },
];
