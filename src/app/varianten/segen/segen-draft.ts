import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';

import { Spieler } from '../../core/spiel/modell';
import { SpielStore } from '../../core/spiel/spiel-store';
import { aktuelleAuswahl, segenMitId, SegenStand } from './segen';

/**
 * Der Draft auf einem Gerät: Erst wird das Gerät weitergereicht, dann sieht nur der Wählende
 * sein Päckchen, tippt einen Segen an und bestätigt.
 */
@Component({
  selector: 'app-segen-draft',
  template: `
    @let s = stand();
    @if (!bereit()) {
      <div class="weitergeben">
        <p class="ankuendigung">Segen-Draft · Wahl {{ s.schritt + 1 }} von {{ s.anzahl }}</p>
        <p class="gib">Gib das Gerät an</p>
        <p class="name">{{ waehler().name }}</p>
        <p class="hinweis">Die anderen schauen bitte weg.</p>
        <button type="button" class="knopf knopf--haupt" (click)="bereit.set(true)">
          Ich bin {{ waehler().name }}
        </button>
      </div>
    } @else {
      <div class="waehlen">
        <p class="ankuendigung">
          {{ waehler().name }} · Wahl {{ s.schritt + 1 }} von {{ s.anzahl }}
        </p>
        @if (meine().length) {
          <p class="meine">Schon gewählt: {{ meine().join(', ') }}</p>
        }
        <ul class="segen">
          @for (x of auswahl(); track x.id) {
            <li>
              <button
                type="button"
                class="segen-knopf"
                [class.pakt]="x.pakt"
                [class.aktiv]="markiert() === x.id"
                [attr.aria-pressed]="markiert() === x.id"
                (click)="markiert.set(x.id)"
              >
                <span class="kopf">
                  <span class="titel">{{ x.name }}</span>
                  @if (x.pakt) {
                    <span class="marke">Pakt</span>
                  } @else if (x.einmalig) {
                    <span class="marke">Einmalig</span>
                  }
                </span>
                <span class="text">{{ x.text }}</span>
              </button>
            </li>
          }
        </ul>
        <button
          type="button"
          class="knopf knopf--haupt"
          [disabled]="!markiert()"
          (click)="nehmen()"
        >
          Diesen Segen nehmen
        </button>
      </div>
    }
  `,
  styles: `
    .weitergeben,
    .waehlen {
      display: grid;
      gap: 0.7rem;
    }
    .weitergeben {
      text-align: center;
      padding: 1rem 0 0.5rem;
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
    .gib {
      color: var(--text-leise);
    }
    .name {
      font-family: var(--schrift-anzeige);
      font-size: 2.2rem;
      font-weight: 800;
      line-height: 1.1;
    }
    .hinweis,
    .meine {
      font-size: 0.9rem;
      color: var(--text-leise);
    }
    .segen {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    .segen-knopf {
      width: 100%;
      display: grid;
      gap: 0.25rem;
      padding: 0.75rem 0.9rem;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      border-left: 4px solid var(--positiv);
      background: var(--feld);
      color: var(--text);
      text-align: start;
      font: inherit;
    }
    .segen-knopf.pakt {
      border-left-color: var(--chaos);
    }
    .segen-knopf.aktiv {
      outline: 3px solid var(--messing);
      outline-offset: -1px;
    }
    .kopf {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.5rem;
    }
    .titel {
      font-weight: 800;
    }
    .marke {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    .text {
      font-size: 0.92rem;
      line-height: 1.35;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegenDraft {
  private readonly store = inject(SpielStore);
  readonly stand = input.required<SegenStand>();
  readonly spieler = input.required<Spieler[]>();

  protected readonly waehler = computed(() => this.spieler()[this.stand().waehler]);
  protected readonly auswahl = computed(() => aktuelleAuswahl(this.stand()));
  protected readonly meine = computed(() => {
    const w = this.waehler();
    const gewaehlt = w ? (this.stand().gewaehlt[w.id] ?? []) : [];
    return gewaehlt.map((id) => segenMitId(id)?.name ?? id);
  });
  /** Mit jedem neuen Wähler zurück auf „Gerät weitergeben“. */
  protected readonly bereit = linkedSignal({
    source: () => `${this.stand().schritt}:${this.stand().waehler}`,
    computation: () => false,
  });
  protected readonly markiert = linkedSignal<string, string | null>({
    source: () => `${this.stand().schritt}:${this.stand().waehler}`,
    computation: () => null,
  });

  protected nehmen(): void {
    const id = this.markiert();
    if (id) this.store.segenWaehlen(id);
  }
}
