import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';

import { SpielStore } from '../../core/spiel/spiel-store';
import { SterneBewertung } from '../../shared/ui/sterne-bewertung';
import { Ueberlagerung } from '../../shared/ui/ueberlagerung';
import { angebotMitId } from './basar';

/** Der Markt: Angebot antippen, Käufer wählen, fertig. Bezahlt wird am Tisch. */
@Component({
  selector: 'app-basar-dialog',
  imports: [Ueberlagerung, SterneBewertung],
  template: `
    <app-ueberlagerung titel="Basar" (schliessen)="schliessen.emit()">
      <div class="basar">
        <p class="hinweis">Einmal pro Zug, wann du auch eine Hexerei wirken könntest.</p>
        <ul class="angebote">
          @for (a of angebote(); track a.id) {
            <li>
              <button
                type="button"
                class="angebot"
                [attr.data-stufe]="a.stufe"
                [class.aktiv]="gewaehlt() === a.id"
                [attr.aria-pressed]="gewaehlt() === a.id"
                (click)="gewaehlt.set(gewaehlt() === a.id ? null : a.id)"
              >
                <span class="preis" [attr.aria-label]="a.preis + ' Mana'">{{ a.preis }}</span>
                <span class="inhalt">
                  <span class="name">{{ a.name }}</span>
                  <span class="text">{{ a.text }}</span>
                </span>
              </button>
              @if (gewaehlt() === a.id) {
                <div class="kaeufer" role="group" aria-label="Wer kauft?">
                  <span class="frage">Wer kauft?</span>
                  @for (p of spieler(); track p.id) {
                    <button type="button" class="knopf knopf--haupt" (click)="kaufen(a.id, p.id)">
                      {{ p.name }}
                    </button>
                  }
                </div>
                <app-sterne-bewertung art="angebot" [ref]="a.id" [name]="a.name" />
              }
            </li>
          }
        </ul>
        @if (zuletzt().length) {
          <p class="zuletzt">Zuletzt gekauft: {{ zuletzt().join(' · ') }}</p>
        }
      </div>
    </app-ueberlagerung>
  `,
  styles: `
    .basar {
      display: grid;
      gap: 0.7rem;
    }
    p {
      margin: 0;
    }
    .hinweis,
    .zuletzt {
      font-size: 0.85rem;
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
      --farbe: var(--positiv);
      width: 100%;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.7rem 0.8rem;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      border-left: 4px solid var(--farbe);
      background: var(--feld);
      color: var(--text);
      text-align: start;
      font: inherit;
    }
    .angebot[data-stufe='2'] {
      --farbe: var(--messing);
    }
    .angebot[data-stufe='3'] {
      --farbe: var(--chaos);
    }
    .angebot.aktiv {
      outline: 3px solid var(--messing);
      outline-offset: -1px;
    }
    .preis {
      flex-shrink: 0;
      width: 2.2rem;
      height: 2.2rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--filz-tief);
      border: 2px solid var(--farbe);
      font-family: var(--schrift-anzeige);
      font-size: 1.15rem;
      font-weight: 800;
    }
    .inhalt {
      display: grid;
      gap: 0.15rem;
    }
    .name {
      font-weight: 800;
    }
    .text {
      font-size: 0.92rem;
      line-height: 1.35;
    }
    .kaeufer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.2rem 0.2rem;
    }
    .frage {
      font-weight: 700;
      margin-right: 0.2rem;
    }
    .kaeufer .knopf {
      min-height: 2.6rem;
      padding: 0.3rem 0.9rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasarDialog {
  private readonly store = inject(SpielStore);
  readonly schliessen = output<void>();

  protected readonly gewaehlt = signal<string | null>(null);
  protected readonly spieler = computed(() =>
    (this.store.stand()?.spieler ?? []).filter((p) => p.leben > 0),
  );
  protected readonly angebote = computed(() =>
    (this.store.stand()?.basar?.angebote ?? []).map((id) => angebotMitId(id)!).filter(Boolean),
  );
  protected readonly zuletzt = computed(() => {
    const s = this.store.stand();
    return (s?.basar?.gekauft ?? [])
      .slice(-3)
      .reverse()
      .map((k) => {
        const wer = s?.spieler.find((p) => p.id === k.spielerId)?.name ?? '?';
        return `${wer}: ${angebotMitId(k.id)?.name ?? k.id}`;
      });
  });

  protected kaufen(angebotId: string, spielerId: number): void {
    this.store.basarKaufen(angebotId, spielerId);
    this.gewaehlt.set(null);
  }
}
