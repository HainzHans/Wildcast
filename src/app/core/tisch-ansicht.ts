import { computed, effect, inject, Injectable, signal } from '@angular/core';

import { Einstellungen } from './einstellungen';
import { lesen, schreiben } from './speicher';

const SITZ_SCHLUESSEL = 'wildcast.sitzversatz';

/** Ab dieser Breite (Laptop, Tablet quer) schauen alle von einer Seite drauf. */
const SCHMAL = '(max-width: 899px)';

/**
 * Entscheidet, ob die Spielerfelder zum jeweiligen Spieler hin gedreht werden –
 * wie bei einem Handy, das flach in der Tischmitte liegt.
 */
@Injectable({ providedIn: 'root' })
export class TischAnsicht {
  private readonly abfrage = typeof matchMedia === 'function' ? matchMedia(SCHMAL) : null;
  private readonly schmal = signal(this.abfrage?.matches ?? true);

  /** Vom Spieler abschaltbar, z. B. wenn alle auf einer Seite sitzen. */
  readonly tischmodus = inject(Einstellungen).tischmodus;
  readonly drehen = computed(() => this.schmal() && this.tischmodus());
  /** Um wie viele Plätze die Spieler im Uhrzeigersinn weitergerückt sind. */
  private readonly versatz = signal(lesen<number>(SITZ_SCHLUESSEL) ?? 0);

  constructor() {
    this.abfrage?.addEventListener('change', (e) => this.schmal.set(e.matches));
    effect(() => schreiben(SITZ_SCHLUESSEL, this.versatz()));
  }

  /** Alle rücken einen Platz weiter; bei 2 Spielern tauschen sie oben und unten. */
  plaetzeTauschen(): void {
    this.versatz.update((v) => (v + 1) % 12);
  }

  /** Platz (0-basiert) des Spielers mit diesem Index am Tisch. */
  sitz(index: number, anzahl: number): number {
    return (index + this.versatz()) % anzahl;
  }

  /**
   * Plätze im Uhrzeigersinn, Platz 1 unten links:
   * Wer in der oberen Reihe sitzt, bekommt sein Feld auf den Kopf gestellt.
   */
  istGedreht(index: number, anzahl: number): boolean {
    if (!this.drehen()) return false;
    const platz = this.sitz(index, anzahl);
    if (anzahl === 4) return platz === 1 || platz === 2;
    return anzahl >= 2 && platz === 1;
  }
}
