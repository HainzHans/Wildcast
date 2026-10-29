import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { SpielStore } from '../../core/spiel/spiel-store';
import { HalteKnopf } from '../../shared/ui/halte-knopf';
import { COMMANDER_TOEDLICH, COMMANDER_WARNUNG } from './spieler-feld';

/**
 * Commander-Schaden für einen Spieler eintragen – je Gegner eine Zeile. Bei zwei Spielern ist es
 * nur eine, ab drei wählt man so automatisch, von wessen Commander der Schaden kommt.
 */
@Component({
  selector: 'app-commander-dialog',
  imports: [HalteKnopf],
  template: `
    @if (ziel(); as z) {
      <p class="einleitung">Schaden, den <strong>{{ z.name }}</strong> von einem Commander erlitten hat.</p>
      <ul class="zeilen">
        @for (g of gegner(); track g.id) {
          <li
            class="zeile"
            [class.warnung]="g.schaden >= warnung"
            [class.toedlich]="g.schaden >= toedlich"
          >
            <span class="von">
              <span class="etikett">von</span>
              <span class="name">{{ g.name }}</span>
              @if (g.schaden >= toedlich) {
                <span class="raus">{{ z.name }} ist raus</span>
              }
            </span>
            <button
              type="button"
              class="schritt"
              [disabled]="!g.schaden"
              [attr.aria-label]="'Ein Commander-Schaden weniger von ' + g.name"
              appHalteKnopf
              (halte)="aendern(g.id, -1)"
            >
              −
            </button>
            <span class="zahl" aria-live="polite">{{ g.schaden }}</span>
            <button
              type="button"
              class="schritt plus"
              [attr.aria-label]="'Ein Commander-Schaden mehr von ' + g.name"
              appHalteKnopf
              (halte)="aendern(g.id, 1)"
            >
              +
            </button>
          </li>
        }
      </ul>
      <p class="hinweis">
        Wird auch von den Leben abgezogen. Ab {{ toedlich }} Schaden vom selben Commander ist man raus.
      </p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.8rem;
    }
    p {
      margin: 0;
    }
    .einleitung {
      text-align: center;
    }
    .hinweis {
      font-size: 0.85rem;
      color: var(--text-leise);
      text-align: center;
    }
    .zeilen {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    .zeile {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.6rem 0.7rem 0.6rem 1rem;
      border-radius: 1rem;
      background: var(--feld);
      border: 2px solid transparent;
    }
    .zeile.warnung {
      border-color: var(--messing);
    }
    .zeile.toedlich {
      border-color: var(--negativ);
    }
    .von {
      flex: 1;
      min-width: 0;
      display: grid;
    }
    .etikett {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    .name {
      font-weight: 700;
      font-size: 1.05rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .raus {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--negativ);
    }
    .zahl {
      min-width: 2.2ch;
      text-align: center;
      font-family: var(--schrift-anzeige);
      font-size: 2rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }
    .toedlich .zahl {
      color: var(--negativ);
    }
    .schritt {
      flex-shrink: 0;
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      border: 1px solid var(--feld-rand);
      background: var(--filz);
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
      transition: transform 80ms;
    }
    .schritt:active:not(:disabled) {
      transform: scale(0.92);
    }
    .schritt:disabled {
      opacity: 0.35;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommanderDialog {
  private readonly store = inject(SpielStore);

  readonly spielerId = input.required<number>();

  protected readonly warnung = COMMANDER_WARNUNG;
  protected readonly toedlich = COMMANDER_TOEDLICH;

  protected readonly ziel = computed(() =>
    this.store.stand()?.spieler.find((p) => p.id === this.spielerId()),
  );
  protected readonly gegner = computed(() => {
    const ziel = this.ziel();
    return (this.store.stand()?.spieler ?? [])
      .filter((p) => p.id !== ziel?.id)
      .map((p) => ({ id: p.id, name: p.name, schaden: ziel?.commander?.[p.id] ?? 0 }));
  });

  protected aendern(quelleId: number, um: number): void {
    this.store.commanderSchaden(this.spielerId(), quelleId, um);
  }
}
