import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

import { SpielStore } from './core/spiel/spiel-store';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/spielen/spielen-seite').then((m) => m.SpielenSeite),
    title: 'Wildcast',
  },
  { path: 'spielen', redirectTo: '' },
  {
    path: 'varianten',
    loadComponent: () => import('./pages/varianten/varianten-seite').then((m) => m.VariantenSeite),
    title: 'Spielvarianten · Wildcast',
  },
  {
    path: 'einstellungen',
    loadComponent: () =>
      import('./pages/einstellungen/einstellungen-seite').then((m) => m.EinstellungenSeite),
    title: 'Einstellungen · Wildcast',
  },
  {
    path: 'neu/:varianten',
    loadComponent: () => import('./pages/einrichten/einrichten').then((m) => m.Einrichten),
    title: 'Neues Spiel · Wildcast',
  },
  {
    path: 'spiel',
    // Ohne laufende Partie gibt es keinen Tisch – zurück ins Menü.
    canMatch: [() => !!inject(SpielStore).stand() || inject(Router).createUrlTree(['/'])],
    loadComponent: () => import('./pages/spiel/spiel').then((m) => m.Spiel),
    title: 'Spieltisch · Wildcast',
  },
  { path: '**', redirectTo: '' },
];
