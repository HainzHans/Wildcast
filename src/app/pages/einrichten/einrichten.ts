import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { SpielStore } from '../../core/spiel/spiel-store';
import { ZurueckLink } from '../../shared/ui/zurueck-link';
import { varianteMitId } from '../../varianten/varianten';

const LEBEN_AUSWAHL = [20, 30, 40];

@Component({
  selector: 'app-einrichten',
  imports: [ZurueckLink],
  template: `
    <div class="seite">
      <app-zurueck-link />

      @if (eintrag(); as v) {
        <header>
          <h1>{{ v.name }}</h1>
          <p class="untertitel">{{ v.untertitel }}</p>
        </header>

        <form (submit)="starten($event)">
          @if (anzahlAuswahl().length > 1) {
            <fieldset>
              <legend>Spieler</legend>
              <div class="auswahl">
                @for (n of anzahlAuswahl(); track n) {
                  <button
                    type="button"
                    class="knopf"
                    [class.knopf--haupt]="anzahl() === n"
                    [attr.aria-pressed]="anzahl() === n"
                    (click)="anzahl.set(n)"
                  >
                    {{ n }}
                  </button>
                }
              </div>
            </fieldset>
          }

          <fieldset>
            <legend>Namen</legend>
            <div class="namen">
              @for (i of plaetze(); track i) {
                <label>
                  <span class="sr-only">Name Spieler {{ i + 1 }}</span>
                  <input
                    type="text"
                    autocomplete="off"
                    maxlength="20"
                    [placeholder]="'Spieler ' + (i + 1)"
                    [value]="namen()[i]"
                    (input)="nameSetzen(i, $any($event.target).value)"
                  />
                </label>
              }
            </div>
          </fieldset>

          <fieldset>
            <legend>Startleben</legend>
            <div class="auswahl">
              @for (l of lebenAuswahl; track l) {
                <button
                  type="button"
                  class="knopf"
                  [class.knopf--haupt]="startLeben() === l"
                  [attr.aria-pressed]="startLeben() === l"
                  (click)="startLeben.set(l)"
                >
                  {{ l }}
                </button>
              }
            </div>
          </fieldset>

          @if (v.regeln.length) {
            <details class="regeln">
              <summary>Regeln</summary>
              <ul>
                @for (r of v.regeln; track $index) {
                  <li>{{ r }}</li>
                }
              </ul>
            </details>
          }

          <button type="submit" class="knopf knopf--haupt los">Spiel starten</button>
        </form>
      } @else {
        <p>Diese Variante gibt es (noch) nicht.</p>
      }
    </div>
  `,
  styles: `
    .seite {
      max-width: 32rem;
      margin-inline: auto;
      padding: 1.25rem 1rem 3rem;
      display: grid;
      gap: 1.25rem;
    }
    h1 {
      font-size: clamp(2.2rem, 9vw, 3rem);
      font-weight: 800;
    }
    .untertitel {
      margin: 0.4rem 0 0;
      color: var(--text-leise);
    }
    form {
      display: grid;
      gap: 1.25rem;
    }
    fieldset {
      border: 0;
      padding: 0;
      margin: 0;
    }
    legend {
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .auswahl {
      display: flex;
      gap: 0.5rem;
    }
    .auswahl .knopf {
      min-width: 3.5rem;
      font-size: 1.1rem;
    }
    .namen {
      display: grid;
      gap: 0.5rem;
    }
    input {
      width: 100%;
      min-height: var(--tippflaeche);
      padding: 0.6rem 0.9rem;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      background: var(--feld);
      color: var(--text);
      font: inherit;
      font-size: 1.05rem;
    }
    .regeln {
      background: var(--feld);
      border-radius: var(--radius);
      padding: 0.8rem 1rem;
    }
    .regeln summary {
      font-weight: 700;
      cursor: pointer;
    }
    .regeln ul {
      margin: 0.6rem 0 0;
      padding-left: 1.2rem;
      display: grid;
      gap: 0.4rem;
    }
    .los {
      font-size: 1.15rem;
      min-height: 3.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Einrichten {
  private readonly store = inject(SpielStore);
  private readonly router = inject(Router);

  /** Kommt über die Route `neu/:variante`. */
  readonly variante = input<string>('');

  protected readonly eintrag = computed(() => {
    const v = varianteMitId(this.variante());
    return v?.verfuegbar ? v : undefined;
  });

  protected readonly lebenAuswahl = LEBEN_AUSWAHL;
  protected readonly anzahl = linkedSignal(() => this.eintrag()?.spieler.standard ?? 2);
  protected readonly startLeben = linkedSignal(() => this.eintrag()?.startLeben ?? 40);
  protected readonly namen = signal(['', '', '', '']);

  protected readonly anzahlAuswahl = computed(() => {
    const v = this.eintrag();
    if (!v) return [];
    return Array.from({ length: v.spieler.max - v.spieler.min + 1 }, (_, i) => v.spieler.min + i);
  });
  protected readonly plaetze = computed(() => Array.from({ length: this.anzahl() }, (_, i) => i));

  protected nameSetzen(i: number, name: string): void {
    this.namen.update((n) => n.map((alt, j) => (j === i ? name : alt)));
  }

  protected starten(ereignis: Event): void {
    ereignis.preventDefault();
    const v = this.eintrag();
    if (!v) return;
    const namen = this.plaetze().map((i) => this.namen()[i].trim() || `Spieler ${i + 1}`);
    this.store.starten(v.id, namen, this.startLeben());
    this.router.navigateByUrl('/spiel');
  }
}
