import { ChangeDetectionStrategy, Component, computed, model } from '@angular/core';

import { ART_NAME, FORM_NAME } from '../../content/begriffe';
import {
  anteil,
  ARTEN,
  FORMEN,
  Gewicht,
  STANDARD_WUERFEL,
  summe,
  WuerfelEinstellungen,
} from './wuerfel-einstellungen';

type Gruppe = 'arten' | 'formen';

interface Zeile {
  schluessel: string;
  name: string;
  hinweis: string;
  gewicht: Gewicht;
  /** Tatsächliche Wahrscheinlichkeit nach dem Hochrechnen. */
  anteil: number;
  /** Der letzte eingeschaltete Eintrag einer Gruppe lässt sich nicht abschalten. */
  letzter: boolean;
}

const HINWEIS: Record<string, string> = {
  positiv: 'hilft dem, der bezahlt',
  negativ: 'trifft den, der bezahlt',
  chaos: 'trifft alle Spieler',
  normal: 'klassischer Einmaleffekt',
  verrueckt: 'Hände tauschen, Decks zensieren …',
  kreatur: 'ein Kreaturen-Spielstein kommt ins Spiel',
  artefakt: 'ein Artefakt-Spielstein kommt ins Spiel',
  verzauberung: 'bleibt liegen, kann zerstört werden',
  emblem: 'bleibt das ganze Spiel',
};

