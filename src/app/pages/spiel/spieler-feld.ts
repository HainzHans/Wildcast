import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';

import { Effekt, Spieler } from '../../core/spiel/modell';

/** Ab hier wird die Lebensanzeige rot. */
const KRITISCH = 10;
/** So lange sammelt die Blase schnelle Tipps zu einer Summe (−1 −1 −1 → −3). */
const SAMMELZEIT = 1500;

@Component({
  selector: 'app-spieler-feld',
  template: `
    <section class="feld" [class.gedreht]="gedreht()" [attr.aria-label]="spieler().name">
      <h2 class="name">{{ spieler().name }}</h2>

      <div class="leben" [class.kritisch]="spieler().leben <= kritisch">
        <span class="zahl" aria-live="polite">{{ spieler().leben }}</span>
        @if (aenderung(); as a) {
          <span class="blase" aria-hidden="true">{{ a > 0 ? '+' + a : a }}</span>
        }
      </div>

      <div class="knoepfe">
        @for (s of schritte; track s) {
          <button
            type="button"
            class="schritt"
            [class.plus]="s > 0"
            [attr.aria-label]="(s > 0 ? 'Plus ' : 'Minus ') + abs(s) + ' Leben'"
            (click)="aendern(s)"
          >
            {{ s > 0 ? '+' + s : '−' + abs(s) }}
          </button>
        }
      </div>

      @if (effektWuerfel()) {
        <button type="button" class="knopf knopf--haupt wirken" (click)="wirken.emit()">
          Effekt wirken
        </button>
      }

      @if (bleibende().length) {
        <ul class="bleibend" aria-label="Verzauberungen und Embleme">
          @for (e of bleibende(); track e.nr) {
            <li>
              <button
                type="button"
                class="marke"
                [attr.data-art]="e.art"
                (click)="zeigen.emit(e.nr)"
              >
                <span aria-hidden="true">{{ e.form === 'emblem' ? '◆' : '✦' }}</span> {{ e.name }}
              </button>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-height: 0;
      container-type: size;
    }
    .feld {
      height: 100%;
      display: grid;
      grid-template-rows: auto 1fr auto auto auto;
      justify-items: center;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 0.75rem 0.75rem;
      background: var(--feld);
      border-radius: var(--radius);
      box-shadow: var(--schatten);
      overflow: hidden;
    }
    .gedreht {
      transform: rotate(180deg);
    }
    .name {
      font-size: clamp(1rem, 7cqmin, 1.5rem);
      font-weight: 700;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .leben {
      position: relative;
      line-height: 0.9;
    }
    .zahl {
      font-family: var(--schrift-anzeige);
      font-variation-settings:
        'SOFT' 100,
        'WONK' 1;
      font-weight: 800;
      font-size: clamp(3.2rem, 32cqmin, 9rem);
      font-variant-numeric: tabular-nums;
      transition: color 200ms;
    }
    .kritisch .zahl {
      color: var(--negativ);
    }
    .blase {
      position: absolute;
      left: 100%;
      top: 0;
      margin-left: 0.3rem;
      padding: 0.1rem 0.5rem;
      border-radius: 99px;
      background: var(--filz-tief);
      font-weight: 700;
      font-size: clamp(0.9rem, 6cqmin, 1.3rem);
      font-variant-numeric: tabular-nums;
    }
    .knoepfe {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.4rem;
      width: 100%;
      max-width: 22rem;
    }
    .schritt {
      min-height: var(--tippflaeche);
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      background: var(--filz);
      font-size: 1.15rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .schritt:active {
      transform: scale(0.95);
    }
    .wirken {
      width: 100%;
      max-width: 22rem;
    }
    .bleibend {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.3rem;
    }
    .marke {
      min-height: 2.25rem;
      padding: 0.2rem 0.7rem;
      border-radius: 99px;
      border: 1.5px solid var(--positiv);
      background: transparent;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .marke[data-art='negativ'] {
      border-color: var(--negativ);
    }
    .marke[data-art='chaos'] {
      border-color: var(--chaos);
    }
    /* Kleine Felder (4 Spieler am Handy): Knöpfe in zwei Reihen */
    @container (max-width: 15rem) {
      .knoepfe {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpielerFeld implements OnDestroy {
  readonly spieler = input.required<Spieler>();
  readonly gedreht = input(false);
  readonly effektWuerfel = input(false);
  /** Aktive Verzauberungen und Embleme, die diesen Spieler betreffen. */
  readonly bleibende = input<Effekt[]>([]);

  readonly leben = output<number>();
  readonly wirken = output<void>();
  readonly zeigen = output<number>();

  protected readonly schritte = [-5, -1, 1, 5];
  protected readonly kritisch = KRITISCH;
  protected readonly aenderung = signal(0);
  protected readonly abs = Math.abs;
  private zeitgeber?: ReturnType<typeof setTimeout>;

  protected aendern(um: number): void {
    this.leben.emit(um);
    this.aenderung.update((a) => a + um);
    clearTimeout(this.zeitgeber);
    this.zeitgeber = setTimeout(() => this.aenderung.set(0), SAMMELZEIT);
  }

  ngOnDestroy(): void {
    clearTimeout(this.zeitgeber);
  }
}
