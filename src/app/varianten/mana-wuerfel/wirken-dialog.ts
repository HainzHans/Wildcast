import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';

import { ENERGIE, stufe } from '../../content/begriffe';
import { Effekt, Spieler } from '../../core/spiel/modell';
import { SpielStore } from '../../core/spiel/spiel-store';
import { SterneBewertung } from '../../shared/ui/sterne-bewertung';
import { Ueberlagerung } from '../../shared/ui/ueberlagerung';
import { EffektKarte } from './effekt-karte';
import { ANTWORT } from './wuerfel';

/** Wählbare Manamenge pro Effekt; über 10 geht es nur mit „+“ weiter, bis zur Antwort (42). */
const MANA_MIN = 1;
const MANA_MAX = ANTWORT;
const SCHNELLWAHL = Array.from({ length: 10 }, (_, i) => i + 1);
/** Kurze Spannungspause, bevor das Ergebnis aufgedeckt wird. */
const WUERFELZEIT = 700;

@Component({
  selector: 'app-wirken-dialog',
  imports: [Ueberlagerung, EffektKarte, SterneBewertung],
  template: `
    <app-ueberlagerung
      [titel]="'Effekt wirken – ' + spieler().name"
      [gedreht]="gedreht()"
      (schliessen)="fertig.emit()"
    >
      @switch (phase()) {
        @case ('wahl') {
          <div class="wahl">
            <h2>{{ spieler().name }} wirkt</h2>
            <p class="frage">Wie viel {{ energie }} bezahlst du?</p>

            <div class="zaehler">
              <button
                type="button"
                class="pm"
                aria-label="Weniger"
                [disabled]="mana() <= manaMin"
                (click)="setzen(mana() - 1)"
              >
                −
              </button>
              <output class="zahl" aria-live="polite">{{ mana() }}</output>
              <button
                type="button"
                class="pm"
                aria-label="Mehr"
                [disabled]="mana() >= manaMax"
                (click)="setzen(mana() + 1)"
              >
                +
              </button>
            </div>
            <p class="stufe">{{ stufe() }}</p>

            <div class="schnell">
              @for (n of schnellwahl; track n) {
                <button type="button" class="chip" [class.aktiv]="mana() === n" (click)="setzen(n)">
                  {{ n }}
                </button>
              }
            </div>

            <button type="button" class="knopf knopf--haupt wuerfeln" (click)="wuerfeln()">
              Würfeln!
            </button>
          </div>
        }
        @case ('rollt') {
          <div class="rollt" aria-live="polite">
            <div class="wuerfel" aria-hidden="true"><span></span><span></span><span></span></div>
            <p>Die Würfel rollen …</p>
          </div>
        }
        @case ('ergebnis') {
          @if (ergebnis(); as e) {
            <div class="ergebnis">
              <app-effekt-karte [effekt]="e" [von]="spieler().name" />
              <app-sterne-bewertung art="effekt" [ref]="e.vorlage" [name]="e.name" />
              @if (e.form === 'verzauberung' || e.form === 'emblem') {
                <p class="hinweis">
                  {{ e.form === 'emblem' ? 'Das Emblem bleibt' : 'Die Verzauberung liegt' }}
                  jetzt {{ e.art === 'chaos' ? 'für alle' : 'bei ' + spieler().name }} auf dem
                  Tisch.
                </p>
              }
              <button type="button" class="knopf knopf--haupt" (click)="fertig.emit()">
                Fertig
              </button>
            </div>
          }
        }
      }
    </app-ueberlagerung>
  `,
  styles: `
    .wahl,
    .ergebnis,
    .rollt {
      display: grid;
      gap: 0.9rem;
      text-align: center;
    }
    h2 {
      font-size: 1.6rem;
      font-weight: 800;
    }
    .frage,
    .stufe,
    .hinweis {
      margin: 0;
      color: var(--text-leise);
    }
    .stufe {
      font-family: var(--schrift-anzeige);
      font-style: italic;
      color: var(--messing);
      min-height: 1.5em;
    }
    .zaehler {
      display: grid;
      grid-template-columns: 4rem 1fr 4rem;
      align-items: center;
    }
    .pm {
      height: 4rem;
      border-radius: 50%;
      border: 1px solid var(--feld-rand);
      background: var(--feld);
      font-size: 2rem;
      line-height: 1;
    }
    .zahl {
      font-family: var(--schrift-anzeige);
      font-variation-settings:
        'SOFT' 100,
        'WONK' 1;
      font-size: 5rem;
      font-weight: 800;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .pm:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
    .schnell {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      justify-content: center;
      gap: 0.4rem;
    }
    .chip {
      min-width: 2.75rem;
      min-height: 2.75rem;
      border-radius: 99px;
      border: 1px solid var(--feld-rand);
      background: var(--feld);
      font-weight: 700;
    }
    .chip.aktiv {
      background: var(--messing);
      border-color: transparent;
      color: var(--messing-text);
    }
    .wuerfeln {
      min-height: 3.75rem;
      font-size: 1.3rem;
    }
    .ergebnis {
      text-align: start;
    }
    .rollt {
      padding: 2.5rem 0;
      justify-items: center;
    }
    .wuerfel {
      width: 5rem;
      height: 5rem;
      border-radius: 1rem;
      background: var(--messing);
      display: grid;
      grid-template: repeat(3, 1fr) / repeat(3, 1fr);
      padding: 0.7rem;
      animation: rollen 700ms cubic-bezier(0.3, 0.7, 0.4, 1);
    }
    .wuerfel span {
      width: 0.8rem;
      height: 0.8rem;
      border-radius: 50%;
      background: var(--messing-text);
      place-self: center;
    }
    .wuerfel span:nth-child(1) {
      grid-area: 1 / 1;
    }
    .wuerfel span:nth-child(2) {
      grid-area: 2 / 2;
    }
    .wuerfel span:nth-child(3) {
      grid-area: 3 / 3;
    }
    @keyframes rollen {
      0% {
        transform: rotate(0) scale(0.6);
      }
      60% {
        transform: rotate(560deg) scale(1.1);
      }
      100% {
        transform: rotate(720deg) scale(1);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WirkenDialog implements OnDestroy {
  private readonly store = inject(SpielStore);

  readonly spieler = input.required<Spieler>();
  readonly gedreht = input(false);
  readonly fertig = output<void>();

  protected readonly energie = ENERGIE;
  protected readonly schnellwahl = SCHNELLWAHL;
  protected readonly manaMin = MANA_MIN;
  protected readonly manaMax = MANA_MAX;
  protected readonly mana = signal(3);
  protected readonly stufe = computed(() => stufe(this.mana()));
  protected readonly phase = signal<'wahl' | 'rollt' | 'ergebnis'>('wahl');
  protected readonly ergebnis = signal<Effekt | null>(null);
  private zeitgeber?: ReturnType<typeof setTimeout>;

  protected setzen(mana: number): void {
    this.mana.set(Math.min(Math.max(mana, MANA_MIN), MANA_MAX));
  }

  protected wuerfeln(): void {
    // Sofort ins Protokoll, damit der Wurf auch beim Wegklicken während der Animation zählt.
    this.ergebnis.set(this.store.wirken(this.spieler().id, this.mana()));
    this.phase.set('rollt');
    this.zeitgeber = setTimeout(() => this.phase.set('ergebnis'), WUERFELZEIT);
  }

  ngOnDestroy(): void {
    clearTimeout(this.zeitgeber);
  }
}