/** Hausregeln für den Mana-Würfel: Wahrscheinlichkeiten anpassen, Arten und Formen abschalten. */
@Component({
  selector: 'app-wuerfel-regeln',
  template: `
    @for (g of gruppen(); track g.id) {
      <fieldset class="gruppe">
        <legend>{{ g.titel }}</legend>
        <ul>
          @for (z of g.zeilen; track z.schluessel) {
            <li class="zeile" [class.aus]="!z.gewicht.aktiv" [attr.data-art]="z.schluessel">
              <label class="schalter">
                <input
                  type="checkbox"
                  role="switch"
                  [checked]="z.gewicht.aktiv"
                  [disabled]="z.letzter"
                  (change)="setzen(g.id, z.schluessel, { aktiv: $any($event.target).checked })"
                />
                <span class="text">
                  <span class="name">{{ z.name }}</span>
                  <span class="hinweis">{{ z.hinweis }}</span>
                </span>
              </label>
              <label class="prozent">
                <span class="sr-only">{{ z.name }} in Prozent</span>
                <input
                  type="number"
                  inputmode="decimal"
                  min="0"
                  max="100"
                  step="0.5"
                  [value]="z.gewicht.prozent"
                  [disabled]="!z.gewicht.aktiv"
                  (input)="tippen(g.id, z.schluessel, $any($event.target).value)"
                  (change)="
                    setzen(g.id, z.schluessel, { prozent: zahl($any($event.target).value) })
                  "
                />
                <span aria-hidden="true">%</span>
              </label>
              @if (g.abweichend && z.gewicht.aktiv) {
                <span class="effektiv">≈ {{ (z.anteil * 100).toFixed(1) }}&nbsp;%</span>
              }
            </li>
          }
        </ul>
        <p class="summe" [class.fehler]="g.summe <= 0" aria-live="polite">
          @if (g.summe <= 0) {
            Mindestens ein Eintrag braucht mehr als 0&nbsp;%.
          } @else if (g.abweichend) {
            Summe {{ g.summe }}&nbsp;% – wird anteilig auf 100&nbsp;% gerechnet.
          } @else {
            Summe 100&nbsp;%
          }
        </p>
      </fieldset>
    }

    <button type="button" class="knopf zuruecksetzen" (click)="einstellungen.set(standard)">
      Standardwerte
    </button>
  `,
  styles: `
    :host {
      display: grid;
      gap: 1rem;
    }
    .gruppe {
      border: 0;
      padding: 0;
      margin: 0;
    }
    legend {
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 1px;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--feld-rand);
    }
    .zeile {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 0.25rem 0.75rem;
      padding: 0.6rem 0.8rem;
      background: var(--feld);
      border-left: 4px solid transparent;
    }
    .zeile[data-art='positiv'] {
      border-left-color: var(--positiv);
    }
    .zeile[data-art='negativ'] {
      border-left-color: var(--negativ);
    }
    .zeile[data-art='chaos'] {
      border-left-color: var(--chaos);
    }
    .aus .text {
      opacity: 0.5;
    }
    .aus .name {
      text-decoration: line-through;
    }
    .schalter {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      min-height: var(--tippflaeche);
      cursor: pointer;
    }
    .text {
      display: grid;
    }
    .name {
      font-weight: 700;
    }
    .hinweis {
      font-size: 0.8rem;
      color: var(--text-leise);
    }
    .prozent {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-weight: 600;
    }
    input[type='number'] {
      width: 4.5rem;
      min-height: 2.6rem;
      padding: 0.3rem 0.5rem;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      background: var(--filz);
      color: var(--text);
      font: inherit;
      text-align: right;
    }
    input[type='number']:disabled {
      opacity: 0.4;
    }
    .effektiv {
      grid-column: 2;
      justify-self: end;
      font-size: 0.75rem;
      color: var(--text-leise);
    }
    input[type='checkbox'] {
      flex-shrink: 0;
      width: 2.75rem;
      height: 1.6rem;
      margin: 0;
      appearance: none;
      border-radius: 99px;
      background: var(--filz-tief);
      border: 1px solid var(--feld-rand);
      position: relative;
      cursor: pointer;
      transition: background 150ms;
    }
    input[type='checkbox']::after {
      content: '';
      position: absolute;
      top: 0.15rem;
      left: 0.15rem;
      width: 1.15rem;
      height: 1.15rem;
      border-radius: 50%;
      background: var(--text-leise);
      transition: translate 150ms;
    }
    input[type='checkbox']:checked {
      background: var(--messing);
      border-color: transparent;
    }
    input[type='checkbox']:checked::after {
      background: var(--messing-text);
      translate: 1.15rem 0;
    }
    input[type='checkbox']:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    .summe {
      margin: 0.4rem 0 0;
      font-size: 0.85rem;
      color: var(--text-leise);
    }
    .fehler {
      color: var(--negativ);
      font-weight: 600;
    }
    .zuruecksetzen {
      justify-self: start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WuerfelRegeln {
  readonly einstellungen = model.required<WuerfelEinstellungen>();
  protected readonly standard = STANDARD_WUERFEL;

  protected readonly gruppen = computed(() => {
    const e = this.einstellungen();
    return [
      this.gruppe('arten', 'Würfel 1 · Wen trifft es?', ARTEN, e.arten, ART_NAME),
      this.gruppe('formen', 'Würfel 2 · Welche Form?', FORMEN, e.formen, FORM_NAME),
    ];
  });

  protected setzen(gruppe: Gruppe, schluessel: string, aenderung: Partial<Gewicht>): void {
    this.einstellungen.update((e) => {
      const alt = e[gruppe] as Record<string, Gewicht>;
      return { ...e, [gruppe]: { ...alt, [schluessel]: { ...alt[schluessel], ...aenderung } } };
    });
  }

  /** Live mitrechnen, aber ein gerade geleertes Feld nicht sofort mit 0 überschreiben. */
  protected tippen(gruppe: Gruppe, schluessel: string, wert: string): void {
    if (wert !== '') this.setzen(gruppe, schluessel, { prozent: this.zahl(wert) });
  }

  /** Erlaubt auch Komma als Dezimaltrenner; Unsinn wird zu 0. */
  protected zahl(wert: string): number {
    const n = Number.parseFloat(String(wert).replace(',', '.'));
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), 100) : 0;
  }

  private gruppe<T extends string>(
    id: Gruppe,
    titel: string,
    reihenfolge: T[],
    werte: Record<T, Gewicht>,
    namen: Record<T, string>,
  ) {
    const aktive = reihenfolge.filter((s) => werte[s].aktiv).length;
    const s = Math.round(summe(werte) * 10) / 10;
    const zeilen: Zeile[] = reihenfolge.map((schluessel) => ({
      schluessel,
      name: namen[schluessel],
      hinweis: HINWEIS[schluessel],
      gewicht: werte[schluessel],
      anteil: anteil(werte, schluessel),
      letzter: werte[schluessel].aktiv && aktive === 1,
    }));
    return { id, titel, zeilen, summe: s, abweichend: s !== 100 };
  }
}
