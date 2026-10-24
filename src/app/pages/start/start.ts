import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SpielStore } from '../../core/spiel/spiel-store';
import { BestaetigenKnopf } from '../../shared/ui/bestaetigen-knopf';
import { varianteMitId, VARIANTEN } from '../../varianten/varianten';

@Component({
  selector: 'app-start',
  imports: [RouterLink, BestaetigenKnopf],
  template: `
    <div class="seite">
      <header class="kopf">
        <h1>Wildcast</h1>
        <p>Chaos-Effekte &amp; Bosskämpfe für deinen Kartenspielabend</p>
      </header>

      @if (laufend(); as l) {
        <section class="laufend" aria-labelledby="laufend-titel">
          <h2 id="laufend-titel">Laufende Partie</h2>
          <p class="laufend-variante">{{ l.variante }}</p>
          <ul class="laufend-spieler">
            @for (s of l.spieler; track s.id) {
              <li>
                {{ s.name }} <strong>{{ s.leben }}</strong>
              </li>
            }
          </ul>
          <div class="laufend-knoepfe">
            <a class="knopf knopf--haupt" routerLink="/spiel">Weiterspielen</a>
            <app-bestaetigen-knopf
              label="Beenden"
              frage="Partie löschen?"
              (bestaetigt)="store.beenden()"
            />
          </div>
        </section>
      }

      <section aria-labelledby="varianten-titel">
        <h2 id="varianten-titel" class="abschnitt">
          {{ laufend() ? 'Neue Partie' : 'Variante wählen' }}
        </h2>
        <ul class="varianten">
          @for (v of varianten; track v.id) {
            <li>
              @if (v.verfuegbar) {
                <a class="variante" [routerLink]="['/neu', v.id]">
                  <span class="variante-name">{{ v.name }}</span>
                  <span class="variante-text">{{ v.untertitel }}</span>
                  <span class="variante-spieler">{{
                    spielerText(v.spieler.min, v.spieler.max)
                  }}</span>
                </a>
              } @else {
                <div class="variante variante--bald" aria-disabled="true">
                  <span class="variante-name">{{ v.name }}</span>
                  <span class="variante-text">{{ v.untertitel }}</span>
                  <span class="variante-spieler">Kommt bald</span>
                </div>
              }
            </li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: `
    .seite {
      max-width: 36rem;
      margin-inline: auto;
      padding: 2.5rem 1rem 3rem;
      display: grid;
      gap: 2rem;
    }
    .kopf h1 {
      font-size: clamp(2.8rem, 12vw, 4.2rem);
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .kopf p {
      margin: 0.4rem 0 0;
      color: var(--text-leise);
    }
    .abschnitt {
      font-size: 1.15rem;
      margin-bottom: 0.75rem;
    }
    .laufend {
      background: var(--feld);
      border: 2px solid var(--messing);
      border-radius: var(--radius);
      padding: 1.1rem 1.2rem;
      box-shadow: var(--schatten);
    }
    .laufend h2 {
      font-size: 1.15rem;
    }
    .laufend-variante {
      margin: 0.2rem 0 0.6rem;
      color: var(--text-leise);
    }
    .laufend-spieler {
      list-style: none;
      padding: 0;
      margin: 0 0 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem 1.2rem;
    }
    .laufend-spieler strong {
      font-family: var(--schrift-anzeige);
      font-size: 1.2rem;
    }
    .laufend-knoepfe {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }
    .laufend-knoepfe a {
      display: inline-flex;
      align-items: center;
      text-decoration: none;
    }
    .varianten {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 0.75rem;
    }
    .variante {
      display: grid;
      gap: 0.25rem;
      padding: 1rem 1.2rem;
      border-radius: var(--radius);
      background: var(--feld);
      border: 1px solid var(--feld-rand);
      color: inherit;
      text-decoration: none;
      box-shadow: var(--schatten);
      transition: transform 120ms ease;
    }
    a.variante:active {
      transform: scale(0.98);
    }
    .variante-name {
      font-family: var(--schrift-anzeige);
      font-variation-settings:
        'SOFT' 100,
        'WONK' 1;
      font-size: 1.5rem;
      font-weight: 700;
    }
    .variante-text {
      color: var(--text-leise);
    }
    .variante-spieler {
      margin-top: 0.3rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--messing);
    }
    .variante--bald {
      opacity: 0.55;
      box-shadow: none;
      border-style: dashed;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Start {
  protected readonly store = inject(SpielStore);
  protected readonly varianten = VARIANTEN;

  protected readonly laufend = computed(() => {
    const s = this.store.stand();
    return s
      ? { variante: varianteMitId(s.variante)?.name ?? s.variante, spieler: s.spieler }
      : null;
  });

  protected spielerText(min: number, max: number): string {
    return min === max ? `${min} Spieler` : `${min}–${max} Spieler`;
  }
}
