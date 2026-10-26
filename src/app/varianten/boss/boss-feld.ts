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
import { phase, TEMPERAMENTE } from './boss-logik';
import { BossStand } from './boss-stand';
import { bossMitId } from './bosse';

/** So lange bleiben „Phasen-Schild!“ und „Besiegt?“ stehen, so lange sammelt die Blase Tipps. */
const HINWEISZEIT = 3000;
const SAMMELZEIT = 1500;

/**
 * Die Boss-Karte in der Tischmitte: Leben mit −/+ und Phasenmarken, seine Artefakte und
 * Verzauberungen, Diener mit Tapp-Status und der letzte Boss-Zug. Fürs Handy gebaut: alles
 * liegt untereinander, Zahlen bleiben in einer Zeile, Knöpfe sind groß genug für Daumen.
 */
@Component({
  selector: 'app-boss-feld',
  imports: [HalteKnopf],
  template: `
    @let b = stand();
    <section class="boss" [attr.data-phase]="phase()" aria-label="Boss">
      <div class="spalte">
        <header class="kopf">
          <h2>{{ def().name }}</h2>
          <span class="marken">
            <span class="marke">Lvl {{ def().level }}</span>
            <span class="marke marke--phase">Phase {{ phase() }}</span>
          </span>
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
          <div class="passiv">
            <p><strong>Passiv:</strong> {{ def().passiv }}</p>
            @if (def().rundenEffekt; as r) {
              <p><strong>Jede Runde:</strong> {{ r.text }}</p>
            }
          </div>
        }
        <p class="laune">
          Heute <strong>{{ laune().name }}</strong> – {{ laune().text }}
        </p>

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
                <strong>{{ b.leben }}</strong
                >&nbsp;/&nbsp;{{ b.maxLeben }}
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
            <button type="button" class="pille pille--messing" (click)="store.schildAufheben()">
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

        @if (relikte().length) {
          <h3>
            Artefakte &amp; Verzauberungen <span class="anzahl">{{ relikte().length }}</span>
          </h3>
          <ul class="relikte">
            @for (r of relikte(); track r.id) {
              <li class="relikt" [attr.data-typ]="r.typ">
                <p class="relikt-ueber">
                  <span>{{ r.typ === 'artefakt' ? '◆ Artefakt' : '✦ Verzauberung' }}</span>
                  @if (r.countdown !== undefined) {
                    <span class="uhr">
                      ⏳ noch {{ r.countdown }} {{ r.countdown === 1 ? 'Boss-Zug' : 'Boss-Züge' }}
                    </span>
                  }
                </p>
                <div class="relikt-kopf">
                  <strong class="relikt-name">{{ r.name }}</strong>
                  <button
                    type="button"
                    class="pille pille--gefahr"
                    [class.scharf]="scharfesRelikt() === r.id"
                    (click)="reliktTippen(r.id)"
                  >
                    {{ scharfesRelikt() === r.id ? 'Wirklich?' : 'Zerstören' }}
                  </button>
                </div>
                <p class="relikt-text">{{ r.text }}</p>
                <div class="verteidigung">
                  <span class="verteidigung-titel">Verteidigung</span>
                  <div class="stepper">
                    <button
                      type="button"
                      appHalteKnopf
                      (halte)="reliktTreffen(r.id, 1)"
                      [attr.aria-label]="'Ein Schaden an ' + r.name"
                    >
                      −
                    </button>
                    <span class="wert" aria-live="polite">
                      <strong>{{ r.rest }}</strong
                      >&nbsp;/&nbsp;{{ r.verteidigung }}
                    </span>
                    <button
                      type="button"
                      appHalteKnopf
                      (halte)="reliktTreffen(r.id, -1)"
                      [attr.aria-label]="'Einen Schaden an ' + r.name + ' zurücknehmen'"
                    >
                      +
                    </button>
                  </div>
                </div>
              </li>
            }
          </ul>
        }
      </div>

      <div class="spalte">
        <h3>
          Diener <span class="anzahl">{{ b.diener.length }}</span>
          @if (getappt()) {
            <span class="getappt-zahl">{{ getappt() }} getappt</span>
          }
        </h3>
        @if (b.diener.length) {
          <ul class="diener">
            @for (d of b.diener; track d.nr) {
              <li
                class="diener-karte"
                [class.getappt]="d.getappt"
                [class.scharf]="scharf() === d.nr"
              >
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
                    (scharf() === d.nr
                      ? ', nochmal tippen zum Besiegen'
                      : ', antippen zum Besiegen')
                  "
                  (click)="dienerTippen(d.nr)"
                >
                  <span class="diener-name">{{ scharf() === d.nr ? 'Besiegt?' : d.name }}</span>
                  <span class="diener-zeile">
                    <span class="diener-pt">{{ d.staerke }}/{{ d.widerstand }}</span>
                    @if (d.getappt && scharf() !== d.nr) {
                      <span class="status">getappt</span>
                    }
                  </span>
                  @if (d.faehigkeit && scharf() !== d.nr) {
                    <span class="diener-text">{{ d.faehigkeit }}</span>
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

        @if (letzterZug(); as z) {
          <button type="button" class="letzter" (click)="protokoll.emit()">
            <span class="letzter-titel">Letzter Boss-Zug · Runde {{ z.runde }} ›</span>
            <span class="letzter-text">{{ z.aktionen }}</span>
          </button>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-height: 0;
      container: boss / inline-size;
    }
    .boss {
      height: 100%;
      overflow-y: auto;
      overscroll-behavior: contain;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      align-content: start;
      gap: 0.55rem 1.4rem;
      padding: 0.7rem 0.75rem 0.9rem;
      background: var(--feld);
      border-radius: var(--radius);
      border: 2px solid var(--negativ);
      box-shadow: var(--schatten);
    }
    .spalte {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      /* Sonst staucht der Browser Zeilen, sobald der Inhalt höher ist als die Karte */
      grid-auto-rows: max-content;
      align-content: start;
      gap: 0.55rem;
    }
    /* Breite Bildschirme: links Leben und Karten, rechts die Diener */
    @container boss (min-width: 46rem) {
      .boss {
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      }
    }
    p {
      margin: 0;
    }
    .kopf {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    h2 {
      flex: 1;
      min-width: 0;
      font-size: clamp(1.1rem, 5vw, 1.4rem);
      font-weight: 800;
      line-height: 1.15;
    }
    .marken {
      display: flex;
      flex-shrink: 0;
      gap: 0.25rem;
    }
    .marke {
      white-space: nowrap;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 0.2rem 0.5rem;
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
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
      margin: -0.3rem -0.4rem -0.3rem 0;
      border: 0;
      background: none;
      color: var(--text-leise);
      font-size: 1.15rem;
    }
    .passiv {
      display: grid;
      gap: 0.3rem;
      padding: 0.5rem 0.65rem;
      border-radius: var(--radius-klein);
      background: var(--filz-tief);
      font-size: 0.88rem;
    }
    .laune {
      margin-top: -0.35rem;
      font-size: 0.8rem;
      color: var(--text-leise);
    }
    .leben {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
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
    .pm:active,
    .stepper button:active {
      transform: scale(0.92);
    }
    .mitte {
      display: grid;
      gap: 0.3rem;
    }
    .zahl {
      position: relative;
      text-align: center;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      color: var(--text-leise);
    }
    .zahl strong {
      font-family: var(--schrift-anzeige);
      font-size: 2rem;
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
      font-size: 0.88rem;
      padding: 0.45rem 0.65rem;
      border-radius: var(--radius-klein);
      background: var(--filz-tief);
    }
    .hinweis--schild {
      color: var(--messing);
      font-weight: 600;
    }
    .hinweis--warnung {
      color: var(--negativ);
      font-weight: 700;
    }
    .schild {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .pille {
      flex-shrink: 0;
      min-height: 2.5rem;
      padding: 0.2rem 0.85rem;
      border-radius: 99px;
      border: 1.5px solid currentColor;
      background: transparent;
      font-weight: 700;
      font-size: 0.85rem;
      white-space: nowrap;
    }
    .pille--messing {
      color: var(--messing);
    }
    .pille--gefahr {
      color: var(--negativ);
    }
    .pille--gefahr.scharf {
      background: var(--negativ);
      border-color: var(--negativ);
      color: #fff;
    }
    h3 {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.2rem;
      font-family: var(--schrift-text);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    .anzahl {
      padding: 0 0.45rem;
      border-radius: 99px;
      background: var(--negativ);
      color: #fff;
    }
    .getappt-zahl {
      margin-left: auto;
      font-weight: 600;
      letter-spacing: 0;
      text-transform: none;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .relikte {
      display: grid;
      gap: 0.45rem;
    }
    .relikt {
      display: grid;
      gap: 0.35rem;
      padding: 0.6rem 0.7rem 0.65rem;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      border-left: 4px solid var(--messing);
      background: var(--filz);
    }
    .relikt[data-typ='verzauberung'] {
      border-left-color: var(--chaos);
    }
    .relikt-ueber {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.2rem 0.6rem;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    .uhr {
      color: var(--negativ);
      letter-spacing: 0;
      text-transform: none;
      font-size: 0.82rem;
    }
    .relikt-kopf {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .relikt-name {
      min-width: 0;
      font-size: 1.05rem;
      line-height: 1.2;
    }
    .relikt-text {
      font-size: 0.9rem;
      line-height: 1.35;
    }
    .verteidigung {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding-top: 0.4rem;
      border-top: 1px solid var(--feld-rand);
    }
    .verteidigung-titel {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    .stepper {
      display: flex;
      align-items: center;
      border-radius: 99px;
      background: var(--filz-tief);
    }
    .stepper button {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 50%;
      border: 0;
      background: none;
      font-size: 1.4rem;
      font-weight: 700;
      line-height: 1;
    }
    .wert {
      min-width: 4.5rem;
      text-align: center;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      color: var(--text-leise);
    }
    .wert strong {
      font-family: var(--schrift-anzeige);
      font-size: 1.35rem;
      color: var(--text);
    }
    .diener {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 9rem), 1fr));
      gap: 0.4rem;
    }
    .diener-karte {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      background: var(--filz);
      overflow: hidden;
      transition: opacity 150ms;
    }
    /* Getappt: blasser und gestrichelt, wie eine quer liegende Karte */
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
      align-content: start;
      gap: 0.15rem;
      min-height: 3rem;
      text-align: start;
      padding: 0.45rem 0.55rem;
      border: 0;
      background: none;
      color: inherit;
    }
    .diener-name {
      font-weight: 700;
      font-size: 0.92rem;
      line-height: 1.2;
      overflow-wrap: anywhere;
      hyphens: auto;
    }
    .diener-zeile {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    .diener-pt {
      font-family: var(--schrift-anzeige);
      font-weight: 800;
      font-size: 1.05rem;
      white-space: nowrap;
    }
    .status {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--messing);
    }
    .diener-text {
      font-size: 0.78rem;
      line-height: 1.3;
      color: var(--text-leise);
    }
    .scharf .diener-text {
      color: inherit;
    }
    .tappen {
      width: 2.75rem;
      border: 0;
      border-left: 1px solid var(--feld-rand);
      background: none;
      color: var(--text-leise);
      font-size: 1.2rem;
    }
    .getappt .tappen {
      color: var(--messing);
    }
    .leer {
      font-size: 0.88rem;
      color: var(--text-leise);
    }
    .letzter {
      display: grid;
      text-align: start;
      gap: 0.15rem;
      min-height: 2.75rem;
      padding: 0.5rem 0.7rem;
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BossFeld implements OnDestroy {
  protected readonly store = inject(SpielStore);

  readonly stand = input.required<BossStand>();
  readonly protokoll = output<void>();

  protected readonly def = computed(() => bossMitId(this.stand().bossId));
  protected readonly laune = computed(
    () => TEMPERAMENTE[this.stand().temperament ?? 'unberechenbar'],
  );
  protected readonly phase = computed(() => phase(this.stand().leben, this.stand().maxLeben));
  protected readonly prozent = computed(() => (this.stand().leben / this.stand().maxLeben) * 100);
  protected readonly getappt = computed(() => this.stand().diener.filter((d) => d.getappt).length);
  protected readonly letzterZug = computed(() => {
    const z = this.stand().protokoll.at(-1);
    return z ? { runde: z.runde, aktionen: z.aktionen.map((a) => a.name).join(' + ') } : null;
  });

  /** Die Karten des Bosses auf dem Tisch, mit ihrer Beschreibung. */
  protected readonly relikte = computed(() =>
    this.stand().relikte.flatMap((l) => {
      const r = this.def().relikte.find((x) => x.id === l.id);
      return r ? [{ ...r, rest: r.verteidigung - l.schaden, countdown: l.countdown }] : [];
    }),
  );

  protected readonly passivOffen = signal(false);
  protected readonly scharfesRelikt = signal<string | null>(null);
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

  /** Schaden an der Karte: Minus senkt die Verteidigung, Plus nimmt einen Schaden zurück. */
  protected reliktTreffen(id: string, schaden: number): void {
    this.store.reliktTreffen(id, schaden);
    this.zerstoertMelden(id);
  }

  /** Wie bei Dienern: erst antippen, dann bestätigen. */
  protected reliktTippen(id: string): void {
    clearTimeout(this.scharfZeit);
    if (this.scharfesRelikt() === id) {
      this.scharfesRelikt.set(null);
      this.store.reliktZerstoeren(id);
      this.zerstoertMelden(id);
      return;
    }
    this.scharfesRelikt.set(id);
    this.scharfZeit = setTimeout(() => this.scharfesRelikt.set(null), HINWEISZEIT);
  }

  private zerstoertMelden(id: string): void {
    // Direkt aus dem Store: Das Input zieht erst beim nächsten Rendern nach.
    if (this.store.stand()?.boss?.relikte.some((l) => l.id === id)) return;
    const name = this.def().relikte.find((r) => r.id === id)?.name;
    this.hinweis.set(`${name} ist zerstört!`);
    clearTimeout(this.hinweisZeit);
    this.hinweisZeit = setTimeout(() => this.hinweis.set(null), HINWEISZEIT);
  }

  ngOnDestroy(): void {
    clearTimeout(this.hinweisZeit);
    clearTimeout(this.sammelZeit);
    clearTimeout(this.scharfZeit);
  }
}
