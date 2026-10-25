import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { Effekt } from '../../core/spiel/modell';
import { SpielStore } from '../../core/spiel/spiel-store';
import { TischAnsicht } from '../../core/tisch-ansicht';
import { WachHalten } from '../../core/wach-halten';
import { BestaetigenKnopf } from '../../shared/ui/bestaetigen-knopf';
import { Ueberlagerung } from '../../shared/ui/ueberlagerung';
import { BossFeld } from '../../varianten/boss/boss-feld';
import { BossProtokollListe } from '../../varianten/boss/boss-protokoll';
import { BossZugDialog } from '../../varianten/boss/boss-zug-dialog';
import { bossMitId } from '../../varianten/boss/bosse';
import { EffektKarte } from '../../varianten/mana-wuerfel/effekt-karte';
import { EffektListe } from '../../varianten/mana-wuerfel/effekt-liste';
import { WirkenDialog } from '../../varianten/mana-wuerfel/wirken-dialog';
import { kombinieren } from '../../varianten/varianten';
import { SpielerFeld } from './spieler-feld';

type Dialog =
  | { art: 'wirken'; spielerId: number; gedreht: boolean }
  | { art: 'effekt'; nr: number; gedreht: boolean }
  | { art: 'liste' }
  | { art: 'bosszug' }
  | { art: 'bossprotokoll' };

@Component({
  selector: 'app-spiel',
  imports: [
    RouterLink,
    SpielerFeld,
    WirkenDialog,
    EffektListe,
    EffektKarte,
    Ueberlagerung,
    BestaetigenKnopf,
    BossFeld,
    BossZugDialog,
    BossProtokollListe,
  ],
  template: `
    @if (store.stand(); as s) {
      <div
        class="tisch"
        [class.drehen]="ansicht.drehen()"
        [attr.data-spieler]="s.spieler.length"
        [attr.data-boss]="s.boss ? '' : null"
      >
        @for (p of s.spieler; track p.id; let i = $index) {
          <app-spieler-feld
            [style.grid-area]="'p' + (i + 1)"
            [spieler]="p"
            [gedreht]="ansicht.istGedreht(i, s.spieler.length)"
            [effektWuerfel]="effektWuerfel()"
            [bleibende]="bleibendeJeSpieler().get(p.id) ?? []"
            (leben)="store.aendereLeben(p.id, $event)"
            (wirken)="
              dialog.set({
                art: 'wirken',
                spielerId: p.id,
                gedreht: ansicht.istGedreht(i, s.spieler.length),
              })
            "
            (zeigen)="
              dialog.set({
                art: 'effekt',
                nr: $event,
                gedreht: ansicht.istGedreht(i, s.spieler.length),
              })
            "
          />
        }

        @if (s.boss; as b) {
          <app-boss-feld [stand]="b" (protokoll)="dialog.set({ art: 'bossprotokoll' })" />
        }

        <nav class="mitte" aria-label="Spielsteuerung">
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
          }
          <a class="steuer" routerLink="/"
            ><span aria-hidden="true">☰</span> <span class="kurz">Menü</span></a
          >
          <button
            type="button"
            class="steuer"
            [disabled]="!store.kannRueckgaengig()"
            (click)="store.rueckgaengig()"
          >
            <span aria-hidden="true">↶</span> Rückgängig
          </button>
          @if (effektWuerfel()) {
            <button type="button" class="steuer" (click)="dialog.set({ art: 'liste' })">
              <span aria-hidden="true">✦</span> Effekte
              <span class="anzahl">{{ s.effekte.length }}</span>
            </button>
          }
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
    .tisch:not(.drehen) > app-spieler-feld {
      grid-area: auto !important;
    }
    .tisch:not(.drehen) .mitte {
      grid-column: 1 / -1;
      order: -2;
    }
    /* Im Bosskampf teilen sich die zwei Spieler die volle Breite unter dem Boss */
    .tisch[data-boss]:not(.drehen) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .tisch:not(.drehen) app-boss-feld {
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
    .drehen[data-spieler='2'][data-boss] {
      grid-template: 'p2' 1fr 'boss' minmax(0, 1.6fr) 'mitte' auto 'p1' 1fr / 1fr;
    }
    .drehen app-boss-feld {
      grid-area: boss;
    }
    .drehen .mitte {
      grid-area: mitte;
    }
    .zugleiste {
      flex-basis: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.25rem 0.3rem 0.25rem 0.8rem;
      border-radius: 99px;
      background: var(--filz-tief);
    }
    .zug-text {
      font-size: 0.9rem;
    }
    .zug-knopf {
      min-height: 2.5rem;
      padding: 0.3rem 0.9rem;
      border-radius: 99px;
      white-space: nowrap;
    }

    .mitte {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .steuer {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      min-height: 2.75rem;
      padding: 0.3rem 0.8rem;
      border-radius: 99px;
      border: 1px solid var(--feld-rand);
      background: var(--filz-tief);
      color: var(--text);
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
    }
    .steuer:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    /* Schmale Handys: Menü nur als Symbol, damit die Leiste einzeilig bleibt */
    @media (max-width: 479px) {
      .steuer {
        padding-inline: 0.65rem;
      }
      .kurz {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
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

  private readonly kombination = computed(() => kombinieren(this.store.stand()?.varianten ?? []));
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

  constructor() {
    this.wach.an();
  }

  protected zerstoeren(nr: number): void {
    this.store.zerstoeren(nr);
    this.dialog.set(null);
  }

  ngOnDestroy(): void {
    this.wach.aus();
  }
}
