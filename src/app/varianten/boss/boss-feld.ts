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
import { phase } from './boss-logik';
import { BossStand } from './boss-stand';
import { bossMitId } from './bosse';

/** So lange bleibt der Hinweis „Phasen-Schild!“ bzw. „Besiegt?“ stehen. */
const HINWEISZEIT = 3000;

/**
 * Die Boss-Karte in der Tischmitte: Lebensbalken mit Phasenmarken, Schadensknöpfe,
 * Diener und der letzte Boss-Zug.
 */
@Component({
  selector: 'app-boss-feld',
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
        <p class="zahl">
          @if (b.leben > 0) {
            <strong>{{ b.leben }}</strong> / {{ b.maxLeben }}
          } @else {
            <strong>Besiegt!</strong>
          }
        </p>
      </div>

      <div class="schaden" role="group" aria-label="Schaden am Boss">
        @for (s of schritte; track s) {
          <button type="button" class="schritt" [class.plus]="s > 0" (click)="aendern(s)">
            {{ s > 0 ? '+' + s : '−' + -s }}
          </button>
        }
      </div>

      @if (hinweis(); as h) {
        <p class="hinweis hinweis--schild" aria-live="assertive">{{ h }}</p>
      } @else if (b.schild) {
        <p class="hinweis hinweis--schild">
          Phasen-Schild aktiv: Weiterer Schaden verfällt in diesem Zug.
        </p>
      }
      @if (b.schutz > 0) {
        <p class="hinweis">Sturmpanzer: Die nächsten {{ b.schutz }} Schaden werden verhindert.</p>
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

      <div class="diener-kopf">
        <h3>
          Diener <span>{{ b.diener.length }}</span>
        </h3>
      </div>
      @if (b.diener.length) {
        <ul class="diener">
          @for (d of b.diener; track d.nr) {
            <li>
              <button
                type="button"
                class="diener-karte"
                [class.scharf]="scharf() === d.nr"
                [attr.aria-label]="
                  d.name +
                  ' ' +
                  d.staerke +
                  '/' +
                  d.widerstand +
                  (scharf() === d.nr ? ', nochmal tippen zum Besiegen' : ', antippen zum Besiegen')
                "
                (click)="dienerTippen(d.nr)"
              >
                <span class="diener-name">{{ scharf() === d.nr ? 'Besiegt?' : d.name }}</span>
                <span class="diener-pt">{{ d.staerke }}/{{ d.widerstand }}</span>
                @if (d.faehigkeit && scharf() !== d.nr) {
                  <span class="diener-text">{{ d.faehigkeit }}</span>
                }
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
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 0.6rem;
    }
    .balken {
      position: relative;
      height: 1rem;
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
    .zahl {
      margin: 0;
      font-variant-numeric: tabular-nums;
      color: var(--text-leise);
    }
    .zahl strong {
      font-family: var(--schrift-anzeige);
      font-size: 1.6rem;
      color: var(--text);
    }
    .schaden {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.35rem;
    }
    .schritt {
      min-height: 2.75rem;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      background: var(--filz);
      font-weight: 700;
      font-size: 1.05rem;
      font-variant-numeric: tabular-nums;
    }
    .schritt.plus {
      color: var(--text-leise);
    }
    .schritt:active {
      transform: scale(0.95);
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
      font-family: var(--schrift-text);
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    h3 span {
      margin-left: 0.3rem;
      padding: 0 0.4rem;
      border-radius: 99px;
      background: var(--negativ);
      color: #fff;
    }
    .diener {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
      gap: 0.35rem;
    }
    .diener-karte {
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: 1fr auto;
      align-content: start;
      gap: 0.1rem 0.4rem;
      text-align: start;
      padding: 0.4rem 0.55rem;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      background: var(--filz);
    }
    .diener-karte.scharf {
      background: var(--negativ);
      border-color: transparent;
      color: #fff;
    }
    .diener-name {
      font-weight: 700;
      font-size: 0.9rem;
    }
    .diener-pt {
      font-family: var(--schrift-anzeige);
      font-weight: 800;
    }
    .diener-text {
      grid-column: 1 / -1;
      font-size: 0.72rem;
      color: var(--text-leise);
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
  private readonly store = inject(SpielStore);

  readonly stand = input.required<BossStand>();
  readonly protokoll = output<void>();

  protected readonly schritte = [-10, -5, -3, -1, 1];
  protected readonly def = computed(() => bossMitId(this.stand().bossId));
  protected readonly phase = computed(() => phase(this.stand().leben, this.stand().maxLeben));
  protected readonly prozent = computed(() => (this.stand().leben / this.stand().maxLeben) * 100);
  protected readonly letzterZug = computed(() => {
    const z = this.stand().protokoll.at(-1);
    return z ? { runde: z.runde, aktionen: z.aktionen.map((a) => a.name).join(' + ') } : null;
  });

  protected readonly passivOffen = signal(false);
  protected readonly hinweis = signal<string | null>(null);
  protected readonly scharf = signal<number | null>(null);
  private hinweisZeit?: ReturnType<typeof setTimeout>;
  private scharfZeit?: ReturnType<typeof setTimeout>;

  protected aendern(um: number): void {
    if (um > 0) {
      this.store.bossKorrigieren(um);
      return;
    }
    const verfallen = this.store.bossTreffen(-um);
    if (verfallen > 0) {
      this.hinweis.set(`Phasen-Schild! ${verfallen} Schaden verfallen.`);
      clearTimeout(this.hinweisZeit);
      this.hinweisZeit = setTimeout(() => this.hinweis.set(null), HINWEISZEIT);
    }
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
    clearTimeout(this.scharfZeit);
  }
}
