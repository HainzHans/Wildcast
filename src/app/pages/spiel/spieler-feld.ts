import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';

import { Effekt, Spieler } from '../../core/spiel/modell';
import { HalteKnopf } from '../../shared/ui/halte-knopf';

/** Ab hier wird die Lebensanzeige rot. */
const KRITISCH = 10;
/** So lange sammelt die Blase schnelle Tipps zu einer Summe (−1 −1 −1 → −3). */
const SAMMELZEIT = 1500;

@Component({
  selector: 'app-spieler-feld',
  imports: [HalteKnopf],
  template: `
    <section class="feld" [class.gedreht]="gedreht()" [attr.aria-label]="spieler().name">
      <h2 class="name">{{ spieler().name }}</h2>

      <div class="leben" [class.kritisch]="spieler().leben <= kritisch">
        @for (s of schritte; track s) {
          <button
            type="button"
            class="schritt"
            [class.plus]="s > 0"
            [style.order]="s > 0 ? 3 : 1"
            [attr.aria-label]="
              (s > 0 ? 'Ein Leben mehr für ' : 'Ein Leben weniger für ') + spieler().name
            "
            appHalteKnopf
            (halte)="aendern(s)"
          >
            {{ s > 0 ? '+' : '−' }}
          </button>
        }
        <div class="anzeige">
          <span class="zahl" aria-live="polite">{{ spieler().leben }}</span>
          @if (aenderung(); as a) {
            <span class="blase" aria-hidden="true">{{ a > 0 ? '+' + a : a }}</span>
          }
        </div>
      </div>

      @if (effektWuerfel()) {
        <button type="button" class="knopf knopf--haupt wirken" (click)="wirken.emit()">
          Effekt wirken
        </button>
      }

      @if (bleibende().length || segen().length) {
        <ul class="bleibend" aria-label="Segen, Verzauberungen und Embleme">
          @for (s of segen(); track s.id) {
            <li>
              <button
                type="button"
                class="marke segen"
                [class.pakt]="s.pakt"
                [class.benutzt]="s.benutzt"
                (click)="segenZeigen.emit(s.id)"
              >
                <span aria-hidden="true">{{ s.benutzt ? '✓' : '☀' }}</span> {{ s.name }}
              </button>
            </li>
          }
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
      grid-template-rows: auto 1fr auto auto;
      grid-template-columns: minmax(0, 1fr);
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: clamp(0.35rem, 4cqi, 1.5rem);
      width: 100%;
    }
    .anzeige {
      order: 2;
      position: relative;
      line-height: 0.9;
      min-width: 2ch;
      text-align: center;
    }
    .zahl {
      font-family: var(--schrift-anzeige);
      font-variation-settings:
        'SOFT' 100,
        'WONK' 1;
      font-weight: 800;
      /* Richtet sich nach der kleineren Seite und der Breite, damit +/− daneben passen */
      font-size: clamp(2rem, min(26cqmin, 20cqi), 7rem);
      font-variant-numeric: tabular-nums;
      transition: color 200ms;
    }
    .kritisch .zahl {
      color: var(--negativ);
    }
    .blase {
      position: absolute;
      left: 50%;
      bottom: 100%;
      translate: -50% -0.2rem;
      padding: 0.1rem 0.5rem;
      border-radius: 99px;
      background: var(--filz-tief);
      font-weight: 700;
      font-size: clamp(0.9rem, 6cqmin, 1.3rem);
      font-variant-numeric: tabular-nums;
    }
    .schritt {
      flex-shrink: 0;
      width: clamp(2.75rem, min(18cqmin, 15cqi), 4.25rem);
      aspect-ratio: 1;
      border-radius: 50%;
      border: 1px solid var(--feld-rand);
      background: var(--filz);
      font-size: clamp(1.4rem, min(11cqmin, 9cqi), 2.4rem);
      font-weight: 700;
      line-height: 1;
      transition: transform 80ms;
    }
    .schritt:active {
      transform: scale(0.92);
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
    .marke.segen {
      border-color: var(--messing);
    }
    .marke.segen.pakt {
      border-style: dashed;
    }
    .marke.benutzt {
      opacity: 0.5;
      text-decoration: line-through;
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
  /** Segen aus dem Draft; einmalige sind abgehakt, sobald sie eingesetzt wurden. */
  readonly segen = input<{ id: string; name: string; pakt?: boolean; benutzt: boolean }[]>([]);

  readonly leben = output<number>();
  readonly wirken = output<void>();
  readonly zeigen = output<number>();
  readonly segenZeigen = output<string>();

  protected readonly schritte = [-1, 1];
  protected readonly kritisch = KRITISCH;
  protected readonly aenderung = signal(0);
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
