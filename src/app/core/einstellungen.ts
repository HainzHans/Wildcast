import { effect, Injectable, signal } from '@angular/core';

import { lesen, schreiben } from './speicher';

const SCHLUESSEL = 'wildcast.einstellungen.v1';

export type Farbschema = 'system' | 'hell' | 'dunkel';

interface Gespeichert {
  tischmodus: boolean;
  farbschema: Farbschema;
  wachHalten: boolean;
}

const STANDARD: Gespeichert = {
  tischmodus: true,
  farbschema: 'system',
  wachHalten: true,
};

/** Geräteweite Einstellungen, lokal gespeichert. */
@Injectable({ providedIn: 'root' })
export class Einstellungen {
  private readonly start = { ...STANDARD, ...lesen<Partial<Gespeichert>>(SCHLUESSEL) };

  /** Spielerfelder am Handy zum jeweiligen Spieler drehen. */
  readonly tischmodus = signal(this.start.tischmodus);
  readonly farbschema = signal<Farbschema>(this.start.farbschema);
  /** Bildschirm während der Partie nicht ausgehen lassen. */
  readonly wachHalten = signal(this.start.wachHalten);

  constructor() {
    effect(() =>
      schreiben(SCHLUESSEL, {
        tischmodus: this.tischmodus(),
        farbschema: this.farbschema(),
        wachHalten: this.wachHalten(),
      } satisfies Gespeichert),
    );
    effect(() => {
      const schema = this.farbschema();
      if (schema === 'system') delete document.documentElement.dataset['theme'];
      else document.documentElement.dataset['theme'] = schema === 'hell' ? 'light' : 'dark';
    });
  }
}
