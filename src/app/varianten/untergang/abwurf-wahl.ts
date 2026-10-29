import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { Spieler } from '../../core/spiel/modell';
import { SpielStore } from '../../core/spiel/spiel-store';
import { SterneBewertung } from '../../shared/ui/sterne-bewertung';
import { abwurfMitId, SturmStand } from './sturm';

/** Versorgungsabwurf: Wer die wenigsten Leben hat, tippt zuerst ein Angebot an. */
@Component({
  selector: 'app-abwurf-wahl',
  imports: [SterneBewertung],
  template: `
    @if (wahl(); as w) {
      <div class="wahl">
        <p class="ankuendigung">Versorgungsabwurf</p>
        <p class="wer">
          <strong>{{ w.waehlt }}</strong> wählt
          @if (w.danach.length) {
            <span class="danach">· danach {{ w.danach.join(', ') }}</span>
          }
        </p>
        <ul class="angebote">
          @for (a of w.angebote; track a.id) {
            <li>
              <button type="button" class="angebot" (click)="store.abwurfWaehlen(a.id)">
                <span class="name">{{ a.name }}</span>
                <span class="text">{{ a.text }}</span>
              </button>
              <app-sterne-bewertung art="abwurf" [ref]="a.id" [name]="a.name" />
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: `
    .wahl {
      display: grid;
      gap: 0.7rem;
    }
    p {
      margin: 0;
    }
    .ankuendigung {
      text-align: center;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--messing);
    }
    .wer {
      text-align: center;
      font-size: 1.15rem;
    }
    .danach {
      font-size: 0.9rem;
      color: var(--text-leise);
    }
    .angebote {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    .angebot {
      width: 100%;
      display: grid;
      gap: 0.2rem;
      padding: 0.75rem 0.9rem;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      border-left: 4px solid var(--messing);
      background: var(--feld);
      color: var(--text);
      text-align: start;
      font: inherit;
    }
    .name {
      font-weight: 800;
    }
    .text {
      font-size: 0.92rem;
      line-height: 1.35;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbwurfWahl {
  protected readonly store = inject(SpielStore);
  readonly stand = input.required<SturmStand>();
  readonly spieler = input.required<Spieler[]>();

  protected readonly wahl = computed(() => {
    const a = this.stand().abwurf;
    if (!a) return null;
    const name = (id: number) => this.spieler().find((p) => p.id === id)?.name ?? '?';
    return {
      waehlt: name(a.reihenfolge[0]),
      danach: a.reihenfolge.slice(1).map(name),
      angebote: a.angebote.map((id) => abwurfMitId(id)!).filter(Boolean),
    };
  });
}
