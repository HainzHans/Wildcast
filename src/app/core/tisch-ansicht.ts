import { computed, inject, Injectable, signal } from '@angular/core';

import { Einstellungen } from './einstellungen';

/** Ab dieser Breite (Laptop, Tablet quer) schauen alle von einer Seite drauf. */
const SCHMAL = '(max-width: 899px)';
/** Ein Handy im Querformat: breiter als hoch, aber niedrig. */
const HANDY_QUER = '(orientation: landscape) and (max-height: 560px) and (max-width: 1100px)';

/**
 * Entscheidet, ob die Spielerfelder zum jeweiligen Spieler hin gedreht werden –
 * wie bei einem Handy, das flach in der Tischmitte liegt.
 */
@Injectable({ providedIn: 'root' })
export class TischAnsicht {
  private readonly abfrage = typeof matchMedia === 'function' ? matchMedia(SCHMAL) : null;
  private readonly schmal = signal(this.abfrage?.matches ?? true);
  private readonly querAbfrage = typeof matchMedia === 'function' ? matchMedia(HANDY_QUER) : null;
  /** Handy quer gedreht – dann schauen alle von der langen Seite drauf. */
  readonly quer = signal(this.querAbfrage?.matches ?? false);

  /** Vom Spieler abschaltbar, z. B. wenn alle auf einer Seite sitzen. */
  readonly tischmodus = inject(Einstellungen).tischmodus;
  readonly drehen = computed(() => this.schmal() && this.tischmodus());

  constructor() {
    this.abfrage?.addEventListener('change', (e) => this.schmal.set(e.matches));
    this.querAbfrage?.addEventListener('change', (e) => this.quer.set(e.matches));
  }

  /**
   * Sitzordnung im Uhrzeigersinn, Spieler 1 unten links:
   * Wer in der oberen Reihe sitzt, bekommt sein Feld auf den Kopf gestellt.
   */
  istGedreht(index: number, anzahl: number): boolean {
    if (!this.drehen()) return false;
    if (anzahl === 4) return index === 1 || index === 2;
    return anzahl >= 2 && index === 1;
  }
}
