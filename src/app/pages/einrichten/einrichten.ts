import { Location } from '@angular/common';
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

import { VarianteId } from '../../core/spiel/modell';
import { SpielStore } from '../../core/spiel/spiel-store';
import { Seitenkopf } from '../../shared/ui/seitenkopf';
import { SymbolBild } from '../../shared/ui/symbol';
import { VARIANTEN_AUSSEHEN } from '../../varianten/aussehen';
import { BASAR_GROESSEN, BasarEinstellungen, STANDARD_BASAR } from '../../varianten/basar/basar';
import { Planerstufe } from '../../varianten/boss/boss-modell';
import { PLANERSTUFEN } from '../../varianten/boss/boss-planer';
import { BOSSE, bossMitId } from '../../varianten/boss/bosse';
import {
  istWuerfelbar,
  letzteWuerfelEinstellungen,
  merkeWuerfelEinstellungen,
  STANDARD_WUERFEL,
} from '../../varianten/mana-wuerfel/wuerfel-einstellungen';
import { WuerfelRegeln } from '../../varianten/mana-wuerfel/wuerfel-regeln';
import { SEGEN_ANZAHL, SegenEinstellungen, STANDARD_SEGEN } from '../../varianten/segen/segen';
import {
  STANDARD_STURM,
  STURM_STAERKEN,
  STURM_START,
  SturmEinstellungen,
  SturmStaerke,
  sturmVerlauf,
} from '../../varianten/untergang/sturm';
import { kombinieren } from '../../varianten/varianten';
import {
  INTERVALLE,
  STANDARD_WELTEN,
  WeltEinstellungen,
  weltenFuer,
} from '../../varianten/welten/welt-stand';
import { WELT_ARTEN, WeltAuswahl } from '../../varianten/welten/welten';

const LEBEN_AUSWAHL = [20, 30, 40];
const LEBEN_MAX = 999;

type Schritt = 'spieler' | VarianteId | 'start';

const SCHRITT_TITEL: Record<Schritt, string> = {
  spieler: 'Spieler',
  'mana-wuerfel': 'Mana-Würfel',
  boss: 'Boss wählen',
  welten: 'Welten',
  untergang: 'Der Sturm',
  segen: 'Segen-Draft',
  basar: 'Basar',
  start: 'Bereit?',
};

/**
 * Neue Partie Schritt für Schritt: erst die Spieler, dann je Variante ihre Einstellungen,
 * zum Schluss eine Übersicht mit dem Startknopf.
 */
