import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';

import { ART_NAME } from '../../content/begriffe';
import { Art } from '../../core/spiel/modell';
import { SpielStore } from '../../core/spiel/spiel-store';
import { Ueberlagerung } from '../../shared/ui/ueberlagerung';
import { EffektKarte } from './effekt-karte';

type Filter = Art | 'alle';

@Component({
  selector: 'app-effekt-liste',
  imports: [Ueberlagerung, EffektKarte],
  template: `
    <app-ueberlagerung titel="Effekte" (schliessen)="schliessen.emit()">
      <h2>Effekte</h2>

      <dl class="bilanz">
        <div>
          <dt>Gesamt</dt>
          <dd>{{ bilanz().alle }}</dd>
        </div>
        @for (a of arten; track a) {
          <div [attr.data-art]="a">
            <dt>{{ artName[a] }}</dt>
            <dd>{{ bilanz()[a] }}</dd>
          </div>
        }
      </dl>

      <div class="filter" role="group" aria-label="Filter">
        @for (f of filterAuswahl; track f) {
          <button
            type="button"
            class="chip"
            [class.aktiv]="filter() === f"
            [attr.aria-pressed]="filter() === f"
            (click)="filter.set(f)"
          >
            {{ f === 'alle' ? 'Alle' : artName[f] }}
          </button>
        }
      </div>

      <ol class="liste">
        @for (e of sichtbar(); track e.nr) {
          <li><app-effekt-karte [effekt]="e" [von]="namen().get(e.spielerId)" /></li>
        } @empty {
          <li class="leer">Noch keine Effekte gewirkt.</li>
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
    .bilanz {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.4rem;
      margin: 0 0 0.9rem;
    }
    .bilanz div {
      background: var(--feld);
      border-radius: var(--radius-klein);
      padding: 0.5rem;
      text-align: center;
      border-bottom: 3px solid var(--feld-rand);
    }
    .bilanz [data-art='positiv'] {
      border-color: var(--positiv);
    }
    .bilanz [data-art='negativ'] {
      border-color: var(--negativ);
    }
    .bilanz [data-art='chaos'] {
      border-color: var(--chaos);
    }
    dt {
      font-size: 0.75rem;
      color: var(--text-leise);
    }
    dd {
      margin: 0;
      font-family: var(--schrift-anzeige);
      font-size: 1.6rem;
      font-weight: 700;
    }
    .filter {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
      margin-bottom: 0.9rem;
    }
    .chip {
      min-height: 2.5rem;
      padding: 0 0.9rem;
      border-radius: 99px;
      border: 1px solid var(--feld-rand);
      background: var(--feld);
      font-weight: 600;
    }
    .chip.aktiv {
      background: var(--messing);
      border-color: transparent;
      color: var(--messing-text);
    }
    .liste {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 0.6rem;
    }
    .leer {
      color: var(--text-leise);
      text-align: center;
      padding: 1.5rem 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffektListe {
  private readonly store = inject(SpielStore);
  readonly schliessen = output<void>();

  protected readonly arten: Art[] = ['positiv', 'negativ', 'chaos'];
  protected readonly filterAuswahl: Filter[] = ['alle', ...this.arten];
  protected readonly artName = ART_NAME;
  protected readonly filter = signal<Filter>('alle');

  private readonly effekte = computed(() => this.store.stand()?.effekte ?? []);
  protected readonly namen = computed(
    () => new Map(this.store.stand()?.spieler.map((s) => [s.id, s.name]) ?? []),
  );
  protected readonly bilanz = computed(() => {
    const e = this.effekte();
    return {
      alle: e.length,
      positiv: e.filter((x) => x.art === 'positiv').length,
      negativ: e.filter((x) => x.art === 'negativ').length,
      chaos: e.filter((x) => x.art === 'chaos').length,
    };
  });
  protected readonly sichtbar = computed(() => {
    const f = this.filter();
    return this.effekte()
      .filter((e) => f === 'alle' || e.art === f)
      .reverse();
  });
}
