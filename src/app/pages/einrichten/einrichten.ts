import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { SpielStore } from '../../core/spiel/spiel-store';
import { ZurueckLink } from '../../shared/ui/zurueck-link';
import {
  istWuerfelbar,
  letzteWuerfelEinstellungen,
  merkeWuerfelEinstellungen,
  STANDARD_WUERFEL,
} from '../../varianten/mana-wuerfel/wuerfel-einstellungen';
import { WuerfelRegeln } from '../../varianten/mana-wuerfel/wuerfel-regeln';
import { BOSSE, bossMitId } from '../../varianten/boss/bosse';
import { kombinieren } from '../../varianten/varianten';

const LEBEN_AUSWAHL = [20, 40];
const LEBEN_MAX = 999;

@Component({
  selector: 'app-einrichten',
  imports: [ZurueckLink, WuerfelRegeln],
  template: `
    <div class="seite">
      <app-zurueck-link />

      @if (eintrag(); as v) {
        <header>
          <h1>{{ v.name }}</h1>
          <p class="untertitel">{{ v.untertitel }}</p>
        </header>

        <form (submit)="starten($event)">
          @if (anzahlAuswahl().length > 1) {
            <fieldset>
              <legend>Spieler</legend>
              <div class="auswahl">
                @for (n of anzahlAuswahl(); track n) {
                  <button
                    type="button"
                    class="knopf"
                    [class.knopf--haupt]="anzahl() === n"
                    [attr.aria-pressed]="anzahl() === n"
                    (click)="anzahl.set(n)"
                  >
                    {{ n }}
                  </button>
                }
              </div>
            </fieldset>
          }

          <fieldset>
            <legend>Namen</legend>
            <div class="namen">
              @for (i of plaetze(); track i) {
                <label>
                  <span class="sr-only">Name Spieler {{ i + 1 }}</span>
                  <input
                    type="text"
                    autocomplete="off"
                    maxlength="20"
                    [placeholder]="'Spieler ' + (i + 1)"
                    [value]="namen()[i]"
                    (input)="nameSetzen(i, $any($event.target).value)"
                  />
                </label>
              }
            </div>
          </fieldset>

          <fieldset>
            <legend>Lebenspunkte</legend>
            <div class="auswahl">
              @for (l of lebenAuswahl; track l) {
                <button
                  type="button"
                  class="knopf"
                  [class.knopf--haupt]="startLeben() === l && !eigeneLeben()"
                  [attr.aria-pressed]="startLeben() === l && !eigeneLeben()"
                  (click)="lebenWaehlen(l)"
                >
                  {{ l }}
                </button>
              }
              <label class="eigene" [class.aktiv]="eigeneLeben()">
                <span class="sr-only">Eigene Lebenspunkte</span>
                <input
                  type="number"
                  inputmode="numeric"
                  min="1"
                  [max]="lebenMax"
                  placeholder="Eigene"
                  [value]="eigeneLeben() ? startLeben() : ''"
                  (input)="lebenEingeben($any($event.target).value)"
                />
              </label>
            </div>
          </fieldset>

          @if (boss(); as b) {
            <fieldset>
              <legend>Boss</legend>
              <div class="bosse" role="radiogroup" aria-label="Boss wählen">
                @for (x of bosse; track x.id) {
                  <button
                    type="button"
                    role="radio"
                    class="boss-wahl"
                    [class.aktiv]="x.id === b.id"
                    [attr.aria-checked]="x.id === b.id"
                    (click)="bossId.set(x.id)"
                  >
                    <span class="boss-level">{{ x.level }}</span>
                    <span class="boss-name">{{ x.name }}</span>
                  </button>
                }
              </div>
              <section class="boss-info" aria-live="polite">
                <p class="boss-titel">
                  {{ b.name }} <span>Level {{ b.level }} · {{ b.leben }} Leben</span>
                </p>
                <p class="boss-beschreibung">{{ b.beschreibung }}</p>
                <p class="boss-passiv"><strong>Passiv:</strong> {{ b.passiv }}</p>
                @if (b.rundenEffekt) {
                  <p class="boss-passiv"><strong>Jede Runde:</strong> {{ b.rundenEffekt.text }}</p>
                }
              </section>
            </fieldset>
          }

          @if (mitWuerfel()) {
            <details class="hausregeln">
              <summary>
                Würfel-Hausregeln
                <span class="stand">{{ wuerfelAngepasst() ? 'Angepasst' : 'Standard' }}</span>
              </summary>
              <app-wuerfel-regeln [(einstellungen)]="wuerfel" />
            </details>
          }

          @for (teil of v.varianten; track teil.id) {
            @if (teil.regeln.length) {
              <details class="regeln">
                <summary>Regeln{{ v.varianten.length > 1 ? ': ' + teil.name : '' }}</summary>
                <ul>
                  @for (r of teil.regeln; track $index) {
                    <li>{{ r }}</li>
                  }
                </ul>
              </details>
            }
          }

          <button type="submit" class="knopf knopf--haupt los" [disabled]="!startbereit()">
            Spiel starten
          </button>
        </form>
      } @else {
        <p>Diese Auswahl lässt sich (noch) nicht spielen.</p>
      }
    </div>
  `,
  styles: `
    .seite {
      max-width: 32rem;
      margin-inline: auto;
      padding: 1.25rem 1rem 3rem;
      display: grid;
      gap: 1.25rem;
    }
    h1 {
      font-size: clamp(2.2rem, 9vw, 3rem);
      font-weight: 800;
    }
    .untertitel {
      margin: 0.4rem 0 0;
      color: var(--text-leise);
    }
    form {
      display: grid;
      gap: 1.25rem;
    }
    fieldset {
      border: 0;
      padding: 0;
      margin: 0;
    }
    legend {
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .auswahl {
      display: flex;
      gap: 0.5rem;
    }
    .auswahl .knopf {
      min-width: 3.5rem;
      font-size: 1.1rem;
    }
    .namen {
      display: grid;
      gap: 0.5rem;
    }
    input {
      width: 100%;
      min-height: var(--tippflaeche);
      padding: 0.6rem 0.9rem;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      background: var(--feld);
      color: var(--text);
      font: inherit;
      font-size: 1.05rem;
    }
    .regeln {
      background: var(--feld);
      border-radius: var(--radius);
      padding: 0.8rem 1rem;
    }
    .regeln summary {
      font-weight: 700;
      cursor: pointer;
    }
    .regeln ul {
      margin: 0.6rem 0 0;
      padding-left: 1.2rem;
      display: grid;
      gap: 0.4rem;
    }
    .eigene input {
      width: 6.5rem;
      min-height: var(--tippflaeche);
      padding: 0.6rem 0.8rem;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      background: var(--feld);
      color: var(--text);
      font: inherit;
      font-size: 1.1rem;
      font-weight: 600;
    }
    .eigene.aktiv input {
      border: 2px solid var(--messing);
    }
    .bosse {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
      gap: 0.4rem;
      margin-bottom: 0.6rem;
    }
    .boss-wahl {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-height: var(--tippflaeche);
      padding: 0.4rem 0.6rem;
      text-align: start;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      background: var(--feld);
      font-size: 0.85rem;
      font-weight: 600;
      line-height: 1.2;
    }
    .boss-wahl.aktiv {
      border: 2px solid var(--negativ);
    }
    .boss-level {
      flex-shrink: 0;
      width: 1.8rem;
      height: 1.8rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--negativ);
      color: #fff;
      font-weight: 800;
    }
    .boss-beschreibung {
      margin: 0.3rem 0 0;
    }
    .boss-info {
      background: var(--feld);
      border-radius: var(--radius);
      border-left: 4px solid var(--negativ);
      padding: 0.8rem 1rem;
    }
    .boss-titel {
      margin: 0;
      font-family: var(--schrift-anzeige);
      font-size: 1.3rem;
      font-weight: 800;
    }
    .boss-titel span {
      font-family: var(--schrift-text);
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-leise);
    }
    .boss-passiv {
      margin: 0.3rem 0 0;
      font-size: 0.9rem;
      color: var(--text-leise);
    }
    .hausregeln {
      background: var(--feld);
      border-radius: var(--radius);
      padding: 0.8rem 1rem;
    }
    .hausregeln[open] {
      padding-bottom: 1rem;
    }
    .hausregeln summary {
      font-weight: 700;
      cursor: pointer;
      min-height: 2rem;
    }
    .hausregeln[open] summary {
      margin-bottom: 0.9rem;
    }
    .stand {
      margin-left: 0.4rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--messing);
    }
    .los {
      font-size: 1.15rem;
      min-height: 3.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Einrichten {
  private readonly store = inject(SpielStore);
  private readonly router = inject(Router);

  /** Kommt über die Route `neu/:varianten`, mehrere durch Komma getrennt. */
  readonly varianten = input<string>('');

  protected readonly eintrag = computed(() => kombinieren(this.varianten().split(',')));

  protected readonly lebenAuswahl = LEBEN_AUSWAHL;
  protected readonly lebenMax = LEBEN_MAX;
  /** true, sobald jemand eine eigene Zahl eintippt statt 20 oder 40 zu wählen. */
  protected readonly eigeneLeben = signal(false);
  protected readonly wuerfel = signal(letzteWuerfelEinstellungen());
  protected readonly mitWuerfel = computed(
    () => this.eintrag()?.ids.includes('mana-wuerfel') ?? false,
  );
  protected readonly bosse = BOSSE;
  protected readonly bossId = signal(BOSSE[0].id);
  protected readonly boss = computed(() =>
    this.eintrag()?.ids.includes('boss') ? bossMitId(this.bossId()) : null,
  );
  protected readonly wuerfelAngepasst = computed(
    () => JSON.stringify(this.wuerfel()) !== JSON.stringify(STANDARD_WUERFEL),
  );
  protected readonly startbereit = computed(
    () =>
      this.startLeben() >= 1 &&
      this.startLeben() <= LEBEN_MAX &&
      (!this.mitWuerfel() || istWuerfelbar(this.wuerfel())),
  );
  protected readonly anzahl = linkedSignal(() => this.eintrag()?.spieler.standard ?? 2);
  protected readonly startLeben = linkedSignal(() => this.eintrag()?.startLeben ?? 40);
  protected readonly namen = signal(['', '', '', '']);

  protected readonly anzahlAuswahl = computed(() => {
    const v = this.eintrag();
    if (!v) return [];
    return Array.from({ length: v.spieler.max - v.spieler.min + 1 }, (_, i) => v.spieler.min + i);
  });
  protected readonly plaetze = computed(() => Array.from({ length: this.anzahl() }, (_, i) => i));

  protected lebenWaehlen(leben: number): void {
    this.eigeneLeben.set(false);
    this.startLeben.set(leben);
  }

  protected lebenEingeben(wert: string): void {
    const leben = Number.parseInt(wert, 10);
    if (!Number.isFinite(leben)) return;
    this.eigeneLeben.set(true);
    this.startLeben.set(leben);
  }

  protected nameSetzen(i: number, name: string): void {
    this.namen.update((n) => n.map((alt, j) => (j === i ? name : alt)));
  }

  protected starten(ereignis: Event): void {
    ereignis.preventDefault();
    const v = this.eintrag();
    if (!v || !this.startbereit()) return;
    const namen = this.plaetze().map((i) => this.namen()[i].trim() || `Spieler ${i + 1}`);
    const optionen = {
      ...(this.mitWuerfel() ? { manaWuerfel: this.wuerfel() } : {}),
      ...(this.boss() ? { bossId: this.bossId() } : {}),
    };
    if (optionen.manaWuerfel) merkeWuerfelEinstellungen(optionen.manaWuerfel);
    this.store.starten(v.ids, namen, this.startLeben(), optionen);
    this.router.navigateByUrl('/spiel');
  }
}
