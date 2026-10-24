import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { VarianteId } from '../../core/spiel/modell';
import { SpielStore } from '../../core/spiel/spiel-store';
import { ZurueckLink } from '../../shared/ui/zurueck-link';
import { kombinieren, VARIANTEN, variantenName } from '../../varianten/varianten';

/**
 * „Jetzt spielen“: eine oder mehrere Varianten antippen und gemeinsam starten –
 * oder die laufende Partie fortsetzen.
 */
@Component({
  selector: 'app-spielen-seite',
  imports: [RouterLink, ZurueckLink],
  template: `
    <div class="seite" [class.mit-leiste]="auswahl().length">
      <app-zurueck-link />
      <h1>Was spielt ihr?</h1>
      <p class="hinweis">Tippe eine oder mehrere Varianten an.</p>

      @if (laufend(); as l) {
        <a class="laufend" routerLink="/spiel">
          <span class="etikett">Laufende Partie</span>
          <span class="name">{{ l.name }} fortsetzen</span>
          <span class="text">{{ l.spieler }}</span>
        </a>
      }

      <ul class="raster">
        @for (v of varianten; track v.id) {
          <li>
            @if (v.verfuegbar) {
              <button
                type="button"
                class="karte"
                [class.gewaehlt]="istGewaehlt(v.id)"
                [attr.aria-pressed]="istGewaehlt(v.id)"
                (click)="umschalten(v.id)"
              >
                <span class="marke" aria-hidden="true">✓</span>
                <span class="name">{{ v.name }}</span>
                <span class="text">{{ v.untertitel }}</span>
                <span class="spieler">{{ spielerText(v.spieler.min, v.spieler.max) }}</span>
              </button>
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

    @if (auswahl().length) {
      <div class="leiste">
        <button
          type="button"
          class="knopf knopf--haupt spielen"
          [disabled]="!kombination()"
          (click)="spielen()"
        >
          Spielen
          <span class="auswahl-name">
            {{ kombination() ? kombination()!.name : 'Die Spielerzahlen passen nicht zusammen' }}
          </span>
        </button>
      </div>
    }
  `,
  styles: `
    .seite {
      max-width: 40rem;
      margin-inline: auto;
      padding: 1.25rem 1rem 3rem;
      display: grid;
      gap: 0.9rem;
    }
    .mit-leiste {
      padding-bottom: 8rem;
    }
    h1 {
      font-size: clamp(2.2rem, 9vw, 3rem);
      font-weight: 800;
    }
    .hinweis {
      margin: -0.4rem 0 0;
      color: var(--text-leise);
    }
    .raster {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      /* Alle Karten gleich hoch, egal wie lang der Text ist */
      grid-auto-rows: 1fr;
      gap: 0.6rem;
    }
    .raster li {
      display: grid;
    }
    .karte {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      min-height: 10rem;
      padding: 0.9rem 0.9rem 0.8rem;
      border-radius: var(--radius);
      background: var(--feld);
      border: 2px solid var(--feld-rand);
      color: inherit;
      text-align: start;
      box-shadow: var(--schatten);
      transition:
        transform 120ms ease,
        border-color 120ms;
    }
    button.karte:active {
      transform: scale(0.97);
    }
    .gewaehlt {
      border-color: var(--messing);
    }
    .marke {
      position: absolute;
      top: 0.55rem;
      right: 0.55rem;
      width: 1.6rem;
      height: 1.6rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      border: 2px solid var(--feld-rand);
      color: transparent;
      font-size: 0.9rem;
      font-weight: 900;
      transition:
        background 120ms,
        color 120ms,
        scale 120ms;
    }
    .gewaehlt .marke {
      background: var(--messing);
      border-color: var(--messing);
      color: var(--messing-text);
      scale: 1.1;
    }
    .karte--bald {
      opacity: 0.55;
      box-shadow: none;
      border-style: dashed;
    }
    .name {
      font-family: var(--schrift-anzeige);
      font-variation-settings:
        'SOFT' 100,
        'WONK' 1;
      font-size: 1.15rem;
      font-weight: 700;
      line-height: 1.15;
      padding-right: 1.8rem;
    }
    .text {
      font-size: 0.85rem;
      color: var(--text-leise);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }
    .spieler {
      margin-top: auto;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--messing);
    }
    .laufend {
      display: grid;
      gap: 0.2rem;
      padding: 0.9rem 1.1rem;
      border-radius: var(--radius);
      background: var(--feld);
      border: 2px solid var(--messing);
      color: inherit;
      text-decoration: none;
      box-shadow: var(--schatten);
    }
    .laufend .name {
      font-size: 1.3rem;
      padding: 0;
    }
    .etikett {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--messing);
    }
    .leiste {
      position: fixed;
      inset: auto 0 0;
      padding: 0.75rem 1rem max(0.75rem, env(safe-area-inset-bottom));
      background: linear-gradient(transparent, var(--filz) 35%);
      display: grid;
      justify-items: center;
      animation: hochfahren 200ms ease-out;
    }
    .spielen {
      width: min(100%, 38rem);
      min-height: 3.75rem;
      display: grid;
      gap: 0.1rem;
      font-size: 1.25rem;
      box-shadow: var(--schatten);
    }
    .auswahl-name {
      font-size: 0.8rem;
      font-weight: 500;
      opacity: 0.85;
    }
    @keyframes hochfahren {
      from {
        transform: translateY(100%);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpielenSeite {
  private readonly store = inject(SpielStore);
  private readonly router = inject(Router);

  protected readonly varianten = VARIANTEN;
  protected readonly auswahl = signal<VarianteId[]>([]);
  protected readonly kombination = computed(() => kombinieren(this.auswahl()));

  protected readonly laufend = computed(() => {
    const s = this.store.stand();
    if (!s) return null;
    return {
      name: variantenName(s.varianten),
      spieler: s.spieler.map((p) => `${p.name} ${p.leben}`).join(' · '),
    };
  });

  protected istGewaehlt(id: VarianteId): boolean {
    return this.auswahl().includes(id);
  }

  protected umschalten(id: VarianteId): void {
    this.auswahl.update((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  }

  protected spielen(): void {
    const k = this.kombination();
    if (k) void this.router.navigate(['/neu', k.ids.join(',')]);
  }

  protected spielerText(min: number, max: number): string {
    return min === max ? `${min} Spieler` : `${min}–${max} Spieler`;
  }
}
