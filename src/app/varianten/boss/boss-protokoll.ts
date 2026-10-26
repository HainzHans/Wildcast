import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';

import { SpielStore } from '../../core/spiel/spiel-store';
import { Ueberlagerung } from '../../shared/ui/ueberlagerung';
import { STIMMUNG_NAME } from './boss-zug-dialog';

/** Alle bisherigen Boss-Züge, der neueste oben. */
@Component({
  selector: 'app-boss-protokoll',
  imports: [Ueberlagerung],
  template: `
    <app-ueberlagerung titel="Boss-Protokoll" (schliessen)="schliessen.emit()">
      <h2>Boss-Protokoll</h2>
      <ol class="liste">
        @for (e of eintraege(); track e.runde) {
          <li class="eintrag">
            <p class="kopf">Runde {{ e.runde }} · {{ stimmung[e.stimmung] }}</p>
            <p class="spruch">„{{ e.spruch }}“</p>
            @for (a of e.aktionen; track $index) {
              <p class="aktion">
                <strong>{{ a.name }}:</strong> {{ a.text }}
              </p>
            }
            @for (r of e.relikte ?? []; track $index) {
              <p class="aktion">{{ r }}</p>
            }
            <p class="folgen">
              @for (l of e.lebenAenderungen; track $index) {
                <span>{{ l.name }} {{ l.um < 0 ? '−' + -l.um : '+' + l.um }} Leben</span>
              }
              @if (e.diener) {
                <span>+ {{ e.diener }}</span>
              }
              @if (e.angriffsziel) {
                <span>Angriff auf {{ e.angriffsziel }}</span>
              }
            </p>
          </li>
        } @empty {
          <li class="leer">Der Boss hat noch keinen Zug gemacht.</li>
        }
      </ol>
    </app-ueberlagerung>
  `,
  styles: `
    h2 {
      font-size: 1.6rem;
      font-weight: 800;
      margin-bottom: 0.8rem;
    }
    .liste {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 0.6rem;
    }
    .eintrag {
      background: var(--feld);
      border-radius: var(--radius);
      border-left: 4px solid var(--negativ);
      padding: 0.7rem 0.9rem;
      display: grid;
      gap: 0.35rem;
    }
    p {
      margin: 0;
    }
    .kopf {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    .spruch {
      font-family: var(--schrift-anzeige);
      font-style: italic;
    }
    .folgen {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem 0.8rem;
      font-size: 0.85rem;
      color: var(--text-leise);
    }
    .leer {
      color: var(--text-leise);
      text-align: center;
      padding: 1.5rem 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BossProtokollListe {
  private readonly store = inject(SpielStore);
  readonly schliessen = output<void>();

  protected readonly stimmung = STIMMUNG_NAME;
  /** Neueste zuerst; gleiche neue Diener zusammengefasst („4× Skelettkrieger“). */
  protected readonly eintraege = computed(() =>
    [...(this.store.stand()?.boss?.protokoll ?? [])].reverse().map((e) => {
      const anzahl = new Map<string, number>();
      for (const name of e.neueDiener) anzahl.set(name, (anzahl.get(name) ?? 0) + 1);
      const diener = [...anzahl].map(([name, n]) => (n > 1 ? `${n}× ${name}` : name)).join(', ');
      return { ...e, diener };
    }),
  );
}
