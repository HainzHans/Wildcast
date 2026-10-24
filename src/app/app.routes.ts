import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

import { SpielStore } from './core/spiel/spiel-store';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/start/start').then((m) => m.Start),
    title: 'Wildcast',
  },
  {
    path: 'neu/:variante',
    loadComponent: () => import('./pages/einrichten/einrichten').then((m) => m.Einrichten),
    title: 'Neues Spiel · Wildcast',
  },
  {
    path: 'spiel',
    // Ohne laufende Partie gibt es keinen Tisch – zurück zur Auswahl.
    canMatch: [() => !!inject(SpielStore).stand() || inject(Router).createUrlTree(['/'])],
    loadComponent: () => import('./pages/spiel/spiel').then((m) => m.Spiel),
    title: 'Spieltisch · Wildcast',
  },
  { path: '**', redirectTo: '' },
];
