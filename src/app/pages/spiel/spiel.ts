import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { bewertbares } from '../../core/bewertung';
import { Effekt } from '../../core/spiel/modell';
import { SpielStore } from '../../core/spiel/spiel-store';
import { TischAnsicht } from '../../core/tisch-ansicht';
import { WachHalten } from '../../core/wach-halten';
import { Einstellungen } from '../../core/einstellungen';
import { BestaetigenKnopf } from '../../shared/ui/bestaetigen-knopf';
import { SymbolBild } from '../../shared/ui/symbol';
import { Ueberlagerung } from '../../shared/ui/ueberlagerung';
import { BossFeld } from '../../varianten/boss/boss-feld';
import { BossProtokollListe } from '../../varianten/boss/boss-protokoll';
import { BossZugDialog } from '../../varianten/boss/boss-zug-dialog';
import { bossMitId } from '../../varianten/boss/bosse';
import { EffektKarte } from '../../varianten/mana-wuerfel/effekt-karte';
import { EffektListe } from '../../varianten/mana-wuerfel/effekt-liste';
import { WirkenDialog } from '../../varianten/mana-wuerfel/wirken-dialog';
import { kombinieren, variantenName } from '../../varianten/varianten';
import { rundenBisWechsel } from '../../varianten/welten/welt-stand';
import { WeltBand } from '../../varianten/welten/welt-band';
import { WeltKarte } from '../../varianten/welten/welt-karte';
import { weltMitId } from '../../varianten/welten/welten';
import { BasarDialog } from '../../varianten/basar/basar-dialog';
import { segenMitId } from '../../varianten/segen/segen';
import { SegenDraft } from '../../varianten/segen/segen-draft';
import { AbwurfWahl } from '../../varianten/untergang/abwurf-wahl';
import { SturmBand } from '../../varianten/untergang/sturm-band';
import { BewertungDialog } from './bewertung-dialog';
import { CommanderDialog } from './commander-dialog';
import { SpielerFeld } from './spieler-feld';

type Dialog =
  | { art: 'wirken'; spielerId: number; gedreht: boolean }
  | { art: 'effekt'; nr: number; gedreht: boolean }
  | { art: 'liste' }
  | { art: 'bosszug' }
  | { art: 'bossprotokoll' }
  | { art: 'welt' }
  | { art: 'basar' }
  | { art: 'menue' }
  | { art: 'regeln' }
  | { art: 'commander'; spielerId: number; gedreht: boolean }
  | { art: 'bewertung' }
  | { art: 'segen'; spielerId: number; segenId: string; gedreht: boolean };

