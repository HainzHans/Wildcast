import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { BewertungsArt, bewertungsSchluessel } from '../../core/bewertung';
import { SpielStore } from '../../core/spiel/spiel-store';
import { SymbolBild } from './symbol';

/**
 * 1–5 Sterne direkt dort, wo ein Effekt, Segen, Boss … gezeigt wird. Die Wahl landet im
 * Spielstand und wird am Ende der Partie mitgeschickt. Denselben Stern nochmal antippen nimmt
 * sie zurück.
 */
@Component({
  selector: 'app-sterne-bewertung',
  imports: [SymbolBild],
  template: `
    <span class="frage">{{ frage() }}</span>
    <div class="sterne" role="radiogroup" [attr.aria-label]="'Bewertung für ' + name()">
      @for (n of fuenf; track n) {
        <button
          type="button"
          role="radio"
          class="stern"
          [class.an]="sterne() >= n"
          [attr.aria-checked]="sterne() === n"
          [attr.aria-label]="n + (n === 1 ? ' Stern' : ' Sterne')"
          (click)="setzen(n)"
        >
          <app-symbol [name]="sterne() >= n ? 'stern-voll' : 'stern'" />
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      column-gap: 0.4rem;
    }
    .frage {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-leise);
    }
    .sterne {
      display: flex;
    }
    .stern {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--feld-rand);
      font-size: 1rem;
      transition: transform 80ms;
    }
    .stern:active {
      transform: scale(0.85);
    }
    .stern.an {
      color: var(--messing);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SterneBewertung {
  private readonly store = inject(SpielStore);

  readonly art = input.required<BewertungsArt>();
  /** Kennung des Bosses, der Welt, der Effekt-Vorlage … */
  readonly ref = input.required<string>();
  readonly name = input.required<string>();
  readonly frage = input('Wie findet ihr das?');

  protected readonly fuenf = [1, 2, 3, 4, 5];
  protected readonly sterne = computed(
    () =>
      this.store.stand()?.bewertungen?.[bewertungsSchluessel(this.art(), this.ref())]?.sterne ?? 0,
  );

  protected setzen(n: number): void {
    this.store.bewerten(
      { art: this.art(), ref: this.ref(), name: this.name() },
      this.sterne() === n ? undefined : n,
    );
  }
}
