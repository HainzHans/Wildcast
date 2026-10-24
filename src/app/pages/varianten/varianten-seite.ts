import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ZurueckLink } from '../../shared/ui/zurueck-link';
import { VARIANTEN } from '../../varianten/varianten';

@Component({
  selector: 'app-varianten-seite',
  imports: [RouterLink, ZurueckLink],
  template: `
    <div class="seite">
      <app-zurueck-link />
      <h1>Spielvarianten</h1>

      <ul class="varianten">
        @for (v of varianten; track v.id) {
          <li class="variante" [class.variante--bald]="!v.verfuegbar">
            <div class="kopf">
              <h2>{{ v.name }}</h2>
              <span class="spieler">{{
                v.verfuegbar ? spielerText(v.spieler.min, v.spieler.max) : 'Kommt bald'
              }}</span>
            </div>
            <p class="text">{{ v.untertitel }}</p>

            @if (v.regeln.length) {
              <details>
                <summary>Regeln</summary>
                <ul>
                  @for (r of v.regeln; track $index) {
                    <li>{{ r }}</li>
                  }
                </ul>
              </details>
            }

            @if (v.verfuegbar) {
              <a class="knopf knopf--haupt" [routerLink]="['/neu', v.id]">Spielen</a>
            }
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .seite {
      max-width: 36rem;
      margin-inline: auto;
      padding: 1.25rem 1rem 3rem;
      display: grid;
      gap: 1rem;
    }
    h1 {
      font-size: clamp(2.2rem, 9vw, 3rem);
      font-weight: 800;
    }
    .varianten {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 0.9rem;
    }
    .variante {
      display: grid;
      gap: 0.6rem;
      padding: 1.1rem 1.2rem;
      border-radius: var(--radius);
      background: var(--feld);
      border: 1px solid var(--feld-rand);
      box-shadow: var(--schatten);
    }
    .variante--bald {
      opacity: 0.55;
      box-shadow: none;
      border-style: dashed;
    }
    .kopf {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
    }
    h2 {
      font-size: 1.5rem;
      font-weight: 700;
    }
    .spieler {
      flex-shrink: 0;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--messing);
    }
    .text {
      margin: 0;
      color: var(--text-leise);
    }
    summary {
      font-weight: 700;
      cursor: pointer;
      padding: 0.4rem 0;
    }
    details ul {
      margin: 0.3rem 0 0;
      padding-left: 1.2rem;
      display: grid;
      gap: 0.4rem;
    }
    .knopf {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariantenSeite {
  protected readonly varianten = VARIANTEN;

  protected spielerText(min: number, max: number): string {
    return min === max ? `${min} Spieler` : `${min}–${max} Spieler`;
  }
}