@Component({
  selector: 'app-spiel',
  imports: [
    RouterLink,
    NgTemplateOutlet,
    SymbolBild,
    SpielerFeld,
    WirkenDialog,
    EffektListe,
    EffektKarte,
    Ueberlagerung,
    BestaetigenKnopf,
    BossFeld,
    BossZugDialog,
    BossProtokollListe,
    WeltBand,
    WeltKarte,
    SturmBand,
    AbwurfWahl,
    SegenDraft,
    BasarDialog,
    CommanderDialog,
    BewertungDialog,
  ],
  template: `
    @if (store.stand(); as s) {
      <div
        class="tisch"
        [class.drehen]="ansicht.drehen() && !bossQuer()"
        [class.quer]="bossQuer()"
        [attr.data-spieler]="s.spieler.length"
        [attr.data-boss]="s.boss ? '' : null"
      >
        @for (p of s.spieler; track p.id; let i = $index) {
          <app-spieler-feld
            [style.grid-area]="'p' + (i + 1)"
            [spieler]="p"
            [gedreht]="gedreht(i, s.spieler.length)"
            [effektWuerfel]="effektWuerfel()"
            [bleibende]="bleibendeJeSpieler().get(p.id) ?? []"
            [segen]="segenJeSpieler().get(p.id) ?? []"
            [commanderSchaden]="s.boss ? null : hoechsterCommander(p.commander)"
            (commanderOeffnen)="
              dialog.set({
                art: 'commander',
                spielerId: p.id,
                gedreht: gedreht(i, s.spieler.length),
              })
            "
            (segenZeigen)="
              dialog.set({
                art: 'segen',
                spielerId: p.id,
                segenId: $event,
                gedreht: gedreht(i, s.spieler.length),
              })
            "
            (leben)="store.aendereLeben(p.id, $event)"
            (wirken)="
              dialog.set({
                art: 'wirken',
                spielerId: p.id,
                gedreht: gedreht(i, s.spieler.length),
              })
            "
            (zeigen)="
              dialog.set({
                art: 'effekt',
                nr: $event,
                gedreht: gedreht(i, s.spieler.length),
              })
            "
          />
        }

        @if (s.boss; as b) {
          <app-boss-feld [stand]="b" (protokoll)="dialog.set({ art: 'bossprotokoll' })" />
        }

        <nav class="mitte" aria-label="Spielsteuerung">
          @if (weltInfo(); as w) {
            <app-welt-band
              [welt]="w.welt"
              [hinweis]="w.hinweis"
              (oeffnen)="dialog.set({ art: 'welt' })"
            />
          }
          @if (s.sturm; as st) {
            <app-sturm-band [stand]="st" [runde]="s.runde ?? 1" />
          }
          <div class="steuerleiste">
            <button
              type="button"
              class="rund-knopf"
              aria-label="Spielmenü"
              (click)="dialog.set({ art: 'menue' })"
            >
              <app-symbol name="menue" />
            </button>
            @if (zugInfo(); as z) {
              <div class="zugleiste" aria-live="polite">
                @if (z.besiegt) {
                  <span class="zug-text"><strong>Sieg!</strong> {{ z.bossName }} ist besiegt.</span>
                } @else {
                  <span class="zug-text"
                    >Runde <strong>{{ z.runde }}</strong></span
                  >
                  <button
                    type="button"
                    class="knopf knopf--haupt zug-knopf"
                    (click)="dialog.set({ art: 'bosszug' })"
                  >
                    Boss-Zug
                  </button>
                }
              </div>
            } @else if (runde(); as r) {
              <div class="zugleiste" aria-live="polite">
                <span class="zug-text"
                  >Runde <strong>{{ r }}</strong></span
                >
                <button
                  type="button"
                  class="knopf knopf--haupt zug-knopf"
                  (click)="store.rundeBeenden()"
                >
                  Runde beenden
                </button>
              </div>
            } @else {
              <div class="werkzeuge innen">
                <ng-container [ngTemplateOutlet]="werkzeuge" />
              </div>
            }
            <button
              type="button"
              class="rund-knopf"
              aria-label="Rückgängig"
              [disabled]="!store.kannRueckgaengig()"
              (click)="store.rueckgaengig()"
            >
              <app-symbol name="rueckgaengig" />
            </button>
          </div>
          @if ((zugInfo() || runde()) && hatWerkzeuge()) {
            <div class="werkzeuge">
              <ng-container [ngTemplateOutlet]="werkzeuge" />
            </div>
          }

          <ng-template #werkzeuge>
            @if (pause() === 'draft' && draftOffen()) {
              <button type="button" class="werkzeug hervor" (click)="pause.set(null)">
                <app-symbol name="segen" /> Segen wählen
              </button>
            }
            @if (pause() === 'abwurf' && s.sturm?.abwurf) {
              <button type="button" class="werkzeug hervor" (click)="pause.set(null)">
                <app-symbol name="untergang" /> Abwurf
              </button>
            }
            @if (s.basar; as b) {
              <button type="button" class="werkzeug" (click)="dialog.set({ art: 'basar' })">
                <app-symbol name="basar" /> Basar
                <span class="anzahl">{{ b.angebote.length }}</span>
              </button>
            }
            @if (effektWuerfel()) {
              <button type="button" class="werkzeug" (click)="dialog.set({ art: 'liste' })">
                <app-symbol name="effekte" /> Effekte
                <span class="anzahl">{{ s.effekte.length }}</span>
              </button>
            }
          </ng-template>
        </nav>
      </div>

      @switch (dialog()?.art) {
        @case ('wirken') {
          @if (wirkender(); as w) {
            <app-wirken-dialog
              [spieler]="w.spieler"
              [gedreht]="w.gedreht"
              (fertig)="dialog.set(null)"
            />
          }
        }
        @case ('effekt') {
          @if (gezeigt(); as g) {
            <app-ueberlagerung
              [titel]="g.effekt.name"
              [gedreht]="g.gedreht"
              (schliessen)="dialog.set(null)"
            >
              <div class="gezeigt">
                <app-effekt-karte [effekt]="g.effekt" [von]="g.von" />
                @if (g.effekt.form === 'verzauberung' && !g.effekt.zerstoert) {
                  <app-bestaetigen-knopf
                    label="Zerstört"
                    frage="Wirklich zerstört?"
                    (bestaetigt)="zerstoeren(g.effekt.nr)"
                  />
                } @else if (g.effekt.form === 'emblem') {
                  <p class="hinweis">
                    Embleme bleiben das ganze Spiel und können nicht entfernt werden.
                  </p>
                }
              </div>
            </app-ueberlagerung>
          }
        }
        @case ('liste') {
          <app-effekt-liste (schliessen)="dialog.set(null)" />
        }
        @case ('bosszug') {
          <app-boss-zug-dialog (fertig)="dialog.set(null)" />
        }
        @case ('bossprotokoll') {
          <app-boss-protokoll (schliessen)="dialog.set(null)" />
        }
        @case ('commander') {
          @if (commanderZiel(); as c) {
            <app-ueberlagerung
              titel="Commander-Schaden"
              [gedreht]="c.gedreht"
              (schliessen)="dialog.set(null)"
            >
              <app-commander-dialog [spielerId]="c.spielerId" />
            </app-ueberlagerung>
          }
        }
        @case ('bewertung') {
          <app-ueberlagerung titel="Wie war's?" (schliessen)="dialog.set({ art: 'menue' })">
            <app-bewertung-dialog [stand]="s" (fertig)="partieBeenden()" />
          </app-ueberlagerung>
        }
        @case ('basar') {
          <app-basar-dialog (schliessen)="dialog.set(null)" />
        }
        @case ('menue') {
          <app-ueberlagerung titel="Spielmenü" (schliessen)="dialog.set(null)">
            <div class="menue">
              <p class="menue-kopf">
                {{ variantenName()
                }}{{
                  zugInfo()?.runde || runde() ? ' · Runde ' + (zugInfo()?.runde || runde()) : ''
                }}
              </p>
              <ul class="menue-liste">
                <li>
                  <button type="button" class="menue-punkt" (click)="dialog.set(null)">
                    <app-symbol name="spielen" /> Weiterspielen
                  </button>
                </li>
                <li>
                  <button type="button" class="menue-punkt" (click)="dialog.set({ art: 'regeln' })">
                    <app-symbol name="varianten" /> Regeln dieser Partie
                  </button>
                </li>
                <li>
                  <label class="menue-punkt">
                    <app-symbol name="drehen" />
                    <span class="menue-text">Tischmodus</span>
                    <input
                      type="checkbox"
                      role="switch"
                      [checked]="einstellungen.tischmodus()"
                      (change)="einstellungen.tischmodus.set($any($event.target).checked)"
                    />
                  </label>
                </li>
                <li>
                  <a class="menue-punkt" routerLink="/">
                    <app-symbol name="start" /> Zum Hauptmenü
                    <span class="menue-hinweis">Partie bleibt gespeichert</span>
                  </a>
                </li>
              </ul>
              <app-bestaetigen-knopf
                class="gefahr"
                label="Partie beenden"
                frage="Wirklich beenden?"
                (bestaetigt)="beendenAngefragt()"
              />
            </div>
          </app-ueberlagerung>
        }
        @case ('regeln') {
          <app-ueberlagerung titel="Regeln" (schliessen)="dialog.set(null)">
            <div class="regeln">
              @for (v of kombination()?.varianten ?? []; track v.id) {
                <details [open]="(kombination()?.varianten?.length ?? 0) === 1">
                  <summary>{{ v.name }}</summary>
                  <ol>
                    @for (regel of v.regeln; track $index) {
                      <li>{{ regel }}</li>
                    }
                  </ol>
                </details>
              }
            </div>
          </app-ueberlagerung>
        }
        @case ('segen') {
          @if (gezeigterSegen(); as g) {
            <app-ueberlagerung
              [titel]="g.segen.name"
              [gedreht]="g.gedreht"
              (schliessen)="dialog.set(null)"
            >
              <div class="gezeigt">
                <p class="ankuendigung">{{ g.segen.pakt ? 'Pakt' : 'Segen' }} von {{ g.von }}</p>
                <p class="segen-titel">{{ g.segen.name }}</p>
                <p class="segen-text">{{ g.segen.text }}</p>
                @if (g.segen.einmalig) {
                  <p class="hinweis">Einmal pro Partie.</p>
                  <button
                    type="button"
                    class="knopf"
                    [class.knopf--haupt]="!g.benutzt"
                    (click)="store.segenUmschalten(g.spielerId, g.segen.id)"
                  >
                    {{ g.benutzt ? 'Doch nicht eingesetzt' : 'Eingesetzt' }}
                  </button>
                }
              </div>
            </app-ueberlagerung>
          }
        }
        @case ('welt') {
          @if (weltInfo(); as w) {
            <app-ueberlagerung titel="Aktuelle Welt" (schliessen)="dialog.set(null)">
              <div class="gezeigt">
                <app-welt-karte [welt]="w.welt" [hinweis]="w.hinweis" />
                @if (w.frueher.length) {
                  <p class="hinweis">Bisher: {{ w.frueher.join(' → ') }}</p>
                }
              </div>
            </app-ueberlagerung>
          }
        }
      }

      @if (draftOffen() && !pause() && !dialog()) {
        <app-ueberlagerung
          titel="Segen-Draft"
          [gedreht]="draftGedreht()"
          (schliessen)="pause.set('draft')"
        >
          <app-segen-draft [stand]="s.segen!" [spieler]="s.spieler" />
        </app-ueberlagerung>
      } @else if (s.sturm?.abwurf && pause() !== 'abwurf' && !dialog() && !store.weltAufdecken()) {
        <app-ueberlagerung titel="Versorgungsabwurf" (schliessen)="pause.set('abwurf')">
          <app-abwurf-wahl [stand]="s.sturm!" [spieler]="s.spieler" />
        </app-ueberlagerung>
      }

      @if (store.weltAufdecken() && !dialog() && !draftOffen()) {
        @if (weltInfo(); as w) {
          <app-ueberlagerung titel="Eine neue Welt" (schliessen)="store.weltGesehen()">
            <div class="gezeigt">
              <p class="ankuendigung">
                {{
                  w.runde === 1
                    ? 'Die erste Welt erscheint'
                    : 'Runde ' + w.runde + ' – die Welt wandelt sich'
                }}
              </p>
              <app-welt-karte [welt]="w.welt" [hinweis]="w.hinweis" />
              <button type="button" class="knopf knopf--haupt" (click)="store.weltGesehen()">
                Weiter
              </button>
            </div>
          </app-ueberlagerung>
        }
      }
    }
  `,
  styles: `
    .tisch {
      height: 100dvh;
      display: grid;
      gap: 0.5rem;
      padding: max(0.5rem, env(safe-area-inset-top)) 0.5rem max(0.5rem, env(safe-area-inset-bottom));
      /* Flach: alle schauen von einer Seite drauf (Laptop, Tablet, Tischmodus aus) */
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
      grid-template-rows: auto;
      grid-auto-rows: minmax(17rem, 1fr);
      overflow-y: auto;
    }
    .tisch:not(.drehen, .quer) > app-spieler-feld {
      grid-area: auto !important;
    }
    .tisch:not(.drehen, .quer) .mitte {
      grid-column: 1 / -1;
      order: -2;
    }
    /* Im Bosskampf teilen sich die zwei Spieler die volle Breite unter dem Boss */
    .tisch[data-boss]:not(.drehen, .quer) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .tisch:not(.drehen, .quer) app-boss-feld {
      grid-column: 1 / -1;
      order: -1;
    }

    /* Tischmodus: Handy liegt in der Mitte, Spieler 1 unten links, weiter im Uhrzeigersinn */
    .drehen {
      overflow: hidden;
      grid-auto-rows: unset;
    }
    .drehen[data-spieler='1'] {
      grid-template: 'p1' 1fr 'mitte' auto / 1fr;
    }
    .drehen[data-spieler='2'] {
      grid-template: 'p2' 1fr 'mitte' auto 'p1' 1fr / 1fr;
    }
    .drehen[data-spieler='3'] {
      grid-template: 'p2 p2' 1fr 'mitte mitte' auto 'p1 p3' 1fr / 1fr 1fr;
    }
    .drehen[data-spieler='4'] {
      grid-template: 'p2 p3' 1fr 'mitte mitte' auto 'p1 p4' 1fr / 1fr 1fr;
    }
    /* Bosskampf: der Boss liegt zwischen den beiden Spielern */
    /* Die Spieler brauchen nur Name und Leben – der Boss bekommt den meisten Platz. */
    .drehen[data-spieler='2'][data-boss] {
      grid-template:
        'p2' minmax(7rem, 0.7fr)
        'boss' minmax(0, 2.6fr)
        'mitte' auto
        'p1' minmax(7rem, 0.7fr) / 1fr;
    }
    /* Bosskampf mit dem Handy quer: links die Spieler untereinander, rechts groß der Boss */
    .quer {
      overflow: hidden;
      grid-template:
        'p1 boss' 1fr
        'p2 boss' 1fr
        'mitte boss' auto / minmax(12rem, 0.4fr) minmax(0, 1fr);
    }
    .quer app-boss-feld {
      grid-area: boss;
    }
    .quer .mitte {
      grid-area: mitte;
    }
    .drehen app-boss-feld {
      grid-area: boss;
    }
    .drehen .mitte {
      grid-area: mitte;
    }
    .mitte {
      display: grid;
      gap: 0.4rem;
      min-width: 0;
    }
    .steuerleiste {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .rund-knopf {
      flex-shrink: 0;
      display: grid;
      place-items: center;
      width: 2.9rem;
      height: 2.9rem;
      border-radius: 50%;
      border: 1px solid var(--feld-rand);
      background: var(--filz-tief);
      color: var(--text);
      font-size: 1.05rem;
      transition: transform 90ms;
    }
    .rund-knopf:active:not(:disabled) {
      transform: scale(0.92);
    }
    .rund-knopf:disabled {
      opacity: 0.35;
    }
    .zugleiste {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.25rem 0.25rem 0.25rem 0.9rem;
      border-radius: 99px;
      background: var(--filz-tief);
    }
    .zug-text {
      font-size: 0.9rem;
      white-space: nowrap;
    }
    .zug-knopf {
      min-height: 2.4rem;
      padding: 0.3rem 1rem;
      border-radius: 99px;
      white-space: nowrap;
    }
    .werkzeuge {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .werkzeuge.innen {
      flex: 1;
      min-width: 0;
    }
    .werkzeug {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      min-height: 2.6rem;
      padding: 0.3rem 0.85rem;
      border-radius: 99px;
      border: 1px solid var(--feld-rand);
      background: var(--filz-tief);
      color: var(--text);
      font-size: 0.88rem;
      font-weight: 600;
      transition: transform 90ms;
    }
    .werkzeug:active {
      transform: scale(0.95);
    }
    .werkzeug.hervor {
      border-color: var(--messing);
      color: var(--messing);
    }

    .menue {
      display: grid;
      gap: 0.8rem;
    }
    .menue-kopf {
      margin: 0;
      text-align: center;
      font-family: var(--schrift-anzeige);
      font-size: 1.15rem;
      font-weight: 800;
    }
    .menue-liste {
      list-style: none;
      margin: 0;
      padding: 0;
      border-radius: 1rem;
      background: var(--feld);
      overflow: hidden;
    }
    .menue-liste li + li {
      border-top: 1px solid color-mix(in srgb, var(--feld-rand) 60%, transparent);
    }
    .menue-punkt {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      min-height: 3.4rem;
      padding: 0.5rem 1rem;
      border: 0;
      background: transparent;
      color: var(--text);
      text-decoration: none;
      text-align: start;
      font-weight: 600;
      cursor: pointer;
    }
    .menue-punkt app-symbol {
      color: var(--messing);
    }
    .menue-text {
      flex: 1;
    }
    .menue-hinweis {
      margin-left: auto;
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--text-leise);
    }
    .menue input[type='checkbox'] {
      flex-shrink: 0;
      width: 3.1rem;
      height: 1.85rem;
      margin: 0;
      appearance: none;
      border-radius: 99px;
      background: var(--filz-tief);
      border: 1px solid var(--feld-rand);
      position: relative;
      cursor: pointer;
    }
    .menue input[type='checkbox']::after {
      content: '';
      position: absolute;
      top: 0.18rem;
      left: 0.2rem;
      width: 1.35rem;
      height: 1.35rem;
      border-radius: 50%;
      background: var(--text-leise);
      transition: translate 150ms;
    }
    .menue input[type='checkbox']:checked {
      background: var(--messing);
    }
    .menue input[type='checkbox']:checked::after {
      background: var(--messing-text);
      translate: 1.25rem 0;
    }
    .regeln {
      display: grid;
      gap: 0.5rem;
    }
    .regeln details {
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
      gap: 0.45rem;
      font-size: 0.92rem;
    }
    .anzahl {
      min-width: 1.4rem;
      padding: 0 0.35rem;
      border-radius: 99px;
      background: var(--messing);
      color: var(--messing-text);
      font-size: 0.8rem;
      text-align: center;
    }
    .gezeigt {
      display: grid;
      gap: 0.8rem;
    }
    .ankuendigung {
      margin: 0;
      text-align: center;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--messing);
    }
    .segen-titel {
      margin: 0;
      font-family: var(--schrift-anzeige);
      font-size: 1.7rem;
      font-weight: 800;
    }
    .segen-text {
      margin: 0;
      font-size: 1.1rem;
      line-height: 1.4;
    }
    .hinweis {
      margin: 0;
      color: var(--text-leise);
      font-size: 0.9rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spiel implements OnDestroy {
  protected readonly store = inject(SpielStore);
  protected readonly ansicht = inject(TischAnsicht);
  private readonly wach = inject(WachHalten);

  protected readonly dialog = signal<Dialog | null>(null);

  /** Handy quer im Bosskampf: Spieler links, Boss rechts, niemand auf dem Kopf. */
  protected readonly bossQuer = computed(() => !!this.store.stand()?.boss && this.ansicht.quer());

  protected gedreht(index: number, anzahl: number): boolean {
    return !this.bossQuer() && this.ansicht.istGedreht(index, anzahl);
  }

  protected readonly einstellungen = inject(Einstellungen);
  private readonly router = inject(Router);

  protected readonly kombination = computed(() => kombinieren(this.store.stand()?.varianten ?? []));
  protected readonly variantenName = computed(() =>
    variantenName(this.store.stand()?.varianten ?? []),
  );
  /** Basar, Effekte oder ein weggeklickter Draft/Abwurf brauchen eigene Knöpfe. */
  protected readonly hatWerkzeuge = computed(() => {
    const s = this.store.stand();
    return (
      !!s?.basar ||
      this.effektWuerfel() ||
      (this.pause() === 'draft' && this.draftOffen()) ||
      (this.pause() === 'abwurf' && !!s?.sturm?.abwurf)
    );
  });
  protected readonly effektWuerfel = computed(
    () => this.kombination()?.werkzeuge.includes('effekt-wuerfel') ?? false,
  );

  /** Eigene Verzauberungen und Embleme plus alles aus Chaos-Würfen, das alle trifft. */
  protected readonly bleibendeJeSpieler = computed(() => {
    const s = this.store.stand();
    const aktiv = (s?.effekte ?? []).filter(
      (e) => (e.form === 'verzauberung' || e.form === 'emblem') && !e.zerstoert,
    );
    return new Map<number, Effekt[]>(
      (s?.spieler ?? []).map((p) => [
        p.id,
        aktiv.filter((e) => e.spielerId === p.id || e.art === 'chaos'),
      ]),
    );
  });

  protected readonly wirkender = computed(() => {
    const d = this.dialog();
    if (d?.art !== 'wirken') return null;
    const spieler = this.store.stand()?.spieler.find((p) => p.id === d.spielerId);
    return spieler ? { spieler, gedreht: d.gedreht } : null;
  });

  protected readonly gezeigt = computed(() => {
    const d = this.dialog();
    if (d?.art !== 'effekt') return null;
    const s = this.store.stand();
    const effekt = s?.effekte.find((e) => e.nr === d.nr);
    if (!effekt) return null;
    const von = s?.spieler.find((p) => p.id === effekt.spielerId)?.name;
    return { effekt, von, gedreht: d.gedreht };
  });

  /** Zugleiste im Bosskampf: Runde und ob der Boss besiegt ist. Der Boss-Zug geht jederzeit. */
  protected readonly zugInfo = computed(() => {
    const b = this.store.stand()?.boss;
    if (!b) return null;
    return { runde: b.runde, bossName: bossMitId(b.bossId).name, besiegt: b.leben <= 0 };
  });

  /** Weggeklickter Draft oder Abwurf: bleibt zu, bis ihn jemand über die Leiste wieder öffnet. */
  protected readonly pause = signal<'draft' | 'abwurf' | null>(null);

  /** Runde für die Zugleiste, sobald eine Variante in Runden zählt (der Boss hat seine eigene). */
  protected readonly runde = computed(() => {
    const s = this.store.stand();
    if (!s || s.boss || !(s.welt || s.sturm || s.basar)) return null;
    return s.runde ?? s.welt?.runde ?? 1;
  });

  protected readonly draftOffen = computed(() => {
    const segen = this.store.stand()?.segen;
    return !!segen && !segen.fertig;
  });
  protected readonly draftGedreht = computed(() => {
    const s = this.store.stand();
    return !!s?.segen && this.gedreht(s.segen.waehler, s.spieler.length);
  });

  protected readonly segenJeSpieler = computed(() => {
    const segen = this.store.stand()?.segen;
    const karte = new Map<
      number,
      { id: string; name: string; pakt?: boolean; benutzt: boolean }[]
    >();
    if (!segen?.fertig) return karte;
    for (const [id, liste] of Object.entries(segen.gewaehlt)) {
      karte.set(
        Number(id),
        liste
          .map((sid) => segenMitId(sid))
          .filter((x) => !!x)
          .map((x) => ({
            id: x.id,
            name: x.name,
            pakt: x.pakt,
            benutzt: segen.benutzt.includes(`${id}:${x.id}`),
          })),
      );
    }
    return karte;
  });

  protected readonly gezeigterSegen = computed(() => {
    const d = this.dialog();
    const s = this.store.stand();
    if (d?.art !== 'segen' || !s?.segen) return null;
    const segen = segenMitId(d.segenId);
    if (!segen) return null;
    return {
      segen,
      spielerId: d.spielerId,
      gedreht: d.gedreht,
      von: s.spieler.find((p) => p.id === d.spielerId)?.name ?? '',
      benutzt: s.segen.benutzt.includes(`${d.spielerId}:${d.segenId}`),
    };
  });

  /** Weltenwandel: aktuelle Welt, Runde und wann die nächste kommt. */
  protected readonly weltInfo = computed(() => {
    const w = this.store.stand()?.welt;
    const welt = w && weltMitId(w.aktuell);
    if (!w || !welt) return null;
    const bis = rundenBisWechsel(w);
    return {
      welt,
      runde: w.runde,
      hinweis: bis <= 1 ? 'Neue Welt nach dieser Runde' : `Neue Welt in ${bis} Runden`,
      frueher: w.verlauf.slice(0, -1).map((v) => weltMitId(v.id)?.name ?? v.id),
    };
  });

  constructor() {
    this.wach.an();
  }

  protected readonly commanderZiel = computed(() => {
    const d = this.dialog();
    return d?.art === 'commander' ? d : null;
  });

  protected hoechsterCommander(schaden: Record<number, number> | undefined): number {
    return Math.max(0, ...Object.values(schaden ?? {}));
  }

  /** Mit Varianten fragt die App erst nach einer Bewertung, das normale Spiel endet sofort. */
  protected beendenAngefragt(): void {
    const s = this.store.stand();
    if (s && bewertbares(s).length) this.dialog.set({ art: 'bewertung' });
    else this.partieBeenden();
  }

  protected partieBeenden(): void {
    this.dialog.set(null);
    this.store.beenden();
    void this.router.navigateByUrl('/', { replaceUrl: true });
  }

  protected zerstoeren(nr: number): void {
    this.store.zerstoeren(nr);
    this.dialog.set(null);
  }

  ngOnDestroy(): void {
    this.wach.aus();
  }
}
