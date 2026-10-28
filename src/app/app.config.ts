import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { EffektArchiv } from './varianten/mana-wuerfel/effekt-archiv';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    // Archiv im Hintergrund nachladen; die App startet sofort mit dem Zwischenspeicher.
    provideAppInitializer(() => void inject(EffektArchiv).aktualisieren()),
  ],
};
