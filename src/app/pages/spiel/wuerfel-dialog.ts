import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';

import { lesen, schreiben } from '../../core/speicher';
import { ZUFALL } from '../../core/zufall';

const SCHLUESSEL = 'wildcast.wuerfel.v1';

/** 2 steht für die Münze, alles andere für einen Würfel mit so vielen Seiten. */
export const WUERFEL = [2, 4, 6, 8, 10, 12, 20] as const;
export type Wuerfel = (typeof WUERFEL)[number];

interface Wurf {
  nr: number;
  wuerfel: Wuerfel;
  ergebnis: number;
}

export function wuerfelName(w: Wuerfel): string {
  return w === 2 ? 'Münze' : `W${w}`;
}

export function ergebnisText(w: Wuerfel, ergebnis: number): string {
  return w === 2 ? (ergebnis === 1 ? 'Kopf' : 'Zahl') : String(ergebnis);
}

/** Münze werfen oder einen der Würfel, die in Magic vorkommen (W4 bis W20). */
@Component({
  selector: 'app-wuerfel-dialog',
  template: `
    <div class="auswahl" role="radiogroup" aria-label="Würfel wählen">
      @for (w of wuerfel; track w) {
        <button
          type="button"
          role="radio"
          class="wahl"
          [class.an]="gewaehlt() === w"
          [attr.aria-checked]="gewaehlt() === w"
          (click)="waehlen(w)"
        >
          {{ name(w) }}
        </button>
      }
    </div>

    <button
      type="button"
      class="ergebnis"
      [class.rollt]="rollt()"
      [class.muenze]="gewaehlt() === 2"
      [attr.aria-label]="(gewaehlt() === 2 ? 'Münze werfen' : name(gewaehlt()) + ' würfeln')"
      (click)="werfen()"
    >
      <span class="form" aria-hidden="true">
        <span class="wert">{{ anzeige() ?? '?' }}</span>
      </span>
      <span class="unter">{{ name(gewaehlt()) }}</span>
    </button>
    <p class="ansage" aria-live="polite">
      @if (letzter(); as l) {
        @if (!rollt()) {
          {{ name(l.wuerfel) }}: <strong>{{ text(l.wuerfel, l.ergebnis) }}</strong>
        }
      }
    </p>

    <button type="button" class="knopf knopf--haupt werfen" (click)="werfen()">
      {{ gewaehlt() === 2 ? 'Münze werfen' : 'Würfeln' }}
    </button>

    @if (frueher().length) {
      <div class="verlauf">
        <span class="etikett">Zuletzt</span>
        <ul>
          @for (w of frueher(); track w.nr) {
            <li>
              <span class="klein">{{ name(w.wuerfel) }}</span> {{ text(w.wuerfel, w.ergebnis) }}
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.9rem;
      justify-items: center;
    }
    p {
      margin: 0;
    }
    .auswahl {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.4rem;
    }
    .wahl {
      min-height: 2.9rem;
      border-radius: 0.8rem;
      border: 1px solid var(--feld-rand);
      background: var(--feld);
      color: var(--text);
      font-weight: 700;
      font-size: 0.95rem;
      transition: transform 80ms;
    }
    .wahl:active {
      transform: scale(0.94);
    }
    .wahl.an {
      background: var(--messing);
      border-color: var(--messing);
      color: var(--messing-text);
    }
    .ergebnis {
      display: grid;
      justify-items: center;
      gap: 0.4rem;
      padding: 0.4rem;
      border: 0;
      background: transparent;
      color: var(--text);
    }
    .form {
      display: grid;
      place-items: center;
      width: 8.5rem;
      height: 8.5rem;
      border-radius: 1.6rem;
      background: var(--feld);
      border: 2px solid var(--messing);
      box-shadow: 0 0.6rem 1.6rem rgb(0 0 0 / 0.3);
      transition: transform 80ms;
    }
    .ergebnis:active .form {
      transform: scale(0.95);
    }
    .muenze .form {
      border-radius: 50%;
    }
    .rollt .form {
      animation: wackeln 120ms linear infinite alternate;
    }
    .wert {
      font-family: var(--schrift-anzeige);
      font-size: 3.4rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .muenze .wert {
      font-size: 1.9rem;
    }
    .unter {
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    .ansage {
      min-height: 1.4em;
      color: var(--text-leise);
    }
    .ansage strong {
      color: var(--text);
    }
    .werfen {
      width: 100%;
      min-height: 3.4rem;
      border-radius: 1rem;
      font-size: 1.05rem;
    }
    .verlauf {
      width: 100%;
      display: grid;
      gap: 0.4rem;
    }
    .etikett {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    .verlauf ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .verlauf li {
      padding: 0.25rem 0.65rem;
      border-radius: 99px;
      background: var(--feld);
      font-weight: 700;
    }
    .klein {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-leise);
    }
    @keyframes wackeln {
      from {
        transform: rotate(-8deg) scale(0.96);
      }
      to {
        transform: rotate(8deg) scale(1.02);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .rollt .form {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WuerfelDialog {
  private readonly zufall = inject(ZUFALL);

  protected readonly wuerfel = WUERFEL;
  protected readonly name = wuerfelName;
  protected readonly text = ergebnisText;

  /** Der zuletzt benutzte Würfel bleibt für das nächste Öffnen gewählt. */
  protected readonly gewaehlt = signal<Wuerfel>(
    WUERFEL.find((w) => w === lesen<number>(SCHLUESSEL)) ?? 20,
  );
  private readonly wuerfe = signal<Wurf[]>([]);
  protected readonly rollt = signal(false);
  /** Während des Rollens flackern Zufallszahlen über den Würfel. */
  private readonly flackern = signal<number | null>(null);

  protected readonly letzter = computed(() => this.wuerfe()[0]);
  protected readonly frueher = computed(() => this.wuerfe().slice(1, 9));
  protected readonly anzeige = computed(() => {
    const w = this.gewaehlt();
    const zahl = this.rollt() ? this.flackern() : this.letzter()?.wuerfel === w ? this.letzter()!.ergebnis : null;
    return zahl === null ? null : ergebnisText(w, zahl);
  });

  private zeitgeber?: ReturnType<typeof setInterval>;
  private zaehler = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.zeitgeber));
  }

  protected waehlen(w: Wuerfel): void {
    if (this.rollt()) return;
    this.gewaehlt.set(w);
    schreiben(SCHLUESSEL, w);
  }

  protected werfen(): void {
    if (this.rollt()) return;
    const w = this.gewaehlt();
    const ergebnis = this.wurf(w);
    const eintragen = () =>
      this.wuerfe.update((alle) => [{ nr: ++this.zaehler, wuerfel: w, ergebnis }, ...alle]);

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      eintragen();
      return;
    }
    this.rollt.set(true);
    let schritte = 0;
    this.zeitgeber = setInterval(() => {
      this.flackern.set(this.wurf(w));
      if (++schritte < 8) return;
      clearInterval(this.zeitgeber);
      eintragen();
      this.rollt.set(false);
    }, 60);
  }

  private wurf(w: Wuerfel): number {
    return Math.floor(this.zufall() * w) + 1;
  }
}