@Component({
  selector: 'app-einrichten',
  imports: [Seitenkopf, SymbolBild, WuerfelRegeln],
  template: `
    @if (eintrag(); as v) {
      <app-seitenkopf
        [titel]="titel()"
        [untertitel]="v.name"
        [zurueck]="true"
        [eigenesZurueck]="true"
        [fortschritt]="(schrittNr() + 1) / schritte().length"
        (zurueckGeklickt)="zurueck()"
      >
        <span class="zaehler">{{ schrittNr() + 1 }}/{{ schritte().length }}</span>
      </app-seitenkopf>

      <div class="seite">
        @switch (schritt()) {
          @case ('spieler') {
            <section class="block">
              <h2>So wird gespielt</h2>
              @for (teil of v.varianten; track teil.id) {
                <details class="regeln">
                  <summary>{{ teil.name }}</summary>
                  <ol>
                    @for (r of teil.regeln; track $index) {
                      <li>{{ r }}</li>
                    }
                  </ol>
                </details>
              }
            </section>

            @if (anzahlAuswahl().length > 1) {
              <section class="block">
                <h2>Wie viele spielen mit?</h2>
                <div class="chips">
                  @for (n of anzahlAuswahl(); track n) {
                    <button
                      type="button"
                      class="chip gross"
                      [class.aktiv]="anzahl() === n"
                      [attr.aria-pressed]="anzahl() === n"
                      (click)="anzahl.set(n)"
                    >
                      {{ n }}
                    </button>
                  }
                </div>
              </section>
            }

            <section class="block">
              <h2>Namen</h2>
              <div class="namen">
                @for (i of plaetze(); track i) {
                  <label class="name-feld">
                    <span class="platz">{{ i + 1 }}</span>
                    <span class="sr-only">Name Spieler {{ i + 1 }}</span>
                    <input
                      type="text"
                      autocomplete="off"
                      enterkeyhint="next"
                      maxlength="20"
                      [placeholder]="'Spieler ' + (i + 1)"
                      [value]="namen()[i]"
                      (input)="nameSetzen(i, $any($event.target).value)"
                    />
                  </label>
                }
              </div>
              <p class="hinweis">Spieler 1 sitzt unten links, dann geht es im Uhrzeigersinn.</p>
            </section>

            <section class="block">
              <h2>Lebenspunkte</h2>
              <div class="chips">
                @for (l of lebenAuswahl; track l) {
                  <button
                    type="button"
                    class="chip gross"
                    [class.aktiv]="startLeben() === l && !eigeneLeben()"
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
            </section>
          }

          @case ('mana-wuerfel') {
            <section class="block">
              <p class="einleitung">
                Wie oft welche Art und Form gewürfelt wird. Ohne Änderung gelten die Standardwerte.
              </p>
              <app-wuerfel-regeln [(einstellungen)]="wuerfel" />
            </section>
          }

          @case ('boss') {
            @if (boss(); as b) {
              <section class="block">
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
                <article class="karte boss-info" aria-live="polite">
                  <p class="karte-titel">{{ b.name }}</p>
                  <p class="werte">Level {{ b.level }} · {{ b.leben }} Leben</p>
                  <p>{{ b.beschreibung }}</p>
                  <p class="leise"><strong>Passiv:</strong> {{ b.passiv }}</p>
                  @if (b.rundenEffekt) {
                    <p class="leise"><strong>Jede Runde:</strong> {{ b.rundenEffekt.text }}</p>
                  }
                  <p class="leise"><strong>Seine Karten:</strong> {{ bossKarten() }}</p>
                </article>
              </section>

              <section class="block">
                <h2>Boss-Verstand</h2>
                <div class="segmente" role="radiogroup" aria-label="Wie weit der Boss vorausdenkt">
                  @for (p of planerStufen; track p.id) {
                    <button
                      type="button"
                      role="radio"
                      class="segment"
                      [class.aktiv]="planer() === p.id"
                      [attr.aria-checked]="planer() === p.id"
                      (click)="planer.set(p.id)"
                    >
                      {{ p.name }}
                    </button>
                  }
                </div>
                <p class="hinweis">{{ planerText() }}</p>
              </section>
            }
          }

          @case ('welten') {
            <section class="block">
              <h2>Welche Welten?</h2>
              <div class="optionen" role="radiogroup" aria-label="Welche Welten erscheinen">
                @for (a of weltArten; track a.id) {
                  <button
                    type="button"
                    role="radio"
                    class="option"
                    [class.aktiv]="welten().auswahl === a.id"
                    [attr.aria-checked]="welten().auswahl === a.id"
                    (click)="welten.set({ auswahl: a.id, intervall: welten().intervall })"
                  >
                    <span class="option-name">{{ a.name }}</span>
                    <span class="option-text">{{ a.text }}</span>
                    <span class="punkt" aria-hidden="true"></span>
                  </button>
                }
              </div>
              <p class="hinweis">{{ weltenAnzahl() }} Welten im Stapel.</p>
            </section>

            <section class="block">
              <h2>Neue Welt alle … Runden</h2>
              <div class="chips">
                @for (n of intervalle; track n) {
                  <button
                    type="button"
                    class="chip"
                    [class.aktiv]="welten().intervall === n"
                    [attr.aria-pressed]="welten().intervall === n"
                    (click)="welten.set({ auswahl: welten().auswahl, intervall: n })"
                  >
                    {{ n }}
                  </button>
                }
              </div>
              <p class="hinweis">
                {{
                  welten().intervall === 1
                    ? 'Jede Runde erscheint eine neue Welt.'
                    : 'Eine Welt gilt ' + welten().intervall + ' Runden lang.'
                }}
              </p>
            </section>
          }

          @case ('untergang') {
            <section class="block">
              <h2>Sturm ab Runde</h2>
              <div class="chips">
                @for (n of sturmStart; track n) {
                  <button
                    type="button"
                    class="chip"
                    [class.aktiv]="sturm().abRunde === n"
                    [attr.aria-pressed]="sturm().abRunde === n"
                    (click)="sturm.set({ abRunde: n, staerke: sturm().staerke })"
                  >
                    {{ n }}
                  </button>
                }
              </div>
            </section>

            <section class="block">
              <h2>Stärke</h2>
              <div class="segmente" role="radiogroup" aria-label="Stärke des Sturms">
                @for (x of sturmStaerken; track x.id) {
                  <button
                    type="button"
                    role="radio"
                    class="segment"
                    [class.aktiv]="sturm().staerke === x.id"
                    [attr.aria-checked]="sturm().staerke === x.id"
                    (click)="sturm.set({ abRunde: sturm().abRunde, staerke: x.id })"
                  >
                    {{ x.name }}
                  </button>
                }
              </div>
              <p class="hinweis">Leben pro Runde: {{ sturmText() }} …</p>
            </section>
          }

          @case ('segen') {
            <section class="block">
              <h2>Segen pro Spieler</h2>
              <div class="chips">
                @for (n of segenAnzahl; track n) {
                  <button
                    type="button"
                    class="chip gross"
                    [class.aktiv]="segen().anzahl === n"
                    [attr.aria-pressed]="segen().anzahl === n"
                    (click)="segen.set({ anzahl: n, pakte: segen().pakte })"
                  >
                    {{ n }}
                  </button>
                }
              </div>
              <p class="hinweis">Jedes Päckchen hat einen Segen mehr – der letzte verfällt.</p>
            </section>

            <section class="block">
              <label class="schalter-zeile">
                <span>
                  <span class="option-name">Pakte zulassen</span>
                  <span class="option-text">Stärker als Segen, aber mit einem Haken.</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  [checked]="segen().pakte"
                  (change)="
                    segen.set({ anzahl: segen().anzahl, pakte: $any($event.target).checked })
                  "
                />
              </label>
            </section>
          }

          @case ('basar') {
            <section class="block">
              <h2>Angebote im Basar</h2>
              <div class="chips">
                @for (n of basarGroessen; track n) {
                  <button
                    type="button"
                    class="chip gross"
                    [class.aktiv]="basar().groesse === n"
                    [attr.aria-pressed]="basar().groesse === n"
                    (click)="basar.set({ groesse: n })"
                  >
                    {{ n }}
                  </button>
                }
              </div>
              <p class="hinweis">So viele Angebote liegen gleichzeitig aus.</p>
            </section>
          }

          @case ('start') {
            <section class="block">
              <ul class="uebersicht">
                <li>
                  <span class="rund"><app-symbol name="spieler" /></span>
                  <span>
                    <span class="option-name">{{ spielerNamen().join(', ') }}</span>
                    <span class="option-text">{{ startLeben() }} Leben</span>
                  </span>
                </li>
                @for (z of zusammenfassung(); track z.id) {
                  <li [style.--farbe]="aussehen[z.id].farbe">
                    <span class="rund"><app-symbol [name]="aussehen[z.id].symbol" /></span>
                    <span>
                      <span class="option-name">{{ z.name }}</span>
                      <span class="option-text">{{ z.text }}</span>
                    </span>
                  </li>
                }
              </ul>
            </section>
          }
        }
      </div>

      <div class="aktion">
        <button
          type="button"
          class="knopf knopf--haupt los"
          [disabled]="!schrittGueltig()"
          (click)="weiter()"
        >
          @if (schritt() === 'start') {
            <app-symbol name="spielen" /> Spiel starten
          } @else {
            Weiter <app-symbol name="weiter" />
          }
        </button>
      </div>
    } @else {
      <app-seitenkopf titel="Neues Spiel" [zurueck]="true" />
      <p class="seite">Diese Auswahl lässt sich (noch) nicht spielen.</p>
    }
  `,
  styles: `
    .zaehler {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-leise);
    }
    .seite {
      max-width: 34rem;
      margin-inline: auto;
      padding: 1.1rem 1rem calc(6.5rem + env(safe-area-inset-bottom));
      display: grid;
      gap: 1.6rem;
      animation: rein 220ms ease-out;
    }
    @keyframes rein {
      from {
        opacity: 0;
        transform: translateX(0.8rem);
      }
    }
    .block {
      display: grid;
      gap: 0.6rem;
    }
    h2 {
      font-family: var(--schrift-text);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    p {
      margin: 0;
    }
    .einleitung,
    .hinweis {
      font-size: 0.88rem;
      color: var(--text-leise);
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .chip {
      flex: 1 1 0;
      min-width: 2.6rem;
      min-height: 3rem;
      padding: 0.4rem 0.9rem;
      border-radius: 0.9rem;
      border: 2px solid transparent;
      background: var(--feld);
      font-size: 1.05rem;
      font-weight: 700;
      transition:
        transform 90ms,
        background 150ms;
    }
    .chip.gross {
      flex: 1;
      min-height: 3.6rem;
      font-size: 1.3rem;
    }
    .chip:active {
      transform: scale(0.96);
    }
    .chip.aktiv {
      background: color-mix(in srgb, var(--messing) 22%, var(--feld));
      border-color: var(--messing);
      color: var(--messing);
    }
    .eigene input {
      width: 6rem;
      min-height: 3.6rem;
      padding: 0.4rem 0.8rem;
      border-radius: 0.9rem;
      border: 2px solid transparent;
      background: var(--feld);
      color: var(--text);
      font-weight: 700;
      text-align: center;
    }
    .eigene.aktiv input {
      border-color: var(--messing);
    }

    .namen {
      display: grid;
      gap: 0.5rem;
    }
    .name-feld {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.2rem 0.4rem 0.2rem 0.7rem;
      border-radius: 0.9rem;
      background: var(--feld);
    }
    .platz {
      display: grid;
      place-items: center;
      width: 1.9rem;
      height: 1.9rem;
      border-radius: 50%;
      background: var(--filz-tief);
      font-weight: 800;
      font-size: 0.9rem;
      color: var(--messing);
      flex-shrink: 0;
    }
    .name-feld input {
      flex: 1;
      min-width: 0;
      min-height: 3rem;
      border: 0;
      background: transparent;
      color: var(--text);
      font-weight: 600;
      outline: none;
    }

    .segmente {
      display: flex;
      padding: 0.25rem;
      border-radius: 0.9rem;
      background: var(--filz-tief);
    }
    .segment {
      flex: 1;
      min-height: 2.9rem;
      border: 0;
      border-radius: 0.7rem;
      background: transparent;
      font-weight: 700;
      color: var(--text-leise);
      transition: background 150ms;
    }
    .segment.aktiv {
      background: var(--feld);
      color: var(--text);
      box-shadow: 0 1px 4px rgb(0 0 0 / 0.25);
    }

    .optionen {
      display: grid;
      gap: 0.5rem;
    }
    .option {
      position: relative;
      display: grid;
      gap: 0.15rem;
      padding: 0.8rem 3rem 0.8rem 1rem;
      border-radius: 0.9rem;
      border: 2px solid transparent;
      background: var(--feld);
      text-align: start;
    }
    .option.aktiv {
      border-color: var(--messing);
    }
    .punkt {
      position: absolute;
      right: 1rem;
      top: 50%;
      translate: 0 -50%;
      width: 1.3rem;
      height: 1.3rem;
      border-radius: 50%;
      border: 2px solid var(--feld-rand);
    }
    .option.aktiv .punkt {
      border: 6px solid var(--messing);
    }
    .option-name {
      display: block;
      font-weight: 700;
    }
    .option-text {
      display: block;
      font-size: 0.85rem;
      color: var(--text-leise);
    }

    .schalter-zeile {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.9rem 1rem;
      border-radius: 0.9rem;
      background: var(--feld);
      cursor: pointer;
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

    .bosse {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.4rem;
    }
    .boss-wahl {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 3rem;
      padding: 0.4rem 0.6rem;
      text-align: start;
      border-radius: 0.8rem;
      border: 2px solid transparent;
      background: var(--feld);
      font-size: 0.85rem;
      font-weight: 600;
      line-height: 1.2;
    }
    .boss-wahl.aktiv {
      border-color: var(--negativ);
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
    .karte {
      display: grid;
      gap: 0.35rem;
      padding: 0.9rem 1rem;
      border-radius: 1rem;
      background: var(--feld);
    }
    .boss-info {
      border-left: 4px solid var(--negativ);
    }
    .karte-titel {
      font-family: var(--schrift-anzeige);
      font-size: 1.35rem;
      font-weight: 800;
    }
    .werte {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-leise);
    }
    .leise {
      font-size: 0.9rem;
      color: var(--text-leise);
    }

    .uebersicht {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    .uebersicht li {
      --farbe: var(--messing);
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.8rem 0.9rem;
      border-radius: 0.9rem;
      background: var(--feld);
    }
    .rund {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.8rem;
      background: color-mix(in srgb, var(--farbe) 20%, transparent);
      color: var(--farbe);
      flex-shrink: 0;
    }
    .regeln {
      padding: 0.8rem 1rem;
      border-radius: 0.9rem;
      background: var(--feld);
    }
    .regeln summary {
      font-weight: 700;
      cursor: pointer;
    }
    .regeln ol {
      margin: 0.6rem 0 0;
      padding-left: 1.2rem;
      display: grid;
      gap: 0.4rem;
      font-size: 0.92rem;
    }

    .aktion {
      position: fixed;
      inset: auto 0 0;
      z-index: 4;
      padding: 0.75rem 1rem max(0.8rem, env(safe-area-inset-bottom));
      background: linear-gradient(transparent, var(--filz) 30%);
      display: grid;
      justify-items: center;
    }
    .los {
      width: min(100%, 34rem);
      min-height: 3.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      border-radius: 1rem;
      font-size: 1.15rem;
      box-shadow: var(--schatten);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Einrichten {
  private readonly store = inject(SpielStore);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /** Kommt über die Route `neu/:varianten`, mehrere durch Komma getrennt. */
  readonly varianten = input<string>('');

  protected readonly eintrag = computed(() => kombinieren(this.varianten().split(',')));
  protected readonly aussehen = VARIANTEN_AUSSEHEN;

  // ── Ablauf ──────────────────────────────────────────────────────
  /** Varianten ohne eigene Einstellungen bekommen keinen Schritt. */
  protected readonly schritte = computed<Schritt[]>(() => [
    'spieler',
    ...(this.eintrag()?.ids ?? []),
    'start',
  ]);
  protected readonly schrittNr = signal(0);
  protected readonly schritt = computed(() => this.schritte()[this.schrittNr()] ?? 'spieler');
  protected readonly titel = computed(() => SCHRITT_TITEL[this.schritt()]);
  protected readonly schrittGueltig = computed(() => {
    switch (this.schritt()) {
      case 'spieler':
        return this.startLeben() >= 1 && this.startLeben() <= LEBEN_MAX;
      case 'mana-wuerfel':
        return istWuerfelbar(this.wuerfel());
      default:
        return true;
    }
  });

  protected weiter(): void {
    if (!this.schrittGueltig()) return;
    if (this.schritt() === 'start') {
      this.starten();
      return;
    }
    this.schrittNr.update((n) => n + 1);
    scrollTo({ top: 0 });
  }

  protected zurueck(): void {
    if (this.schrittNr() > 0) {
      this.schrittNr.update((n) => n - 1);
      scrollTo({ top: 0 });
      return;
    }
    const nr = (this.location.getState() as { navigationId?: number } | null)?.navigationId ?? 1;
    if (nr > 1) this.location.back();
    else void this.router.navigateByUrl('/');
  }

  // ── Spieler ─────────────────────────────────────────────────────
  protected readonly lebenAuswahl = LEBEN_AUSWAHL;
  protected readonly lebenMax = LEBEN_MAX;
  /** true, sobald jemand eine eigene Zahl eintippt statt einer Vorgabe. */
  protected readonly eigeneLeben = signal(false);
  protected readonly anzahl = linkedSignal(() => this.eintrag()?.spieler.standard ?? 2);
  protected readonly startLeben = linkedSignal(() => this.eintrag()?.startLeben ?? 40);
  protected readonly namen = signal(['', '', '', '']);
  protected readonly anzahlAuswahl = computed(() => {
    const v = this.eintrag();
    if (!v) return [];
    return Array.from({ length: v.spieler.max - v.spieler.min + 1 }, (_, i) => v.spieler.min + i);
  });
  protected readonly plaetze = computed(() => Array.from({ length: this.anzahl() }, (_, i) => i));
  protected readonly spielerNamen = computed(() =>
    this.plaetze().map((i) => this.namen()[i].trim() || `Spieler ${i + 1}`),
  );

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

  // ── Mana-Würfel ─────────────────────────────────────────────────
  protected readonly wuerfel = signal(letzteWuerfelEinstellungen());
  protected readonly wuerfelAngepasst = computed(
    () => JSON.stringify(this.wuerfel()) !== JSON.stringify(STANDARD_WUERFEL),
  );

  // ── Boss ────────────────────────────────────────────────────────
  protected readonly bosse = BOSSE;
  protected readonly bossId = signal(BOSSE[0].id);
  protected readonly boss = computed(() =>
    this.eintrag()?.ids.includes('boss') ? bossMitId(this.bossId()) : null,
  );
  /** Seine Artefakte und Verzauberungen; die Startkarte liegt schon zu Beginn. */
  protected readonly bossKarten = computed(() => {
    const b = this.boss();
    return (b?.relikte ?? [])
      .map((r) => (r.id === b?.startRelikt ? `${r.name} (liegt von Anfang an)` : r.name))
      .join(', ');
  });
  protected readonly planerStufen = (Object.keys(PLANERSTUFEN) as Planerstufe[]).map((id) => ({
    id,
    ...PLANERSTUFEN[id],
  }));
  protected readonly planer = signal<Planerstufe>('instinkt');
  protected readonly planerText = computed(() => {
    const p = PLANERSTUFEN[this.planer()];
    return `Der Boss ${p.text}. ${p.hinweis}`;
  });

  // ── Welten ──────────────────────────────────────────────────────
  protected readonly weltArten = (Object.keys(WELT_ARTEN) as WeltAuswahl[]).map((id) => ({
    id,
    ...WELT_ARTEN[id],
  }));
  protected readonly intervalle = INTERVALLE;
  protected readonly welten = signal<WeltEinstellungen>(STANDARD_WELTEN);
  protected readonly weltenAnzahl = computed(
    () => weltenFuer(this.welten().auswahl, this.anzahl()).length,
  );

  // ── Untergang ───────────────────────────────────────────────────
  protected readonly sturm = signal<SturmEinstellungen>(STANDARD_STURM);
  protected readonly sturmStart = STURM_START;
  protected readonly sturmStaerken = (Object.keys(STURM_STAERKEN) as SturmStaerke[]).map((id) => ({
    id,
    name: STURM_STAERKEN[id].name,
  }));
  protected readonly sturmText = computed(() => sturmVerlauf(this.sturm(), 7).join(', '));

  // ── Segen und Basar ─────────────────────────────────────────────
  protected readonly segen = signal<SegenEinstellungen>(STANDARD_SEGEN);
  protected readonly segenAnzahl = SEGEN_ANZAHL;
  protected readonly basar = signal<BasarEinstellungen>(STANDARD_BASAR);
  protected readonly basarGroessen = BASAR_GROESSEN;

  // ── Übersicht und Start ─────────────────────────────────────────
  protected readonly zusammenfassung = computed(() =>
    (this.eintrag()?.ids ?? []).map((id) => ({ id, ...this.beschreibung(id) })),
  );

  private beschreibung(id: VarianteId): { name: string; text: string } {
    switch (id) {
      case 'mana-wuerfel':
        return {
          name: 'Mana-Würfel',
          text: this.wuerfelAngepasst() ? 'Eigene Hausregeln' : 'Standardwerte',
        };
      case 'boss': {
        const b = this.boss();
        return {
          name: b ? `${b.name} (Level ${b.level})` : 'Boss',
          text: `${b?.leben ?? '?'} Leben · ${PLANERSTUFEN[this.planer()].name}`,
        };
      }
      case 'welten':
        return {
          name: `Welten: ${WELT_ARTEN[this.welten().auswahl].name}`,
          text: `Neue Welt alle ${this.welten().intervall} Runden`,
        };
      case 'untergang':
        return {
          name: `Sturm ab Runde ${this.sturm().abRunde}`,
          text: `${STURM_STAERKEN[this.sturm().staerke].name}: ${this.sturmText()} …`,
        };
      case 'segen':
        return {
          name: `${this.segen().anzahl} Segen pro Spieler`,
          text: this.segen().pakte ? 'Mit Pakten' : 'Ohne Pakte',
        };
      case 'basar':
        return { name: 'Basar', text: `${this.basar().groesse} Angebote gleichzeitig` };
    }
  }

  private starten(): void {
    const v = this.eintrag();
    if (!v) return;
    const ids = v.ids;
    const optionen = {
      ...(ids.includes('mana-wuerfel') ? { manaWuerfel: this.wuerfel() } : {}),
      ...(this.boss() ? { bossId: this.bossId(), bossPlaner: this.planer() } : {}),
      ...(ids.includes('welten') ? { welten: this.welten() } : {}),
      ...(ids.includes('untergang') ? { sturm: this.sturm() } : {}),
      ...(ids.includes('segen') ? { segen: this.segen() } : {}),
      ...(ids.includes('basar') ? { basar: this.basar() } : {}),
    };
    if (optionen.manaWuerfel) merkeWuerfelEinstellungen(optionen.manaWuerfel);
    this.store.starten(ids, this.spielerNamen(), this.startLeben(), optionen);
    void this.router.navigateByUrl('/spiel', { replaceUrl: true });
  }
}
