import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ART_NAME, ENERGIE, FORM_NAME } from '../../content/begriffe';
import { Effekt } from '../../core/spiel/modell';

/**
 * Ein Effekt im Ausgabeformat aus dem Briefing:
 * Spruch ganz oben, dann Würfelergebnis, dann Nummer · Name (Mana), dann Regeltext.
 */
@Component({
  selector: 'app-effekt-karte',
  template: `
    <article class="karte" [attr.data-art]="effekt().art" [class.zerstoert]="effekt().zerstoert">
      <p class="spruch">„{{ effekt().spruch }}“</p>
      <p class="wurf">
        <span class="etikett etikett--art">{{ artName() }}</span>
        <span class="etikett">{{ formName() }}</span>
        @if (effekt().zerstoert) {
          <span class="etikett">zerstört</span>
        }
      </p>
      <h3 class="titel">
        <span class="nr">#{{ effekt().nr }}</span> · {{ effekt().name }}
        <span class="mana">({{ effekt().mana }} {{ energie }})</span>
      </h3>
      <p class="text">{{ effekt().text }}</p>
      @if (von()) {
        <p class="von">gewirkt von {{ von() }}</p>
      }
    </article>
  `,
  styles: `
    .karte {
      --art: var(--positiv);
      background: var(--feld);
      border-radius: var(--radius);
      border-top: 0.4rem solid var(--art);
      padding: 1rem 1.1rem 1.1rem;
      display: grid;
      gap: 0.55rem;
    }
    .karte[data-art='negativ'] {
      --art: var(--negativ);
    }
    .karte[data-art='chaos'] {
      --art: var(--chaos);
    }
    .zerstoert {
      opacity: 0.55;
    }
    .zerstoert .titel,
    .zerstoert .text {
      text-decoration: line-through;
    }
    p {
      margin: 0;
    }
    .spruch {
      font-family: var(--schrift-anzeige);
      font-style: italic;
      font-size: 1.1rem;
      line-height: 1.3;
    }
    .wurf {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .etikett {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 0.15rem 0.55rem;
      border-radius: 99px;
      border: 1px solid var(--feld-rand);
      color: var(--text-leise);
    }
    .etikett--art {
      background: var(--art);
      border-color: transparent;
      color: var(--feld);
    }
    .titel {
      font-size: 1.3rem;
      font-weight: 700;
    }
    .nr,
    .mana {
      color: var(--text-leise);
      font-weight: 500;
    }
    .mana {
      font-size: 1rem;
      white-space: nowrap;
    }
    .text {
      font-size: 1.05rem;
    }
    .von {
      font-size: 0.85rem;
      color: var(--text-leise);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffektKarte {
  readonly effekt = input.required<Effekt>();
  readonly von = input<string>();

  protected readonly energie = ENERGIE;
  protected readonly artName = computed(() => ART_NAME[this.effekt().art]);
  protected readonly formName = computed(() => FORM_NAME[this.effekt().form]);
}
