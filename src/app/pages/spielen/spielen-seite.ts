import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { VarianteId } from '../../core/spiel/modell';
import { SpielStore } from '../../core/spiel/spiel-store';
import { Seitenkopf } from '../../shared/ui/seitenkopf';
import { SymbolBild } from '../../shared/ui/symbol';
import { VARIANTEN_AUSSEHEN } from '../../varianten/aussehen';
import { kombinieren, VARIANTEN, variantenName } from '../../varianten/varianten';

/**
 * Startseite: die laufende Partie fortsetzen oder Varianten antippen und eine neue einrichten.
 */
@Component({
  selector: 'app-spielen-seite',
  imports: [RouterLink, Seitenkopf, SymbolBild],
  template: `
    <app-seitenkopf titel="Wildcast" [gross]="true" />

    <div class="seite" [class.mit-aktion]="auswahl().length">
      @if (laufend(); as l) {
        <a class="laufend" routerLink="/spiel">
          <span class="symbole" aria-hidden="true">
            @for (id of l.ids; track id) {
              <span class="rund" [style.--farbe]="aussehen[id].farbe">
                <app-symbol [name]="aussehen[id].symbol" />
              </span>
            }
          </span>
          <span class="laufend-text">
            <span class="etikett">Laufende Partie{{ l.runde ? ' · Runde ' + l.runde : '' }}</span>
            <span class="laufend-name">{{ l.name }}</span>
            <span class="laufend-spieler">{{ l.spieler }}</span>
          </span>
          <span class="weiter" aria-hidden="true"><app-symbol name="spielen" /></span>
          <span class="sr-only">Fortsetzen</span>
        </a>
      }

      <a class="normal" routerLink="/neu/normal">
        <span class="rund"><app-symbol name="spieler" /></span>
        <span class="laufend-text">
          <span class="normal-name">Normales Spiel</span>
          <span class="laufend-spieler">Nur Leben und Commander-Schaden</span>
        </span>
        <span class="pfeil" aria-hidden="true"><app-symbol name="weiter" /></span>
      </a>

      <section aria-labelledby="neu">
        <h2 id="neu" class="abschnitt">Mit Varianten</h2>
        <p class="hinweis">Tippe eine oder mehrere Varianten an – sie lassen sich kombinieren.</p>

        <ul class="raster">
          @for (v of varianten; track v.id) {
            <li>
              <button
                type="button"
                class="karte"
                [class.gewaehlt]="istGewaehlt(v.id)"
                [attr.aria-pressed]="istGewaehlt(v.id)"
                [style.--farbe]="aussehen[v.id].farbe"
                (click)="umschalten(v.id)"
              >
                <span class="karte-kopf">
                  <span class="rund"><app-symbol [name]="aussehen[v.id].symbol" /></span>
                  <span class="marke" aria-hidden="true"><app-symbol name="haken" /></span>
                </span>
                <span class="name">{{ v.name }}</span>
                <span class="text">{{ v.untertitel }}</span>
                <span class="spieler">{{ spielerText(v.spieler.min, v.spieler.max) }}</span>
              </button>
            </li>
          }
        </ul>
      </section>
    </div>

    @if (auswahl().length) {
      <div class="aktion">
        <button
          type="button"
          class="knopf knopf--haupt los"
          [disabled]="!kombination()"
          (click)="spielen()"
        >
          <span>{{ kombination() ? 'Weiter' : 'Passt nicht zusammen' }}</span>
          <span class="auswahl-name">
            {{
              kombination()
                ? kombination()!.name
                : 'Die Spielerzahlen dieser Varianten überschneiden sich nicht.'
            }}
          </span>
        </button>
      </div>
    }
  `,
  styles: `
    .seite {
      max-width: 40rem;
      margin-inline: auto;
      padding: 1rem 1rem 1.5rem;
      display: grid;
      gap: 1.4rem;
    }
    .mit-aktion {
      padding-bottom: 6.5rem;
    }
    .abschnitt {
      font-size: 1.3rem;
      font-weight: 800;
    }
    .hinweis {
      margin: 0.25rem 0 0.8rem;
      font-size: 0.9rem;
      color: var(--text-leise);
    }
    .rund {
      --farbe: var(--messing);
      display: grid;
      place-items: center;
      width: 2.6rem;
      height: 2.6rem;
      border-radius: 0.8rem;
      background: color-mix(in srgb, var(--farbe) 20%, transparent);
      color: var(--farbe);
      font-size: 1.05rem;
    }

    .laufend {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      padding: 1rem;
      border-radius: 1.1rem;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--messing) 22%, var(--feld)),
        var(--feld)
      );
      border: 1px solid color-mix(in srgb, var(--messing) 55%, transparent);
      color: inherit;
      text-decoration: none;
      box-shadow: var(--schatten);
      transition: transform 90ms ease;
    }
    .laufend:active {
      transform: scale(0.98);
    }
    .symbole {
      display: grid;
      gap: 0.3rem;
    }
    .symbole .rund {
      width: 2.2rem;
      height: 2.2rem;
      font-size: 0.9rem;
    }
    .laufend-text {
      flex: 1;
      min-width: 0;
      display: grid;
      gap: 0.1rem;
    }
    .etikett {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--messing);
    }
    .laufend-name {
      font-family: var(--schrift-anzeige);
      font-size: 1.25rem;
      font-weight: 800;
      line-height: 1.15;
    }
    .laufend-spieler {
      font-size: 0.85rem;
      color: var(--text-leise);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .weiter {
      display: grid;
      place-items: center;
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: var(--messing);
      color: var(--messing-text);
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .normal {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      padding: 0.85rem 1rem;
      border-radius: 1.1rem;
      background: var(--feld);
      color: inherit;
      text-decoration: none;
      box-shadow: var(--schatten);
      transition: transform 90ms ease;
    }
    .normal:active {
      transform: scale(0.98);
    }
    .normal-name {
      font-family: var(--schrift-anzeige);
      font-size: 1.1rem;
      font-weight: 800;
    }
    .pfeil {
      color: var(--text-leise);
    }

    .raster {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-auto-rows: 1fr;
      gap: 0.65rem;
    }
    .raster li {
      display: grid;
    }
    .karte {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding: 0.85rem;
      border-radius: 1.1rem;
      background: var(--feld);
      border: 2px solid transparent;
      color: inherit;
      text-align: start;
      box-shadow: var(--schatten);
      transition:
        transform 90ms ease,
        border-color 150ms,
        background 150ms;
    }
    .karte:active {
      transform: scale(0.97);
    }
    .gewaehlt {
      border-color: var(--farbe);
      background: color-mix(in srgb, var(--farbe) 10%, var(--feld));
    }
    .karte-kopf {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.2rem;
    }
    .marke {
      display: grid;
      place-items: center;
      width: 1.6rem;
      height: 1.6rem;
      border-radius: 50%;
      border: 2px solid var(--feld-rand);
      color: transparent;
      font-size: 0.75rem;
      transition:
        background 150ms,
        scale 150ms;
    }
    .gewaehlt .marke {
      background: var(--farbe);
      border-color: var(--farbe);
      color: var(--filz-tief);
      scale: 1.1;
    }
    .name {
      font-family: var(--schrift-anzeige);
      font-size: 1.1rem;
      font-weight: 800;
      line-height: 1.15;
    }
    .text {
      font-size: 0.82rem;
      line-height: 1.35;
      color: var(--text-leise);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }
    .spieler {
      margin-top: auto;
      padding-top: 0.2rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-leise);
    }

    /* Klebt über der Tab-Leiste */
    .aktion {
      position: fixed;
      inset: auto 0 calc(4.2rem + env(safe-area-inset-bottom));
      z-index: 4;
      padding: 0.75rem 1rem 0.6rem;
      background: linear-gradient(transparent, var(--filz) 30%);
      display: grid;
      justify-items: center;
      animation: hochfahren 200ms ease-out;
    }
    .los {
      width: min(100%, 38rem);
      min-height: 3.6rem;
      display: grid;
      gap: 0.05rem;
      border-radius: 1rem;
      font-size: 1.15rem;
      box-shadow: var(--schatten);
    }
    .auswahl-name {
      font-size: 0.78rem;
      font-weight: 500;
      opacity: 0.85;
    }
    @keyframes hochfahren {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpielenSeite {
  private readonly store = inject(SpielStore);
  private readonly router = inject(Router);

  protected readonly varianten = VARIANTEN.filter((v) => v.verfuegbar && !v.einzeln);
  protected readonly aussehen = VARIANTEN_AUSSEHEN;
  protected readonly auswahl = signal<VarianteId[]>([]);
  protected readonly kombination = computed(() => kombinieren(this.auswahl()));

  protected readonly laufend = computed(() => {
    const s = this.store.stand();
    if (!s) return null;
    return {
      ids: s.varianten,
      name: variantenName(s.varianten),
      runde: s.boss?.runde ?? s.runde ?? null,
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
