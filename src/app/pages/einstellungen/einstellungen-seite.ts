import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { Einstellungen, Farbschema } from '../../core/einstellungen';
import { SpielStore } from '../../core/spiel/spiel-store';
import { BestaetigenKnopf } from '../../shared/ui/bestaetigen-knopf';
import { ZurueckLink } from '../../shared/ui/zurueck-link';
import { EffektArchiv } from '../../varianten/mana-wuerfel/effekt-archiv';
import { variantenName } from '../../varianten/varianten';

@Component({
  selector: 'app-einstellungen-seite',
  imports: [BestaetigenKnopf, ZurueckLink],
  template: `
    <div class="seite">
      <app-zurueck-link />
      <h1>Einstellungen</h1>

      <section class="gruppe" aria-labelledby="anzeige">
        <h2 id="anzeige">Anzeige</h2>

        <div class="zeile">
          <div>
            <p class="titel">Farbschema</p>
            <p class="hinweis">Ohne Auswahl folgt die App deinem Gerät.</p>
          </div>
          <div class="auswahl" role="group" aria-label="Farbschema">
            @for (f of farbschemata; track f.wert) {
              <button
                type="button"
                class="knopf"
                [class.knopf--haupt]="einstellungen.farbschema() === f.wert"
                [attr.aria-pressed]="einstellungen.farbschema() === f.wert"
                (click)="einstellungen.farbschema.set(f.wert)"
              >
                {{ f.name }}
              </button>
            }
          </div>
        </div>
      </section>

      <section class="gruppe" aria-labelledby="tisch">
        <h2 id="tisch">Spieltisch</h2>

        <label class="zeile">
          <div>
            <p class="titel">Tischmodus</p>
            <p class="hinweis">Am Handy die Spielerfelder zum jeweiligen Spieler drehen.</p>
          </div>
          <input
            type="checkbox"
            role="switch"
            [checked]="einstellungen.tischmodus()"
            (change)="einstellungen.tischmodus.set($any($event.target).checked)"
          />
        </label>

        <label class="zeile">
          <div>
            <p class="titel">Bildschirm anlassen</p>
            <p class="hinweis">Während der Partie geht das Display nicht aus.</p>
          </div>
          <input
            type="checkbox"
            role="switch"
            [checked]="einstellungen.wachHalten()"
            (change)="einstellungen.wachHalten.set($any($event.target).checked)"
          />
        </label>
      </section>

      <section class="gruppe" aria-labelledby="archiv">
        <h2 id="archiv">Effekt-Archiv</h2>
        <div class="zeile">
          <div>
            <p class="titel">{{ archivText() }}</p>
            <p class="hinweis" aria-live="polite">{{ archivHinweis() }}</p>
          </div>
          <button
            type="button"
            class="knopf"
            [disabled]="archiv.status() === 'laedt'"
            (click)="archiv.aktualisieren()"
          >
            {{ archiv.status() === 'laedt' ? 'Lädt …' : 'Aktualisieren' }}
          </button>
        </div>
      </section>

      <section class="gruppe" aria-labelledby="partie">
        <h2 id="partie">Partie</h2>
        <div class="zeile">
          <div>
            <p class="titel">Laufende Partie</p>
            <p class="hinweis">{{ laufend() ?? 'Gerade läuft keine Partie.' }}</p>
          </div>
          @if (laufend()) {
            <app-bestaetigen-knopf
              label="Löschen"
              frage="Wirklich löschen?"
              (bestaetigt)="store.beenden()"
            />
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .seite {
      max-width: 36rem;
      margin-inline: auto;
      padding: 1.25rem 1rem 3rem;
      display: grid;
      gap: 1.25rem;
    }
    h1 {
      font-size: clamp(2.2rem, 9vw, 3rem);
      font-weight: 800;
    }
    .gruppe {
      display: grid;
      gap: 0.5rem;
    }
    h2 {
      font-family: var(--schrift-text);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    .zeile {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem 1rem;
      padding: 0.9rem 1rem;
      background: var(--feld);
      border-radius: var(--radius);
      box-shadow: var(--schatten);
    }
    label.zeile {
      cursor: pointer;
      flex-wrap: nowrap;
    }
    .titel {
      margin: 0;
      font-weight: 700;
    }
    .hinweis {
      margin: 0.15rem 0 0;
      font-size: 0.85rem;
      color: var(--text-leise);
    }
    .auswahl {
      display: flex;
      gap: 0.4rem;
    }
    input[type='checkbox'] {
      flex-shrink: 0;
      width: 3.25rem;
      height: 1.9rem;
      margin: 0;
      appearance: none;
      border-radius: 99px;
      background: var(--filz-tief);
      border: 1px solid var(--feld-rand);
      position: relative;
      cursor: pointer;
      transition: background 150ms;
    }
    input[type='checkbox']::after {
      content: '';
      position: absolute;
      top: 0.2rem;
      left: 0.2rem;
      width: 1.4rem;
      height: 1.4rem;
      border-radius: 50%;
      background: var(--text-leise);
      transition: translate 150ms;
    }
    input[type='checkbox']:checked {
      background: var(--messing);
      border-color: transparent;
    }
    input[type='checkbox']:checked::after {
      background: var(--messing-text);
      translate: 1.35rem 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EinstellungenSeite {
  protected readonly einstellungen = inject(Einstellungen);
  protected readonly store = inject(SpielStore);
  protected readonly archiv = inject(EffektArchiv);

  protected readonly archivText = computed(() => {
    const n = this.archiv.anzahl();
    return n ? `${n} Effekte im Archiv` : 'Noch kein Archiv geladen';
  });

  protected readonly archivHinweis = computed(() => {
    if (this.archiv.status() === 'fehler') {
      return this.archiv.anzahl()
        ? 'Gerade nicht erreichbar – gewürfelt wird mit dem gespeicherten Stand.'
        : 'Gerade nicht erreichbar – gewürfelt wird mit der eingebauten Liste.';
    }
    const zeit = this.archiv.aktualisiert();
    if (!zeit) return 'Bis dahin würfelt die App mit der eingebauten Liste.';
    const datum = new Date(zeit).toLocaleString('de-DE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    return `Zuletzt aktualisiert: ${datum}. Funktioniert auch offline.`;
  });

  protected readonly farbschemata: { wert: Farbschema; name: string }[] = [
    { wert: 'system', name: 'Auto' },
    { wert: 'hell', name: 'Hell' },
    { wert: 'dunkel', name: 'Dunkel' },
  ];

  protected readonly laufend = computed(() => {
    const s = this.store.stand();
    if (!s) return null;
    const leben = s.spieler.map((p) => `${p.name} ${p.leben}`).join(' · ');
    return `${variantenName(s.varianten)}: ${leben}`;
  });
}
