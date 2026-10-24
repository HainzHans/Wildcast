import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SpielStore } from '../../core/spiel/spiel-store';
import { ZurueckLink } from '../../shared/ui/zurueck-link';
import { varianteMitId, VARIANTEN } from '../../varianten/varianten';

/** „Jetzt spielen“: Variante auswählen oder die laufende Partie fortsetzen. */
@Component({
  selector: 'app-spielen-seite',
  imports: [RouterLink, ZurueckLink],
  template: `
    <div class="seite">
      <app-zurueck-link />
      <h1>Was spielt ihr?</h1>

      @if (laufend(); as l) {
        <a class="karte karte--laufend" routerLink="/spiel">
          <span class="etikett">Laufende Partie</span>
          <span class="name">{{ l.variante }} fortsetzen</span>
          <span class="text">{{ l.spieler }}</span>
        </a>
      }

      <ul class="varianten">
        @for (v of varianten; track v.id) {
          <li>
            @if (v.verfuegbar) {
              <a class="karte" [routerLink]="['/neu', v.id]">
                <span class="name">{{ v.name }}</span>
                <span class="text">{{ v.untertitel }}</span>
                <span class="spieler">{{ spielerText(v.spieler.min, v.spieler.max) }}</span>
              </a>
            } @else {
              <div class="karte karte--bald" aria-disabled="true">
                <span class="name">{{ v.name }}</span>
                <span class="text">{{ v.untertitel }}</span>
                <span class="spieler">Kommt bald</span>
              </div>
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
      gap: 0.75rem;
    }
    .karte {
      display: grid;
      gap: 0.25rem;
      padding: 1.1rem 1.2rem;
      border-radius: var(--radius);
      background: var(--feld);
      border: 1px solid var(--feld-rand);
      color: inherit;
      text-decoration: none;
      box-shadow: var(--schatten);
      transition:
        transform 120ms ease,
        border-color 120ms;
    }
    a.karte:hover,
    a.karte:focus-visible {
      border-color: var(--messing);
    }
    a.karte:active {
      transform: scale(0.98);
    }
    .karte--laufend {
      border: 2px solid var(--messing);
    }
    .karte--bald {
      opacity: 0.55;
      box-shadow: none;
      border-style: dashed;
    }
    .etikett {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--messing);
    }
    .name {
      font-family: var(--schrift-anzeige);
      font-variation-settings:
        'SOFT' 100,
        'WONK' 1;
      font-size: 1.5rem;
      font-weight: 700;
    }
    .text {
      color: var(--text-leise);
    }
    .spieler {
      margin-top: 0.3rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--messing);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpielenSeite {
  private readonly store = inject(SpielStore);
  protected readonly varianten = VARIANTEN;

  protected readonly laufend = computed(() => {
    const s = this.store.stand();
    if (!s) return null;
    return {
      variante: varianteMitId(s.variante)?.name ?? s.variante,
      spieler: s.spieler.map((p) => `${p.name} ${p.leben}`).join(' · '),
    };
  });

  protected spielerText(min: number, max: number): string {
    return min === max ? `${min} Spieler` : `${min}–${max} Spieler`;
  }
}
