import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { VarianteId } from '../../core/spiel/modell';
import { Seitenkopf } from '../../shared/ui/seitenkopf';
import { SymbolBild } from '../../shared/ui/symbol';
import { VARIANTEN_AUSSEHEN } from '../../varianten/aussehen';
import { VARIANTEN } from '../../varianten/varianten';

/** Alle Varianten mit ihren Regeln zum Nachlesen – aufklappbar, damit die Liste kurz bleibt. */
@Component({
  selector: 'app-varianten-seite',
  imports: [Seitenkopf, SymbolBild],
  template: `
    <app-seitenkopf titel="Varianten" [gross]="true" />

    <ul class="liste">
      @for (v of varianten; track v.id) {
        <li
          class="variante"
          [class.offen]="offen() === v.id"
          [style.--farbe]="aussehen[v.id].farbe"
        >
          <button
            type="button"
            class="kopf"
            [attr.aria-expanded]="offen() === v.id"
            (click)="offen.set(offen() === v.id ? null : v.id)"
          >
            <span class="rund"><app-symbol [name]="aussehen[v.id].symbol" /></span>
            <span class="titel">
              <span class="name">{{ v.name }}</span>
              <span class="spieler">{{ spielerText(v.spieler.min, v.spieler.max) }}</span>
            </span>
            <span class="pfeil" aria-hidden="true"><app-symbol name="weiter" /></span>
          </button>
          @if (offen() === v.id) {
            <div class="inhalt">
              <p class="text">{{ v.untertitel }}</p>
              <ol class="regeln">
                @for (r of v.regeln; track $index) {
                  <li>{{ r }}</li>
                }
              </ol>
            </div>
          }
        </li>
      }
    </ul>
  `,
  styles: `
    .liste {
      list-style: none;
      max-width: 40rem;
      margin: 0 auto;
      padding: 1rem;
      display: grid;
      gap: 0.6rem;
    }
    .variante {
      border-radius: 1.1rem;
      background: var(--feld);
      box-shadow: var(--schatten);
      overflow: hidden;
    }
    .kopf {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.8rem 0.9rem;
      border: 0;
      background: transparent;
      text-align: start;
    }
    .rund {
      display: grid;
      place-items: center;
      width: 2.6rem;
      height: 2.6rem;
      border-radius: 0.8rem;
      background: color-mix(in srgb, var(--farbe) 20%, transparent);
      color: var(--farbe);
      font-size: 1.05rem;
    }
    .titel {
      flex: 1;
      display: grid;
    }
    .name {
      font-family: var(--schrift-anzeige);
      font-size: 1.15rem;
      font-weight: 800;
    }
    .spieler {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-leise);
    }
    .pfeil {
      color: var(--text-leise);
      transition: rotate 200ms ease;
    }
    .offen .pfeil {
      rotate: 90deg;
    }
    .inhalt {
      padding: 0 1rem 1rem;
      animation: aufklappen 180ms ease-out;
    }
    .text {
      margin: 0 0 0.7rem;
      color: var(--text-leise);
    }
    .regeln {
      margin: 0;
      padding-left: 1.3rem;
      display: grid;
      gap: 0.5rem;
      font-size: 0.95rem;
      line-height: 1.45;
    }
    .regeln li::marker {
      color: var(--farbe);
      font-weight: 700;
    }
    @keyframes aufklappen {
      from {
        opacity: 0;
        transform: translateY(-0.3rem);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariantenSeite {
  protected readonly varianten = VARIANTEN.filter((v) => v.verfuegbar);
  protected readonly aussehen = VARIANTEN_AUSSEHEN;
  protected readonly offen = signal<VarianteId | null>(null);

  protected spielerText(min: number, max: number): string {
    return min === max ? `${min} Spieler` : `${min}–${max} Spieler`;
  }
}
