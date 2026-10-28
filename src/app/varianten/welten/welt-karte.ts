import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Welt, WeltArt } from './welten';

const ART_NAME: Record<WeltArt, string> = {
  normal: 'Normale Welt',
  chaos: 'Chaos-Welt',
  verrueckt: 'Verrückte Welt',
};

/** Eine Welt groß: Art, Name, Stimmung, bleibende Regel und was beim Erscheinen passiert. */
@Component({
  selector: 'app-welt-karte',
  template: `
    <article class="karte" [attr.data-art]="welt().art">
      <p class="art">{{ artName() }}</p>
      <h2 class="name">{{ welt().name }}</h2>
      <p class="stimmung">{{ welt().stimmung }}</p>
      <p class="regel">{{ welt().regel }}</p>
      @if (welt().erscheinen; as e) {
        <p class="erscheinen"><strong>Beim Erscheinen:</strong> {{ e.text }}</p>
      }
      @if (hinweis()) {
        <p class="hinweis">{{ hinweis() }}</p>
      }
    </article>
  `,
  styles: `
    .karte {
      --farbe: var(--positiv);
      display: grid;
      gap: 0.55rem;
      padding: 1.1rem 1.2rem 1.2rem;
      border-radius: var(--radius);
      border: 1px solid var(--feld-rand);
      border-top: 5px solid var(--farbe);
      background: var(--feld);
    }
    .karte[data-art='chaos'] {
      --farbe: var(--negativ);
    }
    .karte[data-art='verrueckt'] {
      --farbe: var(--chaos);
    }
    p {
      margin: 0;
    }
    .art {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--farbe);
    }
    .name {
      font-family: var(--schrift-anzeige);
      font-size: 1.8rem;
      font-weight: 800;
      line-height: 1.1;
    }
    .stimmung {
      font-style: italic;
      color: var(--text-leise);
    }
    .regel {
      font-size: 1.15rem;
      font-weight: 600;
      line-height: 1.4;
    }
    .erscheinen {
      padding: 0.6rem 0.8rem;
      border-radius: var(--radius-klein);
      background: var(--filz-tief);
      font-size: 0.95rem;
    }
    .hinweis {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--messing);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeltKarte {
  readonly welt = input.required<Welt>();
  /** Z. B. „Neue Welt in 2 Runden“. */
  readonly hinweis = input<string>('');

  protected readonly artName = computed(() => ART_NAME[this.welt().art]);
}
