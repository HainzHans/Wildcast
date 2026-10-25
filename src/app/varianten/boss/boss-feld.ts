import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';

import { SpielStore } from '../../core/spiel/spiel-store';
import { HalteKnopf } from '../../shared/ui/halte-knopf';
import { phase } from './boss-logik';
import { BossStand } from './boss-stand';
import { bossMitId } from './bosse';

/** So lange bleiben „Phasen-Schild!“ und „Besiegt?“ stehen, so lange sammelt die Blase Tipps. */
const HINWEISZEIT = 3000;
const SAMMELZEIT = 1500;

/**
 * Die Boss-Karte in der Tischmitte: Leben mit −/+ und Phasenmarken, Diener mit Tapp-Status
 * und der letzte Boss-Zug.
 */
@Component({
  selector: 'app-boss-feld',
  imports: [HalteKnopf],
  template: `
    @let b = stand();
    <section class="boss" [attr.data-phase]="phase()" aria-label="Boss">
      <header class="kopf">
        <h2>{{ def().name }}</h2>
        <span class="marke">Lvl {{ def().level }}</span>
        <span class="marke marke--phase">Phase {{ phase() }}</span>
        <button
          type="button"
          class="info"
          [attr.aria-expanded]="passivOffen()"
          (click)="passivOffen.set(!passivOffen())"
        >
          <span aria-hidden="true">ⓘ</span><span class="sr-only">Passive Fähigkeit</span>
        </button>
      </header>
      @if (passivOffen()) {
        <p class="passiv">{{ def().passiv }}</p>
      }

      <div class="leben">
        <button
          type="button"
          class="pm"
          appHalteKnopf
          (halte)="aendern(-1)"
          [attr.aria-label]="'Ein Schaden am ' + def().name"
        >
          −
        </button>
        <div class="mitte">
          <p class="zahl">
            @if (b.leben > 0) {
              <strong>{{ b.leben }}</strong> / {{ b.maxLeben }}
            } @else {
              <strong>Besiegt!</strong>
            }
            @if (aenderung(); as a) {
              <span class="blase" aria-hidden="true">{{ a > 0 ? '+' + a : a }}</span>
            }
          </p>
          <div
            class="balken"
            role="meter"
            [attr.aria-valuenow]="b.leben"
            aria-valuemin="0"
            [attr.aria-valuemax]="b.maxLeben"
            aria-label="Leben des Bosses"
          >
            <div class="fuellung" [style.width.%]="prozent()"></div>
            <span class="grenze" [style.left.%]="60"></span>
            <span class="grenze" [style.left.%]="30"></span>
          </div>
        </div>
        <button
          type="button"
          class="pm"
          appHalteKnopf
          (halte)="aendern(1)"
          [attr.aria-label]="'Ein Leben mehr für den ' + def().name"
        >
          +
        </button>
      </div>

      @if (hinweis(); as h) {
        <p class="hinweis hinweis--schild" aria-live="assertive">{{ h }}</p>
      }
      @if (b.schild) {
        <div class="hinweis hinweis--schild schild">
          <span>Phasen-Schild: Weiterer Schaden verfällt in diesem Zug.</span>
          <button type="button" class="schild-knopf" (click)="store.schildAufheben()">
            Nächster Zug
          </button>
        </div>
      }
      @if (b.schutz > 0) {
        <p class="hinweis">Die nächsten {{ b.schutz }} Schaden am Boss werden verhindert.</p>
      }
      @if (b.ankuendigung) {
        <p class="hinweis hinweis--warnung">⚠ {{ b.ankuendigung }}</p>
      }

      @if (letzterZug(); as z) {
        <button type="button" class="letzter" (click)="protokoll.emit()">
          <span class="letzter-titel">Letzter Boss-Zug · Runde {{ z.runde }}</span>
          <span class="letzter-text">{{ z.aktionen }}</span>
        </button>
      }

      <h3>
        Diener <span class="anzahl">{{ b.diener.length }}</span>
        @if (getappt()) {
          <span class="getappt-zahl">{{ getappt() }} getappt</span>
        }
      </h3>
      @if (b.diener.length) {
        <ul class="diener">
          @for (d of b.diener; track d.nr) {
            <li class="diener-karte" [class.getappt]="d.getappt" [class.scharf]="scharf() === d.nr">
              <button
                type="button"
                class="diener-haupt"
                [attr.aria-label]="
                  d.name +
                  ' ' +
                  d.staerke +
                  '/' +
                  d.widerstand +
                  (d.getappt ? ', getappt' : '') +
                  (scharf() === d.nr ? ', nochmal tippen zum Besiegen' : ', antippen zum Besiegen')
                "
                (click)="dienerTippen(d.nr)"
              >
                <span class="diener-name">{{ scharf() === d.nr ? 'Besiegt?' : d.name }}</span>
                <span class="diener-pt">{{ d.staerke }}/{{ d.widerstand }}</span>
                @if (scharf() !== d.nr) {
                  @if (d.getappt) {
                    <span class="status">getappt</span>
                  }
                  @if (d.faehigkeit) {
                    <span class="diener-text">{{ d.faehigkeit }}</span>
                  }
                }
              </button>
              <button
                type="button"
                class="tappen"
                [attr.aria-label]="d.name + (d.getappt ? ' enttappen' : ' tappen')"
                [attr.aria-pressed]="d.getappt"
                (click)="store.dienerTappen(d.nr)"
              >
                <span aria-hidden="true">↻</span>
              </button>
            </li>
          }
        </ul>
      } @else {
        <p class="leer">Keine Diener im Spiel.</p>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-height: 0;
    }
    .boss {
      height: 100%;
      overflow-y: auto;
      display: grid;
      align-content: start;
      gap: 0.5rem;
      padding: 0.7rem 0.8rem;
      background: var(--feld);
      border-radius: var(--radius);
      border: 2px solid var(--negativ);
      box-shadow: var(--schatten);
    }
    .kopf {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    h2 {
      font-size: 1.35rem;
      font-weight: 800;
      margin-right: auto;
    }
    .marke {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 0.15rem 0.5rem;
      border-radius: 99px;
      border: 1px solid var(--feld-rand);
      color: var(--text-leise);
    }
    .marke--phase {
      background: var(--negativ);
      border-color: transparent;
      color: #fff;
    }
    .info {
      min-width: 2.25rem;
      min-height: 2.25rem;
      border: 0;
      background: none;
      color: var(--text-leise);
      font-size: 1.1rem;
    }
    .passiv {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-leise);
    }
    .leben {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 0.6rem;
    }
    .pm {
      width: 3rem;
      aspect-ratio: 1;
      border-radius: 50%;
      border: 1px solid var(--feld-rand);
      background: var(--filz);
      font-size: 1.7rem;
      font-weight: 700;
      line-height: 1;
    }
    .pm:active {
      transform: scale(0.92);
    }
    .mitte {
      display: grid;
      gap: 0.3rem;
    }
    .zahl {
      position: relative;
      margin: 0;
      text-align: center;
      font-variant-numeric: tabular-nums;
      color: var(--text-leise);
    }
    .zahl strong {
      font-family: var(--schrift-anzeige);
      font-size: 1.9rem;
      line-height: 1;
      color: var(--text);
    }
    .blase {
      position: absolute;
      top: 0;
      right: 0;
      padding: 0.05rem 0.45rem;
      border-radius: 99px;
      background: var(--filz-tief);
      color: var(--text);
      font-weight: 700;
    }
    .balken {
      position: relative;
      height: 0.8rem;
      border-radius: 99px;
      background: var(--filz-tief);
      overflow: hidden;
    }
    .fuellung {
      height: 100%;
      background: var(--negativ);
      border-radius: 99px;
      transition: width 300ms ease;
    }
    .grenze {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--text);
      opacity: 0.55;
    }
    .hinweis {
      margin: 0;
      font-size: 0.85rem;
      padding: 0.4rem 0.6rem;
      border-radius: var(--radius-klein);
      background: var(--filz-tief);
    }
    .hinweis--schild {
      color: var(--messing);
      font-weight: 600;
    }
    .schild {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .schild-knopf {
      flex-shrink: 0;
      min-height: 2.25rem;
      padding: 0.2rem 0.7rem;
      border-radius: 99px;
      border: 1px solid var(--messing);
      background: transparent;
      color: var(--messing);
      font-weight: 700;
      font-size: 0.8rem;
    }
    .hinweis--warnung {
      color: var(--negativ);
      font-weight: 700;
    }
    .letzter {
      display: grid;
      text-align: start;
      gap: 0.1rem;
      padding: 0.45rem 0.7rem;
      border-radius: var(--radius-klein);
      border: 1px dashed var(--feld-rand);
      background: transparent;
    }
    .letzter-titel {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    .letzter-text {
      font-weight: 600;
    }
    h3 {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-family: var(--schrift-text);
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    .anzahl {
      padding: 0 0.4rem;
      border-radius: 99px;
      background: var(--negativ);
      color: #fff;
    }
    .getappt-zahl {
      font-weight: 600;
      letter-spacing: 0;
      text-transform: none;
    }
    .diener {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
      gap: 0.35rem;
    }
    .diener-karte {
      display: grid;
      grid-template-columns: 1fr auto;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      background: var(--filz);
      overflow: hidden;
      transition: opacity 150ms;
    }
    /* Getappt: gedreht angedeutet und blasser, wie eine quer liegende Karte */
    .diener-karte.getappt {
      opacity: 0.6;
      border-style: dashed;
    }
    .diener-karte.scharf {
      background: var(--negativ);
      border-color: transparent;
      color: #fff;
      opacity: 1;
    }
    .diener-haupt {
      display: grid;
      grid-template-columns: 1fr auto;
      align-content: start;
      gap: 0.1rem 0.4rem;
      text-align: start;
      padding: 0.4rem 0.55rem;
      border: 0;
      background: none;
      color: inherit;
    }
    .diener-name {
      font-weight: 700;
      font-size: 0.9rem;
    }
    .diener-pt {
      font-family: var(--schrift-anzeige);
      font-weight: 800;
    }
    .status {
      grid-column: 1 / -1;
      justify-self: start;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--messing);
    }
    .diener-text {
      grid-column: 1 / -1;
      font-size: 0.72rem;
      color: var(--text-leise);
    }
    .tappen {
      width: 2.25rem;
      border: 0;
      border-left: 1px solid var(--feld-rand);
      background: none;
      color: var(--text-leise);
      font-size: 1.1rem;
    }
    .getappt .tappen {
      color: var(--messing);
    }
    .leer {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-leise);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BossFeld implements OnDestroy {
  protected readonly store = inject(SpielStore);

  readonly stand = input.required<BossStand>();
  readonly protokoll = output<void>();

  protected readonly def = computed(() => bossMitId(this.stand().bossId));
  protected readonly phase = computed(() => phase(this.stand().leben, this.stand().maxLeben));
  protected readonly prozent = computed(() => (this.stand().leben / this.stand().maxLeben) * 100);
  protected readonly getappt = computed(() => this.stand().diener.filter((d) => d.getappt).length);
  protected readonly letzterZug = computed(() => {
    const z = this.stand().protokoll.at(-1);
    return z ? { runde: z.runde, aktionen: z.aktionen.map((a) => a.name).join(' + ') } : null;
  });

  protected readonly passivOffen = signal(false);
  protected readonly hinweis = signal<string | null>(null);
  protected readonly aenderung = signal(0);
  protected readonly scharf = signal<number | null>(null);
  private hinweisZeit?: ReturnType<typeof setTimeout>;
  private sammelZeit?: ReturnType<typeof setTimeout>;
  private scharfZeit?: ReturnType<typeof setTimeout>;

  /** Minus geht durch den Phasen-Schild, Plus korrigiert direkt. */
  protected aendern(um: number): void {
    let wirksam = um;
    if (um < 0) {
      const verfallen = this.store.bossTreffen(-um);
      wirksam = um + verfallen;
      if (verfallen > 0) {
        this.hinweis.set('Phasen-Schild! Der Schaden verfällt.');
        clearTimeout(this.hinweisZeit);
        this.hinweisZeit = setTimeout(() => this.hinweis.set(null), HINWEISZEIT);
      }
    } else {
      this.store.bossKorrigieren(um);
    }
    if (!wirksam) return;
    this.aenderung.update((a) => a + wirksam);
    clearTimeout(this.sammelZeit);
    this.sammelZeit = setTimeout(() => this.aenderung.set(0), SAMMELZEIT);
  }

  /** Erst antippen markiert, zweites Tippen besiegt – Schutz vor Versehen am geteilten Tisch. */
  protected dienerTippen(nr: number): void {
    clearTimeout(this.scharfZeit);
    if (this.scharf() === nr) {
      this.scharf.set(null);
      this.store.dienerBesiegen(nr);
      return;
    }
    this.scharf.set(nr);
    this.scharfZeit = setTimeout(() => this.scharf.set(null), HINWEISZEIT);
  }

  ngOnDestroy(): void {
    clearTimeout(this.hinweisZeit);
    clearTimeout(this.sammelZeit);
    clearTimeout(this.scharfZeit);
  }
}
